# Receipts & Customer Credit Ledger — Implementation Notes

Implements the design in [4_customer_credit_and_manual_invoice_total.md](4_customer_credit_and_manual_invoice_total.md): a customer credit ledger built on the existing `payments` table, a manual invoice total, credit application at invoice time and after the fact, and a frontend "Receipts" page for advance payments.

## 1. Data model

`payments` is the single ledger table for every money movement. No new tables were added — only new columns on `Payment`:

| Column | Type | Purpose |
|---|---|---|
| `entry_type` | string, required | `ADVANCE_RECEIPT`, `CREDIT_APPLIED`, `INVOICE_PAYMENT`, `CREDIT_REFUND` (unused so far), `CREDIT_ADJUSTMENT` |
| `direction` | string, nullable | `CREDIT_IN` or `CREDIT_OUT`. Null for plain `INVOICE_PAYMENT` rows — they are cash against an invoice, not a credit-ledger movement |
| `receipt_number` | string, nullable, unique | Optional operator-entered receipt number |
| `external_ref` | string, nullable | Bank/UPI/cheque reference |
| `source_receipt_id` | FK → `payments.id`, nullable | Self-reference: for `CREDIT_APPLIED`/`CREDIT_ADJUSTMENT` rows, points at the `ADVANCE_RECEIPT` row that funded/was reversed |
| `invoice_id` | FK → `invoices.id`, **now nullable** | Was `NOT NULL`; advance receipts have no invoice |

`entryType`/`direction` are plain strings (not Java enums) to match the existing codebase convention (`status`, `paymentMode` are also plain strings).

**Available credit** for a customer = `sum(amount where direction = CREDIT_IN) − sum(amount where direction = CREDIT_OUT)`. Only `ADVANCE_RECEIPT` (in) and `CREDIT_APPLIED`/`CREDIT_ADJUSTMENT` (out) carry a `direction`, so `INVOICE_PAYMENT` never affects the credit pool.

Since `spring.jpa.hibernate.ddl-auto=update`, **new columns are added automatically**. The one exception was making `invoice_id` nullable — Hibernate's schema update does not relax existing `NOT NULL` constraints, so that required a one-time manual migration:

```sql
ALTER TABLE payments MODIFY COLUMN invoice_id BIGINT NULL;
```

## 2. Backend — credit ledger writes

All ledger-row creation is centralized in `PaymentService`:

- `createAdvanceReceipt(AdvanceReceiptRequest)` → inserts one `ADVANCE_RECEIPT` / `CREDIT_IN` row. Used by the Receipts page.
- `reverseReceipt(id, ReversePaymentRequest)` → inserts a `CREDIT_ADJUSTMENT` / `CREDIT_OUT` row for the **full amount** of the original receipt, linked via `sourceReceipt`. Ledger rows are never edited or deleted — mistakes are corrected with a reversal row (immutable audit trail).
- `applyCreditToInvoice(customer, invoice, amount, createdBy)` → the core consumption routine, described below.
- `getAvailableCredit(customerId)` → the pooled-balance calculation above.

### FIFO credit consumption

When credit needs to be applied to an invoice (either at invoice creation or via "Apply credit" on an existing invoice), `PaymentService.applyCreditToInvoice` doesn't just write one lump `CREDIT_APPLIED` row. It walks the customer's `ADVANCE_RECEIPT` rows **oldest-first**, and for each receipt:

1. Computes how much of that receipt is still unconsumed: `receipt.amount − sum(amount of payments where source_receipt_id = receipt.id)`.
2. Consumes `min(receiptRemaining, amountStillNeeded)` from it, writing a `CREDIT_APPLIED` row with `invoice_id` set and `source_receipt_id` pointing at that receipt.
3. Moves to the next receipt if more is still needed.

This means a single invoice can end up with **multiple** `CREDIT_APPLIED` rows if it draws from more than one receipt — and each row traces back to exactly which receipt funded it. If for some reason the amount can't be fully attributed (e.g. legacy data), the remainder is written as one `CREDIT_APPLIED` row with `source_receipt_id = null` ("pooled credit").

## 3. Backend — invoice flows

### Creating an invoice with credit (`InvoiceService.createInvoice`)

- `InvoiceRequest` gained `applyCredit` (boolean, default `false`), `creditToApply` (optional cap), `cashPaidNow` (optional).
- When `applyCredit` is true:
  1. The customer row is locked with `CustomerRepository.findByIdForUpdate` (`@Lock(PESSIMISTIC_WRITE)`) to prevent two concurrent invoices over-spending the same credit pool.
  2. `creditApplied = min(availableCredit, creditToApply ?? availableCredit, totalAmount)`, clamped to ≥ 0.
  3. `amountPaid = creditApplied + cashPaidNow`.
  4. After the invoice is saved, `paymentService.applyCreditToInvoice(...)` writes the FIFO `CREDIT_APPLIED` row(s) in the **same transaction**.
- When `applyCredit` is false, behavior is unchanged from before (operator enters `amountPaid` manually).
- The response (`InvoiceResponse`) carries back `creditApplied`, `cashPaid`, and `customerAvailableCreditAfterTxn` so the frontend can show the result without a second round trip.

### Applying credit to an already-existing invoice with a pending balance

New: `InvoiceService.applyCreditToExistingInvoice(invoiceId, creditToApply)`, exposed as `POST /invoices/{id}/apply-credit`.

- Rejects if the invoice has no pending balance.
- Locks the customer row, computes `amount = min(availableCredit, creditToApply ?? availableCredit, invoice.balance)`, rejects if `amount <= 0`.
- Calls the same `PaymentService.applyCreditToInvoice` FIFO writer, then updates the invoice's `amountPaid`/`balance`/`status`.

This answers "what do we do about a pending balance on an invoice?" — if the customer has available credit (from advance receipts), it can now be applied retroactively from the customer's detail view instead of only at invoice-creation time.

## 4. Backend — new/changed endpoints

| Endpoint | Purpose |
|---|---|
| `POST /payments/advance` | Create an advance receipt. Body: `AdvanceReceiptRequest` (customerId, amount, paymentDate, paymentMode, receiptNumber?, externalRef?, notes?). Returns `AdvanceReceiptResponse` (payment + resulting available credit). |
| `GET /payments/receipts?customerId&dateFrom&dateTo` | List `ADVANCE_RECEIPT` + `CREDIT_ADJUSTMENT` rows (the Receipts page feed). |
| `POST /payments/{id}/reverse` | Reverse a mistaken advance receipt. Body: `{ reason }`. |
| `GET /customers/{id}/summary` | Profile + `pendingBalance` + `availableCredit` + last 10 payments (**all** entry types) + last 10 invoices. Powers the customer detail modal. |
| `POST /invoices/{id}/apply-credit` | Apply available credit to an existing invoice's pending balance. Body: `{ creditToApply? }` (omit for "apply as much as possible"). |

`GET /customers` and `GET /customers/{id}` now also return `availableCredit` alongside the existing `pendingBalance`.

## 5. Frontend

### Receipts page (new)
- `routes/_app/receipt/index.tsx` — list of advance receipts (+ reversals), with today/total stat cards. Mirrors the Expenses page pattern.
- `routes/_app/receipt/new.tsx` + `components/receipt-form.tsx` + `components/receipt-summary.tsx` — create form: customer combobox (shows available credit inline), amount, date, payment mode, receipt number, external ref, notes.
- Nav entry and quick-link (`F8`) already wired in `app-sidebar.tsx` / `lib/common.ts`.

### Sales (invoice) form
- `sales-form.tsx`: `totalAmount` is a **manual input** (not auto-computed from the single line item — the operator types it in, per a later requirement change).
- Only **one invoice line item** is supported now (material/quantity/rate/truck number) — the old add/edit/delete multi-item table was removed; the single item form feeds directly into the submit payload.
- New "Apply available credit" checkbox (default **off** — operator opts in), with an optional credit cap and a "cash received now" field. When checked, `amountPaid` is computed client-side as a preview (`creditApplied + cashPaidNow`); the server is the source of truth and recomputes/clamps it server-side regardless of what the client sends.
- Customer combobox shows both `pendingBalance` and `availableCredit` per customer.

### Customer list & detail
- `routes/_app/customer/index.tsx` list table: added an `availableCredit` column next to `pendingBalance`.
- Customer detail dialog (opened by clicking a row) now uses `GET /customers/{id}/summary` (previously only `GET /customers/{id}/invoices`) and shows **three tabs**:
  1. **Invoices** — existing invoice table, plus an "Apply credit" button on any row with `balance > 0`, shown only if the customer has available credit. Clicking it calls `POST /invoices/{id}/apply-credit`.
  2. **Receipts** — every `ADVANCE_RECEIPT`/`CREDIT_ADJUSTMENT` row for the customer.
  3. **Credit usage** — every `CREDIT_APPLIED` row, showing the invoice it paid down and the `sourceReceiptNumber` that funded it (or "Pooled credit" if untraceable). This is the direct answer to "which receipt was used by which invoice".

## 6. Known limitations / deliberate simplifications

- No automated tests were added for this feature (explicit decision) — verification is manual.
- No idempotency-key handling on receipt/invoice submission — double-submit risk is mitigated only by disabling the submit button while a mutation is in flight.
- `CREDIT_REFUND` entry type exists in the ledger vocabulary but has no create path yet (e.g. refunding unused advance to the customer in cash) — add if/when that business flow is needed.
- FIFO consumption traces to a specific receipt at write time, but if that receipt is *later* reversed, past `CREDIT_APPLIED` rows still point at it (the reversal doesn't retroactively rewrite history) — the ledger stays an accurate append-only trail of what happened when.
