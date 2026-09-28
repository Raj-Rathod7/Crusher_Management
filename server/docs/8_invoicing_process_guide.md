# Invoicing Process Guide

## Create a sale

1. Select an active customer.
2. Enter the invoice number, sale date, items, and total amount.
3. Save the sale.
4. The system creates the invoice and posts a `SALE` debit to the customer
   ledger.

## Record a payment

Payments are recorded from the customer page or receipts page, not against an
invoice:

```json
{
  "amount": 5000,
  "paymentDate": "2026-09-21",
  "paymentMode": "cash",
  "externalRef": "",
  "notes": "Payment received"
}
```

The endpoint is `POST /customers/{customerId}/payments`. It creates a
`CUSTOMER_PAYMENT` credit in the customer ledger.

## Customer balance

The customer summary shows:

- recent sales
- recent customer payments
- the source-linked customer ledger
- running balance, calculated as sale debits minus payment credits

A payment can exceed the balance when the business accepts an advance. That
credit remains on the customer ledger for future business decisions; it is not
assigned to a specific invoice.

## Editing a sale

Editing an existing sale updates the existing `SALE` ledger entry for the
updated sale.

Invoice and payment deletion soft-deactivates the matching ledger entry and
does not create a reversal row.
