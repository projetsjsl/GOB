/**
 * Gemini API Proxy
 * Handles requests to Google's Gemini API with proper error handling
 * Updated Dec 2024: Added timeout, API key expiry detection
 */

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY missing' });
  }

  try {
    const { model = 'gemini-2.0-flash-exp', data } = req.body;

    // Construct Google API URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Add timeout (30 seconds for LLM calls)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseData = await googleResponse.json();

    if (!googleResponse.ok) {
      console.error('[Gemini Proxy Error]', responseData);

      // Detect API key issues
      const errorMessage = responseData?.error?.message || '';
      const isKeyError = errorMessage.includes('API key expired') ||
                         errorMessage.includes('API_KEY_INVALID') ||
                         errorMessage.includes('PERMISSION_DENIED') ||
                         googleResponse.status === 401 ||
                         googleResponse.status === 403;

      if (isKeyError) {
        console.error(' [Gemini] API key invalid or expired');
        return res.status(401).json({
          error: 'Gemini API key invalid or expired',
          message: 'La cle API Gemini est invalide ou expiree',
          details: errorMessage,
          fix: 'Verifiez GEMINI_API_KEY dans les variables d\'environnement Vercel',
          timestamp: new Date().toISOString()
        });
      }

      // Handle rate limiting
      if (googleResponse.status === 429) {
        console.error(' [Gemini] Rate limit exceeded');
        return res.status(429).json({
          error: 'Gemini rate limit exceeded',
          message: 'Limite de requetes Gemini atteinte',
          details: errorMessage,
          timestamp: new Date().toISOString()
        });
      }

      return res.status(googleResponse.status).json(responseData);
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error(' [Gemini Proxy] Error:', error.message);

    // Handle timeout
    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Gemini API timeout',
        message: 'La requete a Gemini a expire (30s)',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Gemini proxy error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
