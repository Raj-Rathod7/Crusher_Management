# Business Rules

## Customer ledger

The `customer_ledger` table is the source of truth for
customer balances.

- A sale posts a debit ledger entry.
- A customer payment posts a credit ledger entry.
- Pending balance is total debit minus total credit.
- Payments are customer-level and are not assigned to invoices.
- Financial corrections update the existing source-linked ledger row directly.
- Deleted invoices and payments soft-deactivate their original ledger rows;
  reversal entries are not created.

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
- Editing a sale updates its existing `SALE` ledger entry in place.
- Editing a payment updates its existing `CUSTOMER_PAYMENT` ledger entry in
  place.
- Invoice and payment deletion soft-deactivates the matching source-linked
  ledger entry and the original business record.

## Customer deactivation

A customer with a positive pending balance cannot be deactivated.

## Ledger ordering

Ledger entries are ordered by entry date and creation ID. Running balance is
calculated as cumulative debits minus credits.
