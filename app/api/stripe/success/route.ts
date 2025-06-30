import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromAuthHeader } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';
import { addUserTokens } from '@/lib/tokens';
import { getPlanByPriceId } from '@/lib/subscription-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function GET(request: NextRequest) {
  try {
    // Get session ID from query params
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      console.error('No session ID provided in success route');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('Processing success for session ID:', sessionId);

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    let user = await getUserFromAuthHeader(authHeader);
    
    if (!user) {
      console.log('No user found from auth header, trying to get from session cookie');
      // Try to get user from session cookie as fallback
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('No authenticated user found in success route');
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        );
      }
      user = session.user;
    }

    console.log('User authenticated:', user.id);

    // Retrieve the checkout session from Stripe
    console.log('Retrieving checkout session from Stripe');
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items']
    });

    if (!session) {
      console.error('Invalid session ID:', sessionId);
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    console.log('Stripe session retrieved:', {
      id: session.id,
      paymentStatus: session.payment_status,
      customerId: session.customer,
      subscriptionId: session.subscription
    });

    // Check if the session was successful
    if (session.payment_status !== 'paid') {
      console.error('Payment not completed for session:', sessionId);
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get the price ID from the session
    const priceId = session.line_items?.data[0]?.price?.id;
    if (!priceId) {
      console.error('No price ID found in session:', sessionId);
      return NextResponse.json(
        { error: 'No price ID found in session' },
        { status: 400 }
      );
    }

    console.log('Price ID from session:', priceId);

    // Get the plan details
    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      console.error('Invalid plan for price ID:', priceId);
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    console.log('Plan details:', {
      name: plan.name,
      tokens: plan.tokensPerMonth,
      productId: plan.stripeProductId
    });

    // Check if customer already exists in our database
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer) {
      console.log('Existing customer found:', existingCustomer.customer_id);
      customerId = existingCustomer.customer_id;
    } else if (session.customer) {
      console.log('Creating new customer record for:', session.customer);
      // Save customer to our database
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: session.customer as string,
        });
      
      customerId = session.customer as string;
    } else {
      console.error('No customer ID found in session:', sessionId);
      return NextResponse.json(
        { error: 'No customer ID found in session' },
        { status: 400 }
      );
    }

    // If there's a subscription, save it to our database
    if (session.subscription) {
      console.log('Processing subscription ID:', session.subscription);
      
      // Retrieve the subscription details
      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      console.log('Subscription details:', {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end
      });
      
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
      
      console.log('Saved to stripe_subscriptions table');
      
      // Update user's subscription in user_subscriptions table
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_product_id: plan.stripeProductId,
          plan_name: plan.name,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          tokens_allocated: plan.tokensPerMonth,
          tokens_remaining: plan.tokensPerMonth,
        }, {
          onConflict: 'user_id'
        });
      
      console.log('Saved to user_subscriptions table');
      
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
      
      console.log('Saved to subscriptions table');
    }

    // Add tokens to the user's account
    console.log('Adding tokens to user account:', plan.tokensPerMonth);
    const tokensAdded = await addUserTokens(
      plan.tokensPerMonth,
      'purchase',
      `Purchased ${plan.name} plan - ${plan.tokensPerMonth} tokens added`,
      session.id
    );

    if (!tokensAdded) {
      console.warn('Failed to add tokens to user account, but payment was successful');
    } else {
      console.log('Tokens added successfully');
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
        subscription: session.subscription
      }
    });

  } catch (error) {
    console.error('Error processing subscription success:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process subscription' },
      { status: 500 }
    );
  }
}