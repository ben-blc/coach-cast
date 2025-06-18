import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  user_type: 'client' | 'coach';
  created_at: string;
  updated_at: string;
};

export type CoachingSession = {
  id: string;
  user_id: string;
  coach_id?: string;
  session_type: 'ai_specialist' | 'digital_chemistry' | 'human_voice_ai' | 'live_human';
  duration: number;
  summary: string;
  goals: string[];
  audio_url?: string;
  video_url?: string;
  transcription?: string;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_type: 'ai_explorer' | 'coaching_starter' | 'coaching_accelerator';
  credits_remaining: number;
  monthly_limit: number;
  stripe_subscription_id: string;
  status: 'active' | 'cancelled' | 'past_due';
  created_at: string;
  updated_at: string;
};