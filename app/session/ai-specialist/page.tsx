'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Play, Square, ArrowLeft, Clock, AlertCircle, Coins, MicOff } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, createCoachingSession, updateCoachingSession, updateUserCredits, getUserSubscription } from '@/lib/database';
import { getConversationTranscript } from '@/lib/elevenlabs';
import { ConversationAgent } from '@/components/elevenlabs/ConversationAgent';
import { Navbar } from '@/components/sections/Navbar';
import type { AICoach, Subscription } from '@/lib/database';

export default function AISpecialistSessionPage() {
  const [selectedCoach, setSelectedCoach] = useState<AICoach | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [endingSession, setEndingSession] = useState(false);
  const [timeExceeded, setTimeExceeded] = useState(false);
  const [noCreditsAvailable, setNoCreditsAvailable] = useState(false);

  // Microphone permission states
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied' | 'requesting'>('unknown');
  const [micPermissionError, setMicPermissionError] = useState<string>('');

  // ElevenLabs conversation state
  const [conversationId, setConversationId] = useState<string>('');
  const [conversationTranscript, setConversationTranscript] = useState<string>('');
  const [conversationActive, setConversationActive] = useState(false);

  const timeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const coachId = searchParams.get('coach');

  // Helper function to render coach avatar
  const renderCoachAvatar = (size: 'sm' | 'md' | 'lg' = 'md') => {
    if (!selectedCoach) return null;

    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-20 h-20'
    };

    const textSizeClasses = {
      sm: 'text-sm',
      md: 'text-xl',
      lg: 'text-3xl'
    };

    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-green-600 flex items-center justify-center flex-shrink-0`}>
        {selectedCoach.avatar_url ? (
          <img
            src={selectedCoach.avatar_url}
            alt={selectedCoach.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<span class="text-white font-bold ${textSizeClasses[size]}">${selectedCoach.name.charAt(0)}</span>`;
              }
            }}
          />
        ) : (
          <span className={`text-white font-bold ${textSizeClasses[size]}`}>
            {selectedCoach.name.charAt(0)}
          </span>
        )}
      </div>
    );
  };

  // Check if microphone is available (but don't request permission yet)
  useEffect(() => {
    checkMicrophoneAvailability();
  }, []);

  const checkMicrophoneAvailability = async () => {
    try {
      // Just check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicPermissionError('Microphone access is not supported in this browser');
        setMicPermission('denied');
        return;
      }

      // Check if we can query permissions (but don't request yet)
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

          if (permissionStatus.state === 'granted') {
            setMicPermission('granted');
          } else if (permissionStatus.state === 'denied') {
            setMicPermission('denied');
            setMicPermissionError('Microphone access has been denied. Please enable it in your browser settings.');
          } else {
            // Permission state is 'prompt' - we'll request when needed
            setMicPermission('unknown');
          }
        } catch (error) {
          // Permission API not fully supported, set as unknown
          setMicPermission('unknown');
        }
      } else {
        // No permission API, set as unknown
        setMicPermission('unknown');
      }
    } catch (error) {
      console.error('Error checking microphone availability:', error);
      setMicPermission('unknown');
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      setMicPermission('requesting');
      setMicPermissionError('');

      console.log('🎤 Requesting microphone permission for ElevenLabs...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log('✅ Microphone permission granted');
      setMicPermission('granted');

      // Stop the stream immediately as we were just requesting permission
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error: any) {
      console.error('❌ Error requesting microphone permission:', error);
      setMicPermission('denied');

      if (error.name === 'NotAllowedError') {
        setMicPermissionError('Microphone access was denied. Please click "Allow" when prompted, or enable microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setMicPermissionError('No microphone found. Please connect a microphone to use voice coaching.');
      } else if (error.name === 'NotReadableError') {
        setMicPermissionError('Microphone is being used by another application. Please close other applications and try again.');
      } else {
        setMicPermissionError('Unable to access microphone. Please check your browser settings and try again.');
      }

      return false;
    }
  };

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
        const coach = coaches.find(c => c.id === coachId);
        if (!coach) {
          router.push('/coaching-studio');
          return;
        }

        setSelectedCoach(coach);
        setSubscription(userSubscription);

        // Check if user has credits
        if (userSubscription && userSubscription.credits_remaining <= 0) {
          setNoCreditsAvailable(true);
        }
      } catch (error) {
        console.error('Error loading AI coach:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCoach();
  }, [router, coachId]);

  // Timer effect - only runs when both conditions are true
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerStarted && sessionActive && !timeExceeded && !endingSession) {
      interval = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          // Calculate tokens based on session time
          const calculatedTokens = calculateTokens(newTime);
          setTokensUsed(calculatedTokens);
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStarted, sessionActive, timeExceeded, endingSession]);

  // Credit monitoring effect - check every 30 seconds if user has exceeded their limit
  useEffect(() => {
    if (timerStarted && sessionActive && subscription && !endingSession) {
      timeCheckIntervalRef.current = setInterval(async () => {
        try {
          const user = await getCurrentUser();
          if (!user) return;

          const currentSubscription = await getUserSubscription(user.id);
          if (currentSubscription) {
            const tokensWillUse = calculateTokens(sessionTime + 30); // Check 30 seconds ahead
            const creditsRemaining = currentSubscription.credits_remaining;

            // If the user will exceed their limit in the next 30 seconds, end the session
            if (creditsRemaining <= tokensWillUse && sessionTime > 15) {
              console.log('User will exceed credit limit, ending session...');
              setTimeExceeded(true);
              await endSession(true); // Force end with time exceeded flag
            }
          }
        } catch (error) {
          console.error('Error checking credit limits:', error);
        }
      }, 30000); // Check every 30 seconds

      return () => {
        if (timeCheckIntervalRef.current) {
          clearInterval(timeCheckIntervalRef.current);
        }
      };
    }
  }, [timerStarted, sessionActive, subscription, sessionTime, endingSession]);

  // Calculate tokens based on session time
  const calculateTokens = (seconds: number): number => {
    if (seconds <= 15) {
      return 0; // No charge for sessions 15 seconds or less
    }
    // Round up to the nearest minute for sessions over 15 seconds
    return Math.ceil(seconds / 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTokenDisplay = () => {
    if (sessionTime <= 15) {
      return {
        tokens: 0,
        message: "Free (under 15 seconds)",
        color: "text-green-600"
      };
    } else {
      const tokens = calculateTokens(sessionTime);
      return {
        tokens,
        message: `${tokens} token${tokens !== 1 ? 's' : ''} (rounded up to minute)`,
        color: "text-blue-600"
      };
    }
  };

  const canStartSession = () => {
    return subscription && subscription.credits_remaining > 0;
  };

  const startSession = async () => {
    try {
      if (!canStartSession()) {
        setNoCreditsAvailable(true);
        return;
      }

      // First, request microphone permission
      console.log('🎤 Requesting microphone permission before starting session...');
      const hasPermission = await requestMicrophonePermission();

      if (!hasPermission) {
        console.log('❌ Microphone permission denied, cannot start session');
        // Error message is already set by requestMicrophonePermission
        return;
      }

      console.log('✅ Microphone permission granted, creating session...');

      const user = await getCurrentUser();
      if (!user) return;

      const session = await createCoachingSession({
        user_id: user.id,
        session_type: 'ai_specialist',
        ai_coach_id: selectedCoach!.id,
        status: 'active'
      });

      if (session) {
        setSessionId(session.id);
        setSessionActive(true);
        // Reset states
        setTimerStarted(false);
        setSessionTime(0);
        setTokensUsed(0);
        setEndingSession(false);
        setTimeExceeded(false);
        setNoCreditsAvailable(false);
        setConversationId('');
        setConversationTranscript('');
        setConversationActive(false);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const startConversationAndTimer = async () => {
    if (!timerStarted && canStartSession() && !endingSession && micPermission === 'granted') {
      console.log('✅ Starting conversation with microphone permission already granted');
      setTimerStarted(true);
    }
  };

  // Handle conversation start from ConversationAgent
  const handleConversationStart = (id: string) => {
    console.log('🎯 Conversation started with REAL ID:', id);
    setConversationId(id);
    setConversationActive(true);
  };

  // Handle conversation end from ConversationAgent - ONLY when user explicitly ends it
  const handleConversationEnd = async (id: string) => {
    console.log('🎯 Conversation ended with REAL ID:', id);

    // Only process conversation end if we're actually ending the session
    if (endingSession) {
      setConversationActive(false);

      // Get final transcript from ElevenLabs API if available
      try {
        console.log('🎯 Fetching final transcript for REAL ID:', id);
        const apiTranscript = await getConversationTranscript(id);
        if (apiTranscript) {
          setConversationTranscript(apiTranscript);
          console.log('✅ Final transcript loaded for REAL ID:', id);
        }
      } catch (error) {
        console.error('❌ Error fetching transcript from API:', error);
      }
    }
  };

  const endSession = async (forceEnd = false) => {
    if (endingSession && !forceEnd) return; // Prevent double-clicking unless forced

    try {
      setEndingSession(true);
      console.log('🎯 Ending session...', { sessionId, sessionTime, forceEnd, conversationId });

      const user = await getCurrentUser();
      if (!user) {
        console.error('No user found when ending session');
        router.push('/auth');
        return;
      }

      if (!sessionId) {
        console.error('No session ID found when ending session');
        // Still redirect to dashboard even if we can't update the session
        router.push('/?tab=sessions&refresh=true');
        return;
      }

      // Calculate final tokens
      const finalTokens = calculateTokens(sessionTime);
      console.log('Final tokens calculated:', finalTokens);

      // Create session summary
      const sessionSummary = `Completed AI coaching session with ${selectedCoach?.name}. Duration: ${formatTime(sessionTime)}. Credits used: ${finalTokens}.${timeExceeded ? ' Session ended due to credit limit.' : ''}${conversationActive ? ' ElevenLabs conversation was active.' : ' No active conversation detected.'}${conversationId ? ` Real ElevenLabs Conversation ID: ${conversationId}` : ''}`;

      // Update session with duration and completion
      const sessionUpdate = {
        duration_seconds: sessionTime,
        credits_used: finalTokens,
        conversation_id: conversationId || undefined, // Use REAL conversation ID or undefined
        status: 'completed' as const,
        completed_at: new Date().toISOString(),
        summary: sessionSummary,
        transcription: conversationTranscript || 'Session transcript not available.',
        goals: conversationActive ? ['Engaged in AI coaching conversation'] : ['Session started but no conversation detected']
      };

      console.log('🎯 Updating session with REAL conversation ID:', sessionUpdate);
      const updatedSession = await updateCoachingSession(sessionId, sessionUpdate);
      console.log('Session updated:', updatedSession);

      // Only deduct credits if session was over 15 seconds
      if (finalTokens > 0) {
        console.log('Deducting credits:', finalTokens);
        const creditsUpdated = await updateUserCredits(user.id, finalTokens);
        console.log('Credits updated:', creditsUpdated);
      }

      // Reset all states
      setSessionActive(false);
      setTimerStarted(false);
      setSessionTime(0);
      setTokensUsed(0);
      setEndingSession(false);
      setTimeExceeded(false);
      setNoCreditsAvailable(false);
      setConversationId('');
      setConversationTranscript('');
      setConversationActive(false);

      // Clear the time check interval
      if (timeCheckIntervalRef.current) {
        clearInterval(timeCheckIntervalRef.current);
        timeCheckIntervalRef.current = null;
      }

      // Navigate to dashboard with refresh parameter
      console.log('Redirecting to dashboard...');
      router.push('/?tab=sessions&refresh=true');

    } catch (error) {
      console.error('Error ending session:', error);
      setEndingSession(false);

      // Even if there's an error, try to redirect to dashboard
      // The user shouldn't be stuck on the session page
      router.push('/?tab=sessions&refresh=true');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI coach...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCoach) {
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

  // Show no credits message if user has no credits
  if (noCreditsAvailable || timeExceeded || (subscription && subscription.credits_remaining <= 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {timeExceeded ? 'Session Ended - Credits Exhausted' : 'No Credits Available'}
            </h1>
            <p className="text-gray-700 mb-6">
              {timeExceeded
                ? 'Your session was ended because you ran out of available credits. Upgrade your plan to continue coaching sessions.'
                : 'You\'ve used all your available credits for this month. Upgrade your plan to continue coaching sessions.'
              }
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <a href="/pricing">Upgrade Plan</a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="/">Back to Home</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionActive && selectedCoach) {
    const tokenDisplay = getTokenDisplay();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />

        <div className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="mb-8 w-full max-w-2xl">
            <Button
              variant="ghost"
              onClick={() => endSession()}
              disabled={endingSession || !timerStarted}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {endingSession ? 'Ending Session...' : 'End Session'}
            </Button>

            <div className="flex flex-col items-center">
              {renderCoachAvatar('md')}
              <h1 className="text-3xl font-bold text-gray-900 mt-4">
                {selectedCoach.name}
              </h1>
              <p className="text-lg text-gray-600">{selectedCoach.specialty}</p>
              <div className="flex items-center space-x-4 mt-4">
                <Badge className={`${timerStarted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  <div className={`w-2 h-2 ${timerStarted ? 'bg-green-500' : 'bg-blue-500'} rounded-full mr-2 animate-pulse`}></div>
                  {timerStarted ? 'Active' : 'Ready'}
                </Badge>
                {timerStarted && (
                  <>
                    <Badge className="bg-gray-100 text-gray-800">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(sessionTime)}
                    </Badge>
                    <Badge className={`${tokenDisplay.tokens > 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      <Coins className="w-3 h-3 mr-1" />
                      {tokenDisplay.tokens} tokens
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Time Exceeded Warning */}
          {timeExceeded && (
            <Alert className="mb-6 w-full max-w-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your session will end soon due to credit limits. Please wrap up your conversation.
              </AlertDescription>
            </Alert>
          )}

          {/* Microphone Permission Alert */}
          {micPermission === 'denied' && (
            <Alert variant="destructive" className="mb-6 w-full max-w-2xl">
              <MicOff className="h-4 w-4" />
              <AlertDescription>
                {micPermissionError}
              </AlertDescription>
            </Alert>
          )}

          <div className="w-full max-w-2xl">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {renderCoachAvatar('sm')}
                    <div>
                      <CardTitle className="text-xl">{selectedCoach.name}</CardTitle>
                      <p className="text-blue-100">{selectedCoach.specialty} Specialist</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white">
                    AI Coaching Session
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                {!timerStarted ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-blue-800 text-sm font-medium">Session Ready</span>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Ready to Start Your AI Coaching Session?
                    </h3>

                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                      You're about to begin a conversation with {selectedCoach.name}, your AI specialist coach.
                      Click "Start Conversation" below to begin your session.
                    </p>

                    {micPermission !== 'granted' && (
                      <p className="text-sm text-gray-500 mt-4">
                        Microphone access is required for voice coaching sessions
                      </p>
                    )}
                  </div>
                ) : (
                  <ConversationAgent
                    coach={selectedCoach}
                    onConversationStart={handleConversationStart}
                    onConversationEnd={handleConversationEnd}
                    isSessionActive={timerStarted}
                    sessionTime={sessionTime}
                  />
                )}
              </CardContent>
            </Card>

            {/* Session Controls */}
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!timerStarted ? (
                    <Button
                      onClick={startConversationAndTimer}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={endingSession || micPermission !== 'granted'}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {micPermission === 'granted' ? 'Start Conversation' : 'Microphone Required'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => endSession()}
                      disabled={endingSession}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      {endingSession ? 'Ending Session...' : 'End Session'}
                    </Button>
                  )}

                  <div className="text-xs text-gray-500 text-center">
                    {timerStarted ? (
                      <span>{tokenDisplay.message}</span>
                    ) : (
                      <span>First 15 seconds are free</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tips */}
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tips for Better Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Speak clearly and at a normal pace</li>
                    <li>• Use a quiet environment for best results</li>
                    <li>• Be specific about your goals</li>
                    <li>• Ask follow-up questions</li>
                    <li>• Take notes during the session</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />

      <div className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-4rem)]">
        <div className="mb-8 w-full max-w-2xl">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Start Session with {selectedCoach.name}
          </h1>
          <p className="text-xl text-gray-600 text-center">
            Get ready for your AI coaching session.
          </p>
        </div>

        {/* Credits Warning */}
        {subscription && subscription.credits_remaining <= 0 && (
          <Alert className="mb-8 w-full max-w-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have no credits remaining.
              <a href="/pricing" className="text-blue-600 hover:underline ml-1">
                Upgrade your plan
              </a> to continue coaching sessions.
            </AlertDescription>
          </Alert>
        )}

        {/* Microphone Permission Warning */}
        {micPermission === 'denied' && (
          <Alert variant="destructive" className="mb-8 w-full max-w-2xl">
            <MicOff className="h-4 w-4" />
            <AlertDescription>
              {micPermissionError}
            </AlertDescription>
          </Alert>
        )}

        <div className="w-full max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {renderCoachAvatar('lg')}
              </div>
              <CardTitle className="text-2xl">{selectedCoach.name}</CardTitle>
              <div className="flex justify-center mt-2">
                <Badge variant="secondary" className="">{selectedCoach.specialty}hello</Badge>
              </div>
            </CardHeader>

            <CardContent className="text-center space-y-6">
              <p className="text-gray-600">
                {selectedCoach.description}
              </p>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">About This Session</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Natural voice conversation with AI</li>
                  <li>• Powered by ElevenLabs technology</li>
                  <li>• First 15 seconds are free</li>
                  <li>• Available 24/7</li>
                </ul>
              </div>

              <Button
                className={`w-full ${
                  canStartSession() && micPermission !== 'denied'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={startSession}
                disabled={!canStartSession() || micPermission === 'requesting' || micPermission === 'denied'}
                size="lg"
              >
                {micPermission === 'requesting' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Requesting Microphone...
                  </>
                ) : micPermission === 'denied' ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Microphone Required
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {canStartSession() ? 'Start Voice Session' : 'No Credits Available'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}