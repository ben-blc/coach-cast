/*
  # Add Tavus Replica ID to Coaches Table

  1. Changes
    - Add tavus_replica_id column to coaches table
    - Update Natalie's record with her Tavus replica ID: r7f46a350d08

  2. Security
    - Maintains existing RLS policies
    - No changes to existing data structure beyond adding the new column
*/

-- Add tavus_replica_id column to coaches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'tavus_replica_id'
  ) THEN
    ALTER TABLE coaches ADD COLUMN tavus_replica_id text;
  END IF;
END $$;

-- Update Natalie's record with her Tavus replica ID
UPDATE coaches 
SET tavus_replica_id = 'r7f46a350d08'
WHERE name = 'Natalie Sejean';

-- Add comment for the new column
COMMENT ON COLUMN coaches.tavus_replica_id IS 'Tavus replica ID for video AI generation';