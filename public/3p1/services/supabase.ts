/**
 * Supabase Client for 3p1 Application
 * Used for real-time subscriptions and direct database access
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment configuration - uses window globals set by env-config.js
// Try multiple methods to get the key (env-config.js may load async)
function getSupabaseConfig() {
  if (typeof window === 'undefined') return { url: null, key: null };
  
  // Method 1: Direct window properties (set by env-config.js)
  const url = window.SUPABASE_URL || window.ENV_CONFIG?.SUPABASE_URL || 'https://boyuxgdplbpkknplxbxp.supabase.co';
  const key = window.SUPABASE_ANON_KEY || window.ENV_CONFIG?.SUPABASE_ANON_KEY;
  
  // Method 2: Try to read from env-config.js if it exists in DOM
  if (!key && typeof document !== 'undefined') {
    const envScript = document.querySelector('script[src*="env-config"]');
    if (envScript) {
      // Script exists, wait a bit for it to execute
      console.log('📋 env-config.js script found in DOM');
    }
  }
  
  return { url, key };
}

const { url: SUPABASE_URL, key: SUPABASE_ANON_KEY } = getSupabaseConfig();

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
  
  // Try to get config again (in case env-config.js loaded after module init)
  const config = getSupabaseConfig();
  const key = config.key || SUPABASE_ANON_KEY;
  const url = config.url || SUPABASE_URL;
  
  if (!key) {
    console.warn('⚠️ Supabase anon key not configured. Real-time sync disabled.');
    console.warn('   Make sure env-config.js is loaded before this script.');
    console.warn('   Current window.SUPABASE_ANON_KEY:', typeof window !== 'undefined' ? window.SUPABASE_ANON_KEY : 'N/A');
    console.warn('   Current window.ENV_CONFIG:', typeof window !== 'undefined' ? window.ENV_CONFIG : 'N/A');
    return null;
  }

  try {
    supabaseInstance = createClient(url, key, {
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
