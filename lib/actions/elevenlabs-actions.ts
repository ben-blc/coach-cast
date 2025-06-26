'use server';

import { revalidatePath } from 'next/cache';

// ElevenLabs API integration using server actions
// This ensures API keys are only used on the server side

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

// Get ElevenLabs API key from environment (server-side only)
const getApiKey = (): string => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'your_elevenlabs_api_key_here' || apiKey.trim() === '') {
    console.warn('⚠️ ElevenLabs API key not configured');
    return '';
  }
  return apiKey.trim();
};

// Base API URL for ElevenLabs
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// Server action to fetch conversation details from ElevenLabs API
export async function getConversationDetailsAction(conversationId: string): Promise<{
  success: boolean;
  data?: ElevenLabsConversation;
  error?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ No API key - cannot fetch conversation details');
    return {
      success: false,
      error: 'ElevenLabs API key not configured'
    };
  }

  // Validate conversation ID format
  if (!conversationId || !conversationId.startsWith('conv_')) {
    console.error('🚫 Invalid conversation ID format:', conversationId);
    return {
      success: false,
      error: 'Invalid conversation ID format'
    };
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
      return {
        success: false,
        error: `API Error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();
    console.log('✅ Conversation details received for REAL ID:', conversationId, data);
    
    return {
      success: true,
      data
    };
    
  } catch (error) {
    console.error('❌ Error fetching conversation details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Server action to fetch conversation transcript from ElevenLabs API
export async function getConversationTranscriptAction(conversationId: string): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ No API key - cannot fetch transcript');
    return {
      success: false,
      error: 'ElevenLabs API key not configured'
    };
  }

  // Validate conversation ID format
  if (!conversationId || !conversationId.startsWith('conv_')) {
    console.error('🚫 Invalid conversation ID format:', conversationId);
    return {
      success: false,
      error: 'Invalid conversation ID format'
    };
  }

  try {
    console.log(`🎯 Fetching transcript for REAL ID: ${conversationId}`);
    
    // Get conversation details which includes transcript
    const conversationResult = await getConversationDetailsAction(conversationId);
    if (!conversationResult.success || !conversationResult.data) {
      return {
        success: false,
        error: conversationResult.error || 'Failed to get conversation details'
      };
    }

    if (conversationResult.data.transcript) {
      const formattedTranscript = formatTranscriptToString(conversationResult.data.transcript, conversationId);
      return {
        success: true,
        data: formattedTranscript
      };
    }

    console.warn('⚠️ No transcript found in conversation details for REAL ID:', conversationId);
    return {
      success: false,
      error: 'No transcript found in conversation'
    };
    
  } catch (error) {
    console.error('❌ Error fetching transcript:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Server action to fetch conversation audio URL from ElevenLabs API
export async function getConversationAudioAction(conversationId: string): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ No API key - cannot fetch audio');
    return {
      success: false,
      error: 'ElevenLabs API key not configured'
    };
  }

  // Validate conversation ID format
  if (!conversationId || !conversationId.startsWith('conv_')) {
    console.error('🚫 Invalid conversation ID format:', conversationId);
    return {
      success: false,
      error: 'Invalid conversation ID format'
    };
  }

  try {
    console.log(`🎯 Fetching audio for REAL ID: ${conversationId}`);
    
    // Use the EXACT same pattern as getConversationDetailsAction
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/audio`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 Audio API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Audio API Error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `API Error: ${response.status} - ${errorText}`
      };
    }

    const contentType = response.headers.get('content-type');
    console.log('🎯 Audio content type:', contentType);
    
    if (contentType && contentType.includes('audio')) {
      // If it's audio content, convert to blob and create data URL
      const audioBlob = await response.blob();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      console.log('✅ Audio data URL created for REAL ID:', conversationId);
      return {
        success: true,
        data: dataUrl
      };
    } else {
      // Try to parse as JSON for audio URL
      const audioData = await response.json();
      console.log('✅ Audio data received for REAL ID:', conversationId, audioData);
      
      if (audioData.audio_url) {
        return {
          success: true,
          data: audioData.audio_url
        };
      } else {
        return {
          success: false,
          error: 'No audio URL found in response'
        };
      }
    }
    
  } catch (error) {
    console.error('❌ Error fetching audio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Server action to get all conversations for a user (if API supports it)
export async function getUserConversationsAction(userId?: string): Promise<{
  success: boolean;
  data?: ElevenLabsConversation[];
  error?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ No API key available for fetching user conversations');
    return {
      success: false,
      error: 'ElevenLabs API key not configured'
    };
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
      const errorText = await response.text();
      return {
        success: false,
        error: `ElevenLabs API error: ${response.status} ${errorText}`
      };
    }

    const conversations = await response.json();
    console.log('✅ ElevenLabs user conversations:', conversations);
    
    return {
      success: true,
      data: conversations
    };
  } catch (error) {
    console.error('❌ Error fetching user conversations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Server action to delete a conversation (if API supports it)
export async function deleteConversationAction(conversationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ No API key available for deleting conversation');
    return {
      success: false,
      error: 'ElevenLabs API key not configured'
    };
  }

  // Validate conversation ID format
  if (!conversationId || !conversationId.startsWith('conv_')) {
    console.error('🚫 Invalid conversation ID format:', conversationId);
    return {
      success: false,
      error: 'Invalid conversation ID format'
    };
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
      const errorText = await response.text();
      return {
        success: false,
        error: `ElevenLabs API error: ${response.status} ${errorText}`
      };
    }

    console.log('✅ Conversation deleted successfully:', conversationId);
    return {
      success: true
    };
  } catch (error) {
    console.error('❌ Error deleting conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
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

// Utility function to check if API key is configured
export async function isApiKeyConfiguredAction(): Promise<boolean> {
  const apiKey = getApiKey();
  return apiKey.length > 0;
}