#!/usr/bin/env node
/**
 * Script de synchronisation initiale pour Terminal Emma IA
 * 
 * Ce script lance la synchronisation initiale des données FMP vers Supabase :
 * 1. Synchronise les instruments (S&P 500, TSX)
 * 2. Synchronise les indices de marché
 * 
 * Usage: node scripts/sync-terminal-emma-ia-initial.js
 */

const API_BASE = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.API_BASE_URL || 'http://localhost:3000';

console.log('🚀 Synchronisation initiale Terminal Emma IA');
console.log(`📍 API Base: ${API_BASE}\n`);

async function sync(action, params = {}) {
    const url = new URL(`${API_BASE}/api/fmp-sync`);
    url.searchParams.append('action', action);
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });

    console.log(`📡 Appel: ${action}...`);
    
    try {
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log(`✅ ${action} réussi:`, result);
        return result;
    } catch (error) {
        console.error(`❌ ${action} échoué:`, error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 ÉTAPE 1: Synchronisation des instruments');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        await sync('sync-instruments');
        
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('📈 ÉTAPE 2: Synchronisation des indices de marché');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        await sync('sync-indices');
        
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('✅ Synchronisation initiale terminée avec succès!');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        console.log('💡 Prochaines étapes:');
        console.log('   1. Vérifiez les données dans Supabase');
        console.log('   2. Testez le Terminal Emma IA dans le dashboard');
        console.log('   3. Configurez des cron jobs pour la synchronisation automatique\n');
        
    } catch (error) {
        console.error('\n❌ Erreur lors de la synchronisation:', error);
        process.exit(1);
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    main();
}

module.exports = { sync, main };







