# Invoicing Process Guide

A practical, end-to-end explanation of how invoicing, payments, credit, and
partial payments work in this system — with worked examples for every
scenario an operator will encounter.

## 1. Core concepts

| Concept | Meaning |
|---|---|
| `Invoice` | One sale to a customer. Has a manually-entered `totalAmount`, plus `amountPaid`, `balance`, and `status`. |
| `Payment` | A single row in an append-only ledger. Every money movement (advance receipt, credit usage, direct invoice payment, reversal) is one `Payment` row. Rows are never edited or deleted, only reversed with a new row. |
| `entryType` | Tags what kind of money movement a `Payment` row represents: `ADVANCE_RECEIPT`, `CREDIT_APPLIED`, `INVOICE_PAYMENT`, `CREDIT_REFUND`, `CREDIT_ADJUSTMENT`. |
| `direction` | For ledger (credit-pool) entries only: `CREDIT_IN` (money added to the customer's advance pool) or `CREDIT_OUT` (money drawn from it). `null` for a plain `INVOICE_PAYMENT` — it never touches the credit pool. |
| Available credit | `sum(amount where direction=CREDIT_IN) - sum(amount where direction=CREDIT_OUT)` for a customer. This is the customer's "wallet" balance from advance payments. |

### Invoice status

Status is recomputed and stored every time `amountPaid`/`balance` changes:

```
if amountPaid == 0            -> "pending"
else if balance == 0          -> "paid"
else                           -> "partial"
```

### The three ways money can reduce an invoice's balance

1. **Cash paid at invoice creation time** — operator types how much the customer paid right now.
2. **Advance credit applied** — either automatically at invoice creation, or later via "Apply credit" on an existing invoice. Draws from the customer's credit pool (money they paid in advance on a previous visit).
3. **Direct payment against an existing invoice** — the customer comes back later and pays down the remaining balance in cash/UPI/bank/cheque. This does **not** touch the credit pool; it's a straight `INVOICE_PAYMENT`.

---

## 2. Scenario A — Invoice paid in full immediately

Customer buys material worth ₹10,000 and pays the full amount on the spot.

**Request:** `POST /invoices`
```json
{
  "customerId": 1,
  "invoiceNumber": "INV-1001",
  "invoiceDate": "2026-09-17",
  "amountPaid": 10000,
  "invoiceItems": [ { "materialTypeId": 5, "quantityBrass": 10, "rate": 1000 } ]
}
```

**Result:** `totalAmount = 10000`, `amountPaid = 10000`, `balance = 0`, `status = "paid"`.

No credit pool involved, one invoice, done.

---

## 3. Scenario B — Partial payment at invoice creation, paid later

This is the case you asked about: **customer pays only half now, and comes back later to clear the rest.**

### Step 1 — Create the invoice with a partial payment

Customer buys material worth ₹10,000 but only pays ₹5,000 today.

**Request:** `POST /invoices`
```json
{
  "customerId": 1,
  "invoiceNumber": "INV-1002",
  "invoiceDate": "2026-09-17",
  "amountPaid": 5000,
  "invoiceItems": [ { "materialTypeId": 5, "quantityBrass": 10, "rate": 1000 } ]
}
```

**Result:** `totalAmount = 10000`, `amountPaid = 5000`, `balance = 5000`, `status = "partial"`.

The invoice is now saved with an outstanding balance. Nothing else needs to
happen at this point — it just sits as `"partial"` until settled.

### Step 2 — Customer returns and pays the remaining ₹5,000

This is what the new **Record payment** feature is for. Instead of editing
the invoice, the operator records a fresh payment against it.

**Request:** `POST /invoices/1002/payments`
```json
{
  "amount": 5000,
  "paymentDate": "2026-10-02",
  "paymentMode": "cash"
}
```

**What happens internally (`InvoiceService.recordPayment`):**
1. The invoice row is locked (`findByIdForUpdate`) so two simultaneous payments can't overshoot the balance.
2. Validates `amount <= invoice.balance` — here `5000 <= 5000` passes.
3. Writes a new `Payment` row: `entryType = INVOICE_PAYMENT`, `direction = null`, `invoiceId = 1002`, `amount = 5000`.
4. Updates the invoice: `amountPaid = 5000 + 5000 = 10000`, `balance = 10000 - 10000 = 0`, `status = "paid"`.

**Result:** Invoice 1002 is now `"paid"`, and there are two audit rows in the
ledger for it — the implicit ₹5,000 recorded at creation, and the explicit
₹5,000 `INVOICE_PAYMENT` row from today.

### Step 3 — What if the customer only pays part of the remainder?

Say they come back and only pay ₹3,000 of the ₹5,000 owed.

**Request:** `POST /invoices/1002/payments`
```json
{ "amount": 3000, "paymentDate": "2026-10-02", "paymentMode": "upi" }
```

**Result:** `amountPaid = 8000`, `balance = 2000`, `status` stays `"partial"`.
They can call this endpoint again whenever they pay more, as many times as
needed, until `balance` reaches `0`.

### Step 4 — What if they try to overpay?

**Request:** `POST /invoices/1002/payments` with `amount = 6000` while
`balance = 2000`.

**Result:** `400 Bad Request` — `"Payment exceeds outstanding balance"`. The
server never lets `amountPaid` exceed `totalAmount`.

### Step 5 — Paying by cheque

Cheque payments require a cheque number:

```json
{ "amount": 2000, "paymentDate": "2026-10-05", "paymentMode": "cheque", "chequeNumber": "CHQ-88123" }
```

Omitting `chequeNumber` with `paymentMode = "cheque"` returns `400 Bad
Request` — `"Cheque number is required for cheque payments"`.

### Where to do this in the UI
- **Sales page** → click an invoice with `balance > 0` → "Record payment" panel inside the invoice detail dialog.
- **Customer page** → open a customer → Invoices tab → "Record payment" button on any row with a pending balance.

---

## 4. Scenario C — Customer pays in advance, before any invoice exists

Customer hands over ₹4,000 today as an advance, with no material bought yet.

**Request:** `POST /payments/advance`
```json
{ "customerId": 1, "amount": 4000, "paymentDate": "2026-09-17", "paymentMode": "cash" }
```

**What happens:** A `Payment` row is created: `entryType = ADVANCE_RECEIPT`,
`direction = CREDIT_IN`, `invoiceId = null`. The customer's available credit
becomes ₹4,000.

This money sits in the customer's "wallet" until it's applied to an invoice.

---

## 5. Scenario D — Auto-applying credit when creating a new invoice

Customer (who has ₹4,000 credit from Scenario C) now buys material worth
₹6,000 and wants to use their credit toward it, plus pay ₹1,000 cash now.

**Request:** `POST /invoices`
```json
{
  "customerId": 1,
  "invoiceNumber": "INV-1003",
  "invoiceDate": "2026-09-20",
  "applyCredit": true,
  "cashPaidNow": 1000,
  "invoiceItems": [ { "materialTypeId": 5, "quantityBrass": 6, "rate": 1000 } ]
}
```

**What happens internally (`InvoiceService.createInvoice`):**
1. Customer row locked, available credit fetched: ₹4,000.
2. `creditApplied = min(availableCredit, totalAmount) = min(4000, 6000) = 4000`.
3. `amountPaid = creditApplied + cashPaidNow = 4000 + 1000 = 5000`.
4. `balance = 6000 - 5000 = 1000` → `status = "partial"`.
5. A `CREDIT_APPLIED` / `CREDIT_OUT` ledger row for ₹4,000 is written, tracing back (`sourceReceipt`) to the original `ADVANCE_RECEIPT` from Scenario C (FIFO — oldest receipts consumed first).

Customer's available credit is now ₹0. The invoice still has ₹1,000
outstanding, which can later be paid off using **Record payment**
(Scenario B) or by adding more advance credit later (Scenario E).

You can optionally cap how much credit to use with `creditToApply`, e.g.
`"creditToApply": 2000` would only draw ₹2,000 of the available ₹4,000.

---

## 6. Scenario E — Applying credit to an invoice that already exists

Customer has an old partially-paid invoice (`balance = 1000`, from Scenario
D) and later pays in another ₹4,000 advance receipt (Scenario C). Instead of
recording it as a direct cash payment, the operator applies their new credit
retroactively.

**Request:** `POST /invoices/1003/apply-credit`
```json
{ "creditToApply": 1000 }
```
(Or send an empty body / omit `creditToApply` to auto-apply as much
available credit as the balance needs.)

**Result:** ₹1,000 of credit is consumed FIFO from the customer's advance
receipts, `amountPaid` increases by ₹1,000, `balance = 0`, `status = "paid"`.
This uses the credit pool — unlike Scenario B's direct payment, it does not
create an `INVOICE_PAYMENT` row; it creates a `CREDIT_APPLIED` row instead.

---

## 7. Scenario F — Correcting a mistaken advance receipt

An advance receipt was entered wrong (e.g. wrong amount) and needs to be
undone. Ledger rows are never deleted — a reversal row is added instead.

**Request:** `POST /payments/5/reverse`
```json
{ "reason": "Entered wrong amount, correcting" }
```

**Result:** A new `CREDIT_ADJUSTMENT` / `CREDIT_OUT` row is created, sized to
cancel out the original receipt, linked via `sourceReceipt`. The customer's
available credit drops back down accordingly. Only `ADVANCE_RECEIPT` rows can
be reversed this way — a direct `INVOICE_PAYMENT` cannot currently be
reversed through this endpoint.

---

## 8. Choosing the right flow — quick reference

| Situation | What to do |
|---|---|
| Customer pays full invoice amount right now | `amountPaid` = full total at `POST /invoices` creation. |
| Customer pays part now, will pay the rest later | `amountPaid` = partial amount at creation → later `POST /invoices/{id}/payments` for each subsequent payment, until `balance = 0`. |
| Customer hands over money with no invoice yet (pre-payment / advance) | `POST /payments/advance`. |
| Customer has existing advance credit, wants to use it on a **new** invoice | `applyCredit: true` (+ optional `creditToApply` cap) on `POST /invoices`. |
| Customer has existing advance credit, wants to use it on an **already-created**, still-outstanding invoice | `POST /invoices/{id}/apply-credit`. |
| An advance receipt was entered incorrectly | `POST /payments/{id}/reverse`. |

---

## 9. End-to-end walkthrough (all pieces combined)

1. **Day 1** — Customer buys ₹10,000 of material, pays ₹5,000 cash.
   → Invoice `partial`, `balance = 5000`.
2. **Day 1** — Same visit, customer also hands over ₹2,000 "just in case for
   next time" — recorded separately as an advance receipt.
   → Available credit = ₹2,000. (Invoice balance unaffected — advance
   receipts are not auto-applied unless requested.)
3. **Day 15** — Customer returns, wants to clear the ₹5,000 invoice balance
   using their ₹2,000 credit plus ₹3,000 new cash.
   - Operator applies credit: `POST /invoices/{id}/apply-credit` with
     `creditToApply: 2000` → `balance` drops to ₹3,000.
   - Operator records the remaining cash: `POST /invoices/{id}/payments`
     with `amount: 3000` → `balance = 0`, `status = "paid"`.

Every one of these steps left an immutable trail in the `payments` table,
so the full history of how the invoice was settled is always reconstructable.
