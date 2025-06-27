export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number; // in cents
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1RXeYbEREG4CzjmmBKcnXTHc',
    name: 'CoachBridge Explorer',
    description: 'Self starters who want a flexible AI accountability partner to help them stay on track with their development. Includes 50 x AI Coaching Credits',
    mode: 'subscription',
    price: 2500, // $25.00
  },
  {
    priceId: 'price_1ReBMSEREG4CzjmmiB7ZN5hL',
    name: 'CoachBridge Starter',
    description: 'Individuals seeking more AI coaching and the guidance of a human expert through webinars or group coaching. Includes 250 AI Coaching Credits.',
    mode: 'subscription',
    price: 6900, // $69.00
  },
  {
    priceId: 'price_1ReBNEEREG4CzjmmnOtrbc5F',
    name: 'CoachBridge Accelerator',
    description: 'Individuals seeking more AI coaching with plenty of credits to use with AI Voice & Video Coaching. Includes 600 AI Coaching Credits.',
    mode: 'subscription',
    price: 12900, // $129.00
  },
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}