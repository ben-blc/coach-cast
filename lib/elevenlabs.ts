// ElevenLabs integration without external packages
// We'll use the widget directly and capture conversation events

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

// Get conversation transcript (placeholder - would integrate with ElevenLabs API)
export async function getConversationTranscript(conversationId: string): Promise<string | null> {
  try {
    console.log('Getting transcript for conversation:', conversationId);
    
    // This would integrate with ElevenLabs API to get actual transcript
    return `Conversation transcript for ${conversationId} - This would contain the actual conversation transcript from ElevenLabs.`;
  } catch (error) {
    console.error('Error getting conversation transcript:', error);
    return null;
  }
}

// Get conversation details (placeholder - would integrate with ElevenLabs API)
export async function getConversationDetails(conversationId: string): Promise<any | null> {
  try {
    console.log('Getting details for conversation:', conversationId);
    
    return {
      conversationId,
      status: 'completed',
      duration: 0,
      messageCount: 0,
    };
  } catch (error) {
    console.error('Error getting conversation details:', error);
    return null;
  }
}

// Listen for ElevenLabs widget events
export function setupElevenLabsEventListeners(
  onConversationStart?: (conversationId: string) => void,
  onConversationEnd?: (conversationId: string) => void,
  onError?: (error: string) => void
) {
  // Listen for messages from the ElevenLabs widget
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== 'https://unpkg.com') return;
    
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      if (data.type === 'elevenlabs-conversation-start') {
        console.log('ElevenLabs conversation started:', data.conversationId);
        onConversationStart?.(data.conversationId);
      } else if (data.type === 'elevenlabs-conversation-end') {
        console.log('ElevenLabs conversation ended:', data.conversationId);
        onConversationEnd?.(data.conversationId);
      } else if (data.type === 'elevenlabs-error') {
        console.error('ElevenLabs error:', data.error);
        onError?.(data.error);
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