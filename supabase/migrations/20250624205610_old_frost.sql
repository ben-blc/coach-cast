/*
  # Update Natalie's Profile with Pricing and Cal.com Link

  1. Changes
    - Add hourly_rate column to ai_coaches table
    - Add cal_com_link column for human coaching bookings
    - Update Natalie's profile with $1000/hour rate and avatar
    - Add pricing information for all coaches

  2. Security
    - Maintains existing RLS policies
    - No changes to existing data structure
*/

-- Add hourly_rate column to ai_coaches table (in cents)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN hourly_rate integer DEFAULT 0;
  END IF;
END $$;

-- Add cal_com_link column for human coaching bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'cal_com_link'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN cal_com_link text;
  END IF;
END $$;

-- Update Natalie's profile with pricing and Cal.com link
UPDATE ai_coaches SET 
  hourly_rate = 100000, -- $1000 in cents
  cal_com_link = 'https://cal.com/natalie-sejean',
  avatar_url = '/natalie.jpeg'
WHERE name = 'Natalie Sejean';

-- Add pricing for AI coaches (lower rates)
UPDATE ai_coaches SET hourly_rate = 2500 WHERE coach_type = 'ai'; -- $25/hour for AI coaches

-- Add comments for new columns
COMMENT ON COLUMN ai_coaches.hourly_rate IS 'Hourly rate in cents (e.g., 100000 = $1000)';
COMMENT ON COLUMN ai_coaches.cal_com_link IS 'Cal.com booking link for human coaches';