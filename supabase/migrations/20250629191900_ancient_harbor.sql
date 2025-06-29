-- Create transaction type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_transaction_type') THEN
        CREATE TYPE token_transaction_type AS ENUM (
            'purchase',
            'usage',
            'refund',
            'renewal',
            'bonus'
        );
    END IF;
END $$;

-- Create user_tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_tokens integer NOT NULL DEFAULT 0,
  tokens_remaining integer NOT NULL DEFAULT 0,
  tokens_used integer NOT NULL DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create token_transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES coaching_sessions(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  transaction_type token_transaction_type NOT NULL,
  description text NOT NULL,
  reference_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_tokens
CREATE POLICY "Users can view their own tokens"
  ON user_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all tokens"
  ON user_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for token_transactions
CREATE POLICY "Users can view their own token transactions"
  ON token_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all token transactions"
  ON token_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to get user tokens
CREATE OR REPLACE FUNCTION get_user_tokens(p_user_id uuid)
RETURNS TABLE (
  total_tokens integer,
  tokens_remaining integer,
  tokens_used integer
) AS $$
BEGIN
  -- Check if user has a token record
  IF NOT EXISTS (SELECT 1 FROM user_tokens WHERE user_id = p_user_id) THEN
    -- Create token record if it doesn't exist
    INSERT INTO user_tokens (user_id, total_tokens, tokens_remaining, tokens_used)
    VALUES (p_user_id, 0, 0, 0);
  END IF;

  -- Return token data
  RETURN QUERY
  SELECT 
    ut.total_tokens,
    ut.tokens_remaining,
    ut.tokens_used
  FROM user_tokens ut
  WHERE ut.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add tokens to a user
CREATE OR REPLACE FUNCTION add_user_tokens(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type token_transaction_type,
  p_description text,
  p_reference_id text DEFAULT NULL,
  p_session_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_current_total integer;
  v_current_remaining integer;
BEGIN
  -- Check if amount is positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Token amount must be positive for add_user_tokens';
    RETURN false;
  END IF;

  -- Check if user has a token record
  IF NOT EXISTS (SELECT 1 FROM user_tokens WHERE user_id = p_user_id) THEN
    -- Create token record if it doesn't exist
    INSERT INTO user_tokens (user_id, total_tokens, tokens_remaining, tokens_used)
    VALUES (p_user_id, p_amount, p_amount, 0);
  ELSE
    -- Get current values
    SELECT total_tokens, tokens_remaining
    INTO v_current_total, v_current_remaining
    FROM user_tokens
    WHERE user_id = p_user_id;

    -- Update token record
    UPDATE user_tokens
    SET 
      total_tokens = v_current_total + p_amount,
      tokens_remaining = v_current_remaining + p_amount,
      last_updated = now()
    WHERE user_id = p_user_id;
  END IF;

  -- Record transaction
  INSERT INTO token_transactions (
    user_id,
    session_id,
    amount,
    transaction_type,
    description,
    reference_id
  ) VALUES (
    p_user_id,
    p_session_id,
    p_amount,
    p_transaction_type,
    p_description,
    p_reference_id
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in add_user_tokens: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to use tokens
CREATE OR REPLACE FUNCTION use_user_tokens(
  p_user_id uuid,
  p_amount integer,
  p_description text,
  p_reference_id text DEFAULT NULL,
  p_session_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_current_remaining integer;
BEGIN
  -- Check if amount is positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Token amount must be positive for use_user_tokens';
    RETURN false;
  END IF;

  -- Check if user has a token record
  IF NOT EXISTS (SELECT 1 FROM user_tokens WHERE user_id = p_user_id) THEN
    -- Create token record if it doesn't exist
    INSERT INTO user_tokens (user_id, total_tokens, tokens_remaining, tokens_used)
    VALUES (p_user_id, 0, 0, 0);
    
    -- Not enough tokens
    RETURN false;
  END IF;

  -- Get current remaining tokens
  SELECT tokens_remaining
  INTO v_current_remaining
  FROM user_tokens
  WHERE user_id = p_user_id;

  -- Check if user has enough tokens
  IF v_current_remaining < p_amount THEN
    RETURN false;
  END IF;

  -- Update token record
  UPDATE user_tokens
  SET 
    tokens_remaining = tokens_remaining - p_amount,
    tokens_used = tokens_used + p_amount,
    last_updated = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO token_transactions (
    user_id,
    session_id,
    amount,
    transaction_type,
    description,
    reference_id
  ) VALUES (
    p_user_id,
    p_session_id,
    -p_amount,
    'usage',
    p_description,
    p_reference_id
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in use_user_tokens: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync user tokens with subscription
CREATE OR REPLACE FUNCTION sync_user_tokens(p_user_id uuid DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_subscription record;
  v_tokens record;
BEGIN
  -- If no user ID provided, sync all users
  IF p_user_id IS NULL THEN
    FOR v_user_id IN
      SELECT DISTINCT user_id FROM subscriptions
    LOOP
      PERFORM sync_user_tokens(v_user_id);
    END LOOP;
    RETURN true;
  END IF;

  -- Get user's active subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status IN ('active', 'trialing')
  LIMIT 1;

  -- Get user's tokens
  SELECT * INTO v_tokens
  FROM user_tokens
  WHERE user_id = p_user_id;

  -- If no token record exists, create one
  IF v_tokens IS NULL THEN
    INSERT INTO user_tokens (
      user_id, 
      total_tokens, 
      tokens_remaining, 
      tokens_used
    )
    VALUES (
      p_user_id,
      COALESCE(v_subscription.monthly_limit, 0),
      COALESCE(v_subscription.credits_remaining, 0),
      COALESCE(v_subscription.monthly_limit, 0) - COALESCE(v_subscription.credits_remaining, 0)
    );
  ELSE
    -- Update token record from subscription
    UPDATE user_tokens
    SET 
      total_tokens = COALESCE(v_subscription.monthly_limit, v_tokens.total_tokens),
      tokens_remaining = COALESCE(v_subscription.credits_remaining, v_tokens.tokens_remaining),
      tokens_used = COALESCE(v_subscription.monthly_limit, v_tokens.total_tokens) - COALESCE(v_subscription.credits_remaining, v_tokens.tokens_remaining),
      last_updated = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in sync_user_tokens: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update tokens_used when tokens_remaining changes
CREATE OR REPLACE FUNCTION update_tokens_used()
RETURNS trigger AS $$
BEGIN
  -- Only update tokens_used if tokens_remaining changed
  IF NEW.tokens_remaining != OLD.tokens_remaining THEN
    NEW.tokens_used = NEW.total_tokens - NEW.tokens_remaining;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tokens_used update
DROP TRIGGER IF EXISTS update_tokens_used_trigger ON user_tokens;
CREATE TRIGGER update_tokens_used_trigger
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_tokens_used();

-- Create function to handle subscription changes
CREATE OR REPLACE FUNCTION handle_subscription_change()
RETURNS trigger AS $$
BEGIN
  -- Sync tokens when subscription changes
  PERFORM sync_user_tokens(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription changes
DROP TRIGGER IF EXISTS subscription_change_trigger ON subscriptions;
CREATE TRIGGER subscription_change_trigger
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_change();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user_tokens()
RETURNS trigger AS $$
BEGIN
  -- Create token record for new user
  INSERT INTO user_tokens (user_id, total_tokens, tokens_remaining, tokens_used)
  VALUES (NEW.id, 7, 7, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
DROP TRIGGER IF EXISTS new_user_tokens_trigger ON auth.users;
CREATE TRIGGER new_user_tokens_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_tokens();

-- Create function to handle session completion
CREATE OR REPLACE FUNCTION handle_session_completion()
RETURNS trigger AS $$
BEGIN
  -- Only process when session is completed and has credits_used
  IF NEW.status = 'completed' AND NEW.credits_used > 0 AND 
     (OLD.status != 'completed' OR OLD.credits_used != NEW.credits_used) THEN
    
    -- Use tokens for the session
    PERFORM use_user_tokens(
      NEW.user_id,
      NEW.credits_used,
      'Used for coaching session: ' || NEW.id,
      NEW.id::text,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session completion
DROP TRIGGER IF EXISTS session_completion_trigger ON coaching_sessions;
CREATE TRIGGER session_completion_trigger
  AFTER UPDATE ON coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_session_completion();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_session_id ON token_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);

-- Create view for user token summary
CREATE OR REPLACE VIEW user_token_summary WITH (security_invoker = true) AS
SELECT
  ut.user_id,
  ut.total_tokens,
  ut.tokens_remaining,
  ut.tokens_used,
  ut.last_updated,
  COALESCE(s.plan_type, 'free') as plan_type,
  COALESCE(
    CASE 
      WHEN s.plan_type = 'explorer' THEN 'Explorer'
      WHEN s.plan_type = 'starter' THEN 'Starter'
      WHEN s.plan_type = 'accelerator' THEN 'Accelerator'
      ELSE 'Free'
    END,
    'Free'
  ) as plan_name,
  COALESCE(s.status, 'free') as subscription_status
FROM user_tokens ut
LEFT JOIN subscriptions s ON ut.user_id = s.user_id AND s.status IN ('active', 'trialing')
WHERE ut.user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON user_token_summary TO authenticated;

-- Create view for user token transactions
CREATE OR REPLACE VIEW user_token_transactions WITH (security_invoker = true) AS
SELECT
  tt.id,
  tt.amount,
  tt.transaction_type,
  tt.description,
  tt.reference_id,
  tt.created_at,
  cs.session_type,
  cs.duration_seconds,
  cs.status as session_status,
  c.name as coach_name,
  c.specialty as coach_specialty
FROM token_transactions tt
LEFT JOIN coaching_sessions cs ON tt.session_id = cs.id
LEFT JOIN coaches c ON cs.ai_coach_id = c.id
WHERE tt.user_id = auth.uid()
ORDER BY tt.created_at DESC;

-- Grant access to the view
GRANT SELECT ON user_token_transactions TO authenticated;

-- Initialize tokens for existing users
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  FOR v_user_id IN
    SELECT DISTINCT user_id FROM subscriptions
  LOOP
    -- Sync tokens for each user
    PERFORM sync_user_tokens(v_user_id);
  END LOOP;
END $$;

-- Drop credit_transactions table if it exists
DROP TABLE IF EXISTS credit_transactions;

-- Drop session_analytics table if it exists
DROP TABLE IF EXISTS session_analytics;