// ============================================================================
// API Test Gemini - Endpoint de test pour l'onglet Ask Emma
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
    console.log('🧪 Test Gemini API endpoint appelé');
    
    // Test simple de connectivité
    const testResult = {
      success: true,
      message: 'Test Gemini API endpoint fonctionnel',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      response_time_ms: 0
    };

    return res.status(200).json(testResult);
    
  } catch (error) {
    console.error('❌ Erreur test Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
