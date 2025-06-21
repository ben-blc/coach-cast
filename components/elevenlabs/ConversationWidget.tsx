'use client';

import { useCallback, useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Mic, Volume2, AlertCircle, Play, Square, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  endConversation, 
  getConversationTranscript, 
  getConversationDetails,
  isApiKeyConfigured 
} from '@/lib/elevenlabs';

interface ConversationWidgetProps {
  agentId: string;
  onConversationStart?: (conversationId: string) => void;
  onConversationEnd?: (conversationId: string, transcript?: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function ConversationWidget({
  agentId,
  onConversationStart,
  onConversationEnd,
  onError,
  disabled = false
}: ConversationWidgetProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [conversationDetails, setConversationDetails] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Check if ElevenLabs API key is available
  const hasApiKey = isApiKeyConfigured();

  // Initialize the ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      setStatus('connected');
      setError('');
      console.log('✅ Connected to ElevenLabs Conversational AI');
    },
    onDisconnect: () => {
      setStatus('disconnected');
      console.log('🔌 Disconnected from ElevenLabs Conversational AI');
    },
    onMessage: (props) => {
      console.log(`📨 Message from ${props.source}: ${props.message}`);
      // Accumulate transcript
      if (props.source === 'ai' || props.source === 'user') {
        setTranscript(prev => prev + `\n[${new Date().toLocaleTimeString()}] ${props.source === 'ai' ? 'Coach' : 'User'}: ${props.message}`);
      }
    },
    onError: (error) => {
      console.error('❌ ElevenLabs conversation error:', error);
      setError(error.toString());
      setStatus('error');
      onError?.(error.toString());
    },
  });

  // Start conversation with the ElevenLabs SDK
  const startConversation = useCallback(async () => {
    if (disabled || status === 'connected') {
      console.warn('🚫 Cannot start conversation - disabled or already connected');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      console.log('🎯 Starting ElevenLabs conversation with agent:', agentId);
      
      // Start session and get the REAL conversation ID from ElevenLabs
      const realConversationId = await conversation.startSession({ agentId });
      
      console.log('✅ ElevenLabs conversation started with REAL ID:', realConversationId);
      
      // Validate that we got a real conversation ID
      if (!realConversationId || !realConversationId.startsWith('conv_')) {
        throw new Error(`Invalid conversation ID received: ${realConversationId}`);
      }
      
      setConversationId(realConversationId);
      
      // Notify parent component with the REAL conversation ID
      onConversationStart?.(realConversationId);
      
      // Fetch conversation details if API key is available
      if (hasApiKey) {
        try {
          console.log('🎯 Fetching conversation details for REAL ID:', realConversationId);
          const details = await getConversationDetails(realConversationId);
          if (details) {
            setConversationDetails(details);
            console.log('✅ Conversation details loaded for REAL ID:', realConversationId, details);
          }
        } catch (error) {
          console.error('❌ Error fetching conversation details:', error);
        }
      }
      
    } catch (error: any) {
      console.error('❌ Failed to start ElevenLabs conversation:', error);
      setError(error.message || 'Failed to start conversation');
      setStatus('error');
      onError?.(error.message || 'Failed to start conversation');
    } finally {
      setIsLoading(false);
    }
  }, [conversation, agentId, disabled, status, onConversationStart, onError, hasApiKey]);

  // End conversation with the ElevenLabs SDK
  const endConversationSession = useCallback(async () => {
    if (!conversationId) {
      console.warn('🚫 No conversation to end');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🎯 Ending ElevenLabs conversation with REAL ID:', conversationId);

      // Get final transcript from ElevenLabs API if available
      let finalTranscript = transcript;
      if (hasApiKey && conversationId) {
        try {
          console.log('🎯 Fetching final transcript for REAL ID:', conversationId);
          const apiTranscript = await getConversationTranscript(conversationId);
          if (apiTranscript) {
            finalTranscript = apiTranscript;
            setTranscript(apiTranscript);
            console.log('✅ Final transcript loaded for REAL ID:', conversationId);
          }
        } catch (error) {
          console.error('❌ Error fetching transcript from API:', error);
        }
      }

      // End the session using the ElevenLabs SDK
      await conversation.endSession();
      
      // Also call our internal end conversation function
      await endConversation(conversationId);

      // Notify parent component with the REAL conversation ID
      onConversationEnd?.(conversationId, finalTranscript);
      
      // Reset state
      setConversationId(null);
      setConversationDetails(null);
      setTranscript('');
      
      console.log('✅ ElevenLabs conversation ended successfully with REAL ID:', conversationId);
      
    } catch (error: any) {
      console.error('❌ Error ending ElevenLabs conversation:', error);
      setError(error.message || 'Failed to end conversation');
      onError?.(error.message || 'Failed to end conversation');
    } finally {
      setIsLoading(false);
    }
  }, [conversation, conversationId, transcript, hasApiKey, onConversationEnd, onError]);

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

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (status === 'connected' && conversationId) {
        console.log('🧹 Component unmounting, ending conversation...');
        conversation.endSession().catch(console.error);
      }
    };
  }, [conversation, status, conversationId]);

  // Show error state
  if (error && status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
        <p className="text-red-600 text-center mb-4">{error}</p>
        <div className="flex space-x-2">
          <Button onClick={() => {
            setError('');
            setStatus('disconnected');
          }} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show conversation interface when connected
  if (status === 'connected' && conversationId) {
    return (
      <div className="space-y-4">
        {/* Conversation Status */}
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
              ✅ ElevenLabs SDK
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
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                ElevenLabs API
              </Badge>
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

        {/* Live Transcript */}
        {transcript && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-800 mb-2">Live Transcript</p>
            <div className="max-h-32 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">{transcript}</pre>
            </div>
          </div>
        )}

        {/* Session Information */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">✅ Session Information</p>
              <p className="text-xs text-blue-600">
                Status: {status} • 
                Agent: {agentId.slice(-8)} • 
                SDK: ElevenLabs React
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800 text-xs">
              ✅ REAL ID CAPTURED
            </Badge>
          </div>
        </div>

        {/* End Conversation Button */}
        <div className="flex justify-center">
          <Button 
            onClick={endConversationSession}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Ending...
              </>
            ) : (
              <>
                <Square className="w-4 h-4 mr-2" />
                End Conversation
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Show start conversation interface
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <Mic className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Ready to Start Your AI Coaching Session?
        </h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          Click the button below to begin your conversation with the AI coach. 
          We'll use the official ElevenLabs React SDK to capture the real conversation ID.
        </p>
        
        {/* API Key Status */}
        <Alert className="mb-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {hasApiKey ? (
              <span><strong>ElevenLabs API Connected:</strong> Real conversation IDs, transcripts and audio will be captured.</span>
            ) : (
              <span><strong>Demo Mode:</strong> ElevenLabs API key not configured. Only conversation IDs will be captured.</span>
            )}
          </AlertDescription>
        </Alert>
        
        {/* Status Display */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">Status: <span className="font-medium capitalize">{status}</span></p>
          {conversationId && (
            <p className="text-xs text-gray-500 font-mono">ID: {conversationId}</p>
          )}
        </div>
        
        <Button 
          onClick={startConversation}
          disabled={disabled || isLoading || status === 'connected'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Starting...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Conversation
            </>
          )}
        </Button>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>🎯 <strong>ElevenLabs React SDK Integration:</strong></p>
        <p>• Official SDK • Real conversation IDs • Reliable event handling</p>
      </div>
    </div>
  );
}