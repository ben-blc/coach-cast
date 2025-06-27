import { stripeProducts, type StripeProduct, formatPrice as formatPriceFromConfig } from '@/src/stripe-config';
import { getCurrentUser } from '@/lib/auth';

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

    const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
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
      mode: product.mode
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        mode: product.mode,
      }),
    });

    console.log('Checkout response status:', response.status);
    console.log('Checkout response headers:', Object.fromEntries(response.headers.entries()));

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

    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

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

// Re-export formatPrice function
export const formatPrice = formatPriceFromConfig;

export { stripeProducts };
export type { StripeProduct };