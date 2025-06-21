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

// Generate a conversation ID in ElevenLabs format
export function generateConversationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 15);
  return `conv_${timestamp}${random}`;
}

// Start a new conversation session
export async function startConversation(config: ConversationConfig): Promise<ConversationSession | null> {
  try {
    // Generate a conversation ID in ElevenLabs format
    const conversationId = generateConversationId();
    
    const session: ConversationSession = {
      conversationId,
      agentId: config.agentId,
      status: 'active',
      startTime: new Date(),
    };

    console.log('Started ElevenLabs conversation:', session);
    return session;
  } catch (error) {
    console.error('Error starting ElevenLabs conversation:', error);
    return null;
  }
}

// End a conversation session
export async function endConversation(conversationId: string): Promise<ConversationSession | null> {
  try {
    console.log('Ending ElevenLabs conversation:', conversationId);
    
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
    console.warn('No API key - using mock data');
    return generateMockConversationDetails(conversationId);
  }

  try {
    console.log(`Fetching conversation details: ${conversationId}`);
    
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
      return generateMockConversationDetails(conversationId);
    }

    const data = await response.json();
    console.log('Conversation details received:', data);
    return data;
    
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return generateMockConversationDetails(conversationId);
  }
}

// Fetch conversation transcript from ElevenLabs API
export async function getConversationTranscript(conversationId: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('No API key - using mock transcript');
    return generateMockTranscript(conversationId);
  }

  try {
    console.log(`Fetching transcript: ${conversationId}`);
    
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
      console.log('Transcript data:', transcriptData);
      
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
      console.log('Messages received:', messages);
      
      if (Array.isArray(messages) && messages.length > 0) {
        return formatMessagesToTranscript(messages, conversationId);
      }
    }

    // If both fail, return mock data
    console.warn('Could not fetch transcript from API, using mock data');
    return generateMockTranscript(conversationId);
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return generateMockTranscript(conversationId);
  }
}

// Fetch conversation audio URL from ElevenLabs API
export async function getConversationAudio(conversationId: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('No API key - using demo audio');
    return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
  }

  try {
    console.log(`Fetching audio: ${conversationId}`);
    
    // First try to get audio URL from conversation details
    const conversation = await getConversationDetails(conversationId);
    if (conversation?.audio_url) {
      console.log('Audio URL from conversation details:', conversation.audio_url);
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
        console.log('Created audio blob URL:', audioUrl);
        return audioUrl;
      } else {
        // Try to parse as JSON for audio URL
        const audioData = await audioResponse.json();
        console.log('Audio data:', audioData);
        
        if (audioData.audio_url) {
          return audioData.audio_url;
        }
      }
    }

    // Fallback to demo audio
    console.warn('Could not fetch audio from API, using demo audio');
    return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
    
  } catch (error) {
    console.error('Error fetching audio:', error);
    return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
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

// Generate mock conversation details for fallback
function generateMockConversationDetails(conversationId: string): ElevenLabsConversation {
  return {
    conversation_id: conversationId,
    agent_id: 'agent_01jxwx5htbedvv36tk7v8g1b49',
    user_id: 'user_unknown',
    status: 'archived',
    start_time: new Date(Date.now() - 600000).toISOString(),
    end_time: new Date().toISOString(),
    metadata: {
      duration: Math.floor(Math.random() * 600) + 300,
      messageCount: Math.floor(Math.random() * 20) + 10,
      participantCount: 2,
      language: 'en',
      model: 'eleven_multilingual_v2',
      voice: 'coaching_specialist',
      quality: 'high',
      total_characters: Math.floor(Math.random() * 5000) + 2000
    }
  };
}

// Generate a realistic mock transcript for testing/fallback
function generateMockTranscript(conversationId: string): string {
  return `Conversation Transcript - ${conversationId}
Started: ${new Date().toLocaleString()}
Source: Mock Data (Configure ElevenLabs API key for real transcripts)

[${new Date().toLocaleTimeString()}] Coach: Hello! I'm your AI coaching specialist. How are you feeling today, and what would you like to work on in our session?

[${new Date(Date.now() + 30000).toLocaleTimeString()}] User: Hi! I've been feeling a bit overwhelmed with work lately. I have so many projects and I'm struggling to prioritize them effectively.

[${new Date(Date.now() + 60000).toLocaleTimeString()}] Coach: I understand that feeling of being overwhelmed can be really challenging. Let's break this down together. Can you tell me about the main projects you're currently working on?

[${new Date(Date.now() + 120000).toLocaleTimeString()}] User: Well, I have three major projects. There's the quarterly report that's due next week, a new client presentation for next month, and a long-term strategic planning document that doesn't have a firm deadline yet.

[${new Date(Date.now() + 180000).toLocaleTimeString()}] Coach: That's helpful context. When you think about these three projects, which one feels most urgent to you right now, and which one excites you the most?

[${new Date(Date.now() + 240000).toLocaleTimeString()}] User: The quarterly report is definitely the most urgent since it's due next week. But honestly, the client presentation excites me more because it's for a potential big client.

[${new Date(Date.now() + 300000).toLocaleTimeString()}] Coach: Excellent insight! You've identified both urgency and personal motivation. Here's what I'd suggest: Let's use a simple prioritization framework. First, focus on completing the quarterly report since it has the nearest deadline. Then, channel that excitement about the client presentation into dedicated time blocks for preparation.

Session ended: ${new Date().toLocaleString()}
Duration: ${Math.floor(Math.random() * 10) + 5} minutes
Total messages: ${Math.floor(Math.random() * 20) + 10}
Source: Mock Data (Configure ElevenLabs API key for real transcripts)`;
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
        console.log('ElevenLabs widget message:', data);
        
        // Check for conversation start events
        if (data.type === 'elevenlabs-conversation-start' || 
            data.type === 'conversation-start' ||
            data.type === 'convai-conversation-start' ||
            data.event === 'conversation-start') {
          const conversationId = data.conversationId || data.conversation_id || data.id;
          if (conversationId) {
            console.log('ElevenLabs conversation started:', conversationId);
            onConversationStart?.(conversationId);
          }
        }
        
        // Check for conversation end events
        else if (data.type === 'elevenlabs-conversation-end' || 
                 data.type === 'conversation-end' ||
                 data.type === 'convai-conversation-end' ||
                 data.event === 'conversation-end') {
          const conversationId = data.conversationId || data.conversation_id || data.id;
          if (conversationId) {
            console.log('ElevenLabs conversation ended:', conversationId);
            onConversationEnd?.(conversationId);
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
          console.log('ElevenLabs widget event:', data.type || data.event, data);
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
    console.log('ElevenLabs custom event:', event.type, event.detail);
    
    if (event.type === 'elevenlabs-conversation-start' && event.detail?.conversationId) {
      onConversationStart?.(event.detail.conversationId);
    } else if (event.type === 'elevenlabs-conversation-end' && event.detail?.conversationId) {
      onConversationEnd?.(event.detail.conversationId);
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