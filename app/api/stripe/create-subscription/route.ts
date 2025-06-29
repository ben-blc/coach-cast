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
    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromAuthHeader(authHeader);
    
    if (!user) {
      console.error('No user found in create-subscription route');
      // Try to get user from session cookie as fallback
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        );
      }
    }

    // Validate the plan
    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user?.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
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
      .eq('user_id', user?.id)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user?.email,
        metadata: {
          supabase_user_id: user?.id,
        },
      });

      customerId = customer.id;

      // Save customer to database
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: user?.id,
          customer_id: customerId,
        });
    }

    // Create checkout session
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
      cancel_url: `${request.nextUrl.origin}/pricing`,
      metadata: {
        user_id: user?.id,
        price_id: priceId,
        plan_name: plan.name,
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}