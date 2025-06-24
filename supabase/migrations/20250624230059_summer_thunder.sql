/*
  # Rename ai_coaches table to coaches and update columns

  1. Changes
    - Rename ai_coaches table to coaches
    - Remove voice_id column
    - Rename agent_id column to agent_id_eleven_labs
    - Update all foreign key references
    - Update RLS policies

  2. Security
    - Maintains existing RLS policies with new table name
    - Updates all references to use new table structure
*/

-- Rename ai_coaches table to coaches
ALTER TABLE ai_coaches RENAME TO coaches;

-- Remove voice_id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'voice_id'
  ) THEN
    ALTER TABLE coaches DROP COLUMN voice_id;
  END IF;
END $$;

-- Rename agent_id column to agent_id_eleven_labs if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE coaches RENAME COLUMN agent_id TO agent_id_eleven_labs;
  END IF;
END $$;

-- Update foreign key constraint in coaching_sessions table
DO $$
BEGIN
  -- Drop old constraint if it exists
  ALTER TABLE coaching_sessions DROP CONSTRAINT IF EXISTS coaching_sessions_ai_coach_id_fkey;
  
  -- Add new constraint with updated table name
  ALTER TABLE coaching_sessions ADD CONSTRAINT coaching_sessions_ai_coach_id_fkey 
    FOREIGN KEY (ai_coach_id) REFERENCES coaches(id);
END $$;

-- Update indexes with new table name
DROP INDEX IF EXISTS idx_ai_coaches_coach_type;
DROP INDEX IF EXISTS idx_ai_coaches_session_types;
DROP INDEX IF EXISTS idx_ai_coaches_specialty;

CREATE INDEX IF NOT EXISTS idx_coaches_coach_type ON coaches(coach_type);
CREATE INDEX IF NOT EXISTS idx_coaches_session_types ON coaches USING GIN(session_types);
CREATE INDEX IF NOT EXISTS idx_coaches_specialty ON coaches(specialty);

-- Update RLS policies with new table name
DROP POLICY IF EXISTS "Anyone can read AI coaches" ON coaches;
DROP POLICY IF EXISTS "Anyone can read all coaches" ON coaches;
DROP POLICY IF EXISTS "Authenticated users can insert ai_coaches" ON coaches;
DROP POLICY IF EXISTS "Authenticated users can update ai_coaches" ON coaches;
DROP POLICY IF EXISTS "Service role can manage ai_coaches" ON coaches;
DROP POLICY IF EXISTS "Admins can manage all ai_coaches" ON coaches;

-- Recreate policies with new table name
CREATE POLICY "Anyone can read all coaches"
  ON coaches
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert coaches"
  ON coaches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update coaches"
  ON coaches
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage coaches"
  ON coaches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update comments
COMMENT ON TABLE coaches IS 'Unified table for both AI and human coaches';
COMMENT ON COLUMN coaches.agent_id_eleven_labs IS 'ElevenLabs ConvAI agent ID for voice interactions';
COMMENT ON COLUMN coaches.coach_type IS 'Type of coach: ai or human';
COMMENT ON COLUMN coaches.session_types IS 'Available session types: audio_ai, video_ai, human_coaching';
COMMENT ON COLUMN coaches.years_experience IS 'Years of experience for human coaches';
COMMENT ON COLUMN coaches.bio IS 'Detailed biography for human coaches';
COMMENT ON COLUMN coaches.hourly_rate IS 'Hourly rate in cents (e.g., 100000 = $1000)';
COMMENT ON COLUMN coaches.cal_com_link IS 'Cal.com booking link for human coaches';