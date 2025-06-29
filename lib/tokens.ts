import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface UserTokens {
  total_tokens: number;
  tokens_remaining: number;
  tokens_used: number;
  last_updated: string;
  plan_type: string;
  plan_name: string;
  subscription_status: string;
}

export interface TokenTransaction {
  id: string;
  amount: number;
  transaction_type: 'purchase' | 'usage' | 'refund' | 'renewal' | 'bonus';
  description: string;
  reference_id?: string;
  created_at: string;
  session_type?: string;
  duration_seconds?: number;
  session_status?: string;
  coach_name?: string;
  coach_specialty?: string;
}

/**
 * Get the current user's token balance
 */
export async function getUserTokens(): Promise<UserTokens | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_token_summary')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching user tokens:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserTokens:', error);
    return null;
  }
}

/**
 * Get the user's token transaction history
 */
export async function getUserTokenTransactions(): Promise<TokenTransaction[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_token_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching token transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserTokenTransactions:', error);
    return [];
  }
}

/**
 * Add tokens to a user's balance
 */
export async function addUserTokens(
  amount: number,
  transactionType: 'purchase' | 'renewal' | 'bonus',
  description: string,
  referenceId?: string
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('add_user_tokens', {
      p_user_id: user.id,
      p_amount: amount,
      p_transaction_type: transactionType,
      p_description: description,
      p_reference_id: referenceId
    });

    if (error) {
      console.error('Error adding user tokens:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Error in addUserTokens:', error);
    return false;
  }
}

/**
 * Use tokens from a user's balance
 */
export async function useUserTokens(
  amount: number,
  description: string,
  sessionId?: string,
  referenceId?: string
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('use_user_tokens', {
      p_user_id: user.id,
      p_amount: amount,
      p_description: description,
      p_reference_id: referenceId,
      p_session_id: sessionId
    });

    if (error) {
      console.error('Error using user tokens:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Error in useUserTokens:', error);
    return false;
  }
}

/**
 * Sync user tokens with subscription data
 */
export async function syncUserTokens(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('sync_user_tokens', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error syncing user tokens:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Error in syncUserTokens:', error);
    return false;
  }
}

/**
 * Check if user has enough tokens for a session
 */
export async function hasEnoughTokens(requiredAmount: number): Promise<boolean> {
  try {
    const tokens = await getUserTokens();
    if (!tokens) return false;
    
    return tokens.tokens_remaining >= requiredAmount;
  } catch (error) {
    console.error('Error in hasEnoughTokens:', error);
    return false;
  }
}