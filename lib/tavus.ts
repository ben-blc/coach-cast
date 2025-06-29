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

    // Add user information to custom fields if not provided
    const customFields = params.custom_fields || {};
    if (!customFields.user_name && user.user_metadata?.full_name) {
      customFields.user_name = user.user_metadata.full_name;
    }
    if (!customFields.user_email && user.email) {
      customFields.user_email = user.email;
    }

    // Prepare request body according to Tavus API docs
    const requestBody = {
      replica_id: params.replica_id,
      persona_id: params.persona_id,
      conversation_name: `Session with ${customFields.user_name || 'User'}`,
      conversational_context: `This is a coaching session with ${customFields.user_name || 'a user'}.`
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
 * Poll for Tavus video completion
 */
export async function pollForTavusVideo(
  conversationId: string, 
  maxAttempts = 20, 
  intervalMs = 3000
): Promise<string | null> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Polling for Tavus video (attempt ${attempts}/${maxAttempts})...`);
    
    const status = await getTavusConversationStatus(conversationId);
    
    if (status.status === 'completed' && status.video_url) {
      console.log('Tavus video is ready:', status.video_url);
      return status.video_url;
    }
    
    if (status.status === 'error' || status.error) {
      console.error('Error in Tavus video generation:', status.error);
      return null;
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  console.warn('Tavus video polling timed out after', maxAttempts, 'attempts');
  return null;
}