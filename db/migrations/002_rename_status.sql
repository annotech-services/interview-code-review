-- 002_rename_status

ALTER TABLE projects DROP COLUMN status;
ALTER TABLE projects ADD COLUMN state text NOT NULL DEFAULT 'active';
