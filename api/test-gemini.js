/**
 * Test Gemini API - Version simplifiée
 * Test de la connectivité avec l'API Gemini
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return res.status(200).json({
        success: false,
        message: 'Clé API Gemini non configurée',
        status: 'not_configured',
        timestamp: new Date().toISOString()
      });
    }

    // Test simple de l'API Gemini
    const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Réponds simplement "Test réussi"'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    });

    if (!testResponse.ok) {
      throw new Error(`Gemini API error: ${testResponse.status}`);
    }

    const data = await testResponse.json();
    
    return res.status(200).json({
      success: true,
      message: 'Test Gemini réussi',
      status: 'working',
      response: data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Réponse reçue',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur test Gemini:', error);
    return res.status(200).json({
      success: false,
      message: 'Test Gemini échoué',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
