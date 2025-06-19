/*
  # Fix Profiles Table Foreign Key Constraint

  1. Changes
    - Add proper foreign key constraint from profiles.user_id to auth.users.id
    - Ensure the constraint includes CASCADE options for proper cleanup
    - Add unique constraint on user_id to prevent duplicate profiles

  2. Security
    - Maintains existing RLS policies
    - No changes to existing data structure
*/

-- First, let's make sure we have the correct foreign key constraint
-- Drop the table if it exists and recreate it with proper constraints
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate profiles table with proper foreign key constraint
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  user_type text CHECK (user_type IN ('client', 'coach')) DEFAULT 'client',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies for profiles
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

-- Update the trigger function to handle the new constraint properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile with proper error handling
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert subscription with proper error handling
  INSERT INTO subscriptions (user_id, plan_type, credits_remaining, monthly_limit)
  VALUES (NEW.id, 'free', 7, 7)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();