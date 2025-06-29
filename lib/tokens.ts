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

    // Query the user_tokens table directly
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError) {
      console.error('Error fetching user tokens:', tokenError);
      return null;
    }

    // Get subscription data for plan information
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError);
    }

    // Determine plan name based on plan_type
    let planName = 'Free';
    if (subscriptionData) {
      switch (subscriptionData.plan_type) {
        case 'explorer': planName = 'Explorer'; break;
        case 'starter': planName = 'Starter'; break;
        case 'accelerator': planName = 'Accelerator'; break;
        default: planName = 'Free';
      }
    }

    return {
      total_tokens: tokenData.total_tokens,
      tokens_remaining: tokenData.tokens_remaining,
      tokens_used: tokenData.tokens_used,
      last_updated: tokenData.last_updated,
      plan_type: subscriptionData?.plan_type || 'free',
      plan_name: planName,
      subscription_status: subscriptionData?.status || 'free'
    };
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

    // Query the token_transactions table directly
    const { data, error } = await supabase
      .from('token_transactions')
      .select(`
        *,
        coaching_sessions:session_id (
          session_type,
          duration_seconds,
          status,
          ai_coach_id
        ),
        coaches:coaching_sessions.ai_coach_id (
          name,
          specialty
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching token transactions:', error);
      return [];
    }

    // Format the data to match the expected interface
    return (data || []).map(transaction => ({
      id: transaction.id,
      amount: transaction.amount,
      transaction_type: transaction.transaction_type,
      description: transaction.description,
      reference_id: transaction.reference_id,
      created_at: transaction.created_at,
      session_type: transaction.coaching_sessions?.session_type,
      duration_seconds: transaction.coaching_sessions?.duration_seconds,
      session_status: transaction.coaching_sessions?.status,
      coach_name: transaction.coaches?.name,
      coach_specialty: transaction.coaches?.specialty
    }));
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

    // Call the RPC function to add tokens
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

    // Call the RPC function to use tokens
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

    // Call the RPC function to sync tokens
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