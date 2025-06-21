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
    // For now, return a realistic sample transcript
    const sampleTranscript = `Conversation Transcript - ${conversationId}
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
Duration: ${Math.floor(Math.random() * 10) + 5} minutes`;

    return sampleTranscript;
  } catch (error) {
    console.error('Error getting conversation transcript:', error);
    return null;
  }
}

// Get conversation audio URL (placeholder - would integrate with ElevenLabs API)
export async function getConversationAudio(conversationId: string): Promise<string | null> {
  try {
    console.log('Getting audio for conversation:', conversationId);
    
    // This would integrate with ElevenLabs API to get actual audio URL
    // For now, return a placeholder audio URL
    return `https://example.com/audio/${conversationId}.mp3`;
  } catch (error) {
    console.error('Error getting conversation audio:', error);
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
      duration: Math.floor(Math.random() * 600) + 300, // 5-15 minutes
      messageCount: Math.floor(Math.random() * 20) + 10, // 10-30 messages
      participantCount: 2,
      language: 'en',
      model: 'eleven_multilingual_v2',
      voice: 'coaching_specialist',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
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