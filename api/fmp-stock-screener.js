/**
 * API Proxy pour le Stock Screener FMP Premium
 * Permet de filtrer et decouvrir des titres selon multiples criteres
 * 
 * Premium Features:
 * - Screening multi-criteres (P/E, P/B, Yield, Growth, etc.)
 * - Filtrage par secteur, industrie, pays, bourse
 * - Decouverte automatique de nouveaux tickers
 * - Identification d'opportunites d'investissement
 * 
 * Date: 6 decembre 2025
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;

    if (!FMP_KEY) {
        console.error('FMP_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
    }

    const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

    // Extraire les parametres de requete
    const {
        marketCapMoreThan,
        marketCapLowerThan,
        priceMoreThan,
        priceLowerThan,
        betaMoreThan,
        betaLowerThan,
        volumeMoreThan,
        volumeLowerThan,
        dividendMoreThan,
        dividendLowerThan,
        isETF,
        isActivelyTrading,
        sector,
        industry,
        country,
        exchange,
        limit = 100
    } = req.query;

    try {
        // Construire l'URL avec les parametres
        const params = new URLSearchParams();
        params.append('apikey', FMP_KEY);
        params.append('limit', limit.toString());

        // Ajouter les parametres optionnels
        if (marketCapMoreThan) params.append('marketCapMoreThan', marketCapMoreThan);
        if (marketCapLowerThan) params.append('marketCapLowerThan', marketCapLowerThan);
        if (priceMoreThan) params.append('priceMoreThan', priceMoreThan);
        if (priceLowerThan) params.append('priceLowerThan', priceLowerThan);
        if (betaMoreThan) params.append('betaMoreThan', betaMoreThan);
        if (betaLowerThan) params.append('betaLowerThan', betaLowerThan);
        if (volumeMoreThan) params.append('volumeMoreThan', volumeMoreThan);
        if (volumeLowerThan) params.append('volumeLowerThan', volumeLowerThan);
        if (dividendMoreThan) params.append('dividendMoreThan', dividendMoreThan);
        if (dividendLowerThan) params.append('dividendLowerThan', dividendLowerThan);
        if (isETF !== undefined) params.append('isETF', isETF);
        if (isActivelyTrading !== undefined) params.append('isActivelyTrading', isActivelyTrading);
        if (sector) params.append('sector', sector);
        if (industry) params.append('industry', industry);
        if (country) params.append('country', country);
        if (exchange) params.append('exchange', exchange);

        const screenerUrl = `${FMP_BASE}/stock-screener?${params.toString()}`;
        console.log(` FMP Stock Screener query: ${screenerUrl.replace(FMP_KEY, '***')}`);

        const screenerRes = await fetch(screenerUrl);

        if (!screenerRes.ok) {
            const errorText = await screenerRes.text();
            console.error(` FMP Stock Screener error: ${screenerRes.status} - ${errorText.substring(0, 200)}`);
            
            //  FIX: Gerer les erreurs avec codes HTTP appropries
            let statusCode = screenerRes.status;
            let errorType = 'FMP Stock Screener failed';
            
            if (screenerRes.status === 401 || screenerRes.status === 403) {
                errorType = 'FMP API key invalid';
            } else if (screenerRes.status === 402) {
                errorType = 'FMP endpoint requires paid subscription';
            } else if (screenerRes.status === 429) {
                errorType = 'FMP rate limit exceeded';
            } else if (screenerRes.status >= 500) {
                statusCode = 503; // Service unavailable au lieu de 500
                errorType = 'FMP service temporarily unavailable';
            }
            
            return res.status(statusCode).json({
                error: errorType,
                message: errorText.substring(0, 200),
                status: screenerRes.status,
                suggestion: statusCode === 401 
                    ? 'Verifiez FMP_API_KEY dans Vercel'
                    : statusCode === 402
                    ? 'Cet endpoint necessite un abonnement FMP payant'
                    : statusCode === 429
                    ? 'Limite de requetes atteinte. Reessayez plus tard.'
                    : 'Service temporairement indisponible',
                timestamp: new Date().toISOString()
            });
        }

        const screenerData = await screenerRes.json();

        // Verifier si c'est un objet d'erreur
        if (screenerData && typeof screenerData === 'object' && !Array.isArray(screenerData)) {
            if (screenerData['Error Message']) {
                console.error(` FMP Stock Screener Error: ${screenerData['Error Message']}`);
                return res.status(400).json({
                    error: 'FMP Stock Screener error',
                    message: screenerData['Error Message']
                });
            }
        }

        // Verifier que c'est un tableau valide
        if (!Array.isArray(screenerData)) {
            console.error(` FMP Stock Screener returned invalid data type`);
            return res.status(500).json({
                error: 'Invalid response format',
                message: 'FMP Stock Screener returned invalid data'
            });
        }

        // Formater les resultats
        const formattedResults = screenerData.map(stock => ({
            symbol: stock.symbol,
            name: stock.companyName || stock.name || '',
            marketCap: stock.marketCap || 0,
            price: stock.price || 0,
            beta: stock.beta || null,
            volume: stock.volume || 0,
            dividend: stock.dividend || 0,
            dividendYield: stock.dividendYield || 0,
            pe: stock.pe || null,
            priceToBook: stock.priceToBook || null,
            priceToSales: stock.priceToSales || null,
            sector: stock.sector || '',
            industry: stock.industry || '',
            country: stock.country || '',
            exchange: stock.exchangeShortName || stock.exchange || '',
            currency: stock.currency || 'USD',
            isETF: stock.isETF || false,
            isActivelyTrading: stock.isActivelyTrading !== undefined ? stock.isActivelyTrading : true
        }));

        console.log(` FMP Stock Screener found ${formattedResults.length} stocks matching criteria`);

        return res.status(200).json({
            results: formattedResults,
            count: formattedResults.length,
            criteria: {
                marketCapMoreThan,
                marketCapLowerThan,
                priceMoreThan,
                priceLowerThan,
                betaMoreThan,
                betaLowerThan,
                volumeMoreThan,
                volumeLowerThan,
                dividendMoreThan,
                dividendLowerThan,
                isETF,
                isActivelyTrading,
                sector,
                industry,
                country,
                exchange
            }
        });

    } catch (error) {
        console.error('FMP Stock Screener error:', error);
        return res.status(500).json({
            error: 'Failed to screen stocks',
            message: error.message
        });
    }
}













