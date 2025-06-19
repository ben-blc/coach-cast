import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

export interface ConnectionResult {
  success: boolean;
  error?: string;
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<ConnectionResult> {
  try {
    // Create a temporary client to test the connection
    const testClient = createClient(config.url, config.anonKey);
    
    // Test the connection by trying to get the current session
    const { data, error } = await testClient.auth.getSession();
    
    if (error && error.message !== 'Auth session missing!') {
      return {
        success: false,
        error: `Authentication error: ${error.message}`
      };
    }

    // Test database connection by trying to query a system table
    const { error: dbError } = await testClient
      .from('profiles')
      .select('count')
      .limit(1);

    if (dbError && !dbError.message.includes('relation "profiles" does not exist')) {
      return {
        success: false,
        error: `Database error: ${dbError.message}`
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown connection error'
    };
  }
}

export async function saveSupabaseConfig(config: SupabaseConfig): Promise<ConnectionResult> {
  try {
    const response = await fetch('/api/supabase/configure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to save configuration'
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to save configuration'
    };
  }
}