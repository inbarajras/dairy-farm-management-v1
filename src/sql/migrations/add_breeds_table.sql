-- Migration: Add breeds table for custom breed management
-- Date: 2026-01-01
-- Description: Creates a breeds table to store custom cow breeds that can be reused

-- Create breeds table
CREATE TABLE IF NOT EXISTS breeds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_breeds_name ON breeds(name);

-- Insert default/common breeds
INSERT INTO breeds (name, description) VALUES
  ('Holstein', 'High milk production, black and white pattern'),
  ('Jersey', 'High butterfat content, fawn colored'),
  ('Brown Swiss', 'Good for cheese production, brown colored'),
  ('Ayrshire', 'Hardy breed, red and white pattern'),
  ('Guernsey', 'Golden colored milk, fawn and white'),
  ('Gir', 'Indian breed, heat resistant'),
  ('Sahiwal', 'Indian dairy breed, red or brown'),
  ('Red Sindhi', 'Indian breed, red colored'),
  ('Tharparkar', 'Dual purpose Indian breed, white or grey')
ON CONFLICT (name) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_breeds_updated_at
    BEFORE UPDATE ON breeds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT ON breeds TO authenticated;
GRANT SELECT ON breeds TO anon;
