import { NextResponse } from 'next/server';

export async function GET() {
  const providers = {
    simulation: { id: 'simulation', name: 'Simulation', description: 'Free demo - 10 simulated sites', status: 'ready' as const, cost: 'FREE', icon: '🎭', endpoint: '/api/simulate', tier: 'free' },
    browserbase: { id: 'browserbase', name: 'Browserbase', description: 'Real cloud browser with live view',
      status: (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) ? 'ready' as const : 'not_configured' as const,
      cost: '$39+/mo', icon: '🌐', endpoint: '/api/browser', configUrl: 'https://browserbase.com', tier: 'pro' },
    browserless: { id: 'browserless', name: 'Browserless', description: 'Alternative cloud browser',
      status: process.env.BROWSERLESS_API_KEY ? 'ready' as const : 'not_configured' as const,
      cost: '$10+/mo', icon: '🔷', endpoint: '/api/browser', configUrl: 'https://browserless.io', tier: 'pro' },
    steel: { id: 'steel', name: 'Steel Browser', description: 'AI-optimized sessions',
      status: process.env.STEEL_API_KEY ? 'ready' as const : 'not_configured' as const,
      cost: 'Usage', icon: '🔩', endpoint: '/api/browser', configUrl: 'https://steel.dev', tier: 'pro' },
  };

  const defaultProvider = providers.browserbase.status === 'ready' ? 'browserbase' :
    providers.browserless.status === 'ready' ? 'browserless' :
    providers.steel.status === 'ready' ? 'steel' : 'simulation';

  return NextResponse.json({
    version: '5.0',
    providers,
    defaultProvider,
    anthropic: { configured: !!process.env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-20250514' },
    features: { expertMode: true, adminPanel: true, workflows: true, themes: true, multiLanguage: true, exportData: true, history: true, metrics: true },
    limits: { maxActions: 15, timeout: 60, maxResults: 50 }
  });
}
