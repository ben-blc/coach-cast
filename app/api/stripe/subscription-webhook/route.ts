import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { 
  createOrUpdateSubscription, 
  logSubscriptionTransaction, 
  updateSubscriptionStatus 
} from '@/lib/subscription-service';
import { getPlanByProductId } from '@/lib/subscription-config';

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

    console.log('Processing webhook event:', event.type, event.id);

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, event.id);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, event.id);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, event.id);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, event.id);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, event.id);
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

async function handleSubscriptionCreated(subscription: Stripe.Subscription, eventId: string) {
  console.log('Subscription created:', subscription.id);

  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    // Get user ID from customer metadata or email
    const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;
    if (!userId) {
      console.error('No Supabase user ID found in customer metadata');
      return;
    }

    // Get product ID from subscription
    const priceId = subscription.items.data[0]?.price.id;
    const productId = subscription.items.data[0]?.price.product as string;
    
    const plan = getPlanByProductId(productId);
    if (!plan) {
      console.error('Unknown product ID:', productId);
      return;
    }

    // Create subscription record
    const subscriptionRecord = await createOrUpdateSubscription({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_product_id: productId,
      plan_name: plan.name,
      status: subscription.status as string,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end
    });

    if (!subscriptionRecord) {
      console.error('Failed to create subscription record');
      return;
    }

    // Get the latest invoice for this subscription to log the transaction
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      limit: 1
    });

    if (invoices.data.length > 0) {
      const invoice = invoices.data[0];
      const transactionId = invoice.payment_intent as string || invoice.charge as string;
      
      if (transactionId && invoice.amount_paid > 0) {
        await logSubscriptionTransaction({
          user_id: userId,
          subscription_id: subscriptionRecord.id,
          stripe_transaction_id: transactionId,
          stripe_invoice_id: invoice.id,
          amount_paid: invoice.amount_paid,
          tokens_granted: plan.tokensPerMonth,
          event_type: 'subscription_created',
          stripe_event_id: eventId
        });
      }
    }

    console.log(`Successfully processed subscription creation for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, eventId: string) {
  console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);

  try {
    const additionalData: any = {
      current_period_start: subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end
    };

    await updateSubscriptionStatus(
      subscription.id,
      subscription.status,
      additionalData
    );

    console.log(`Successfully updated subscription ${subscription.id} status to ${subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, eventId: string) {
  console.log('Subscription deleted:', subscription.id);

  try {
    await updateSubscriptionStatus(subscription.id, 'canceled');
    console.log(`Successfully marked subscription ${subscription.id} as canceled`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, eventId: string) {
  console.log('Payment succeeded for invoice:', invoice.id);

  try {
    // Only process subscription renewals (not initial payments)
    if (invoice.billing_reason !== 'subscription_cycle' || !invoice.subscription) {
      console.log('Skipping non-renewal payment');
      return;
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const productId = subscription.items.data[0]?.price.product as string;
    
    const plan = getPlanByProductId(productId);
    if (!plan) {
      console.error('Unknown product ID:', productId);
      return;
    }

    // Get subscription record from database
    const { data: subscriptionRecord, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (error || !subscriptionRecord) {
      console.error('Subscription record not found:', subscription.id);
      return;
    }

    // Only process if subscription is active
    if (subscription.status !== 'active') {
      console.log('Subscription not active, skipping token allocation');
      return;
    }

    // Update subscription with new period and add tokens
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        tokens_remaining: subscriptionRecord.tokens_remaining + plan.tokensPerMonth,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionRecord.id);

    if (updateError) {
      console.error('Error updating subscription for renewal:', updateError);
      return;
    }

    // Log the renewal transaction
    const transactionId = invoice.payment_intent as string || invoice.charge as string;
    
    if (transactionId && invoice.amount_paid > 0) {
      await logSubscriptionTransaction({
        user_id: subscriptionRecord.user_id,
        subscription_id: subscriptionRecord.id,
        stripe_transaction_id: transactionId,
        stripe_invoice_id: invoice.id,
        amount_paid: invoice.amount_paid,
        tokens_granted: plan.tokensPerMonth,
        event_type: 'subscription_renewed',
        stripe_event_id: eventId
      });
    }

    console.log(`Successfully processed renewal for subscription ${subscription.id}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  console.log('Payment failed for invoice:', invoice.id);

  try {
    // Log the payment failure for monitoring
    if (invoice.subscription) {
      const { data: subscriptionRecord } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', invoice.subscription as string)
        .single();

      if (subscriptionRecord) {
        await logSubscriptionTransaction({
          user_id: subscriptionRecord.user_id,
          subscription_id: subscriptionRecord.id,
          stripe_transaction_id: invoice.payment_intent as string || 'failed',
          stripe_invoice_id: invoice.id,
          amount_paid: 0,
          tokens_granted: 0,
          event_type: 'payment_failed',
          stripe_event_id: eventId
        });
      }
    }

    console.log(`Logged payment failure for invoice ${invoice.id}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}