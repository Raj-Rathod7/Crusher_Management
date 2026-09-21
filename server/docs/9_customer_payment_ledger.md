# Customer Payment Ledger

The current payment workflow is customer-level:

1. Create a sale with the customer, invoice number, date, material, truck,
  quantity, and total amount.
2. Record money received later against the customer, without selecting an
  invoice.
3. Read the customer summary to see sales, payments, and the running ledger.

The `customer_ledger` table is the append-only financial source of truth.
Invoices and payments remain operational records, while ledger rows represent
the financial effect of each sale or customer payment.

## API

Record a payment with `POST /customers/{customerId}/payments`:

```json
{
  "amount": 30000,
  "paymentDate": "2026-09-21",
  "paymentMode": "cash",
  "chequeNumber": null,
  "externalRef": "",
  "notes": "Payment received from customer"
}
```

The payment is stored with the customer and has no invoice relationship.
Cheque payments require `chequeNumber`.

`GET /customers/{customerId}/summary` returns the customer, recent sales,
recent customer payments, and `ledger`. Ledger entries use:

- `debit`: sale amount added to the customer's balance
- `credit`: customer payment received
- `runningBalance`: cumulative debits minus credits

Customer pending balance is the ledger debit total minus the ledger credit
total. Payments are not allocated to individual invoices.

## Editing and corrections

Invoice edits post a reversal for the previous sale entry and a new sale entry
for the updated values. Financial records are not deleted, and there are no
invoice or payment delete endpoints. Future corrections should use reversal or
adjustment ledger rows rather than mutating history.
