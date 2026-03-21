-- Migration: Add user tracking columns to all major tables
-- Run this in Supabase SQL Editor

-- Add created_by and updated_by columns to cows table
ALTER TABLE cows
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add created_by and updated_by columns to health_events table
ALTER TABLE health_events
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add created_by and updated_by columns to breeding_events table
ALTER TABLE breeding_events
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add created_by and updated_by columns to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add created_by and updated_by columns to expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add created_by and updated_by columns to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add created_by and updated_by columns to weekly_inspections table
ALTER TABLE weekly_inspections
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add created_by and updated_by columns to medications table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'medications') THEN
    ALTER TABLE medications
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add created_by and updated_by columns to vaccination_schedule table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vaccination_schedule') THEN
    ALTER TABLE vaccination_schedule
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create triggers for updated_at on tables that need them
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to health_events
DROP TRIGGER IF EXISTS update_health_events_updated_at ON health_events;
CREATE TRIGGER update_health_events_updated_at
BEFORE UPDATE ON health_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to breeding_events
DROP TRIGGER IF EXISTS update_breeding_events_updated_at ON breeding_events;
CREATE TRIGGER update_breeding_events_updated_at
BEFORE UPDATE ON breeding_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to weekly_inspections
DROP TRIGGER IF EXISTS update_weekly_inspections_updated_at ON weekly_inspections;
CREATE TRIGGER update_weekly_inspections_updated_at
BEFORE UPDATE ON weekly_inspections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance on user tracking queries
CREATE INDEX IF NOT EXISTS idx_cows_created_by ON cows(created_by);
CREATE INDEX IF NOT EXISTS idx_cows_updated_by ON cows(updated_by);
CREATE INDEX IF NOT EXISTS idx_health_events_created_by ON health_events(created_by);
CREATE INDEX IF NOT EXISTS idx_health_events_updated_by ON health_events(updated_by);
CREATE INDEX IF NOT EXISTS idx_breeding_events_created_by ON breeding_events(created_by);
CREATE INDEX IF NOT EXISTS idx_breeding_events_updated_by ON breeding_events(updated_by);
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);
CREATE INDEX IF NOT EXISTS idx_employees_updated_by ON employees(updated_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_updated_by ON expenses(updated_by);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_updated_by ON invoices(updated_by);
CREATE INDEX IF NOT EXISTS idx_weekly_inspections_created_by ON weekly_inspections(created_by);
CREATE INDEX IF NOT EXISTS idx_weekly_inspections_updated_by ON weekly_inspections(updated_by);

-- Add comments for documentation
COMMENT ON COLUMN cows.created_by IS 'User who created this cow record';
COMMENT ON COLUMN cows.updated_by IS 'User who last updated this cow record';
COMMENT ON COLUMN health_events.created_by IS 'User who created this health event';
COMMENT ON COLUMN health_events.updated_by IS 'User who last updated this health event';
COMMENT ON COLUMN breeding_events.created_by IS 'User who created this breeding event';
COMMENT ON COLUMN breeding_events.updated_by IS 'User who last updated this breeding event';
COMMENT ON COLUMN employees.created_by IS 'User who created this employee record';
COMMENT ON COLUMN employees.updated_by IS 'User who last updated this employee record';
COMMENT ON COLUMN expenses.created_by IS 'User who created this expense';
COMMENT ON COLUMN expenses.updated_by IS 'User who last updated this expense';
COMMENT ON COLUMN invoices.created_by IS 'User who created this invoice';
COMMENT ON COLUMN invoices.updated_by IS 'User who last updated this invoice';
COMMENT ON COLUMN weekly_inspections.created_by IS 'User who created this inspection';
COMMENT ON COLUMN weekly_inspections.updated_by IS 'User who last updated this inspection';
