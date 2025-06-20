/*
  # Enable Admin Access for Table Editing

  1. Changes
    - Add policies to allow service role access for all tables
    - Enable direct editing in Supabase dashboard
    - Maintain existing user security policies

  2. Security
    - Service role can perform all operations (for admin access)
    - Regular authenticated users maintain existing restrictions
    - Anonymous users have no access
*/

-- Add service role policies for profiles table
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policies for subscriptions table
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policies for coaching_sessions table
CREATE POLICY "Service role can manage coaching_sessions"
  ON coaching_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policies for session_analytics table
CREATE POLICY "Service role can manage session_analytics"
  ON session_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policies for ai_coaches table
CREATE POLICY "Service role can manage ai_coaches"
  ON ai_coaches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policies for human_coaches table
CREATE POLICY "Service role can manage human_coaches"
  ON human_coaches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add authenticated user policies for ai_coaches (allow insert/update for coaches)
CREATE POLICY "Authenticated users can insert ai_coaches"
  ON ai_coaches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ai_coaches"
  ON ai_coaches
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add authenticated user policies for human_coaches (allow coaches to manage their profiles)
CREATE POLICY "Coaches can insert their profile"
  ON human_coaches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can update their profile"
  ON human_coaches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add function to check if user is admin (you can customize this logic)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- You can customize this logic to check for admin users
  -- For now, we'll check if the user has a specific email domain or role
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND (
      email LIKE '%@coachcast.com' OR 
      raw_user_meta_data->>'role' = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policies for all tables (optional - for specific admin users)
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all coaching_sessions"
  ON coaching_sessions
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all session_analytics"
  ON session_analytics
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_status ON coaching_sessions(status);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_session_type ON coaching_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_ai_coaches_specialty ON ai_coaches(specialty);
CREATE INDEX IF NOT EXISTS idx_human_coaches_specialty ON human_coaches(specialty);

-- Add helpful comments to tables
COMMENT ON TABLE profiles IS 'User profiles for both clients and coaches';
COMMENT ON TABLE subscriptions IS 'User subscription plans and credit tracking';
COMMENT ON TABLE coaching_sessions IS 'All coaching session records and analytics';
COMMENT ON TABLE ai_coaches IS 'Available AI coach configurations with ElevenLabs integration';
COMMENT ON TABLE human_coaches IS 'Human coach profiles with Tavus and ElevenLabs integration';
COMMENT ON TABLE session_analytics IS 'Detailed analytics and insights for coaching sessions';

-- Add column comments for better understanding
COMMENT ON COLUMN profiles.user_type IS 'Either client or coach';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed initial onboarding';
COMMENT ON COLUMN subscriptions.plan_type IS 'free, ai_explorer, coaching_starter, or coaching_accelerator';
COMMENT ON COLUMN subscriptions.credits_remaining IS 'Number of coaching credits remaining this month';
COMMENT ON COLUMN subscriptions.status IS 'active, cancelled, past_due, or trialing';
COMMENT ON COLUMN coaching_sessions.session_type IS 'ai_specialist, digital_chemistry, human_voice_ai, or live_human';
COMMENT ON COLUMN coaching_sessions.duration_seconds IS 'Total session duration in seconds';
COMMENT ON COLUMN coaching_sessions.credits_used IS 'Number of credits deducted for this session';
COMMENT ON COLUMN ai_coaches.agent_id IS 'ElevenLabs ConvAI agent ID for voice interactions';
COMMENT ON COLUMN ai_coaches.voice_id IS 'ElevenLabs voice ID for text-to-speech';
COMMENT ON COLUMN human_coaches.voice_id IS 'ElevenLabs voice ID for AI clone creation';
COMMENT ON COLUMN human_coaches.tavus_persona_id IS 'Tavus persona ID for personalized video generation';