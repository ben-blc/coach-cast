import { supabase } from './supabase';
import { useUserTokens } from '@/hooks/use-tokens';
import { syncUserTokens } from './tokens';

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
  plan_type: 'free' | 'explorer' | 'starter' | 'accelerator';
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
  agent_id_eleven_labs?: string;
  personality_prompt: string;
  avatar_url?: string;
  hourly_rate?: number; // in dollars (not cents)
  cal_com_link?: string;
  tavus_replica_id?: string;
  is_active: boolean;
  created_at: string;
};

export type HumanCoach = {
  id: string;
  user_id: string;
  name: string;
  specialty: string;
  bio?: string;
  hourly_rate?: number; // in dollars (not cents)
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
  conversation_id?: string;
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

export type CreditTransaction = {
  id: string;
  user_id: string;
  transaction_type: 'purchase' | 'renewal' | 'usage' | 'refund' | 'bonus';
  credits_amount: number;
  description: string;
  stripe_subscription_id?: string;
  stripe_invoice_id?: string;
  created_at: string;
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

// Helper function to get plan display name
export function getPlanDisplayName(planType: string): string {
  switch (planType) {
    case 'free': return 'Free';
    case 'explorer': return 'Explorer';
    case 'starter': return 'Starter';
    case 'accelerator': return 'Accelerator';
    default: return 'Free';
  }
}

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
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in ensureUserProfile');
      return null;
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert([{
        user_id: userId,
        email: email,
        full_name: fullName,
        user_type: 'client',
        onboarding_completed: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    await ensureUserSubscription(userId);
    
    // Sync user tokens
    await syncUserTokens();
    
    return newProfile;
  } catch (error) {
    console.error('Unexpected error in ensureUserProfile:', error);
    return null;
  }
}

// Helper function to create subscription manually if it doesn't exist
export async function ensureUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in ensureUserSubscription');
      return null;
    }

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingSubscription) {
      return existingSubscription;
    }

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

    // Sync user tokens after creating subscription
    await syncUserTokens();

    return newSubscription;
  } catch (error) {
    console.error('Unexpected error in ensureUserSubscription:', error);
    return null;
  }
}

// Database functions with better error handling
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
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

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      
      if (error.code === 'PGRST116') {
        console.log('Subscription not found, attempting to create one...');
        return await ensureUserSubscription(userId);
      }
      
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getUserSubscription:', error);
    return null;
  }
}

export async function getAICoaches(): Promise<AICoach[]> {
  try {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in getAICoaches');
      return [];
    }

    const { data, error } = await supabase
      .from('coaches')
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
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in getHumanCoaches');
      return [];
    }

    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('is_active', true)
      .eq('coach_type', 'human')
      .order('created_at');

    if (error) {
      console.error('Error fetching human coaches:', error);
      return [];
    }

    const humanCoaches: HumanCoach[] = (data || []).map(coach => ({
      id: coach.id,
      user_id: '',
      name: coach.name,
      specialty: coach.specialty,
      bio: coach.bio,
      hourly_rate: coach.hourly_rate,
      avatar_url: coach.avatar_url,
      tavus_persona_id: '',
      is_active: coach.is_active,
      created_at: coach.created_at,
      updated_at: coach.created_at
    }));

    return humanCoaches;
  } catch (error) {
    console.error('Unexpected error in getHumanCoaches:', error);
    return [];
  }
}

export async function createCoachingSession(session: Partial<CoachingSession>): Promise<CoachingSession | null> {
  try {
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

export async function getSessionById(sessionId: string): Promise<CoachingSession | null> {
  try {
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

    // Use the new token system instead of directly updating subscriptions
    const { data, error } = await supabase.rpc('use_user_tokens', {
      p_user_id: userId,
      p_amount: creditsUsed,
      p_description: `Used ${creditsUsed} tokens for coaching session`,
    });

    if (error) {
      console.error('Error updating user credits:', error);
      return false;
    }

    console.log(`Updated credits for user ${userId}: used ${creditsUsed}`);
    return data;
  } catch (error) {
    console.error('Unexpected error in updateUserCredits:', error);
    return false;
  }
}

// Update subscription with Stripe data
export async function updateUserSubscriptionPlan(
  userId: string, 
  planType: 'explorer' | 'starter' | 'accelerator',
  stripeSubscriptionId?: string
): Promise<boolean> {
  try {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in updateUserSubscriptionPlan');
      return false;
    }

    // Define plan limits
    const planLimits = {
      explorer: { credits: 50, live_sessions: 0 },
      starter: { credits: 250, live_sessions: 1 },
      accelerator: { credits: 600, live_sessions: 2 }
    };

    const limits = planLimits[planType];

    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_type: planType,
        credits_remaining: limits.credits,
        monthly_limit: limits.credits,
        live_sessions_remaining: limits.live_sessions,
        stripe_subscription_id: stripeSubscriptionId,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating subscription plan:', error);
      return false;
    }

    // Sync user tokens after updating subscription
    await syncUserTokens();

    console.log(`Updated subscription for user ${userId} to ${planType}`);
    return true;
  } catch (error) {
    console.error('Unexpected error in updateUserSubscriptionPlan:', error);
    return false;
  }
}

// Credit transaction functions
export async function getUserCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  try {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection failed in getUserCreditTransactions');
      return [];
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return [];
    }

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching credit transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getUserCreditTransactions:', error);
    return [];
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

// Admin functions for managing data
export async function createAICoach(coach: Partial<AICoach>): Promise<AICoach | null> {
  try {
    const { data, error } = await supabase
      .from('coaches')
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
      .from('coaches')
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
      .from('coaches')
      .insert([aiCoachData])
      .select()
      .single();

    if (error) {
      console.error('Error creating human coach:', error);
      return null;
    }

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
      .from('coaches')
      .update(aiCoachUpdates)
      .eq('id', coachId)
      .eq('coach_type', 'human')
      .select()
      .single();

    if (error) {
      console.error('Error updating human coach:', error);
      return null;
    }

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