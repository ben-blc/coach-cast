import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { addUserTokens } from '@/lib/tokens';
import { getPlanByPriceId } from '@/lib/subscription-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);

  if (session.mode === 'subscription' && session.subscription) {
    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Get the price ID from the subscription
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.error('No price ID found in subscription');
      return;
    }

    // Get the plan details
    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      console.error('Invalid plan for price ID:', priceId);
      return;
    }

    // Get the customer ID
    const customerId = session.customer as string;
    if (!customerId) {
      console.error('No customer ID found in session');
      return;
    }

    // Get the user ID from the customer metadata
    const { data: customerData } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .single();

    if (!customerData) {
      console.error('No user found for customer ID:', customerId);
      return;
    }

    // Add tokens to the user's account
    const tokensAdded = await addUserTokens(
      plan.tokensPerMonth,
      'purchase',
      `Purchased ${plan.name} plan - ${plan.tokensPerMonth} tokens added`,
      session.id
    );

    console.log(`Added ${plan.tokensPerMonth} tokens to user ${customerData.user_id}:`, tokensAdded);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log('Subscription changed:', subscription.id);

  // Only process active subscriptions
  if (subscription.status !== 'active') {
    console.log('Subscription not active, skipping token allocation');
    return;
  }

  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  if (!customerId || !priceId) {
    console.error('Missing customer ID or price ID in subscription');
    return;
  }

  // Get the plan details
  const plan = getPlanByPriceId(priceId);
  if (!plan) {
    console.error('Invalid plan for price ID:', priceId);
    return;
  }

  // Get the user ID from the customer metadata
  const { data: customerData } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();

  if (!customerData) {
    console.error('No user found for customer ID:', customerId);
    return;
  }

  // Add tokens to the user's account
  const tokensAdded = await addUserTokens(
    plan.tokensPerMonth,
    'purchase',
    `Subscription to ${plan.name} plan - ${plan.tokensPerMonth} tokens added`,
    subscription.id
  );

  console.log(`Added ${plan.tokensPerMonth} tokens to user ${customerData.user_id}:`, tokensAdded);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id);
  
  // Only process subscription renewals
  if (invoice.billing_reason !== 'subscription_cycle' || !invoice.subscription) {
    console.log('Not a subscription renewal, skipping token allocation');
    return;
  }

  // Get the subscription details
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  
  // Get the price ID from the subscription
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  // Get the plan details
  const plan = getPlanByPriceId(priceId);
  if (!plan) {
    console.error('Invalid plan for price ID:', priceId);
    return;
  }

  // Get the customer ID
  const customerId = invoice.customer as string;
  if (!customerId) {
    console.error('No customer ID found in invoice');
    return;
  }

  // Get the user ID from the customer metadata
  const { data: customerData } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();

  if (!customerData) {
    console.error('No user found for customer ID:', customerId);
    return;
  }

  // Add tokens to the user's account
  const tokensAdded = await addUserTokens(
    plan.tokensPerMonth,
    'renewal',
    `Subscription renewal for ${plan.name} plan - ${plan.tokensPerMonth} tokens added`,
    invoice.id
  );

  console.log(`Added ${plan.tokensPerMonth} renewal tokens to user ${customerData.user_id}:`, tokensAdded);
}