# Project Overview & Technical Architecture

This document outlines the high-level recommendations, stack architecture, and future design patterns planned for the Crusher Management System (CMS).

## 1. Technical Stack Recommendations

| Component | Choice | Rationale |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js (with Express or Fastify) | Lightweight, single-threaded asynchronous processing, excellent performance with REST APIs, extensive NPM ecosystem. |
| **Database Engine** | PostgreSQL (v15+) | Complete ACID compliance, robust transaction isolation levels (critical for financial ledgers), native JSONB support for detailed audit logs. |
| **ORM / Migration Manager** | Prisma ORM | Strong type safety, auto-generated TypeScript clients matching schemas, and robust schema migrations (`prisma migrate`). |
| **Authentication** | JWT (JSON Web Tokens) + bcrypt | Stateless authentication suitable for web/iPad clients; passwords hashed securely using `bcrypt`. |
| **Frontend Framework** | React.js (via Vite) | Fast compilation times, light bundle footprint, highly optimized component routing. |
| **UI Components** | shadcn/ui (Tailwind CSS) | Premium, highly accessible component library optimized for dense dashboard design patterns. |
| **Document Compiler** | Puppeteer | Headless Chrome engine ensuring pixel-perfect PDF rendering of invoices based on HTML/CSS templates. |
| **Deployment Server** | VPS (Ubuntu Server) | Affordable hosting footprint; easy containerization using Docker if required. |

---

## 2. System Deployment Architecture

```
                       +-----------------------+
                       |   Client (Web/iPad)   |
                       +-----------+-----------+
                                   |
                                   | HTTP / JSON (JWT)
                                   v
                       +-----------------------+
                       |   Reverse Proxy       | (e.g. Nginx with SSL)
                       +-----------+-----------+
                                   |
                                   v
                       +-----------------------+
                       |  Node.js API Server   | (Express/Fastify)
                       +-----+-----------+-----+
                             |           |
               Queries / SQL |           | JSON (Audit Logs)
                             v           v
                     +-------+---+   +---+-------+
                     |  Postgres |   | Local Disk| (For PDF cache)
                     | Database  |   +-----------+
                     +-----------+
```

---

## 3. Database Migration Hooks for Future Phases

The database schema is designed with explicit "hooks" to avoid breaking table restructures in future development cycles:

### 3.1 Stock Management Ledger (Phase 2)
* **Goal:** Track incoming inventory vs. outgoing sales.
* **Hook:** The schema separates `truck_entries` (inward volume) and `invoice_items` (outward volume) with clean references to `material_types`.
* **Implementation:** A new transaction logging ledger (`stock_ledger` table) can be backfilled using historical rows in these tables:
  ```sql
  -- Migration query to populate ledger retroactively:
  INSERT INTO stock_ledger (entry_date, material_type_id, qty, tx_type)
  SELECT entry_date, material_type_id, quantity_brass, 'IN' FROM truck_entries;
  ```

### 3.2 Supplier Accounts (Phase 2)
* **Goal:** Convert free-text `supplier_name` into a structured lookup.
* **Hook:** `truck_entries.supplier_name` is currently a nullable string.
* **Implementation:** Create a `suppliers` table, map unique non-null names from `truck_entries` to new supplier entries, and replace `supplier_name` with `supplier_id` (FK).

### 3.3 GST Tax Compliance (Phase 3)
* **Goal:** Issue legal tax invoices.
* **Hook:** Invoice items are already normalized in `invoice_items` instead of directly storing amounts on the invoice header.
* **Implementation:** Additional fields (`hsn_code`, `gst_rate`, `cgst_amount`, `sgst_amount`) can be added as nullable or with default values to the `invoice_items` and `invoices` tables without changing core table relationships.
