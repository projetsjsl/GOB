// Configuration Supabase pour GOB
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Client } = pg;

export const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL || 'https://gob-watchlist.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    dbPassword: '5mUaqujMflrgZyCo',
    
    // Tables principales
    tables: {
        earnings_calendar: 'earnings_calendar',
        pre_earnings_analysis: 'pre_earnings_analysis',
        earnings_results: 'earnings_results',
        significant_news: 'significant_news',
        watchlist: 'watchlist'
    },
    
    // Vues utiles
    views: {
        upcoming_earnings: 'upcoming_earnings',
        critical_news_pending: 'critical_news_pending',
        earnings_performance_summary: 'earnings_performance_summary'
    }
};

// Fonction de connexion Supabase
export function createSupabaseClient(useServiceRole = false) {
    // createClient is now imported at top of file
    const key = useServiceRole
        ? SUPABASE_CONFIG.serviceRoleKey
        : SUPABASE_CONFIG.anonKey;

    if (!key) {
        throw new Error('Clé Supabase manquante. Configurez SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY');
    }

    return createClient(SUPABASE_CONFIG.url, key);
}

// Fonction de connexion PostgreSQL directe
export function createPostgresClient() {
    // Client is now imported at top of file
    return new Client({
        host: 'db.gob-watchlist.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: SUPABASE_CONFIG.dbPassword,
        ssl: { rejectUnauthorized: false }
    });
}
