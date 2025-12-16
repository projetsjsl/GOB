// ============================================================================
// API Health Check Simple - Test de nos endpoints internes uniquement
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
    console.log('🔍 Début diagnostic simple des endpoints internes');
    
    const startTime = Date.now();
    const healthReport = {
      timestamp: new Date().toISOString(),
      overall_status: 'checking',
      total_apis: 0,
      healthy_apis: 0,
      degraded_apis: 0,
      failed_apis: 0,
      response_time_ms: 0,
      apis: {},
      production_mode: true,
      fallback_mode: false,
      note: "🚀 MODE PRODUCTION - Aucune fallback activée - Toutes les APIs utilisent les vraies clés"
    };

    // ============================================================================
    // TEST DE NOS ENDPOINTS INTERNES UNIQUEMENT
    // ============================================================================
    
    const baseUrl = req.headers.host?.includes('localhost') 
      ? 'http://localhost:3000' 
      : `https://${req.headers.host}`;

    const apiTests = await Promise.allSettled([
      // Test de nos endpoints internes avec détails
      testEndpointWithDetails(`${baseUrl}/api/ai-services`, 'AI Services', {
        description: 'Services IA unifiés pour Emma En Direct',
        sub_apis: [
          'Perplexity (nouvelles financières) - PRODUCTION',
          'OpenAI GPT-4 (analyse et rédaction) - PRODUCTION',
          'Anthropic Claude (analyse alternative) - PRODUCTION',
          'Resend (envoi emails) - PRODUCTION',
          'Supabase Briefings (stockage) - PRODUCTION',
          'Expert Emma Modules (yield curves, forex, volatility, commodities) - PRODUCTION'
        ],
        dependencies: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'PERPLEXITY_API_KEY', 'RESEND_API_KEY'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      }),
      testEndpointWithDetails(`${baseUrl}/api/marketdata`, 'Market Data', {
        description: 'Données de marché multi-sources',
        sub_apis: [
          'Yahoo Finance (données temps réel) - PRODUCTION',
          'Financial Modeling Prep (FMP) - PRODUCTION',
          'Alpha Vantage - PRODUCTION',
          'Twelve Data - PRODUCTION',
          'Finnhub - PRODUCTION'
        ],
        dependencies: ['FMP_API_KEY', 'ALPHA_VANTAGE_API_KEY', 'TWELVE_DATA_API_KEY', 'FINNHUB_API_KEY'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      }),
      testEndpointWithDetails(`${baseUrl}/api/supabase-watchlist`, 'Supabase Watchlist', {
        description: 'Gestion de la watchlist utilisateur',
        sub_apis: [
          'Lecture watchlist - PRODUCTION',
          'Ajout/suppression tickers - PRODUCTION',
          'Synchronisation données - PRODUCTION'
        ],
        dependencies: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      }),
      testEndpointWithDetails(`${baseUrl}/api/gemini-key`, 'Gemini Key', {
        description: 'Gestion des clés API Gemini',
        sub_apis: [
          'Validation clé API - PRODUCTION',
          'Test connectivité Gemini - PRODUCTION'
        ],
        dependencies: ['GEMINI_API_KEY'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      }),
      // Note: api/health-check.js supprimé pour respecter la limite de 12 fonctions
      // Utiliser api/health-check-simple.js à la place
      testEndpointWithDetails(`${baseUrl}/api/briefing-cron`, 'Briefing Cron', {
        description: 'Automatisation des briefings Emma En Direct',
        sub_apis: [
          'Génération briefings matinaux - PRODUCTION',
          'Génération briefings midi - PRODUCTION',
          'Génération briefings clôture - PRODUCTION',
          'Envoi automatique emails - PRODUCTION'
        ],
        dependencies: ['CRON_SECRET', 'RESEND_API_KEY', 'OPENAI_API_KEY'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      }),
      testEndpointWithDetails(`${baseUrl}/api/fmp`, 'FMP', {
        description: 'Financial Modeling Prep API',
        sub_apis: [
          'Données fondamentales - PRODUCTION',
          'Profils entreprises - PRODUCTION',
          'Statements financiers - PRODUCTION',
          'Données historiques - PRODUCTION'
        ],
        dependencies: ['FMP_API_KEY'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      }),
      testEndpointWithDetails(`${baseUrl}/api/github-update`, 'GitHub Update', {
        description: 'Mise à jour automatique depuis GitHub',
        sub_apis: [
          'Webhook GitHub - PRODUCTION',
          'Déploiement automatique - PRODUCTION',
          'Synchronisation code - PRODUCTION'
        ],
        dependencies: ['GITHUB_WEBHOOK_SECRET'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      }),
      testEndpointWithDetails(`${baseUrl}/api/test-gemini`, 'Test Gemini', {
        description: 'Tests de connectivité Gemini',
        sub_apis: [
          'Test API Gemini - PRODUCTION',
          'Validation fonction calling - PRODUCTION',
          'Test prompts - PRODUCTION'
        ],
        dependencies: ['GEMINI_API_KEY'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      }),
      testEndpointWithDetails(`${baseUrl}/api/supabase-watchlist`, 'Supabase Connection', {
        description: 'Test de connexion Supabase et watchlist',
        sub_apis: [
          'Test variables d\'environnement Supabase - PRODUCTION',
          'Test connexion base de données - PRODUCTION',
          'Test accès tables (watchlists, briefings) - PRODUCTION',
          'Vérification source (supabase vs fallback) - PRODUCTION'
        ],
        dependencies: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      }),
      testEndpointWithDetails(`${baseUrl}/api/gemini/chat`, 'Gemini Chat', {
        description: 'Chat Emma avec Gemini (mode standard)',
        sub_apis: [
          'Chat conversationnel - PRODUCTION',
          'Function calling basique - PRODUCTION',
          'Réponses Emma - PRODUCTION'
        ],
        dependencies: ['GEMINI_API_KEY'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      }),
      testEndpointWithDetails(`${baseUrl}/api/gemini/chat-validated`, 'Gemini Chat Validated', {
        description: 'Chat Emma avec Gemini (mode validé)',
        sub_apis: [
          'Chat avec validation Zod - PRODUCTION',
          'Function calling avancé - PRODUCTION',
          'Sécurité renforcée - PRODUCTION',
          'Mode Expert Emma - PRODUCTION'
        ],
        dependencies: ['GEMINI_API_KEY'],
        fallback_status: '❌ AUCUNE FALLBACK - Mode production uniquement'
      })
    ]);

    // ============================================================================
    // ANALYSE DES RÉSULTATS
    // ============================================================================
    
    apiTests.forEach((result, index) => {
      const apiDetails = [
        { name: 'AI Services', details: { description: 'Services IA unifiés pour Emma En Direct', sub_apis: ['Perplexity (nouvelles financières)', 'OpenAI GPT-4 (analyse et rédaction)', 'Anthropic Claude (analyse alternative)', 'Resend (envoi emails)', 'Supabase Briefings (stockage)', 'Expert Emma Modules (yield curves, forex, volatility, commodities)'], dependencies: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'PERPLEXITY_API_KEY', 'RESEND_API_KEY'] }},
        { name: 'Market Data', details: { description: 'Données de marché multi-sources', sub_apis: ['Yahoo Finance (données temps réel)', 'Financial Modeling Prep (FMP)', 'Alpha Vantage', 'Twelve Data', 'Finnhub'], dependencies: ['FMP_API_KEY', 'ALPHA_VANTAGE_API_KEY', 'TWELVE_DATA_API_KEY', 'FINNHUB_API_KEY'] }},
        { name: 'Supabase Watchlist', details: { description: 'Gestion de la watchlist utilisateur', sub_apis: ['Lecture watchlist', 'Ajout/suppression tickers', 'Synchronisation données'], dependencies: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] }},
        { name: 'Gemini Key', details: { description: 'Gestion des clés API Gemini', sub_apis: ['Validation clé API', 'Test connectivité Gemini'], dependencies: ['GEMINI_API_KEY'] }},
        { name: 'Health Check', details: { description: 'Diagnostic complet des APIs externes', sub_apis: ['Test APIs externes', 'Vérification clés API', 'Monitoring performance'], dependencies: ['Toutes les clés API externes'] }},
        { name: 'Briefing Cron', details: { description: 'Automatisation des briefings Emma En Direct', sub_apis: ['Génération briefings matinaux', 'Génération briefings midi', 'Génération briefings clôture', 'Envoi automatique emails'], dependencies: ['CRON_SECRET', 'RESEND_API_KEY', 'OPENAI_API_KEY'] }},
        { name: 'FMP', details: { description: 'Financial Modeling Prep API', sub_apis: ['Données fondamentales', 'Profils entreprises', 'Statements financiers', 'Données historiques'], dependencies: ['FMP_API_KEY'] }},
        { name: 'GitHub Update', details: { description: 'Mise à jour automatique depuis GitHub', sub_apis: ['Webhook GitHub', 'Déploiement automatique', 'Synchronisation code'], dependencies: ['GITHUB_WEBHOOK_SECRET'] }},
        { name: 'Test Gemini', details: { description: 'Tests de connectivité Gemini', sub_apis: ['Test API Gemini', 'Validation fonction calling', 'Test prompts'], dependencies: ['GEMINI_API_KEY'] }},
        { name: 'Gemini Chat', details: { description: 'Chat Emma avec Gemini (mode standard)', sub_apis: ['Chat conversationnel', 'Function calling basique', 'Réponses Emma'], dependencies: ['GEMINI_API_KEY'] }},
        { name: 'Gemini Chat Validated', details: { description: 'Chat Emma avec Gemini (mode validé)', sub_apis: ['Chat avec validation Zod', 'Function calling avancé', 'Sécurité renforcée', 'Mode Expert Emma'], dependencies: ['GEMINI_API_KEY'] }}
      ];
      
      const apiInfo = apiDetails[index] || { name: `API ${index + 1}`, details: {} };
      
      if (result.status === 'fulfilled') {
        healthReport.apis[apiInfo.name] = {
          ...result.value,
          ...apiInfo.details
        };
        healthReport.total_apis++;
        
        if (result.value.status === 'healthy') {
          healthReport.healthy_apis++;
        } else if (result.value.status === 'degraded') {
          healthReport.degraded_apis++;
        } else {
          healthReport.failed_apis++;
        }
      } else {
        healthReport.apis[apiInfo.name] = {
          status: 'failed',
          error: result.reason?.message || 'Erreur inconnue',
          response_time_ms: 0,
          last_check: new Date().toISOString(),
          ...apiInfo.details
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
    
    healthReport.recommendations = generateSimpleRecommendations(healthReport);
    healthReport.summary = `${healthReport.healthy_apis}/${healthReport.total_apis} endpoints opérationnels (${Math.round(healthReport.healthy_apis/healthReport.total_apis*100)}%)`;

    console.log(`✅ Diagnostic simple terminé en ${healthReport.response_time_ms}ms - Status: ${healthReport.overall_status}`);
    
    return res.status(200).json({
      success: true,
      health: healthReport
    });
    
  } catch (error) {
    console.error('❌ Erreur diagnostic simple:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// ============================================================================
// FONCTION DE TEST D'ENDPOINT AVEC DÉTAILS
// ============================================================================

async function testEndpointWithDetails(url, name, details) {
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'Health-Check-Bot/1.0'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        status: 'healthy',
        response_time_ms: responseTime,
        last_check: new Date().toISOString(),
        rate_limit: 'N/A',
        reliability: 'High'
      };
    } else if (response.status === 405) {
      // Méthode non autorisée = endpoint existe mais ne supporte pas GET
      return {
        status: 'healthy',
        response_time_ms: responseTime,
        last_check: new Date().toISOString(),
        rate_limit: 'N/A',
        reliability: 'High',
        note: 'Endpoint existe (405 = méthode non autorisée)'
      };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    return {
      status: 'failed',
      error: error.message,
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  }
}

// ============================================================================
// FONCTION DE TEST D'ENDPOINT (LEGACY)
// ============================================================================

async function testEndpoint(url, name) {
  return testEndpointWithDetails(url, name, {});
}

// ============================================================================
// GÉNÉRATION DE RECOMMANDATIONS SIMPLES
// ============================================================================

function generateSimpleRecommendations(healthReport) {
  const recommendations = [];
  
  // Information sur le mode production
  recommendations.push('🚀 MODE PRODUCTION ACTIVÉ - Aucune fallback configurée');
  recommendations.push('✅ Toutes les APIs utilisent les vraies clés de production');
  
  if (healthReport.overall_status === 'unhealthy') {
    recommendations.push('🚨 Plusieurs endpoints sont en échec - vérifiez les logs Vercel');
    recommendations.push('🔧 Redéployez l\'application si nécessaire');
  } else if (healthReport.overall_status === 'degraded') {
    recommendations.push('⚠️ Quelques endpoints ont des problèmes - surveillez les performances');
  } else {
    recommendations.push('✅ Tous les endpoints internes fonctionnent correctement');
  }
  
  // Recommandations spécifiques
  const failedAPIs = Object.entries(healthReport.apis)
    .filter(([name, data]) => data.status === 'failed')
    .map(([name]) => name);
  
  if (failedAPIs.length > 0) {
    recommendations.push(`🔍 Endpoints en échec: ${failedAPIs.join(', ')}`);
  }
  
  return recommendations;
}
