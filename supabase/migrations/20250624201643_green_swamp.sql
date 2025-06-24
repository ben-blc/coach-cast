/*
  # Coaching Studio Database Updates

  1. Changes
    - Add coach_type column to distinguish human vs AI coaches
    - Add session_types array to specify available session types
    - Update existing AI coaches with coach_type = 'ai'
    - Add Natalie as first human coach
    - Add session type options for filtering

  2. Session Types
    - audio_ai: Audio session with AI (ElevenLabs)
    - video_ai: Video session with AI (Tavus) 
    - human_coaching: Live session with human coach (Cal.com)

  3. Security
    - Maintains existing RLS policies
*/

-- Add coach_type column to ai_coaches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'coach_type'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN coach_type text CHECK (coach_type IN ('ai', 'human')) DEFAULT 'ai';
  END IF;
END $$;

-- Add session_types column to ai_coaches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'session_types'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN session_types text[] DEFAULT ARRAY['audio_ai'];
  END IF;
END $$;

-- Add years_experience column to ai_coaches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN years_experience text;
  END IF;
END $$;

-- Add bio column to ai_coaches table (for human coaches)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'bio'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN bio text;
  END IF;
END $$;

-- Update existing AI coaches to have coach_type = 'ai' and session_types
UPDATE ai_coaches SET 
  coach_type = 'ai',
  session_types = ARRAY['audio_ai']
WHERE coach_type IS NULL;

-- Add Natalie as the first human coach
INSERT INTO ai_coaches (
  name, 
  specialty, 
  description, 
  bio,
  years_experience,
  coach_type,
  session_types,
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
  'You are Natalie Sejean, a Strategic HR Consultant and Business Coach with over 30 years of experience. You specialize in leadership development and aligning people strategies with business goals. Your coaching style is experiential and insightful, helping clients navigate complex change and build high-performing cultures.',
  'https://images.pexels.com/photos/3184295/pexels-photo-3184295.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
) ON CONFLICT DO NOTHING;

-- Update AI coach names to be more distinctive
UPDATE ai_coaches SET name = 'Sprint AI' WHERE name = 'Career Growth Coach';
UPDATE ai_coaches SET name = 'Pivot AI' WHERE name = 'Career Change Coach';
UPDATE ai_coaches SET name = 'Confidence AI' WHERE name = 'Confidence Coach';
UPDATE ai_coaches SET name = 'Balance AI' WHERE name = 'Wellness Coach';

-- Add comments for new columns
COMMENT ON COLUMN ai_coaches.coach_type IS 'Type of coach: ai or human';
COMMENT ON COLUMN ai_coaches.session_types IS 'Available session types: audio_ai, video_ai, human_coaching';
COMMENT ON COLUMN ai_coaches.years_experience IS 'Years of experience for human coaches';
COMMENT ON COLUMN ai_coaches.bio IS 'Detailed biography for human coaches';

-- Create index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_ai_coaches_coach_type ON ai_coaches(coach_type);
CREATE INDEX IF NOT EXISTS idx_ai_coaches_session_types ON ai_coaches USING GIN(session_types);