import { applyCors } from './_middleware/emma-cors.js';

export default async function handler(req, res) {
  const handled = applyCors(req, res);
  if (handled) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  try {
    const { message, conversationHistory, clientData, useClientData } = req.body || {};

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Missing message'
      });
    }

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const orchestratorUrl = `${proto}://${host}/api/orchestrator`;

    const orchestratorResponse = await fetch(orchestratorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        channel: 'web',
        context: {
          conversationHistory,
          clientData,
          useClientData
        }
      }),
      signal: AbortSignal.timeout(60000)
    });

    const data = await orchestratorResponse.json();

    if (!orchestratorResponse.ok || !data?.success) {
      return res.status(orchestratorResponse.status || 500).json({
        success: false,
        error: data?.error || 'Upstream error'
      });
    }

    return res.status(200).json({
      success: true,
      message: data.response || '',
      citations: [],
      confidence: 'Moyen',
      sources: []
    });
  } catch (error) {
    console.error('chatbot-js error:', error);
    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
