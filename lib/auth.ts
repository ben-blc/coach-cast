import { supabase } from './supabase';

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard',
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session?.user || null;
  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error);
    return null;
  }
}

// Function to check if user session is valid and refresh if needed
export async function validateSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error validating session:', error);
      return null;
    }
    
    // If session exists but is expired, try to refresh
    if (session && session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
      console.log('Session expired, attempting to refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        return null;
      }
      
      return refreshData.session?.user || null;
    }
    
    return session?.user || null;
  } catch (error) {
    console.error('Unexpected error in validateSession:', error);
    return null;
  }
}

// Function to handle auth state changes
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.id);
    callback(session?.user || null);
  });
}