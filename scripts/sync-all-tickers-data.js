const API_BASE_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://gobapps.com';

async function getAllTickers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers?is_active=true&limit=1000`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erreur lors du chargement des tickers');
        }
        
        return (result.tickers || []).map(t => ({
            ticker: t.ticker,
            company_name: t.company_name,
            sector: t.sector,
            country: t.country,
            exchange: t.exchange
        }));
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
        
        // Mettre à jour le ticker dans Supabase via API
        try {
            const updateResponse = await fetch(`${API_BASE_URL}/api/admin/tickers`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticker: ticker.ticker,
                    company_name: data.info?.name || ticker.company_name,
                    sector: data.info?.sector || ticker.sector,
                    country: data.info?.country || ticker.country,
                    exchange: data.info?.exchange || ticker.exchange,
                    currency: data.info?.currency || 'USD'
                })
            });
            
            if (!updateResponse.ok) {
                // Ne pas échouer si la mise à jour échoue, on a quand même les données
                console.warn(`⚠️  Impossible de mettre à jour ${ticker.ticker} dans Supabase`);
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

