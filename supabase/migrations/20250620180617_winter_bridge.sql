/*
  # Add Agent ID to AI Coaches

  1. Changes
    - Add agent_id column to ai_coaches table for ElevenLabs integration
    - Update existing coaches with sample agent IDs

  2. Security
    - Maintains existing RLS policies
    - No changes to existing data structure
*/

-- Add agent_id column to ai_coaches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_coaches' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE ai_coaches ADD COLUMN agent_id text;
  END IF;
END $$;

-- Update existing AI coaches with sample agent IDs
UPDATE ai_coaches SET agent_id = 'agent_01jxwx5htbedvv36tk7v8g1b49' WHERE name = 'Career Growth Coach';
UPDATE ai_coaches SET agent_id = 'agent_01jxwx5htbedvv36tk7v8g1b49' WHERE name = 'Career Change Coach';
UPDATE ai_coaches SET agent_id = 'agent_01jxwx5htbedvv36tk7v8g1b49' WHERE name = 'Confidence Coach';
UPDATE ai_coaches SET agent_id = 'agent_01jxwx5htbedvv36tk7v8g1b49' WHERE name = 'Wellness Coach';