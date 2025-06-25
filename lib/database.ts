import { supabase } from './supabase';

export type Profile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  user_type: 'client' | 'coach';
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_type: 'free' | 'ai_explorer' | 'coaching_starter' | 'coaching_accelerator';
  credits_remaining: number;
  monthly_limit: number;
  live_sessions_remaining: number;
  stripe_subscription_id?: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
};

export type AICoach = {
  id: string;
  name: string;
  specialty: string;
  description: string;
  bio?: string;
  years_experience?: string;
  coach_type: 'ai' | 'human';
  session_types: string[];
  agent_id_eleven_labs?: string; // Renamed from agent_id
  personality_prompt: string;
  avatar_url?: string;
  hourly_rate?: number; // in cents
  cal_com_link?: string; // Cal.com booking link
  is_active: boolean;
  created_at: string;
};

export type HumanCoach = {
  id: string;
  user_id: string;
  name: string;
  specialty: string;
  bio?: string;
  hourly_rate?: number;
  avatar_url?: string;
  tavus_persona_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CoachingSession = {
  id: string;
  user_id: string;
  session_type: 'ai_specialist' | 'digital_chemistry' | 'human_voice_ai' | 'live_human';
  ai_coach_id?: string;
  human_coach_id?: string;
  duration_seconds: number;
  credits_used: number;
  conversation_id?: string; // ElevenLabs conversation ID
  summary?: string;
  goals?: string[];
  audio_url?: string;
  video_url?: string;
  transcription?: string;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  created_at: string;
  coaches: AICoach | HumanCoach
};

export type CoachingSessionGoal = {
  id: string;
  session_id: string;
  goal_text: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

export type SessionAnalytics = {
  id: string;
  session_id: string;
  sentiment_score?: number;
  key_topics?: string[];
  action_items?: string[];
  progress_notes?: string;
  created_at: string;
};

// Helper function to test Supabase connection
async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
}

// Helper function to create profile manually if it doesn't exist
export async function ensureUserProfile(userId: string, email: string, fullName: string): Promise<Profile | null> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in ensureUserProfile');
      return null;
    }

    // First try to get existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // If no profile exists, create one
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert([{
        user_id: userId,
        email: email,
        full_name: fullName,
        user_type: 'client',
        onboarding_completed: true // Set to true since we're using discovery instead
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    // Also ensure subscription exists
    await ensureUserSubscription(userId);

    return newProfile;
  } catch (error) {
    console.error('Unexpected error in ensureUserProfile:', error);
    return null;
  }
}

// Helper function to create subscription manually if it doesn't exist
export async function ensureUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in ensureUserSubscription');
      return null;
    }

    // First try to get existing subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingSubscription) {
      return existingSubscription;
    }

    // If no subscription exists, create one
    const { data: newSubscription, error } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: userId,
        plan_type: 'free',
        credits_remaining: 7,
        monthly_limit: 7,
        live_sessions_remaining: 0,
        status: 'trialing'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }

    return newSubscription;
  } catch (error) {
    console.error('Unexpected error in ensureUserSubscription:', error);
    return null;
  }
}

// Database functions with better error handling
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in getUserProfile');
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      
      // If profile doesn't exist, try to create it
      if (error.code === 'PGRST116') {
        console.log('Profile not found, attempting to create one...');
        return await ensureUserProfile(userId, session.user.email || '', session.user.user_metadata?.full_name || 'User');
      }
      
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error);
    return null;
  }
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in getUserSubscription');
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found in getUserSubscription');
      return null;
    }

    console.log('Fetching subscription for user:', userId);

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      
      // If subscription doesn't exist, try to create it
      if (error.code === 'PGRST116') {
        console.log('Subscription not found, attempting to create one...');
        return await ensureUserSubscription(userId);
      }
      
      return null;
    }

    console.log('Successfully fetched subscription:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error in getUserSubscription:', error);
    return null;
  }
}

export async function getAICoaches(): Promise<AICoach[]> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in getAICoaches');
      return [];
    }

    const { data, error } = await supabase
      .from('coaches') // Updated table name
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (error) {
      console.error('Error fetching AI coaches:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getAICoaches:', error);
    return [];
  }
}

export async function getHumanCoaches(): Promise<HumanCoach[]> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in getHumanCoaches');
      return [];
    }

    // Now get human coaches from the unified coaches table
    const { data, error } = await supabase
      .from('coaches') // Updated table name
      .select('*')
      .eq('is_active', true)
      .eq('coach_type', 'human')
      .order('created_at');

    if (error) {
      console.error('Error fetching human coaches:', error);
      return [];
    }

    // Transform the data to match HumanCoach interface
    const humanCoaches: HumanCoach[] = (data || []).map(coach => ({
      id: coach.id,
      user_id: '', // Not applicable for unified table
      name: coach.name,
      specialty: coach.specialty,
      bio: coach.bio,
      hourly_rate: coach.hourly_rate,
      avatar_url: coach.avatar_url,
      tavus_persona_id: '', // Not in unified table yet
      is_active: coach.is_active,
      created_at: coach.created_at,
      updated_at: coach.created_at // Use created_at as fallback
    }));

    return humanCoaches;
  } catch (error) {
    console.error('Unexpected error in getHumanCoaches:', error);
    return [];
  }
}

export async function createCoachingSession(session: Partial<CoachingSession>): Promise<CoachingSession | null> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in createCoachingSession');
      return null;
    }

    const { data: { session: authSession } } = await supabase.auth.getSession();
    
    if (!authSession) {
      console.error('No active session found');
      return null;
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert([session])
      .select()
      .single();

    if (error) {
      console.error('Error creating coaching session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in createCoachingSession:', error);
    return null;
  }
}

export async function updateCoachingSession(sessionId: string, updates: Partial<CoachingSession>): Promise<CoachingSession | null> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in updateCoachingSession');
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return null;
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating coaching session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in updateCoachingSession:', error);
    return null;
  }
}

export async function getUserSessions(userId: string): Promise<CoachingSession[]> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in getUserSessions');
      return [];
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return [];
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        coaches(name, specialty)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getUserSessions:', error);
    return [];
  }
}

// New function to get a single session by ID
export async function getSessionById(sessionId: string): Promise<CoachingSession | null> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in getSessionById');
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return null;
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        coaches(name, specialty)
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getSessionById:', error);
    return null;
  }
}

export async function updateUserCredits(userId: string, creditsUsed: number): Promise<boolean> {
  try {
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in updateUserCredits');
      return false;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return false;
    }

    // First get the current credits
    const { data: currentSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current subscription:', fetchError);
      return false;
    }

    if (!currentSubscription) {
      console.error('No subscription found for user');
      return false;
    }

    // Calculate new credits remaining
    const newCreditsRemaining = Math.max(0, currentSubscription.credits_remaining - creditsUsed);

    // Update with the calculated value
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        credits_remaining: newCreditsRemaining,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user credits:', error);
      return false;
    }

    console.log(`Updated credits for user ${userId}: ${currentSubscription.credits_remaining} -> ${newCreditsRemaining} (used ${creditsUsed})`);
    return true;
  } catch (error) {
    console.error('Unexpected error in updateUserCredits:', error);
    return false;
  }
}

// Goals-related functions
export async function getSessionGoals(sessionId: string): Promise<CoachingSessionGoal[]> {
  try {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in getSessionGoals');
      return [];
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return [];
    }

    const { data, error } = await supabase
      .from('coaching_sessions_goals')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');

    if (error) {
      console.error('Error fetching session goals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getSessionGoals:', error);
    return [];
  }
}

export async function createSessionGoals(sessionId: string, goals: string[]): Promise<CoachingSessionGoal[]> {
  try {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in createSessionGoals');
      return [];
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return [];
    }

    const goalRecords = goals.map(goalText => ({
      session_id: sessionId,
      goal_text: goalText
    }));

    const { data, error } = await supabase
      .from('coaching_sessions_goals')
      .insert(goalRecords)
      .select();

    if (error) {
      console.error('Error creating session goals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in createSessionGoals:', error);
    return [];
  }
}

export async function updateSessionGoal(goalId: string, updates: Partial<CoachingSessionGoal>): Promise<CoachingSessionGoal | null> {
  try {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in updateSessionGoal');
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return null;
    }

    // If marking as completed, set completed_at timestamp
    if (updates.is_completed === true && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    } else if (updates.is_completed === false) {
      updates.completed_at = undefined;
    }

    const { data, error } = await supabase
      .from('coaching_sessions_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session goal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in updateSessionGoal:', error);
    return null;
  }
}

export async function deleteSessionGoal(goalId: string): Promise<boolean> {
  try {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in deleteSessionGoal');
      return false;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return false;
    }

    const { error } = await supabase
      .from('coaching_sessions_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error('Error deleting session goal:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in deleteSessionGoal:', error);
    return false;
  }
}

export async function addSessionGoal(sessionId: string, goalText: string): Promise<CoachingSessionGoal | null> {
  try {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in addSessionGoal');
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return null;
    }

    const { data, error } = await supabase
      .from('coaching_sessions_goals')
      .insert([{
        session_id: sessionId,
        goal_text: goalText
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding session goal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in addSessionGoal:', error);
    return null;
  }
}

// Remove the completeOnboarding function since we're not using onboarding anymore
// Users go directly to discovery page

// Admin functions for managing data (requires service role or admin privileges)
export async function createAICoach(coach: Partial<AICoach>): Promise<AICoach | null> {
  try {
    const { data, error } = await supabase
      .from('coaches') // Updated table name
      .insert([coach])
      .select()
      .single();

    if (error) {
      console.error('Error creating AI coach:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in createAICoach:', error);
    return null;
  }
}

export async function updateAICoach(coachId: string, updates: Partial<AICoach>): Promise<AICoach | null> {
  try {
    const { data, error } = await supabase
      .from('coaches') // Updated table name
      .update(updates)
      .eq('id', coachId)
      .select()
      .single();

    if (error) {
      console.error('Error updating AI coach:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in updateAICoach:', error);
    return null;
  }
}

export async function createHumanCoach(coach: Partial<HumanCoach>): Promise<HumanCoach | null> {
  try {
    // Convert HumanCoach to AICoach format for unified table
    const aiCoachData: Partial<AICoach> = {
      name: coach.name,
      specialty: coach.specialty || '',
      description: coach.bio || '',
      bio: coach.bio,
      coach_type: 'human',
      session_types: ['audio_ai', 'video_ai', 'human_coaching'],
      hourly_rate: coach.hourly_rate,
      avatar_url: coach.avatar_url,
      personality_prompt: `You are ${coach.name}, a professional coach specializing in ${coach.specialty}.`,
      is_active: coach.is_active ?? true
    };

    const { data, error } = await supabase
      .from('coaches') // Updated table name
      .insert([aiCoachData])
      .select()
      .single();

    if (error) {
      console.error('Error creating human coach:', error);
      return null;
    }

    // Transform back to HumanCoach format
    const humanCoach: HumanCoach = {
      id: data.id,
      user_id: '',
      name: data.name,
      specialty: data.specialty,
      bio: data.bio,
      hourly_rate: data.hourly_rate,
      avatar_url: data.avatar_url,
      tavus_persona_id: '',
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.created_at
    };

    return humanCoach;
  } catch (error) {
    console.error('Unexpected error in createHumanCoach:', error);
    return null;
  }
}

export async function updateHumanCoach(coachId: string, updates: Partial<HumanCoach>): Promise<HumanCoach | null> {
  try {
    // Convert HumanCoach updates to AICoach format
    const aiCoachUpdates: Partial<AICoach> = {
      name: updates.name,
      specialty: updates.specialty,
      description: updates.bio,
      bio: updates.bio,
      hourly_rate: updates.hourly_rate,
      avatar_url: updates.avatar_url,
      is_active: updates.is_active
    };

    const { data, error } = await supabase
      .from('coaches') // Updated table name
      .update(aiCoachUpdates)
      .eq('id', coachId)
      .eq('coach_type', 'human')
      .select()
      .single();

    if (error) {
      console.error('Error updating human coach:', error);
      return null;
    }

    // Transform back to HumanCoach format
    const humanCoach: HumanCoach = {
      id: data.id,
      user_id: '',
      name: data.name,
      specialty: data.specialty,
      bio: data.bio,
      hourly_rate: data.hourly_rate,
      avatar_url: data.avatar_url,
      tavus_persona_id: '',
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.created_at
    };

    return humanCoach;
  } catch (error) {
    console.error('Unexpected error in updateHumanCoach:', error);
    return null;
  }
}

// Analytics functions
export async function getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('session_analytics')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getSessionAnalytics:', error);
    return null;
  }
}

export async function createSessionAnalytics(analytics: Partial<SessionAnalytics>): Promise<SessionAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('session_analytics')
      .insert([analytics])
      .select()
      .single();

    if (error) {
      console.error('Error creating session analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in createSessionAnalytics:', error);
    return null;
  }
}