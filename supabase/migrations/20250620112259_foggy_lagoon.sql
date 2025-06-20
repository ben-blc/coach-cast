/*
  # Fix Profile Creation for New Users

  1. New Functions
    - Enhanced trigger function with better error handling
    - Manual profile creation function for existing users
    - Function to ensure all users have profiles

  2. Security
    - Maintain existing RLS policies
    - Add proper error handling and logging
*/

-- Create or replace the trigger function with enhanced error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  profile_exists boolean := false;
  subscription_exists boolean := false;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = NEW.id) INTO profile_exists;
  
  -- Check if subscription already exists
  SELECT EXISTS(SELECT 1 FROM subscriptions WHERE user_id = NEW.id) INTO subscription_exists;
  
  -- Insert profile if it doesn't exist
  IF NOT profile_exists THEN
    INSERT INTO profiles (user_id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
    );
    
    RAISE LOG 'Created profile for user: %', NEW.id;
  END IF;
  
  -- Insert subscription if it doesn't exist
  IF NOT subscription_exists THEN
    INSERT INTO subscriptions (user_id, plan_type, credits_remaining, monthly_limit)
    VALUES (NEW.id, 'free', 7, 7);
    
    RAISE LOG 'Created subscription for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually create profile for existing users
CREATE OR REPLACE FUNCTION create_user_profile(user_uuid uuid, user_email text, user_full_name text DEFAULT 'User')
RETURNS boolean AS $$
DECLARE
  profile_created boolean := false;
  subscription_created boolean := false;
BEGIN
  -- Try to insert profile
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (user_uuid, user_email, user_full_name)
  ON CONFLICT (user_id) DO NOTHING;
  
  GET DIAGNOSTICS profile_created = ROW_COUNT;
  
  -- Try to insert subscription
  INSERT INTO subscriptions (user_id, plan_type, credits_remaining, monthly_limit)
  VALUES (user_uuid, 'free', 7, 7)
  ON CONFLICT (user_id) DO NOTHING;
  
  GET DIAGNOSTICS subscription_created = ROW_COUNT;
  
  RETURN (profile_created > 0 OR subscription_created > 0);
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', user_uuid, SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure all existing auth users have profiles
CREATE OR REPLACE FUNCTION ensure_all_users_have_profiles()
RETURNS integer AS $$
DECLARE
  user_record RECORD;
  created_count integer := 0;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.user_id
    WHERE p.user_id IS NULL
  LOOP
    IF create_user_profile(
      user_record.id, 
      user_record.email, 
      COALESCE(user_record.raw_user_meta_data->>'full_name', 'User')
    ) THEN
      created_count := created_count + 1;
    END IF;
  END LOOP;
  
  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Run the function to create profiles for any existing users without them
SELECT ensure_all_users_have_profiles();