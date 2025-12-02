/**
 * API Route: /api/groupchat/admin
 * Admin panel endpoint for JSLAI RobotWeb Ultimate v5.0
 */

const DEFAULT_SETTINGS = {
  general: { language: 'auto', defaultProvider: 'simulation', expertMode: false, autoScroll: true, screenshotQuality: 70, maxActions: 15, timeout: 60000, retryOnError: true },
  appearance: { theme: 'dark', accentColor: '#00e5ff', secondaryColor: '#b388ff', fontSize: 'medium', compactMode: false, showMetrics: true, animations: true },
  llm: { model: 'claude-sonnet-4-20250514', maxTokens: 4096, temperature: 0.3, systemPrompt: '', customInstructions: '' },
  extraction: { depth: 'deep', maxResults: 50, includeImages: true, includeLinks: true, cleanText: true },
  notifications: { onComplete: true, onError: true, sound: false },
  privacy: { saveHistory: true, historyDays: 30, analytics: false }
};

const THEMES = {
  dark: { name: 'Dark', bg: '#030306', surface: '#0a0a0f', text: '#fafaff', primary: '#00e5ff', secondary: '#b388ff' },
  light: { name: 'Light', bg: '#f5f5f7', surface: '#ffffff', text: '#1d1d1f', primary: '#0066cc', secondary: '#9333ea' },
  midnight: { name: 'Midnight', bg: '#0f0f1a', surface: '#1a1a2e', text: '#e0e0ff', primary: '#6366f1', secondary: '#ec4899' },
  forest: { name: 'Forest', bg: '#0a1612', surface: '#132620', text: '#e0f0ea', primary: '#10b981', secondary: '#84cc16' },
  ocean: { name: 'Ocean', bg: '#0a1628', surface: '#1e3a5f', text: '#e0f0ff', primary: '#0ea5e9', secondary: '#06b6d4' },
  sunset: { name: 'Sunset', bg: '#1a0a0a', surface: '#2d1515', text: '#ffe0e0', primary: '#f43f5e', secondary: '#fb923c' },
  cyberpunk: { name: 'Cyberpunk', bg: '#0d0221', surface: '#1a0533', text: '#ff00ff', primary: '#00ffff', secondary: '#ff00ff' }
};

const PRESET_WORKFLOWS = [
  { id: 'hotel-search', name: 'Hotel Search', description: 'Search hotels', icon: '🏨', template: 'Find hotels in {location}', variables: ['location'] },
  { id: 'product-compare', name: 'Product Search', description: 'Find products', icon: '🛒', template: 'Find {product} on Amazon', variables: ['product'] },
  { id: 'job-search', name: 'Job Search', description: 'Find jobs', icon: '💼', template: 'Find {role} jobs on LinkedIn', variables: ['role'] },
  { id: 'research', name: 'Research', description: 'Research topics', icon: '🔬', template: 'Research {topic}', variables: ['topic'] },
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { section } = req.query;
    if (section === 'themes') return res.json({ themes: THEMES, current: 'dark' });
    if (section === 'workflows') return res.json({ presets: PRESET_WORKFLOWS, custom: [] });
    if (section === 'stats') return res.json({ totalTasks: 0, successRate: 100, avgDuration: 0, topSites: [], recentTasks: [] });
    if (section === 'env') return res.json({
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      BROWSERBASE_API_KEY: !!process.env.BROWSERBASE_API_KEY,
      BROWSERBASE_PROJECT_ID: !!process.env.BROWSERBASE_PROJECT_ID,
      BROWSERLESS_API_KEY: !!process.env.BROWSERLESS_API_KEY,
      STEEL_API_KEY: !!process.env.STEEL_API_KEY
    });
    return res.json({ settings: DEFAULT_SETTINGS, themes: THEMES, workflows: PRESET_WORKFLOWS, version: '5.0' });
  }

  if (req.method === 'POST') {
    try {
      const { action, data } = req.body;
      switch (action) {
        case 'updateSettings': 
          return res.json({ success: true, message: 'Settings updated', settings: { ...DEFAULT_SETTINGS, ...data } });
        case 'setTheme': 
          const theme = THEMES[data.theme]; 
          if (!theme) return res.status(400).json({ error: 'Invalid theme' }); 
          return res.json({ success: true, theme });
        case 'testProvider':
          const { provider } = data;
          if (provider === 'simulation') return res.json({ success: true, message: 'Always available', latency: 0 });
          if (provider === 'browserbase') {
            if (!process.env.BROWSERBASE_API_KEY) return res.json({ success: false, message: 'Not configured' });
            try { 
              const res2 = await fetch('https://www.browserbase.com/v1/projects', { headers: { 'x-bb-api-key': process.env.BROWSERBASE_API_KEY } }); 
              return res.json({ success: res2.ok, message: res2.ok ? 'Connected' : `Error: ${res2.status}` }); 
            }
            catch (e) { return res.json({ success: false, message: e.message }); }
          }
          if (provider === 'anthropic') {
            if (!process.env.ANTHROPIC_API_KEY) return res.json({ success: false, message: 'Not configured' });
            try { 
              const Anthropic = (await import('@anthropic-ai/sdk')).default; 
              const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); 
              await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }); 
              return res.json({ success: true, message: 'Connected' }); 
            }
            catch (e) { return res.json({ success: false, message: e.message }); }
          }
          return res.json({ success: false, message: 'Unknown provider' });
        case 'exportData': 
          return res.json({ success: true, data: { settings: DEFAULT_SETTINGS, workflows: [], history: [] }, exportDate: new Date().toISOString() });
        case 'clearHistory': 
          return res.json({ success: true, message: 'History cleared' });
        default: 
          return res.status(400).json({ error: 'Unknown action' });
      }
    } catch (e) { 
      return res.status(500).json({ error: e.message }); 
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

