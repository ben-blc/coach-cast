/*
  # Update Plan Types in Subscriptions Table

  1. Changes
    - Update plan_type column in subscriptions table to use new naming convention
    - Change from 'ai_explorer', 'coaching_starter', 'coaching_accelerator' to 'explorer', 'starter', 'accelerator'
    - Update existing subscriptions to use new plan types
    - Update check constraint to enforce new plan types

  2. Security
    - Maintains existing RLS policies
    - No changes to existing data structure beyond plan type names
*/

-- Update the check constraint for plan_type column
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check 
  CHECK (plan_type IN ('free', 'explorer', 'starter', 'accelerator'));

-- Update existing subscriptions to use new plan types
UPDATE subscriptions SET plan_type = 'explorer' WHERE plan_type = 'ai_explorer';
UPDATE subscriptions SET plan_type = 'starter' WHERE plan_type = 'coaching_starter';
UPDATE subscriptions SET plan_type = 'accelerator' WHERE plan_type = 'coaching_accelerator';

-- Add comment for clarity
COMMENT ON COLUMN subscriptions.plan_type IS 'Subscription plan type: free, explorer, starter, or accelerator';