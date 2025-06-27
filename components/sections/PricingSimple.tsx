'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Sparkles, Crown, Rocket, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  stripeProducts, 
  formatPrice, 
  redirectToStripeCheckout, 
  getMockSubscription, 
  setMockSubscription,
  type MockSubscription 
} from '@/lib/stripe-simple';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

const planFeatures = {
  'price_1RXeYbEREG4CzjmmBKcnXTHc': [
    '50 AI Coaching Credits per month',
    'Access to all AI coaches',
    'Goal tracking dashboard',
    'Basic support',
  ],
  'price_1ReBMSEREG4CzjmmiB7ZN5hL': [
    '250 AI Coaching Credits per month',
    'Priority support',
    'Advanced analytics',
    'Document sharing',
  ],
  'price_1ReBNEEREG4CzjmmnOtrbc5F': [
    '600 AI Coaching Credits per month',
    'Premium features',
    'Priority scheduling',
    'Exclusive workshops',
  ],
};

const planIcons = {
  'price_1RXeYbEREG4CzjmmBKcnXTHc': Sparkles,
  'price_1ReBMSEREG4CzjmmiB7ZN5hL': Crown,
  'price_1ReBNEEREG4CzjmmnOtrbc5F': Rocket,
};

export function PricingSimple() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<MockSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser && typeof window !== 'undefined') {
          const mockSub = getMockSubscription();
          setSubscription(mockSub);
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
      // Check if user is authenticated
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to subscribe to a plan.',
          variant: 'destructive',
        });
        return;
      }

      // Set mock subscription for demo
      setMockSubscription(priceId);
      setSubscription(getMockSubscription());

      toast({
        title: 'Success!',
        description: 'Your subscription has been activated (demo mode).',
      });

      // Redirect to success page
      setTimeout(() => {
        window.location.href = `/success?plan=${encodeURIComponent(stripeProducts.find(p => p.priceId === priceId)?.name || 'Plan')}`;
      }, 1000);

    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to process subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isCurrentPlan = (priceId: string) => {
    return subscription?.priceId === priceId;
  };

  const getButtonText = (priceId: string) => {
    if (isCurrentPlan(priceId)) {
      return 'Current Plan';
    }
    return 'Get Started';
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
                      {subscription.planName}
                    </p>
                    <Badge className="bg-green-100 text-green-800 mt-1">
                      {subscription.status}
                    </Badge>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    Demo Mode
                  </Badge>
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

        {/* Demo Mode Alert */}
        <Alert className="mb-8 max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> This is a simplified version for demonstration. 
            Subscriptions are simulated and no actual payment processing occurs.
          </AlertDescription>
        </Alert>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {stripeProducts.map((product, index) => {
            const Icon = planIcons[product.priceId as keyof typeof planIcons];
            const features = planFeatures[product.priceId as keyof typeof planFeatures] || [];
            const isPopular = product.priceId === 'price_1ReBMSEREG4CzjmmiB7ZN5hL';
            const isCurrent = isCurrentPlan(product.priceId);

            return (
              <Card
                key={product.priceId}
                className={`relative border-2 hover:shadow-lg transition-all duration-300 ${
                  isPopular ? 'border-green-200 ring-2 ring-green-200' : 'border-gray-200'
                } ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
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
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                    size="lg"
                    onClick={() => handleSubscribe(product.priceId)}
                    disabled={isCurrent || !user}
                  >
                    {getButtonText(product.priceId)}
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
      </div>
    </section>
  );
}