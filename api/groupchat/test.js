/**
 * API Route: /api/groupchat/test
 * Test endpoint for JSLAI RobotWeb Ultimate v5.0
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({ message: 'POST with { provider: "simulation|browserbase|browserless|steel|anthropic|all" }' });
  }

  if (req.method === 'POST') {
    const { provider } = req.body;
    const results = { provider, tests: [], timestamp: new Date().toISOString() };
    
    if (provider === 'simulation' || provider === 'all') {
      results.tests.push({ name: 'Simulation Engine', status: 'pass', message: 'Always available', latency: 0 });
    }
    
    if (provider === 'browserbase' || provider === 'all') {
      if (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) {
        try {
          const start = Date.now();
          const res2 = await fetch('https://www.browserbase.com/v1/projects', { headers: { 'x-bb-api-key': process.env.BROWSERBASE_API_KEY } });
          results.tests.push({ name: 'Browserbase API', status: res2.ok ? 'pass' : 'fail', message: res2.ok ? 'Connected' : `Status ${res2.status}`, latency: Date.now() - start });
        } catch (e) { 
          results.tests.push({ name: 'Browserbase API', status: 'fail', message: e.message }); 
        }
      } else { 
        results.tests.push({ name: 'Browserbase API', status: 'skip', message: 'Not configured' }); 
      }
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
        } catch (e) { 
          results.tests.push({ name: 'Claude AI', status: 'fail', message: e.message }); 
        }
      } else { 
        results.tests.push({ name: 'Claude AI', status: 'skip', message: 'Not configured (optional)' }); 
      }
    }
    
    results.allPassed = results.tests.every((t) => t.status !== 'fail');
    results.summary = `${results.tests.filter((t) => t.status === 'pass').length}/${results.tests.length} passed`;
    
    return res.json(results);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

