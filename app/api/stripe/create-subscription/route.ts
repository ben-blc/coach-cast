import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromAuthHeader } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';
import { getPlanByPriceId } from '@/lib/subscription-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    console.log('Create subscription request received');
    
    const { priceId } = await request.json();

    if (!priceId) {
      console.error('No price ID provided');
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    console.log('Price ID:', priceId);

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    let user = await getUserFromAuthHeader(authHeader);
    
    if (!user) {
      console.error('No user found from auth header in create-subscription route');
      // Try to get user from session cookie as fallback
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('No authenticated user found');
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        );
      }
      user = session.user;
    }

    console.log('User authenticated:', user.id);

    // Validate the plan
    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      console.error('Invalid plan selected:', priceId);
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    console.log('Plan validated:', plan.name);

    // Check if user already has an active subscription
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      console.error('User already has an active subscription:', existingSubscription.id);
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer) {
      console.log('Existing customer found:', existingCustomer.customer_id);
      customerId = existingCustomer.customer_id;
    } else {
      console.log('Creating new Stripe customer');
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;
      console.log('New customer created:', customerId);

      // Save customer to database
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: customerId,
        });
      
      console.log('Customer saved to database');
    }

    // Create checkout session
    console.log('Creating checkout session');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing?error=${encodeURIComponent('Payment was cancelled')}`,
      metadata: {
        user_id: user.id,
        price_id: priceId,
        plan_name: plan.name,
      },
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      url: session.url
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}