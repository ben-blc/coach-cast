/*
  # Create Coaching Session Goals Table

  1. New Tables
    - `coaching_sessions_goals` - Individual goals for coaching sessions
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to coaching_sessions)
      - `goal_text` (text, the goal description)
      - `is_completed` (boolean, completion status)
      - `completed_at` (timestamp, when marked complete)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on goals table
    - Add policies for users to access their own session goals
*/

-- Create coaching_sessions_goals table
CREATE TABLE IF NOT EXISTS coaching_sessions_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  goal_text text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_goals_session_id ON coaching_sessions_goals(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_goals_completed ON coaching_sessions_goals(is_completed);

-- Enable Row Level Security
ALTER TABLE coaching_sessions_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for coaching_sessions_goals
CREATE POLICY "Users can read own session goals"
  ON coaching_sessions_goals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_sessions 
      WHERE coaching_sessions.id = coaching_sessions_goals.session_id 
      AND coaching_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session goals"
  ON coaching_sessions_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaching_sessions 
      WHERE coaching_sessions.id = coaching_sessions_goals.session_id 
      AND coaching_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session goals"
  ON coaching_sessions_goals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_sessions 
      WHERE coaching_sessions.id = coaching_sessions_goals.session_id 
      AND coaching_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaching_sessions 
      WHERE coaching_sessions.id = coaching_sessions_goals.session_id 
      AND coaching_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session goals"
  ON coaching_sessions_goals
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_sessions 
      WHERE coaching_sessions.id = coaching_sessions_goals.session_id 
      AND coaching_sessions.user_id = auth.uid()
    )
  );

-- Service role policies for admin access
CREATE POLICY "Service role can manage all goals"
  ON coaching_sessions_goals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE coaching_sessions_goals IS 'Individual goals extracted from or added to coaching sessions';
COMMENT ON COLUMN coaching_sessions_goals.session_id IS 'Reference to the coaching session';
COMMENT ON COLUMN coaching_sessions_goals.goal_text IS 'The goal description or action item';
COMMENT ON COLUMN coaching_sessions_goals.is_completed IS 'Whether the goal has been completed';
COMMENT ON COLUMN coaching_sessions_goals.completed_at IS 'When the goal was marked as completed';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coaching_sessions_goals_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_coaching_sessions_goals_updated_at
  BEFORE UPDATE ON coaching_sessions_goals
  FOR EACH ROW EXECUTE FUNCTION update_coaching_sessions_goals_updated_at();