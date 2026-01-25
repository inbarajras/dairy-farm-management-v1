# Weekly Inspections Database Migration

## Overview
This migration creates the `weekly_inspections` table to store individual cow weekly health inspection records and milk production data.

## Table Structure

### weekly_inspections
Stores weekly health inspections and daily milk production records for cows.

**Key Features:**
- Daily milk production tracking (morning, evening, total) for each day of the week
- Health inspection parameters (body condition score, feed intake, udder health, etc.)
- Unique constraint ensures one inspection per cow per week
- Automatic calculation of weekly milk production averages

## How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `create_weekly_inspections_table.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Supabase CLI
```bash
# If using Supabase CLI
supabase db push
```

### Option 3: Direct SQL Execution
```bash
# Using psql or any PostgreSQL client
psql -h <your-host> -U <your-user> -d <your-database> -f create_weekly_inspections_table.sql
```

## Verification

After running the migration, verify the table was created successfully:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'weekly_inspections';

-- Check table structure
\d weekly_inspections

-- Check RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'weekly_inspections';
```

## Table Details

### Columns
- `id` (UUID, Primary Key): Unique identifier for each inspection
- `cow_id` (UUID, Foreign Key): References the cows table
- `week_start_date` (DATE): Start date of the inspection week
- `daily_milk` (JSONB): Daily milk production data (morning, evening, total) for 7 days
- `average_morning_milk` (DECIMAL): Calculated average morning milk production
- `average_evening_milk` (DECIMAL): Calculated average evening milk production
- `average_total_milk` (DECIMAL): Calculated average total daily milk production
- `body_condition_score` (VARCHAR): Body condition score (1-5)
- `feed_intake` (VARCHAR): Feed intake assessment (Good/Average/Poor)
- `water_intake` (VARCHAR): Water intake assessment (Normal/Low)
- `udder_health` (VARCHAR): Udder health status (Normal/Mastitis)
- `hoof_leg_condition` (VARCHAR): Hoof and leg condition notes
- `heat_observed` (VARCHAR): Heat observation (Yes/No)
- `health_issues` (TEXT): Description of health issues or symptoms
- `treatment_given` (TEXT): Description of treatment administered
- `deworming_due_date` (DATE): Next deworming due date
- `vaccination_due` (VARCHAR): Upcoming vaccination details
- `remarks` (TEXT): Additional remarks
- `inspector_name` (VARCHAR): Name of the inspector
- `created_at` (TIMESTAMP): Record creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp (auto-updated)

### Constraints
- **Primary Key**: `id`
- **Foreign Key**: `cow_id` references `cows(id)` with CASCADE delete
- **Unique Constraint**: `unique_cow_week` on (`cow_id`, `week_start_date`)

### Indexes
- `idx_weekly_inspections_cow_id`: For fast cow-based queries
- `idx_weekly_inspections_week_start_date`: For date range queries
- `idx_weekly_inspections_created_at`: For recent records queries

### Row Level Security (RLS)
RLS is enabled with policies allowing authenticated users to:
- SELECT (view) all weekly inspections
- INSERT new weekly inspections
- UPDATE existing weekly inspections
- DELETE weekly inspections

## Integration

The Weekly Inspection module is integrated into the Health Management section:
- **Component**: `src/components/WeeklyInspection.jsx`
- **Service**: `src/components/services/weeklyInspectionService.js`
- **Parent**: Health Management tab in the main dashboard

## Features

1. **Weekly Record Form**: Matches the PDF template design
   - Cow selection
   - Week start date
   - Daily milk production (7 days)
   - Auto-calculated averages
   - Health inspection parameters

2. **List View**: Display all inspections with:
   - Search functionality
   - Pagination
   - Health status indicators
   - Quick actions (view, edit, delete)

3. **View Mode**: Detailed view of inspection record

4. **Statistics**: Track health trends and milk production patterns

## Rollback

If you need to remove the table:

```sql
-- Drop table and all related objects
DROP TABLE IF EXISTS weekly_inspections CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_weekly_inspections_updated_at() CASCADE;
```

## Notes
- The `daily_milk` field uses JSONB to store structured data for all 7 days
- Weekly averages are automatically calculated when creating/updating records
- The unique constraint prevents duplicate entries for the same cow and week
- All timestamps are in UTC with timezone support
