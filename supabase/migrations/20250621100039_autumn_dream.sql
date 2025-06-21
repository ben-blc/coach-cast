/*
  # Add Conversation ID to Coaching Sessions

  1. Changes
    - Add conversation_id column to coaching_sessions table
    - This will store ElevenLabs conversation IDs like conv_01jy77cne1fawtkasggkbadeg6

  2. Security
    - Maintains existing RLS policies
    - No changes to existing data structure
*/

-- Add conversation_id column to coaching_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaching_sessions' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE coaching_sessions ADD COLUMN conversation_id text;
  END IF;
END $$;

-- Add index for better performance when querying by conversation_id
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_conversation_id ON coaching_sessions(conversation_id);

-- Add comment for the new column
COMMENT ON COLUMN coaching_sessions.conversation_id IS 'ElevenLabs conversation ID (e.g., conv_01jy77cne1fawtkasggkbadeg6)';