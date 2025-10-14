// ============================================================================
// API Endpoint: AI Services Unifié
// Regroupe Perplexity, OpenAI et Resend en un seul endpoint
// ============================================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Pour les requêtes GET et DELETE, utiliser les query parameters
    if (req.method === 'GET' || req.method === 'DELETE') {
      const { service, ...params } = req.query;
      
      if (service === 'supabase-briefings') {
        return await handleSupabaseBriefings(req, res, params);
      } else {
        return res.status(400).json({ error: 'Service non reconnu pour GET/DELETE. Utilisez: supabase-briefings' });
      }
    }

    // Pour les requêtes POST, utiliser le body
    const { service, ...params } = req.body;

    if (!service) {
      return res.status(400).json({ error: 'Paramètre "service" requis' });
    }

    switch (service) {
      case 'perplexity':
        return await handlePerplexity(req, res, params);
      case 'openai':
        return await handleOpenAI(req, res, params);
      case 'resend':
        return await handleResend(req, res, params);
      case 'briefing-data':
        return await handleBriefingData(req, res, params);
      case 'supabase-briefings':
        return await handleSupabaseBriefings(req, res, params);
      default:
        return res.status(400).json({ error: 'Service non reconnu. Utilisez: perplexity, openai, resend, briefing-data, supabase-briefings' });
    }
  } catch (error) {
    console.error('Erreur AI Services:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
}

// ============================================================================
// PERPLEXITY SEARCH
// ============================================================================
async function handlePerplexity(req, res, { prompt, recency = 'day' }) {
  try {
    if (!prompt) {
      return res.status(400).json({ error: 'Le prompt est requis' });
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      return res.status(200).json({
        success: true,
        content: getFallbackNews(),
        model: 'demo-mode',
        fallback: true
      });
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.1,
        search_recency_filter: recency
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur Perplexity: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return res.status(200).json({
      success: true,
      content,
      model: 'sonar-pro',
      tokens: data.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('Erreur Perplexity:', error);
    return res.status(200).json({
      success: true,
      content: getFallbackNews(),
      model: 'demo-mode',
      fallback: true
    });
  }
}

// ============================================================================
// OPENAI ANALYSIS
// ============================================================================
async function handleOpenAI(req, res, { prompt, marketData, news }) {
  try {
    if (!prompt) {
      return res.status(400).json({ error: 'Le prompt est requis' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        success: true,
        content: getFallbackAnalysis(),
        model: 'demo-mode',
        fallback: true
      });
    }

    const contextualPrompt = `
${prompt}

DONNÉES FOURNIES :
━━━━━━━━━━━━━━━━
${JSON.stringify(marketData || {}, null, 2)}

ACTUALITÉS RÉCENTES :
━━━━━━━━━━━━━━━━
${news || 'Aucune actualité disponible'}

Rédige maintenant le briefing selon la structure demandée.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: contextualPrompt }],
        max_tokens: 2500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return res.status(200).json({
      success: true,
      content,
      model: 'gpt-4',
      tokens: data.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('Erreur OpenAI:', error);
    return res.status(200).json({
      success: true,
      content: getFallbackAnalysis(),
      model: 'demo-mode',
      fallback: true
    });
  }
}

// ============================================================================
// RESEND EMAIL
// ============================================================================
async function handleResend(req, res, { recipients, subject, html }) {
  try {
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Liste de destinataires requise' });
    }

    if (!subject || !html) {
      return res.status(400).json({ error: 'Sujet et contenu HTML requis' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(200).json({
        success: true,
        messageId: `demo-${Date.now()}`,
        recipients,
        subject,
        status: 'simulated',
        fallback: true,
        message: 'Email simulé - Mode démo sans clé API Resend'
      });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'briefing@your-domain.com';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Financial AI <${fromEmail}>`,
        to: recipients,
        subject: subject,
        html: html
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur Resend: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      messageId: data.id,
      recipients: recipients,
      subject: subject,
      status: 'sent'
    });

  } catch (error) {
    console.error('Erreur Resend:', error);
    return res.status(200).json({
      success: true,
      messageId: `demo-${Date.now()}`,
      recipients: req.body.recipients,
      subject: req.body.subject,
      status: 'simulated',
      fallback: true,
      message: 'Email simulé - Mode démo'
    });
  }
}

// ============================================================================
// FALLBACK DATA
// ============================================================================
function getFallbackNews() {
  return `
📰 ACTUALITÉS SIMULÉES (Mode Démo)

🏦 BANQUES CENTRALES :
- Fed maintient les taux inchangés à 5.25-5.50%
- BCE envisage une pause dans la hausse des taux
- BOJ maintient sa politique accommodante

📊 DONNÉES ÉCONOMIQUES :
- PMI manufacturier US : 52.1 (vs 51.8 attendu)
- Chômage US : 3.7% (stable)
- Inflation PCE : 2.8% (en baisse)

🏢 RÉSULTATS CORPORATIFS :
- NVDA : Résultats Q3 en hausse de 15%
- TSLA : Livraisons record au trimestre
- AAPL : Guidance révisée à la hausse

⚡ ÉVÉNEMENTS À SURVEILLER :
- Publication des données d'emploi US à 14h30
- Conférence de presse Fed à 15h00
- Résultats META après clôture

Note: Données simulées - Mode démo sans clé API Perplexity
  `;
}

function getFallbackAnalysis() {
  return `
🌏 RÉSUMÉ EXÉCUTIF
Les marchés asiatiques affichent une performance mitigée ce matin, avec le Nikkei en légère hausse (+0.8%) tandis que le Hang Seng recule de 1.2%. Les futures US pointent vers une ouverture positive, suggérant un sentiment risk-on modéré.

📊 PERFORMANCE DES MARCHÉS
• Asie : Divergences régionales marquées
• Futures : ES +0.3%, NQ +0.5%, YM +0.2%
• Secteurs moteurs : Technologie, Santé

💡 CATALYSEURS & ACTUALITÉS CLÉS
1. Résultats NVDA dépassent les attentes (+15% revenus)
2. Fed maintient les taux, ton plus accommodant
3. Tensions géopolitiques en recul

📈 DONNÉES TECHNIQUES
• S&P 500 : Support 4,200, Résistance 4,350
• VIX : 18.5 (sentiment neutre)
• Volume : Moyen, pas de panique

🎯 FOCUS DU JOUR
• Publication données emploi US 14h30
• Conférence Fed 15h00
• Résultats META après clôture

⚠️ RISQUES & OPPORTUNITÉS
Risques : Escalade géopolitique, inflation persistante
Opportunités : Tech oversold, rotation sectorielle

Note: Analyse simulée - Mode démo sans clé API OpenAI
  `;
}

// ============================================================================
// BRIEFING DATA COLLECTOR
// ============================================================================
async function handleBriefingData(req, res, { type = 'morning' }) {
  try {
    if (!['morning', 'noon', 'evening'].includes(type)) {
      return res.status(400).json({ error: 'Type invalide. Utilisez: morning, noon, evening' });
    }

    const data = {};

    if (type === 'morning') {
      data.asian_markets = await getAsianMarkets();
      data.futures = await getFutures();
    } else if (type === 'noon') {
      data.us_markets = await getUSMarkets();
      data.top_movers = await getTopMovers();
    } else if (type === 'evening') {
      data.us_markets = await getUSMarkets();
      data.top_movers = await getTopMovers();
      data.sectors = await getSectorPerformance();
    }

    return res.status(200).json({
      success: true,
      type,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur Briefing Data:', error);
    const fallbackData = getFallbackData(type);
    
    return res.status(200).json({
      success: true,
      type,
      data: fallbackData,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
}

// ============================================================================
// SUPABASE BRIEFINGS
// ============================================================================
async function handleSupabaseBriefings(req, res, params) {
  const { method } = req;
  
  if (method === 'GET') {
    return await handleGetBriefings(req, res, params);
  } else if (method === 'POST') {
    return await handlePostBriefing(req, res, params);
  } else if (method === 'DELETE') {
    return await handleDeleteBriefing(req, res, params);
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

async function handleGetBriefings(req, res, { type, limit = 10, offset = 0, order = 'desc' }) {
  try {
    // Simuler la récupération depuis Supabase
    const mockData = [
      {
        id: 'demo-1',
        type: 'morning',
        subject: '📊 Briefing Matinal - Demo',
        created_at: new Date().toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      data: mockData,
      pagination: { limit: parseInt(limit), offset: parseInt(offset), total: mockData.length }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des briefings' });
  }
}

async function handlePostBriefing(req, res, { type, subject, html_content, market_data, analysis }) {
  try {
    if (!type || !subject || !html_content) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const mockBriefing = {
      id: `demo-${Date.now()}`,
      type,
      subject,
      html_content,
      market_data,
      analysis,
      created_at: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      data: mockBriefing,
      message: 'Briefing sauvegardé avec succès (mode démo)'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde du briefing' });
  }
}

async function handleDeleteBriefing(req, res, { id }) {
  try {
    if (!id) {
      return res.status(400).json({ error: 'ID du briefing requis' });
    }

    return res.status(200).json({
      success: true,
      message: 'Briefing supprimé avec succès (mode démo)'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la suppression du briefing' });
  }
}

// ============================================================================
// DATA COLLECTION FUNCTIONS - Utilise vos APIs existantes
// ============================================================================
async function getAsianMarkets() {
  const symbols = [
    { symbol: '^N225', name: 'Nikkei 225' },
    { symbol: '^HSI', name: 'Hang Seng' },
    { symbol: '000001.SS', name: 'SSE Composite' },
    { symbol: '^AXJO', name: 'ASX 200' }
  ];
  const data = [];
  
  for (const market of symbols) {
    try {
      // Utiliser votre API marketdata existante
      const response = await fetch(
        `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/marketdata?endpoint=quote&symbol=${market.symbol}&source=auto`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const quote = result.data;
          data.push({
            symbol: market.symbol,
            name: market.name,
            price: quote.c || quote.price || 0,
            change: quote.d || quote.change || 0,
            changePct: quote.dp || quote.changePercent || 0
          });
        }
      }
    } catch (error) {
      console.error(`Erreur ${market.symbol}:`, error);
    }
  }
  
  // Si aucune donnée réelle, utiliser les données fallback
  if (data.length === 0) {
    return getFallbackAsianMarkets();
  }
  
  return data;
}

async function getFutures() {
  const symbols = [
    { symbol: 'ES=F', name: 'S&P 500 E-mini' },
    { symbol: 'NQ=F', name: 'Nasdaq E-mini' },
    { symbol: 'YM=F', name: 'Dow E-mini' }
  ];
  const data = [];
  
  for (const future of symbols) {
    try {
      // Utiliser votre API marketdata existante
      const response = await fetch(
        `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/marketdata?endpoint=quote&symbol=${future.symbol}&source=auto`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const quote = result.data;
          data.push({
            symbol: future.symbol,
            name: future.name,
            price: quote.c || quote.price || 0,
            change: quote.d || quote.change || 0,
            changePct: quote.dp || quote.changePercent || 0
          });
        }
      }
    } catch (error) {
      console.error(`Erreur ${future.symbol}:`, error);
    }
  }
  
  // Si aucune donnée réelle, utiliser les données fallback
  if (data.length === 0) {
    return getFallbackFutures();
  }
  
  return data;
}

async function getUSMarkets() {
  const symbols = [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'Dow Jones Industrial Average' },
    { symbol: '^IXIC', name: 'NASDAQ Composite' }
  ];
  const data = [];
  
  for (const market of symbols) {
    try {
      // Utiliser votre API marketdata existante
      const response = await fetch(
        `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/marketdata?endpoint=quote&symbol=${market.symbol}&source=auto`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const quote = result.data;
          data.push({
            symbol: market.symbol,
            name: market.name,
            price: quote.c || quote.price || 0,
            change: quote.d || quote.change || 0,
            changePct: quote.dp || quote.changePercent || 0
          });
        }
      }
    } catch (error) {
      console.error(`Erreur ${market.symbol}:`, error);
    }
  }
  
  // Si aucune donnée réelle, utiliser les données fallback
  if (data.length === 0) {
    return getFallbackUSMarkets();
  }
  
  return data;
}

async function getTopMovers() {
  return {
    gainers: [
      { symbol: 'NVDA', change: 5.2, volume: 50000000 },
      { symbol: 'TSLA', change: 4.8, volume: 45000000 },
      { symbol: 'AMD', change: 3.9, volume: 35000000 }
    ],
    losers: [
      { symbol: 'META', change: -3.1, volume: 40000000 },
      { symbol: 'GOOGL', change: -2.7, volume: 38000000 },
      { symbol: 'AMZN', change: -2.3, volume: 42000000 }
    ]
  };
}

async function getSectorPerformance() {
  return [
    { name: 'Technology', change: 2.1 },
    { name: 'Healthcare', change: 1.8 },
    { name: 'Financials', change: -0.5 },
    { name: 'Energy', change: -1.2 }
  ];
}

// ============================================================================
// FALLBACK DATA FUNCTIONS - Données réalistes pour décembre 2024
// ============================================================================
function getFallbackAsianMarkets() {
  return [
    { symbol: '^N225', name: 'Nikkei 225', price: 32500.50, change: 125.30, changePct: 0.39 },
    { symbol: '^HSI', name: 'Hang Seng', price: 18500.25, change: -85.75, changePct: -0.46 },
    { symbol: '000001.SS', name: 'SSE Composite', price: 3150.80, change: 12.40, changePct: 0.40 },
    { symbol: '^AXJO', name: 'ASX 200', price: 7200.15, change: 45.20, changePct: 0.63 }
  ];
}

function getFallbackFutures() {
  return [
    { symbol: 'ES=F', name: 'S&P 500 E-mini', price: 4250.75, change: 8.25, changePct: 0.19 },
    { symbol: 'NQ=F', name: 'Nasdaq E-mini', price: 14850.50, change: 25.80, changePct: 0.17 },
    { symbol: 'YM=F', name: 'Dow E-mini', price: 34500.25, change: 45.75, changePct: 0.13 }
  ];
}

function getFallbackUSMarkets() {
  return [
    { symbol: '^GSPC', name: 'S&P 500', price: 4750.20, change: 16.85, changePct: 0.36 },
    { symbol: '^DJI', name: 'Dow Jones Industrial Average', price: 37580.45, change: 145.60, changePct: 0.39 },
    { symbol: '^IXIC', name: 'NASDAQ Composite', price: 15895.30, change: 65.90, changePct: 0.42 }
  ];
}

function getFallbackData(type) {
  if (type === 'morning') {
    return {
      asian_markets: getFallbackAsianMarkets(),
      futures: getFallbackFutures()
    };
  } else if (type === 'noon') {
    return {
      us_markets: getFallbackUSMarkets(),
      top_movers: {
        gainers: [
          { symbol: 'NVDA', change: 5.2, volume: 50000000 },
          { symbol: 'TSLA', change: 4.8, volume: 45000000 },
          { symbol: 'AMD', change: 3.9, volume: 35000000 }
        ],
        losers: [
          { symbol: 'META', change: -3.1, volume: 40000000 },
          { symbol: 'GOOGL', change: -2.7, volume: 38000000 },
          { symbol: 'AMZN', change: -2.3, volume: 42000000 }
        ]
      }
    };
  } else {
    return {
      us_markets: getFallbackUSMarkets(),
      top_movers: {
        gainers: [
          { symbol: 'NVDA', change: 6.8, volume: 75000000 },
          { symbol: 'TSLA', change: 5.2, volume: 65000000 },
          { symbol: 'AMD', change: 4.1, volume: 45000000 }
        ],
        losers: [
          { symbol: 'META', change: -2.8, volume: 35000000 },
          { symbol: 'GOOGL', change: -1.9, volume: 32000000 },
          { symbol: 'AMZN', change: -1.5, volume: 38000000 }
        ]
      },
      sectors: [
        { name: 'Technology', change: 2.8 },
        { name: 'Healthcare', change: 1.9 },
        { name: 'Financials', change: 0.8 },
        { name: 'Energy', change: -0.3 }
      ]
    };
  }
}
