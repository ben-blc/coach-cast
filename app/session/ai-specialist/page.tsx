'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Play, Square, ArrowLeft, Clock, AlertCircle, Coins, MicOff } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, createCoachingSession, updateCoachingSession, updateUserCredits, getUserSubscription } from '@/lib/database';
import { getConversationTranscript } from '@/lib/elevenlabs';
import { ConversationAgent } from '@/components/elevenlabs/ConversationAgent';
import type { AICoach, Subscription } from '@/lib/database';

export default function AISpecialistSessionPage() {
  const [selectedCoach, setSelectedCoach] = useState<AICoach | null>(null);
  const [aiCoaches, setAICoaches] = useState<AICoach[]>([]);
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
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied' | 'checking'>('unknown');
  const [micPermissionError, setMicPermissionError] = useState<string>('');
  
  // ElevenLabs conversation state
  const [conversationId, setConversationId] = useState<string>('');
  const [conversationTranscript, setConversationTranscript] = useState<string>('');
  const [conversationActive, setConversationActive] = useState(false);
  
  const timeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Check microphone permission on component mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      setMicPermission('checking');
      setMicPermissionError('');

      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicPermissionError('Microphone access is not supported in this browser');
        setMicPermission('denied');
        return;
      }

      // First check the permission state if available
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          if (permissionStatus.state === 'granted') {
            setMicPermission('granted');
            return;
          } else if (permissionStatus.state === 'denied') {
            setMicPermission('denied');
            setMicPermissionError('Microphone access has been denied. Please enable it in your browser settings.');
            return;
          }
          // If state is 'prompt', we'll need to request permission
        } catch (error) {
          console.log('Permission API not fully supported, will try getUserMedia directly');
        }
      }

      // Try to access the microphone to check permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // If successful, we have permission
        setMicPermission('granted');
        // Stop the stream immediately as we were just checking permission
        stream.getTracks().forEach(track => track.stop());
      } catch (error: any) {
        console.error('Microphone permission error:', error);
        setMicPermission('denied');
        
        if (error.name === 'NotAllowedError') {
          setMicPermissionError('Microphone access was denied. Please allow microphone access to use voice coaching.');
        } else if (error.name === 'NotFoundError') {
          setMicPermissionError('No microphone found. Please connect a microphone to use voice coaching.');
        } else if (error.name === 'NotReadableError') {
          setMicPermissionError('Microphone is being used by another application. Please close other applications and try again.');
        } else {
          setMicPermissionError('Unable to access microphone. Please check your browser settings.');
        }
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setMicPermission('denied');
      setMicPermissionError('Unable to check microphone permission. Please refresh the page and try again.');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      setMicPermission('checking');
      setMicPermissionError('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      // Stop the stream immediately as we were just requesting permission
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      console.error('Error requesting microphone permission:', error);
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
    }
  };

  useEffect(() => {
    async function loadCoaches() {
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
        
        setAICoaches(coaches);
        setSubscription(userSubscription);

        // Check if user has credits
        if (userSubscription && userSubscription.credits_remaining <= 0) {
          setNoCreditsAvailable(true);
        }
      } catch (error) {
        console.error('Error loading AI coaches:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCoaches();
  }, [router]);

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
    return subscription && subscription.credits_remaining > 0 && micPermission === 'granted';
  };

  const startSession = async (coach: AICoach) => {
    try {
      if (!canStartSession()) {
        if (micPermission !== 'granted') {
          setMicPermissionError('Microphone permission is required to start a voice coaching session.');
          return;
        }
        setNoCreditsAvailable(true);
        return;
      }

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

  const startConversationAndTimer = () => {
    if (!timerStarted && canStartSession() && !endingSession) {
      setTimerStarted(true);
    }
  };

  // Handle conversation start from ConversationAgent
  const handleConversationStart = (id: string) => {
    console.log('🎯 Conversation started with REAL ID:', id);
    setConversationId(id);
    setConversationActive(true);
    
    // Start the timer when conversation begins
    if (!timerStarted && !endingSession) {
      setTimerStarted(true);
    }
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
        router.push('/dashboard?tab=sessions&refresh=true');
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
        conversation_id: conversationId || null, // Use REAL conversation ID or null
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
      router.push('/dashboard?tab=sessions&refresh=true');
      
    } catch (error) {
      console.error('Error ending session:', error);
      setEndingSession(false);
      
      // Even if there's an error, try to redirect to dashboard
      // The user shouldn't be stuck on the session page
      router.push('/dashboard?tab=sessions&refresh=true');
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

  // Show no credits message if user has no credits
  if (noCreditsAvailable || timeExceeded || (subscription && subscription.credits_remaining <= 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
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
              <a href="/dashboard">Back to Dashboard</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionActive && selectedCoach) {
    const tokenDisplay = getTokenDisplay();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => endSession()}
                  disabled={endingSession || !timerStarted}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {endingSession ? 'Ending...' : 'Back'}
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
        </div>

        {/* Time Exceeded Warning */}
        {timeExceeded && (
          <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 lg:px-8 py-3">
            <div className="max-w-6xl mx-auto">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your session will end soon due to credit limits. Please wrap up your conversation.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-4xl">
            {/* ElevenLabs Widget Container */}
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
                </div>
              </div>

              {/* Main ElevenLabs Widget Area */}
              <div className="p-8">
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
                      Click "Start Conversation" below to activate the AI coaching interface and begin your timer.
                    </p>

                    <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
                      <h4 className="font-semibold text-gray-900 mb-2">About {selectedCoach.name}</h4>
                      <p className="text-gray-700 text-sm mb-3">{selectedCoach.description}</p>
                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
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
                    
                    <Button 
                      onClick={startConversationAndTimer}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                      disabled={!canStartSession() || endingSession}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      {canStartSession() ? 'Start Conversation' : 'No Credits Available'}
                    </Button>
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
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Time: {formatTime(sessionTime)}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${tokenDisplay.color}`}>
                      <Coins className="w-4 h-4" />
                      <span>{tokenDisplay.message}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <span>Credits left: {subscription?.credits_remaining || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Click "Start Conversation" to begin your AI coaching session</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {!timerStarted && (
                  <Button
                    onClick={startConversationAndTimer}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={endingSession || !canStartSession()}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {canStartSession() ? 'Start Conversation' : 'No Credits'}
                  </Button>
                )}
                {timerStarted && (
                  <Button
                    onClick={() => endSession()}
                    disabled={endingSession}
                    className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    {endingSession ? 'Ending...' : 'End Session'}
                  </Button>
                )}
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
            Select an AI coach specialized in your area of interest for an immediate voice coaching session.
          </p>
        </div>

        {/* Microphone Permission Alert */}
        {micPermission !== 'granted' && (
          <Alert className={`mb-8 ${micPermission === 'denied' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <div className="flex items-start space-x-3">
              {micPermission === 'denied' ? (
                <MicOff className="h-5 w-5 text-red-600 mt-0.5" />
              ) : (
                <Mic className="h-5 w-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${micPermission === 'denied' ? 'text-red-800' : 'text-yellow-800'}`}>
                  {micPermission === 'checking' ? 'Checking Microphone Access...' : 
                   micPermission === 'denied' ? 'Microphone Access Required' : 
                   'Microphone Permission Needed'}
                </h4>
                <AlertDescription className={micPermission === 'denied' ? 'text-red-700' : 'text-yellow-700'}>
                  {micPermissionError || 'Voice coaching requires microphone access to work properly.'}
                </AlertDescription>
                {micPermission === 'denied' && (
                  <div className="mt-3 flex space-x-3">
                    <Button 
                      size="sm" 
                      onClick={requestMicrophonePermission}
                      disabled={micPermission === 'checking'}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      {micPermission === 'checking' ? 'Checking...' : 'Grant Microphone Access'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={checkMicrophonePermission}
                      disabled={micPermission === 'checking'}
                    >
                      Refresh Status
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Credits Warning */}
        {subscription && subscription.credits_remaining <= 0 && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have no credits remaining. 
              <a href="/pricing" className="text-blue-600 hover:underline ml-1">
                Upgrade your plan
              </a> to continue coaching sessions.
            </AlertDescription>
          </Alert>
        )}

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

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-800 font-medium mb-1">Coaching Focus:</p>
                  <p className="text-xs text-blue-700">{coach.specialty}</p>
                </div>

                <Button 
                  className={`w-full ${
                    canStartSession() 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => startSession(coach)}
                  disabled={!canStartSession()}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {micPermission !== 'granted' 
                    ? 'Microphone Required'
                    : !canStartSession() 
                      ? 'No Credits Available' 
                      : 'Start Voice Session'
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}