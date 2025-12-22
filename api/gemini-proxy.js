import fetch from 'node-fetch';

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
    const { model = 'gemini-pro', data } = req.body;
    
    // Construct Google API URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const responseData = await googleResponse.json();

    if (!googleResponse.ok) {
        console.error('[Gemini Proxy Error]', responseData);
        return res.status(googleResponse.status).json(responseData);
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Proxy internal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
