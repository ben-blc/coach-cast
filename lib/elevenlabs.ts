// ElevenLabs API integration - Client-side wrapper for server actions
// This file now acts as a client-side wrapper that calls server actions

import { 
  getConversationDetailsAction,
  getConversationTranscriptAction,
  getConversationAudioAction,
  getUserConversationsAction,
  deleteConversationAction,
  isApiKeyConfiguredAction
} from './actions/elevenlabs-actions';

import { isValidConversationId as validateConversationId } from './utils';

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

// End a conversation session (client-side only)
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

// Client-side wrapper for fetching conversation details
export async function getConversationDetails(conversationId: string): Promise<ElevenLabsConversation | null> {
  try {
    const result = await getConversationDetailsAction(conversationId);
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('❌ Failed to get conversation details:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error calling getConversationDetailsAction:', error);
    return null;
  }
}

// Client-side wrapper for fetching conversation transcript
export async function getConversationTranscript(conversationId: string): Promise<string | null> {
  try {
    const result = await getConversationTranscriptAction(conversationId);
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('❌ Failed to get conversation transcript:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error calling getConversationTranscriptAction:', error);
    return null;
  }
}

// Client-side wrapper for fetching conversation audio
export async function getConversationAudio(conversationId: string): Promise<string | null> {
  try {
    const result = await getConversationAudioAction(conversationId);
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('❌ Failed to get conversation audio:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error calling getConversationAudioAction:', error);
    return null;
  }
}

// Client-side wrapper for getting all conversations for a user
export async function getUserConversations(userId?: string): Promise<ElevenLabsConversation[]> {
  try {
    const result = await getUserConversationsAction(userId);
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('❌ Failed to get user conversations:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error calling getUserConversationsAction:', error);
    return [];
  }
}

// Client-side wrapper for deleting a conversation
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    const result = await deleteConversationAction(conversationId);
    if (result.success) {
      return true;
    } else {
      console.error('❌ Failed to delete conversation:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error calling deleteConversationAction:', error);
    return false;
  }
}

// Client-side wrapper for checking if API key is configured
export async function isApiKeyConfigured(): Promise<boolean> {
  try {
    return await isApiKeyConfiguredAction();
  } catch (error) {
    console.error('❌ Error checking API key configuration:', error);
    return false;
  }
}

// Utility function to validate conversation ID format
export function isValidConversationId(conversationId: string): boolean {
  return validateConversationId(conversationId);
}