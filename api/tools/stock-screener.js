/**
 * STOCK SCREENER TOOL
 * Recherche intelligente d'actions selon critères spécifiques
 * 
 * Stratégie hybride:
 * 1. Perplexity génère une liste de tickers selon critères
 * 2. Validation avec données FMP en temps réel
 * 3. Filtrage et tri selon métriques
 */

/**
 * Recherche d'actions selon critères
 * @param {Object} params - Paramètres de recherche
 * @param {string} params.criteria - Critères de recherche (ex: "large cap sous-évaluées")
 * @param {number} params.limit - Nombre de résultats (défaut: 10)
 * @param {string} params.market_cap - Taille: "large", "mid", "small" (optionnel)
 * @param {string} params.sector - Secteur spécifique (optionnel)
 * @returns {Promise<Object>} Liste de tickers avec métriques
 */
export async function searchStocks(params) {
    const { criteria, limit = 10, market_cap, sector } = params;
    
    console.log(`🔍 [Stock Screener] Recherche: "${criteria}" (limit: ${limit})`);
    
    try {
        // 1. Utiliser Perplexity pour générer liste de tickers selon critères
        const tickers = await _generateTickerList(criteria, limit, market_cap, sector);
        
        if (!tickers || tickers.length === 0) {
            return {
                success: false,
                error: 'Aucun ticker trouvé pour ces critères',
                tickers: []
            };
        }
        
        console.log(`✅ [Stock Screener] ${tickers.length} tickers trouvés: ${tickers.join(', ')}`);
        
        // 2. Récupérer données FMP pour validation
        const stocksData = await _fetchStocksData(tickers);
        
        // 3. Filtrer et trier selon critères
        const filteredStocks = _filterAndRank(stocksData, criteria, market_cap);
        
        // 4. Limiter au nombre demandé
        const finalResults = filteredStocks.slice(0, limit);
        
        return {
            success: true,
            tickers: finalResults.map(s => s.symbol),
            stocks: finalResults,
            total_found: tickers.length,
            total_validated: filteredStocks.length,
            total_returned: finalResults.length,
            criteria: criteria,
            search_params: { limit, market_cap, sector }
        };
        
    } catch (error) {
        console.error('❌ [Stock Screener] Error:', error.message);
        return {
            success: false,
            error: error.message,
            tickers: []
        };
    }
}

/**
 * Génère liste de tickers via Perplexity
 */
async function _generateTickerList(criteria, limit, market_cap, sector) {
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    
    if (!PERPLEXITY_API_KEY) {
        throw new Error('PERPLEXITY_API_KEY not configured');
    }
    
    // Construire prompt optimisé
    let prompt = `Tu es un expert en screening d'actions. Trouve ${limit * 2} tickers (symboles boursiers US) qui correspondent à ces critères: "${criteria}".`;
    
    if (market_cap) {
        const capRanges = {
            'large': 'capitalisation > $10B',
            'mid': 'capitalisation entre $2B et $10B',
            'small': 'capitalisation < $2B'
        };
        prompt += `\nCapitalisation: ${capRanges[market_cap] || market_cap}`;
    }
    
    if (sector) {
        prompt += `\nSecteur: ${sector}`;
    }
    
    prompt += `\n\nRÈGLES STRICTES:
1. Retourne UNIQUEMENT une liste de tickers séparés par des virgules
2. Tickers US uniquement (NYSE, NASDAQ)
3. Pas d'explication, juste les tickers
4. Format: AAPL,MSFT,GOOGL,TSLA,...
5. Privilégie les tickers liquides et connus
6. Vérifie que les tickers correspondent vraiment aux critères

Exemple de réponse valide: AAPL,MSFT,GOOGL,AMZN,META`;
    
    console.log(`🤖 [Perplexity] Génération liste de tickers...`);
    
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.1,
                max_tokens: 500
            })
        });
        
        if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Extraire tickers (format: AAPL,MSFT,GOOGL ou liste)
        const tickerMatches = content.match(/\b[A-Z]{1,5}\b/g) || [];
        
        // Filtrer mots communs
        const commonWords = ['US', 'NYSE', 'NASDAQ', 'ETF', 'USD', 'CEO', 'IPO', 'PE', 'PS', 'PB'];
        const tickers = tickerMatches.filter(t => !commonWords.includes(t));
        
        // Dédupliquer
        const uniqueTickers = [...new Set(tickers)];
        
        console.log(`✅ [Perplexity] ${uniqueTickers.length} tickers générés`);
        
        return uniqueTickers;
        
    } catch (error) {
        console.error('❌ [Perplexity] Error:', error.message);
        // Fallback: retourner liste vide pour que Emma puisse générer réponse textuelle
        return [];
    }
}

/**
 * Récupère données FMP pour liste de tickers
 */
async function _fetchStocksData(tickers) {
    const FMP_API_KEY = process.env.FMP_API_KEY;
    
    if (!FMP_API_KEY) {
        console.warn('⚠️ FMP_API_KEY not configured - returning tickers without data');
        return tickers.map(symbol => ({ symbol, data: null }));
    }
    
    console.log(`📊 [FMP] Fetching data for ${tickers.length} tickers...`);
    
    // FMP supporte batch requests (max 5 tickers par requête)
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < tickers.length; i += batchSize) {
        batches.push(tickers.slice(i, i + batchSize));
    }
    
    const results = [];
    
    for (const batch of batches) {
        try {
            const symbolString = batch.join(',');
            
            // Fetch profile + quote en parallèle
            const [profileRes, quoteRes] = await Promise.all([
                fetch(`https://financialmodelingprep.com/api/v3/profile/${symbolString}?apikey=${FMP_API_KEY}`),
                fetch(`https://financialmodelingprep.com/api/v3/quote/${symbolString}?apikey=${FMP_API_KEY}`)
            ]);
            
            const profiles = await profileRes.json();
            const quotes = await quoteRes.json();
            
            // Merger données
            batch.forEach(symbol => {
                const profile = profiles.find(p => p.symbol === symbol);
                const quote = quotes.find(q => q.symbol === symbol);
                
                if (profile && quote) {
                    results.push({
                        symbol,
                        name: profile.companyName,
                        sector: profile.sector,
                        industry: profile.industry,
                        market_cap: profile.mktCap,
                        price: quote.price,
                        pe: quote.pe,
                        eps: quote.eps,
                        change_percent: quote.changesPercentage,
                        volume: quote.volume,
                        avg_volume: quote.avgVolume
                    });
                } else {
                    // Ticker invalide ou pas de données
                    console.warn(`⚠️ No data for ${symbol}`);
                }
            });
            
        } catch (error) {
            console.error(`❌ [FMP] Batch error:`, error.message);
        }
    }
    
    console.log(`✅ [FMP] ${results.length}/${tickers.length} tickers with valid data`);
    
    return results;
}

/**
 * Filtre et classe les actions selon critères
 */
function _filterAndRank(stocks, criteria, market_cap) {
    const criteriaLower = criteria.toLowerCase();
    
    // Filtrer par market cap si spécifié
    let filtered = stocks;
    
    if (market_cap) {
        filtered = filtered.filter(stock => {
            const cap = stock.market_cap || 0;
            switch (market_cap) {
                case 'large':
                    return cap > 10e9; // > $10B
                case 'mid':
                    return cap >= 2e9 && cap <= 10e9; // $2B-$10B
                case 'small':
                    return cap < 2e9; // < $2B
                default:
                    return true;
            }
        });
    }
    
    // Détection critères de tri
    const isUndervalued = criteriaLower.includes('sous-évalué') || 
                         criteriaLower.includes('sous-evaluee') ||
                         criteriaLower.includes('undervalued') ||
                         criteriaLower.includes('value');
    
    const isDividend = criteriaLower.includes('dividende') || 
                      criteriaLower.includes('dividend');
    
    const isGrowth = criteriaLower.includes('croissance') || 
                    criteriaLower.includes('growth');
    
    // Trier selon critères
    if (isUndervalued) {
        // Trier par P/E croissant (plus bas = plus sous-évalué)
        filtered.sort((a, b) => {
            const peA = a.pe || 999;
            const peB = b.pe || 999;
            return peA - peB;
        });
    } else if (isGrowth) {
        // Trier par performance (change_percent décroissant)
        filtered.sort((a, b) => {
            const changeA = a.change_percent || 0;
            const changeB = b.change_percent || 0;
            return changeB - changeA;
        });
    } else {
        // Tri par défaut: market cap décroissant
        filtered.sort((a, b) => {
            const capA = a.market_cap || 0;
            const capB = b.market_cap || 0;
            return capB - capA;
        });
    }
    
    return filtered;
}

export default { searchStocks };






