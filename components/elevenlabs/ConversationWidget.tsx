'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Volume2, AlertCircle, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  startConversation, 
  endConversation, 
  getConversationTranscript, 
  generateConversationId,
  setupElevenLabsEventListeners 
} from '@/lib/elevenlabs';
import type { ConversationSession } from '@/lib/elevenlabs';

interface ConversationWidgetProps {
  agentId: string;
  onConversationStart?: (conversationId: string) => void;
  onConversationEnd?: (conversationId: string, transcript?: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

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

export function ConversationWidget({
  agentId,
  onConversationStart,
  onConversationEnd,
  onError,
  disabled = false
}: ConversationWidgetProps) {
  const [conversation, setConversation] = useState<ConversationSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  // Load ElevenLabs widget script
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const loadScript = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
      if (existingScript) {
        setScriptLoaded(true);
        setWidgetReady(true);
        scriptLoadedRef.current = true;
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log('ElevenLabs script loaded successfully');
        setScriptLoaded(true);
        setWidgetReady(true);
        scriptLoadedRef.current = true;
        setError('');
      };

      script.onerror = (error) => {
        console.error('Failed to load ElevenLabs script:', error);
        setError('Failed to load ElevenLabs widget. Please check your internet connection.');
        setScriptLoaded(false);
      };
      
      document.head.appendChild(script);
    };

    loadScript();
  }, []);

  // Setup event listeners for ElevenLabs widget
  useEffect(() => {
    if (!scriptLoaded) return;

    const cleanup = setupElevenLabsEventListeners(
      (conversationId) => {
        console.log('Widget conversation started:', conversationId);
        // If we don't have a conversation yet, create one with the provided ID
        if (!conversation) {
          const newConversation: ConversationSession = {
            conversationId,
            agentId,
            status: 'active',
            startTime: new Date(),
          };
          setConversation(newConversation);
          onConversationStart?.(conversationId);
        }
      },
      (conversationId) => {
        console.log('Widget conversation ended:', conversationId);
        handleEndConversation(conversationId);
      },
      (error) => {
        console.error('Widget error:', error);
        setError(error);
        onError?.(error);
      }
    );

    return cleanup;
  }, [scriptLoaded, conversation, agentId, onConversationStart, onError]);

  // Start conversation
  const handleStartConversation = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Generate our own conversation ID
      const conversationId = generateConversationId();
      
      const session: ConversationSession = {
        conversationId,
        agentId,
        status: 'active',
        startTime: new Date(),
      };

      setConversation(session);
      onConversationStart?.(session.conversationId);
      console.log('Conversation started with ID:', session.conversationId);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start conversation';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // End conversation
  const handleEndConversation = async (conversationId?: string) => {
    const currentConversationId = conversationId || conversation?.conversationId;
    if (!currentConversationId) return;

    try {
      setIsLoading(true);

      // Get final transcript
      const finalTranscript = await getConversationTranscript(currentConversationId);
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }

      // End the conversation
      await endConversation(currentConversationId);

      onConversationEnd?.(currentConversationId, finalTranscript || transcript);
      
      setConversation(null);
      setWidgetReady(false);
      console.log('Conversation ended:', currentConversationId);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to end conversation';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry loading script
  const retryScriptLoad = () => {
    setError('');
    setScriptLoaded(false);
    setWidgetReady(false);
    scriptLoadedRef.current = false;
    
    // Remove existing script if any
    const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
    if (existingScript) {
      document.head.removeChild(existingScript);
    }
    
    // Trigger reload
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log('ElevenLabs script loaded successfully on retry');
        setScriptLoaded(true);
        setWidgetReady(true);
        scriptLoadedRef.current = true;
        setError('');
      };

      script.onerror = (error) => {
        console.error('Failed to load ElevenLabs script on retry:', error);
        setError('Failed to load ElevenLabs widget. Please try again.');
        setScriptLoaded(false);
      };
      
      document.head.appendChild(script);
    }, 500);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
        <p className="text-red-600 text-center mb-4">{error}</p>
        <Button onClick={retryScriptLoad} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading ElevenLabs AI Coach...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <Mic className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Ready to Start Your AI Coaching Session?
        </h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          Click the button below to begin your conversation with the AI coach. 
          Your conversation ID will be automatically captured and saved.
        </p>
        <Button 
          onClick={handleStartConversation}
          disabled={disabled || isLoading}
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Conversation Status */}
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <p className="font-medium text-green-800">Conversation Active</p>
            <p className="text-sm text-green-600">ID: {conversation.conversationId}</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <Volume2 className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>

      {/* ElevenLabs Widget */}
      <div 
        ref={widgetRef}
        className="flex justify-center bg-gray-50 rounded-lg p-4"
        style={{ minHeight: '500px' }}
      >
        <div
          className="flex justify-center items-center w-full"
          style={{
            height: '480px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '480px',
          }}
        >
          <elevenlabs-convai 
            agent-id={agentId}
            style={{
              display: 'block',
              margin: '0 auto',
              width: '100%',
              maxWidth: '400px',
              height: '460px',
              border: 'none',
              borderRadius: '12px',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          />
        </div>
      </div>

      {/* Conversation Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">Conversation Details</p>
            <p className="text-xs text-blue-600">
              ID: {conversation.conversationId} • Started: {conversation.startTime.toLocaleTimeString()}
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 text-xs">
            ElevenLabs
          </Badge>
        </div>
      </div>

      {/* End Conversation Button */}
      <div className="flex justify-center">
        <Button 
          onClick={() => handleEndConversation()}
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