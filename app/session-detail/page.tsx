'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Clock, 
  Mic, 
  Download, 
  Play, 
  Pause,
  Volume2,
  FileText,
  Calendar,
  User,
  Target,
  BarChart3,
  MessageCircle,
  Coins,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getSessionById, getAICoaches, getHumanCoaches } from '@/lib/database';
import { getConversationTranscript, getConversationDetails, getConversationAudio } from '@/lib/elevenlabs';
import type { CoachingSession, AICoach, HumanCoach } from '@/lib/database';

interface SessionDetails extends CoachingSession {
  coach_name?: string;
  coach_specialty?: string;
  conversation_transcript?: string;
  conversation_audio_url?: string;
  conversation_details?: any;
}

export default function SessionDetailPage() {
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [apiKeyAvailable, setApiKeyAvailable] = useState(false);
  const [transcriptAvailable, setTranscriptAvailable] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  // Check if ElevenLabs API key is available
  useEffect(() => {
    const hasApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY && 
                     process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY !== 'your_elevenlabs_api_key_here';
    setApiKeyAvailable(hasApiKey);
  }, []);

  useEffect(() => {
    async function loadSessionData() {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        // Get session data
        const sessionData = await getSessionById(sessionId);
        if (!sessionData) {
          setError('Session not found');
          return;
        }

        // Check if user owns this session
        if (sessionData.user_id !== user.id) {
          setError('Access denied');
          return;
        }

        // Get coach information
        const [aiCoaches, humanCoaches] = await Promise.all([
          getAICoaches(),
          getHumanCoaches()
        ]);

        let coachName = 'Unknown Coach';
        let coachSpecialty = 'General Coaching';

        if (sessionData.ai_coach_id) {
          const coach = aiCoaches.find(c => c.id === sessionData.ai_coach_id);
          if (coach) {
            coachName = coach.name;
            coachSpecialty = coach.specialty;
          }
        } else if (sessionData.human_coach_id) {
          const coach = humanCoaches.find(c => c.id === sessionData.human_coach_id);
          if (coach) {
            coachName = coach.name;
            coachSpecialty = coach.specialty;
          }
        }

        const enhancedSession: SessionDetails = {
          ...sessionData,
          coach_name: coachName,
          coach_specialty: coachSpecialty
        };

        setSession(enhancedSession);

        // If there's a conversation ID, load additional data from ElevenLabs API
        if (sessionData.conversation_id) {
          loadConversationData(sessionData.conversation_id, enhancedSession);
        }

      } catch (error) {
        console.error('Error loading session data:', error);
        setError('Failed to load session data');
      } finally {
        setLoading(false);
      }
    }

    loadSessionData();
  }, [sessionId, router]);

  const loadConversationData = async (conversationId: string, sessionData: SessionDetails) => {
    console.log('Loading conversation data for:', conversationId, 'API Key available:', apiKeyAvailable);
    
    // Load conversation details
    setDetailsLoading(true);
    try {
      const details = await getConversationDetails(conversationId);
      setSession(prev => prev ? { ...prev, conversation_details: details } : null);
    } catch (error) {
      console.error('Error loading conversation details:', error);
    } finally {
      setDetailsLoading(false);
    }

    // Load transcript
    setTranscriptLoading(true);
    try {
      const transcript = await getConversationTranscript(conversationId);
      if (transcript) {
        setSession(prev => prev ? {
          ...prev,
          conversation_transcript: transcript
        } : null);
        setTranscriptAvailable(true);
      } else {
        setTranscriptAvailable(false);
      }
    } catch (error) {
      console.error('Error loading conversation transcript:', error);
      setTranscriptAvailable(false);
    } finally {
      setTranscriptLoading(false);
    }
    
    // Load audio URL
    setAudioLoading(true);
    try {
      const audioUrl = await getConversationAudio(conversationId);
      if (audioUrl) {
        setSession(prev => prev ? {
          ...prev,
          conversation_audio_url: audioUrl
        } : null);
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }
    } catch (error) {
      console.error('Error loading conversation audio:', error);
      setAudioAvailable(false);
    } finally {
      setAudioLoading(false);
    }
  };

  const refreshConversationData = async () => {
    if (session?.conversation_id) {
      await loadConversationData(session.conversation_id, session);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionTypeDisplay = (type: string) => {
    switch (type) {
      case 'ai_specialist': return 'AI Specialist Coach';
      case 'digital_chemistry': return 'Digital Chemistry';
      case 'human_voice_ai': return 'Human Voice AI';
      case 'live_human': return 'Live Human Coach';
      default: return 'Coaching Session';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'ai_specialist': return 'bg-blue-100 text-blue-800';
      case 'digital_chemistry': return 'bg-green-100 text-green-800';
      case 'human_voice_ai': return 'bg-purple-100 text-purple-800';
      case 'live_human': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyConversationId = async () => {
    if (session?.conversation_id) {
      await navigator.clipboard.writeText(session.conversation_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadTranscript = () => {
    const transcriptContent = session?.conversation_transcript;
    if (transcriptContent) {
      const blob = new Blob([transcriptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${session.id}-transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadSessionData = () => {
    if (session) {
      const sessionData = {
        session_id: session.id,
        conversation_id: session.conversation_id,
        coach: session.coach_name,
        specialty: session.coach_specialty,
        type: session.session_type,
        duration: session.duration_seconds,
        credits_used: session.credits_used,
        created_at: session.created_at,
        completed_at: session.completed_at,
        summary: session.summary,
        goals: session.goals,
        transcript: session.conversation_transcript,
        conversation_details: session.conversation_details
      };
      
      const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${session.id}-data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">{error || 'Session not found'}</p>
          <Button onClick={() => router.push('/?tab=sessions')}>
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/?tab=sessions')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Session with {session.coach_name}
              </h1>
              <div className="flex items-center space-x-4">
                <Badge className={getSessionTypeColor(session.session_type)}>
                  {getSessionTypeDisplay(session.session_type)}
                </Badge>
                <Badge variant="outline">
                  {session.coach_specialty}
                </Badge>
                <Badge className={session.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {session.status}
                </Badge>
                {apiKeyAvailable && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    ElevenLabs API
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Session ID</p>
              <p className="font-mono text-xs text-gray-800">{session.id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Session Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">{formatDuration(session.duration_seconds)}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Coins className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Credits Used</p>
                    <p className="font-semibold text-gray-900">{session.credits_used || 0}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">{new Date(session.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <User className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Coach</p>
                    <p className="font-semibold text-gray-900">{session.coach_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ElevenLabs Conversation Details */}
            {session.conversation_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-5 h-5" />
                      <span>ElevenLabs Conversation</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshConversationData}
                      disabled={transcriptLoading || audioLoading || detailsLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${(transcriptLoading || audioLoading || detailsLoading) ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium text-yellow-800">Conversation ID</p>
                        <p className="font-mono text-sm text-yellow-700">{session.conversation_id}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyConversationId}
                          className="text-yellow-700 border-yellow-300"
                        >
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="text-yellow-700 border-yellow-300"
                        >
                          <a href={`https://elevenlabs.io/conversations/${session.conversation_id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>

                    {detailsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-gray-600 text-sm">Loading conversation details...</span>
                      </div>
                    ) : session.conversation_details ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="font-medium">{session.conversation_details.status || 'Completed'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Messages</p>
                          <p className="font-medium">{session.conversation_details.messageCount || session.conversation_details.metadata?.messageCount || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Language</p>
                          <p className="font-medium">{session.conversation_details.metadata?.language || 'en'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Model</p>
                          <p className="font-medium">{session.conversation_details.metadata?.model || 'ElevenLabs'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">Conversation details not available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Player */}
            {session.conversation_audio_url && audioAvailable && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Volume2 className="w-5 h-5" />
                    <span>Session Audio</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <div>
                          <p className="font-medium">Session Recording</p>
                          <p className="text-sm text-gray-600">
                            {formatDuration(currentTime)} / {formatDuration(duration)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={session.conversation_audio_url} download>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </div>
                    
                    {audioLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-gray-600">Loading audio...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <audio
                          controls
                          className="w-full"
                          src={session.conversation_audio_url}
                          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Session Transcript</span>
                  </div>
                  {transcriptAvailable && session.conversation_transcript && (
                    <Button variant="outline" size="sm" onClick={downloadTranscript}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                  {!transcriptAvailable && (
                    <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transcriptLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-gray-600">Loading transcript from ElevenLabs...</span>
                  </div>
                ) : transcriptAvailable && session.conversation_transcript ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                        {session.conversation_transcript}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Transcript not available</p>
                    <p className="text-sm mt-2">
                      {session.conversation_id 
                        ? 'The transcript could not be retrieved from ElevenLabs API'
                        : 'No conversation ID found for this session'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Started</p>
                  <p className="font-medium">{formatDate(session.created_at)}</p>
                </div>
                
                {session.completed_at && (
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="font-medium">{formatDate(session.completed_at)}</p>
                  </div>
                )}
                
                <Separator />
                
                <div>
                  <p className="text-sm text-gray-600">Session Type</p>
                  <p className="font-medium">{getSessionTypeDisplay(session.session_type)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Coach</p>
                  <p className="font-medium">{session.coach_name}</p>
                  <p className="text-sm text-gray-500">{session.coach_specialty}</p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{formatDuration(session.duration_seconds)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Credits Used</p>
                  <p className="font-medium">{session.credits_used || 0} credits</p>
                </div>

                {session.conversation_id && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600">Conversation ID</p>
                      <p className="font-mono text-xs text-gray-800 break-all">{session.conversation_id}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Session Goals */}
            {session.goals && session.goals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Session Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {session.goals.map((goal, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{goal}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Session Summary */}
            {session.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {session.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Play className="w-4 h-4 mr-2" />
                  Start Similar Session
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Coach
                </Button>
                
                <Button variant="outline" className="w-full justify-start" onClick={downloadSessionData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Session Data
                </Button>

                {session.conversation_id && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`https://elevenlabs.io/conversations/${session.conversation_id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in ElevenLabs
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}