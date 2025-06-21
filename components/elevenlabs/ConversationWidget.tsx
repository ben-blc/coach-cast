'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Volume2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { startConversation, endConversation, getConversationTranscript } from '@/lib/elevenlabs';
import type { ConversationSession } from '@/lib/elevenlabs';

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
  const [conversation, setConversation] = useState<ConversationSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const widgetRef = useRef<HTMLDivElement>(null);

  // Start conversation
  const handleStartConversation = async () => {
    try {
      setIsLoading(true);
      setError('');

      const session = await startConversation({
        agentId,
        userId: 'user_' + Date.now(),
        sessionId: 'session_' + Date.now()
      });

      if (session) {
        setConversation(session);
        onConversationStart?.(session.conversationId);
        console.log('Conversation started with ID:', session.conversationId);
      } else {
        throw new Error('Failed to start conversation');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start conversation';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // End conversation
  const handleEndConversation = async () => {
    if (!conversation) return;

    try {
      setIsLoading(true);

      // Get final transcript
      const finalTranscript = await getConversationTranscript(conversation.conversationId);
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }

      // End the conversation
      await endConversation(conversation.conversationId);

      onConversationEnd?.(conversation.conversationId, finalTranscript || transcript);
      
      setConversation(null);
      console.log('Conversation ended:', conversation.conversationId);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to end conversation';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load ElevenLabs widget script
  useEffect(() => {
    if (!conversation) return;

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    
    script.onload = () => {
      console.log('ElevenLabs widget script loaded');
      // Widget will be rendered by the elevenlabs-convai element
    };

    script.onerror = () => {
      setError('Failed to load ElevenLabs widget');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script
      const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [conversation]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
        <p className="text-red-600 text-center mb-4">{error}</p>
        <Button onClick={() => setError('')} variant="outline">
          Try Again
        </Button>
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
              <Mic className="w-4 h-4 mr-2" />
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
        <elevenlabs-convai 
          agent-id={agentId}
          style={{
            display: 'block',
            margin: '0 auto',
            width: '100%',
            maxWidth: '400px',
            height: '450px',
            border: 'none',
            borderRadius: '12px',
          }}
        />
      </div>

      {/* End Conversation Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleEndConversation}
          disabled={isLoading}
          variant="destructive"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Ending...
            </>
          ) : (
            'End Conversation'
          )}
        </Button>
      </div>
    </div>
  );
}