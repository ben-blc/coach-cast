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
import { getUserProfile, getUserSubscription as getDBSubscription, getUserCreditTransactions } from '@/lib/database';
import { getUserSubscription, isSubscriptionActive, stripeProducts, formatPrice, cancelSubscription, reactivateSubscription } from '@/lib/stripe';
import { Navbar } from '@/components/sections/Navbar';
import { useToast } from '@/hooks/use-toast';
import type { Profile, Subscription, CreditTransaction } from '@/lib/database';
import Link from 'next/link';

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stripeSubscription, setStripeSubscription] = useState<any>(null);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
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
        
        const [userProfile, userSubscription, stripeData, transactions] = await Promise.all([
          getUserProfile(currentUser.id),
          getDBSubscription(currentUser.id),
          getUserSubscription(),
          getUserCreditTransactions(currentUser.id)
        ]);
        
        setProfile(userProfile);
        setSubscription(userSubscription);
        setStripeSubscription(stripeData);
        setCreditTransactions(transactions);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case 'free': return 'Free Trial';
      case 'ai_explorer': return 'CoachBridge Explorer';
      case 'coaching_starter': return 'CoachBridge Starter';
      case 'coaching_accelerator': return 'CoachBridge Accelerator';
      default: return 'Free Trial';
    }
  };

  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case 'ai_explorer': return '$25';
      case 'coaching_starter': return '$69';
      case 'coaching_accelerator': return '$129';
      default: return '$0';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
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
        const stripeData = await getUserSubscription();
        setStripeSubscription(stripeData);
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
        const stripeData = await getUserSubscription();
        setStripeSubscription(stripeData);
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
      case 'purchase': return 'bg-green-100 text-green-800';
      case 'renewal': return 'bg-blue-100 text-blue-800';
      case 'usage': return 'bg-red-100 text-red-800';
      case 'refund': return 'bg-yellow-100 text-yellow-800';
      case 'bonus': return 'bg-purple-100 text-purple-800';
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

  if (!user || !profile || !subscription) {
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

  const hasActiveStripeSubscription = stripeSubscription && isSubscriptionActive(stripeSubscription.subscription_status);

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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {getPlanDisplayName(subscription.plan_type)}
                    </h3>
                    <p className="text-gray-600">
                      {getPlanPrice(subscription.plan_type)}/month
                    </p>
                  </div>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Credits Remaining</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {subscription.credits_remaining}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Limit</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {subscription.monthly_limit}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stripe Subscription Details */}
                {hasActiveStripeSubscription && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800">Active Stripe Subscription</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      {stripeSubscription.payment_method_brand && stripeSubscription.payment_method_last4 && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Payment Method:</span>
                          <span className="text-blue-900 font-medium">
                            {stripeSubscription.payment_method_brand.toUpperCase()} •••• {stripeSubscription.payment_method_last4}
                          </span>
                        </div>
                      )}
                      {stripeSubscription.current_period_end && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Next Billing:</span>
                          <span className="text-blue-900 font-medium">
                            {formatDate(stripeSubscription.current_period_end)}
                          </span>
                        </div>
                      )}
                      {stripeSubscription.cancel_at_period_end && (
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
                  
                  {hasActiveStripeSubscription && (
                    <div className="space-y-2">
                      {stripeSubscription.cancel_at_period_end ? (
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
                  )}
                </div>
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

                {subscription.trial_ends_at && subscription.status === 'trialing' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800">Trial Period</p>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Your trial ends on {formatDate(subscription.trial_ends_at)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Statistics */}
        <Card className="shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="w-5 h-5" />
              <span>Usage Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Coins className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Credits Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.monthly_limit - subscription.credits_remaining}
                </p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Credits Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.credits_remaining}
                </p>
                <p className="text-xs text-gray-500">Available now</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Plan Type</p>
                <p className="text-lg font-bold text-gray-900">
                  {getPlanDisplayName(subscription.plan_type)}
                </p>
                <p className="text-xs text-gray-500">
                  {hasActiveStripeSubscription ? 'Stripe Managed' : 'Local Account'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Transaction History */}
        {creditTransactions.length > 0 && (
          <Card className="shadow-lg mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Credit Transaction History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {creditTransactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                        {transaction.transaction_type}
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
                    <div className={`text-sm font-medium ${
                      transaction.credits_amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount} credits
                    </div>
                  </div>
                ))}
                {creditTransactions.length > 10 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing 10 most recent transactions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Information */}
        <Card className="shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Billing Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasActiveStripeSubscription ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">Billing Active</p>
                  </div>
                  <p className="text-sm text-green-700">
                    Your subscription is managed by Stripe with automatic billing.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Subscription Status</p>
                    <Badge className={getStatusColor(stripeSubscription.subscription_status)}>
                      {stripeSubscription.subscription_status}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Plan Name</p>
                    <p className="font-medium text-gray-900">
                      {getPlanDisplayName(subscription.plan_type)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No active billing subscription</p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}