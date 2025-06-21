import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your NEXT_PUBLIC_SUPABASE_URL.');
}

console.log('Initializing Supabase client with URL:', supabaseUrl.substring(0, 30) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'coachcast-web'
    }
  }
});

// Test connection on initialization
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection test failed:', error);
  } else {
    console.log('Supabase connection test successful');
  }
}).catch(error => {
  console.error('Supabase connection test error:', error);
});

// Database types
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