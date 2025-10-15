// ============================================================================
// API Health Check - Diagnostic complet des sources Emma En Direct
// ============================================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    console.log('🔍 Début diagnostic complet des APIs Emma En Direct');
    
    const startTime = Date.now();
    const healthReport = {
      timestamp: new Date().toISOString(),
      overall_status: 'checking',
      total_apis: 0,
      healthy_apis: 0,
      degraded_apis: 0,
      failed_apis: 0,
      response_time_ms: 0,
      apis: {}
    };

    // ============================================================================
    // DIAGNOSTIC PARALLÈLE DE TOUTES LES APIS
    // ============================================================================
    
    const apiTests = await Promise.allSettled([
      // 1. APIs Données Marché
      testYahooFinance(),
      testAlphaVantage(),
      testFMP(),
      testFinnhub(),
      
      // 2. APIs Nouvelles
      testPerplexity(),
      testMarketaux(),
      testTwelveData(),
      
      // 3. APIs IA
      testOpenAI(),
      testAnthropic(),
      
      // 4. APIs Email & Storage
      testResend(),
      testSupabase(),
      
      // 5. APIs Internes
      testMarketDataAPI(),
      testAIServicesAPI()
    ]);

    // ============================================================================
    // ANALYSE DES RÉSULTATS
    // ============================================================================
    
    apiTests.forEach((result, index) => {
      const apiName = getAPIName(index);
      
      if (result.status === 'fulfilled') {
        healthReport.apis[apiName] = result.value;
        healthReport.total_apis++;
        
        if (result.value.status === 'healthy') {
          healthReport.healthy_apis++;
        } else if (result.value.status === 'degraded') {
          healthReport.degraded_apis++;
        } else {
          healthReport.failed_apis++;
        }
      } else {
        healthReport.apis[apiName] = {
          status: 'failed',
          error: result.reason?.message || 'Erreur inconnue',
          response_time_ms: 0,
          last_check: new Date().toISOString()
        };
        healthReport.total_apis++;
        healthReport.failed_apis++;
      }
    });

    // ============================================================================
    // CALCUL DU STATUT GLOBAL
    // ============================================================================
    
    healthReport.response_time_ms = Date.now() - startTime;
    
    if (healthReport.failed_apis === 0 && healthReport.degraded_apis === 0) {
      healthReport.overall_status = 'healthy';
    } else if (healthReport.failed_apis <= 2) {
      healthReport.overall_status = 'degraded';
    } else {
      healthReport.overall_status = 'unhealthy';
    }

    // ============================================================================
    // RECOMMANDATIONS
    // ============================================================================
    
    healthReport.recommendations = generateRecommendations(healthReport);
    healthReport.summary = generateSummary(healthReport);

    console.log(`✅ Diagnostic terminé en ${healthReport.response_time_ms}ms - Status: ${healthReport.overall_status}`);
    
    return res.status(200).json({
      success: true,
      health: healthReport
    });
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// ============================================================================
// FONCTIONS DE TEST DES APIS
// ============================================================================

async function testYahooFinance() {
  const startTime = Date.now();
  try {
    // Test avec un symbole simple
    const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/AAPL', {
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasData = data.chart && data.chart.result && data.chart.result.length > 0;
    
    return {
      status: hasData ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Yahoo Finance API',
        has_data: hasData,
        symbol_tested: 'AAPL',
        rate_limit: 'Unlimited (free)',
        reliability: 'High'
      },
      error: hasData ? null : 'Données manquantes dans la réponse'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Yahoo Finance API',
        rate_limit: 'Unlimited (free)',
        reliability: 'High'
      }
    };
  }
}

async function testAlphaVantage() {
  const startTime = Date.now();
  try {
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      throw new Error('Clé API manquante');
    }
    
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`, {
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasData = data['Global Quote'] && data['Global Quote']['01. symbol'];
    
    return {
      status: hasData ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Alpha Vantage API',
        has_data: hasData,
        symbol_tested: 'AAPL',
        rate_limit: '500 calls/day (free)',
        reliability: 'Medium'
      },
      error: hasData ? null : 'Données manquantes ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Alpha Vantage API',
        rate_limit: '500 calls/day (free)',
        reliability: 'Medium'
      }
    };
  }
}

async function testFMP() {
  const startTime = Date.now();
  try {
    if (!process.env.FMP_API_KEY) {
      throw new Error('Clé API manquante');
    }
    
    const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${process.env.FMP_API_KEY}`, {
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasData = Array.isArray(data) && data.length > 0 && data[0].symbol;
    
    return {
      status: hasData ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Financial Modeling Prep API',
        has_data: hasData,
        symbol_tested: 'AAPL',
        rate_limit: '250 calls/day (free)',
        reliability: 'High'
      },
      error: hasData ? null : 'Données manquantes ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Financial Modeling Prep API',
        rate_limit: '250 calls/day (free)',
        reliability: 'High'
      }
    };
  }
}

async function testFinnhub() {
  const startTime = Date.now();
  try {
    if (!process.env.FINNHUB_API_KEY) {
      throw new Error('Clé API manquante');
    }
    
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${process.env.FINNHUB_API_KEY}`, {
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasData = data.c && data.c > 0; // current price exists and > 0
    
    return {
      status: hasData ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Finnhub API',
        has_data: hasData,
        symbol_tested: 'AAPL',
        rate_limit: '60 calls/minute (free)',
        reliability: 'High'
      },
      error: hasData ? null : 'Données manquantes ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Finnhub API',
        rate_limit: '60 calls/minute (free)',
        reliability: 'High'
      }
    };
  }
}

async function testPerplexity() {
  const startTime = Date.now();
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('Clé API manquante');
    }
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: 'Test connection - respond with "OK"' }],
        max_tokens: 10
      }),
      timeout: 15000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasResponse = data.choices && data.choices.length > 0;
    
    return {
      status: hasResponse ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Perplexity AI API',
        has_response: hasResponse,
        model_tested: 'llama-3.1-sonar-small-128k-online',
        rate_limit: '20 calls/day (free)',
        reliability: 'High'
      },
      error: hasResponse ? null : 'Réponse manquante ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Perplexity AI API',
        rate_limit: '20 calls/day (free)',
        reliability: 'High'
      }
    };
  }
}

async function testMarketaux() {
  const startTime = Date.now();
  try {
    if (!process.env.MARKETAUX_API_KEY) {
      throw new Error('Clé API manquante');
    }
    
    const response = await fetch(`https://api.marketaux.com/v1/news/all?api_token=${process.env.MARKETAUX_API_KEY}&limit=1`, {
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasData = data.data && Array.isArray(data.data) && data.data.length > 0;
    
    return {
      status: hasData ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Marketaux News API',
        has_data: hasData,
        rate_limit: '1000 calls/month (free)',
        reliability: 'Medium'
      },
      error: hasData ? null : 'Données manquantes ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Marketaux News API',
        rate_limit: '1000 calls/month (free)',
        reliability: 'Medium'
      }
    };
  }
}

async function testTwelveData() {
  const startTime = Date.now();
  try {
    if (!process.env.TWELVE_DATA_API_KEY) {
      throw new Error('Clé API manquante');
    }
    
    const response = await fetch(`https://api.twelvedata.com/time_series?symbol=AAPL&interval=1day&outputsize=1&apikey=${process.env.TWELVE_DATA_API_KEY}`, {
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasData = data.values && Array.isArray(data.values) && data.values.length > 0;
    
    return {
      status: hasData ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Twelve Data API',
        has_data: hasData,
        symbol_tested: 'AAPL',
        rate_limit: '800 calls/day (free)',
        reliability: 'High'
      },
      error: hasData ? null : 'Données manquantes ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Twelve Data API',
        rate_limit: '800 calls/day (free)',
        reliability: 'High'
      }
    };
  }
}

async function testOpenAI() {
  const startTime = Date.now();
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Clé API manquante');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      }),
      timeout: 15000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasResponse = data.choices && data.choices.length > 0;
    
    return {
      status: hasResponse ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'OpenAI API',
        has_response: hasResponse,
        model_tested: 'gpt-4',
        rate_limit: 'Pay per use',
        reliability: 'High'
      },
      error: hasResponse ? null : 'Réponse manquante ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'OpenAI API',
        rate_limit: 'Pay per use',
        reliability: 'High'
      }
    };
  }
}

async function testAnthropic() {
  const startTime = Date.now();
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Clé API manquante');
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Test' }]
      }),
      timeout: 15000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasResponse = data.content && data.content.length > 0;
    
    return {
      status: hasResponse ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Anthropic Claude API',
        has_response: hasResponse,
        model_tested: 'claude-3-sonnet-20240229',
        rate_limit: 'Pay per use',
        reliability: 'High'
      },
      error: hasResponse ? null : 'Réponse manquante ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Anthropic Claude API',
        rate_limit: 'Pay per use',
        reliability: 'High'
      }
    };
  }
}

async function testResend() {
  const startTime = Date.now();
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Clé API manquante');
    }
    
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasData = Array.isArray(data.data);
    
    return {
      status: hasData ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Resend Email API',
        has_data: hasData,
        rate_limit: '3000 emails/month (free)',
        reliability: 'High'
      },
      error: hasData ? null : 'Données manquantes ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Resend Email API',
        rate_limit: '3000 emails/month (free)',
        reliability: 'High'
      }
    };
  }
}

async function testSupabase() {
  const startTime = Date.now();
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Configuration Supabase manquante');
    }
    
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return {
      status: 'healthy',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Supabase Database',
        connection: 'OK',
        rate_limit: 'Unlimited',
        reliability: 'High'
      },
      error: null
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Supabase Database',
        rate_limit: 'Unlimited',
        reliability: 'High'
      }
    };
  }
}

async function testMarketDataAPI() {
  const startTime = Date.now();
  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/marketdata?symbols=AAPL`, {
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasData = data.success && data.data && data.data.length > 0;
    
    return {
      status: hasData ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Internal MarketData API',
        has_data: hasData,
        symbol_tested: 'AAPL',
        reliability: 'High'
      },
      error: hasData ? null : 'Données manquantes ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Internal MarketData API',
        reliability: 'High'
      }
    };
  }
}

async function testAIServicesAPI() {
  const startTime = Date.now();
  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ai-services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'yield-curves' }),
      timeout: 15000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const hasData = data.success && data.data;
    
    return {
      status: hasData ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        endpoint: 'Internal AI Services API',
        has_data: hasData,
        service_tested: 'yield-curves',
        reliability: 'High'
      },
      error: hasData ? null : 'Données manquantes ou erreur API'
    };
  } catch (error) {
    return {
      status: 'failed',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message,
      details: {
        endpoint: 'Internal AI Services API',
        reliability: 'High'
      }
    };
  }
}

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

function getAPIName(index) {
  const names = [
    'yahoo_finance',
    'alpha_vantage', 
    'fmp',
    'finnhub',
    'perplexity',
    'marketaux',
    'twelve_data',
    'openai',
    'anthropic',
    'resend',
    'supabase',
    'marketdata_api',
    'ai_services_api'
  ];
  return names[index] || `api_${index}`;
}

function generateRecommendations(healthReport) {
  const recommendations = [];
  
  // Analyser les APIs en échec
  Object.entries(healthReport.apis).forEach(([name, api]) => {
    if (api.status === 'failed') {
      if (name === 'yahoo_finance') {
        recommendations.push({
          priority: 'high',
          category: 'market_data',
          message: 'Yahoo Finance en échec - Utiliser les fallbacks ou APIs alternatives (Alpha Vantage, FMP)',
          action: 'Vérifier la connectivité réseau et les rate limits'
        });
      } else if (name === 'openai' && name === 'anthropic') {
        recommendations.push({
          priority: 'critical',
          category: 'ai_analysis',
          message: 'Toutes les APIs IA en échec - Les briefings ne pourront pas être générés',
          action: 'Vérifier les clés API OpenAI et Anthropic'
        });
      } else if (name === 'perplexity') {
        recommendations.push({
          priority: 'medium',
          category: 'news',
          message: 'Perplexity en échec - Utiliser Marketaux ou Twelve Data pour les actualités',
          action: 'Vérifier la clé API Perplexity'
        });
      }
    }
  });
  
  // Recommandations générales
  if (healthReport.failed_apis > 3) {
    recommendations.push({
      priority: 'high',
      category: 'general',
      message: 'Trop d\'APIs en échec - Vérifier la connectivité générale',
      action: 'Redémarrer les services ou vérifier les rate limits'
    });
  }
  
  if (healthReport.response_time_ms > 30000) {
    recommendations.push({
      priority: 'medium',
      category: 'performance',
      message: 'Temps de réponse élevé - Optimiser les timeouts',
      action: 'Réduire les timeouts ou implémenter un cache'
    });
  }
  
  return recommendations;
}

function generateSummary(healthReport) {
  const healthyCount = healthReport.healthy_apis;
  const totalCount = healthReport.total_apis;
  const percentage = Math.round((healthyCount / totalCount) * 100);
  
  let status = '🟢 Excellent';
  if (percentage < 80) status = '🟡 Dégradé';
  if (percentage < 60) status = '🔴 Critique';
  
  return {
    status,
    healthy_percentage: percentage,
    message: `${healthyCount}/${totalCount} APIs opérationnelles (${percentage}%)`,
    response_time: `${healthReport.response_time_ms}ms`,
    recommendation: healthReport.overall_status === 'healthy' 
      ? 'Toutes les APIs fonctionnent correctement' 
      : 'Vérifier les APIs en échec pour assurer la fiabilité des briefings'
  };
}
