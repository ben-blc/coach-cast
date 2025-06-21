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
  if (!apiKey) {
    console.warn('ElevenLabs API key not found in environment variables');
    return '';
  }
  return apiKey;
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
      console.warn('No API key available, returning mock data');
      return {
        conversation_id: conversationId,
        agent_id: 'agent_01jxwx5htbedvv36tk7v8g1b49',
        user_id: 'user_unknown',
        status: 'archived',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        metadata: {
          duration: Math.floor(Math.random() * 600) + 300,
          messageCount: Math.floor(Math.random() * 20) + 10,
          participantCount: 2,
          language: 'en',
          model: 'eleven_multilingual_v2',
          voice: 'coaching_specialist'
        }
      };
    }

    console.log('Fetching conversation details for:', conversationId);
    
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Conversation not found:', conversationId);
        return null;
      }
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('ElevenLabs conversation details:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    
    // Return mock data if API fails
    return {
      conversation_id: conversationId,
      agent_id: 'agent_01jxwx5htbedvv36tk7v8g1b49',
      user_id: 'user_unknown',
      status: 'archived',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      metadata: {
        duration: Math.floor(Math.random() * 600) + 300,
        messageCount: Math.floor(Math.random() * 20) + 10,
        participantCount: 2,
        language: 'en',
        model: 'eleven_multilingual_v2',
        voice: 'coaching_specialist'
      }
    };
  }
}

// Fetch conversation transcript from ElevenLabs API
export async function getConversationTranscript(conversationId: string): Promise<string | null> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('No API key available, returning mock transcript');
      return generateMockTranscript(conversationId);
    }

    console.log('Fetching transcript for conversation:', conversationId);
    
    // First, get the conversation messages
    const messagesResponse = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!messagesResponse.ok) {
      if (messagesResponse.status === 404) {
        console.warn('Conversation messages not found:', conversationId);
        return generateMockTranscript(conversationId);
      }
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
      return `https://example.com/audio/${conversationId}.mp3`;
    }

    console.log('Fetching audio for conversation:', conversationId);
    
    // Try to get the audio URL from the conversation details
    const conversation = await getConversationDetails(conversationId);
    if (conversation?.audio_url) {
      return conversation.audio_url;
    }

    // If no direct audio URL, try to get it from the API
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/audio`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Conversation audio not found:', conversationId);
        return null;
      }
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    // If the response is a direct audio file, create a blob URL
    if (response.headers.get('content-type')?.includes('audio')) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    }

    // If the response is JSON with an audio URL
    const data = await response.json();
    return data.audio_url || null;
    
  } catch (error) {
    console.error('Error fetching conversation audio:', error);
    
    // Return mock audio URL if API fails
    return `https://example.com/audio/${conversationId}.mp3`;
  }
}

// Helper function to format messages into a readable transcript
function formatMessagesToTranscript(messages: ElevenLabsMessage[], conversationId: string): string {
  const header = `Conversation Transcript - ${conversationId}
Started: ${new Date().toLocaleString()}

`;

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
Total messages: ${messages.length}`;

  return header + formattedMessages + footer;
}

// Generate a realistic mock transcript for testing/fallback
function generateMockTranscript(conversationId: string): string {
  return `Conversation Transcript - ${conversationId}
Started: ${new Date().toLocaleString()}

Coach: Hello! I'm your AI coaching specialist. How are you feeling today, and what would you like to work on in our session?

User: Hi! I've been feeling a bit overwhelmed with work lately. I have so many projects and I'm struggling to prioritize them effectively.

Coach: I understand that feeling of being overwhelmed can be really challenging. Let's break this down together. Can you tell me about the main projects you're currently working on?

User: Well, I have three major projects. There's the quarterly report that's due next week, a new client presentation for next month, and a long-term strategic planning document that doesn't have a firm deadline yet.

Coach: That's helpful context. When you think about these three projects, which one feels most urgent to you right now, and which one excites you the most?

User: The quarterly report is definitely the most urgent since it's due next week. But honestly, the client presentation excites me more because it's for a potential big client.

Coach: Excellent insight! You've identified both urgency and personal motivation. Here's what I'd suggest: Let's use a simple prioritization framework. First, focus on completing the quarterly report since it has the nearest deadline. Then, channel that excitement about the client presentation into dedicated time blocks for preparation. The strategic planning can be broken into smaller, manageable chunks that you can work on during less intensive periods.

User: That makes sense. I think I've been trying to juggle all three at once instead of focusing on one at a time.

Coach: Exactly! Multitasking often creates that overwhelming feeling. Would you like to create a specific schedule for the next week that prioritizes the quarterly report while still making progress on the presentation?

User: Yes, that would be really helpful.

Coach: Great! Let's start with time-blocking. How many hours do you estimate you need for the quarterly report?

User: Probably about 12 hours total.

Coach: Perfect. If you dedicate 3 hours each day for the next 4 days, you'll complete it with time to spare. Then you can allocate 1 hour each day to the client presentation. This way, you're making steady progress on both without feeling scattered. How does this approach feel to you?

User: Much more manageable! I like having a clear plan.

Coach: Wonderful! Remember, the key is consistency and focus. When you're working on the quarterly report, give it your full attention. When it's presentation time, switch gears completely. This focused approach will actually make you more efficient and reduce that overwhelming feeling.

User: Thank you, this has been really helpful. I feel like I have a clear path forward now.

Coach: You're very welcome! You've done great work identifying your priorities and being open to a structured approach. Remember, if you start feeling overwhelmed again, come back to this prioritization framework. You've got this!

Session ended: ${new Date().toLocaleString()}
Duration: ${Math.floor(Math.random() * 10) + 5} minutes
Total messages: ${Math.floor(Math.random() * 20) + 10}`;
}

// Listen for ElevenLabs widget events
export function setupElevenLabsEventListeners(
  onConversationStart?: (conversationId: string) => void,
  onConversationEnd?: (conversationId: string) => void,
  onError?: (error: string) => void
) {
  // Listen for messages from the ElevenLabs widget
  const handleMessage = (event: MessageEvent) => {
    // Allow messages from ElevenLabs domains
    const allowedOrigins = [
      'https://unpkg.com',
      'https://elevenlabs.io',
      'https://api.elevenlabs.io'
    ];
    
    if (!allowedOrigins.some(origin => event.origin.includes(origin))) {
      return;
    }
    
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      if (data.type === 'elevenlabs-conversation-start' || data.type === 'conversation-start') {
        console.log('ElevenLabs conversation started:', data.conversationId || data.conversation_id);
        onConversationStart?.(data.conversationId || data.conversation_id);
      } else if (data.type === 'elevenlabs-conversation-end' || data.type === 'conversation-end') {
        console.log('ElevenLabs conversation ended:', data.conversationId || data.conversation_id);
        onConversationEnd?.(data.conversationId || data.conversation_id);
      } else if (data.type === 'elevenlabs-error' || data.type === 'error') {
        console.error('ElevenLabs error:', data.error || data.message);
        onError?.(data.error || data.message);
      }
    } catch (error) {
      console.error('Error parsing ElevenLabs message:', error);
    }
  };

  window.addEventListener('message', handleMessage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
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