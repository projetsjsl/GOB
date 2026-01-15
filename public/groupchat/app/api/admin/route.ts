import { NextRequest, NextResponse } from 'next/server';

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
  { id: 'hotel-search', name: 'Hotel Search', description: 'Search hotels', icon: '', template: 'Find hotels in {location}', variables: ['location'] },
  { id: 'product-compare', name: 'Product Search', description: 'Find products', icon: '', template: 'Find {product} on Amazon', variables: ['product'] },
  { id: 'job-search', name: 'Job Search', description: 'Find jobs', icon: '', template: 'Find {role} jobs on LinkedIn', variables: ['role'] },
  { id: 'research', name: 'Research', description: 'Research topics', icon: '', template: 'Research {topic}', variables: ['topic'] },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section');
  if (section === 'themes') return NextResponse.json({ themes: THEMES, current: 'dark' });
  if (section === 'workflows') return NextResponse.json({ presets: PRESET_WORKFLOWS, custom: [] });
  if (section === 'stats') return NextResponse.json({ totalTasks: 0, successRate: 100, avgDuration: 0, topSites: [], recentTasks: [] });
  if (section === 'env') return NextResponse.json({
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    BROWSERBASE_API_KEY: !!process.env.BROWSERBASE_API_KEY,
    BROWSERBASE_PROJECT_ID: !!process.env.BROWSERBASE_PROJECT_ID,
    BROWSERLESS_API_KEY: !!process.env.BROWSERLESS_API_KEY,
    STEEL_API_KEY: !!process.env.STEEL_API_KEY
  });
  return NextResponse.json({ settings: DEFAULT_SETTINGS, themes: THEMES, workflows: PRESET_WORKFLOWS, version: '5.0' });
}

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();
    switch (action) {
      case 'updateSettings': return NextResponse.json({ success: true, message: 'Settings updated', settings: { ...DEFAULT_SETTINGS, ...data } });
      case 'setTheme': const theme = THEMES[data.theme as keyof typeof THEMES]; if (!theme) return NextResponse.json({ error: 'Invalid theme' }, { status: 400 }); return NextResponse.json({ success: true, theme });
      case 'testProvider':
        const { provider } = data;
        if (provider === 'simulation') return NextResponse.json({ success: true, message: 'Always available', latency: 0 });
        if (provider === 'browserbase') {
          if (!process.env.BROWSERBASE_API_KEY) return NextResponse.json({ success: false, message: 'Not configured' });
          try { const res = await fetch('https://www.browserbase.com/v1/projects', { headers: { 'x-bb-api-key': process.env.BROWSERBASE_API_KEY } }); return NextResponse.json({ success: res.ok, message: res.ok ? 'Connected' : `Error: ${res.status}` }); }
          catch (e: any) { return NextResponse.json({ success: false, message: e.message }); }
        }
        if (provider === 'anthropic') {
          if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ success: false, message: 'Not configured' });
          try { const Anthropic = (await import('@anthropic-ai/sdk')).default; const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }); return NextResponse.json({ success: true, message: 'Connected' }); }
          catch (e: any) { return NextResponse.json({ success: false, message: e.message }); }
        }
        return NextResponse.json({ success: false, message: 'Unknown provider' });
      case 'exportData': return NextResponse.json({ success: true, data: { settings: DEFAULT_SETTINGS, workflows: [], history: [] }, exportDate: new Date().toISOString() });
      case 'clearHistory': return NextResponse.json({ success: true, message: 'History cleared' });
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
