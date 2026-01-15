/**
 * API Route: /api/groupchat/config
 * Configuration endpoint for JSLAI RobotWeb Ultimate v5.0
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const providers = {
      simulation: { 
        id: 'simulation', 
        name: 'Simulation', 
        description: 'Free demo - 10 simulated sites', 
        status: 'ready', 
        cost: 'FREE', 
        icon: '', 
        endpoint: '/api/groupchat/simulate', 
        tier: 'free' 
      },
      browserbase: { 
        id: 'browserbase', 
        name: 'Browserbase', 
        description: 'Real cloud browser with live view',
        status: (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) ? 'ready' : 'not_configured',
        cost: '$39+/mo', 
        icon: '', 
        endpoint: '/api/groupchat/browser', 
        configUrl: 'https://browserbase.com', 
        tier: 'pro' 
      },
      browserless: { 
        id: 'browserless', 
        name: 'Browserless', 
        description: 'Alternative cloud browser',
        status: process.env.BROWSERLESS_API_KEY ? 'ready' : 'not_configured',
        cost: '$10+/mo', 
        icon: '', 
        endpoint: '/api/groupchat/browser', 
        configUrl: 'https://browserless.io', 
        tier: 'pro' 
      },
      steel: { 
        id: 'steel', 
        name: 'Steel Browser', 
        description: 'AI-optimized sessions',
        status: process.env.STEEL_API_KEY ? 'ready' : 'not_configured',
        cost: 'Usage', 
        icon: '', 
        endpoint: '/api/groupchat/browser', 
        configUrl: 'https://steel.dev', 
        tier: 'pro' 
      },
    };

    const defaultProvider = providers.browserbase.status === 'ready' ? 'browserbase' :
      providers.browserless.status === 'ready' ? 'browserless' :
      providers.steel.status === 'ready' ? 'steel' : 'simulation';

    return res.json({
      version: '5.0',
      providers,
      defaultProvider,
      anthropic: { configured: !!process.env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-20250514' },
      features: { expertMode: true, adminPanel: true, workflows: true, themes: true, multiLanguage: true, exportData: true, history: true, metrics: true },
      limits: { maxActions: 15, timeout: 60, maxResults: 50 }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

