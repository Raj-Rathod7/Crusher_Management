# Customer Credit Ledger + Manual Invoice Total

## Goal
Support two business rules:

1. Customer can pay advance without buying material now.
2. Invoice total is fully manual input by operator.

## Hard Decisions
1. Use `payments` as credit ledger source of truth.
2. Do not store material-computed total now.
3. Invoice financial truth is `invoice.totalAmount` entered by user.
4. Credit application and invoice creation happen in one DB transaction.
5. Ledger rows are immutable. For mistakes, insert reversal/adjustment row.

## Scope
### In scope
1. Advance receipt entry for customer.
2. Auto/manual credit deduction when invoice created.
3. Correct invoice `amountPaid` and `balance` after credit apply.
4. Customer pending balance from backend.
5. Audit trail for every money movement.

### Out of scope (for now)
1. Storing material-derived invoice total.
2. Complex pricing variance reporting.
3. Multi-branch wallet sharing rules.

## Data Model Proposal
Use existing `payments` table with minimal extensions.

### Required fields
1. `id`
2. `customer_id` (required)
3. `invoice_id` (nullable)
4. `amount` (decimal, positive)
5. `entry_type` (enum)
6. `direction` (enum: `CREDIT_IN`, `CREDIT_OUT`)
7. `receipt_number` (nullable, unique per business policy)
8. `external_ref` (nullable: bank/UPI/check ref)
9. `notes` (nullable)
10. `created_by`
11. `created_at`
12. `is_active` (optional if using soft delete; avoid deleting rows)

### entry_type enum
1. `ADVANCE_RECEIPT`
2. `CREDIT_APPLIED`
3. `INVOICE_PAYMENT`
4. `CREDIT_REFUND`
5. `CREDIT_ADJUSTMENT`

## Credit Balance Definition
Customer available credit:

`sum(CREDIT_IN) - sum(CREDIT_OUT)`

Where:
1. `ADVANCE_RECEIPT`, positive `CREDIT_ADJUSTMENT` contribute to `CREDIT_IN`.
2. `CREDIT_APPLIED`, `CREDIT_REFUND`, negative `CREDIT_ADJUSTMENT` contribute to `CREDIT_OUT`.

## Invoice Create Flow
Single transaction flow:

1. Validate customer active.
2. Validate invoice payload and manual `totalAmount`.
3. Persist invoice + invoice items.
4. Fetch current available credit for customer with lock.
5. Decide credit to apply:
   - `applyCredit = true` and no cap: apply min(availableCredit, invoiceTotal).
   - `applyCredit = true` and cap provided: apply min(cap, availableCredit, invoiceTotal).
   - `applyCredit = false`: apply 0.
6. Insert `payments` row: `entry_type = CREDIT_APPLIED`, `direction = CREDIT_OUT`, `invoice_id = new invoice id`.
7. Add direct cash paid (if any) as `INVOICE_PAYMENT`.
8. Update invoice amounts:
   - `amountPaid = creditApplied + cashPaid`
   - `balance = max(0, totalAmount - amountPaid)`
   - `status = paid | partial | pending`
9. Commit.

## Advance Receipt Flow
1. Operator selects customer.
2. Operator enters amount and receipt metadata.
3. Insert `payments` row:
   - `entry_type = ADVANCE_RECEIPT`
   - `direction = CREDIT_IN`
4. Return updated customer credit balance.

## API Contract Proposal
### Create advance receipt
`POST /payments/advance`

Request:
1. `customerId`
2. `amount`
3. `receiptNumber` (optional)
4. `externalRef` (optional)
5. `notes` (optional)

Response:
1. payment entry
2. customer available credit

### Create invoice
`POST /invoices`

Request additions:
1. `totalAmount` (manual, required)
2. `applyCredit` (boolean, default true)
3. `creditToApply` (optional cap)
4. `cashPaidNow` (optional)

Response additions:
1. `creditApplied`
2. `cashPaid`
3. `amountPaid`
4. `balance`
5. `customerAvailableCreditAfterTxn`

### Customer summary
`GET /customers/{id}/summary`

Response:
1. customer profile
2. available credit
3. pending invoice balance
4. recent payments
5. recent invoices

## Backend Rules
1. Never allow negative available credit.
2. Never allow `amountPaid > totalAmount`.
3. Credit apply must be idempotent for retry-safe requests.
4. Use optimistic lock or row lock when applying credit.
5. Do not physically delete financial rows.

## Frontend UX Rules
1. Invoice form shows manual invoice total input.
2. Invoice form shows available credit from backend.
3. Operator can toggle apply credit and set cap.
4. Preview shows final payable before submit.
5. Customer modal/table shows pending balance + available credit.

## Indexing and Performance
1. Index `payments(customer_id, created_at)`
2. Index `payments(invoice_id)`
3. Index `payments(entry_type)`
4. Optional materialized customer balance table later for heavy scale.

## Migration Strategy
1. Keep existing invoice APIs working.
2. Add new payment entry types first.
3. Start writing new ledger rows for new transactions.
4. Backfill historical advance data only if needed.

## Risks and Mitigation
1. Double submission risk:
   - Mitigation: idempotency key per create request.
2. Race condition on same customer:
   - Mitigation: transaction + lock on customer/payment balance read.
3. Human entry mistakes in manual invoice total:
   - Mitigation: role-based permissions + edit audit trail.

## Open Questions
1. Should credit auto-apply by default for every invoice?
2. Can operator override auto-apply value?
3. Can invoice be created with zero invoice items?
4. Should advance receipts support cancellation or only reversal?
5. Do we need branch-wise isolated customer credit?
