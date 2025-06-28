'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  User, 
  Settings,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Coins,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/database';
import { 
  getSubscriptionStatus, 
  isSubscriptionActive, 
  formatPrice, 
  cancelSubscription, 
  reactivateSubscription 
} from '@/lib/stripe-enhanced';
import { getUserActiveSubscription, getUserTransactionHistory } from '@/lib/subscription-service';
import { Navbar } from '@/components/sections/Navbar';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/database';
import Link from 'next/link';

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/auth');
          return;
        }

        setUser(currentUser);
        
        const [userProfile, activeSubscription, transactionHistory] = await Promise.all([
          getUserProfile(currentUser.id),
          getUserActiveSubscription(),
          getUserTransactionHistory()
        ]);
        
        setProfile(userProfile);
        setSubscription(activeSubscription);
        setTransactions(transactionHistory);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await cancelSubscription();
      if (result.success) {
        toast({
          title: 'Subscription Cancelled',
          description: result.message,
        });
        // Refresh subscription data
        const activeSubscription = await getUserActiveSubscription();
        setSubscription(activeSubscription);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to cancel subscription',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading(true);
    try {
      const result = await reactivateSubscription();
      if (result.success) {
        toast({
          title: 'Subscription Reactivated',
          description: result.message,
        });
        // Refresh subscription data
        const activeSubscription = await getUserActiveSubscription();
        setSubscription(activeSubscription);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reactivate subscription',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reactivate subscription',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'subscription_created': return 'bg-green-100 text-green-800';
      case 'subscription_renewed': return 'bg-blue-100 text-blue-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      case 'subscription_canceled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading billing information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-700 mb-4">
              You need to be signed in to view billing information.
            </p>
            <Button asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Plan */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Current Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscription ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {subscription.plan_name}
                        </h3>
                        <p className="text-gray-600">
                          {subscription.tokens_remaining} tokens remaining
                        </p>
                      </div>
                      <Badge className={subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {subscription.status}
                      </Badge>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Tokens Remaining</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {subscription.tokens_remaining}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Monthly Allocation</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {subscription.tokens_allocated}
                          </p>
                        </div>
                      </div>
                    </div>

                    {subscription.current_period_end && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-800">Active Subscription</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Next Billing:</span>
                            <span className="text-blue-900 font-medium">
                              {formatDate(subscription.current_period_end)}
                            </span>
                          </div>
                          {subscription.cancel_at_period_end && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Status:</span>
                              <span className="text-red-600 font-medium">Cancels at period end</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t space-y-3">
                      <Button asChild className="w-full">
                        <Link href="/pricing">
                          <Settings className="w-4 h-4 mr-2" />
                          Change Plan
                        </Link>
                      </Button>
                      
                      <div className="space-y-2">
                        {subscription.cancel_at_period_end ? (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={handleReactivateSubscription}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Reactivate Subscription
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full text-red-600 border-red-300 hover:bg-red-50"
                            onClick={handleCancelSubscription}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <ExternalLink className="w-4 h-4 mr-2" />
                            )}
                            Cancel Subscription
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No active subscription</p>
                    <p className="text-sm mt-2">
                      You're currently on a free plan. Upgrade to access premium features.
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/pricing">
                        View Plans
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{profile.full_name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{profile.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Account Type</p>
                  <Badge variant="outline">
                    {profile.user_type === 'client' ? 'Client' : 'Coach'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(profile.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <Card className="shadow-lg mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Transaction History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getTransactionTypeColor(transaction.event_type)}>
                        {transaction.event_type.replace('_', ' ')}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(transaction.amount_paid)}
                      </div>
                      <div className="text-xs text-green-600">
                        +{transaction.tokens_granted} tokens
                      </div>
                    </div>
                  </div>
                ))}
                {transactions.length > 10 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing 10 most recent transactions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}