# Business Rules Specification

This document defines the strict business rules, validations, and computational formulas that govern the Crusher Management System (CMS).

## 1. Invoice Status Rules

Invoice statuses are derived states based on `amount_paid` and `total_amount` (from invoice items). They must be computed and stored in the `invoices` table whenever an invoice is created or a payment is recorded.

```
if amount_paid == 0:
    status = 'pending'
elif amount_paid > 0 and balance > 0:
    status = 'partial'
elif balance == 0:
    status = 'paid'
```

* **Rule:** Status is updated synchronously within the database transaction modifying payments. Never compute status dynamically on fetch queries to ensure performance.

---

## 2. Inflow / Cash Validation Rules

1. **Amount Positivity:** The payment `amount` must be greater than zero.
2. **No Overpayments:** The payment `amount` must not exceed the current `invoice.balance`. If a payment exceeds the remaining balance, the transaction must be aborted and return an HTTP `400 Bad Request`.
3. **Double Ledger Update:** Every payment record insertion must trigger an atomic transaction updating the parent invoice:
   * `invoices.amount_paid += payment.amount`
   * `invoices.balance -= payment.amount`
4. **Payment Date Boundary:** A payment `payment_date` cannot be earlier than `invoice.invoice_date`.
5. **Cheque Validation:** If `payment_mode` is `'cheque'`, `cheque_number` is a mandatory field.

---

## 3. Invoice Locks & Editability

An invoice is considered **finalized and locked** as soon as at least one payment receipt is logged against it.
$$\text{If } \text{COUNT}(\text{payments WHERE invoice\_id} = X) > 0 \implies \text{Block all updates to } Invoice(X)$$
* **Resolution:** If a correction must be made, the operator must record details in the `remarks` field, or the payment must be deleted/reversed first (Admin permission required) to unlock the invoice.

---

## 4. Deactivation Rules

To maintain relational integrity, the deactivation of entities is handled as follows:

| Entity | Rules |
| :--- | :--- |
| **Customer** | If outstanding balance $> 0$, display a list of pending/partial invoices and block the change. It can only be disabled once balance is zero or the action is forced with Admin override. |
| **Material Type** | Historical invoices and entries retain the material ID. Deactivation prevents selection for new invoices or truck entries. |
| **Expense Category** | Allowed if no expenses are logged in the current fiscal year. If system category (`is_system = TRUE`), deactivation is blocked completely. |
| **Worker** | Always allowed. Historical records are preserved. |

---

## 5. Worker Wages Integration

Worker payments are managed strictly inside the `worker_payments` table. They are **never** duplicated in the `expenses` table.
During expense reporting for the "Wages" category:
$$\text{Wages Total} = \sum \text{expenses.amount WHERE category = 'Wages'} + \sum \text{worker\_payments.amount}$$
This formula must be uniformly integrated across dashboards, reports, and API summary points.

---

## 6. Invoice Number Auto-Generation

Format: `{PREFIX}-{FY}-{SEQUENCE}`

1. **PREFIX:** Configured in `business_settings` (default: `INV`).
2. **FY:** 4-digit short format of the Financial Year boundary (April 1 – March 31). E.g., for June 18, 2026, it is `2627` (FY 2026-27).
3. **SEQUENCE:** 4-digit zero-padded, starting at `0001` per financial year (e.g., `INV-2627-0001`).
4. **Reset Rule:** The sequence resets back to `0001` automatically on April 1st.
5. **Concurrency:** Generation must execute in an isolated database transaction to guarantee no duplicate sequential numbers are assigned.
