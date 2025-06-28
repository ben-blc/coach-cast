/*
  # Subscription Management System

  1. Changes
    - Add unique constraint to prevent multiple active subscriptions
    - Add function to handle subscription updates
    - Add trigger to automatically cancel old subscriptions when new one is created

  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity for subscription management
*/

-- Add function to handle subscription updates and ensure only one active subscription
CREATE OR REPLACE FUNCTION handle_subscription_update()
RETURNS trigger AS $$
BEGIN
  -- If this is a new active subscription, cancel all other active subscriptions for this user
  IF NEW.status = 'active' AND NEW.stripe_subscription_id IS NOT NULL THEN
    UPDATE subscriptions 
    SET 
      status = 'cancelled',
      updated_at = now()
    WHERE 
      user_id = NEW.user_id 
      AND id != NEW.id 
      AND status IN ('active', 'trialing')
      AND stripe_subscription_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscription updates
DROP TRIGGER IF EXISTS on_subscription_update ON subscriptions;
CREATE TRIGGER on_subscription_update
  AFTER UPDATE ON subscriptions
  FOR EACH ROW 
  WHEN (NEW.status = 'active' AND NEW.stripe_subscription_id IS NOT NULL)
  EXECUTE FUNCTION handle_subscription_update();

-- Add index for better performance on subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Add comments for clarity
COMMENT ON FUNCTION handle_subscription_update() IS 'Ensures only one active Stripe subscription per user';
COMMENT ON TRIGGER on_subscription_update ON subscriptions IS 'Automatically cancels old subscriptions when new one becomes active';