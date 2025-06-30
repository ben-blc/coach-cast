// Tavus API integration for video AI conversations
import { getCurrentUser } from './auth';

const TAVUS_API_KEY = 'e3b388e8a7c74f33b06f7d4f446dbc64';
const TAVUS_API_BASE = 'https://tavusapi.com/v2';

export interface TavusConversationResponse {
  id: string;
  status: string;
  video_url?: string;
  error?: string;
}

export interface TavusConversationParams {
  replica_id: string;
  persona_id: string;
  custom_fields?: Record<string, string>;
}

/**
 * Create a new Tavus conversation (video generation)
 */
export async function createTavusConversation(params: TavusConversationParams): Promise<TavusConversationResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare request body according to Tavus API docs
    const requestBody = {
      replica_id: params.replica_id,
      persona_id: params.persona_id,
      conversation_name: params.custom_fields?.conversation_name || `Session with ${params.custom_fields?.user_name || 'User'}`,
      conversational_context: params.custom_fields?.conversational_context || `This is a coaching session with ${params.custom_fields?.user_name || 'a user'}.`,
      properties: {
        max_call_duration: 60,
        participant_left_timeout: 60,
        participant_absent_timeout: 60,
        enable_recording: true,
        enable_closed_captions: true,
        apply_greenscreen: false,
        language: "english"
      }
    };

    console.log('Creating Tavus conversation with:', requestBody);

    const response = await fetch(`${TAVUS_API_BASE}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Tavus API error:', errorData);
      throw new Error(`Tavus API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Tavus conversation created:', data);
    
    return {
      id: data.conversation_id,
      status: data.status,
      video_url: data.conversation_url
    };
  } catch (error) {
    console.error('Error creating Tavus conversation:', error);
    return {
      id: '',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get the status of a Tavus conversation
 */
export async function getTavusConversationStatus(conversationId: string): Promise<TavusConversationResponse> {
  try {
    const response = await fetch(`${TAVUS_API_BASE}/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Tavus API error:', errorData);
      throw new Error(`Tavus API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Tavus conversation status:', data);
    
    return {
      id: data.conversation_id,
      status: data.status,
      video_url: data.conversation_url
    };
  } catch (error) {
    console.error('Error getting Tavus conversation status:', error);
    return {
      id: conversationId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get the video URL for a Tavus conversation
 */
export async function getTavusVideoUrl(conversationId: string): Promise<string | null> {
  try {
    const status = await getTavusConversationStatus(conversationId);
    return status.video_url || null;
  } catch (error) {
    console.error('Error getting Tavus video URL:', error);
    return null;
  }
}

/**
 * End a Tavus conversation
 */
export async function endTavusConversation(conversationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${TAVUS_API_BASE}/conversations/${conversationId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Tavus API error ending conversation:', errorData);
      return false;
    }

    console.log('Tavus conversation ended successfully:', conversationId);
    return true;
  } catch (error) {
    console.error('Error ending Tavus conversation:', error);
    return false;
  }
}