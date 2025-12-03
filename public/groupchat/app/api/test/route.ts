import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { provider } = await req.json();
  const results: any = { provider, tests: [], timestamp: new Date().toISOString() };
  
  if (provider === 'simulation' || provider === 'all') {
    results.tests.push({ name: 'Simulation Engine', status: 'pass', message: 'Always available', latency: 0 });
  }
  
  if (provider === 'browserbase' || provider === 'all') {
    if (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) {
      try {
        const start = Date.now();
        const res = await fetch('https://www.browserbase.com/v1/projects', { headers: { 'x-bb-api-key': process.env.BROWSERBASE_API_KEY } });
        results.tests.push({ name: 'Browserbase API', status: res.ok ? 'pass' : 'fail', message: res.ok ? 'Connected' : `Status ${res.status}`, latency: Date.now() - start });
      } catch (e: any) { results.tests.push({ name: 'Browserbase API', status: 'fail', message: e.message }); }
    } else { results.tests.push({ name: 'Browserbase API', status: 'skip', message: 'Not configured' }); }
  }
  
  if (provider === 'browserless' || provider === 'all') {
    results.tests.push({ name: 'Browserless API', status: process.env.BROWSERLESS_API_KEY ? 'pass' : 'skip', message: process.env.BROWSERLESS_API_KEY ? 'Key configured' : 'Not configured' });
  }
  
  if (provider === 'steel' || provider === 'all') {
    results.tests.push({ name: 'Steel API', status: process.env.STEEL_API_KEY ? 'pass' : 'skip', message: process.env.STEEL_API_KEY ? 'Key configured' : 'Not configured' });
  }
  
  if (provider === 'anthropic' || provider === 'all') {
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const start = Date.now();
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 10, messages: [{ role: 'user', content: 'Test' }] });
        results.tests.push({ name: 'Claude AI', status: 'pass', message: 'Connected', latency: Date.now() - start });
      } catch (e: any) { results.tests.push({ name: 'Claude AI', status: 'fail', message: e.message }); }
    } else { results.tests.push({ name: 'Claude AI', status: 'skip', message: 'Not configured (optional)' }); }
  }
  
  results.allPassed = results.tests.every((t: any) => t.status !== 'fail');
  results.summary = `${results.tests.filter((t: any) => t.status === 'pass').length}/${results.tests.length} passed`;
  
  return NextResponse.json(results);
}

export async function GET() {
  return NextResponse.json({ message: 'POST with { provider: "simulation|browserbase|browserless|steel|anthropic|all" }' });
}
