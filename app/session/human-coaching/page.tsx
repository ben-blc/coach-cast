'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  ExternalLink,
  User,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, getUserSubscription } from '@/lib/database';
import type { AICoach, Subscription } from '@/lib/database';

// Extended coach type to include all coach data
interface Coach extends AICoach {
  coach_type: 'ai' | 'human';
  session_types: string[];
  years_experience?: string;
  bio?: string;
  hourly_rate?: number;
  cal_com_link?: string;
}

export default function HumanCoachingPage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState<'info' | 'calendar' | 'payment' | 'confirmation'>('info');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const coachId = searchParams.get('coach');

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
        
        // Find the specific coach
        const foundCoach = coaches.find(c => c.id === coachId) as Coach;
        if (!foundCoach || foundCoach.coach_type !== 'human') {
          router.push('/coaching-studio');
          return;
        }
        
        setCoach(foundCoach);
        setSubscription(userSubscription);
      } catch (error) {
        console.error('Error loading human coach:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCoach();
  }, [router, coachId]);

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toLocaleString()}`;
  };

  const canBookSession = () => {
    return subscription && subscription.plan_type !== 'free' && subscription.live_sessions_remaining > 0;
  };

  const handleBookSession = () => {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coach information...</p>
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Coach Not Found</h1>
          <p className="text-gray-700 mb-4">
            The requested coach could not be found or is not available for human coaching.
          </p>
          <Button asChild>
            <a href="/coaching-studio">Back to Coaching Studio</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Coaching Studio
          </Button>
          
          <div className="text-center mb-8">
            <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2 mb-4">
              <Calendar className="w-4 h-4 mr-2" />
              Human Coaching Session
            </Badge>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Book a Session with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {coach.name}
              </span>
            </h1>
            
            <p className="text-xl text-gray-600">
              Schedule a personalized coaching session with our expert human coach
            </p>
          </div>
        </div>

        {/* Coach Profile Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-green-600 flex items-center justify-center">
                {coach.avatar_url ? (
                  <img 
                    src={coach.avatar_url} 
                    alt={coach.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {coach.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{coach.name}</CardTitle>
                <div className="flex items-center space-x-4 mb-3">
                  <Badge className="bg-green-100 text-green-800">Human Coach</Badge>
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
                <p className="text-gray-600 font-medium mb-2">{coach.specialty}</p>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(coach.hourly_rate || 0)}
                  </span>
                  <span className="text-gray-600">/hour</span>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About {coach.name}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {coach.bio || coach.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <User className="w-6 h-6 text-blue-600 mx-auto mb-2" />
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
            </div>
          </CardContent>
        </Card>

        {/* Booking Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Book Your Session</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {/* Plan Check */}
            {!canBookSession() && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {subscription?.plan_type === 'free' ? (
                    <>
                      Human coaching sessions require a paid plan. 
                      <a href="/pricing" className="text-blue-600 hover:underline ml-1">
                        Upgrade your plan
                      </a> to book sessions with {coach.name}.
                    </>
                  ) : (
                    <>
                      You have no live sessions remaining in your current plan. 
                      <a href="/pricing" className="text-blue-600 hover:underline ml-1">
                        Upgrade your plan
                      </a> to book more sessions.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Session Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Session Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Duration</p>
                      <p className="text-sm text-gray-600">60 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Price</p>
                      <p className="text-sm text-gray-600">{formatPrice(coach.hourly_rate || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Format</p>
                      <p className="text-sm text-gray-600">Video call (Zoom/Meet)</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Includes</p>
                      <p className="text-sm text-gray-600">Session notes & follow-up</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What to Expect */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">What to Expect</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Pre-session questionnaire to understand your goals</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Personalized coaching tailored to your needs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Actionable insights and next steps</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Session summary and resources via email</span>
                  </li>
                </ul>
              </div>

              {/* Booking Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={handleBookSession}
                  disabled={!canBookSession()}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                  size="lg"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  {canBookSession() 
                    ? `Book Session with ${coach.name}` 
                    : 'Upgrade Plan to Book'
                  }
                </Button>
                
                {canBookSession() && (
                  <p className="text-center text-sm text-gray-600 mt-3">
                    You'll be redirected to Cal.com to choose your preferred time slot.
                    Payment will be processed securely through Stripe.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Have questions? <a href="/contact" className="text-blue-600 hover:underline">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
}