'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Sparkles, Crown, Rocket, Loader2, CreditCard, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession, stripeProducts, formatPrice, getUserSubscription, getSubscriptionPlanName, isSubscriptionActive } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/sections/Navbar';
import { Footer } from '@/components/sections/Footer';
import Link from 'next/link';

const planFeatures = {
  'price_1RXeYbEREG4CzjmmBKcnXTHc': [
    '50 AI Coaching Credits per month',
    "Use credits with any AI Coach (SpecialistCoach, 'Natalie AI', 'Fatten AI')",
    'Access to the Coaching Pathway dashboard to set and track goals',
    'Book live sessions with human coaches on an A La Carte (pay-per-session) basis',
  ],
  'price_1ReBMSEREG4CzjmmiB7ZN5hL': [
    '250 AI Coaching Credits per month for support between live sessions',
    'Full access to the Coaching Pathway dashboard and progress tracking',
    'Secure document sharing with your chosen human coach',
    'Priority customer support',
  ],
  'price_1ReBNEEREG4CzjmmnOtrbc5F': [
    '600 AI Coaching Credits per month',
    'All features from the Coaching Starter plan',
    'Priority scheduling and access to exclusive workshops',
    'Advanced analytics and progress tracking',
  ],
};

const planIcons = {
  'price_1RXeYbEREG4CzjmmBKcnXTHc': Sparkles,
  'price_1ReBMSEREG4CzjmmiB7ZN5hL': Crown,
  'price_1ReBNEEREG4CzjmmnOtrbc5F': Rocket,
};

const planColors = {
  'price_1RXeYbEREG4CzjmmBKcnXTHc': 'border-blue-200',
  'price_1ReBMSEREG4CzjmmiB7ZN5hL': 'border-green-200 ring-2 ring-green-200',
  'price_1ReBNEEREG4CzjmmnOtrbc5F': 'border-purple-200',
};

const planButtonColors = {
  'price_1RXeYbEREG4CzjmmBKcnXTHc': 'bg-blue-600 hover:bg-blue-700',
  'price_1ReBMSEREG4CzjmmiB7ZN5hL': 'bg-green-600 hover:bg-green-700',
  'price_1ReBNEEREG4CzjmmnOtrbc5F': 'bg-purple-600 hover:bg-purple-700',
};

export default function PricingPage() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const subscriptionData = await getUserSubscription();
          setSubscription(subscriptionData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoadingPriceId(priceId);

      // Check if user is authenticated
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to subscribe to a plan.',
          variant: 'destructive',
        });
        return;
      }

      const successUrl = `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/pricing`;

      const result = await createCheckoutSession(priceId, successUrl, cancelUrl);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPriceId(null);
    }
  };

  const isCurrentPlan = (priceId: string) => {
    return subscription?.price_id === priceId;
  };

  const hasActiveSubscription = () => {
    return subscription && isSubscriptionActive(subscription.subscription_status);
  };

  const getButtonText = (priceId: string) => {
    if (isCurrentPlan(priceId)) {
      return 'Current Plan';
    }
    if (hasActiveSubscription()) {
      return 'Switch Plan';
    }
    return 'Get Started';
  };

  const getButtonDisabled = (priceId: string) => {
    return isCurrentPlan(priceId) || loadingPriceId === priceId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Coaching Journey
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock your potential with AI-powered coaching and human expertise.
          </p>
        </div>

        {/* Current Subscription Status */}
        {user && subscription && (
          <div className="mb-12">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Current Subscription</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {getSubscriptionPlanName(subscription.price_id)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={isSubscriptionActive(subscription.subscription_status) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {subscription.subscription_status}
                      </Badge>
                      {subscription.cancel_at_period_end && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Cancels at period end
                        </Badge>
                      )}
                    </div>
                    {subscription.current_period_end && (
                      <p className="text-sm text-gray-600 mt-2">
                        {subscription.cancel_at_period_end ? 'Ends' : 'Renews'} on{' '}
                        {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {subscription.payment_method_last4 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CreditCard className="w-4 h-4" />
                        <span>{subscription.payment_method_brand} •••• {subscription.payment_method_last4}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Authentication Alert */}
        {!user && (
          <Alert className="mb-8 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <Link href="/auth" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>{' '}
              to subscribe to a plan and start your coaching journey.
            </AlertDescription>
          </Alert>
        )}

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {stripeProducts.map((product, index) => {
            const Icon = planIcons[product.priceId as keyof typeof planIcons];
            const features = planFeatures[product.priceId as keyof typeof planFeatures] || [];
            const isPopular = product.priceId === 'price_1ReBMSEREG4CzjmmiB7ZN5hL';
            const isLoading = loadingPriceId === product.priceId;
            const isCurrent = isCurrentPlan(product.priceId);

            return (
              <Card
                key={product.priceId}
                className={`relative ${planColors[product.priceId as keyof typeof planColors]} hover:shadow-lg transition-all duration-300 ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-blue-600 text-white px-3 py-1">
                      Current
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        product.priceId === 'price_1ReBNEEREG4CzjmmnOtrbc5F'
                          ? 'bg-purple-100'
                          : product.priceId === 'price_1ReBMSEREG4CzjmmiB7ZN5hL'
                          ? 'bg-green-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          product.priceId === 'price_1ReBNEEREG4CzjmmnOtrbc5F'
                            ? 'text-purple-600'
                            : product.priceId === 'price_1ReBMSEREG4CzjmmiB7ZN5hL'
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }`}
                      />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {product.name}
                  </CardTitle>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start space-x-3"
                      >
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      isCurrent 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : planButtonColors[product.priceId as keyof typeof planButtonColors]
                    } text-white`}
                    size="lg"
                    onClick={() => handleSubscribe(product.priceId)}
                    disabled={getButtonDisabled(product.priceId) || !user}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      getButtonText(product.priceId)
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Information */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include access to our full coaching platform and 24/7 support.
          </p>
          {!user && (
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth">
                <User className="w-4 h-4 mr-2" />
                Sign In to Get Started
              </Link>
            </Button>
          )}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I change my plan anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens to unused credits?</h3>
              <p className="text-gray-600 text-sm">
                Unused credits expire at the end of each billing cycle. We recommend using your credits throughout the month for the best coaching experience.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my subscription?</h3>
              <p className="text-gray-600 text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 text-sm">
                Yes, all new users get a 7-day free trial with limited credits to explore our coaching platform before committing to a plan.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}