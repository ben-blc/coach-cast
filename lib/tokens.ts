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

    console.log('Getting tokens for user:', user.id);

    // Query the user_tokens table directly
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError) {
      console.error('Error fetching user tokens:', tokenError);
      
      // If the token record doesn't exist, try to sync it
      if (tokenError.code === 'PGRST116') {
        console.log('No token record found, syncing tokens');
        await syncUserTokens();
        
        // Try again after syncing
        const { data: retryData, error: retryError } = await supabase
          .from('user_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (retryError) {
          console.error('Error fetching user tokens after sync:', retryError);
          return null;
        }
        
        tokenData = retryData;
      } else {
        return null;
      }
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

    console.log('User tokens retrieved:', {
      total: tokenData.total_tokens,
      remaining: tokenData.tokens_remaining,
      used: tokenData.tokens_used,
      plan: planName
    });

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

    console.log('Getting token transactions for user:', user.id);

    // First, get the basic transaction data
    const { data: transactions, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching token transactions:', error);
      return [];
    }

    console.log(`Found ${transactions?.length || 0} token transactions`);

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
        console.error(`Error fetching session for transaction ${transaction.id}:`, sessionError);
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

    console.log(`Adding ${amount} tokens to user ${user.id} (${transactionType})`);

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

    console.log('Tokens added successfully');
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

    console.log(`Using ${amount} tokens from user ${user.id}`);

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

    console.log('Tokens used successfully');
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

    console.log('Syncing tokens for user:', user.id);

    // Call the RPC function to sync tokens
    const { data, error } = await supabase.rpc('sync_user_tokens', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error syncing user tokens:', error);
      return false;
    }

    console.log('Tokens synced successfully');
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