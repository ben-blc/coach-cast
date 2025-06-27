'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Home, Play, Loader2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getUserSubscription } from '@/lib/stripe';
import { Navbar } from '@/components/sections/Navbar';
import Link from 'next/link';

export default function SuccessPage() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (!currentUser) {
          router.push('/auth');
          return;
        }

        // If we have a session ID, wait a moment for webhook to process
        if (sessionId) {
          // Wait 3 seconds for webhook processing
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Load subscription data
        const subscriptionData = await getUserSubscription();
        setSubscription(subscriptionData);

      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Processing your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  const planName = subscription?.subscription_status === 'active' 
    ? 'Your Premium Plan' 
    : 'Coach Bridge Subscription';

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
            {sessionId 
              ? 'Your subscription has been successfully activated.'
              : 'Thank you for joining Coach Bridge!'
            }
          </p>

          {subscription && (
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-lg">
              {subscription.subscription_status === 'active' ? 'Active Subscription' : planName}
            </Badge>
          )}
        </div>

        {/* Subscription Details */}
        {subscription && subscription.subscription_status === 'active' && (
          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-center">Your Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Plan Status</h3>
                  <Badge className="bg-green-100 text-green-800">
                    {subscription.subscription_status}
                  </Badge>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
                  <p className="text-gray-600">
                    {subscription.payment_method_brand && subscription.payment_method_last4
                      ? `${subscription.payment_method_brand.toUpperCase()} •••• ${subscription.payment_method_last4}`
                      : 'Card on file'
                    }
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Next Billing</h3>
                  <p className="text-gray-600">
                    {subscription.current_period_end
                      ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Your subscription is now active and ready to use. Start exploring our coaching platform!
          </p>
          <Badge variant="outline" className="text-green-600 border-green-300">
            Powered by Stripe
          </Badge>
        </div>
      </div>
    </div>
  );
}