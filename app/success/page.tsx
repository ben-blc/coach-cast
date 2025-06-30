'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Home, Play, Loader2, Coins } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { useUserTokens } from '@/hooks/use-tokens';
import { Navbar } from '@/components/sections/Navbar';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SuccessPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const { tokens, refreshTokens } = useUserTokens();

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (!currentUser) {
          router.push('/auth');
          return;
        }

        // If we have a session ID, process the payment success
        if (sessionId) {
          await processPaymentSuccess(sessionId);
        } else {
          setProcessingPayment(false);
        }

        // Refresh tokens to get the latest balance
        await refreshTokens();
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data. Please try again.');
        setProcessingPayment(false);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router, sessionId, refreshTokens]);

  const processPaymentSuccess = async (sessionId: string) => {
    try {
      // Get the auth token for the API request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      // Call the success API endpoint
      const response = await fetch(`/api/stripe/success?session_id=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }

      // Refresh tokens to get the updated balance
      await refreshTokens();
    } catch (error) {
      console.error('Error processing payment success:', error);
      setError(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

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
            {processingPayment 
              ? 'Processing your subscription...'
              : sessionId 
                ? 'Your subscription has been successfully activated.'
                : 'Thank you for joining Coach Bridge!'
            }
          </p>

          {tokens && (
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-lg">
              {tokens.plan_name} Plan Active
            </Badge>
          )}
        </div>

        {error && (
          <Card className="shadow-lg mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-center text-red-700">Error Processing Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 text-center">{error}</p>
              <div className="flex justify-center mt-4">
                <Button variant="outline" asChild>
                  <Link href="/pricing">
                    Return to Pricing
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Details */}
        {tokens && !error && (
          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-center">Your Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Plan Type</h3>
                  <p className="text-lg font-medium text-blue-800">
                    {tokens.plan_name}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Tokens Available</h3>
                  <div className="flex items-center justify-center space-x-2">
                    <Coins className="h-5 w-5 text-green-600" />
                    <p className="text-lg font-medium text-green-800">
                      {tokens.tokens_remaining} / {tokens.total_tokens}
                    </p>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                  <Badge className={tokens.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                    {tokens.subscription_status}
                  </Badge>
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
            {tokens 
              ? `Your ${tokens.plan_name} subscription is now active with ${tokens.tokens_remaining} tokens available.`
              : 'Your account is ready to use. Start exploring our coaching platform!'}
          </p>
          <Badge variant="outline" className="text-green-600 border-green-300">
            Powered by Stripe
          </Badge>
        </div>
      </div>
    </div>
  );
}