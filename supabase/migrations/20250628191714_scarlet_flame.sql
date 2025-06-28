/*
  # Complete Stripe Integration and Credit Transactions

  1. New Tables
    - `stripe_customers`: Links Supabase users to Stripe customers
    - `stripe_subscriptions`: Manages subscription data with status tracking
    - `stripe_orders`: Stores order/purchase information
    - `credit_transactions`: Track all credit additions and deductions

  2. Views
    - `stripe_user_subscriptions`: Secure view for user subscription data
    - `stripe_user_orders`: Secure view for user order history

  3. Security
    - Enables Row Level Security (RLS) on all tables
    - Implements policies for authenticated users to view their own data
    - Service role policies for admin access
*/

-- Create enums only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_type') THEN
        CREATE TYPE credit_transaction_type AS ENUM (
            'purchase',
            'renewal', 
            'usage',
            'refund',
            'bonus'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_subscription_status') THEN
        CREATE TYPE stripe_subscription_status AS ENUM (
            'not_started',
            'incomplete',
            'incomplete_expired',
            'trialing',
            'active',
            'past_due',
            'canceled',
            'unpaid',
            'paused'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_order_status') THEN
        CREATE TYPE stripe_order_status AS ENUM (
            'pending',
            'completed',
            'canceled'
        );
    END IF;
END $$;

-- Create stripe_customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) not null unique,
  customer_id text not null unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

-- Create stripe_subscriptions table
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id bigint primary key generated always as identity,
  customer_id text unique not null,
  subscription_id text default null,
  price_id text default null,
  current_period_start bigint default null,
  current_period_end bigint default null,
  cancel_at_period_end boolean default false,
  payment_method_brand text default null,
  payment_method_last4 text default null,
  status stripe_subscription_status not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

-- Create stripe_orders table
CREATE TABLE IF NOT EXISTS stripe_orders (
    id bigint primary key generated always as identity,
    checkout_session_id text not null,
    payment_intent_id text not null,
    customer_id text not null,
    amount_subtotal bigint not null,
    amount_total bigint not null,
    currency text not null,
    payment_status text not null,
    status stripe_order_status not null default 'pending',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    deleted_at timestamp with time zone default null
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type credit_transaction_type NOT NULL,
  credits_amount integer NOT NULL,
  description text NOT NULL,
  stripe_subscription_id text,
  stripe_invoice_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Service role can manage stripe_customers" ON stripe_customers;
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Service role can manage stripe_subscriptions" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;
DROP POLICY IF EXISTS "Service role can manage stripe_orders" ON stripe_orders;
DROP POLICY IF EXISTS "Users can read own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Service role can manage all credit transactions" ON credit_transactions;

-- Create policies for stripe_customers
CREATE POLICY "Users can view their own customer data"
    ON stripe_customers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Service role can manage stripe_customers"
    ON stripe_customers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create policies for stripe_subscriptions
CREATE POLICY "Users can view their own subscription data"
    ON stripe_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Service role can manage stripe_subscriptions"
    ON stripe_subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create policies for stripe_orders
CREATE POLICY "Users can view their own order data"
    ON stripe_orders
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Service role can manage stripe_orders"
    ON stripe_orders
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create policies for credit_transactions
CREATE POLICY "Users can read own credit transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credit transactions"
  ON credit_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON stripe_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_subscription_id ON stripe_subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_customer_id ON stripe_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_checkout_session_id ON stripe_orders(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Create secure view for user subscriptions (drop and recreate to avoid conflicts)
DROP VIEW IF EXISTS stripe_user_subscriptions;
CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (s.deleted_at IS NULL OR s.deleted_at IS NULL);

-- Grant access to the view
GRANT SELECT ON stripe_user_subscriptions TO authenticated;

-- Create secure view for user orders (drop and recreate to avoid conflicts)
DROP VIEW IF EXISTS stripe_user_orders;
CREATE VIEW stripe_user_orders WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    o.id as order_id,
    o.checkout_session_id,
    o.payment_intent_id,
    o.amount_subtotal,
    o.amount_total,
    o.currency,
    o.payment_status,
    o.status as order_status,
    o.created_at as order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (o.deleted_at IS NULL OR o.deleted_at IS NULL);

-- Grant access to the view
GRANT SELECT ON stripe_user_orders TO authenticated;

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

-- Add indexes for better performance on subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Add helpful comments to tables
COMMENT ON TABLE stripe_customers IS 'Links Supabase users to Stripe customers';
COMMENT ON TABLE stripe_subscriptions IS 'Manages Stripe subscription data with status tracking';
COMMENT ON TABLE stripe_orders IS 'Stores Stripe order/purchase information';
COMMENT ON TABLE credit_transactions IS 'Track all credit additions and deductions for users';

-- Add column comments for better understanding
COMMENT ON COLUMN stripe_customers.user_id IS 'Reference to Supabase auth.users';
COMMENT ON COLUMN stripe_customers.customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN stripe_subscriptions.customer_id IS 'Reference to Stripe customer';
COMMENT ON COLUMN stripe_subscriptions.subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN stripe_subscriptions.price_id IS 'Stripe price ID for the subscription';
COMMENT ON COLUMN stripe_subscriptions.status IS 'Current subscription status from Stripe';
COMMENT ON COLUMN stripe_subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
COMMENT ON COLUMN credit_transactions.user_id IS 'Reference to the user who owns this transaction';
COMMENT ON COLUMN credit_transactions.transaction_type IS 'Type of transaction: purchase, renewal, usage, refund, bonus';
COMMENT ON COLUMN credit_transactions.credits_amount IS 'Amount of credits (positive for additions, negative for deductions)';
COMMENT ON COLUMN credit_transactions.description IS 'Human-readable description of the transaction';
COMMENT ON COLUMN credit_transactions.stripe_subscription_id IS 'Optional reference to Stripe subscription';
COMMENT ON COLUMN credit_transactions.stripe_invoice_id IS 'Optional reference to Stripe invoice';
COMMENT ON FUNCTION handle_subscription_update() IS 'Ensures only one active Stripe subscription per user';
COMMENT ON TRIGGER on_subscription_update ON subscriptions IS 'Automatically cancels old subscriptions when new one becomes active';