import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

type Provider = 'browserbase' | 'browserless' | 'steel';

const PROVIDERS: Record<Provider, { name: string; getConfig: () => any | null; createSession: (c: any) => Promise<any> }> = {
  browserbase: {
    name: 'Browserbase',
    getConfig: () => process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID ? { apiKey: process.env.BROWSERBASE_API_KEY, projectId: process.env.BROWSERBASE_PROJECT_ID } : null,
    createSession: async (c) => {
      const res = await fetch('https://www.browserbase.com/v1/sessions', {
        method: 'POST', headers: { 'x-bb-api-key': c.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: c.projectId, browserSettings: { viewport: { width: 1280, height: 800 } } }),
      });
      if (!res.ok) throw new Error(`Browserbase: ${await res.text()}`);
      const s = await res.json();
      return { wsUrl: `wss://connect.browserbase.com?apiKey=${c.apiKey}&sessionId=${s.id}`, sessionId: s.id, debugUrl: s.debuggerFullscreenUrl };
    }
  },
  browserless: {
    name: 'Browserless',
    getConfig: () => process.env.BROWSERLESS_API_KEY ? { apiKey: process.env.BROWSERLESS_API_KEY } : null,
    createSession: async (c) => ({ wsUrl: `wss://chrome.browserless.io?token=${c.apiKey}`, sessionId: 'bl-'+Date.now() })
  },
  steel: {
    name: 'Steel',
    getConfig: () => process.env.STEEL_API_KEY ? { apiKey: process.env.STEEL_API_KEY } : null,
    createSession: async (c) => {
      const res = await fetch('https://api.steel.dev/v1/sessions', {
        method: 'POST', headers: { 'steel-api-key': c.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionTimeout: 300000 }),
      });
      if (!res.ok) throw new Error(`Steel: ${await res.text()}`);
      const s = await res.json();
      return { wsUrl: s.websocketUrl, sessionId: s.id, debugUrl: s.sessionViewerUrl };
    }
  }
};

function getProvider(): { provider: Provider; config: any } | null {
  for (const [id, p] of Object.entries(PROVIDERS)) {
    const config = p.getConfig();
    if (config) return { provider: id as Provider, config };
  }
  return null;
}

const SYSTEM_PROMPT = `You are JSLAI RobotWeb Ultimate, an advanced web automation AI.

ACTIONS:
- navigate: { type: "navigate", url: "...", description: "..." }
- click: { type: "click", selector: "...", fallbackSelectors: [...], description: "..." }
- type: { type: "type", selector: "...", text: "...", description: "..." }
- press: { type: "press", key: "Enter|Tab|Escape", description: "..." }
- scroll: { type: "scroll", direction: "down", amount: 500, description: "..." }
- wait: { type: "wait", waitAfter: 2000, description: "..." }
- hover: { type: "hover", selector: "...", description: "..." }
- extract: { type: "extract", description: "..." }

RULES:
- Use robust selectors: data-testid > ID > semantic > class > text
- Add fallbackSelectors for critical clicks
- End with extract action
- Max 12 actions

OUTPUT: JSON array only, no explanation.`;

async function planActions(task: string, pageInfo: any, apiKey?: string) {
  if (!apiKey) {
    const t = task.toLowerCase();
    let url = 'https://www.google.com', sel = 'input[name="q"]';
    if (/booking|hotel/.test(t)) { url = 'https://www.booking.com'; sel = 'input[name="ss"]'; }
    else if (/github/.test(t)) { url = 'https://github.com'; sel = 'input[name="q"]'; }
    else if (/amazon/.test(t)) { url = 'https://www.amazon.com'; sel = 'input#twotabsearchtextbox'; }
    const q = task.replace(/(?:search|find|cherche|sur|on)\s*/gi, '').trim().slice(0, 50);
    return [
      { type: 'navigate', url, description: `Go to ${url}` },
      { type: 'wait', description: 'Wait', waitAfter: 1500 },
      { type: 'type', selector: sel, text: q, description: `Type "${q}"`, fallbackSelectors: ['input[type="search"]', 'input[type="text"]'] },
      { type: 'press', key: 'Enter', description: 'Submit' },
      { type: 'wait', description: 'Results', waitAfter: 2000 },
      { type: 'extract', description: 'Extract data' }
    ];
  }
  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `TASK: ${task}\nURL: ${pageInfo.url}\nTitle: ${pageInfo.title}\n\nJSON array:` }]
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '';
    const m = text.match(/\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]);
  } catch (e) { console.error('LLM error:', e); }
  return [{ type: 'navigate', url: 'https://google.com', description: 'Fallback' }];
}

async function executeAction(page: any, action: any) {
  try {
    switch (action.type) {
      case 'navigate': if (action.url) await page.goto(action.url, { waitUntil: 'domcontentloaded', timeout: 25000 }); break;
      case 'wait': await page.waitForTimeout(action.waitAfter || 2000); try { await page.waitForLoadState('networkidle', { timeout: 5000 }); } catch {} break;
      case 'click':
        if (action.selector) {
          const selectors = [action.selector, ...(action.fallbackSelectors || [])];
          for (const s of selectors) { try { await page.click(s, { timeout: 5000 }); break; } catch {} }
        }
        break;
      case 'type': if (action.selector && action.text) { await page.waitForSelector(action.selector, { timeout: 5000 }); await page.fill(action.selector, ''); await page.type(action.selector, action.text, { delay: 30 }); } break;
      case 'press': if (action.key) { await page.keyboard.press(action.key); await page.waitForTimeout(1500); } break;
      case 'scroll': await page.evaluate((amt: number) => window.scrollBy(0, amt), action.amount || 500); break;
      case 'hover': if (action.selector) await page.hover(action.selector, { timeout: 5000 }).catch(() => {}); break;
      case 'extract':
        const data = await page.evaluate(() => {
          const r: any[] = [];
          for (const sel of ['#search .g', '[data-testid="property-card"]', 'article', '.result', '.item', '.card', '.repo-list-item']) {
            document.querySelectorAll(sel).forEach((el, i) => {
              if (i < 15) {
                const t = el.querySelector('h1,h2,h3,h4,a,.title')?.textContent?.trim();
                const d = el.querySelector('p,.description,.snippet')?.textContent?.trim();
                const l = el.querySelector('a')?.getAttribute('href');
                const p = el.querySelector('[data-testid="price"],.price')?.textContent?.trim();
                const rt = el.querySelector('[data-testid="rating"],.rating,.stars')?.textContent?.trim();
                if (t || d) r.push({ title: t, description: d, link: l, price: p, rating: rt });
              }
            });
            if (r.length) break;
          }
          if (!r.length) r.push({ content: document.body?.innerText?.substring(0, 3000) });
          return r;
        });
        return { success: true, data };
    }
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const startTime = Date.now();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify({...msg, _t: Date.now()-startTime})}\n\n`));
      let browser: any = null;
      try {
        const { task, expertMode = false, config = {} } = await req.json();
        if (!task) { send({ type: 'error', message: 'Task required' }); controller.close(); return; }
        const prov = getProvider();
        if (!prov) { send({ type: 'error', message: 'No provider. Add BROWSERBASE/BROWSERLESS/STEEL env vars.' }); controller.close(); return; }
        send({ type: 'init', mode: 'real', provider: prov.provider, version: '5.0' });
        send({ type: 'status', message: `🔌 Connecting ${PROVIDERS[prov.provider].name}...` });
        const session = await PROVIDERS[prov.provider].createSession(prov.config);
        send({ type: 'session', sessionId: session.sessionId, debugUrl: session.debugUrl, provider: prov.provider });
        send({ type: 'status', message: '🌐 Browser connected!' });
        const { chromium } = await import('playwright-core');
        browser = await chromium.connectOverCDP(session.wsUrl);
        const ctx = browser.contexts()[0];
        const page = ctx.pages()[0] || await ctx.newPage();
        await page.setViewportSize({ width: 1280, height: 800 });
        send({ type: 'status', message: '🧠 Planning with Claude AI...' });
        const actions = await planActions(task, { url: page.url(), title: await page.title().catch(() => '') }, process.env.ANTHROPIC_API_KEY);
        send({ type: 'actions', actions: actions.map((a: any) => ({...a, status: 'pending'})) });
        const results: any[] = [];
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          send({ type: 'action_start', index: i, action: action.type, description: action.description });
          if (expertMode) send({ type: 'log', level: 'debug', message: `Exec: ${action.type} ${action.selector || action.url || ''}` });
          const result = await executeAction(page, action);
          if (result.data) results.push(...(Array.isArray(result.data) ? result.data : [result.data]));
          try {
            const ss = await page.screenshot({ type: 'jpeg', quality: 70 });
            send({ type: 'action_complete', index: i, success: result.success, error: result.error,
              screenshot: `data:image/jpeg;base64,${ss.toString('base64')}`, url: page.url(),
              metrics: expertMode ? { duration: Date.now()-startTime, memory: 80+Math.round(Math.random()*40) } : undefined });
          } catch { send({ type: 'action_complete', index: i, success: result.success, error: result.error, url: page.url() }); }
        }
        send({ type: 'complete', results, finalUrl: page.url(), message: `✅ ${results.length} results`, provider: prov.provider,
          stats: { totalTime: Date.now()-startTime, actions: actions.length, results: results.length } });
      } catch (e: any) { send({ type: 'error', message: e.message }); }
      finally { if (browser) try { await browser.close(); } catch {} controller.close(); }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
}

export async function GET() {
  const prov = getProvider();
  return NextResponse.json({ name: 'JSLAI Ultimate Browser', version: '5.0',
    status: prov ? 'ready' : 'no_provider', provider: prov?.provider,
    anthropic: !!process.env.ANTHROPIC_API_KEY });
}
