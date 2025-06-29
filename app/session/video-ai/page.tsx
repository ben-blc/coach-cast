'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Video, 
  Play, 
  Square, 
  Clock, 
  AlertCircle, 
  Coins, 
  Loader2,
  CheckCircle
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, createCoachingSession, updateCoachingSession } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/sections/Navbar';
import { useUserTokens } from '@/hooks/use-tokens';
import { createTavusConversation, pollForTavusVideo, endTavusConversation } from '@/lib/tavus';
import type { AICoach } from '@/lib/database';

export default function VideoAISessionPage() {
  const [selectedCoach, setSelectedCoach] = useState<AICoach | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [endingSession, setEndingSession] = useState(false);
  const [noCreditsAvailable, setNoCreditsAvailable] = useState(false);
  
  // Tavus video states
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [tavusConversationId, setTavusConversationId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [videoEmbedded, setVideoEmbedded] = useState(false);
  
  // Polling reference
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const coachId = searchParams.get('coach');
  const { toast } = useToast();
  const { tokens, refreshTokens } = useUserTokens();

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

  useEffect(() => {
    async function loadCoach() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const coaches = await getAICoaches();
        
        // Find the specific coach
        const coach = coaches.find(c => c.id === coachId);
        if (!coach) {
          router.push('/coaching-studio');
          return;
        }
        
        setSelectedCoach(coach);

        // Check if user has enough tokens
        if (tokens && tokens.tokens_remaining < 2) {
          setNoCreditsAvailable(true);
        }
      } catch (error) {
        console.error('Error loading coach:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCoach();
  }, [router, coachId, tokens]);

  // Timer effect
  useEffect(() => {
    if (timerStarted && sessionActive && !endingSession) {
      timerIntervalRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          // Calculate tokens based on session time (2 tokens per minute)
          const calculatedTokens = calculateTokens(newTime);
          setTokensUsed(calculatedTokens);
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerStarted, sessionActive, endingSession]);

  // Calculate tokens based on session time (2 tokens per minute)
  const calculateTokens = (seconds: number): number => {
    if (seconds <= 15) {
      return 0; // No charge for sessions 15 seconds or less
    }
    // 2 tokens per minute, rounded up
    return Math.ceil(seconds / 60) * 2;
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
        message: `${tokens} token${tokens !== 1 ? 's' : ''} (2 tokens per minute)`,
        color: "text-blue-600"
      };
    }
  };

  const canStartSession = () => {
    if (tokens) {
      return tokens.tokens_remaining >= 2; // Minimum 2 tokens needed
    }
    return false;
  };

  const startSession = async () => {
    try {
      if (!canStartSession()) {
        setNoCreditsAvailable(true);
        return;
      }

      const user = await getCurrentUser();
      if (!user) return;

      const session = await createCoachingSession({
        user_id: user.id,
        session_type: 'digital_chemistry',
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
        setNoCreditsAvailable(false);
        setVideoUrl(null);
        setVideoGenerated(false);
        setTavusConversationId(null);
        setGenerationError(null);
        setVideoEmbedded(false);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start session. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const generateVideo = async () => {
    if (!sessionActive || !selectedCoach) return;
    
    setIsGeneratingVideo(true);
    setTimerStarted(true);
    setGenerationError(null);
    
    try {
      // Get current user for personalization
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if coach has Tavus replica ID
      if (!selectedCoach.tavus_replica_id) {
        throw new Error('This coach does not have a Tavus replica ID configured');
      }

      // Prepare conversation data
      const conversationName = `Session with ${user.user_metadata?.full_name || 'User'}`;
      const conversationalContext = `This is a coaching session with ${user.user_metadata?.full_name || 'a user'} who is interested in ${selectedCoach.specialty}.`;

      // Call Tavus API to generate video
      const result = await createTavusConversation({
        replica_id: selectedCoach.tavus_replica_id,
        persona_id: 'pb9cbf4b27a6', // Default persona ID
        custom_fields: {
          conversation_name: conversationName,
          conversational_context: conversationalContext,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          user_email: user.email || '',
          coach_name: selectedCoach.name,
          coach_specialty: selectedCoach.specialty
        }
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.id) {
        throw new Error('No conversation ID returned from Tavus API');
      }

      setTavusConversationId(result.id);
      
      // If video URL is already available, use it
      if (result.video_url) {
        setVideoUrl(result.video_url);
        setVideoGenerated(true);
        setIsGeneratingVideo(false);
        embedTavusVideo(result.video_url);
        return;
      }

      // Otherwise, start polling for video completion
      startPollingForVideo(result.id);
      
    } catch (error) {
      console.error('Error generating video:', error);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast({
        title: 'Video Generation Failed',
        description: error instanceof Error ? error.message : 'There was an error generating your personalized video.',
        variant: 'destructive'
      });
      setIsGeneratingVideo(false);
      setTimerStarted(false);
    }
  };

  const startPollingForVideo = (conversationId: string) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start polling for video completion
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const videoUrl = await pollForTavusVideo(conversationId, 1, 1000);
        
        if (videoUrl) {
          setVideoUrl(videoUrl);
          setVideoGenerated(true);
          setIsGeneratingVideo(false);
          
          // Embed the video
          embedTavusVideo(videoUrl);
          
          // Clear polling interval
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          toast({
            title: 'Video Generated',
            description: 'Your personalized video is ready to view!',
          });
        }
      } catch (error) {
        console.error('Error polling for video:', error);
      }
    }, 3000);
  };

  const embedTavusVideo = (url: string) => {
    if (!videoContainerRef.current || videoEmbedded) return;
    
    try {
      // Clear any existing content
      videoContainerRef.current.innerHTML = '';
      
      // Create a script element for Daily.co
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        // Once the script is loaded, create the iframe
        if (window.Daily && videoContainerRef.current) {
          const callFrame = window.Daily.createFrame(videoContainerRef.current, {
            iframeStyle: {
              width: '100%',
              height: '100%',
              border: '0',
              borderRadius: '8px',
              backgroundColor: '#ffffff' // Set background color to white instead of black
            }
          });
          
          callFrame.join({ url });
          setVideoEmbedded(true);
          
          // Add a message to help users understand what to do
          const messageDiv = document.createElement('div');
          messageDiv.className = 'absolute bottom-4 left-0 right-0 text-center';
          messageDiv.innerHTML = `
            <p class="text-sm bg-white/80 mx-auto inline-block px-3 py-1 rounded-full">
              Click "Join Call" to interact with your coach
            </p>
          `;
          videoContainerRef.current.appendChild(messageDiv);
        }
      };
      
      // Add the script to the container
      videoContainerRef.current.appendChild(script);
    } catch (error) {
      console.error('Error embedding Tavus video:', error);
      
      // Fallback to simple iframe if embedding fails
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = `
          <iframe 
            src="${url}" 
            allow="camera; microphone; fullscreen; display-capture; autoplay" 
            style="width: 100%; height: 100%; border: 0; border-radius: 8px; background-color: #ffffff;"
          ></iframe>
        `;
        setVideoEmbedded(true);
      }
    }
  };

  const endSession = async () => {
    if (endingSession) return; // Prevent double-clicking

    try {
      setEndingSession(true);
      console.log('Ending session...', { sessionId, sessionTime, tavusConversationId });

      const user = await getCurrentUser();
      if (!user) {
        console.error('No user found when ending session');
        router.push('/auth');
        return;
      }

      if (!sessionId) {
        console.error('No session ID found when ending session');
        router.push('/?tab=sessions&refresh=true');
        return;
      }

      // End Tavus conversation if active
      if (tavusConversationId) {
        await endTavusConversation(tavusConversationId);
      }

      // Calculate final tokens
      const finalTokens = calculateTokens(sessionTime);
      console.log('Final tokens calculated:', finalTokens);

      // Create session summary
      const sessionSummary = `Completed video AI session with ${selectedCoach?.name}. Duration: ${formatTime(sessionTime)}. Tokens used: ${finalTokens}.`;

      // Update session with duration and completion
      const sessionUpdate = {
        duration_seconds: sessionTime,
        credits_used: finalTokens,
        video_url: videoUrl || undefined,
        status: 'completed' as const,
        completed_at: new Date().toISOString(),
        summary: sessionSummary,
        goals: ['Watched personalized AI video']
      };

      const updatedSession = await updateCoachingSession(sessionId, sessionUpdate);
      console.log('Session updated:', updatedSession);

      // Refresh tokens to reflect the changes
      await refreshTokens();

      // Clear intervals
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // Navigate to dashboard with refresh parameter
      console.log('Redirecting to dashboard...');
      router.push('/?tab=sessions&refresh=true');

    } catch (error) {
      console.error('Error ending session:', error);
      setEndingSession(false);

      // Even if there's an error, try to redirect to dashboard
      router.push('/?tab=sessions&refresh=true');
    }
  };

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coach information...</p>
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
  if (noCreditsAvailable || (tokens && tokens.tokens_remaining < 2)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Insufficient Tokens
            </h1>
            <p className="text-gray-700 mb-6">
              You need at least 2 tokens to start a video AI session. Upgrade your plan to continue coaching sessions.
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
              disabled={endingSession || (!timerStarted && !videoGenerated)}
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

          <div className="w-full max-w-2xl">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {renderCoachAvatar('sm')}
                    <div>
                      <CardTitle className="text-xl">{selectedCoach.name}</CardTitle>
                      <p className="text-blue-100">Video AI Session</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white">
                    Tavus AI Technology
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                {!videoUrl ? (
                  <div className="text-center py-12">
                    {isGeneratingVideo ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          Generating Your Personalized Video
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          {selectedCoach.name} is creating a personalized video message just for you. This usually takes about 30-60 seconds.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <Video className="w-16 h-16 text-blue-600 mx-auto" />
                        <h3 className="text-2xl font-bold text-gray-900">
                          Ready to Generate Your Personalized Video
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          {selectedCoach.name} will create a personalized video message just for you using Tavus AI technology.
                        </p>
                        <Button
                          onClick={generateVideo}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="lg"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Start Session
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          This will use 2 tokens from your account
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-50 p-4 rounded-lg flex items-center space-x-3 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-green-800">Your personalized video is ready!</p>
                    </div>
                    
                    <div 
                      ref={videoContainerRef}
                      className="aspect-video bg-white rounded-lg overflow-hidden relative"
                      style={{ height: '400px', border: '1px solid #e5e7eb' }}
                    >
                      {/* Video will be embedded here by the embedTavusVideo function */}
                      {!videoEmbedded && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">About This Video</h4>
                      <p className="text-gray-700 text-sm">
                        This personalized video was created by {selectedCoach.name} using Tavus AI technology.
                        It's tailored specifically for you based on your profile and coaching needs.
                      </p>
                    </div>
                  </div>
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
                  {!videoGenerated ? (
                    !isGeneratingVideo ? (
                      <Button
                        onClick={generateVideo}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={endingSession || isGeneratingVideo}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Session
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full"
                      >
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Video...
                      </Button>
                    )
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
                      <span>Video generation uses 2 tokens</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tips */}
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About Video AI Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Personalized videos are generated using Tavus AI technology</li>
                    <li>• Each video is tailored to your specific needs</li>
                    <li>• Videos can be saved and reviewed later</li>
                    <li>• Each video generation costs 2 tokens</li>
                    <li>• You can generate multiple videos with different coaches</li>
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
            Video AI Session with {selectedCoach.name}
          </h1>
          <p className="text-xl text-gray-600 text-center">
            Get a personalized video message from your AI coach.
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {renderCoachAvatar('lg')}
              </div>
              <CardTitle className="text-2xl">{selectedCoach.name}</CardTitle>
              <Badge variant="secondary" className="mt-2">{selectedCoach.specialty}</Badge>
            </CardHeader>

            <CardContent className="text-center space-y-6">
              <p className="text-gray-600">
                {selectedCoach.description}
              </p>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">About Video AI Sessions</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Personalized video message from {selectedCoach.name}</li>
                  <li>• Powered by Tavus AI technology</li>
                  <li>• Tailored to your specific needs</li>
                  <li>• Each video costs 2 tokens</li>
                </ul>
              </div>

              <Button
                className={`w-full ${
                  canStartSession()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={startSession}
                disabled={!canStartSession()}
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                {canStartSession() ? 'Start Video AI Session' : 'Insufficient Tokens'}
              </Button>
              
              <p className="text-sm text-gray-500">
                {tokens 
                  ? `You have ${tokens.tokens_remaining} tokens remaining`
                  : 'Loading token information...'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}