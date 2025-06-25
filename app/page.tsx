'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Hero } from '@/components/sections/Hero';
import { Features } from '@/components/sections/Features';
import { Pricing } from '@/components/sections/Pricing';
import { CoachCTA } from '@/components/sections/CoachCTA';
import { Footer } from '@/components/sections/Footer';
import { Navbar } from '@/components/sections/Navbar';
import { getCurrentUser } from '@/lib/auth';

// Import dashboard components for authenticated users
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { GoalsTab } from '@/components/goals/GoalsTab';
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
  TrendingUp,
  Target,
  Award,
  Zap,
  Coins
} from 'lucide-react';
import { getUserProfile, getUserSubscription, getUserSessions, ensureUserProfile, ensureUserSubscription } from '@/lib/database';
import type { Profile, Subscription, CoachingSession } from '@/lib/database';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'sessions', 'goals', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Calculate credits used from sessions
  const calculateCreditsUsed = (sessions: CoachingSession[]): number => {
    return sessions.reduce((total, session) => {
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
    
    return Math.max(0, remaining);
  };

  // Format session duration for display
  const formatSessionDuration = (durationSeconds: number): string => {
    if (durationSeconds <= 15) {
      return `${durationSeconds}s`;
    } else {
      const minutes = Math.ceil(durationSeconds / 60);
      return `${minutes} min`;
    }
  };

  // Get display minutes for session
  const getSessionDisplayMinutes = (durationSeconds: number): number => {
    if (durationSeconds <= 15) {
      return 0;
    } else {
      return Math.ceil(durationSeconds / 60);
    }
  };

  // Function to load all user data
  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setSubscription(null);
        setSessions([]);
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

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show dashboard
  if (user && profile && subscription) {
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
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {profile.full_name.split(' ')[0]}!
                  </h1>
                  <p className="text-gray-600 text-lg">
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild>
                    <a href="/coaching-studio">
                      <Play className="w-4 h-4 mr-2" />
                      Start Session
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/pricing">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Upgrade
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sessions">My Sessions</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getPlanDisplayName(subscription.plan_type)}</div>
                    <p className="text-xs text-muted-foreground">
                      {subscription.status === 'trialing' ? 'Trial active' : 'Active subscription'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>Quick Actions</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Start a new coaching session or explore your options.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" asChild>
                      <a href="/coaching-studio">
                        <Play className="h-4 w-4 mr-2" />
                        Browse Coaching Studio
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="/coaching-studio">
                        <Video className="h-4 w-4 mr-2" />
                        Watch Coach Previews
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="/coaching-studio">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Live Session
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="/coaching-studio">
                        <Users className="h-4 w-4 mr-2" />
                        Browse All Coaches
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Recent Sessions</span>
                    </CardTitle>
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
                        <Button variant="ghost" className="w-full mt-4" onClick={() => setActiveTab('sessions')}>
                          View All Sessions
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No sessions yet</p>
                        <p className="text-sm text-gray-500 mb-4">Start your first coaching session to see it here</p>
                        <Button asChild>
                          <a href="/coaching-studio">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5" />
                      <span>Credit Usage Breakdown</span>
                    </CardTitle>
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
                          <p className="text-sm font-medium text-blue-800">${`Paid Sessions (>15 seconds)`}</p>
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
                  <Button asChild>
                    <a href="/coaching-studio">
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
                        coach: session.coaches?.name || 'AI Coach',
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
                  <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start your first coaching session to begin your journey.
                  </p>
                  <Button asChild>
                    <a href="/coaching-studio">
                      <Play className="h-4 w-4 mr-2" />
                      Start First Session
                    </a>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="goals">
              <GoalsTab />
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

  // Only render the landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <CoachCTA />
      </main>
      <Footer />
    </div>
  );
}