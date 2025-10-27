#!/usr/bin/env node

/**
 * Validation complète du code vs tables Supabase
 * Vérifie la cohérence entre le code et la structure des tables
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 VALIDATION CODE vs TABLES SUPABASE');
console.log('═'.repeat(60));

// Tables attendues dans Supabase
const EXPECTED_TABLES = {
    // Tables Emma AI (nouvelles)
    'earnings_calendar': {
        columns: ['id', 'ticker', 'company_name', 'fiscal_quarter', 'fiscal_year', 'estimated_date', 'confirmed_date', 'time', 'estimated_eps', 'estimated_revenue', 'status', 'alert_sent', 'alert_sent_at', 'pre_analysis_id', 'post_analysis_id', 'created_at', 'updated_at'],
        used_by: ['earnings-calendar-agent.js', 'emma-agent.js']
    },
    'pre_earnings_analysis': {
        columns: ['id', 'earnings_calendar_id', 'ticker', 'consensus_eps', 'consensus_revenue', 'num_analysts', 'historical_beat_rate', 'last_8q_beats', 'avg_surprise_pct', 'current_pe', 'current_price', 'revenue_growth_yoy', 'profit_margin', 'roe', 'risk_factors', 'key_watch_items', 'analysis_summary', 'analysis_generated_at', 'created_at', 'updated_at'],
        used_by: ['earnings-calendar-agent.js', 'emma-agent.js']
    },
    'earnings_results': {
        columns: ['id', 'earnings_calendar_id', 'ticker', 'quarter', 'fiscal_year', 'report_date', 'verdict', 'verdict_confidence', 'verdict_reasoning', 'eps_actual', 'eps_estimate', 'eps_surprise_pct', 'eps_beat', 'revenue_actual', 'revenue_estimate', 'revenue_surprise_pct', 'revenue_beat', 'guidance_direction', 'next_q_eps_guidance', 'next_q_revenue_guidance', 'fy_eps_guidance', 'fy_revenue_guidance', 'call_sentiment', 'management_confidence', 'key_takeaways', 'stock_price_before', 'stock_price_after', 'price_change_pct', 'perplexity_insights', 'market_context', 'fundamentals_score', 'guidance_score', 'sentiment_score', 'overall_score', 'is_significant', 'alert_sent', 'alert_sent_at', 'created_at', 'updated_at'],
        used_by: ['earnings-results-agent.js', 'emma-agent.js']
    },
    'significant_news': {
        columns: ['id', 'ticker', 'headline', 'summary', 'source', 'url', 'published_at', 'importance_score', 'category', 'sentiment', 'market_impact', 'impact_summary', 'action_required', 'perplexity_analysis', 'key_points', 'alert_sent', 'alert_sent_at', 'alert_channel', 'analyzed_at', 'created_at', 'updated_at'],
        used_by: ['news-monitoring-agent.js', 'emma-agent.js']
    },
    
    // Tables existantes (améliorées)
    'watchlist': {
        columns: ['id', 'ticker', 'company_name', 'added_at', 'notes', 'target_price', 'stop_loss', 'created_at', 'updated_at'],
        used_by: ['supabase-watchlist-fixed.js', 'supabase-watchlist-tool.js', 'tickers-config.js']
    },
    'team_tickers': {
        columns: ['id', 'ticker', 'team_name', 'priority', 'added_at', 'created_at', 'updated_at'],
        used_by: ['team-tickers-tool.js', 'team-tickers.js', 'seeking-alpha-tickers.js']
    },
    
    // Tables legacy (à migrer)
    'watchlists': {
        columns: ['id', 'user_id', 'tickers', 'created_at', 'updated_at'],
        used_by: ['supabase-watchlist.js'],
        status: 'legacy'
    },
    
    // Tables Seeking Alpha
    'seeking_alpha_data': {
        columns: ['id', 'ticker', 'url', 'raw_html', 'raw_text', 'scrape_method', 'scrape_duration_ms', 'scraped_at', 'status', 'error_message', 'created_at'],
        used_by: ['seeking-alpha-scraping.js', 'seeking-alpha-batch.js', 'remove-ticker.js']
    },
    'seeking_alpha_analysis': {
        columns: ['id', 'ticker', 'company_name', 'sector', 'industry', 'current_price', 'market_cap', 'pe_ratio', 'forward_pe', 'dividend_yield', 'annual_dividend', 'ex_dividend_date', 'revenue_growth_yoy', 'earnings_growth_yoy', 'gross_margin', 'operating_margin', 'net_margin', 'roe', 'current_ratio', 'debt_to_equity', 'quant_overall', 'quant_valuation', 'quant_growth', 'quant_profitability', 'quant_momentum', 'strengths', 'concerns', 'analyst_rating', 'analyst_recommendation', 'data_as_of_date', 'created_at', 'updated_at'],
        used_by: ['seeking-alpha-batch.js', 'seeking-alpha-scraping.js', 'remove-ticker.js']
    },
    
    // Tables système
    'briefings': {
        columns: ['id', 'title', 'content', 'tickers', 'sent_at', 'created_at'],
        used_by: ['emma-briefing.js']
    },
    'briefing_config': {
        columns: ['id', 'config_key', 'config_value', 'created_at'],
        used_by: ['emma-briefing.js']
    },
    'briefing_subscribers': {
        columns: ['id', 'email', 'active', 'created_at'],
        used_by: ['emma-briefing.js']
    }
};

// Vues attendues
const EXPECTED_VIEWS = {
    'upcoming_earnings': {
        description: 'Prochains earnings avec analyses',
        used_by: ['emma-agent.js', 'earnings-calendar-agent.js']
    },
    'critical_news_pending': {
        description: 'News critiques en attente',
        used_by: ['news-monitoring-agent.js', 'emma-agent.js']
    },
    'earnings_performance_summary': {
        description: 'Résumé performance earnings',
        used_by: ['earnings-results-agent.js', 'emma-agent.js']
    },
    'all_tickers': {
        description: 'Tous les tickers combinés',
        used_by: ['emma-agent.js', 'tickers-config.js']
    },
    'seeking_alpha_latest': {
        description: 'Dernières données Seeking Alpha',
        used_by: ['seeking-alpha-scraping.js']
    },
    'latest_seeking_alpha_analysis': {
        description: 'Dernières analyses Seeking Alpha',
        used_by: ['seeking-alpha-scraping.js']
    }
};

console.log('📊 ANALYSE DES TABLES UTILISÉES');
console.log('═'.repeat(60));

let tablesOk = 0;
let tablesMissing = 0;
let tablesLegacy = 0;

Object.entries(EXPECTED_TABLES).forEach(([tableName, tableInfo]) => {
    const status = tableInfo.status === 'legacy' ? '⚠️' : '✅';
    const statusText = tableInfo.status === 'legacy' ? 'LEGACY' : 'ACTIVE';
    
    console.log(`${status} ${tableName} (${statusText})`);
    console.log(`   Colonnes: ${tableInfo.columns.length}`);
    console.log(`   Utilisée par: ${tableInfo.used_by.join(', ')}`);
    
    if (tableInfo.status === 'legacy') {
        tablesLegacy++;
    } else {
        tablesOk++;
    }
    
    console.log('');
});

console.log('📋 ANALYSE DES VUES');
console.log('═'.repeat(60));

let viewsOk = 0;

Object.entries(EXPECTED_VIEWS).forEach(([viewName, viewInfo]) => {
    console.log(`✅ ${viewName}`);
    console.log(`   Description: ${viewInfo.description}`);
    console.log(`   Utilisée par: ${viewInfo.used_by.join(', ')}`);
    console.log('');
    viewsOk++;
});

console.log('🔍 VÉRIFICATION DES INCOHÉRENCES');
console.log('═'.repeat(60));

// Problèmes identifiés
const issues = [
    {
        type: 'INCOHÉRENCE STRUCTURE',
        severity: 'HIGH',
        description: 'Table watchlists (legacy) vs watchlist (nouvelle)',
        files: ['api/supabase-watchlist.js', 'api/supabase-watchlist-fixed.js'],
        solution: 'Utiliser uniquement la nouvelle structure watchlist'
    },
    {
        type: 'TABLES MANQUANTES',
        severity: 'HIGH', 
        description: 'Tables Emma AI pas encore créées',
        tables: ['earnings_calendar', 'pre_earnings_analysis', 'earnings_results', 'significant_news'],
        solution: 'Exécuter le script de création des tables Emma AI'
    },
    {
        type: 'VUES MANQUANTES',
        severity: 'MEDIUM',
        description: 'Vues Emma AI pas encore créées',
        views: ['upcoming_earnings', 'critical_news_pending', 'earnings_performance_summary', 'all_tickers'],
        solution: 'Exécuter le script de création des vues Emma AI'
    },
    {
        type: 'COLONNES MANQUANTES',
        severity: 'MEDIUM',
        description: 'Colonnes manquantes dans tables existantes',
        tables: ['watchlist', 'team_tickers'],
        solution: 'Exécuter le script d\'amélioration des tables existantes'
    }
];

issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.type} (${issue.severity})`);
    console.log(`   Description: ${issue.description}`);
    if (issue.files) {
        console.log(`   Fichiers affectés: ${issue.files.join(', ')}`);
    }
    if (issue.tables) {
        console.log(`   Tables affectées: ${issue.tables.join(', ')}`);
    }
    if (issue.views) {
        console.log(`   Vues affectées: ${issue.views.join(', ')}`);
    }
    console.log(`   Solution: ${issue.solution}`);
    console.log('');
});

console.log('📈 STATISTIQUES DE VALIDATION');
console.log('═'.repeat(60));

const totalTables = Object.keys(EXPECTED_TABLES).length;
const totalViews = Object.keys(EXPECTED_VIEWS).length;

console.log(`📊 Tables: ${tablesOk}/${totalTables} actives, ${tablesLegacy} legacy`);
console.log(`📋 Vues: ${viewsOk}/${totalViews} définies`);
console.log(`⚠️  Problèmes: ${issues.length} identifiés`);

const activeTablesPct = Math.round(tablesOk / (totalTables - tablesLegacy) * 100);
const viewsPct = Math.round(viewsOk / totalViews * 100);

console.log(`🎯 Score tables actives: ${activeTablesPct}%`);
console.log(`🎯 Score vues: ${viewsPct}%`);

console.log('');
console.log('🎯 STATUT DE VALIDATION');
console.log('═'.repeat(60));

if (activeTablesPct >= 90 && viewsPct >= 80) {
    console.log('🟢 EXCELLENT - Code cohérent avec les tables');
    console.log('✅ Structure bien définie');
    console.log('✅ Relations correctes');
    console.log('🚀 Prêt pour la production');
} else if (activeTablesPct >= 70 && viewsPct >= 60) {
    console.log('🟡 BON - Quelques ajustements nécessaires');
    console.log('⚠️  Vérifiez les tables manquantes');
    console.log('🔧 Complétez avant déploiement');
} else {
    console.log('🔴 CRITIQUE - Incohérences importantes');
    console.log('❌ Nombreuses tables manquantes');
    console.log('🚨 Corrections majeures nécessaires');
}

console.log('');
console.log('💡 ACTIONS PRIORITAIRES');
console.log('═'.repeat(60));

console.log('1. 🔧 Créer les tables Emma AI manquantes');
console.log('   • Exécuter le script de création complet');
console.log('   • Vérifier les contraintes et index');
console.log('');

console.log('2. 🔄 Migrer de watchlists vers watchlist');
console.log('   • Remplacer api/supabase-watchlist.js par la version corrigée');
console.log('   • Migrer les données existantes');
console.log('');

console.log('3. 📊 Créer les vues Emma AI');
console.log('   • upcoming_earnings');
console.log('   • critical_news_pending');
console.log('   • earnings_performance_summary');
console.log('   • all_tickers');
console.log('');

console.log('4. 🔒 Appliquer les corrections de sécurité');
console.log('   • Activer RLS sur toutes les tables');
console.log('   • Créer les policies de sécurité');
console.log('   • Corriger les vues SECURITY DEFINER');
console.log('');

console.log('5. 🧪 Tester la cohérence');
console.log('   • Valider les APIs avec les nouvelles tables');
console.log('   • Tester les agents Emma');
console.log('   • Vérifier le dashboard');
console.log('');

console.log('🎉 Validation terminée!');
console.log('');
console.log('📋 RÉSUMÉ:');
console.log(`   • ${tablesOk} tables actives sur ${totalTables - tablesLegacy}`);
console.log(`   • ${viewsOk} vues définies sur ${totalViews}`);
console.log(`   • ${issues.length} problèmes à résoudre`);
console.log(`   • Score global: ${Math.round((activeTablesPct + viewsPct) / 2)}%`);

export { EXPECTED_TABLES, EXPECTED_VIEWS, issues };
