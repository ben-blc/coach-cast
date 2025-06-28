'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/sections/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Sparkles, Crown, Rocket, User, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { stripeProducts, redirectToStripeCheckout, formatPrice, type StripeProduct } from '@/lib/stripe';
import Link from 'next/link';

const planIcons = {
  'price_1RXeYbEREG4CzjmmBKcnXTHc': Sparkles,
  'price_1ReBMSEREG4CzjmmiB7ZN5hL': Crown,
  'price_1ReBNEEREG4CzjmmnOtrbc5F': Rocket,
};

const planFeatures = {
  'price_1RXeYbEREG4CzjmmBKcnXTHc': [
    '50 AI Coaching Credits per month',
    'Access to all AI coaches',
    'Goal tracking dashboard',
    'Email support',
    'Session analytics',
    'Perfect for self-starters'
  ],
  'price_1ReBMSEREG4CzjmmiB7ZN5hL': [
    '250 AI Coaching Credits per month',
    'Access to all AI coaches',
    'Human expert guidance',
    'Webinars and group coaching',
    'Priority support',
    'Advanced analytics',
    'Document sharing',
    'Goal tracking & progress reports'
  ],
  'price_1ReBNEEREG4CzjmmnOtrbc5F': [
    '600 AI Coaching Credits per month',
    'AI Voice & Video Coaching',
    'All AI coaches available',
    'Premium features',
    'Priority scheduling',
    'Exclusive workshops',
    'Personal coaching consultant',
    'Advanced analytics & insights'
  ],
};

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  const handleSubscribe = async (product: StripeProduct) => {
    try {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to subscribe to a plan.',
          variant: 'destructive',
        });
        return;
      }

      setSubscribing(product.priceId);

      // Redirect to Stripe Checkout
      await redirectToStripeCheckout(product.priceId);

    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process subscription. Please try again.',
        variant: 'destructive',
      });
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <main className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Coaching Journey
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Unlock your potential with AI-powered coaching and human expertise.
            </p>
          </div>

          {/* Authentication Alert */}
          {!user && !loading && (
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

              return (
                <Card
                  key={product.priceId}
                  className={`relative border-2 hover:shadow-lg transition-all duration-300 ${
                    isPopular ? 'border-green-200 ring-2 ring-green-200' : 'border-gray-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                        <Icon className="w-6 h-6 text-blue-600" />
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
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{product.description}</p>
                    <Badge variant="outline" className="mt-2">
                      {product.credits} Credits/Month
                    </Badge>
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                      onClick={() => handleSubscribe(product)}
                      disabled={!user || subscribing === product.priceId}
                    >
                      {subscribing === product.priceId ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirecting to Stripe...
                        </>
                      ) : (
                        'Subscribe Now'
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
            <p className="text-sm text-gray-500 mb-6">
              Secure payments powered by Stripe. Cancel anytime.
            </p>
            {!user && !loading && (
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth">
                  <User className="w-4 h-4 mr-2" />
                  Sign In to Get Started
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}