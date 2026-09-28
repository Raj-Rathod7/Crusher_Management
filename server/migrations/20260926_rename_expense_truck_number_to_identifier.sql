-- Run once before deploying the application version that maps expenses.identifier.
ALTER TABLE expenses
    CHANGE COLUMN truck_number identifier VARCHAR(20) NULL,
    RENAME INDEX idx_expenses_truck_number TO idx_expenses_identifier;