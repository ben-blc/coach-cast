/*
  # Initial Schema for Coach Cast Platform

  1. New Tables
    - `profiles` - User profiles with coach/client distinction
    - `subscriptions` - User subscription plans and credits
    - `coaching_sessions` - All coaching session records
    - `session_analytics` - Analytics data for sessions
    - `ai_coaches` - Available AI coach configurations
    - `human_coaches` - Human coach profiles

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for coaches to access their client data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  user_type text CHECK (user_type IN ('client', 'coach')) DEFAULT 'client',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text CHECK (plan_type IN ('free', 'ai_explorer', 'coaching_starter', 'coaching_accelerator')) DEFAULT 'free',
  credits_remaining integer DEFAULT 7,
  monthly_limit integer DEFAULT 7,
  live_sessions_remaining integer DEFAULT 0,
  stripe_subscription_id text,
  status text CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')) DEFAULT 'trialing',
  trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create AI coaches table
CREATE TABLE IF NOT EXISTS ai_coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  description text NOT NULL,
  voice_id text, -- ElevenLabs voice ID
  personality_prompt text NOT NULL,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create human coaches table
CREATE TABLE IF NOT EXISTS human_coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialty text NOT NULL,
  bio text,
  hourly_rate integer, -- in cents
  avatar_url text,
  voice_id text, -- ElevenLabs voice ID for AI clone
  tavus_persona_id text, -- Tavus persona ID for video previews
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create coaching sessions table
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text CHECK (session_type IN ('ai_specialist', 'digital_chemistry', 'human_voice_ai', 'live_human')) NOT NULL,
  ai_coach_id uuid REFERENCES ai_coaches(id),
  human_coach_id uuid REFERENCES human_coaches(id),
  duration_seconds integer DEFAULT 0,
  credits_used integer DEFAULT 1,
  summary text,
  goals text[],
  audio_url text,
  video_url text,
  transcription text,
  status text CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create session analytics table
CREATE TABLE IF NOT EXISTS session_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  sentiment_score real,
  key_topics text[],
  action_items text[],
  progress_notes text,
  created_at timestamptz DEFAULT now()
);

-- Insert default AI coaches
INSERT INTO ai_coaches (name, specialty, description, personality_prompt, avatar_url) VALUES
('Career Growth Coach', 'Professional Development', 'Specialized in career advancement, skill development, and professional goal setting.', 'You are a supportive career coach focused on helping clients advance their professional lives. You ask thoughtful questions about career goals, provide actionable advice, and help identify growth opportunities.', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400'),
('Career Change Coach', 'Career Transition', 'Expert in helping professionals navigate career transitions and discover new paths.', 'You are an empathetic career transition coach who helps clients explore new career possibilities. You focus on transferable skills, passion discovery, and practical transition planning.', 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400'),
('Confidence Coach', 'Self-Esteem & Mindset', 'Focused on building self-confidence, overcoming limiting beliefs, and developing a growth mindset.', 'You are an encouraging confidence coach who helps clients build self-esteem and overcome self-doubt. You use positive psychology techniques and help clients recognize their strengths.', 'https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg?auto=compress&cs=tinysrgb&w=400'),
('Wellness Coach', 'Health & Lifestyle', 'Dedicated to helping clients achieve better work-life balance and overall wellness.', 'You are a holistic wellness coach focused on helping clients achieve balance in all areas of life. You provide guidance on stress management, healthy habits, and sustainable lifestyle changes.', 'https://images.pexels.com/photos/3184294/pexels-photo-3184294.jpeg?auto=compress&cs=tinysrgb&w=400');

-- Insert sample human coaches
INSERT INTO human_coaches (name, specialty, bio, hourly_rate, avatar_url) VALUES
('Natalie', 'Executive Leadership', 'Experienced executive coach with 15+ years helping leaders transform their organizations and personal effectiveness.', 15000, 'https://images.pexels.com/photos/3184295/pexels-photo-3184295.jpeg?auto=compress&cs=tinysrgb&w=400'),
('Fatten', 'Life Transformation', 'Passionate life coach specializing in personal transformation, goal achievement, and creating meaningful life changes.', 12000, 'https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=400');

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_coaches ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for subscriptions
CREATE POLICY "Users can read own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for coaching sessions
CREATE POLICY "Users can read own sessions"
  ON coaching_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON coaching_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON coaching_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for session analytics
CREATE POLICY "Users can read own session analytics"
  ON session_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_sessions 
      WHERE coaching_sessions.id = session_analytics.session_id 
      AND coaching_sessions.user_id = auth.uid()
    )
  );

-- Create policies for AI coaches (public read)
CREATE POLICY "Anyone can read AI coaches"
  ON ai_coaches
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create policies for human coaches (public read)
CREATE POLICY "Anyone can read human coaches"
  ON human_coaches
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create function to handle user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  
  INSERT INTO subscriptions (user_id, plan_type, credits_remaining, monthly_limit)
  VALUES (NEW.id, 'free', 7, 7);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();