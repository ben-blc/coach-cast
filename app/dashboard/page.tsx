'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  Video, 
  Users, 
  Clock, 
  Play, 
  Calendar,
  BarChart3,
  Settings,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { getCurrentUser } from '@/lib/auth';
import { getUserProfile, getUserSubscription, getUserSessions } from '@/lib/database';
import type { Profile, Subscription, CoachingSession } from '@/lib/database';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Calculate credits used from sessions
  const calculateCreditsUsed = (sessions: CoachingSession[]): number => {
    return sessions.reduce((total, session) => {
      // Only count completed sessions
      if (session.status === 'completed') {
        return total + (session.credits_used || 0);
      }
      return total;
    }, 0);
  };

  // Calculate actual credits remaining
  const calculateCreditsRemaining = (subscription: Subscription | null, sessions: CoachingSession[]): number => {
    if (!subscription) return 0;
    
    const creditsUsed = calculateCreditsUsed(sessions);
    const remaining = subscription.monthly_limit - creditsUsed;
    
    return Math.max(0, remaining); // Ensure it doesn't go below 0
  };

  // Format session duration for display (rounds up to minute if >15 seconds)
  const formatSessionDuration = (durationSeconds: number): string => {
    if (durationSeconds <= 15) {
      return `${durationSeconds}s`;
    } else {
      // Round up to the nearest minute for sessions over 15 seconds
      const minutes = Math.ceil(durationSeconds / 60);
      return `${minutes} min`;
    }
  };

  // Get display minutes for session (consistent with credit calculation)
  const getSessionDisplayMinutes = (durationSeconds: number): number => {
    if (durationSeconds <= 15) {
      return 0; // Show as 0 minutes for free sessions
    } else {
      return Math.ceil(durationSeconds / 60); // Round up to nearest minute
    }
  };

  // Function to load all user data
  const loadUserData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      }

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/auth');
        return;
      }

      setUser(currentUser);
      
      const [userProfile, userSubscription, userSessions] = await Promise.all([
        getUserProfile(currentUser.id),
        getUserSubscription(currentUser.id),
        getUserSessions(currentUser.id)
      ]);

      setProfile(userProfile);
      setSubscription(userSubscription);
      setSessions(userSessions);

      // Redirect to onboarding if not completed
      if (userProfile && !userProfile.onboarding_completed) {
        router.push('/onboarding');
        return;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadUserData();
  }, [router]);

  // Auto-refresh data when returning from a session
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        console.log('Page became visible, refreshing data...');
        loadUserData(true);
      }
    };

    const handleFocus = () => {
      if (!loading) {
        console.log('Window focused, refreshing data...');
        loadUserData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loading]);

  // Check URL params for refresh trigger
  useEffect(() => {
    const tab = searchParams.get('tab');
    const refresh = searchParams.get('refresh');
    
    if (refresh === 'true' || tab === 'sessions') {
      console.log('URL indicates refresh needed, reloading data...');
      loadUserData(true);
    }
  }, [searchParams]);

  // Manual refresh function
  const handleRefresh = () => {
    loadUserData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || !subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-2">
            Failed to load your dashboard data.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Please try refreshing the page or contact support if the problem persists.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case 'free': return 'Free Trial';
      case 'ai_explorer': return 'AI Explorer';
      case 'coaching_starter': return 'Coaching Starter';
      case 'coaching_accelerator': return 'Coaching Accelerator';
      default: return 'Free Trial';
    }
  };

  // Calculate session statistics
  const totalSessionTime = sessions.reduce((total, session) => total + session.duration_seconds, 0);
  const totalMinutes = Math.floor(totalSessionTime / 60);
  const creditsUsed = calculateCreditsUsed(sessions);
  const creditsRemaining = calculateCreditsRemaining(subscription, sessions);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        user={{
          name: profile.full_name,
          email: profile.email,
          plan: getPlanDisplayName(subscription.plan_type),
          creditsRemaining: creditsRemaining,
          totalCredits: subscription.monthly_limit
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile.full_name.split(' ')[0]}!</h1>
              <p className="text-gray-600 mt-2">
                {subscription.plan_type === 'free' 
                  ? `You have ${creditsRemaining} minutes remaining in your free trial.`
                  : `You have ${creditsRemaining} credits remaining this month.`
                }
              </p>
              {creditsUsed > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {creditsUsed} {subscription.plan_type === 'free' ? 'minutes' : 'credits'} used from {sessions.filter(s => s.status === 'completed').length} completed sessions
                </p>
              )}
            </div>
            {refreshing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Refreshing...</span>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalMinutes} minutes total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creditsUsed}</div>
                  <p className="text-xs text-muted-foreground">
                    from {sessions.filter(s => s.status === 'completed').length} completed sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creditsRemaining}</div>
                  <p className="text-xs text-muted-foreground">
                    of {subscription.monthly_limit} {subscription.plan_type === 'free' ? 'minutes' : 'credits'}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="mt-2 text-xs"
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getPlanDisplayName(subscription.plan_type)}</div>
                  <p className="text-xs text-muted-foreground">
                    {subscription.status === 'trialing' ? 'Trial active' : 'Active subscription'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <p className="text-sm text-gray-600">
                    Start a new coaching session or explore your options.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" asChild>
                    <a href="/discovery">
                      <Play className="h-4 w-4 mr-2" />
                      Start New Session
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Live Session
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Browse Coaches
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.slice(0, 3).map((session) => (
                        <div key={session.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {session.session_type === 'ai_specialist' ? 'AI Specialist' : 
                               session.session_type === 'digital_chemistry' ? 'Digital Chemistry' :
                               session.session_type === 'human_voice_ai' ? 'Human Voice AI' : 'Live Human'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatSessionDuration(session.duration_seconds)} • {session.credits_used || 0} credits • {new Date(session.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {session.status === 'completed' ? '✓' : session.status === 'active' ? '⏳' : '✗'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No sessions yet</p>
                      <p className="text-sm text-gray-500">Start your first coaching session to see it here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Credit Usage Breakdown */}
            {sessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Credit Usage Breakdown</CardTitle>
                  <p className="text-sm text-gray-600">
                    Detailed view of how your credits have been used
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-800">Free Sessions (≤15 seconds)</p>
                        <p className="text-xs text-green-600">
                          {sessions.filter(s => s.status === 'completed' && s.duration_seconds <= 15).length} sessions
                        </p>
                      </div>
                      <div className="text-green-800 font-bold">0 credits</div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Paid Sessions (>15 seconds)</p>
                        <p className="text-xs text-blue-600">
                          {sessions.filter(s => s.status === 'completed' && s.duration_seconds > 15).length} sessions
                        </p>
                      </div>
                      <div className="text-blue-800 font-bold">{creditsUsed} credits</div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-t">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Remaining Credits</p>
                        <p className="text-xs text-gray-600">Available for use</p>
                      </div>
                      <div className="text-gray-800 font-bold">{creditsRemaining} credits</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Sessions</h2>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button asChild>
                  <a href="/discovery">
                    <Play className="h-4 w-4 mr-2" />
                    New Session
                  </a>
                </Button>
              </div>
            </div>

            {sessions.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sessions.map((session) => (
                  <SessionCard key={session.id} session={{
                    id: session.id,
                    type: session.session_type === 'ai_specialist' ? 'AI Specialist' : 
                          session.session_type === 'digital_chemistry' ? 'Digital Chemistry' :
                          session.session_type === 'human_voice_ai' ? 'Human Voice AI' : 'Live Human',
                    coach: session.ai_coach_id ? 'AI Coach' : 'Human Coach',
                    date: session.created_at,
                    duration: getSessionDisplayMinutes(session.duration_seconds),
                    summary: session.summary || 'Session completed successfully.',
                    goals: session.goals || []
                  }} detailed />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                <p className="text-gray-600 mb-6">
                  Start your first coaching session to begin your journey.
                </p>
                <Button asChild>
                  <a href="/discovery">
                    <Play className="h-4 w-4 mr-2" />
                    Start First Session
                  </a>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="goals">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Goal Tracking</h3>
              <p className="text-gray-600">
                Goal tracking features will be available soon.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600">
                Account settings will be available soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}