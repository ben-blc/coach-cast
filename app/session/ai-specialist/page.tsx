'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Play, Square, ArrowLeft, Clock } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, createCoachingSession, updateCoachingSession, updateUserCredits } from '@/lib/database';
import type { AICoach } from '@/lib/database';

// Declare the ElevenLabs ConvAI widget type
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': {
        'agent-id': string;
        children?: React.ReactNode;
      };
    }
  }
}

export default function AISpecialistSessionPage() {
  const [selectedCoach, setSelectedCoach] = useState<AICoach | null>(null);
  const [aiCoaches, setAICoaches] = useState<AICoach[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [convaiLoaded, setConvaiLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadCoaches() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const coaches = await getAICoaches();
        setAICoaches(coaches);
      } catch (error) {
        console.error('Error loading AI coaches:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCoaches();
  }, [router]);

  useEffect(() => {
    // Load ElevenLabs ConvAI script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    script.onload = () => {
      setConvaiLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

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

  const startSession = async (coach: AICoach) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const session = await createCoachingSession({
        user_id: user.id,
        session_type: 'ai_specialist',
        ai_coach_id: coach.id,
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
        summary: `Completed AI coaching session with ${selectedCoach?.name}. Duration: ${formatTime(sessionTime)}.`,
        transcription: 'Session transcription will be available soon.'
      });

      // Update user credits (1 minute = 1 credit for free trial)
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
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI coaches...</p>
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
              Coaching with {selectedCoach.name}
            </h1>
            <p className="text-gray-600">{selectedCoach.specialty}</p>
          </div>

          <Card className="max-w-3xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Mic className="w-12 h-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">
                <Clock className="w-5 h-5 inline mr-2" />
                {formatTime(sessionTime)}
              </CardTitle>
              <p className="text-gray-600">
                Your AI coaching session is in progress
              </p>
            </CardHeader>

            <CardContent className="text-center space-y-6">
              {convaiLoaded ? (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-blue-800 font-medium mb-4">
                    ElevenLabs AI Coach - {selectedCoach.name}
                  </p>
                  <div className="flex justify-center">
                    <elevenlabs-convai agent-id="agent_01jxwx5htbedvv36tk7v8g1b49">
                    </elevenlabs-convai>
                  </div>
                  <p className="text-blue-700 text-sm mt-4">
                    Start speaking to begin your coaching session with {selectedCoach.name}. 
                    The AI coach will respond with personalized guidance based on your {selectedCoach.specialty.toLowerCase()} needs.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <p className="text-blue-800 font-medium">Loading ElevenLabs AI Coach...</p>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Please wait while we initialize your AI coaching session.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Coaching Focus:</strong> {selectedCoach.specialty}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedCoach.description}
                </p>
              </div>

              <div className="flex justify-center space-x-4">
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
                Click "End Session" when you're finished to save your progress.
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
            Choose Your AI Specialist Coach
          </h1>
          <p className="text-xl text-gray-600">
            Select an AI coach specialized in your area of interest for an immediate voice coaching session powered by ElevenLabs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {aiCoaches.map((coach) => (
            <Card key={coach.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{coach.name}</CardTitle>
                <Badge variant="secondary">{coach.specialty}</Badge>
              </CardHeader>

              <CardContent className="text-center space-y-4">
                <p className="text-gray-600 text-sm">
                  {coach.description}
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Powered by:</p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm font-medium text-gray-900">ElevenLabs ConvAI</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Real-time voice conversation</p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-800 font-medium mb-1">Coaching Focus:</p>
                  <p className="text-xs text-blue-700">{coach.specialty}</p>
                </div>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => startSession(coach)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Voice Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              How AI Voice Coaching Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <p className="font-medium">Choose Coach</p>
                <p className="text-gray-600">Select your specialized AI coach</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <p className="font-medium">Start Speaking</p>
                <p className="text-gray-600">Begin your voice conversation</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <p className="font-medium">Get Guidance</p>
                <p className="text-gray-600">Receive personalized coaching</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}