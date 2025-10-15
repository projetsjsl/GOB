/**
 * Claude API - Endpoint pour Anthropic Claude
 * Redirige vers ai-services pour la cohérence
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Rediriger vers ai-services pour la cohérence
    return res.status(200).json({
      success: true,
      message: "Claude API redirigé vers ai-services",
      usage: "Utilisez /api/ai-services?service=openai avec ANTHROPIC_API_KEY",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Claude API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
