'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Play, 
  Video, 
  Users, 
  Clock, 
  DollarSign,
  Star,
  CheckCircle,
  AlertCircle,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, getUserSubscription, createCoachingSession } from '@/lib/database';
import { Navbar } from '@/components/sections/Navbar';
import type { AICoach, Subscription } from '@/lib/database';

// Extended coach type to include all coach data
interface Coach extends AICoach {
  coach_type: 'ai' | 'human';
  session_types: string[];
  years_experience?: string;
  bio?: string;
}

// Generate static params for all coaches
export async function generateStaticParams() {
  try {
    // For static export, we'll generate a few common coach IDs
    // In a real app, you'd fetch all coach IDs from your database
    return [
      { id: 'natalie-sejean' },
      { id: 'fatten' },
      { id: 'sprint-ai' },
      { id: 'pivot-ai' },
      { id: 'confidence-ai' },
      { id: 'balance-ai' },
    ];
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default function CoachDetailPage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const coachId = params.id as string;

  useEffect(() => {
    async function loadCoach() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const [coaches, userSubscription] = await Promise.all([
          getAICoaches(),
          getUserSubscription(user.id)
        ]);
        
        // Find the specific coach by ID or by name slug
        const foundCoach = coaches.find(c => 
          c.id === coachId || 
          c.name.toLowerCase().replace(/\s+/g, '-') === coachId
        ) as Coach;
        
        if (!foundCoach) {
          router.push('/coaching-studio');
          return;
        }
        
        setCoach(foundCoach);
        setSubscription(userSubscription);
      } catch (error) {
        console.error('Error loading coach:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCoach();
  }, [router, coachId]);

  const getSessionTypeIcon = (sessionType: string) => {
    switch (sessionType) {
      case 'audio_ai': return <Play className="w-5 h-5" />;
      case 'video_ai': return <Video className="w-5 h-5" />;
      case 'human_coaching': return <Users className="w-5 h-5" />;
      default: return <Play className="w-5 h-5" />;
    }
  };

  const getSessionTypeLabel = (sessionType: string) => {
    switch (sessionType) {
      case 'audio_ai': return 'Audio AI Session';
      case 'video_ai': return 'Video AI Session';
      case 'human_coaching': return 'Live Human Coaching';
      default: return sessionType;
    }
  };

  const getSessionTypeDescription = (sessionType: string, coachName: string) => {
    switch (sessionType) {
      case 'audio_ai': return `Have a voice conversation with ${coachName} AI using advanced voice technology`;
      case 'video_ai': return `Get a personalized video preview from ${coachName} tailored to your needs`;
      case 'human_coaching': return `Book a live 1-on-1 session with ${coachName} for personalized guidance`;
      default: return 'Coaching session';
    }
  };

  const getTrialInfo = (sessionType: string, coachType: 'ai' | 'human') => {
    if (sessionType === 'audio_ai') {
      return '7 minutes free trial';
    } else if (sessionType === 'video_ai') {
      return 'Free personalized preview';
    } else if (sessionType === 'human_coaching') {
      return 'Paid session only';
    }
    return '';
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toLocaleString()}`;
  };

  const canStartSession = (sessionType: string) => {
    if (!subscription) return false;
    
    // Free trials available for audio_ai and video_ai
    if (sessionType === 'audio_ai' || sessionType === 'video_ai') {
      return subscription.credits_remaining > 0;
    }
    
    // Human coaching requires paid plan
    if (sessionType === 'human_coaching') {
      return subscription.plan_type !== 'free' && subscription.live_sessions_remaining > 0;
    }
    
    return false;
  };

  const startSession = async (sessionType: string) => {
    if (!coach) return;
    
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Route to appropriate session type
      if (sessionType === 'audio_ai') {
        // Create session and redirect to AI specialist page
        const session = await createCoachingSession({
          user_id: user.id,
          session_type: 'ai_specialist',
          ai_coach_id: coach.id,
          status: 'active'
        });
        
        if (session) {
          router.push(`/session/ai-specialist?coach=${coach.id}`);
        }
      } else if (sessionType === 'video_ai') {
        router.push(`/session/digital-chemistry?coach=${coach.id}`);
      } else if (sessionType === 'human_coaching') {
        router.push(`/session/human-coaching?coach=${coach.id}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleBookHumanSession = () => {
    if (!coach?.cal_com_link) {
      // Fallback to generic Cal.com link
      const calLink = `https://cal.com/${coach?.name.toLowerCase().replace(/\s+/g, '-')}`;
      window.open(calLink, '_blank');
    } else {
      window.open(coach.cal_com_link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coach details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Coach Not Found</h1>
            <p className="text-gray-700 mb-4">
              The requested coach could not be found.
            </p>
            <Button asChild>
              <a href="/coaching-studio">Back to Coaching Studio</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/coaching-studio')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Coaching Studio
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Coach Profile */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-start space-x-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-green-600 flex items-center justify-center flex-shrink-0">
                    {coach.avatar_url ? (
                      <img 
                        src={coach.avatar_url} 
                        alt={coach.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-4xl">
                        {coach.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3">{coach.name}</CardTitle>
                    <div className="flex items-center space-x-4 mb-4">
                      <Badge className={coach.coach_type === 'human' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {coach.coach_type === 'human' ? 'Human Coach' : 'AI Coach'}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">4.9</span>
                      </div>
                      {coach.years_experience && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{coach.years_experience} years</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xl text-gray-700 font-medium mb-3">{coach.specialty}</p>
                    {coach.hourly_rate && coach.hourly_rate > 0 && coach.coach_type === 'human' && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-6 h-6 text-green-600" />
                        <span className="text-3xl font-bold text-gray-900">
                          {formatPrice(coach.hourly_rate)}
                        </span>
                        <span className="text-gray-600">/hour</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">About {coach.name}</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {coach.bio || coach.description}
                    </p>
                  </div>

                  {coach.coach_type === 'human' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-blue-800">1-on-1 Sessions</p>
                        <p className="text-xs text-blue-600">Personalized coaching</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-800">Flexible Scheduling</p>
                        <p className="text-xs text-green-600">Choose your time</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-purple-800">Proven Results</p>
                        <p className="text-xs text-purple-600">Track your progress</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Available Sessions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Available Sessions</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {coach.session_types?.map((sessionType) => (
                    <div key={sessionType} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            {getSessionTypeIcon(sessionType)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {getSessionTypeLabel(sessionType)}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {getSessionTypeDescription(sessionType, coach.name)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={sessionType === 'human_coaching' ? 'outline' : 'secondary'}
                            className="mb-2"
                          >
                            {getTrialInfo(sessionType, coach.coach_type)}
                          </Badge>
                          {sessionType === 'human_coaching' && coach.hourly_rate && (
                            <div className="text-lg font-bold text-green-600">
                              {formatPrice(coach.hourly_rate)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {sessionType === 'audio_ai' && (
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Natural voice conversation with AI</li>
                            <li>• Powered by ElevenLabs technology</li>
                            <li>• Available 24/7</li>
                            <li>• 7 minutes free trial</li>
                          </ul>
                        )}
                        
                        {sessionType === 'video_ai' && (
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Personalized video preview</li>
                            <li>• Tailored to your specific needs</li>
                            <li>• Generated using Tavus AI</li>
                            <li>• Free preview available</li>
                          </ul>
                        )}
                        
                        {sessionType === 'human_coaching' && (
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Live 1-on-1 video session</li>
                            <li>• 60 minutes duration</li>
                            <li>• Includes session notes & follow-up</li>
                            <li>• Flexible scheduling</li>
                          </ul>
                        )}
                        
                        {sessionType === 'human_coaching' ? (
                          <Button
                            onClick={handleBookHumanSession}
                            disabled={!canStartSession(sessionType)}
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Book Session with {coach.name}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => startSession(sessionType)}
                            disabled={!canStartSession(sessionType)}
                            className="w-full"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start {getSessionTypeLabel(sessionType)}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Coach Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium">4.9/5</span>
                  </div>
                </div> */}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sessions</span>
                  <span className="font-medium">500+</span>
                </div>
                
                {coach.years_experience && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Experience</span>
                    <span className="font-medium">{coach.years_experience} years</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="font-medium">
                    {coach.coach_type === 'ai' ? 'Instant' : '< 24 hours'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Plan Check */}
            {!canStartSession('audio_ai') && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {subscription?.plan_type === 'free' ? (
                    <>
                      You have no credits remaining. 
                      <a href="/pricing" className="text-blue-600 hover:underline ml-1">
                        Upgrade your plan
                      </a> to continue coaching sessions.
                    </>
                  ) : (
                    <>
                      You have no credits remaining in your current plan. 
                      <a href="/pricing" className="text-blue-600 hover:underline ml-1">
                        Upgrade your plan
                      </a> to book more sessions.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Specialties */}
            <Card>
              <CardHeader>
                <CardTitle>Specialties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coach.specialty.split(',').map((specialty, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {specialty.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            {coach.coach_type === 'human' && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Ready to start your coaching journey with {coach.name}?
                  </p>
                  <Button 
                    onClick={handleBookHumanSession}
                    className="w-full"
                    variant="outline"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Consultation
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}