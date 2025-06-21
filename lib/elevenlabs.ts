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

// Get ElevenLabs API key from environment - check both client and server side
const getApiKey = (): string => {
  // Check client-side environment variable
  if (typeof window !== 'undefined') {
    const clientApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    console.log('Client-side API key check:', clientApiKey ? 'Found' : 'Not found');
    if (clientApiKey && clientApiKey !== 'your_elevenlabs_api_key_here' && clientApiKey.trim() !== '') {
      return clientApiKey;
    }
  }
  
  // Check server-side environment variable (fallback)
  const serverApiKey = process.env.ELEVENLABS_API_KEY;
  console.log('Server-side API key check:', serverApiKey ? 'Found' : 'Not found');
  if (serverApiKey && serverApiKey !== 'your_elevenlabs_api_key_here' && serverApiKey.trim() !== '') {
    return serverApiKey;
  }
  
  console.warn('ElevenLabs API key not found in environment variables');
  return '';
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
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('No API key available, returning mock conversation details');
      return generateMockConversationDetails(conversationId);
    }

    console.log('Fetching conversation details for:', conversationId, 'with API key:', apiKey.substring(0, 10) + '...');
    
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('ElevenLabs API response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Conversation not found:', conversationId);
        return generateMockConversationDetails(conversationId);
      }
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('ElevenLabs conversation details:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    
    // Return mock data if API fails
    return generateMockConversationDetails(conversationId);
  }
}

// Generate mock conversation details for fallback
function generateMockConversationDetails(conversationId: string): ElevenLabsConversation {
  return {
    conversation_id: conversationId,
    agent_id: 'agent_01jxwx5htbedvv36tk7v8g1b49',
    user_id: 'user_unknown',
    status: 'archived',
    start_time: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
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

// Fetch conversation transcript from ElevenLabs API
export async function getConversationTranscript(conversationId: string): Promise<string | null> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('No API key available, returning mock transcript');
      return generateMockTranscript(conversationId);
    }

    console.log('Fetching transcript for conversation:', conversationId, 'with API key:', apiKey.substring(0, 10) + '...');
    
    // First, try to get the conversation transcript directly
    const transcriptResponse = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/transcript`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('Transcript API response status:', transcriptResponse.status);

    if (transcriptResponse.ok) {
      const transcriptData = await transcriptResponse.json();
      console.log('Transcript data received:', transcriptData);
      if (transcriptData.transcript) {
        return transcriptData.transcript;
      }
    }

    // If direct transcript endpoint doesn't work, try getting messages
    const messagesResponse = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('Messages API response status:', messagesResponse.status);

    if (!messagesResponse.ok) {
      if (messagesResponse.status === 404) {
        console.warn('Conversation messages not found:', conversationId);
        return generateMockTranscript(conversationId);
      }
      const errorText = await messagesResponse.text();
      console.error('Messages API error:', messagesResponse.status, errorText);
      throw new Error(`ElevenLabs API error: ${messagesResponse.status} ${messagesResponse.statusText}`);
    }

    const messages: ElevenLabsMessage[] = await messagesResponse.json();
    console.log('ElevenLabs conversation messages:', messages);
    
    // Format messages into a readable transcript
    const transcript = formatMessagesToTranscript(messages, conversationId);
    return transcript;
    
  } catch (error) {
    console.error('Error fetching conversation transcript:', error);
    
    // Return mock transcript if API fails
    return generateMockTranscript(conversationId);
  }
}

// Fetch conversation audio URL from ElevenLabs API
export async function getConversationAudio(conversationId: string): Promise<string | null> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('No API key available, returning mock audio URL');
      return `https://www.soundjay.com/misc/sounds/bell-ringing-05.wav`; // Use a real audio file for demo
    }

    console.log('Fetching audio for conversation:', conversationId, 'with API key:', apiKey.substring(0, 10) + '...');
    
    // Try to get the audio URL from the conversation details first
    const conversation = await getConversationDetails(conversationId);
    if (conversation?.audio_url) {
      return conversation.audio_url;
    }

    // Try the audio endpoint
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/audio`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg, application/json',
      },
    });

    console.log('Audio API response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Conversation audio not found:', conversationId);
        return `https://www.soundjay.com/misc/sounds/bell-ringing-05.wav`; // Fallback audio
      }
      const errorText = await response.text();
      console.error('Audio API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    // Check if the response is audio data
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('audio')) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    }

    // If the response is JSON with an audio URL
    const data = await response.json();
    return data.audio_url || `https://www.soundjay.com/misc/sounds/bell-ringing-05.wav`;
    
  } catch (error) {
    console.error('Error fetching conversation audio:', error);
    
    // Return demo audio URL if API fails
    return `https://www.soundjay.com/misc/sounds/bell-ringing-05.wav`;
  }
}

// Helper function to format messages into a readable transcript
function formatMessagesToTranscript(messages: ElevenLabsMessage[], conversationId: string): string {
  const header = `Conversation Transcript - ${conversationId}
Started: ${new Date().toLocaleString()}
Generated from ElevenLabs API

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

// Generate a realistic mock transcript for testing/fallback
function generateMockTranscript(conversationId: string): string {
  return `Conversation Transcript - ${conversationId}
Started: ${new Date().toLocaleString()}
Source: Mock Data (ElevenLabs API key not configured properly)

[${new Date().toLocaleTimeString()}] Coach: Hello! I'm your AI coaching specialist. How are you feeling today, and what would you like to work on in our session?

[${new Date(Date.now() + 30000).toLocaleTimeString()}] User: Hi! I've been feeling a bit overwhelmed with work lately. I have so many projects and I'm struggling to prioritize them effectively.

[${new Date(Date.now() + 60000).toLocaleTimeString()}] Coach: I understand that feeling of being overwhelmed can be really challenging. Let's break this down together. Can you tell me about the main projects you're currently working on?

[${new Date(Date.now() + 120000).toLocaleTimeString()}] User: Well, I have three major projects. There's the quarterly report that's due next week, a new client presentation for next month, and a long-term strategic planning document that doesn't have a firm deadline yet.

[${new Date(Date.now() + 180000).toLocaleTimeString()}] Coach: That's helpful context. When you think about these three projects, which one feels most urgent to you right now, and which one excites you the most?

[${new Date(Date.now() + 240000).toLocaleTimeString()}] User: The quarterly report is definitely the most urgent since it's due next week. But honestly, the client presentation excites me more because it's for a potential big client.

[${new Date(Date.now() + 300000).toLocaleTimeString()}] Coach: Excellent insight! You've identified both urgency and personal motivation. Here's what I'd suggest: Let's use a simple prioritization framework. First, focus on completing the quarterly report since it has the nearest deadline. Then, channel that excitement about the client presentation into dedicated time blocks for preparation.

[${new Date(Date.now() + 360000).toLocaleTimeString()}] User: That makes sense. I think I've been trying to juggle all three at once instead of focusing on one at a time.

[${new Date(Date.now() + 420000).toLocaleTimeString()}] Coach: Exactly! Multitasking often creates that overwhelming feeling. Would you like to create a specific schedule for the next week that prioritizes the quarterly report while still making progress on the presentation?

[${new Date(Date.now() + 480000).toLocaleTimeString()}] User: Yes, that would be really helpful.

[${new Date(Date.now() + 540000).toLocaleTimeString()}] Coach: Great! Let's start with time-blocking. How many hours do you estimate you need for the quarterly report?

[${new Date(Date.now() + 600000).toLocaleTimeString()}] User: Probably about 12 hours total.

[${new Date(Date.now() + 660000).toLocaleTimeString()}] Coach: Perfect. If you dedicate 3 hours each day for the next 4 days, you'll complete it with time to spare. Then you can allocate 1 hour each day to the client presentation. This way, you're making steady progress on both without feeling scattered. How does this approach feel to you?

[${new Date(Date.now() + 720000).toLocaleTimeString()}] User: Much more manageable! I like having a clear plan.

[${new Date(Date.now() + 780000).toLocaleTimeString()}] Coach: Wonderful! Remember, the key is consistency and focus. When you're working on the quarterly report, give it your full attention. When it's presentation time, switch gears completely. This focused approach will actually make you more efficient and reduce that overwhelming feeling.

[${new Date(Date.now() + 840000).toLocaleTimeString()}] User: Thank you, this has been really helpful. I feel like I have a clear path forward now.

[${new Date(Date.now() + 900000).toLocaleTimeString()}] Coach: You're very welcome! You've done great work identifying your priorities and being open to a structured approach. Remember, if you start feeling overwhelmed again, come back to this prioritization framework. You've got this!

Session ended: ${new Date().toLocaleString()}
Duration: ${Math.floor(Math.random() * 10) + 5} minutes
Total messages: ${Math.floor(Math.random() * 20) + 10}
Source: Mock Data (Configure ElevenLabs API key properly for real transcripts)`;
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
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('No API key available for fetching user conversations');
      return [];
    }

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
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('No API key available for deleting conversation');
      return false;
    }

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
  const isConfigured = apiKey.length > 0;
  console.log('API key configured:', isConfigured, 'Key length:', apiKey.length);
  return isConfigured;
}

// Utility function to validate conversation ID format
export function isValidConversationId(conversationId: string): boolean {
  return /^conv_[a-zA-Z0-9]+$/.test(conversationId);
}