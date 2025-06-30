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

    console.log('✅ [SERVER] Tokens synced successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ [SERVER] Error in syncUserTokensServer:', error);
    return false;
  }
}