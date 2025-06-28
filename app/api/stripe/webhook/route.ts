import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

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

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
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
    await handleSubscriptionChange(subscription);
  }

  // Record the order
  if (session.customer && session.payment_intent) {
    await supabase
      .from('stripe_orders')
      .insert({
        checkout_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        customer_id: session.customer as string,
        amount_subtotal: session.amount_subtotal || 0,
        amount_total: session.amount_total || 0,
        currency: session.currency || 'usd',
        payment_status: session.payment_status,
        status: 'completed',
      });
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log('Subscription changed:', subscription.id);

  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const productId = subscription.items.data[0]?.price.product as string;

  // Get payment method details
  let paymentMethodBrand = null;
  let paymentMethodLast4 = null;

  if (subscription.default_payment_method) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        subscription.default_payment_method as string
      );
      paymentMethodBrand = paymentMethod.card?.brand;
      paymentMethodLast4 = paymentMethod.card?.last4;
    } catch (error) {
      console.error('Error retrieving payment method:', error);
    }
  }

  // Update subscription in database
  await supabase
    .from('stripe_subscriptions')
    .upsert({
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: priceId,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      payment_method_brand: paymentMethodBrand,
      payment_method_last4: paymentMethodLast4,
      status: subscription.status as any,
    });

  // Update user subscription plan in our main subscriptions table
  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();

  if (customer && priceId) {
    // Map price IDs to plan types and credits based on your product specifications
    const planMapping: Record<string, { 
      plan_type: 'explorer' | 'starter' | 'accelerator'; 
      credits: number; 
      live_sessions: number;
      plan_name: string;
    }> = {
      // Explorer - $25 - 50 AI Coaching Credits
      'price_1RXeYbEREG4CzjmmBKcnXTHc': { 
        plan_type: 'explorer', 
        credits: 50, 
        live_sessions: 0,
        plan_name: 'Explorer'
      },
      // Starter - $69 - 250 AI Coaching Credits  
      'price_1ReBMSEREG4CzjmmiB7ZN5hL': { 
        plan_type: 'starter', 
        credits: 250, 
        live_sessions: 1,
        plan_name: 'Starter'
      },
      // Accelerator - $129 - 600 AI Coaching Credits
      'price_1ReBNEEREG4CzjmmnOtrbc5F': { 
        plan_type: 'accelerator', 
        credits: 600, 
        live_sessions: 2,
        plan_name: 'Accelerator'
      },
    };

    const planInfo = planMapping[priceId];
    if (planInfo) {
      console.log(`Updating user ${customer.user_id} to ${planInfo.plan_name} with ${planInfo.credits} credits`);
      
      // Update the user's subscription with the new plan and set credits to the full amount
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_type: planInfo.plan_type,
          credits_remaining: planInfo.credits, // Set to full amount of the plan
          monthly_limit: planInfo.credits,
          live_sessions_remaining: planInfo.live_sessions,
          stripe_subscription_id: subscription.id,
          status: subscription.status === 'active' ? 'active' : subscription.status,
          trial_ends_at: null, // Clear trial end date since they're now paying
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', customer.user_id);

      if (updateError) {
        console.error('Error updating user subscription:', updateError);
      } else {
        console.log(`Successfully updated user ${customer.user_id} subscription to ${planInfo.plan_name}`);
        console.log(`Credits: ${planInfo.credits}`);

        // Record the credit transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: customer.user_id,
            transaction_type: 'purchase',
            credits_amount: planInfo.credits,
            description: `Purchased ${planInfo.plan_name} plan - ${planInfo.credits} credits added`,
            stripe_subscription_id: subscription.id,
          });
      }
    } else {
      console.error(`Unknown price ID: ${priceId}`);
    }
  } else {
    console.error('Customer or price ID not found:', { customer, priceId });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  const customerId = subscription.customer as string;

  // Update subscription status
  await supabase
    .from('stripe_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('customer_id', customerId);

  // Update user subscription to free plan
  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();

  if (customer) {
    console.log(`Reverting user ${customer.user_id} to free plan due to subscription cancellation`);
    
    await supabase
      .from('subscriptions')
      .update({
        plan_type: 'free',
        credits_remaining: 7,
        monthly_limit: 7,
        live_sessions_remaining: 0,
        stripe_subscription_id: null,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', customer.user_id);

    // Record the cancellation transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: customer.user_id,
        transaction_type: 'refund',
        credits_amount: 0,
        description: 'Subscription cancelled - reverted to free plan',
        stripe_subscription_id: subscription.id,
      });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id);
  
  // For recurring payments, ADD credits to existing balance (renewal)
  if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const priceId = subscription.items.data[0]?.price.id;
    
    if (priceId) {
      const customerId = subscription.customer as string;
      const { data: customer } = await supabase
        .from('stripe_customers')
        .select('user_id')
        .eq('customer_id', customerId)
        .single();

      if (customer) {
        // Get current subscription to add credits to existing balance
        const { data: currentSubscription } = await supabase
          .from('subscriptions')
          .select('credits_remaining')
          .eq('user_id', customer.user_id)
          .single();

        const planMapping: Record<string, { 
          credits: number; 
          live_sessions: number; 
          plan_name: string;
        }> = {
          'price_1RXeYbEREG4CzjmmBKcnXTHc': { 
            credits: 50, 
            live_sessions: 0, 
            plan_name: 'Explorer' 
          },
          'price_1ReBMSEREG4CzjmmiB7ZN5hL': { 
            credits: 250, 
            live_sessions: 1, 
            plan_name: 'Starter' 
          },
          'price_1ReBNEEREG4CzjmmnOtrbc5F': { 
            credits: 600, 
            live_sessions: 2, 
            plan_name: 'Accelerator' 
          },
        };

        const planInfo = planMapping[priceId];
        if (planInfo && currentSubscription) {
          const existingCredits = currentSubscription.credits_remaining || 0;
          const newTotalCredits = existingCredits + planInfo.credits;

          console.log(`Renewal: Adding ${planInfo.credits} credits to user ${customer.user_id}`);
          console.log(`Credits: ${existingCredits} + ${planInfo.credits} = ${newTotalCredits}`);
          
          await supabase
            .from('subscriptions')
            .update({
              credits_remaining: newTotalCredits, // Add renewal credits to existing balance
              live_sessions_remaining: planInfo.live_sessions,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', customer.user_id);

          // Record the renewal transaction
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: customer.user_id,
              transaction_type: 'renewal',
              credits_amount: planInfo.credits,
              description: `${planInfo.plan_name} plan renewal - ${planInfo.credits} credits added`,
              stripe_subscription_id: subscription.id,
              stripe_invoice_id: invoice.id,
            });
        }
      }
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id);
  
  // Handle failed payment - could send notification, update subscription status, etc.
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customerId = subscription.customer as string;
    
    // Update subscription status to past_due
    await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('customer_id', customerId);

    // Update user subscription status
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .single();

    if (customer) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', customer.user_id);
    }
  }
}