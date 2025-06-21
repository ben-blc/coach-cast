'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Video, Users, Play, Sparkles, ArrowRight, Coins } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, getHumanCoaches, getUserProfile, getUserSubscription, ensureUserProfile, ensureUserSubscription } from '@/lib/database';
import type { AICoach, HumanCoach, Profile, Subscription } from '@/lib/database';

const sessionOptions = [
  {
    id: 'ai_specialist',
    title: 'AI Specialist Coach',
    subtitle: 'Instant Voice Coaching',
    description: 'Get immediate coaching from specialized AI agents trained in different areas',
    icon: Mic,
    color: 'bg-blue-100 text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
    route: '/session/ai-specialist'
  },
  {
    id: 'digital_chemistry',
    title: 'Digital Chemistry',
    subtitle: 'Interactive Video Previews',
    description: 'Experience personalized video previews from human coaches to find your match',
    icon: Video,
    color: 'bg-green-100 text-green-600',
    gradient: 'from-green-500 to-green-600',
    route: '/session/digital-chemistry'
  },
  {
    id: 'human_voice_ai',
    title: 'Human Voice AI Clone',
    subtitle: 'Best of Both Worlds',
    description: 'Audio coaching with the voice of a real human coach',
    icon: Users,
    color: 'bg-purple-100 text-purple-600',
    gradient: 'from-purple-500 to-purple-600',
    route: '/session/human-voice-ai'
  }
];

export default function DiscoveryPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [aiCoaches, setAICoaches] = useState<AICoach[]>([]);
  const [humanCoaches, setHumanCoaches] = useState<HumanCoach[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/auth');
          return;
        }

        setUser(currentUser);

        // Ensure user has profile and subscription
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

        const [coaches, humans] = await Promise.all([
          getAICoaches(),
          getHumanCoaches()
        ]);

        setProfile(userProfile);
        setSubscription(userSubscription);
        setAICoaches(coaches);
        setHumanCoaches(humans);

        // Check if this is a new user (profile was just created or no sessions yet)
        if (userProfile && (!userProfile.onboarding_completed || userSubscription?.credits_remaining === userSubscription?.monthly_limit)) {
          setIsNewUser(true);
        }
      } catch (error) {
        console.error('Error loading discovery data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Remove credits logic
  // const calculateCreditsRemaining = () => {
  //   if (!subscription) return 0;
  //   return Math.max(0, subscription.credits_remaining);
  // };

  // const canStartSession = () => {
  //   return calculateCreditsRemaining() > 0;
  // };

  // Always allow session start
  const canStartSession = () => true;

  const handleStartSession = async (optionId: string, route: string) => {
    try {
      // No credit check
      router.push(route);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your coaching options...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-4">
            Please sign in to access coaching sessions.
          </p>
          <Button asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // const creditsRemaining = calculateCreditsRemaining();
  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case 'free': return 'Free Trial';
      case 'ai_explorer': return 'AI Explorer';
      case 'coaching_starter': return 'Coaching Starter';
      case 'coaching_accelerator': return 'Coaching Accelerator';
      default: return 'Free Trial';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              {isNewUser ? 'Welcome to Coach Cast!' : 'Choose Your Session'}
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {isNewUser ? 'Choose Your First' : 'Start Your'}{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Coaching Experience
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            {isNewUser 
              ? `Welcome ${profile.full_name.split(' ')[0]}! Explore our platform with a free trial.`
              : `Choose how you'd like to continue your coaching journey.`
            }
          </p>

          {/* Plan Info Only */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <Badge variant="outline" className="text-sm">
              {getPlanDisplayName(subscription.plan_type)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {sessionOptions.map((option) => (
            <Card 
              key={option.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                selectedOption === option.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${option.color}`}>
                    <option.icon className="w-8 h-8" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {option.title}
                </CardTitle>
                <p className="text-sm text-gray-600 font-medium">
                  {option.subtitle}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-gray-600 mb-6 text-center">
                  {option.description}
                </p>

                {option.id === 'ai_specialist' && aiCoaches.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {aiCoaches.slice(0, 3).map((coach) => (
                      <div key={coach.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{coach.name}</p>
                          <p className="text-xs text-gray-600">{coach.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {option.id === 'digital_chemistry' && humanCoaches.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {humanCoaches.map((coach) => (
                      <div key={coach.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                          {coach.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{coach.name}</p>
                          <p className="text-xs text-gray-600">{coach.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {option.id === 'human_voice_ai' && humanCoaches.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {humanCoaches.map((coach) => (
                      <div key={coach.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{coach.name} AI</p>
                          <p className="text-xs text-gray-600">Voice clone of {coach.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  className={`w-full bg-gradient-to-r ${option.gradient} hover:opacity-90 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartSession(option.id, option.route);
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Credit Usage Information removed */}

        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {isNewUser ? 'Ready to Begin?' : 'Explore More'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isNewUser 
                ? `Your free trial starts as soon as you choose an option above. No credit card required.`
                : 'Upgrade your plan to unlock additional features.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isNewUser && (
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
              )}
              <Button asChild>
                <Link href="/pricing">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {isNewUser ? 'View Plans' : 'Upgrade Plan'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}