-- Migration: Add user tracking columns to all tables
-- This script adds created_by and updated_by columns to track which user performed CRUD operations

-- Add user tracking columns to cows table
ALTER TABLE cows
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to milk_production table
ALTER TABLE milk_production
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to health_events table
ALTER TABLE health_events
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to breeding_events table
ALTER TABLE breeding_events
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to reproductive_status table
ALTER TABLE reproductive_status
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to medications table
ALTER TABLE medications
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to vaccination_schedule table
ALTER TABLE vaccination_schedule
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to medication_usage table
ALTER TABLE medication_usage
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to employee_attendance table
ALTER TABLE employee_attendance
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to performance_reviews table
ALTER TABLE performance_reviews
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add user tracking columns to weekly_inspections table (if exists)
ALTER TABLE weekly_inspections
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create trigger to automatically update updated_by column
CREATE OR REPLACE FUNCTION update_modified_by_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   -- Note: updated_by should be set by the application, not the trigger
   -- because we don't have access to auth.uid() in all contexts
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for health_events
DROP TRIGGER IF EXISTS update_health_events_updated_at ON health_events;
CREATE TRIGGER update_health_events_updated_at
BEFORE UPDATE ON health_events
FOR EACH ROW
EXECUTE PROCEDURE update_modified_by_column();

-- Add triggers for breeding_events
DROP TRIGGER IF EXISTS update_breeding_events_updated_at ON breeding_events;
CREATE TRIGGER update_breeding_events_updated_at
BEFORE UPDATE ON breeding_events
FOR EACH ROW
EXECUTE PROCEDURE update_modified_by_column();

-- Add triggers for reproductive_status
DROP TRIGGER IF EXISTS update_reproductive_status_updated_at ON reproductive_status;
CREATE TRIGGER update_reproductive_status_updated_at
BEFORE UPDATE ON reproductive_status
FOR EACH ROW
EXECUTE PROCEDURE update_modified_by_column();

-- Add triggers for medications
DROP TRIGGER IF EXISTS update_medications_updated_at ON medications;
CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON medications
FOR EACH ROW
EXECUTE PROCEDURE update_modified_by_column();

-- Add triggers for vaccination_schedule
DROP TRIGGER IF EXISTS update_vaccination_schedule_updated_at ON vaccination_schedule;
CREATE TRIGGER update_vaccination_schedule_updated_at
BEFORE UPDATE ON vaccination_schedule
FOR EACH ROW
EXECUTE PROCEDURE update_modified_by_column();

-- Add triggers for employees
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE PROCEDURE update_modified_by_column();

-- Add triggers for weekly_inspections (if exists)
DROP TRIGGER IF EXISTS update_weekly_inspections_updated_at ON weekly_inspections;
CREATE TRIGGER update_weekly_inspections_updated_at
BEFORE UPDATE ON weekly_inspections
FOR EACH ROW
EXECUTE PROCEDURE update_modified_by_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cows_created_by ON cows(created_by);
CREATE INDEX IF NOT EXISTS idx_cows_updated_by ON cows(updated_by);
CREATE INDEX IF NOT EXISTS idx_health_events_created_by ON health_events(created_by);
CREATE INDEX IF NOT EXISTS idx_breeding_events_created_by ON breeding_events(created_by);
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);

-- Create a helper view to join user information with tables
-- This can be used to easily display user names in the UI
CREATE OR REPLACE VIEW cows_with_user_info AS
SELECT
  c.*,
  cu.email as created_by_email,
  uu.email as updated_by_email
FROM cows c
LEFT JOIN auth.users cu ON c.created_by = cu.id
LEFT JOIN auth.users uu ON c.updated_by = uu.id;

CREATE OR REPLACE VIEW health_events_with_user_info AS
SELECT
  he.*,
  cu.email as created_by_email,
  uu.email as updated_by_email
FROM health_events he
LEFT JOIN auth.users cu ON he.created_by = cu.id
LEFT JOIN auth.users uu ON he.updated_by = uu.id;

-- Add comment documentation
COMMENT ON COLUMN cows.created_by IS 'User ID who created this cow record';
COMMENT ON COLUMN cows.updated_by IS 'User ID who last updated this cow record';
COMMENT ON COLUMN health_events.created_by IS 'User ID who created this health event';
COMMENT ON COLUMN health_events.updated_by IS 'User ID who last updated this health event';
