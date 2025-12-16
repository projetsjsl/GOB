/**
 * Supabase Client for 3p1 Application
 * Used for real-time subscriptions and direct database access
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment configuration - uses window globals set by env-config.js
const SUPABASE_URL = (typeof window !== 'undefined' && window.SUPABASE_URL) 
  || (typeof window !== 'undefined' && window.ENV_CONFIG?.SUPABASE_URL)
  || 'https://boyuxgdplbpkknplxbxp.supabase.co';

const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) 
  || (typeof window !== 'undefined' && window.ENV_CONFIG?.SUPABASE_ANON_KEY)
  || null;

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    ENV_CONFIG?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
    };
  }
}

// Create Supabase client (singleton)
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  
  if (!SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase anon key not configured. Real-time sync disabled.');
    console.warn('   Make sure env-config.js is loaded before this script.');
    return null;
  }

  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    console.log('✅ Supabase client initialized for 3p1');
    return supabaseInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    return null;
  }
}

// Export singleton instance (may be null if not configured)
export const supabase = getSupabaseClient();
