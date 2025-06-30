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
    console.log('🔍 Getting user tokens');
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ No user found in getUserTokens');
      return null;
    }

    console.log('✅ User found:', user.id);

    // Query the user_tokens table directly
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError) {
      console.error('❌ Error fetching user tokens:', tokenError);
      return null;
    }

    console.log('✅ Token data retrieved:', tokenData);

    // Get subscription data for plan information
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('❌ Error fetching subscription:', subscriptionError);
    }

    console.log('✅ Subscription data:', subscriptionData);

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
    console.error('❌ Error in getUserTokens:', error);
    return null;
  }
}

/**
 * Get the user's token transaction history
 */
export async function getUserTokenTransactions(): Promise<TokenTransaction[]> {
  try {
    console.log('🔍 Getting user token transactions');
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ No user found in getUserTokenTransactions');
      return [];
    }

    console.log('✅ User found:', user.id);

    // First, get the basic transaction data
    const { data: transactions, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching token transactions:', error);
      return [];
    }

    console.log(`✅ Found ${transactions?.length || 0} transactions`);

    // For transactions with session_id, get additional session data
    const enhancedTransactions = await Promise.all((transactions || []).map(async (transaction) => {
      if (!transaction.session_id) {
        return {
          id: transaction.id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          description: transaction.description,
          reference_id: transaction.reference_id,
          created_at: transaction.created_at
        };
      }

      // Get session data
      const { data: session, error: sessionError } = await supabase
        .from('coaching_sessions')
        .select('session_type, duration_seconds, status, ai_coach_id')
        .eq('id', transaction.session_id)
        .single();

      if (sessionError) {
        console.error(`❌ Error fetching session for transaction ${transaction.id}:`, sessionError);
        return {
          id: transaction.id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          description: transaction.description,
          reference_id: transaction.reference_id,
          created_at: transaction.created_at
        };
      }

      // If session has a coach, get coach data
      let coachName = undefined;
      let coachSpecialty = undefined;

      if (session?.ai_coach_id) {
        const { data: coach, error: coachError } = await supabase
          .from('coaches')
          .select('name, specialty')
          .eq('id', session.ai_coach_id)
          .single();

        if (!coachError && coach) {
          coachName = coach.name;
          coachSpecialty = coach.specialty;
        }
      }

      return {
        id: transaction.id,
        amount: transaction.amount,
        transaction_type: transaction.transaction_type,
        description: transaction.description,
        reference_id: transaction.reference_id,
        created_at: transaction.created_at,
        session_type: session?.session_type,
        duration_seconds: session?.duration_seconds,
        session_status: session?.status,
        coach_name: coachName,
        coach_specialty: coachSpecialty
      };
    }));

    return enhancedTransactions;
  } catch (error) {
    console.error('❌ Error in getUserTokenTransactions:', error);
    return [];
  }
}

/**
 * Add tokens to a user's balance
 * NOTE: This is a client-side function. For server-side use, use the server action in lib/actions/token-actions.ts
 */
export async function addUserTokens(
  amount: number,
  transactionType: 'purchase' | 'renewal' | 'bonus',
  description: string,
  referenceId?: string
): Promise<boolean> {
  try {
    console.log(`🔍 Adding ${amount} tokens (${transactionType}): ${description}`);
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ No user found in addUserTokens');
      return false;
    }

    console.log('✅ User found:', user.id);

    // Call the RPC function to add tokens
    const { data, error } = await supabase.rpc('add_user_tokens', {
      p_user_id: user.id,
      p_amount: amount,
      p_transaction_type: transactionType,
      p_description: description,
      p_reference_id: referenceId
    });

    if (error) {
      console.error('❌ Error adding user tokens:', error);
      return false;
    }

    console.log('✅ Tokens added successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in addUserTokens:', error);
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
    console.log(`🔍 Using ${amount} tokens: ${description}`);
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ No user found in useUserTokens');
      return false;
    }

    console.log('✅ User found:', user.id);

    // Call the RPC function to use tokens
    const { data, error } = await supabase.rpc('use_user_tokens', {
      p_user_id: user.id,
      p_amount: amount,
      p_description: description,
      p_reference_id: referenceId,
      p_session_id: sessionId
    });

    if (error) {
      console.error('❌ Error using user tokens:', error);
      return false;
    }

    console.log('✅ Tokens used successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in useUserTokens:', error);
    return false;
  }
}

/**
 * Sync user tokens with subscription data
 */
export async function syncUserTokens(): Promise<boolean> {
  try {
    console.log('🔍 Syncing user tokens with subscription data');
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ No user found in syncUserTokens');
      return false;
    }

    console.log('✅ User found:', user.id);

    // Call the RPC function to sync tokens
    const { data, error } = await supabase.rpc('sync_user_tokens', {
      p_user_id: user.id
    });

    if (error) {
      console.error('❌ Error syncing user tokens:', error);
      return false;
    }

    console.log('✅ Tokens synced successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in syncUserTokens:', error);
    return false;
  }
}

/**
 * Check if user has enough tokens for a session
 */
export async function hasEnoughTokens(requiredAmount: number): Promise<boolean> {
  try {
    console.log(`🔍 Checking if user has ${requiredAmount} tokens`);
    const tokens = await getUserTokens();
    if (!tokens) {
      console.log('❌ No tokens found');
      return false;
    }
    
    const hasEnough = tokens.tokens_remaining >= requiredAmount;
    console.log(`✅ User has ${tokens.tokens_remaining} tokens, needs ${requiredAmount}: ${hasEnough ? 'Sufficient' : 'Insufficient'}`);
    return hasEnough;
  } catch (error) {
    console.error('❌ Error in hasEnoughTokens:', error);
    return false;
  }
}