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
  transcript?: TranscriptMessage[];
  audio_url?: string;
  metadata?: any;
  has_audio?: boolean;
  has_user_audio?: boolean;
  has_response_audio?: boolean;
}

export interface TranscriptMessage {
  role: 'user' | 'agent';
  time_in_call_secs: number;
  message: string;
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
    console.warn('⚠️ ElevenLabs API key not configured');
    return '';
  }
  return apiKey.trim();
};

// Base API URL for ElevenLabs
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

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
    console.error('❌ Error ending ElevenLabs conversation:', error);
    return null;
  }
}

// Fetch conversation details from ElevenLabs API
export async function getConversationDetails(conversationId: string): Promise<ElevenLabsConversation | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ No API key - cannot fetch conversation details');
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

    console.log(`📡 API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log('✅ Conversation details received for REAL ID:', conversationId, data);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching conversation details:', error);
    return null;
  }
}

// Fetch conversation transcript from ElevenLabs API
export async function getConversationTranscript(conversationId: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ No API key - cannot fetch transcript');
    return null;
  }

  // Validate conversation ID format
  if (!conversationId || !conversationId.startsWith('conv_')) {
    console.error('🚫 Invalid conversation ID format:', conversationId);
    return null;
  }

  try {
    console.log(`🎯 Fetching transcript for REAL ID: ${conversationId}`);
    
    // Get conversation details which includes transcript
    const conversation = await getConversationDetails(conversationId);
    if (conversation?.transcript) {
      return formatTranscriptToString(conversation.transcript, conversationId);
    }

    console.warn('⚠️ No transcript found in conversation details for REAL ID:', conversationId);
    return null;
    
  } catch (error) {
    console.error('❌ Error fetching transcript:', error);
    return null;
  }
}

// Fetch conversation audio URL from ElevenLabs API
export async function getConversationAudio(conversationId: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ No API key - no audio available');
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

    console.log(`📡 Audio API Status: ${audioResponse.status}`);

    if (audioResponse.ok) {
      const contentType = audioResponse.headers.get('content-type');
      console.log('🎯 Audio content type:', contentType);
      
      if (contentType && contentType.includes('audio')) {
        // Create blob URL for audio data
        const audioBlob = await audioResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('✅ Created audio blob URL for REAL ID:', conversationId, audioUrl);
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
    console.warn('⚠️ Could not fetch audio from API for REAL ID:', conversationId);
    return null;
    
  } catch (error) {
    console.error('❌ Error fetching audio:', error);
    return null;
  }
}

// Helper function to format transcript messages into a readable string
function formatTranscriptToString(transcript: TranscriptMessage[], conversationId: string): string {
  const header = `Conversation Transcript - ${conversationId}
Started: ${new Date().toLocaleString()}
Source: ElevenLabs API

`;

  if (!transcript || transcript.length === 0) {
    return header + "No messages found in this conversation.";
  }

  const formattedMessages = transcript
    .sort((a, b) => a.time_in_call_secs - b.time_in_call_secs)
    .map(message => {
      const role = message.role === 'agent' ? 'Coach' : 'User';
      const timeInCall = Math.floor(message.time_in_call_secs);
      const minutes = Math.floor(timeInCall / 60);
      const seconds = timeInCall % 60;
      const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      return `[${timestamp}] ${role}: ${message.message}`;
    })
    .join('\n\n');

  const footer = `

Session ended: ${new Date().toLocaleString()}
Total messages: ${transcript.length}
Source: ElevenLabs ConvAI API`;

  return header + formattedMessages + footer;
}

// Get all conversations for a user (if API supports it)
export async function getUserConversations(userId?: string): Promise<ElevenLabsConversation[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ No API key available for fetching user conversations');
    return [];
  }

  try {
    console.log('🎯 Fetching conversations for user:', userId);
    
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
    console.log('✅ ElevenLabs user conversations:', conversations);
    
    return conversations;
  } catch (error) {
    console.error('❌ Error fetching user conversations:', error);
    return [];
  }
}

// Delete a conversation (if API supports it)
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ No API key available for deleting conversation');
    return false;
  }

  // Validate conversation ID format
  if (!conversationId || !conversationId.startsWith('conv_')) {
    console.error('🚫 Invalid conversation ID format:', conversationId);
    return false;
  }

  try {
    console.log('🎯 Deleting conversation:', conversationId);
    
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

    console.log('✅ Conversation deleted successfully:', conversationId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting conversation:', error);
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