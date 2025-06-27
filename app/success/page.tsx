'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Home, Play } from 'lucide-react';
import { getUserSubscription, getSubscriptionPlanName } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/sections/Navbar';
import Link from 'next/link';

export default function SuccessPage() {
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function loadSubscriptionData() {
      try {
        // Check if user is authenticated
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Fetch updated subscription data
        const subscription = await getUserSubscription();
        setSubscriptionData(subscription);
      } catch (error) {
        console.error('Error loading subscription data:', error);
        setError('Failed to load subscription information');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      loadSubscriptionData();
    } else {
      setError('No session ID found');
      setLoading(false);
    }
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 border-4 border-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Processing your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const planName = subscriptionData ? getSubscriptionPlanName(subscriptionData.price_id) : 'Your Plan';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Coach Bridge!
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            Your subscription has been successfully activated.
          </p>

          {subscriptionData && (
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-lg">
              {planName}
            </Badge>
          )}
        </div>

        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-center">What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <Play className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Start Your First Session</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Explore our coaching studio and begin your transformation journey.
                </p>
                <Button asChild className="w-full">
                  <Link href="/coaching-studio">
                    <Play className="w-4 h-4 mr-2" />
                    Explore Coaches
                  </Link>
                </Button>
              </div>

              <div className="bg-green-50 p-6 rounded-lg text-center">
                <Home className="w-8 h-8 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Visit Your Dashboard</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Track your progress, manage goals, and view your session history.
                </p>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {subscriptionData && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-medium">{planName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={subscriptionData.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {subscriptionData.subscription_status}
                  </Badge>
                </div>
                {subscriptionData.current_period_end && (
                  <div>
                    <p className="text-sm text-gray-600">Next Billing Date</p>
                    <p className="font-medium">
                      {new Date(subscriptionData.current_period_end * 1000).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {subscriptionData.payment_method_last4 && (
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">
                      {subscriptionData.payment_method_brand} •••• {subscriptionData.payment_method_last4}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Need help getting started? Check out our{' '}
            <Link href="/help" className="text-blue-600 hover:underline">
              help center
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}