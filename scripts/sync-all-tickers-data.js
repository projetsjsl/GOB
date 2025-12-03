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

async function getAllTickers() {
    try {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, company_name, sector, country, exchange')
            .eq('is_active', true)
            .limit(1000);
        
        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }
        
        return data || [];
    } catch (error) {
        throw new Error(`Erreur récupération tickers: ${error.message}`);
    }
}

async function syncTickerData(ticker) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/fmp-company-data?symbol=${ticker.ticker}`);
        
        if (!response.ok) {
            return { 
                success: false, 
                ticker: ticker.ticker, 
                error: `HTTP ${response.status}` 
            };
        }
        
        const data = await response.json();
        
        if (data.error) {
            return { 
                success: false, 
                ticker: ticker.ticker, 
                error: data.error 
            };
        }
        
        // Mettre à jour le ticker dans Supabase directement
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
                console.warn(`⚠️  Impossible de mettre à jour ${ticker.ticker} dans Supabase: ${updateError.message}`);
            }
        } catch (updateError) {
            // Ne pas échouer si la mise à jour échoue
            console.warn(`⚠️  Erreur mise à jour ${ticker.ticker}:`, updateError.message);
        }
        
        return { 
            success: true, 
            ticker: ticker.ticker,
            hasData: data.data && data.data.length > 0,
            yearsOfData: data.data ? data.data.length : 0
        };
    } catch (error) {
        return { 
            success: false, 
            ticker: ticker.ticker, 
            error: error.message 
        };
    }
}

async function main() {
    console.log('=== SYNCHRONISATION DONNÉES POUR TOUS LES TICKERS ===\n');
    console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);
    
    // 1. Récupérer tous les tickers
    console.log('📖 Récupération des tickers depuis Supabase...');
    const tickers = await getAllTickers();
    console.log(`✅ ${tickers.length} tickers trouvés\n`);
    
    // 2. Filtrer les tickers qui ont besoin de synchronisation
    // (ceux sans secteur ou avec données incomplètes)
    const tickersToSync = tickers.filter(t => 
        !t.sector || !t.country || !t.exchange
    );
    
    console.log(`📊 Statistiques:`);
    console.log(`   - Tickers totaux: ${tickers.length}`);
    console.log(`   - Tickers à synchroniser: ${tickersToSync.length}`);
    console.log(`   - Tickers déjà complets: ${tickers.length - tickersToSync.length}\n`);
    
    if (tickersToSync.length === 0) {
        console.log('✅ Tous les tickers ont déjà des données complètes');
        return;
    }
    
    // 3. Synchroniser les tickers
    console.log('🚀 Synchronisation des données...\n');
    
    let success = 0;
    let errors = 0;
    let withData = 0;
    let withoutData = 0;
    const errorDetails = [];
    const tickersWithData = [];
    const tickersWithoutData = [];
    
    for (let i = 0; i < tickersToSync.length; i++) {
        const ticker = tickersToSync[i];
        const result = await syncTickerData(ticker);
        
        if (result.success) {
            success++;
            if (result.hasData) {
                withData++;
                tickersWithData.push({
                    ticker: ticker.ticker,
                    years: result.yearsOfData
                });
            } else {
                withoutData++;
                tickersWithoutData.push(ticker.ticker);
            }
            
            if (success % 10 === 0) {
                console.log(`   ✅ ${success}/${tickersToSync.length} synchronisés...`);
            }
        } else {
            errors++;
            errorDetails.push({
                ticker: ticker.ticker,
                error: result.error
            });
        }
        
        // Délai pour éviter rate limiting (100ms entre chaque requête)
        if (i < tickersToSync.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    // 4. Résumé
    console.log('\n=== RÉSUMÉ ===');
    console.log(`✅ Synchronisations réussies: ${success}`);
    console.log(`   - Avec données historiques: ${withData}`);
    console.log(`   - Sans données historiques: ${withoutData}`);
    console.log(`❌ Erreurs: ${errors}`);
    
    if (errorDetails.length > 0) {
        console.log('\nErreurs détaillées (premiers 10):');
        errorDetails.slice(0, 10).forEach(e => {
            console.log(`   - ${e.ticker}: ${e.error}`);
        });
        if (errorDetails.length > 10) {
            console.log(`   ... et ${errorDetails.length - 10} autres erreurs`);
        }
    }
    
    // 5. Statistiques sur les données historiques
    if (tickersWithData.length > 0) {
        const avgYears = tickersWithData.reduce((sum, t) => sum + t.years, 0) / tickersWithData.length;
        const minYears = Math.min(...tickersWithData.map(t => t.years));
        const maxYears = Math.max(...tickersWithData.map(t => t.years));
        
        console.log('\n📊 Statistiques données historiques:');
        console.log(`   - Moyenne d'années de données: ${avgYears.toFixed(1)}`);
        console.log(`   - Minimum: ${minYears} années`);
        console.log(`   - Maximum: ${maxYears} années`);
        
        // Compter par catégories
        const with3PlusYears = tickersWithData.filter(t => t.years >= 3).length;
        const with5PlusYears = tickersWithData.filter(t => t.years >= 5).length;
        const with10PlusYears = tickersWithData.filter(t => t.years >= 10).length;
        
        console.log(`\n📈 Répartition:`);
        console.log(`   - ≥ 3 ans (minimum pour CAGR): ${with3PlusYears} (${(with3PlusYears / withData * 100).toFixed(1)}%)`);
        console.log(`   - ≥ 5 ans (recommandé): ${with5PlusYears} (${(with5PlusYears / withData * 100).toFixed(1)}%)`);
        console.log(`   - ≥ 10 ans (optimal): ${with10PlusYears} (${(with10PlusYears / withData * 100).toFixed(1)}%)`);
    }
    
    console.log('\n✅ Processus terminé!');
}

main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

