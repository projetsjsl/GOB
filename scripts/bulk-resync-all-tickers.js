/**
 * Script de resynchronisation complète de tous les tickers
 * 
 * Ce script :
 * 1. Charge tous les tickers actifs depuis Supabase
 * 2. Pour chaque ticker, récupère les données complètes depuis FMP
 * 3. Affiche un résumé détaillé des résultats
 * 
 * Usage: node scripts/bulk-resync-all-tickers.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_BASE_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://gobapps.com';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Récupère tous les tickers actifs depuis Supabase
 */
async function getAllTickers() {
    try {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, company_name, sector, country, exchange, is_active')
            .eq('is_active', true)
            .order('ticker', { ascending: true })
            .limit(1000);
        
        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }
        
        return data || [];
    } catch (error) {
        throw new Error(`Erreur récupération tickers: ${error.message}`);
    }
}

/**
 * Synchronise les données complètes d'un ticker depuis FMP
 */
async function syncTickerData(ticker) {
    const startTime = Date.now();
    try {
        const response = await fetch(`${API_BASE_URL}/api/fmp-company-data?symbol=${ticker.ticker}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            return { 
                success: false, 
                ticker: ticker.ticker, 
                error: `HTTP ${response.status}: ${response.statusText}`,
                duration: Date.now() - startTime
            };
        }
        
        const data = await response.json();
        
        if (data.error) {
            return { 
                success: false, 
                ticker: ticker.ticker, 
                error: data.error,
                duration: Date.now() - startTime
            };
        }
        
        // Vérifier que les données sont valides
        const hasValidData = data.data && data.data.length > 0;
        const hasValidPrice = data.currentPrice && data.currentPrice > 0;
        const hasFinancialData = hasValidData && data.data.some(d => 
            d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
        );
        
        // Mettre à jour les métadonnées dans Supabase
        try {
            const updateData = {
                updated_at: new Date().toISOString()
            };
            
            if (data.info?.name) updateData.company_name = data.info.name;
            if (data.info?.sector) updateData.sector = data.info.sector;
            if (data.info?.country) updateData.country = data.info.country;
            if (data.info?.exchange) updateData.exchange = data.info.exchange;
            if (data.info?.currency) updateData.currency = data.info.currency;
            
            const { error: updateError } = await supabase
                .from('tickers')
                .update(updateData)
                .eq('ticker', ticker.ticker);
            
            if (updateError) {
                console.warn(`   ⚠️  Impossible de mettre à jour ${ticker.ticker} dans Supabase: ${updateError.message}`);
            }
        } catch (updateError) {
            console.warn(`   ⚠️  Erreur mise à jour ${ticker.ticker}:`, updateError.message);
        }
        
        return { 
            success: true, 
            ticker: ticker.ticker,
            hasValidData,
            hasValidPrice,
            hasFinancialData,
            yearsOfData: data.data ? data.data.length : 0,
            currentPrice: data.currentPrice || null,
            sector: data.info?.sector || null,
            duration: Date.now() - startTime
        };
    } catch (error) {
        return { 
            success: false, 
            ticker: ticker.ticker, 
            error: error.message,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Fonction principale
 */
async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RESYNCHRONISATION COMPLÈTE DE TOUS LES TICKERS            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);
    
    const startTime = Date.now();
    
    // 1. Récupérer tous les tickers
    console.log('📖 Étape 1: Récupération des tickers depuis Supabase...');
    const tickers = await getAllTickers();
    console.log(`✅ ${tickers.length} tickers actifs trouvés\n`);
    
    if (tickers.length === 0) {
        console.log('⚠️  Aucun ticker actif trouvé. Arrêt du script.');
        return;
    }
    
    // 2. Afficher la liste des tickers
    console.log('📋 Liste des tickers à synchroniser:');
    tickers.forEach((t, i) => {
        console.log(`   ${(i + 1).toString().padStart(3, ' ')}. ${t.ticker.padEnd(10)} - ${t.company_name || 'N/A'}`);
    });
    console.log('');
    
    // 3. Synchroniser tous les tickers
    console.log('🚀 Étape 2: Synchronisation des données depuis FMP...\n');
    
    let success = 0;
    let errors = 0;
    let withValidData = 0;
    let withInvalidData = 0;
    let totalDuration = 0;
    
    const errorDetails = [];
    const successDetails = [];
    const invalidDataDetails = [];
    
    // Traiter par batch pour éviter de surcharger l'API
    const batchSize = 3;
    const delayBetweenBatches = 1000; // 1 seconde entre les batches
    
    for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize);
        
        // Attendre entre les batches
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
        
        // Traiter le batch en parallèle
        const batchResults = await Promise.all(
            batch.map(ticker => syncTickerData(ticker))
        );
        
        // Analyser les résultats du batch
        batchResults.forEach(result => {
            totalDuration += result.duration || 0;
            
            if (result.success) {
                success++;
                if (result.hasValidData && result.hasValidPrice && result.hasFinancialData) {
                    withValidData++;
                    successDetails.push({
                        ticker: result.ticker,
                        years: result.yearsOfData,
                        price: result.currentPrice,
                        sector: result.sector,
                        duration: result.duration
                    });
                } else {
                    withInvalidData++;
                    invalidDataDetails.push({
                        ticker: result.ticker,
                        reason: !result.hasValidData ? 'Pas de données historiques' :
                               !result.hasValidPrice ? 'Prix invalide' :
                               !result.hasFinancialData ? 'Pas de données financières' : 'Données incomplètes',
                        years: result.yearsOfData,
                        price: result.currentPrice
                    });
                }
            } else {
                errors++;
                errorDetails.push({
                    ticker: result.ticker,
                    error: result.error,
                    duration: result.duration
                });
            }
            
            // Afficher le progrès
            const current = i + batch.indexOf(batch.find(t => t.ticker === result.ticker)) + 1;
            const status = result.success ? '✅' : '❌';
            const info = result.success 
                ? `${result.yearsOfData} ans, ${result.currentPrice ? `$${result.currentPrice.toFixed(2)}` : 'N/A'}`
                : result.error;
            console.log(`   ${status} [${current.toString().padStart(3, ' ')}/${tickers.length}] ${result.ticker.padEnd(10)} - ${info}`);
        });
    }
    
    // 4. Résumé détaillé
    const totalTime = Date.now() - startTime;
    const avgDuration = totalDuration / tickers.length;
    
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RÉSUMÉ DE LA SYNCHRONISATION                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📊 Statistiques globales:`);
    console.log(`   • Tickers traités: ${tickers.length}`);
    console.log(`   • ✅ Synchronisations réussies: ${success} (${(success / tickers.length * 100).toFixed(1)}%)`);
    console.log(`   • ❌ Erreurs: ${errors} (${(errors / tickers.length * 100).toFixed(1)}%)`);
    console.log(`   • ⏱️  Temps total: ${(totalTime / 1000).toFixed(1)}s (moyenne: ${(avgDuration / 1000).toFixed(2)}s/ticker)\n`);
    
    console.log(`📈 Qualité des données:`);
    console.log(`   • ✅ Données valides et complètes: ${withValidData} (${(withValidData / success * 100).toFixed(1)}% des succès)`);
    console.log(`   • ⚠️  Données invalides ou incomplètes: ${withInvalidData} (${(withInvalidData / success * 100).toFixed(1)}% des succès)\n`);
    
    // Statistiques sur les données historiques
    if (successDetails.length > 0) {
        const avgYears = successDetails.reduce((sum, t) => sum + t.years, 0) / successDetails.length;
        const minYears = Math.min(...successDetails.map(t => t.years));
        const maxYears = Math.max(...successDetails.map(t => t.years));
        
        console.log(`📊 Statistiques données historiques (${withValidData} tickers valides):`);
        console.log(`   • Moyenne d'années de données: ${avgYears.toFixed(1)}`);
        console.log(`   • Minimum: ${minYears} années`);
        console.log(`   • Maximum: ${maxYears} années`);
        
        // Compter par catégories
        const with3PlusYears = successDetails.filter(t => t.years >= 3).length;
        const with5PlusYears = successDetails.filter(t => t.years >= 5).length;
        const with10PlusYears = successDetails.filter(t => t.years >= 10).length;
        
        console.log(`\n📈 Répartition par nombre d'années:`);
        console.log(`   • ≥ 3 ans (minimum pour CAGR): ${with3PlusYears} (${(with3PlusYears / withValidData * 100).toFixed(1)}%)`);
        console.log(`   • ≥ 5 ans (recommandé): ${with5PlusYears} (${(with5PlusYears / withValidData * 100).toFixed(1)}%)`);
        console.log(`   • ≥ 10 ans (optimal): ${with10PlusYears} (${(with10PlusYears / withValidData * 100).toFixed(1)}%)\n`);
    }
    
    // Détails des erreurs
    if (errorDetails.length > 0) {
        console.log(`❌ Erreurs détaillées (${errorDetails.length} tickers):`);
        errorDetails.slice(0, 20).forEach((e, i) => {
            console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${e.ticker.padEnd(10)} - ${e.error}`);
        });
        if (errorDetails.length > 20) {
            console.log(`   ... et ${errorDetails.length - 20} autres erreurs\n`);
        } else {
            console.log('');
        }
    }
    
    // Détails des données invalides
    if (invalidDataDetails.length > 0) {
        console.log(`⚠️  Tickers avec données invalides ou incomplètes (${invalidDataDetails.length}):`);
        invalidDataDetails.slice(0, 20).forEach((t, i) => {
            console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${t.ticker.padEnd(10)} - ${t.reason} (${t.years} ans, prix: ${t.price ? `$${t.price.toFixed(2)}` : 'N/A'})`);
        });
        if (invalidDataDetails.length > 20) {
            console.log(`   ... et ${invalidDataDetails.length - 20} autres tickers\n`);
        } else {
            console.log('');
        }
    }
    
    // Top 10 des meilleurs tickers (par nombre d'années de données)
    if (successDetails.length > 0) {
        const topTickers = [...successDetails]
            .sort((a, b) => b.years - a.years)
            .slice(0, 10);
        
        console.log(`🏆 Top 10 des tickers avec le plus de données historiques:`);
        topTickers.forEach((t, i) => {
            console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${t.ticker.padEnd(10)} - ${t.years} années, ${t.price ? `$${t.price.toFixed(2)}` : 'N/A'}, ${t.sector || 'N/A'}`);
        });
        console.log('');
    }
    
    console.log('✅ Processus de resynchronisation terminé!\n');
    console.log(`💡 Prochaines étapes:`);
    console.log(`   1. Vérifiez les résultats ci-dessus`);
    console.log(`   2. Dans l'application 3p1, utilisez "Synchroniser tous les tickers" pour mettre à jour LocalStorage`);
    console.log(`   3. Les données seront automatiquement synchronisées lors de l'ouverture de chaque ticker\n`);
}

// Exécuter le script
main().catch(error => {
    console.error('\n❌ Erreur fatale:', error);
    console.error(error.stack);
    process.exit(1);
});

