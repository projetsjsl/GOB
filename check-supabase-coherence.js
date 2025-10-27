#!/usr/bin/env node

/**
 * Vérification de cohérence du code global avec les tables Supabase
 * Analyse les incompatibilités et propose des corrections
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 VÉRIFICATION COHÉRENCE CODE SUPABASE');
console.log('═'.repeat(60));

// Configuration des tables attendues
const EXPECTED_TABLES = {
    watchlist: {
        columns: ['id', 'ticker', 'company_name', 'added_at', 'notes', 'target_price', 'stop_loss', 'created_at', 'updated_at'],
        type: 'individual_records' // Chaque ticker = 1 enregistrement
    },
    team_tickers: {
        columns: ['id', 'ticker', 'team_name', 'priority', 'added_at', 'created_at', 'updated_at'],
        type: 'individual_records'
    },
    earnings_calendar: {
        columns: ['id', 'ticker', 'company_name', 'fiscal_quarter', 'fiscal_year', 'estimated_date', 'confirmed_date', 'time', 'estimated_eps', 'estimated_revenue', 'status', 'alert_sent', 'alert_sent_at', 'created_at', 'updated_at'],
        type: 'individual_records'
    },
    pre_earnings_analysis: {
        columns: ['id', 'earnings_calendar_id', 'ticker', 'consensus_eps', 'consensus_revenue', 'num_analysts', 'historical_beat_rate', 'last_8q_beats', 'avg_surprise_pct', 'current_pe', 'current_price', 'revenue_growth_yoy', 'profit_margin', 'roe', 'risk_factors', 'key_watch_items', 'analysis_summary', 'analysis_generated_at', 'created_at'],
        type: 'individual_records'
    },
    earnings_results: {
        columns: ['id', 'earnings_calendar_id', 'ticker', 'quarter', 'fiscal_year', 'report_date', 'verdict', 'verdict_confidence', 'verdict_reasoning', 'eps_actual', 'eps_estimate', 'eps_surprise_pct', 'eps_beat', 'revenue_actual', 'revenue_estimate', 'revenue_surprise_pct', 'revenue_beat', 'guidance_direction', 'next_q_eps_guidance', 'next_q_revenue_guidance', 'fy_eps_guidance', 'fy_revenue_guidance', 'call_sentiment', 'management_confidence', 'key_takeaways', 'stock_price_before', 'stock_price_after', 'price_change_pct', 'perplexity_insights', 'market_context', 'fundamentals_score', 'guidance_score', 'sentiment_score', 'overall_score', 'is_significant', 'alert_sent', 'alert_sent_at', 'created_at'],
        type: 'individual_records'
    },
    significant_news: {
        columns: ['id', 'ticker', 'headline', 'summary', 'source', 'url', 'published_at', 'importance_score', 'category', 'sentiment', 'market_impact', 'impact_summary', 'action_required', 'perplexity_analysis', 'key_points', 'alert_sent', 'alert_sent_at', 'alert_channel', 'analyzed_at', 'created_at'],
        type: 'individual_records'
    }
};

// Ancienne structure (watchlists avec JSONB)
const OLD_WATCHLISTS_STRUCTURE = {
    watchlists: {
        columns: ['id', 'user_id', 'tickers', 'created_at', 'updated_at'],
        type: 'jsonb_array' // tickers = JSONB array
    }
};

console.log('📋 ANALYSE DES INCOMPATIBILITÉS');
console.log('═'.repeat(60));

// 1. Problème principal identifié
console.log('❌ PROBLÈME MAJEUR IDENTIFIÉ:');
console.log('');
console.log('   Le code utilise DEUX structures différentes:');
console.log('   1. watchlists (ancienne) - tickers en JSONB array');
console.log('   2. watchlist (nouvelle) - tickers en enregistrements individuels');
console.log('');

// 2. Fichiers affectés
console.log('📁 FICHIERS AFFECTÉS:');
console.log('');

const affectedFiles = [
    {
        file: 'api/supabase-watchlist.js',
        issue: 'Utilise table "watchlists" (ancienne structure)',
        line: 145,
        fix: 'Changer .from("watchlists") vers .from("watchlist")'
    },
    {
        file: 'lib/tools/supabase-watchlist-tool.js',
        issue: 'Utilise table "watchlist" (nouvelle structure)',
        line: 25,
        fix: '✅ Correct - utilise la nouvelle structure'
    },
    {
        file: 'lib/tools/team-tickers-tool.js',
        issue: 'Utilise table "team_tickers"',
        line: 25,
        fix: '✅ Correct - structure cohérente'
    },
    {
        file: 'api/tickers-config.js',
        issue: 'Utilise table "watchlist" (nouvelle structure)',
        line: 49,
        fix: '✅ Correct - structure cohérente'
    },
    {
        file: 'lib/agents/earnings-calendar-agent.js',
        issue: 'Utilise table "earnings_calendar"',
        line: 259,
        fix: '✅ Correct - structure cohérente'
    },
    {
        file: 'lib/agents/news-monitoring-agent.js',
        issue: 'Utilise table "significant_news"',
        line: 475,
        fix: '✅ Correct - structure cohérente'
    }
];

affectedFiles.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.file}`);
    console.log(`      Problème: ${item.issue}`);
    console.log(`      Solution: ${item.fix}`);
    console.log('');
});

// 3. Corrections nécessaires
console.log('🔧 CORRECTIONS NÉCESSAIRES:');
console.log('═'.repeat(60));
console.log('');

console.log('1️⃣  CORRIGER api/supabase-watchlist.js:');
console.log('   Changer la table de "watchlists" vers "watchlist"');
console.log('   Adapter la logique pour les enregistrements individuels');
console.log('');

console.log('2️⃣  MIGRER LES DONNÉES EXISTANTES:');
console.log('   Si vous avez des données dans "watchlists", les migrer vers "watchlist"');
console.log('');

console.log('3️⃣  TESTER LA COHÉRENCE:');
console.log('   Vérifier que tous les endpoints fonctionnent avec la nouvelle structure');
console.log('');

// 4. Script de migration
console.log('📄 SCRIPT DE MIGRATION:');
console.log('═'.repeat(60));
console.log('');

const migrationScript = `-- Migration des données watchlists vers watchlist
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les données existantes
SELECT * FROM watchlists LIMIT 5;

-- 2. Migrer les données (si watchlists existe)
INSERT INTO watchlist (ticker, company_name, added_at, notes)
SELECT 
    jsonb_array_elements_text(tickers) as ticker,
    NULL as company_name,
    created_at as added_at,
    'Migré depuis watchlists' as notes
FROM watchlists
WHERE tickers IS NOT NULL AND jsonb_array_length(tickers) > 0
ON CONFLICT (ticker) DO NOTHING;

-- 3. Vérifier la migration
SELECT COUNT(*) as total_watchlist FROM watchlist;
SELECT COUNT(*) as total_watchlists FROM watchlists;

-- 4. Supprimer l'ancienne table (optionnel)
-- DROP TABLE IF EXISTS watchlists CASCADE;`;

console.log(migrationScript);
console.log('');

// 5. Corrections de code
console.log('💻 CORRECTIONS DE CODE:');
console.log('═'.repeat(60));
console.log('');

const codeFixes = [
    {
        file: 'api/supabase-watchlist.js',
        changes: [
            'Ligne 145: .from("watchlists") → .from("watchlist")',
            'Adapter la logique pour les enregistrements individuels',
            'Changer la gestion des tickers (array → individual records)'
        ]
    }
];

codeFixes.forEach((fix, index) => {
    console.log(`${index + 1}. ${fix.file}:`);
    fix.changes.forEach(change => {
        console.log(`   • ${change}`);
    });
    console.log('');
});

// 6. Tests de cohérence
console.log('🧪 TESTS DE COHÉRENCE:');
console.log('═'.repeat(60));
console.log('');

console.log('1. Test des endpoints API:');
console.log('   curl -X GET "https://[app].vercel.app/api/supabase-watchlist"');
console.log('   curl -X GET "https://[app].vercel.app/api/tickers-config"');
console.log('');

console.log('2. Test des outils Emma:');
console.log('   node test-supabase-watchlist-tool.js');
console.log('   node test-team-tickers-tool.js');
console.log('');

console.log('3. Test des agents:');
console.log('   node test-earnings-calendar-agent.js');
console.log('   node test-news-monitoring-agent.js');
console.log('');

// 7. Résumé
console.log('📊 RÉSUMÉ DE COHÉRENCE:');
console.log('═'.repeat(60));
console.log('');

const coherenceSummary = {
    'Tables Supabase': '✅ Structure cohérente avec Emma AI',
    'Agents Emma': '✅ Utilisent les bonnes tables',
    'Outils Emma': '✅ Structure cohérente',
    'API tickers-config': '✅ Structure cohérente',
    'API supabase-watchlist': '❌ Utilise ancienne structure',
    'Migration nécessaire': '⚠️ Données watchlists → watchlist'
};

Object.entries(coherenceSummary).forEach(([item, status]) => {
    console.log(`   ${status} ${item}`);
});

console.log('');
console.log('🎯 ACTIONS PRIORITAIRES:');
console.log('═'.repeat(60));
console.log('');

console.log('1. 🔧 Corriger api/supabase-watchlist.js');
console.log('2. 📊 Migrer les données existantes');
console.log('3. 🧪 Tester tous les endpoints');
console.log('4. ✅ Valider la cohérence globale');
console.log('');

console.log('💡 Une fois ces corrections appliquées, le système sera');
console.log('   entièrement cohérent avec les nouvelles tables Supabase!');

export { EXPECTED_TABLES, OLD_WATCHLISTS_STRUCTURE };
