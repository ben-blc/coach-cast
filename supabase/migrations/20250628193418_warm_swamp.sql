/*
  # Comprehensive Subscription System with Stripe Integration

  1. New Tables
    - `users_extended` - Extended user information with Stripe customer ID
    - `subscription_plans` - Plan definitions with token allocations
    - `user_subscriptions` - User subscription tracking
    - `subscription_transactions` - Transaction logging with Stripe details

  2. Features
    - Three plans: Starter (50 tokens), Explorer (250 tokens), Accelerator (600 tokens)
    - Track Stripe subscription IDs, transaction IDs, and amounts paid
    - Handle subscription creation, renewals, cancellations, and payment failures
    - Automatic token allocation based on plan
    - Single active subscription per user

  3. Security
    - Enable RLS on all tables
    - Proper policies for user data access
*/

-- Create subscription plan status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_type') THEN
        CREATE TYPE subscription_status_type AS ENUM (
            'active',
            'past_due',
            'canceled',
            'unpaid',
            'trialing',
            'incomplete',
            'incomplete_expired',
            'paused'
        );
    END IF;
END $$;

-- Create transaction event type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_event_type') THEN
        CREATE TYPE transaction_event_type AS ENUM (
            'subscription_created',
            'subscription_renewed',
            'subscription_canceled',
            'payment_failed'
        );
    END IF;
END $$;

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text UNIQUE NOT NULL,
  stripe_product_id text UNIQUE NOT NULL,
  stripe_price_id text UNIQUE NOT NULL,
  tokens_per_month integer NOT NULL,
  price_cents integer NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_product_id text NOT NULL,
  plan_name text NOT NULL,
  status subscription_status_type NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  tokens_allocated integer NOT NULL DEFAULT 0,
  tokens_remaining integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create subscription transactions table
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  stripe_transaction_id text NOT NULL,
  stripe_invoice_id text,
  amount_paid integer NOT NULL,
  tokens_granted integer NOT NULL,
  event_type transaction_event_type NOT NULL,
  stripe_event_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can read own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can read own transactions" ON subscription_transactions;
DROP POLICY IF EXISTS "Service role can manage subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Service role can manage user subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscription transactions" ON subscription_transactions;

-- Create policies for subscription_plans
CREATE POLICY "Anyone can read subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role can manage subscription plans"
  ON subscription_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for user_subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user subscriptions"
  ON user_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for subscription_transactions
CREATE POLICY "Users can read own transactions"
  ON subscription_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription transactions"
  ON subscription_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert subscription plans
INSERT INTO subscription_plans (plan_name, stripe_product_id, stripe_price_id, tokens_per_month, price_cents, description) VALUES
('Starter', 'prod_starter', 'price_1RXeYbEREG4CzjmmBKcnXTHc', 50, 2500, 'Perfect for getting started with AI coaching'),
('Explorer', 'prod_explorer', 'price_1ReBMSEREG4CzjmmiB7ZN5hL', 250, 6900, 'Ideal for regular coaching sessions'),
('Accelerator', 'prod_accelerator', 'price_1ReBNEEREG4CzjmmnOtrbc5F', 600, 12900, 'Maximum coaching with premium features')
ON CONFLICT (plan_name) DO UPDATE SET
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  tokens_per_month = EXCLUDED.tokens_per_month,
  price_cents = EXCLUDED.price_cents,
  description = EXCLUDED.description,
  updated_at = now();

-- Create function to ensure only one active subscription per user
CREATE OR REPLACE FUNCTION ensure_single_active_subscription()
RETURNS trigger AS $$
BEGIN
  -- If this is a new active subscription, deactivate all other active subscriptions for this user
  IF NEW.status = 'active' THEN
    UPDATE user_subscriptions 
    SET 
      status = 'canceled',
      updated_at = now()
    WHERE 
      user_id = NEW.user_id 
      AND id != NEW.id 
      AND status IN ('active', 'trialing', 'past_due');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for single active subscription
DROP TRIGGER IF EXISTS ensure_single_active_subscription_trigger ON user_subscriptions;
CREATE TRIGGER ensure_single_active_subscription_trigger
  BEFORE INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW 
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION ensure_single_active_subscription();

-- Create function to allocate tokens on subscription creation/renewal
CREATE OR REPLACE FUNCTION allocate_subscription_tokens()
RETURNS trigger AS $$
DECLARE
  plan_tokens integer;
BEGIN
  -- Get token allocation for the plan
  SELECT tokens_per_month INTO plan_tokens
  FROM subscription_plans
  WHERE stripe_product_id = NEW.stripe_product_id;
  
  -- Update token allocation if this is a new active subscription or renewal
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status != 'active') THEN
    NEW.tokens_allocated = plan_tokens;
    NEW.tokens_remaining = COALESCE(NEW.tokens_remaining, 0) + plan_tokens;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for token allocation
DROP TRIGGER IF EXISTS allocate_subscription_tokens_trigger ON user_subscriptions;
CREATE TRIGGER allocate_subscription_tokens_trigger
  BEFORE INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW 
  EXECUTE FUNCTION allocate_subscription_tokens();

-- Create function to update user's main subscription record
CREATE OR REPLACE FUNCTION sync_user_subscription()
RETURNS trigger AS $$
DECLARE
  plan_type text;
BEGIN
  -- Map plan names to subscription plan types
  CASE NEW.plan_name
    WHEN 'Starter' THEN plan_type = 'explorer';
    WHEN 'Explorer' THEN plan_type = 'starter';
    WHEN 'Accelerator' THEN plan_type = 'accelerator';
    ELSE plan_type = 'free';
  END CASE;
  
  -- Update the main subscriptions table
  IF NEW.status = 'active' THEN
    INSERT INTO subscriptions (user_id, plan_type, credits_remaining, monthly_limit, stripe_subscription_id, status)
    VALUES (NEW.user_id, plan_type, NEW.tokens_remaining, NEW.tokens_allocated, NEW.stripe_subscription_id, 'active')
    ON CONFLICT (user_id) DO UPDATE SET
      plan_type = EXCLUDED.plan_type,
      credits_remaining = EXCLUDED.credits_remaining,
      monthly_limit = EXCLUDED.monthly_limit,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = EXCLUDED.status,
      updated_at = now();
  ELSIF NEW.status IN ('canceled', 'unpaid') THEN
    UPDATE subscriptions 
    SET 
      plan_type = 'free',
      credits_remaining = 7,
      monthly_limit = 7,
      stripe_subscription_id = NULL,
      status = 'cancelled',
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync with main subscriptions table
DROP TRIGGER IF EXISTS sync_user_subscription_trigger ON user_subscriptions;
CREATE TRIGGER sync_user_subscription_trigger
  AFTER INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW 
  EXECUTE FUNCTION sync_user_subscription();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_product_id ON subscription_plans(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_id ON subscription_plans(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_subscription_id ON subscription_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_stripe_transaction_id ON subscription_transactions(stripe_transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_event_type ON subscription_transactions(event_type);

-- Create view for active user subscriptions
DROP VIEW IF EXISTS active_user_subscriptions;
CREATE VIEW active_user_subscriptions WITH (security_invoker = true) AS
SELECT
    us.id,
    us.user_id,
    us.stripe_customer_id,
    us.stripe_subscription_id,
    us.plan_name,
    us.status,
    us.current_period_start,
    us.current_period_end,
    us.cancel_at_period_end,
    us.tokens_allocated,
    us.tokens_remaining,
    sp.price_cents,
    sp.description as plan_description
FROM user_subscriptions us
JOIN subscription_plans sp ON us.stripe_product_id = sp.stripe_product_id
WHERE us.user_id = auth.uid()
AND us.status = 'active';

-- Grant access to the view
GRANT SELECT ON active_user_subscriptions TO authenticated;

-- Add helpful comments
COMMENT ON TABLE subscription_plans IS 'Defines available subscription plans with Stripe product mapping';
COMMENT ON TABLE user_subscriptions IS 'Tracks user subscriptions with Stripe integration';
COMMENT ON TABLE subscription_transactions IS 'Logs all subscription-related transactions with Stripe details';

COMMENT ON COLUMN subscription_plans.stripe_product_id IS 'Stripe product ID for plan identification';
COMMENT ON COLUMN subscription_plans.stripe_price_id IS 'Stripe price ID for checkout sessions';
COMMENT ON COLUMN subscription_plans.tokens_per_month IS 'Number of tokens allocated per month for this plan';
COMMENT ON COLUMN subscription_plans.price_cents IS 'Plan price in cents (e.g., 2500 = $25.00)';

COMMENT ON COLUMN user_subscriptions.stripe_customer_id IS 'Stripe customer ID for the user';
COMMENT ON COLUMN user_subscriptions.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN user_subscriptions.stripe_product_id IS 'Stripe product ID to identify the plan';
COMMENT ON COLUMN user_subscriptions.tokens_allocated IS 'Tokens allocated for current period';
COMMENT ON COLUMN user_subscriptions.tokens_remaining IS 'Tokens remaining for current period';

COMMENT ON COLUMN subscription_transactions.stripe_transaction_id IS 'Stripe charge or payment intent ID';
COMMENT ON COLUMN subscription_transactions.amount_paid IS 'Amount paid in cents';
COMMENT ON COLUMN subscription_transactions.tokens_granted IS 'Number of tokens granted in this transaction';
COMMENT ON COLUMN subscription_transactions.event_type IS 'Type of event that triggered this transaction';