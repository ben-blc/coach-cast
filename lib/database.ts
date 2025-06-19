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
  voice_id?: string;
  personality_prompt: string;
  avatar_url?: string;
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
  voice_id?: string;
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
  summary?: string;
  goals?: string[];
  audio_url?: string;
  video_url?: string;
  transcription?: string;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
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

// Database functions
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }

  return data;
}

export async function getAICoaches(): Promise<AICoach[]> {
  const { data, error } = await supabase
    .from('ai_coaches')
    .select('*')
    .eq('is_active', true)
    .order('created_at');

  if (error) {
    console.error('Error fetching AI coaches:', error);
    return [];
  }

  return data || [];
}

export async function getHumanCoaches(): Promise<HumanCoach[]> {
  const { data, error } = await supabase
    .from('human_coaches')
    .select('*')
    .eq('is_active', true)
    .order('created_at');

  if (error) {
    console.error('Error fetching human coaches:', error);
    return [];
  }

  return data || [];
}

export async function createCoachingSession(session: Partial<CoachingSession>): Promise<CoachingSession | null> {
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
}

export async function updateCoachingSession(sessionId: string, updates: Partial<CoachingSession>): Promise<CoachingSession | null> {
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
}

export async function getUserSessions(userId: string): Promise<CoachingSession[]> {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .select(`
      *,
      ai_coaches(name, specialty),
      human_coaches(name, specialty)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }

  return data || [];
}

export async function updateUserCredits(userId: string, creditsUsed: number): Promise<boolean> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      credits_remaining: supabase.raw(`credits_remaining - ${creditsUsed}`)
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user credits:', error);
    return false;
  }

  return true;
}

export async function completeOnboarding(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error completing onboarding:', error);
    return false;
  }

  return true;
}