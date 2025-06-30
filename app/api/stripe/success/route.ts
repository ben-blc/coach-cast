import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromAuthHeader } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, getPlanByPriceId } from '@/lib/subscription-config';
import { addUserTokensServer, syncUserTokensServer } from '@/lib/actions/token-actions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Processing success route');
    
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromAuthHeader(authHeader);

    // Helper to retrieve Stripe session
    async function getStripeSession(sessionId: string) {
      return await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'subscription']
      });
    }
    
    let userId: string | undefined;
    if (!user) {
      console.error('❌ No user found in success route from auth header');
      // Try to get user from session cookie as fallback
      let { data: { session: supabaseSession } } = await supabase.auth.getSession();
      if (!supabaseSession?.user) {
        console.error('❌ No user found in session cookie');
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        );
      }
      console.log('✅ User found in session cookie:', supabaseSession.user.id);
      userId = supabaseSession.user.id;
    } else {
      console.log('✅ User found in auth header:', user.id);
      userId = user.id;
    }

    // Get session ID from query params
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      console.error('❌ No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Check if this transaction has already been processed
    const { data: existingTransaction, error: txError } = await supabase
      .from('token_transactions')
      .select('id, amount, created_at')
      .eq('reference_id', sessionId)
      .eq('transaction_type', 'purchase')
      .single();

    if (existingTransaction) {
      console.log('⚠️ Transaction already processed:', existingTransaction);
      return NextResponse.json({
        success: true,
        message: `Transaction already processed at ${new Date(existingTransaction.created_at).toLocaleString()}`,
        alreadyProcessed: true,
        plan: {
          tokens: existingTransaction.amount
        }
      });
    }

    console.log('🔍 Retrieving checkout session:', sessionId);

    // Retrieve the checkout session from Stripe
    const stripeSession = await getStripeSession(sessionId);

    if (!stripeSession) {
      console.error('❌ Invalid session ID');
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    console.log('✅ Session retrieved:', {
      id: stripeSession.id,
      payment_status: stripeSession.payment_status,
      customer: stripeSession.customer,
      subscription: typeof stripeSession.subscription === 'object' ? stripeSession.subscription.id : stripeSession.subscription
    });

    // Check if the session was successful
    if (stripeSession.payment_status !== 'paid') {
      console.error('❌ Payment not completed');
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get the price ID from the session
    const priceId = stripeSession.line_items?.data[0]?.price?.id;
    if (!priceId) {
      console.error('❌ No price ID found in session');
      return NextResponse.json(
        { error: 'No price ID found in session' },
        { status: 400 }
      );
    }

    console.log('✅ Price ID found:', priceId);

    // Get the plan details
    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      console.error('❌ Invalid plan for price ID:', priceId);
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    console.log('✅ Plan found:', plan.name);

    // Check if customer already exists in our database
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userId)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.customer_id;
      console.log('✅ Existing customer found:', customerId);
    } else if (stripeSession.customer) {
      // Save customer to our database
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: userId,
          customer_id: stripeSession.customer as string,
        });
      
      customerId = stripeSession.customer as string;
      console.log('✅ New customer created:', customerId);
    } else {
      console.error('❌ No customer ID found in session');
      return NextResponse.json(
        { error: 'No customer ID found in session' },
        { status: 400 }
      );
    }

    // If there's a subscription, save it to our database
    if (stripeSession.subscription) {
      console.log('🔍 Processing subscription:', stripeSession.subscription);
      
      // Make sure subscription is a string before retrieving
      const subscriptionId = typeof stripeSession.subscription === 'string' 
        ? stripeSession.subscription 
        : stripeSession.subscription.id;
      
      console.log('🔍 Retrieving subscription details:', subscriptionId);
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      console.log('✅ Subscription retrieved:', {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end
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
      
      console.log('✅ Subscription saved to stripe_subscriptions');
      
      // Update user's subscription in subscriptions table
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_type: plan.name.toLowerCase(),
          credits_remaining: plan.tokensPerMonth,
          monthly_limit: plan.tokensPerMonth,
          stripe_subscription_id: subscription.id,
          status: 'active',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      console.log('✅ Subscription saved to subscriptions');
    }

    // Check if tokens have already been added for this session
    const { data: existingTokens } = await supabase
      .from('token_transactions')
      .select('id')
      .eq('reference_id', sessionId)
      .single();

    if (existingTokens) {
      console.log('⚠️ Tokens already added for this session:', existingTokens.id);
    } else {
      // Add tokens to the user's account using server-side function
      console.log('🔍 Adding tokens to user account:', plan.tokensPerMonth);
      
      const tokensAdded = await addUserTokensServer(
        userId,
        plan.tokensPerMonth,
        'purchase',
        `Purchased ${plan.name} plan - ${plan.tokensPerMonth} tokens added`,
        sessionId
      );

      if (!tokensAdded) {
        console.warn('⚠️ Failed to add tokens to user account, but payment was successful');
      } else {
        console.log('✅ Tokens added successfully');
      }

      // Update user_tokens table directly as a backup
      const { data: userTokens } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userTokens) {
        await supabase
          .from('user_tokens')
          .update({
            total_tokens: userTokens.total_tokens + plan.tokensPerMonth,
            tokens_remaining: userTokens.tokens_remaining + plan.tokensPerMonth,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        console.log('✅ User tokens table updated directly');
      } else {
        await supabase
          .from('user_tokens')
          .insert({
            user_id: userId,
            total_tokens: plan.tokensPerMonth,
            tokens_remaining: plan.tokensPerMonth,
            tokens_used: 0
          });
        
        console.log('✅ New user tokens record created');
      }
    }

    // Sync user tokens to ensure everything is up to date
    await syncUserTokensServer(userId);
    console.log('✅ User tokens synced');

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
        id: stripeSession.id,
        customer: stripeSession.customer,
        subscription: typeof stripeSession.subscription === 'object' ? stripeSession.subscription.id : stripeSession.subscription
      }
    });
  } catch (error) {
    console.error('❌ Error processing subscription success:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process subscription' },
      { status: 500 }
    );
  }
}