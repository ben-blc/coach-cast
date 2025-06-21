'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { getCurrentUser } from '@/lib/auth';
import { getUserProfile, getUserSubscription, getUserSessions, ensureUserProfile, ensureUserSubscription } from '@/lib/database';
import type { Profile, Subscription, CoachingSession } from '@/lib/database';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/auth');
        return;
      }

      setUser(currentUser);
      
      // Get or create user profile and subscription
      let userProfile = await getUserProfile(currentUser.id);
      let userSubscription = await getUserSubscription(currentUser.id);

      // If profile doesn't exist, create it
      if (!userProfile) {
        console.log('Creating profile for user...');
        userProfile = await ensureUserProfile(
          currentUser.id, 
          currentUser.email || '', 
          currentUser.user_metadata?.full_name || 'User'
        );
      }

      // If subscription doesn't exist, create it
      if (!userSubscription) {
        console.log('Creating subscription for user...');
        userSubscription = await ensureUserSubscription(currentUser.id);
      }

      // Get user sessions
      const userSessions = await getUserSessions(currentUser.id);

      setProfile(userProfile);
      setSubscription(userSubscription);
      setSessions(userSessions);

      // If we still don't have profile or subscription, redirect to discovery
      if (!userProfile || !userSubscription) {
        console.log('Unable to create profile/subscription, redirecting to discovery...');
        router.push('/discovery');
        return;
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      // On error, redirect to discovery to try again
      router.push('/discovery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Setup Required</h1>
          <p className="text-gray-700 mb-2">
            We need to set up your profile and subscription.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            You'll be redirected to complete the setup process.
          </p>
          <Button onClick={() => router.push('/discovery')}>
            Complete Setup
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
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
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Welcome back, {profile.full_name.split(' ')[0]}!</h1>
              </div>
              <p className="text-blue-100 text-lg mb-6">
                {subscription.plan_type === 'free' 
                  ? `You have ${creditsRemaining} minutes remaining in your free trial.`
                  : `You have ${creditsRemaining} credits remaining this month.`
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  asChild
                >
                  <a href="/discovery">
                    <Play className="w-4 h-4 mr-2" />
                    Start New Session
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10"
                  asChild
                >
                  <a href="/pricing">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </a>
                </Button>
              </div>
            </div>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Total Sessions</CardTitle>
                  <Mic className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{sessions.length}</div>
                  <p className="text-xs text-blue-700">
                    {totalMinutes} minutes total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Credits Used</CardTitle>
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{creditsUsed}</div>
                  <p className="text-xs text-green-700">
                    from {sessions.filter(s => s.status === 'completed').length} completed sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Credits Remaining</CardTitle>
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{creditsRemaining}</div>
                  <p className="text-xs text-purple-700">
                    of {subscription.monthly_limit} {subscription.plan_type === 'free' ? 'minutes' : 'credits'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Current Plan</CardTitle>
                  <Award className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-orange-900">{getPlanDisplayName(subscription.plan_type)}</div>
                  <p className="text-xs text-orange-700">
                    {subscription.status === 'trialing' ? 'Trial active' : 'Active subscription'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Start a new coaching session or explore your options.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" asChild>
                      <a href="/discovery">
                        <Play className="h-4 w-4 mr-2" />
                        Start AI Coaching Session
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50">
                      <Video className="h-4 w-4 mr-2" />
                      Watch Coach Previews
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-purple-200 text-purple-700 hover:bg-purple-50">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Live Session
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-orange-200 text-orange-700 hover:bg-orange-50">
                      <Users className="h-4 w-4 mr-2" />
                      Browse All Coaches
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sessions */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span>Recent Sessions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.slice(0, 3).map((session) => (
                        <div key={session.id} className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
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
                      <Button variant="ghost" className="w-full mt-4" asChild>
                        <a href="/dashboard?tab=sessions">
                          View All Sessions
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mic className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-gray-600 font-medium">No sessions yet</p>
                      <p className="text-sm text-gray-500 mb-4">Start your first coaching session to see it here</p>
                      <Button asChild>
                        <a href="/discovery">
                          <Play className="h-4 w-4 mr-2" />
                          Start First Session
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Credit Usage Breakdown */}
            {sessions.length > 0 && (
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <span>Credit Usage Breakdown</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Detailed view of how your credits have been used
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div>
                        <p className="text-sm font-medium text-green-800">Free Sessions (≤15 seconds)</p>
                        <p className="text-xs text-green-600">
                          {sessions.filter(s => s.status === 'completed' && s.duration_seconds <= 15).length} sessions
                        </p>
                      </div>
                      <div className="text-green-800 font-bold text-lg">0 credits</div>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Paid Sessions (>15 seconds)</p>
                        <p className="text-xs text-blue-600">
                          {sessions.filter(s => s.status === 'completed' && s.duration_seconds > 15).length} sessions
                        </p>
                      </div>
                      <div className="text-blue-800 font-bold text-lg">{creditsUsed} credits</div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div>
                        <p className="text-sm font-medium text-purple-800">Remaining Credits</p>
                        <p className="text-xs text-purple-600">Available for use</p>
                      </div>
                      <div className="text-purple-800 font-bold text-lg">{creditsRemaining} credits</div>
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
                <Button asChild>
                  <a href="/discovery">
                    <Play className="h-4 w-4 mr-2" />
                    New Session
                  </a>
                </Button>
              </div>
            </div>

            {sessions.length > 0 ? (
              <div className="flex flex-col gap-6">
                {sessions.map((session) => (
                  <div key={session.id}>
                    <SessionCard session={{
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mic className="h-10 w-10 text-blue-600" />
                </div>
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
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Goal Tracking</h3>
              <p className="text-gray-600">
                Goal tracking features will be available soon.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="h-10 w-10 text-gray-600" />
              </div>
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