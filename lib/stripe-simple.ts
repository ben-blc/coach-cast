// Simplified Stripe integration using client-side only approach
// This avoids the need for Edge Functions and complex server setup

export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  price: number; // in cents
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1RXeYbEREG4CzjmmBKcnXTHc',
    name: 'AI Explorer',
    description: 'Perfect for getting started with AI coaching',
    price: 2500, // $25.00
  },
  {
    priceId: 'price_1ReBMSEREG4CzjmmiB7ZN5hL',
    name: 'Coaching Starter',
    description: 'Ideal for regular coaching sessions',
    price: 6900, // $69.00
  },
  {
    priceId: 'price_1ReBNEEREG4CzjmmnOtrbc5F',
    name: 'Coaching Accelerator',
    description: 'Maximum coaching with premium features',
    price: 12900, // $129.00
  },
];

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

// Simple redirect to Stripe Checkout (no server required)
export function redirectToStripeCheckout(priceId: string): void {
  const product = getProductByPriceId(priceId);
  if (!product) {
    console.error('Product not found');
    return;
  }

  // For now, redirect to a simple success page
  // In production, you would integrate with Stripe's client-side checkout
  const successUrl = `${window.location.origin}/success?plan=${encodeURIComponent(product.name)}`;
  window.location.href = successUrl;
}

// Mock subscription data for demo purposes
export interface MockSubscription {
  planName: string;
  status: string;
  priceId: string;
}

export function getMockSubscription(): MockSubscription | null {
  // Check localStorage for demo subscription
  const stored = localStorage.getItem('demo_subscription');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function setMockSubscription(priceId: string): void {
  const product = getProductByPriceId(priceId);
  if (product) {
    const subscription: MockSubscription = {
      planName: product.name,
      status: 'active',
      priceId: priceId,
    };
    localStorage.setItem('demo_subscription', JSON.stringify(subscription));
  }
}

export function clearMockSubscription(): void {
  localStorage.removeItem('demo_subscription');
}