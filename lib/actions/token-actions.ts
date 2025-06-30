'use server';

import { supabase } from '../supabase';

/**
 * Server-side function to add tokens to a user's balance
 */
export async function addUserTokensServer(
  userId: string,
  amount: number,
  transactionType: 'purchase' | 'renewal' | 'bonus',
  description: string,
  referenceId?: string
): Promise<boolean> {
  try {
    console.log(`🔍 [SERVER] Adding ${amount} tokens to user ${userId} (${transactionType}): ${description}`);

    if (!userId) {
      console.error('❌ [SERVER] No user ID provided in addUserTokensServer');
      return false;
    }

    // Check if this transaction has already been processed (by reference ID)
    if (referenceId) {
      const { data: existingTransaction, error: txError } = await supabase
        .from('token_transactions')
        .select('id')
        .eq('reference_id', referenceId)
        .eq('transaction_type', transactionType)
        .single();

      if (!txError && existingTransaction) {
        console.log('⚠️ [SERVER] Transaction already processed:', existingTransaction.id);
        return true; // Return true since the tokens were already added
      }
    }

    // Call the RPC function to add tokens
    const { data, error } = await supabase.rpc('add_user_tokens', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: transactionType,
      p_description: description,
      p_reference_id: referenceId
    });

    if (error) {
      console.error('❌ [SERVER] Error adding user tokens:', error);
      return false;
    }

    console.log('✅ [SERVER] Tokens added successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ [SERVER] Error in addUserTokensServer:', error);
    return false;
  }
}

/**
 * Server-side function to sync user tokens with subscription data
 */
export async function syncUserTokensServer(userId: string): Promise<boolean> {
  try {
    console.log('🔍 [SERVER] Syncing user tokens with subscription data for user:', userId);

    if (!userId) {
      console.error('❌ [SERVER] No user ID provided in syncUserTokensServer');
      return false;
    }

    // Call the RPC function to sync tokens
    const { data, error } = await supabase.rpc('sync_user_tokens', {
      p_user_id: userId
    });

    if (error) {
      console.error('❌ [SERVER] Error syncing user tokens:', error);
      return false;
    }

    // Also update the subscriptions table from user_tokens to ensure consistency
    const { data: userTokens, error: tokensError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!tokensError && userTokens) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          credits_remaining: userTokens.tokens_remaining,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ [SERVER] Error updating subscriptions table:', updateError);
      } else {
        console.log('✅ [SERVER] Subscriptions table updated with token data');
      }
    }

    console.log('✅ [SERVER] Tokens synced successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ [SERVER] Error in syncUserTokensServer:', error);
    return false;
  }
}

/**
 * Server-side function to check if a transaction has already been processed
 */
export async function checkTransactionExists(
  referenceId: string,
  transactionType: 'purchase' | 'renewal' | 'bonus' | 'usage' | 'refund'
): Promise<boolean> {
  try {
    console.log(`🔍 [SERVER] Checking if transaction exists: ${referenceId} (${transactionType})`);

    if (!referenceId) {
      console.error('❌ [SERVER] No reference ID provided in checkTransactionExists');
      return false;
    }

    const { data, error } = await supabase
      .from('token_transactions')
      .select('id')
      .eq('reference_id', referenceId)
      .eq('transaction_type', transactionType)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [SERVER] Error checking transaction:', error);
      return false;
    }

    const exists = !!data;
    console.log(`✅ [SERVER] Transaction exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error('❌ [SERVER] Error in checkTransactionExists:', error);
    return false;
  }
}

/**
 * Server-side function to get user tokens
 */
export async function getUserTokensServer(userId: string): Promise<any> {
  try {
    console.log('🔍 [SERVER] Getting user tokens for user:', userId);

    if (!userId) {
      console.error('❌ [SERVER] No user ID provided in getUserTokensServer');
      return null;
    }

    const { data, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ [SERVER] Error getting user tokens:', error);
      return null;
    }

    console.log('✅ [SERVER] User tokens retrieved:', data);
    return data;
  } catch (error) {
    console.error('❌ [SERVER] Error in getUserTokensServer:', error);
    return null;
  }
}