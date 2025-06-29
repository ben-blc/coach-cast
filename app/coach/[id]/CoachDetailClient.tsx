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
  CheckCircle,
  AlertCircle,
  Calendar,
  ExternalLink,
  Home,
  Search
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, getUserSubscription, createCoachingSession } from '@/lib/database';
import { Navbar } from '@/components/sections/Navbar';
import { useUserTokens } from '@/hooks/use-tokens';
import type { AICoach, Subscription } from '@/lib/database';

interface Coach extends AICoach {
  coach_type: 'ai' | 'human';
  session_types: string[];
  years_experience?: string;
  bio?: string;
}

export default function CoachDetailClient() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();
  const params = useParams();
  const coachId = params.id as string;
  const { tokens } = useUserTokens();

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
        
        if (!coaches || coaches.length === 0) {
          setError('No coaches available');
          setNotFound(true);
          return;
        }
        
        const foundCoach = coaches.find(c => 
          c.id === coachId || 
          c.name.toLowerCase().replace(/\s+/g, '-') === coachId.toLowerCase()
        ) as Coach;
        
        if (!foundCoach) {
          console.log(`Coach not found for ID: ${coachId}`);
          console.log('Available coaches:', coaches.map(c => ({ id: c.id, name: c.name })));
          setNotFound(true);
          return;
        }
        
        console.log('Found coach:', foundCoach);
        setCoach(foundCoach);
        setSubscription(userSubscription);
      } catch (error) {
        console.error('Error loading coach:', error);
        setError('Failed to load coach data');
      } finally {
        setLoading(false);
      }
    }

    loadCoach();
  }, [router, coachId]);

  const getSessionTypeIcon = (sessionType: string) => {
    switch (sessionType) {
      case 'audio_ai': return <Play className="w-5 h-5 text-blue-600" />;
      case 'video_ai': return <Video className="w-5 h-5 text-green-600" />;
      case 'human_coaching': return <Users className="w-5 h-5 text-purple-600" />;
      default: return <Play className="w-5 h-5 text-gray-600" />;
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
      case 'video_ai': return `Get a personalized video from ${coachName} tailored to your needs`;
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

  const formatPrice = (priceInDollars: number) => {
    return `$${priceInDollars}`;
  };

  const canStartSession = () => {
    if (tokens) {
      return tokens.tokens_remaining > 0;
    }
    return subscription && subscription.credits_remaining > 0;
  };

  const startSession = async (sessionType: string) => {
    if (!coach) return;
    
    try {
      const user = await getCurrentUser();
      if (!user) return;

      if (sessionType === 'audio_ai') {
        router.push(`/session/audio-ai?coach=${coach.id}`);
      } else if (sessionType === 'video_ai') {
        router.push(`/session/video-ai?coach=${coach.id}`);
      } else if (sessionType === 'human_coaching') {
        router.push(`/session/human-coaching?coach=${coach.id}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleBookHumanSession = () => {
    if (!coach) return;
    if (!coach.cal_com_link) {
      const calLink = `https://cal.com/${coach.name.toLowerCase().replace(/\s+/g, '-')}`;
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

  if (notFound || (!coach && !loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Coach Not Found</h1>
            
            <p className="text-gray-600 mb-2">
              We couldn't find a coach with the ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{coachId}</code>
            </p>
            
            <p className="text-gray-600 mb-8">
              The coach you're looking for might have been removed, or the link might be incorrect.
            </p>

            {error && (
              <Alert variant="destructive" className="mb-6 text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-3">
              <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                <a href="/coaching-studio">
                  <Search className="w-4 h-4 mr-2" />
                  Browse All Coaches
                </a>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <a href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </a>
              </Button>
              
              <Button variant="ghost" onClick={() => router.back()} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need help? <a href="/contact" className="text-blue-600 hover:underline">Contact our support team</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && coach === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Coach</h1>
            <p className="text-gray-700 mb-4">{error}</p>
            <div className="space-y-3">
              <Button variant="outline" asChild className="w-full">
                <a href="/coaching-studio">Back to Coaching Studio</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!coach) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/coaching-studio')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Coaching Studio
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-start space-x-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-green-600 flex items-center justify-center flex-shrink-0">
                    {coach.avatar_url ? (
                      <img 
                        src={coach.avatar_url} 
                        alt={coach.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-white font-bold text-4xl">${coach.name.charAt(0)}</span>`;
                          }
                        }}
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
                        <span className="text-3xl font-bold text-gray-900">
                          ${coach.hourly_rate}
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

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Available Sessions</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {coach.session_types && coach.session_types.length > 0 ? (
                    coach.session_types.map((sessionType) => (
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
                              className="mb-2 text-xs leading-tight px-2 py-0.5 min-w-[120px] text-center whitespace-nowrap"
                              style={{ width: 'fit-content' }}
                            >
                              {getTrialInfo(sessionType, coach.coach_type)}
                            </Badge>
                            {sessionType === 'human_coaching' && coach.hourly_rate && (
                              <div className="text-lg font-bold text-green-600">
                                ${coach.hourly_rate}
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
                              disabled={!canStartSession()}
                              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Book Session with {coach.name}
                            </Button>
                          ) : sessionType === 'audio_ai' ? (
                            <Button
                              onClick={() => startSession(sessionType)}
                              disabled={!canStartSession()}
                              className="w-full"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start Audio AI Session
                            </Button>
                          ) : (
                            <Button
                              onClick={() => startSession(sessionType)}
                              disabled={!canStartSession()}
                              className="w-full"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Start Video AI Session
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No session types available for this coach.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coach Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sessions</span>
                  <span className="font-medium">
                    {coach.coach_type === 'human' ? '500+' : '∞'}
                  </span>
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
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Availability</span>
                  <span className="font-medium">
                    {coach.coach_type === 'ai' ? '24/7' : 'Scheduled'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {((tokens && tokens.tokens_remaining <= 0) ||
              (subscription && subscription.credits_remaining <= 0)) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(tokens?.plan_name === 'Starter' || subscription?.plan_type === 'free') ? (
                    <>
                      You have no tokens remaining. 
                      <a href="/pricing" className="text-blue-600 hover:underline ml-1">
                        Upgrade your plan
                      </a> to continue coaching sessions.
                    </>
                  ) : (
                    <>
                      You have no tokens remaining in your current plan. 
                      <a href="/pricing" className="text-blue-600 hover:underline ml-1">
                        Upgrade your plan
                      </a> to book more sessions.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

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