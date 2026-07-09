# Reporting Engine Specification

Reports are critical for tracking business performance. The reporting engine aggregates transactional database data.

## 1. Truck Reports

### 1.1 Date-wise Inward Report
* **Purpose:** Track total volume received per day.
* **Filters:** Date range (start/end), Material Type (Optional).
* **Grouping:** Grouped by `entry_date` descending.
* **Columns:**
  * Date
  * Total Trucks (Count of entries)
  * Total Qty (Brass) (Sum of `quantity_brass`)
  * Materials (Comma-separated list of materials received)

### 1.2 Material-wise Inward Report
* **Purpose:** Analysis of product shares incoming.
* **Filters:** Date range.
* **Grouping:** Grouped by `material_type_id`.
* **Columns:**
  * Material Name
  * Number of Entries
  * Total Volume (Brass)

---

## 2. Sales Reports

### 2.1 Date-wise Sales
* **Purpose:** Monitor daily billings.
* **Filters:** Date range.
* **Grouping:** Grouped by `invoice_date`.
* **Columns:**
  * Date
  * Total Invoices Raised
  * Total Sales Amount ($\sum \text{total\_amount}$)

### 2.2 Customer Outstanding & Billings
* **Purpose:** Track customer accounts receivable.
* **Filters:** Date range, Customer (Optional).
* **Grouping:** Grouped by `customer_id`.
* **Columns:**
  * Customer Name
  * Invoices Raised (Count)
  * Total Sales Amount
  * Total Payments Received
  * Outstanding Balance (Sum of `balance` for pending/partial status)

### 2.3 Material-wise Sales
* **Purpose:** Track product-specific revenue.
* **Filters:** Date range.
* **Grouping:** Grouped by `material_type_id` via `invoice_items`.
* **Columns:**
  * Material Name
  * Quantity Sold (Brass)
  * Total Revenue

---

## 3. Payment Reports

### 3.1 Receipts Journal
* **Purpose:** Log of incoming money transactions.
* **Filters:** Date range, Payment Mode, Customer.
* **Columns:**
  * Payment Date
  * Customer Name
  * Invoice No.
  * Amount Paid
  * Payment Mode
  * Notes / Cheque Details

### 3.2 Invoice Ageing & Outstanding
* **Purpose:** Details of outstanding debts.
* **Filters:** Invoice Status (Pending, Partial), Customer, Date Range.
* **Columns:**
  * Invoice No.
  * Date
  * Customer Name
  * Total Amount
  * Amount Paid
  * Outstanding Balance
  * Status

---

## 4. Operational Expense Reports

### 4.1 Category-wise Outgoings
* **Purpose:** Group operational spending.
* **Filters:** Date range.
* **Rule (Dynamic Wages UNION):** Worker payouts and office wages category must be combined on the database level.
* **SQL Query Pattern:**
  ```sql
  SELECT 
    'Wages' AS category,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE category_id = (SELECT id FROM expense_categories WHERE name = 'Wages') AND expense_date BETWEEN :date_from AND :date_to)
    +
    (SELECT COALESCE(SUM(amount), 0) FROM worker_payments WHERE payment_date BETWEEN :date_from AND :date_to) AS total
  
  UNION ALL
  
  SELECT 
    ec.name AS category,
    SUM(e.amount) AS total
  FROM expenses e
  JOIN expense_categories ec ON e.category_id = ec.id
  WHERE ec.name != 'Wages' AND e.expense_date BETWEEN :date_from AND :date_to
  GROUP BY ec.id, ec.name;
  ```
* **Columns:**
  * Category Name
  * Total Amount Spent

### 4.2 Monthly Cash Outflow
* **Purpose:** Monthly operational spending trends.
* **Filters:** Fiscal Year selection.
* **Columns:**
  * Month
  * Total Expenses
  * Wages component (General Wages + Worker Payments)
  * Non-Wages component

---

## 5. Worker Wages Reports

### 5.1 Worker Payout Log
* **Purpose:** Ledger of cash payments to laborers.
* **Filters:** Worker (Optional), Date range.
* **Columns:**
  * Date
  * Worker Name
  * Amount
  * Notes

### 5.2 Worker Summary Sheet
* **Purpose:** Year-to-date payouts per laborer.
* **Filters:** Date range.
* **Grouping:** Grouped by `worker_id`.
* **Columns:**
  * Worker Name
  * Total Payouts Count
  * Total Wages Paid ($\sum \text{amount}$)
