// ElevenLabs API integration for fetching conversation data
// Uses fetch API to interact with ElevenLabs REST API

export interface ConversationConfig {
  agentId: string;
  userId?: string;
  sessionId?: string;
}

export interface ConversationSession {
  conversationId: string;
  agentId: string;
  status: 'active' | 'ended';
  startTime: Date;
  endTime?: Date;
}

export interface ElevenLabsConversation {
  conversation_id: string;
  agent_id: string;
  user_id: string;
  status: 'active' | 'archived';
  start_time: string;
  end_time?: string;
  transcript?: string;
  audio_url?: string;
  metadata?: any;
}

export interface ElevenLabsMessage {
  message_id: string;
  conversation_id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  audio_url?: string;
}

// Get ElevenLabs API key from environment
const getApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'your_elevenlabs_api_key_here' || apiKey.trim() === '') {
    console.warn('ElevenLabs API key not configured');
    return '';
  }
  return apiKey.trim();
};

// Base API URL for ElevenLabs
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// Generate a conversation ID in ElevenLabs format (REMOVED - we only use real IDs now)
export function generateConversationId(): string {
  console.warn('🚫 generateConversationId() called - we should ONLY use real ElevenLabs IDs!');
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 15);
  return `conv_${timestamp}${random}`;
}

// Start a new conversation session (REMOVED - we only use real IDs now)
export async function startConversation(config: ConversationConfig): Promise<ConversationSession | null> {
  console.error('🚫 startConversation() called - we should ONLY use real ElevenLabs conversation IDs!');
  return null;
}

// End a conversation session
export async function endConversation(conversationId: string): Promise<ConversationSession | null> {
  try {
    console.log('🎯 Ending ElevenLabs conversation with REAL ID:', conversationId);
    
    // Validate that this is a real ElevenLabs conversation ID
    if (!conversationId || !conversationId.startsWith('conv_')) {
      console.error('🚫 Invalid conversation ID format:', conversationId);
      return null;
    }
    
    const session: ConversationSession = {
      conversationId,
      agentId: '',
      status: 'ended',
      startTime: new Date(),
      endTime: new Date(),
    };

    return session;
  } catch (error) {
    console.error('Error ending ElevenLabs conversation:', error);
    return null;
  }
}

// Fetch conversation details from ElevenLabs API
export async function getConversationDetails(conversationId: string): Promise<ElevenLabsConversation | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('No API key - cannot fetch conversation details');
    return null;
  }

  // Validate conversation ID format
  if (!conversationId || !conversationId.startsWith('conv_')) {
    console.error('🚫 Invalid conversation ID format:', conversationId);
    return null;
  }

  try {
    console.log(`🎯 Fetching conversation details for REAL ID: ${conversationId}`);
    
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log(`API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log('🎯 Conversation details received for REAL ID:', conversationId, data);
    return data;
    
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return null;
  }
}

// Fetch conversation transcript from ElevenLabs API
export async function getConversationTranscript(conversationId: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('No API key - cannot fetch transcript');
    return null;
  }

  // Validate conversation ID format
  if (!conversationId || !conversationId.startsWith('conv_')) {
    console.error('🚫 Invalid conversation ID format:', conversationId);
    return null;
  }

  try {
    console.log(`🎯 Fetching transcript for REAL ID: ${conversationId}`);
    
    // Try the transcript endpoint
    const transcriptResponse = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/transcript`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Transcript API Status: ${transcriptResponse.status}`);

    if (transcriptResponse.ok) {
      const transcriptData = await transcriptResponse.json();
      console.log('🎯 Transcript data for REAL ID:', conversationId, transcriptData);
      
      if (transcriptData.transcript) {
        return transcriptData.transcript;
      }
      
      // If transcript field doesn't exist, try to build from messages
      if (transcriptData.messages) {
        return formatMessagesToTranscript(transcriptData.messages, conversationId);
      }
    }

    // Try the messages endpoint as fallback
    const messagesResponse = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Messages API Status: ${messagesResponse.status}`);

    if (messagesResponse.ok) {
      const messages = await messagesResponse.json();
      console.log('🎯 Messages received for REAL ID:', conversationId, messages);
      
      if (Array.isArray(messages) && messages.length > 0) {
        return formatMessagesToTranscript(messages, conversationId);
      }
    }

    // If both fail, return null (no transcript available)
    console.warn('🎯 Could not fetch transcript from API for REAL ID:', conversationId);
    return null;
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return null;
  }
}

// Fetch conversation audio URL from ElevenLabs API
export async function getConversationAudio(conversationId: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('No API key - no audio available');
    return null;
  }

  // Validate conversation ID format
  if (!conversationId || !conversationId.startsWith('conv_')) {
    console.error('🚫 Invalid conversation ID format:', conversationId);
    return null;
  }

  try {
    console.log(`🎯 Fetching audio for REAL ID: ${conversationId}`);
    
    // First try to get audio URL from conversation details
    const conversation = await getConversationDetails(conversationId);
    if (conversation?.audio_url) {
      console.log('🎯 Audio URL from conversation details for REAL ID:', conversationId, conversation.audio_url);
      return conversation.audio_url;
    }

    // Try the audio endpoint
    const audioResponse = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/audio`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg, audio/wav, application/json',
      },
    });

    console.log(`Audio API Status: ${audioResponse.status}`);

    if (audioResponse.ok) {
      const contentType = audioResponse.headers.get('content-type');
      console.log('Audio content type:', contentType);
      
      if (contentType && contentType.includes('audio')) {
        // Create blob URL for audio data
        const audioBlob = await audioResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('🎯 Created audio blob URL for REAL ID:', conversationId, audioUrl);
        return audioUrl;
      } else {
        // Try to parse as JSON for audio URL
        const audioData = await audioResponse.json();
        console.log('🎯 Audio data for REAL ID:', conversationId, audioData);
        
        if (audioData.audio_url) {
          return audioData.audio_url;
        }
      }
    }

    // No audio available
    console.warn('🎯 Could not fetch audio from API for REAL ID:', conversationId);
    return null;
    
  } catch (error) {
    console.error('Error fetching audio:', error);
    return null;
  }
}

// Helper function to format messages into a readable transcript
function formatMessagesToTranscript(messages: ElevenLabsMessage[], conversationId: string): string {
  const header = `Conversation Transcript - ${conversationId}
Started: ${new Date().toLocaleString()}
Source: ElevenLabs API

`;

  if (!messages || messages.length === 0) {
    return header + "No messages found in this conversation.";
  }

  const formattedMessages = messages
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(message => {
      const role = message.role === 'agent' ? 'Coach' : 'User';
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      return `[${timestamp}] ${role}: ${message.content}`;
    })
    .join('\n\n');

  const footer = `

Session ended: ${new Date().toLocaleString()}
Total messages: ${messages.length}
Source: ElevenLabs ConvAI API`;

  return header + formattedMessages + footer;
}

// Enhanced event listener setup for ElevenLabs widget
export function setupElevenLabsEventListeners(
  onConversationStart?: (conversationId: string) => void,
  onConversationEnd?: (conversationId: string) => void,
  onError?: (error: string) => void
) {
  // Listen for messages from the ElevenLabs widget
  const handleMessage = (event: MessageEvent) => {
    // Allow messages from ElevenLabs domains and localhost
    const allowedOrigins = [
      'https://unpkg.com',
      'https://elevenlabs.io',
      'https://api.elevenlabs.io',
      'https://widget.elevenlabs.io',
      'http://localhost',
      'https://localhost'
    ];
    
    // For development, allow any origin that contains elevenlabs or localhost
    const isAllowedOrigin = allowedOrigins.some(origin => 
      event.origin.includes(origin) || 
      event.origin.includes('elevenlabs') ||
      event.origin.includes('localhost') ||
      event.origin.includes('127.0.0.1')
    );
    
    if (!isAllowedOrigin && event.origin !== window.location.origin) {
      return;
    }
    
    try {
      let data = event.data;
      
      // Handle string data
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // If it's not JSON, check if it's a simple message
          if (data.includes('conversation') || data.includes('elevenlabs')) {
            console.log('ElevenLabs string message:', data);
          }
          return;
        }
      }
      
      // Handle different event types
      if (data && typeof data === 'object') {
        console.log('🎯 ElevenLabs widget message:', data);
        
        // Check for conversation start events with various possible field names
        if (data.type === 'elevenlabs-conversation-start' || 
            data.type === 'conversation-start' ||
            data.type === 'convai-conversation-start' ||
            data.event === 'conversation-start' ||
            data.type === 'conversation_started' ||
            data.event === 'conversation_started') {
          
          const conversationId = data.conversationId || 
                               data.conversation_id || 
                               data.id || 
                               data.convId ||
                               data.conv_id;
          
          // ONLY proceed if we have a REAL ElevenLabs conversation ID
          if (conversationId && conversationId.startsWith('conv_')) {
            console.log('🎯 ElevenLabs conversation started with REAL ID:', conversationId);
            onConversationStart?.(conversationId);
          } else {
            console.warn('🚫 Conversation start event received but no valid ID found:', data);
          }
        }
        
        // Check for conversation end events
        else if (data.type === 'elevenlabs-conversation-end' || 
                 data.type === 'conversation-end' ||
                 data.type === 'convai-conversation-end' ||
                 data.event === 'conversation-end' ||
                 data.type === 'conversation_ended' ||
                 data.event === 'conversation_ended') {
          
          const conversationId = data.conversationId || 
                               data.conversation_id || 
                               data.id || 
                               data.convId ||
                               data.conv_id;
          
          // ONLY proceed if we have a REAL ElevenLabs conversation ID
          if (conversationId && conversationId.startsWith('conv_')) {
            console.log('🎯 ElevenLabs conversation ended with REAL ID:', conversationId);
            onConversationEnd?.(conversationId);
          } else {
            console.warn('🚫 Conversation end event received but no valid ID found:', data);
          }
        }
        
        // Check for error events
        else if (data.type === 'elevenlabs-error' || 
                 data.type === 'error' ||
                 data.type === 'convai-error' ||
                 data.event === 'error') {
          const error = data.error || data.message || 'Unknown error';
          console.error('ElevenLabs error:', error);
          onError?.(error);
        }
        
        // Check for widget ready events
        else if (data.type === 'elevenlabs-ready' || 
                 data.type === 'widget-ready' ||
                 data.type === 'convai-ready') {
          console.log('ElevenLabs widget ready');
        }
        
        // Log other events for debugging
        else if (data.type || data.event) {
          console.log('🎯 ElevenLabs widget event:', data.type || data.event, data);
        }
      }
    } catch (error) {
      console.error('Error parsing ElevenLabs message:', error, event.data);
    }
  };

  // Add event listener
  window.addEventListener('message', handleMessage);
  
  // Also listen for custom events that might be dispatched
  const handleCustomEvent = (event: CustomEvent) => {
    console.log('🎯 ElevenLabs custom event:', event.type, event.detail);
    
    if (event.type === 'elevenlabs-conversation-start' && event.detail?.conversationId) {
      // ONLY proceed if we have a REAL ElevenLabs conversation ID
      if (event.detail.conversationId.startsWith('conv_')) {
        onConversationStart?.(event.detail.conversationId);
      }
    } else if (event.type === 'elevenlabs-conversation-end' && event.detail?.conversationId) {
      // ONLY proceed if we have a REAL ElevenLabs conversation ID
      if (event.detail.conversationId.startsWith('conv_')) {
        onConversationEnd?.(event.detail.conversationId);
      }
    }
  };

  window.addEventListener('elevenlabs-conversation-start', handleCustomEvent as EventListener);
  window.addEventListener('elevenlabs-conversation-end', handleCustomEvent as EventListener);
  
  return () => {
    window.removeEventListener('message', handleMessage);
    window.removeEventListener('elevenlabs-conversation-start', handleCustomEvent as EventListener);
    window.removeEventListener('elevenlabs-conversation-end', handleCustomEvent as EventListener);
  };
}

// Get all conversations for a user (if API supports it)
export async function getUserConversations(userId?: string): Promise<ElevenLabsConversation[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('No API key available for fetching user conversations');
    return [];
  }

  try {
    console.log('Fetching conversations for user:', userId);
    
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const conversations = await response.json();
    console.log('ElevenLabs user conversations:', conversations);
    
    return conversations;
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return [];
  }
}

// Delete a conversation (if API supports it)
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('No API key available for deleting conversation');
    return false;
  }

  // Validate conversation ID format
  if (!conversationId || !conversationId.startsWith('conv_')) {
    console.error('🚫 Invalid conversation ID format:', conversationId);
    return false;
  }

  try {
    console.log('Deleting conversation:', conversationId);
    
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    console.log('Conversation deleted successfully:', conversationId);
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
}

// Utility function to check if API key is configured
export function isApiKeyConfigured(): boolean {
  const apiKey = getApiKey();
  return apiKey.length > 0;
}

// Utility function to validate conversation ID format
export function isValidConversationId(conversationId: string): boolean {
  return /^conv_[a-zA-Z0-9]+$/.test(conversationId);
}