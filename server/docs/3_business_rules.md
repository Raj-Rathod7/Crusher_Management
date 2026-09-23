# Business Rules

## Customer ledger

The `customer_ledger` table is append-only and is the source of truth for
customer balances.

- A sale posts a debit ledger entry.
- A customer payment posts a credit ledger entry.
- Pending balance is total debit minus total credit.
- Payments are customer-level and are not assigned to invoices.
- Financial history is corrected with reversal or adjustment entries, not deletes.

## Customer payments

- Amount must be greater than zero.
- Payment mode defaults to `cash` when omitted.
- Cheque payments require a cheque number.
- A payment must reference an active customer.
- The authenticated user is recorded as the creator.

## Sales

- Sales require an active customer, invoice number, date, total amount, and at
  least one invoice item.
- The total amount is entered by the operator.
- Invoice creation may include an optional payment amount. When supplied, it
  creates a cash customer payment dated on the invoice date and posts a credit
  ledger entry atomically with the sale.
- Invoice creation payments are customer-level credits and may exceed the
  invoice total.
- Editing a sale reverses the previous ledger sale and posts a replacement
  entry.
- Invoice and payment deletion endpoints are intentionally unavailable so
  ledger history cannot be silently destroyed.

## Customer deactivation

A customer with a positive pending balance cannot be deactivated.

## Ledger ordering

Ledger entries are ordered by entry date and creation ID. Running balance is
calculated as cumulative debits minus credits.
