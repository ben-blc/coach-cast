'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Play, Square, ArrowLeft, Clock, Volume2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, createCoachingSession, updateCoachingSession, updateUserCredits } from '@/lib/database';
import type { AICoach } from '@/lib/database';

// Declare the ElevenLabs ConvAI widget type
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': {
        'agent-id': string;
        style?: React.CSSProperties;
        children?: React.ReactNode;
      };
    }
  }
}

export default function AISpecialistSessionPage() {
  const [selectedCoach, setSelectedCoach] = useState<AICoach | null>(null);
  const [aiCoaches, setAICoaches] = useState<AICoach[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
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
    let interval: NodeJS.Timeout;
    if (timerStarted && sessionActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerStarted, sessionActive]);

  useEffect(() => {
    if (sessionActive && !scriptLoaded) {
      // Load ElevenLabs ConvAI script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        setScriptLoaded(true);
      };

      script.onerror = () => {
        console.error('Failed to load ElevenLabs script');
      };
      
      document.head.appendChild(script);

      return () => {
        // Cleanup script on unmount
        const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
        setScriptLoaded(false);
      };
    }
  }, [sessionActive, scriptLoaded]);

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
        setSessionActive(true);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const startTimer = () => {
    if (!timerStarted) {
      setTimerStarted(true);
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

      setSessionActive(false);
      setTimerStarted(false);
      setScriptLoaded(false);
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

  if (sessionActive && selectedCoach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {selectedCoach.name}
                  </h1>
                  <p className="text-sm text-gray-600">{selectedCoach.specialty}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge className={`${timerStarted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  <div className={`w-2 h-2 ${timerStarted ? 'bg-green-500' : 'bg-blue-500'} rounded-full mr-2 animate-pulse`}></div>
                  {timerStarted ? 'Active' : 'Ready'}
                </Badge>
                {timerStarted && (
                  <Badge className="bg-gray-100 text-gray-800">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(sessionTime)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-4xl">
            {/* ConvAI Widget Container */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Widget Header */}
              <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Mic className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{selectedCoach.name}</h2>
                      <p className="text-blue-100">{selectedCoach.specialty} Specialist</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-5 h-5" />
                    <span className="text-sm">ElevenLabs AI</span>
                  </div>
                </div>
              </div>

              {/* Main ConvAI Widget Area */}
              <div className="p-8">
                {!scriptLoaded ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading AI Coach...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!timerStarted && (
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-blue-800 text-sm font-medium">Ready to Begin</span>
                        </div>
                        <p className="text-gray-600 mb-6">
                          Click "Start Timer" when you begin your conversation to track your session time.
                        </p>
                        <Button 
                          onClick={startTimer}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="lg"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Timer
                        </Button>
                      </div>
                    )}

                    {/* ElevenLabs ConvAI Widget - Centered */}
                    <div className="flex justify-center">
                      <div 
                        className="w-full max-w-3xl"
                        style={{
                          minHeight: '500px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <elevenlabs-convai 
                          agent-id="agent_01jxwx5htbedvv36tk7v8g1b49"
                          style={{
                            width: '100%',
                            height: '500px',
                            border: 'none',
                            borderRadius: '16px',
                            backgroundColor: '#f8fafc',
                            display: 'block',
                            margin: '0 auto'
                          }}
                        />
                      </div>
                    </div>

                    {/* Coach Information */}
                    <div className="bg-gray-50 rounded-xl p-6 mt-8">
                      <h3 className="font-semibold text-gray-900 mb-2">About Your AI Coach</h3>
                      <p className="text-gray-700 text-sm mb-3">{selectedCoach.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Specialty: {selectedCoach.specialty}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Powered by ElevenLabs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer Controls */}
        <div className="bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {timerStarted ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Session Time: {formatTime(sessionTime)}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Click "Start Timer" to begin tracking your session</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {!timerStarted && scriptLoaded && (
                  <Button
                    onClick={startTimer}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Timer
                  </Button>
                )}
                <Button
                  onClick={endSession}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Square className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              </div>
            </div>
          </div>
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
                <p className="font-medium">Start Session</p>
                <p className="text-gray-600">Begin conversation and start timer</p>
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