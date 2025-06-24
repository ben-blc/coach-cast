/*
  # Unified Coaches Table Migration - Final Clean Version

  1. Changes
    - Add unique constraint on name column for ON CONFLICT to work
    - Add all necessary columns to ai_coaches table
    - Migrate human coaches data safely
    - Update existing AI coaches with proper values
    - Clean up old human_coaches table and references

  2. Security
    - Maintains existing RLS policies
    - Updates policies for unified table structure
*/

-- First, add unique constraint on name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ai_coaches_name_key' 
    AND table_name = 'ai_coaches'
  ) THEN
    ALTER TABLE ai_coaches ADD CONSTRAINT ai_coaches_name_key UNIQUE (name);
  END IF;
END $$;

-- Add all necessary columns to ai_coaches table
DO $$
BEGIN
  -- Add coach_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'coach_type'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN coach_type text CHECK (coach_type IN ('ai', 'human')) DEFAULT 'ai';
  END IF;

  -- Add session_types column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'session_types'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN session_types text[] DEFAULT ARRAY['audio_ai'];
  END IF;

  -- Add years_experience column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN years_experience text;
  END IF;

  -- Add bio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'bio'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN bio text;
  END IF;

  -- Add hourly_rate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN hourly_rate integer DEFAULT 0;
  END IF;

  -- Add cal_com_link column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'cal_com_link'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN cal_com_link text;
  END IF;
END $$;

-- Update existing AI coaches with proper values
UPDATE ai_coaches SET 
  coach_type = 'ai',
  session_types = ARRAY['audio_ai'],
  hourly_rate = 2500 -- $25/hour for AI coaches
WHERE coach_type IS NULL;

-- Migrate data from human_coaches table if it exists
DO $$
DECLARE
    human_coach_record RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'human_coaches') THEN
    -- Loop through each human coach and insert into ai_coaches
    FOR human_coach_record IN 
      SELECT 
        name,
        specialty,
        COALESCE(bio, 'Experienced human coach') as description,
        bio,
        COALESCE(hourly_rate, 15000) as hourly_rate,
        avatar_url,
        is_active,
        created_at
      FROM human_coaches 
      WHERE is_active = true
    LOOP
      INSERT INTO ai_coaches (
        name, 
        specialty, 
        description, 
        bio,
        coach_type,
        session_types,
        hourly_rate,
        cal_com_link,
        avatar_url,
        personality_prompt,
        is_active,
        created_at
      ) VALUES (
        human_coach_record.name,
        human_coach_record.specialty,
        human_coach_record.description,
        human_coach_record.bio,
        'human',
        ARRAY['audio_ai', 'video_ai', 'human_coaching'],
        human_coach_record.hourly_rate,
        'https://cal.com/' || lower(replace(human_coach_record.name, ' ', '-')),
        human_coach_record.avatar_url,
        'You are ' || human_coach_record.name || ', a professional coach specializing in ' || human_coach_record.specialty || '.',
        human_coach_record.is_active,
        human_coach_record.created_at
      ) ON CONFLICT (name) DO UPDATE SET
        bio = EXCLUDED.bio,
        hourly_rate = EXCLUDED.hourly_rate,
        cal_com_link = EXCLUDED.cal_com_link,
        avatar_url = EXCLUDED.avatar_url,
        coach_type = EXCLUDED.coach_type,
        session_types = EXCLUDED.session_types;
    END LOOP;
  END IF;
END $$;

-- Update AI coach names to be more distinctive
UPDATE ai_coaches SET name = 'Sprint AI' WHERE name = 'Career Growth Coach' AND coach_type = 'ai';
UPDATE ai_coaches SET name = 'Pivot AI' WHERE name = 'Career Change Coach' AND coach_type = 'ai';
UPDATE ai_coaches SET name = 'Confidence AI' WHERE name = 'Confidence Coach' AND coach_type = 'ai';
UPDATE ai_coaches SET name = 'Balance AI' WHERE name = 'Wellness Coach' AND coach_type = 'ai';

-- Add Natalie Sejean as human coach
INSERT INTO ai_coaches (
  name, 
  specialty, 
  description, 
  bio,
  years_experience,
  coach_type,
  session_types,
  hourly_rate,
  cal_com_link,
  personality_prompt, 
  avatar_url,
  is_active
) VALUES (
  'Natalie Sejean',
  'Career, Developmental, Leadership Coaching',
  'Strategic HR Consultant and Business Coach with 30+ years of international experience.',
  'Natalie Sejean is a Strategic HR Consultant and Business Coach with over 30 years of experience across the Middle East, Europe, and Asia. She specialises in unlocking leadership potential and aligning people strategies with business goals. Known for her experiential coaching style and deep cross-sector insight, Natalie supports clients in navigating complex change, building high-performing cultures, and driving meaningful organisational impact.',
  '30+',
  'human',
  ARRAY['audio_ai', 'video_ai', 'human_coaching'],
  100000, -- $1000/hour
  'https://cal.com/natalie-sejean',
  'You are Natalie Sejean, a Strategic HR Consultant and Business Coach with over 30 years of experience. You specialize in leadership development and aligning people strategies with business goals. Your coaching style is experiential and insightful, helping clients navigate complex change and build high-performing cultures.',
  '/natalie.jpeg',
  true
) ON CONFLICT (name) DO UPDATE SET
  bio = EXCLUDED.bio,
  years_experience = EXCLUDED.years_experience,
  hourly_rate = EXCLUDED.hourly_rate,
  cal_com_link = EXCLUDED.cal_com_link,
  avatar_url = EXCLUDED.avatar_url,
  coach_type = EXCLUDED.coach_type,
  session_types = EXCLUDED.session_types;

-- Add Fatten as human coach
INSERT INTO ai_coaches (
  name, 
  specialty, 
  description, 
  bio,
  years_experience,
  coach_type,
  session_types,
  hourly_rate,
  cal_com_link,
  personality_prompt, 
  avatar_url,
  is_active
) VALUES (
  'Fatten',
  'Life Transformation',
  'Passionate life coach specializing in personal transformation and goal achievement.',
  'Passionate life coach specializing in personal transformation, goal achievement, and creating meaningful life changes.',
  '10+',
  'human',
  ARRAY['audio_ai', 'video_ai', 'human_coaching'],
  12000, -- $120/hour
  'https://cal.com/fatten',
  'You are Fatten, a passionate life coach specializing in personal transformation and goal achievement. You help clients create meaningful life changes and achieve their goals.',
  'https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
) ON CONFLICT (name) DO UPDATE SET
  bio = EXCLUDED.bio,
  years_experience = EXCLUDED.years_experience,
  hourly_rate = EXCLUDED.hourly_rate,
  cal_com_link = EXCLUDED.cal_com_link,
  coach_type = EXCLUDED.coach_type,
  session_types = EXCLUDED.session_types;

-- Update coaching_sessions to reference unified table
DO $$
BEGIN
  -- Update sessions that reference human coaches to use ai_coaches
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'human_coaches') THEN
    UPDATE coaching_sessions cs
    SET ai_coach_id = ac.id
    FROM ai_coaches ac, human_coaches hc
    WHERE cs.human_coach_id = hc.id 
    AND ac.name = hc.name 
    AND ac.coach_type = 'human'
    AND cs.ai_coach_id IS NULL;
  END IF;
END $$;

-- Remove human_coach_id column from coaching_sessions if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaching_sessions' AND column_name = 'human_coach_id'
  ) THEN
    -- First remove any foreign key constraints
    ALTER TABLE coaching_sessions DROP CONSTRAINT IF EXISTS coaching_sessions_human_coach_id_fkey;
    -- Then drop the column
    ALTER TABLE coaching_sessions DROP COLUMN human_coach_id;
  END IF;
END $$;

-- Drop human_coaches table if it exists
DROP TABLE IF EXISTS human_coaches CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_coaches_coach_type ON ai_coaches(coach_type);
CREATE INDEX IF NOT EXISTS idx_ai_coaches_session_types ON ai_coaches USING GIN(session_types);

-- Update comments for new columns
COMMENT ON COLUMN ai_coaches.coach_type IS 'Type of coach: ai or human';
COMMENT ON COLUMN ai_coaches.session_types IS 'Available session types: audio_ai, video_ai, human_coaching';
COMMENT ON COLUMN ai_coaches.years_experience IS 'Years of experience for human coaches';
COMMENT ON COLUMN ai_coaches.bio IS 'Detailed biography for human coaches';
COMMENT ON COLUMN ai_coaches.hourly_rate IS 'Hourly rate in cents (e.g., 100000 = $1000)';
COMMENT ON COLUMN ai_coaches.cal_com_link IS 'Cal.com booking link for human coaches';

-- Update RLS policies for unified table
DROP POLICY IF EXISTS "Anyone can read human coaches" ON ai_coaches;
DROP POLICY IF EXISTS "Anyone can read all coaches" ON ai_coaches;

CREATE POLICY "Anyone can read all coaches"
  ON ai_coaches
  FOR SELECT
  TO authenticated
  USING (is_active = true);