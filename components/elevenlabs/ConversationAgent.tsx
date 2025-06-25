'use client';

import { useState, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  Play, 
  Square, 
  Volume2, 
  AlertCircle, 
  RefreshCw,
  MicOff
} from 'lucide-react';
import { getConversationDetails, isApiKeyConfigured } from '@/lib/elevenlabs';
import type { AICoach } from '@/lib/database';

interface ConversationAgentProps {
  coach: AICoach;
  onConversationStart: (conversationId: string) => void;
  onConversationEnd: (conversationId: string) => void;
  isSessionActive: boolean;
  sessionTime: number;
}

export function ConversationAgent({ 
  coach, 
  onConversationStart, 
  onConversationEnd, 
  isSessionActive,
  sessionTime 
}: ConversationAgentProps) {
  const [conversationId, setConversationId] = useState<string>('');
  const [conversationActive, setConversationActive] = useState(false);
  const [conversationDetails, setConversationDetails] = useState<any>(null);
  const [conversationError, setConversationError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEndedConversation, setUserEndedConversation] = useState(false);

  // Only two states: isCoachSpeaking (coach is speaking), isUserTurn (user should speak)
  // Start with coach is speaking state
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(true);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // Check if ElevenLabs API key is available
  const hasApiKey = isApiKeyConfigured();

  // Use the ElevenLabs useConversation hook with options
  const conversation = useConversation({
    agentId: coach.agent_id_eleven_labs, // Updated field name
    onConnect: (props: { conversationId: string }) => {
      handleConversationStart(props.conversationId);
    },
    onDisconnect: () => {
      // Only handle disconnect if user explicitly ended the conversation
      if (userEndedConversation) {
        handleConversationEnd();
      }
    },
    onError: (err: string) => {
      handleConversationError(err);
    },
    onMessage: (message: any) => {
      if (message.source === 'ai') {
        setIsCoachSpeaking(true);
        setIsUserTurn(false);
        setIsUserSpeaking(false);
        // When coach finishes speaking, immediately set to user's turn
        setTimeout(() => {
          setIsCoachSpeaking(false);
          setIsUserTurn(true);
          setIsUserSpeaking(false);
        }, 2000);
      } else if (message.source === 'user') {
        // As soon as the user speaks, set to user turn and show green lights
        setIsCoachSpeaking(false);
        setIsUserTurn(true);
        setIsUserSpeaking(true);
        // Remove green lights after a short delay (simulate end of user speech)
        setTimeout(() => {
          setIsUserSpeaking(false);
        }, 2000);
      }
    },
    onModeChange: (mode: any) => {
      // Optionally reinforce state
      if (mode.mode === 'speaking') {
        setIsCoachSpeaking(true);
        setIsUserTurn(false);
        setIsUserSpeaking(false);
      } else if (mode.mode === 'listening') {
        setIsCoachSpeaking(false);
        setIsUserTurn(true);
        setIsUserSpeaking(false);
      }
    }
  });

  // Handle conversation start
  const handleConversationStart = async (id: string) => {
    if (!id || !id.startsWith('conv_')) {
      setConversationError(`Invalid conversation ID received: ${id}`);
      return;
    }
    setConversationId(id);
    setConversationActive(true);
    setConversationError('');
    setUserEndedConversation(false);
    onConversationStart(id);
    if (hasApiKey) {
      try {
        const details = await getConversationDetails(id);
        if (details) {
          setConversationDetails(details);
        }
      } catch (error) {
        // ignore
      }
    }
    // Start with coach is speaking state
    setIsCoachSpeaking(true);
    setIsUserTurn(false);
    setIsUserSpeaking(false);
  };

  // Handle conversation end
  const handleConversationEnd = () => {
    setConversationActive(false);
    setIsCoachSpeaking(true); // reset to coach is speaking
    setIsUserTurn(false);
    setIsUserSpeaking(false);
    if (conversationId) {
      onConversationEnd(conversationId);
    }
  };

  // Handle conversation error
  const handleConversationError = (error: string) => {
    setConversationError(error);
    setConversationActive(false);
    setIsCoachSpeaking(true); // reset to coach is speaking
    setIsUserTurn(false);
    setIsUserSpeaking(false);
  };

  // Start a new conversation session using the new API
  const handleStartConversation = async () => {
    setConversationError('');
    setUserEndedConversation(false);
    try {
      const id = await conversation.startSession({} as any);
      handleConversationStart(id);
    } catch (error: any) {
      setConversationError(error?.message || 'Failed to start conversation');
    }
  };

  // End the conversation session
  const handleEndConversation = async () => {
    try {
      setUserEndedConversation(true); // Mark that user explicitly ended the conversation
      await conversation.endSession();
      handleConversationEnd();
    } catch (error: any) {
      setConversationError(error?.message || 'Failed to end conversation');
    }
  };

  // Status helpers
  const status = conversation.status;

  // Auto-start conversation when session becomes active
  useEffect(() => {
    if (isSessionActive && !conversationActive && !conversationId && status !== 'connecting' && status !== 'connected') {
      handleStartConversation();
    }
  }, [isSessionActive, conversationActive, conversationId, status]);

  if (!isSessionActive) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
          <Mic className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Ready to Start Your AI Conversation
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Start your session first to begin the conversation with {coach.name}.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-yellow-800 text-sm">
            Click "Start Conversation" in the footer to begin your coaching session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Status Display */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                AI Conversation
              </span>
            </div>
            {conversationActive && (
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">
                  Active
                </span>
              </div>
            )}
          </div>
          {sessionTime <= 15 && (
            <Badge className="bg-green-100 text-green-800 text-xs">
              Free Trial
            </Badge>
          )}
        </div>
      </div>

      {/* Error Display */}
      {conversationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {conversationError}
          </AlertDescription>
        </Alert>
      )}

      {/* ElevenLabs Conversation Component */}
      {!conversationActive ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Mic className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Starting Your AI Conversation
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Connecting to {coach.name}...
          </p>
          
          <div className="mb-6">
            {status === 'connecting' ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-600">Connecting...</span>
              </div>
            ) : (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleStartConversation}
                disabled={String(status) === 'connecting' || String(status) === 'connected'}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Conversation
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Microphone Feedback Display */}
          <div className="bg-white border-2 border-green-200 rounded-lg p-8">
            <div className="text-center">
              <div className="relative mb-6">
                {/* Main microphone icon */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-300 bg-green-100 border-4 border-green-400`}>
                  {isUserTurn ? (
                    <Mic className={`w-12 h-12 text-green-600 ${isUserSpeaking ? 'animate-pulse' : ''}`} />
                  ) : (
                    <Volume2 className="w-12 h-12 text-green-600" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isUserTurn
                    ? 'Your turn to speak'
                    : `${coach.name} is speaking...`}
                </h3>
                <p className="text-sm text-gray-600">
                  {isUserTurn
                    ? 'Speak now, your coach is listening'
                    : 'Your coach is responding'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={handleEndConversation}
                  className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                  disabled={status === 'disconnecting'}
                >
                  <Square className="w-4 h-4 mr-2" />
                  {status === 'disconnecting' ? 'Ending...' : 'End Conversation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coach Information */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">About Your AI Coach</h3>
        <p className="text-gray-700 text-sm mb-3">{coach.description}</p>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Specialty: {coach.specialty}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Powered by ElevenLabs</span>
          </div>
        </div>
      </div>
    </div>
  );
}