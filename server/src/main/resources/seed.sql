-- Rerunnable demo data for MySQL. Run after the schema exists.
-- Demo user password: password


START TRANSACTION;

-- Roles
INSERT INTO roles (role_name, description, is_active, created_at, updated_at)
VALUES
    ('SYSTEM', 'System role', TRUE, NOW(), NOW()),
    ('ADMIN', 'Administrator role', TRUE, NOW(), NOW()),
    ('MANAGER', 'Manager role', TRUE, NOW(), NOW()),
    ('USER', 'Standard user role', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    is_active = TRUE,
    updated_at = NOW();


-- Assign ADMIN role to existing admin user
UPDATE users u
JOIN roles r ON r.role_name = 'ADMIN'
SET
    u.role_id = r.id,
    u.updated_at = NOW()
WHERE u.username = 'admin';


-- Assign MANAGER role to existing manager user
UPDATE users u
JOIN roles r ON r.role_name = 'MANAGER'
SET
    u.role_id = r.id,
    u.updated_at = NOW()
WHERE u.username = 'manager';


-- Sale material types
INSERT INTO material_types (name, type, is_active, created_at, updated_at)
VALUES
    ('80mm', 'SALE', TRUE, NOW(), NOW()),
    ('40mm', 'SALE', TRUE, NOW(), NOW()),
    ('20mm', 'SALE', TRUE, NOW(), NOW()),
    ('12mm', 'SALE', TRUE, NOW(), NOW()),
    ('10mm', 'SALE', TRUE, NOW(), NOW()),
    ('6mm', 'SALE', TRUE, NOW(), NOW()),
    ('Dust', 'SALE', TRUE, NOW(), NOW()),
    ('Crushed Sand', 'SALE', TRUE, NOW(), NOW()),
    ('Waste', 'SALE', TRUE, NOW(), NOW()),
    ('D/C', 'SALE', TRUE, NOW(), NOW()),
    ('C/12mm', 'SALE', TRUE, NOW(), NOW()),
    ('D/12mm', 'SALE', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    type = VALUES(type),
    is_active = TRUE,
    updated_at = NOW();


-- Purchase material types
INSERT INTO material_types (name, type, is_active, created_at, updated_at)
VALUES
    ('Raw Stone', 'PURCHASE', TRUE, NOW(), NOW()),
    ('Boulders', 'PURCHASE', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    type = VALUES(type),
    is_active = TRUE,
    updated_at = NOW();


-- Expense categories
INSERT INTO categories (name, is_active, created_at, updated_at)
VALUES
    ('Diesel', TRUE, NOW(), NOW()),
    ('Machine Maintenance', TRUE, NOW(), NOW()),
    ('Truck/Feet Maintenance', TRUE, NOW(), NOW()),
    ('Tyres', TRUE, NOW(), NOW()),
    ('Labour', TRUE, NOW(), NOW()),
    ('Other', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = TRUE,
    updated_at = NOW();

INSERT INTO business_settings (id,business_name,address,phone,is_active,created_at,updated_at)
VALUES (1,'Vaibhav Stone Crusher','Nimbi, Pusad','+91 8805012303 / +91 9518533548',TRUE,NOW(),NOW())
ON DUPLICATE KEY UPDATE business_name=VALUES(business_name),address=VALUES(address),phone=VALUES(phone),is_active=TRUE,updated_at=NOW();
COMMIT;
