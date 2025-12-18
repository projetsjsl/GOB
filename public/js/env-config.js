/**
 * Environment Configuration Injection Script
 * 
 * This script injects environment variables into the window object
 * for use by client-side code in static HTML files.
 * 
 * USAGE:
 * 1. Include this script before any other scripts that need env vars
 * 2. Vercel will inject values during server-side rendering
 * 3. For local development, set window.ENV_CONFIG manually
 * 
 * SECURITY NOTE:
 * - Only PUBLIC keys should be injected here (anon keys, public URLs)
 * - Never inject service_role or admin keys
 * - The anon key is designed to be public (RLS protects data)
 */

(function() {
    'use strict';
    
    // Default configuration (safe public values)
    const ENV_CONFIG = {
        // Supabase public configuration
        SUPABASE_URL: 'https://boyuxgdplbpkknplxbxp.supabase.co',
        // Note: This is the anon key - it's designed to be public
        // Row Level Security (RLS) protects the data, not this key
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXV4Z2RwbGJwa2tucGx4YnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzU5MTQsImV4cCI6MjA3NTkxMTkxNH0.-M-QdpBFlDtg1CeA00VepQCNzGzvU-tISyVA0yCLBdw',
        
        // API Keys (Designated as public for these specific frontend apps)
        GEMINI_API_KEY: 'AIzaSyCQxlKZCgsjAytjEYz2EyKYhacPSJdGaVY',
        TAVUS_API_KEY: '28eb5b8a711a4abd9c82e77a7279f9ca',
        
        // API endpoints
        EMMA_API_ENDPOINT: '/api/emma-agent',
        
        // Feature flags
        ENABLE_EXTERNAL_AI: true,
        ENABLE_DEBUG_LOGGING: false
    };
    
    // Try to load from Vercel environment injection
    // Vercel can inject env vars via __NEXT_DATA__ or inline scripts
    try {
        if (typeof window.__ENV__ === 'object') {
            Object.assign(ENV_CONFIG, window.__ENV__);
        }
        
        // Also check for Next.js style injection
        if (typeof window.__NEXT_DATA__ === 'object' && window.__NEXT_DATA__.props?.env) {
            Object.assign(ENV_CONFIG, window.__NEXT_DATA__.props.env);
        }
    } catch (e) {
        console.warn('Could not load environment from Vercel injection:', e);
    }
    
    // Expose to window
    window.ENV_CONFIG = ENV_CONFIG;
    window.SUPABASE_URL = ENV_CONFIG.SUPABASE_URL;
    window.SUPABASE_ANON_KEY = ENV_CONFIG.SUPABASE_ANON_KEY;
    
    // Helper function to get environment variable with fallback
    window.getEnv = function(key, defaultValue = null) {
        return ENV_CONFIG[key] !== undefined ? ENV_CONFIG[key] : defaultValue;
    };
    
    // Log in development mode
    if (ENV_CONFIG.ENABLE_DEBUG_LOGGING) {
        console.log('🔧 Environment config loaded:', {
            ...ENV_CONFIG,
            SUPABASE_ANON_KEY: ENV_CONFIG.SUPABASE_ANON_KEY ? '***configured***' : 'not set'
        });
    }
})();
