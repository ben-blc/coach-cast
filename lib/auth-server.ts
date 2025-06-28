import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from './supabase';

// Server-side authentication helper for API routes
export async function getServerUser() {
  try {
    // Try to get user from cookies first (for server components)
    if (typeof cookies !== 'undefined') {
      try {
        const supabaseServer = createServerComponentClient({ cookies });
        const { data: { user }, error } = await supabaseServer.auth.getUser();
        if (!error && user) {
          return user;
        }
      } catch (error) {
        // Fallback to manual token parsing
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

// Helper to get user from Authorization header
export async function getUserFromAuthHeader(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error('Error verifying token:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error parsing auth token:', error);
    return null;
  }
}