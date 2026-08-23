-- Rerunnable demo data for MySQL. Run after the schema exists.
-- Demo user password: password
START TRANSACTION;

INSERT INTO roles (role_name, description, is_active, created_at, updated_at) VALUES
('SYSTEM','System role',TRUE,NOW(),NOW()),('ADMIN','Administrator role',TRUE,NOW(),NOW()),('MANAGER','Manager role',TRUE,NOW(),NOW()),('USER','Standard user role',TRUE,NOW(),NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description),is_active=TRUE,updated_at=NOW();

INSERT INTO users (username,password,role_id,is_active,created_at,updated_at)
SELECT 'demo-admin','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',id,TRUE,NOW(),NOW() FROM roles WHERE role_name='ADMIN'
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id),is_active=TRUE,updated_at=NOW();
INSERT INTO users (username,password,role_id,is_active,created_at,updated_at)
SELECT 'demo-manager','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',id,TRUE,NOW(),NOW() FROM roles WHERE role_name='MANAGER'
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id),is_active=TRUE,updated_at=NOW();

INSERT INTO material_types (name,is_active,created_at,updated_at) VALUES
('10mm',TRUE,NOW(),NOW()),('20mm',TRUE,NOW(),NOW()),('Stone Dust',TRUE,NOW(),NOW()),('Crusher Run',TRUE,NOW(),NOW())
ON DUPLICATE KEY UPDATE is_active=TRUE,updated_at=NOW();
INSERT INTO categories (name,is_active,created_at,updated_at) VALUES
('Diesel',TRUE,NOW(),NOW()),('Machine Maintenance',TRUE,NOW(),NOW()),('Electricity Bill',TRUE,NOW(),NOW()),('Other',TRUE,NOW(),NOW())
ON DUPLICATE KEY UPDATE is_active=TRUE,updated_at=NOW();
INSERT INTO business_settings (id,business_name,address,phone,is_active,created_at,updated_at)
VALUES (1,'Vaibhav Stone Crusher','Industrial Area, Nashik','+91 98765 43210',TRUE,NOW(),NOW())
ON DUPLICATE KEY UPDATE business_name=VALUES(business_name),address=VALUES(address),phone=VALUES(phone),is_active=TRUE,updated_at=NOW();

INSERT INTO customers (name,phone,address,notes,is_active,created_at,updated_at)
SELECT 'Apex Infrastructure','+91 98765 10001','Nashik Road','Regular buyer',TRUE,NOW(),NOW() WHERE NOT EXISTS (SELECT 1 FROM customers WHERE phone='+91 98765 10001');
INSERT INTO customers (name,phone,address,notes,is_active,created_at,updated_at)
SELECT 'Shree Buildwell','+91 98765 10002','Sinnar','Morning dispatch',TRUE,NOW(),NOW() WHERE NOT EXISTS (SELECT 1 FROM customers WHERE phone='+91 98765 10002');
INSERT INTO customers (name,phone,address,notes,is_active,created_at,updated_at)
SELECT 'Northline Contractors','+91 98765 10003','Igatpuri','Monthly account',TRUE,NOW(),NOW() WHERE NOT EXISTS (SELECT 1 FROM customers WHERE phone='+91 98765 10003');

INSERT INTO truck_entries (entry_date,truck_number,material_type_id,quantity_brass,supplier_name,remarks,created_by,is_active,created_at,updated_at)
SELECT '2026-08-18','MH15AB1234',m.id,18.50,'Patil Aggregates','Raw stone load',u.id,TRUE,NOW(),NOW() FROM material_types m JOIN users u ON u.username='demo-manager' WHERE m.name='20mm' AND NOT EXISTS (SELECT 1 FROM truck_entries WHERE truck_number='MH15AB1234' AND entry_date='2026-08-18');

INSERT INTO invoices (invoice_number,invoice_date,customer_id,total_amount,amount_paid,balance,status,remarks,created_by,is_active,created_at,updated_at)
SELECT 'INV-2026-0001','2026-08-18',c.id,52500.00,52500.00,0.00,'paid','Full payment received',u.id,TRUE,NOW(),NOW() FROM customers c JOIN users u ON u.username='demo-admin' WHERE c.phone='+91 98765 10001' AND NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number='INV-2026-0001');
INSERT INTO invoices (invoice_number,invoice_date,customer_id,total_amount,amount_paid,balance,status,remarks,created_by,is_active,created_at,updated_at)
SELECT 'INV-2026-0002','2026-08-20',c.id,68000.00,30000.00,38000.00,'partial','Balance due',u.id,TRUE,NOW(),NOW() FROM customers c JOIN users u ON u.username='demo-admin' WHERE c.phone='+91 98765 10002' AND NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number='INV-2026-0002');
INSERT INTO invoices (invoice_number,invoice_date,customer_id,total_amount,amount_paid,balance,status,remarks,created_by,is_active,created_at,updated_at)
SELECT 'INV-2026-0003','2026-08-21',c.id,41500.00,0.00,41500.00,'pending','Awaiting confirmation',u.id,TRUE,NOW(),NOW() FROM customers c JOIN users u ON u.username='demo-manager' WHERE c.phone='+91 98765 10003' AND NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number='INV-2026-0003');

INSERT INTO invoice_items (invoice_id,material_type_id,truck_number,quantity_brass,rate,amount,is_active,created_at,updated_at)
SELECT i.id,m.id,'MH15AB1234',25.00,2100.00,52500.00,TRUE,NOW(),NOW() FROM invoices i JOIN material_types m ON m.name='20mm' WHERE i.invoice_number='INV-2026-0001' AND NOT EXISTS (SELECT 1 FROM invoice_items WHERE invoice_id=i.id AND truck_number='MH15AB1234');

INSERT INTO expenses (expense_date,category_id,amount,notes,created_by,is_active,created_at,updated_at)
SELECT '2026-08-18',c.id,12500.00,'Diesel stock refill',u.id,TRUE,NOW(),NOW() FROM categories c JOIN users u ON u.username='demo-manager' WHERE c.name='Diesel' AND NOT EXISTS (SELECT 1 FROM expenses WHERE expense_date='2026-08-18' AND notes='Diesel stock refill');
INSERT INTO expenses (expense_date,category_id,amount,notes,created_by,is_active,created_at,updated_at)
SELECT '2026-08-19',c.id,6800.00,'Machine maintenance',u.id,TRUE,NOW(),NOW() FROM categories c JOIN users u ON u.username='demo-manager' WHERE c.name='Machine Maintenance' AND NOT EXISTS (SELECT 1 FROM expenses WHERE expense_date='2026-08-19' AND notes='Machine maintenance');

COMMIT;
