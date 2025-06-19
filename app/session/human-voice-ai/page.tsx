'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Play, ArrowLeft, Mic, MicOff, Square, Clock } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getHumanCoaches, createCoachingSession, updateCoachingSession, updateUserCredits } from '@/lib/database';
import type { HumanCoach } from '@/lib/database';

export default function HumanVoiceAIPage() {
  const [humanCoaches, setHumanCoaches] = useState<HumanCoach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<HumanCoach | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadCoaches() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const coaches = await getHumanCoaches();
        setHumanCoaches(coaches);
      } catch (error) {
        console.error('Error loading human coaches:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCoaches();
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = async (coach: HumanCoach) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const session = await createCoachingSession({
        user_id: user.id,
        session_type: 'human_voice_ai',
        human_coach_id: coach.id,
        status: 'active'
      });

      if (session) {
        setSessionId(session.id);
        setSelectedCoach(coach);
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endSession = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || !sessionId) return;

      // Update session with duration and completion
      await updateCoachingSession(sessionId, {
        duration_seconds: sessionTime,
        status: 'completed',
        completed_at: new Date().toISOString(),
        summary: `Completed AI voice coaching session with ${selectedCoach?.name} AI. Duration: ${formatTime(sessionTime)}.`,
        transcription: 'Session transcription will be available soon.'
      });

      // Update user credits
      const creditsUsed = Math.ceil(sessionTime / 60);
      await updateUserCredits(user.id, creditsUsed);

      setIsRecording(false);
      router.push('/dashboard?tab=sessions');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading voice AI coaches...</p>
        </div>
      </div>
    );
  }

  if (isRecording && selectedCoach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <Badge className="bg-red-100 text-red-800 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              Recording
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Coaching with {selectedCoach.name} AI
            </h1>
            <p className="text-gray-600">Voice clone of {selectedCoach.name}</p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-12 h-12 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">
                <Clock className="w-5 h-5 inline mr-2" />
                {formatTime(sessionTime)}
              </CardTitle>
              <p className="text-gray-600">
                Your AI voice coaching session is in progress
              </p>
            </CardHeader>

            <CardContent className="text-center space-y-6">
              <div className="bg-purple-50 p-6 rounded-lg">
                <p className="text-purple-800 font-medium mb-2">
                  ElevenLabs Voice AI Integration
                </p>
                <p className="text-purple-700 text-sm">
                  This is where the ElevenLabs voice AI would be embedded, using {selectedCoach.name}'s 
                  voice clone to provide coaching in their style and approach. The AI has been trained 
                  on {selectedCoach.name}'s coaching methodology.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Coaching Style:</strong> {selectedCoach.specialty}
                </p>
                <p className="text-xs text-gray-600">
                  This AI voice clone combines {selectedCoach.name}'s authentic voice with 
                  their proven coaching techniques and insights.
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setIsRecording(!isRecording)}
                  className="flex items-center"
                >
                  {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isRecording ? 'Mute' : 'Unmute'}
                </Button>
                
                <Button
                  onClick={endSession}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center"
                >
                  <Square className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                Your session will automatically end when you reach your time limit.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Try a Human's Voice AI
          </h1>
          <p className="text-xl text-gray-600">
            Experience audio coaching with the authentic voice of a real human coach, 
            powered by AI technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {humanCoaches.map((coach) => (
            <Card key={coach.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {coach.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{coach.name} AI</CardTitle>
                    <Badge variant="secondary" className="mt-1">{coach.specialty}</Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      Voice clone of {coach.name}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Experience coaching with {coach.name}'s authentic voice and coaching style, 
                  available 24/7 through advanced AI voice cloning technology.
                </p>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-purple-800 font-medium text-sm mb-1">
                    Authentic Voice Experience
                  </p>
                  <p className="text-purple-700 text-xs">
                    This AI uses {coach.name}'s real voice and coaching methodology 
                    to provide personalized guidance
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Available</p>
                    <p className="text-xs text-gray-600">24/7</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Response</p>
                    <p className="text-xs text-gray-600">Instant</p>
                  </div>
                </div>

                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => startSession(coach)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start AI Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}