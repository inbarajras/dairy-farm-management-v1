-- Create weekly_inspections table
CREATE TABLE IF NOT EXISTS weekly_inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cow_id UUID NOT NULL REFERENCES cows(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,

  -- Health inspection fields
  body_condition_score VARCHAR(10),
  feed_intake VARCHAR(50),
  water_intake VARCHAR(50),
  udder_health VARCHAR(50),
  hoof_leg_condition VARCHAR(100),
  heat_observed VARCHAR(10),
  health_issues TEXT,
  treatment_given TEXT,
  deworming_due_date DATE,
  vaccination_due VARCHAR(200),
  remarks TEXT,
  inspector_name VARCHAR(200) NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_cow_week UNIQUE(cow_id, week_start_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_weekly_inspections_cow_id ON weekly_inspections(cow_id);
CREATE INDEX IF NOT EXISTS idx_weekly_inspections_week_start_date ON weekly_inspections(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_inspections_created_at ON weekly_inspections(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_weekly_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_weekly_inspections_updated_at
  BEFORE UPDATE ON weekly_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_inspections_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE weekly_inspections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to view all weekly inspections
CREATE POLICY "Allow authenticated users to view weekly inspections"
  ON weekly_inspections
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert weekly inspections
CREATE POLICY "Allow authenticated users to insert weekly inspections"
  ON weekly_inspections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update weekly inspections
CREATE POLICY "Allow authenticated users to update weekly inspections"
  ON weekly_inspections
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete weekly inspections
CREATE POLICY "Allow authenticated users to delete weekly inspections"
  ON weekly_inspections
  FOR DELETE
  TO authenticated
  USING (true);

-- Add comments to table and columns
COMMENT ON TABLE weekly_inspections IS 'Stores weekly health inspection records for individual cows. The unique_cow_week constraint ensures only one inspection per cow per week start date.';
COMMENT ON COLUMN weekly_inspections.body_condition_score IS 'Body condition score on a scale of 1-5';
