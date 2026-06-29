# API Endpoints Specification

All endpoints are relative to base URL: `/api/v1` and require `Content-Type: application/json`.
Unless marked **Public**, all endpoints require a JWT Bearer token:
`Authorization: Bearer <TOKEN>`

## 1. Response Envelope
Every response will be formatted as:
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": { "page": 1, "per_page": 20, "total": 100 }
}
```

## 2. Endpoints Reference

### 2.1 Authentication & Profile
* **`POST /auth/login` [Public]**
  * Payload: `{"username": "admin", "password": "..."}`
  * Success Response:
    ```json
    {
      "token": "eyJhbGciOi...",
      "user": { "id": 1, "username": "admin", "role": "admin" }
    }
    ```
  * Error Response (401 / 403): `{"success": false, "error": "Invalid credentials", "data": null}`
* **`POST /auth/logout`**
  * Payload: None
* **`POST /auth/change-password`**
  * Payload: `{"current_password": "...", "new_password": "..."}`

---

### 2.2 Users (Admin Only)
* **`GET /users`**
  * List all users.
* **`POST /users`**
  * Create a user. Payload: `{"username": "manager1", "password": "...", "role": "manager"}`
* **`PUT /users/:id`**
  * Update user role/username. Payload: `{"username": "new_username", "role": "admin"}`
* **`PUT /users/:id/toggle-status`**
  * Enable/disable user account.

---

### 2.3 Materials & Expense Categories (Admin Only)
* **`GET /materials`** (Any authenticated role can access active items)
  * List materials.
* **`POST /materials`**
  * Create material. Payload: `{"name": "20mm"}`
* **`PUT /materials/:id`**
  * Edit material name. Payload: `{"name": "22mm"}`
* **`PUT /materials/:id/toggle-status`**
  * Activate/deactivate material.
* **`GET /expenses/categories`**
  * List expense categories.
* **`POST /expenses/categories`**
  * Create expense category. Payload: `{"name": "Office Supplies"}`

---

### 2.4 Truck Entries (Manager / Admin)
* **`GET /truck-entries`**
  * Query parameters: `date_from`, `date_to`, `truck_number`, `material_type_id`, `page`, `per_page`
* **`POST /truck-entries`**
  * Payload:
    ```json
    {
      "entry_date": "2026-06-18",
      "truck_number": "MH31AB1234",
      "material_type_id": 2,
      "quantity_brass": 12.50,
      "supplier_name": "Raju Transport",
      "remarks": "Clean grit"
    }
    ```
* **`GET /truck-entries/:id`**
  * Fetch a single entry detail.
* **`PUT /truck-entries/:id`**
  * Edit entry details. Payload: same structure as creation.

---

### 2.5 Customers (Manager / Admin)
* **`GET /customers`**
  * Query parameters: `search` (matches name or phone), `page`, `per_page`, `include_inactive`
* **`POST /customers`**
  * Payload: `{"name": "Ravi Builders", "phone": "9876543210", "address": "Nagpur", "notes": ""}`
* **`GET /customers/:id`**
  * Returns customer details + aggregated statistics (`sales_summary`, `outstanding_amount`).
* **`PUT /customers/:id`**
  * Edit customer details.
* **`PUT /customers/:id/toggle-status`**
  * Activate/deactivate customer. (Returns 409 Conflict if active outstanding balance exists).

---

### 2.6 Sales Invoices (Manager / Admin)
* **`GET /invoices`**
  * Query parameters: `date_from`, `date_to`, `customer_id`, `status`, `page`, `per_page`
* **`POST /invoices`**
  * Payload (Strict single item in V1):
    ```json
    {
      "invoice_date": "2026-06-18",
      "customer_id": 5,
      "remarks": "",
      "items": [
        {
          "material_type_id": 2,
          "quantity_brass": 10.00,
          "rate": 1500.00
        }
      ]
    }
    ```
* **`GET /invoices/:id`**
  * Fetch invoice header, line items, and payment receipt history.
* **`PUT /invoices/:id`**
  * Edit invoice. Allowed **only** if status is `'pending'` (no payments received). Payload matches creation structure.
* **`GET /invoices/:id/pdf`**
  * Generate and download PDF.

---

### 2.7 Payments / Inflow Receipts (Manager / Admin)
* **`GET /payments`**
  * Query parameters: `date_from`, `date_to`, `customer_id`, `invoice_id`, `payment_mode`
* **`POST /payments`**
  * Payload:
    ```json
    {
      "payment_date": "2026-06-18",
      "invoice_id": 12,
      "amount": 15000.00,
      "payment_mode": "cheque",
      "cheque_number": "CHQ99801",
      "notes": ""
    }
    ```
* **`GET /payments/:id`**
  * View payment receipt detail.

---

### 2.8 Expenses & Workers (Manager / Admin)
* **`GET /expenses`**
  * Query parameters: `date_from`, `date_to`, `category_id`
* **`POST /expenses`**
  * Payload: `{"expense_date": "2026-06-18", "category_id": 1, "amount": 5000, "notes": "Generator Fuel"}`
* **`GET /workers`**
  * List worker profiles.
* **`POST /workers`**
  * Payload: `{"name": "Suresh Kumar", "phone": "9876543210", "daily_wage": 500, "notes": ""}`
* **`POST /worker-payments`**
  * Payload: `{"worker_id": 3, "payment_date": "2026-06-18", "amount": 2500, "notes": "Week 2 wages"}`
