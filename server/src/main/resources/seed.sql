-- Rerunnable seed data for MySQL.
-- Run this after schema exists.

START TRANSACTION;

-- 1) Seed roles required by application and system operations.
INSERT INTO roles (role_name, description, is_active)
VALUES
  ('SYSTEM', 'System role for internal data operations', TRUE),
  ('ADMIN', 'Administrator role', TRUE),
  ('MANAGER', 'Manager role', TRUE)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  is_active = VALUES(is_active);

-- 2) Seed system user linked to SYSTEM role.
-- Password hash below is placeholder BCrypt hash.
-- Replace with BCrypt hash for password you want before first login use.
INSERT INTO users (username, password, role_id, is_active, created_at)
SELECT
  'system',
  '$2a$10$E9N0d4W2V8xNw5w9zJf7XeuQ7n9S7P8YkY2j9r0M6hW6b2B4cD9qK',
  r.id,
  TRUE,
  NOW()
FROM roles r
WHERE r.role_name = 'SYSTEM'
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role_id = VALUES(role_id),
  is_active = VALUES(is_active);

-- 3) Seed material types.
INSERT INTO material_types (name, is_active, created_at)
VALUES
  ('10mm', TRUE, NOW()),
  ('20mm', TRUE, NOW()),
  ('40mm', TRUE, NOW()),
  ('Stone Dust', TRUE, NOW()),
  ('Crusher Run', TRUE, NOW()),
  ('M-Sand', TRUE, NOW())
ON DUPLICATE KEY UPDATE
  is_active = VALUES(is_active);

COMMIT;
