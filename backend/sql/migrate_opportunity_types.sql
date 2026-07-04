-- Allow all opportunity types (drop old 3-value check)
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_type_check;
ALTER TABLE opportunities ALTER COLUMN type TYPE VARCHAR(50);
