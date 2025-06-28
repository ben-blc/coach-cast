import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, formatPrice, type SubscriptionPlan } from './subscription-config';
import { getUserActiveSubscription } from './subscription-service';

export { SUBSCRIPTION_PLANS, formatPrice, type SubscriptionPlan };

export interface CheckoutResponse {
  sessionId?: string;
  url?: string;
  error?: string;
}

export interface SubscriptionStatus {
  subscription: any;
  transactions: any[];
}

export async function createSubscriptionCheckout(priceId: string): Promise<CheckoutResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    const response = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating subscription checkout:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const response = await fetch('/api/stripe/subscription-status', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      console.error('Error fetching subscription status:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
}

export async function cancelSubscription(): Promise<{success: boolean, message?: string, error?: string}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { success: false, error: 'No access token available' };
    }

    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Failed to cancel subscription' 
      };
    }

    const result = await response.json();
    return { 
      success: true, 
      message: result.message || 'Subscription cancelled successfully' 
    };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function reactivateSubscription(): Promise<{success: boolean, message?: string, error?: string}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { success: false, error: 'No access token available' };
    }

    const response = await fetch('/api/stripe/reactivate-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Failed to reactivate subscription' 
      };
    }

    const result = await response.json();
    return { 
      success: true, 
      message: result.message || 'Subscription reactivated successfully' 
    };
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status);
}

export async function redirectToSubscriptionCheckout(priceId: string): Promise<void> {
  const result = await createSubscriptionCheckout(priceId);
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  if (result.url) {
    window.location.href = result.url;
  } else {
    throw new Error('No checkout URL returned');
  }
}