# Database Schema Specification

This document details the database schema for the Crusher Management System (CMS). The recommended database system is **PostgreSQL**, though it is compatible with other ACID-compliant relational databases.

## 1. Table Definitions

### 1.1 `users`
**Purpose:** Authentication and role-based access control.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL (hashed using bcrypt) |
| `role` | VARCHAR(20) | NOT NULL, ENUM: `'admin'`, `'manager'` (Default: `'manager'`) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

* **Indexes:** B-tree index on `username` (implicit with UNIQUE constraint).

---

### 1.2 `business_settings`
**Purpose:** Singleton table storing metadata for documents and invoices.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | INT | Primary Key, check constraint `id = 1` |
| `business_name` | VARCHAR(100) | NOT NULL |
| `address` | TEXT | NULLABLE (Used in PDF headers) |
| `phone` | VARCHAR(20) | NULLABLE |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

---

### 1.3 `material_types`
**Purpose:** Catalog of products sold (e.g., 20mm, Dust, Grit).

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

---

### 1.4 `expense_categories`
**Purpose:** Catalog of operational expense categories.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL |
| `is_system` | BOOLEAN | NOT NULL, DEFAULT `FALSE` (True for system categories like Wages) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

* **Seed Data:** Prepopulate where `is_system = TRUE`: `Diesel`, `Repair`, `Electricity`, `Maintenance`, `Food`, `Wages`, and `Miscellaneous`.

---

### 1.5 `customers`
**Purpose:** Directory of clients.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `name` | VARCHAR(150) | NOT NULL |
| `phone` | VARCHAR(20) | NULLABLE |
| `address` | TEXT | NULLABLE |
| `notes` | TEXT | NULLABLE |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

* **Indexes:** B-Tree search indexes on `name` and `phone`.

---

### 1.6 `truck_entries`
**Purpose:** Log of incoming material loads at the crusher.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `entry_date` | DATE | NOT NULL |
| `truck_number` | VARCHAR(20) | NOT NULL |
| `material_type_id` | INT | Foreign Key -> `material_types(id)`, NOT NULL |
| `quantity_brass` | DECIMAL(10, 2) | NOT NULL, CHECK > 0 |
| `supplier_name` | VARCHAR(150) | NULLABLE |
| `remarks` | TEXT | NULLABLE |
| `created_by` | INT | Foreign Key -> `users(id)`, NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

* **Indexes:** `entry_date`, `material_type_id`, `truck_number`

---

### 1.7 `invoices`
**Purpose:** Records of customer sales transactions.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `invoice_number` | VARCHAR(30) | UNIQUE, NOT NULL |
| `invoice_date` | DATE | NOT NULL |
| `customer_id` | INT | Foreign Key -> `customers(id)`, NOT NULL |
| `total_amount` | DECIMAL(12, 2) | NOT NULL, CHECK >= 0 |
| `amount_paid` | DECIMAL(12, 2) | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `balance` | DECIMAL(12, 2) | NOT NULL, CHECK >= 0 (total_amount - amount_paid) |
| `status` | VARCHAR(20) | NOT NULL, ENUM: `'pending'`, `'partial'`, `'paid'` |
| `remarks` | TEXT | NULLABLE |
| `created_by` | INT | Foreign Key -> `users(id)`, NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

* **Indexes:** `invoice_date`, `customer_id`, `status`, `invoice_number`

---

### 1.8 `invoice_items`
**Purpose:** Product breakdown of each invoice.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `invoice_id` | INT | Foreign Key -> `invoices(id)` ON DELETE CASCADE, NOT NULL |
| `material_type_id` | INT | Foreign Key -> `material_types(id)`, NOT NULL |
| `quantity_brass` | DECIMAL(10, 2) | NOT NULL, CHECK > 0 |
| `rate` | DECIMAL(10, 2) | NOT NULL, CHECK > 0 |
| `amount` | DECIMAL(12, 2) | NOT NULL, CHECK >= 0 (quantity_brass * rate) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

---

### 1.9 `payments`
**Purpose:** Log of payment receipts against invoices.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `payment_date` | DATE | NOT NULL |
| `invoice_id` | INT | Foreign Key -> `invoices(id)`, NOT NULL |
| `customer_id` | INT | Foreign Key -> `customers(id)`, NOT NULL (Denormalized) |
| `amount` | DECIMAL(12, 2) | NOT NULL, CHECK > 0 |
| `payment_mode` | VARCHAR(20) | NOT NULL, ENUM: `'cash'`, `'upi'`, `'bank_transfer'`, `'cheque'` |
| `cheque_number` | VARCHAR(30) | NULLABLE (REQUIRED if payment_mode is 'cheque') |
| `notes` | TEXT | NULLABLE |
| `created_by` | INT | Foreign Key -> `users(id)`, NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

* **Indexes:** `payment_date`, `invoice_id`, `customer_id`

---

### 1.10 `expenses`
**Purpose:** Operating expenses (non-labor).

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `expense_date` | DATE | NOT NULL |
| `category_id` | INT | Foreign Key -> `expense_categories(id)`, NOT NULL |
| `amount` | DECIMAL(12, 2) | NOT NULL, CHECK > 0 |
| `notes` | TEXT | NULLABLE |
| `created_by` | INT | Foreign Key -> `users(id)`, NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

* **Indexes:** `expense_date`, `category_id`

---

### 1.11 `workers`
**Purpose:** Employee/labor directory.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `name` | VARCHAR(150) | NOT NULL |
| `phone` | VARCHAR(20) | NULLABLE |
| `daily_wage` | DECIMAL(8, 2) | NULLABLE |
| `notes` | TEXT | NULLABLE |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

---

### 1.12 `worker_payments`
**Purpose:** Wage payouts to labor.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `worker_id` | INT | Foreign Key -> `workers(id)`, NOT NULL |
| `payment_date` | DATE | NOT NULL |
| `amount` | DECIMAL(10, 2) | NOT NULL, CHECK > 0 |
| `notes` | TEXT | NULLABLE |
| `created_by` | INT | Foreign Key -> `users(id)`, NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

* **Indexes:** `worker_id`, `payment_date`

---

### 1.13 `audit_log`
**Purpose:** Immutable history of data mutations.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | SERIAL / INT | Primary Key |
| `user_id` | INT | Foreign Key -> `users(id)`, NOT NULL |
| `action` | VARCHAR(20) | NOT NULL, ENUM: `'create'`, `'update'`, `'delete'` |
| `entity_type` | VARCHAR(50) | NOT NULL |
| `entity_id` | INT | NOT NULL |
| `changes_json` | TEXT | NULLABLE (Raw diff `{"before": {...}, "after": {...}}`) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

* **Indexes:** `(entity_type, entity_id)`, `user_id`, `created_at`
