// ========================================
// API ROUTE DE TEST - VERCEL
// ========================================

export default function handler(req, res) {
  try {
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

    // Informations de debug
    const debugInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        userAgent: req.headers['user-agent']
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
        vercelRegion: process.env.VERCEL_REGION
      },
      availableEnvVars: Object.keys(process.env).filter(key => 
        key.includes('API') || key.includes('GEMINI') || key.includes('GITHUB')
      )
    };

    return res.status(200).json({
      status: 'success',
      message: 'API route fonctionnelle',
      debug: debugInfo
    });

  } catch (error) {
    console.error('Erreur dans test API:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
