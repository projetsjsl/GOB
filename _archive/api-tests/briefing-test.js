/**
 * Version de test simplifiée de /api/briefing
 * Pour diagnostiquer le problème 404
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const type = req.query.type || req.body?.type || 'morning';
    
    return res.status(200).json({
      success: true,
      message: 'Test endpoint works!',
      type: type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

