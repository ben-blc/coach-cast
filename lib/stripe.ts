import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  price: number; // in cents
  credits: number;
  liveSessions: number;
  planType: 'explorer' | 'starter' | 'accelerator';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1RXeYbEREG4CzjmmBKcnXTHc',
    name: 'CoachBridge Explorer',
    description: 'Self starters who want a flexible AI accountability partner to help them stay on track with their development. Includes 50 x AI Coaching Credits',
    price: 2500, // $25.00
    credits: 50,
    liveSessions: 0,
    planType: 'explorer',
  },
  {
    priceId: 'price_1ReBMSEREG4CzjmmiB7ZN5hL',
    name: 'CoachBridge Starter',
    description: 'Individuals seeking more AI coaching and the guidance of a human expert through webinars or group coaching. Includes 250 AI Coaching Credits.',
    price: 6900, // $69.00
    credits: 250,
    liveSessions: 1,
    planType: 'starter',
  },
  {
    priceId: 'price_1ReBNEEREG4CzjmmnOtrbc5F',
    name: 'CoachBridge Accelerator',
    description: 'Individuals seeking more AI coaching with plenty of credits to use with AI Voice & Video Coaching. Includes 600 AI Coaching Credits.',
    price: 12900, // $129.00
    credits: 600,
    liveSessions: 2,
    planType: 'accelerator',
  },
];

export interface CheckoutResponse {
  sessionId?: string;
  url?: string;
  error?: string;
}

export interface SubscriptionData {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const product = stripeProducts.find(p => p.priceId === priceId);
    if (!product) {
      throw new Error('Invalid product');
    }

    // Check if user already has an active subscription
    const existingSubscription = await getUserSubscription();
    if (existingSubscription && isSubscriptionActive(existingSubscription.subscription_status)) {
      throw new Error('You already have an active subscription. Please cancel your current subscription before subscribing to a new plan.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    console.log('Creating checkout session with:', {
      priceId,
      successUrl,
      cancelUrl,
      mode: 'subscription'
    });

    // Use the API route instead of Supabase Edge Function
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        priceId,
      }),
    });

    console.log('Checkout response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Checkout error response:', errorText);
      
      let errorMessage = 'Failed to create checkout session';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Checkout session created:', data);
    
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getUserSubscription(): Promise<SubscriptionData | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return null;
    }

    // Use the API route instead of direct database query
    const response = await fetch('/api/stripe/subscription', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      console.error('Error fetching subscription:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

export function getSubscriptionPlanName(priceId: string | null): string {
  if (!priceId) return 'Free';
  
  const product = stripeProducts.find(p => p.priceId === priceId);
  return product?.name || 'Unknown Plan';
}

export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status);
}

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

// Redirect to Stripe Checkout
export async function redirectToStripeCheckout(priceId: string): Promise<void> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/pricing`;

  const result = await createCheckoutSession(priceId, successUrl, cancelUrl);
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  if (result.url) {
    window.location.href = result.url;
  } else {
    throw new Error('No checkout URL returned');
  }
}

// Update user subscription in local database after successful Stripe payment
export async function updateUserSubscriptionAfterPayment(
  userId: string,
  priceId: string,
  stripeSubscriptionId: string
): Promise<boolean> {
  try {
    const product = getProductByPriceId(priceId);
    if (!product) {
      console.error('Product not found for price ID:', priceId);
      return false;
    }

    // Update the subscription in our local database
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({
        plan_type: product.planType,
        credits_remaining: product.credits,
        monthly_limit: product.credits,
        live_sessions_remaining: product.liveSessions,
        stripe_subscription_id: stripeSubscriptionId,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      return false;
    }

    console.log(`Successfully updated subscription for user ${userId} to ${product.planType} with ${product.credits} credits`);
    return true;
  } catch (error) {
    console.error('Error updating user subscription after payment:', error);
    return false;
  }
}

// Cancel current subscription
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

    // Call the API route to cancel subscription
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

// Reactivate cancelled subscription
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

    // Call the API route to reactivate subscription
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