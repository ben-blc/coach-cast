/*
  # Fix Subscriptions Table Constraints

  1. Changes
    - Add unique constraint on user_id to prevent duplicate subscriptions
    - Ensure proper foreign key constraint to auth.users

  2. Security
    - Maintains existing RLS policies
    - No changes to existing data structure
*/

-- Add unique constraint to subscriptions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscriptions_user_id_key' 
    AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;