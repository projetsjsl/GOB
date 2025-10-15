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
      apis: {}
    };

    // ============================================================================
    // TEST DE NOS ENDPOINTS INTERNES UNIQUEMENT
    // ============================================================================
    
    const baseUrl = req.headers.host?.includes('localhost') 
      ? 'http://localhost:3000' 
      : `https://${req.headers.host}`;

    const apiTests = await Promise.allSettled([
      // Test de nos endpoints internes
      testEndpoint(`${baseUrl}/api/ai-services`, 'AI Services'),
      testEndpoint(`${baseUrl}/api/marketdata`, 'Market Data'),
      testEndpoint(`${baseUrl}/api/supabase-watchlist`, 'Supabase Watchlist'),
      testEndpoint(`${baseUrl}/api/gemini-key`, 'Gemini Key'),
      testEndpoint(`${baseUrl}/api/health-check`, 'Health Check'),
      testEndpoint(`${baseUrl}/api/briefing-cron`, 'Briefing Cron'),
      testEndpoint(`${baseUrl}/api/fmp`, 'FMP'),
      testEndpoint(`${baseUrl}/api/github-update`, 'GitHub Update'),
      testEndpoint(`${baseUrl}/api/test-gemini`, 'Test Gemini'),
      testEndpoint(`${baseUrl}/api/gemini/chat`, 'Gemini Chat'),
      testEndpoint(`${baseUrl}/api/gemini/chat-validated`, 'Gemini Chat Validated')
    ]);

    // ============================================================================
    // ANALYSE DES RÉSULTATS
    // ============================================================================
    
    apiTests.forEach((result, index) => {
      const apiNames = [
        'AI Services', 'Market Data', 'Supabase Watchlist', 'Gemini Key', 
        'Health Check', 'Briefing Cron', 'FMP', 'GitHub Update', 
        'Test Gemini', 'Gemini Chat', 'Gemini Chat Validated'
      ];
      
      const apiName = apiNames[index] || `API ${index + 1}`;
      
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
// FONCTION DE TEST D'ENDPOINT
// ============================================================================

async function testEndpoint(url, name) {
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
// GÉNÉRATION DE RECOMMANDATIONS SIMPLES
// ============================================================================

function generateSimpleRecommendations(healthReport) {
  const recommendations = [];
  
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
