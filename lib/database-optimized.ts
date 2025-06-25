// Enhanced database functions with caching and optimization
import { supabase } from './supabase';

// Add caching layer for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedCoaches(): Promise<AICoach[]> {
  const cacheKey = 'coaches';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const coaches = await getAICoaches();
  cache.set(cacheKey, { data: coaches, timestamp: Date.now() });
  
  return coaches;
}

// Batch operations for better performance
export async function batchCreateSessionGoals(
  sessionId: string, 
  goals: string[]
): Promise<CoachingSessionGoal[]> {
  const goalRecords = goals.map(goalText => ({
    session_id: sessionId,
    goal_text: goalText,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('coaching_sessions_goals')
    .insert(goalRecords)
    .select();

  if (error) throw error;
  return data || [];
}

// Optimized session query with joins
export async function getSessionsWithDetails(userId: string) {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .select(`
      *,
      coaches!inner(
        id,
        name,
        specialty,
        coach_type,
        avatar_url
      ),
      coaching_sessions_goals(
        id,
        goal_text,
        is_completed,
        completed_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}