// API de fallback pour les données financières
export default async function handler(req, res) {
    const { type, symbol, limit = 10 } = req.query;
    
    // Données de fallback pour différents types
    const fallbackData = {
        stocks: {
            'CVS': {
                symbol: 'CVS',
                name: 'CVS Health Corporation',
                price: 78.45,
                change: 1.23,
                changePercent: 1.59,
                volume: 4500000,
                marketCap: 100000000000,
                pe: 12.5,
                sector: 'Healthcare Services',
                industry: 'Healthcare',
                description: 'CVS Health Corporation operates as a health services company in the United States.',
                website: 'https://www.cvshealth.com',
                logo: 'https://logo.clearbit.com/cvshealth.com',
                lastUpdate: new Date().toISOString()
            },
            'MSFT': {
                symbol: 'MSFT',
                name: 'Microsoft Corporation',
                price: 378.85,
                change: -2.15,
                changePercent: -0.56,
                volume: 25000000,
                marketCap: 2800000000000,
                pe: 28.5,
                sector: 'Technology',
                industry: 'Software',
                description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
                website: 'https://www.microsoft.com',
                logo: 'https://logo.clearbit.com/microsoft.com',
                lastUpdate: new Date().toISOString()
            },
            'AAPL': {
                symbol: 'AAPL',
                name: 'Apple Inc.',
                price: 175.43,
                change: 0.87,
                changePercent: 0.50,
                volume: 45000000,
                marketCap: 2700000000000,
                pe: 25.8,
                sector: 'Technology',
                industry: 'Consumer Electronics',
                description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
                website: 'https://www.apple.com',
                logo: 'https://logo.clearbit.com/apple.com',
                lastUpdate: new Date().toISOString()
            },
            'GOOGL': {
                symbol: 'GOOGL',
                name: 'Alphabet Inc.',
                price: 142.50,
                change: 2.30,
                changePercent: 1.64,
                volume: 18000000,
                marketCap: 1800000000000,
                pe: 22.1,
                sector: 'Technology',
                industry: 'Internet',
                description: 'Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
                website: 'https://www.google.com',
                logo: 'https://logo.clearbit.com/google.com',
                lastUpdate: new Date().toISOString()
            },
            'AMZN': {
                symbol: 'AMZN',
                name: 'Amazon.com Inc.',
                price: 155.20,
                change: -1.80,
                changePercent: -1.15,
                volume: 32000000,
                marketCap: 1600000000000,
                pe: 45.2,
                sector: 'Consumer Discretionary',
                industry: 'E-commerce',
                description: 'Amazon.com Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.',
                website: 'https://www.amazon.com',
                logo: 'https://logo.clearbit.com/amazon.com',
                lastUpdate: new Date().toISOString()
            }
        },
        news: [
            {
                title: "Marché Boursier : Tendances Actuelles",
                description: "Le marché boursier affiche des signaux mixtes avec les actions technologiques en tête des gains.",
                url: "https://example.com/market-trends",
                publishedAt: new Date(Date.now() - 3600000).toISOString(),
                source: { name: "Financial Times" },
                urlToImage: null,
                content: "Analyse complète des tendances du marché boursier actuel...",
                sentiment: "positive"
            },
            {
                title: "Innovation Technologique : Nouvelles Opportunités",
                description: "Les entreprises technologiques continuent d'innover avec de nouveaux produits et services.",
                url: "https://example.com/tech-innovation",
                publishedAt: new Date(Date.now() - 7200000).toISOString(),
                source: { name: "TechCrunch" },
                urlToImage: null,
                content: "Les dernières innovations technologiques transforment les industries...",
                sentiment: "positive"
            },
            {
                title: "Secteur de la Santé : Défis et Opportunités",
                description: "Le secteur de la santé fait face à de nouveaux défis réglementaires et opportunités de croissance.",
                url: "https://example.com/healthcare-sector",
                publishedAt: new Date(Date.now() - 10800000).toISOString(),
                source: { name: "Healthcare Weekly" },
                urlToImage: null,
                content: "Analyse approfondie du secteur de la santé et de ses perspectives...",
                sentiment: "neutral"
            }
        ],
        market: {
            indices: [
                { name: 'S&P 500', value: 4567.89, change: 12.34, changePercent: 0.27 },
                { name: 'NASDAQ', value: 14234.56, change: -45.67, changePercent: -0.32 },
                { name: 'DOW JONES', value: 34567.89, change: 89.12, changePercent: 0.26 }
            ],
            sectors: [
                { name: 'Technology', performance: 2.5, trend: 'up' },
                { name: 'Healthcare', performance: -0.8, trend: 'down' },
                { name: 'Financials', performance: 1.2, trend: 'up' },
                { name: 'Energy', performance: 3.1, trend: 'up' }
            ],
            lastUpdate: new Date().toISOString()
        }
    };

    try {
        let result;
        
        switch (type) {
            case 'stock':
                if (symbol && fallbackData.stocks[symbol]) {
                    result = fallbackData.stocks[symbol];
                } else {
                    // Retourner toutes les actions si pas de symbole spécifique
                    result = Object.values(fallbackData.stocks).slice(0, limit);
                }
                break;
                
            case 'news':
                result = fallbackData.news.slice(0, limit);
                break;
                
            case 'market':
                result = fallbackData.market;
                break;
                
            case 'search':
                if (symbol) {
                    const searchResults = Object.values(fallbackData.stocks).filter(stock => 
                        stock.symbol.toLowerCase().includes(symbol.toLowerCase()) ||
                        stock.name.toLowerCase().includes(symbol.toLowerCase())
                    );
                    result = searchResults.slice(0, limit);
                } else {
                    result = [];
                }
                break;
                
            default:
                return res.status(400).json({
                    error: 'Type non supporté',
                    supportedTypes: ['stock', 'news', 'market', 'search'],
                    usage: 'Utilisez ?type=stock&symbol=AAPL ou ?type=news&limit=5'
                });
        }
        
        return res.status(200).json({
            data: result,
            type,
            symbol: symbol || 'all',
            timestamp: new Date().toISOString(),
            source: 'fallback',
            message: 'Données de fallback - APIs principales non disponibles'
        });
        
    } catch (error) {
        console.error('Erreur API Fallback:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des données de fallback',
            details: error.message
        });
    }
}
