'use client';

import { useState } from 'react';
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
  Copy, 
  CheckCircle, 
  ExternalLink,
  RefreshCw 
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
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if ElevenLabs API key is available
  const hasApiKey = isApiKeyConfigured();

  // Use the ElevenLabs useConversation hook with options
  const conversation = useConversation({
    agentId: coach.agent_id,
    onConnect: (props: { conversationId: string }) => {
      handleConversationStart(props.conversationId);
    },
    onDisconnect: () => {
      handleConversationEnd();
    },
    onError: (err: string) => {
      handleConversationError(err);
    },
    onMessage: (message: any) => {
      console.log('📨 Message received:', message);
    },
    // You can add more options here if needed (clientTools, overrides, textOnly, etc.)
  });

  // Handle conversation start
  const handleConversationStart = async (id: string) => {
    console.log('🎯 Conversation started with REAL ID:', id);
    
    // Validate that we got a real conversation ID
    if (!id || !id.startsWith('conv_')) {
      console.error('🚫 Invalid conversation ID received:', id);
      setConversationError(`Invalid conversation ID received: ${id}`);
      return;
    }
    
    setConversationId(id);
    setConversationActive(true);
    setConversationError('');
    
    // Notify parent component
    onConversationStart(id);
    
    // Fetch conversation details if API key is available
    if (hasApiKey) {
      try {
        console.log('🎯 Fetching conversation details for REAL ID:', id);
        const details = await getConversationDetails(id);
        if (details) {
          setConversationDetails(details);
          console.log('✅ Conversation details loaded for REAL ID:', id, details);
        }
      } catch (error) {
        console.error('❌ Error fetching conversation details:', error);
      }
    }
  };

  // Handle conversation end
  const handleConversationEnd = () => {
    console.log('🎯 Conversation ended with REAL ID:', conversationId);
    setConversationActive(false);
    
    // Notify parent component
    if (conversationId) {
      onConversationEnd(conversationId);
    }
  };

  // Handle conversation error
  const handleConversationError = (error: string) => {
    console.error('❌ Conversation error:', error);
    setConversationError(error);
    setConversationActive(false);
  };

  // Copy conversation ID to clipboard
  const copyConversationId = async () => {
    if (conversationId) {
      try {
        await navigator.clipboard.writeText(conversationId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy conversation ID:', error);
      }
    }
  };

  // Refresh conversation details
  const refreshConversationDetails = async () => {
    if (!conversationId || !hasApiKey) return;
    
    setIsLoading(true);
    try {
      const details = await getConversationDetails(conversationId);
      if (details) {
        setConversationDetails(details);
        console.log('✅ Conversation details refreshed for REAL ID:', conversationId, details);
      }
    } catch (error) {
      console.error('❌ Error refreshing conversation details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new conversation session using the new API
  const handleStartConversation = async () => {
    setConversationError('');
    try {
      // You can pass a URL or other options if needed
      // For demonstration, we'll just call startSession with an empty object
      // If you have a specific URL, pass { url }
      const id = await conversation.startSession({});
      handleConversationStart(id);
    } catch (error: any) {
      setConversationError(error?.message || 'Failed to start conversation');
    }
  };

  // End the conversation session
  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
      handleConversationEnd();
    } catch (error: any) {
      setConversationError(error?.message || 'Failed to end conversation');
    }
  };

  // Status helpers
  const status = conversation.status || '';
  const conversationHookError = conversation.error || '';

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
            Click "Start Session" in the footer to begin your coaching session.
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
                ElevenLabs Conversation
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
            {conversationId && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">
                  Real ID: {conversationId.slice(-8)}
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

      {/* API Key Status */}
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          {hasApiKey ? (
            <span><strong>ElevenLabs API Connected:</strong> Real conversation IDs, transcripts and audio will be captured.</span>
          ) : (
            <span><strong>Demo Mode:</strong> ElevenLabs API key not configured. Only conversation IDs will be captured.</span>
          )}
        </AlertDescription>
      </Alert>

      {/* Error Display */}
      {(conversationError || conversationHookError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {conversationError || conversationHookError}
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
            Start Your AI Conversation
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Click the button below to begin your conversation with {coach.name}. 
            We'll capture the real conversation ID from ElevenLabs.
          </p>
          
          <div className="mb-6">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleStartConversation}
              disabled={status === 'connecting' || status === 'connected'}
            >
              <Play className="w-4 h-4 mr-2" />
              {status === 'connecting' ? 'Connecting...' : 'Start Conversation'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Conversation Display */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-green-800">✅ REAL Conversation Active</p>
                <p className="text-sm text-green-600 font-mono">ID: {conversationId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800">
                <Volume2 className="w-3 h-3 mr-1" />
                Live
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                ✅ @elevenlabs/react
              </Badge>
            </div>
          </div>

          {/* Conversation ID Actions */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-yellow-800">✅ ElevenLabs Conversation ID</p>
              <p className="font-mono text-xs text-yellow-700 break-all">{conversationId}</p>
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
                <a href={`https://elevenlabs.io/conversations/${conversationId}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Conversation Details */}
          {conversationDetails && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-800">✅ Live Conversation Details</p>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    ElevenLabs API
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshConversationDetails}
                    disabled={isLoading}
                    className="text-blue-700 border-blue-300"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-blue-600">Status:</p>
                  <p className="font-medium text-blue-800">{conversationDetails.status}</p>
                </div>
                <div>
                  <p className="text-blue-600">Agent ID:</p>
                  <p className="font-mono text-blue-800">{conversationDetails.agent_id}</p>
                </div>
                {conversationDetails.metadata && (
                  <>
                    <div>
                      <p className="text-blue-600">Messages:</p>
                      <p className="font-medium text-blue-800">{conversationDetails.metadata.messageCount || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Language:</p>
                      <p className="font-medium text-blue-800">{conversationDetails.metadata.language || 'en'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ElevenLabs Conversation Component (Active State) */}
          <div className="bg-white border-2 border-green-200 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Conversation is active. Use the microphone to speak with {coach.name}.
              </p>
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
          {conversationId && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Real Conv ID: {conversationId.slice(-8)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}