import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromAuthHeader } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';
import { addUserTokens } from '@/lib/tokens';
import { SUBSCRIPTION_PLANS, getPlanByPriceId } from '@/lib/subscription-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function GET(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromAuthHeader(authHeader);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get session ID from query params
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items']
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Check if the session was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get the price ID from the session
    const priceId = session.line_items?.data[0]?.price?.id;
    if (!priceId) {
      return NextResponse.json(
        { error: 'No price ID found in session' },
        { status: 400 }
      );
    }

    // Get the plan details
    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Check if customer already exists in our database
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.customer_id;
    } else if (session.customer) {
      // Save customer to our database
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: session.customer as string,
        });
      
      customerId = session.customer as string;
    } else {
      return NextResponse.json(
        { error: 'No customer ID found in session' },
        { status: 400 }
      );
    }

    // If there's a subscription, save it to our database
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      // Save subscription to stripe_subscriptions table
      await supabase
        .from('stripe_subscriptions')
        .upsert({
          customer_id: customerId,
          subscription_id: subscription.id,
          price_id: priceId,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          status: subscription.status,
        }, {
          onConflict: 'customer_id'
        });
      
      // Update user's subscription in subscriptions table
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_type: plan.name.toLowerCase(),
          credits_remaining: plan.tokensPerMonth,
          monthly_limit: plan.tokensPerMonth,
          stripe_subscription_id: subscription.id,
          status: 'active',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    }

    // Add tokens to the user's account
    const tokensAdded = await addUserTokens(
      plan.tokensPerMonth,
      'purchase',
      `Purchased ${plan.name} plan - ${plan.tokensPerMonth} tokens added`,
      session.id
    );

    if (!tokensAdded) {
      console.warn('Failed to add tokens to user account, but payment was successful');
    }

    // Return success response with subscription details
    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan`,
      plan: {
        name: plan.name,
        tokens: plan.tokensPerMonth,
        price: plan.priceCents / 100
      },
      session: {
        id: session.id,
        customer: session.customer,
        subscription: session.subscription?.id
      }
    });

  } catch (error) {
    console.error('Error processing subscription success:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}