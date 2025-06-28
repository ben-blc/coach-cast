/*
  # Credit Transactions Table

  1. New Tables
    - `credit_transactions` - Track all credit additions and deductions
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `transaction_type` (enum: purchase, renewal, usage, refund, bonus)
      - `credits_amount` (integer, positive for additions, negative for deductions)
      - `description` (text, human-readable description)
      - `stripe_subscription_id` (text, optional reference to Stripe)
      - `stripe_invoice_id` (text, optional reference to Stripe)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for users to view their own transactions
    - Add policies for service role to manage all transactions
*/

-- Create transaction type enum (with proper error handling)
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

-- Enable Row Level Security
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Add comments
COMMENT ON TABLE credit_transactions IS 'Track all credit additions and deductions for users';
COMMENT ON COLUMN credit_transactions.user_id IS 'Reference to the user who owns this transaction';
COMMENT ON COLUMN credit_transactions.transaction_type IS 'Type of transaction: purchase, renewal, usage, refund, bonus';
COMMENT ON COLUMN credit_transactions.credits_amount IS 'Amount of credits (positive for additions, negative for deductions)';
COMMENT ON COLUMN credit_transactions.description IS 'Human-readable description of the transaction';
COMMENT ON COLUMN credit_transactions.stripe_subscription_id IS 'Optional reference to Stripe subscription';
COMMENT ON COLUMN credit_transactions.stripe_invoice_id IS 'Optional reference to Stripe invoice';