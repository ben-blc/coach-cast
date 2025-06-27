'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Crown, Rocket, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession, stripeProducts, formatPrice } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth';
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

export function Pricing() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoadingPriceId(priceId);

      // Check if user is authenticated
      const user = await getCurrentUser();
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

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Coaching Journey
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a free trial, then select the plan that fits your growth goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {stripeProducts.map((product, index) => {
            const Icon = planIcons[product.priceId as keyof typeof planIcons];
            const features = planFeatures[product.priceId as keyof typeof planFeatures] || [];
            const isPopular = product.priceId === 'price_1ReBMSEREG4CzjmmiB7ZN5hL';
            const isLoading = loadingPriceId === product.priceId;

            return (
              <Card
                key={product.priceId}
                className={`relative ${planColors[product.priceId as keyof typeof planColors]} hover:shadow-lg transition-all duration-300`}
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
                    className={`w-full ${planButtonColors[product.priceId as keyof typeof planButtonColors]} text-white`}
                    size="lg"
                    onClick={() => handleSubscribe(product.priceId)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Get Started'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include a 7-day free trial. No credit card required.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link href="/discovery">Try Free Demo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}