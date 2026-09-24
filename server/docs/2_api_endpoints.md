# API Endpoints

All endpoints require the authenticated JWT unless noted otherwise.

## Authentication

- `POST /auth/login`
- `POST /auth/register`

## Customers

- `GET /customers`
- `GET /customers/page`
- `POST /customers`
- `GET /customers/{id}`
- `PUT /customers/{id}`
- `GET /customers/{id}/invoices`
- `GET /customers/{id}/summary`
- `POST /customers/{id}/payments`

Customer payments belong directly to the customer. They are never allocated to
an invoice.

## Sales

- `GET /invoices`
- `GET /invoices/page`
- `GET /invoices/{id}`
- `POST /invoices`
- `PUT /invoices/{id}`

Creating or editing a sale posts its financial effect to the customer ledger.
When creating a sale, the optional `paymentAmount` request field records a cash
payment dated on the invoice date and posts the corresponding customer-ledger
credit in the same transaction. Editing a sale does not create a payment.

## Payments

- `GET /payments`
- `GET /payments/{id}`

Payment creation is intentionally customer-scoped through
`POST /customers/{id}/payments`; there is no generic payment write endpoint.

## Other resources

- `GET|POST|PUT /truck-entries`
- `GET|POST|PUT /expenses`
- `GET|POST|PUT /materials`
- `GET|POST|PUT /users`
- `GET /dashboard`
- `GET /dashboard/charts?dateFrom=&dateTo=` — date-ranged chart series for the dashboard
  (`salesByDate`, `expensesByCategory`, `truckInwardByDate`, `materialWiseSales`); both
  params are optional `LocalDate` values, omitting them returns all-time data.

Exact request and response fields are defined by the Java request and DTO
classes in `server/src/main/java/com/productapp`.
