import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { getPlanByPriceId, getPlanByProductId, type SubscriptionPlan } from './subscription-config';

export interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_product_id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  tokens_allocated: number;
  tokens_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTransaction {
  id: string;
  user_id: string;
  subscription_id: string;
  stripe_transaction_id: string;
  stripe_invoice_id?: string;
  amount_paid: number;
  tokens_granted: number;
  event_type: string;
  stripe_event_id?: string;
  created_at: string;
}

// Get user's active subscription
export async function getUserActiveSubscription(): Promise<UserSubscription | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserActiveSubscription:', error);
    return null;
  }
}

// Get user's subscription history
export async function getUserSubscriptionHistory(): Promise<UserSubscription[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscription history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserSubscriptionHistory:', error);
    return [];
  }
}

// Get user's transaction history
export async function getUserTransactionHistory(): Promise<SubscriptionTransaction[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('subscription_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserTransactionHistory:', error);
    return [];
  }
}

// Create or update subscription
export async function createOrUpdateSubscription(subscriptionData: {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_product_id: string;
  plan_name: string;
  status: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
}): Promise<UserSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        ...subscriptionData,
        current_period_start: subscriptionData.current_period_start 
          ? new Date(subscriptionData.current_period_start * 1000).toISOString()
          : null,
        current_period_end: subscriptionData.current_period_end
          ? new Date(subscriptionData.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_subscription_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createOrUpdateSubscription:', error);
    return null;
  }
}

// Log subscription transaction
export async function logSubscriptionTransaction(transactionData: {
  user_id: string;
  subscription_id: string;
  stripe_transaction_id: string;
  stripe_invoice_id?: string;
  amount_paid: number;
  tokens_granted: number;
  event_type: string;
  stripe_event_id?: string;
}): Promise<SubscriptionTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('subscription_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      console.error('Error logging subscription transaction:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in logSubscriptionTransaction:', error);
    return null;
  }
}

// Update subscription status
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  additionalData?: Partial<UserSubscription>
): Promise<UserSubscription | null> {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    const { data, error } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateSubscriptionStatus:', error);
    return null;
  }
}

// Use tokens (deduct from remaining balance)
export async function useTokens(userId: string, tokensToUse: number): Promise<boolean> {
  try {
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (fetchError || !subscription) {
      console.error('No active subscription found for user:', userId);
      return false;
    }

    if (subscription.tokens_remaining < tokensToUse) {
      console.error('Insufficient tokens:', subscription.tokens_remaining, 'needed:', tokensToUse);
      return false;
    }

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        tokens_remaining: subscription.tokens_remaining - tokensToUse,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error updating token balance:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in useTokens:', error);
    return false;
  }
}

// Get available subscription plans
export async function getAvailableSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents');

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }

    return data?.map(plan => ({
      name: plan.plan_name,
      stripeProductId: plan.stripe_product_id,
      stripePriceId: plan.stripe_price_id,
      tokensPerMonth: plan.tokens_per_month,
      priceCents: plan.price_cents,
      description: plan.description || ''
    })) || [];
  } catch (error) {
    console.error('Error in getAvailableSubscriptionPlans:', error);
    return [];
  }
}