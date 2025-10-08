// ========================================
// API ROUTE DE TEST - GEMINI CONNECTIVITY
// ========================================

export default function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  console.log('🧪 Test de connectivité Gemini...');

  // Vérifier la clé API
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    return res.status(500).json({
      status: 'error',
      message: 'Clé API Gemini non configurée',
      debug: {
        hasApiKey: false,
        availableEnvVars: Object.keys(process.env).filter(key => key.includes('GEMINI')),
        timestamp: new Date().toISOString()
      }
    });
  }

  // Test de connectivité avec l'API Gemini
  const testPrompt = "Répondez simplement 'Test réussi' si vous recevez ce message.";
  
  fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: testPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 50,
      }
    })
  })
  .then(response => {
    console.log('📡 Réponse Gemini:', response.status);
    
    if (!response.ok) {
      return response.json().then(errorData => {
        throw new Error(`API Gemini error: ${response.status} - ${JSON.stringify(errorData)}`);
      });
    }
    
    return response.json();
  })
  .then(data => {
    console.log('✅ Test Gemini réussi');
    
    return res.status(200).json({
      status: 'success',
      message: 'Connectivité Gemini OK',
      testResponse: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Réponse reçue',
      debug: {
        hasApiKey: true,
        apiKeyLength: geminiApiKey.length,
        timestamp: new Date().toISOString()
      }
    });
  })
  .catch(error => {
    console.error('❌ Test Gemini échoué:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Test de connectivité Gemini échoué',
      error: error.message,
      debug: {
        hasApiKey: true,
        apiKeyLength: geminiApiKey.length,
        timestamp: new Date().toISOString()
      }
    });
  });
}
