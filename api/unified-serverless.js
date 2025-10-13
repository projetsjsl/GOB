/**
 * API Unifiée Serverless - Version simplifiée
 * Regroupe toutes les fonctionnalités en une seule API
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint, action, symbol, dataType, timeframe, limit, source, ...otherParams } = req.query;

  if (!endpoint) {
    return res.status(400).json({ 
      error: 'Paramètre endpoint requis',
      availableEndpoints: [
        'fmp', 'marketdata', 'marketaux', 'news', 'hybrid-data',
        'claude', 'gemini-chat', 'github-update', 'unified-data'
      ]
    });
  }

  try {
    console.log(`🔄 API Unifiée - ${endpoint} ${action || ''} ${symbol || ''}`);

    switch (endpoint) {
      case 'fmp':
        return await handleFMP(req, res, symbol, action, timeframe, limit);
      
      case 'marketdata':
        return await handleMarketData(req, res, symbol, source);
      
      case 'marketaux':
        return await handleMarketaux(req, res, symbol, limit);
      
      case 'news':
        return await handleNews(req, res, symbol, limit);
      
      case 'hybrid-data':
        return await handleHybridData(req, res, symbol, dataType);
      
      case 'claude':
        return await handleClaude(req, res, otherParams);
      
      case 'gemini-chat':
        return await handleGeminiChat(req, res, otherParams);
      
      case 'github-update':
        return await handleGithubUpdate(req, res, otherParams);
      
      case 'unified-data':
        return await handleUnifiedData(req, res, symbol, action);
      
      case 'test-env':
        return await handleTestEnv(req, res);
      
      default:
        return res.status(400).json({ 
          error: `Endpoint '${endpoint}' non supporté`,
          availableEndpoints: [
            'fmp', 'marketdata', 'marketaux', 'news', 'hybrid-data',
            'claude', 'gemini-chat', 'github-update', 'unified-data'
          ]
        });
    }

  } catch (error) {
    console.error(`❌ Erreur API unifiée (${endpoint}):`, error);
    return res.status(500).json({
      error: `Erreur ${endpoint}`,
      details: error.message
    });
  }
}

// ============================================
// HANDLERS POUR CHAQUE ENDPOINT
// ============================================

// FMP API Handler
async function handleFMP(req, res, symbol, action, timeframe, limit) {
  if (!action) {
    return res.status(400).json({ error: 'Paramètre action requis pour FMP' });
  }

  try {
    const { getQuote, getCompanyProfile, getFinancialRatiosTTM, getHistoricalChart } = await import('./fmp.js');
    
    let result;
    switch (action) {
      case 'quote':
        if (!symbol) return res.status(400).json({ error: 'Symbol requis' });
        result = await getQuote(symbol);
        break;
      case 'profile':
        if (!symbol) return res.status(400).json({ error: 'Symbol requis' });
        result = await getCompanyProfile(symbol);
        break;
      case 'ratios':
        if (!symbol) return res.status(400).json({ error: 'Symbol requis' });
        result = await getFinancialRatiosTTM(symbol);
        break;
      case 'historical-chart':
        if (!symbol) return res.status(400).json({ error: 'Symbol requis' });
        result = await getHistoricalChart(symbol, timeframe || '1day', parseInt(limit) || 100);
        break;
      default:
        return res.status(400).json({ error: `Action FMP '${action}' non supportée` });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Erreur FMP:', error);
    return res.status(500).json({ error: 'Erreur FMP', details: error.message });
  }
}

// Market Data Handler (simplifié)
async function handleMarketData(req, res, symbol, source) {
  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    // Utiliser directement FMP pour les données de marché
    const { getQuote } = await import('./fmp.js');
    const result = await getQuote(symbol);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Erreur Market Data:', error);
    return res.status(500).json({ error: 'Erreur Market Data', details: error.message });
  }
}

// Marketaux Handler (simulé)
async function handleMarketaux(req, res, symbol, limit) {
  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    // Simulation des données Marketaux
    const result = {
      symbol,
      news: [],
      sentimentAnalysis: {
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
        overallSentiment: 'neutral'
      },
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Erreur Marketaux:', error);
    return res.status(500).json({ error: 'Erreur Marketaux', details: error.message });
  }
}

// News Handler (simulé)
async function handleNews(req, res, symbol, limit) {
  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    // Simulation des actualités
    const result = {
      symbol,
      articles: [],
      total: 0,
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Erreur News:', error);
    return res.status(500).json({ error: 'Erreur News', details: error.message });
  }
}

// Hybrid Data Handler
async function handleHybridData(req, res, symbol, dataType) {
  if (!symbol || !dataType) {
    return res.status(400).json({ error: 'Paramètres symbol et dataType requis' });
  }

  try {
    console.log(`🔄 API Hybride - ${dataType} pour ${symbol}`);

    // Récupérer directement depuis FMP
    const { getQuote, getCompanyProfile, getFinancialRatiosTTM } = await import('./fmp.js');
    
    let externalData;
    switch (dataType) {
      case 'quote':
        externalData = await getQuote(symbol);
        break;
      case 'profile':
        externalData = await getCompanyProfile(symbol);
        break;
      case 'ratios':
        externalData = await getFinancialRatiosTTM(symbol);
        break;
      default:
        throw new Error(`Type de données non supporté: ${dataType}`);
    }
    
    return res.status(200).json({
      success: true,
      symbol,
      dataType,
      data: externalData,
      source: 'external',
      metadata: {
        confidence: 0.9,
        freshness: 'fresh',
        lastUpdated: new Date().toISOString(),
        syncPerformed: true
      }
    });

  } catch (error) {
    console.error(`❌ Erreur API hybride (${dataType}):`, error);
    return res.status(500).json({ 
      error: `Erreur lors de la récupération de ${dataType}`,
      details: error.message 
    });
  }
}

// Claude Handler
async function handleClaude(req, res, params) {
  try {
    const { default: claudeHandler } = await import('./claude.js');
    return await claudeHandler(req, res);
  } catch (error) {
    console.error('❌ Erreur Claude:', error);
    return res.status(500).json({ error: 'Erreur Claude', details: error.message });
  }
}

// Gemini Chat Handler
async function handleGeminiChat(req, res, params) {
  try {
    const { default: geminiHandler } = await import('./gemini/chat.js');
    return await geminiHandler(req, res);
  } catch (error) {
    console.error('❌ Erreur Gemini:', error);
    return res.status(500).json({ error: 'Erreur Gemini', details: error.message });
  }
}

// Github Update Handler
async function handleGithubUpdate(req, res, params) {
  try {
    const { default: githubHandler } = await import('./github-update.js');
    return await githubHandler(req, res);
  } catch (error) {
    console.error('❌ Erreur GitHub:', error);
    return res.status(500).json({ error: 'Erreur GitHub', details: error.message });
  }
}

// Unified Data Handler
async function handleUnifiedData(req, res, symbol, action) {
  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    const { getQuote, getCompanyProfile, getFinancialRatiosTTM } = await import('./fmp.js');
    
    // Récupérer toutes les données
    const [quote, profile, ratios] = await Promise.allSettled([
      getQuote(symbol),
      getCompanyProfile(symbol),
      getFinancialRatiosTTM(symbol)
    ]);
    
    const result = {
      symbol,
      quote: quote.status === 'fulfilled' ? quote.value : null,
      profile: profile.status === 'fulfilled' ? profile.value : null,
      ratios: ratios.status === 'fulfilled' ? ratios.value : null,
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json({
      success: true,
      symbol,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur unified data:', error);
    return res.status(500).json({
      error: 'Erreur unified data',
      details: error.message
    });
  }
}

// Test Environment Variables Handler
async function handleTestEnv(req, res) {
  try {
    const envVars = {
      FMP_API_KEY: process.env.FMP_API_KEY ? '✅ Configurée' : '❌ Manquante',
      MARKETAUX_API_KEY: process.env.MARKETAUX_API_KEY ? '✅ Configurée' : '❌ Manquante',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ Configurée' : '❌ Manquante',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Configurée' : '❌ Manquante',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ Configurée' : '❌ Manquante'
    };

    return res.status(200).json({
      success: true,
      message: 'Variables d\'environnement vérifiées',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur test env:', error);
    return res.status(500).json({
      error: 'Erreur test env',
      details: error.message
    });
  }
}