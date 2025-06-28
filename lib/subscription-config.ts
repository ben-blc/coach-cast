// Subscription configuration and plan mapping
export interface SubscriptionPlan {
  name: string;
  stripeProductId: string;
  stripePriceId: string;
  tokensPerMonth: number;
  priceCents: number;
  description: string;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    name: 'Starter',
    stripeProductId: 'prod_starter',
    stripePriceId: 'price_1RXeYbEREG4CzjmmBKcnXTHc',
    tokensPerMonth: 50,
    priceCents: 2500, // $25.00
    description: 'Perfect for getting started with AI coaching'
  },
  explorer: {
    name: 'Explorer',
    stripeProductId: 'prod_explorer',
    stripePriceId: 'price_1ReBMSEREG4CzjmmiB7ZN5hL',
    tokensPerMonth: 250,
    priceCents: 6900, // $69.00
    description: 'Ideal for regular coaching sessions'
  },
  accelerator: {
    name: 'Accelerator',
    stripeProductId: 'prod_accelerator',
    stripePriceId: 'price_1ReBNEEREG4CzjmmnOtrbc5F',
    tokensPerMonth: 600,
    priceCents: 12900, // $129.00
    description: 'Maximum coaching with premium features'
  }
};

// Map Stripe price IDs to plan configurations
export const PRICE_ID_TO_PLAN: Record<string, SubscriptionPlan> = {
  'price_1RXeYbEREG4CzjmmBKcnXTHc': SUBSCRIPTION_PLANS.starter,
  'price_1ReBMSEREG4CzjmmiB7ZN5hL': SUBSCRIPTION_PLANS.explorer,
  'price_1ReBNEEREG4CzjmmnOtrbc5F': SUBSCRIPTION_PLANS.accelerator,
};

// Map Stripe product IDs to plan configurations
export const PRODUCT_ID_TO_PLAN: Record<string, SubscriptionPlan> = {
  'prod_starter': SUBSCRIPTION_PLANS.starter,
  'prod_explorer': SUBSCRIPTION_PLANS.explorer,
  'prod_accelerator': SUBSCRIPTION_PLANS.accelerator,
};

export function getPlanByPriceId(priceId: string): SubscriptionPlan | null {
  return PRICE_ID_TO_PLAN[priceId] || null;
}

export function getPlanByProductId(productId: string): SubscriptionPlan | null {
  return PRODUCT_ID_TO_PLAN[productId] || null;
}

export function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}