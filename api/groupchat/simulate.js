/**
 * API Route: /api/groupchat/simulate
 * Simulation mode for JSLAI RobotWeb Ultimate v5.0
 * Simulates 10 different websites (Google, Booking, GitHub, Amazon, LinkedIn, YouTube, Twitter, Reddit, Wikipedia, IMDb)
 */

const SITES = {
  google: {
    url: 'https://www.google.com', name: 'Google', icon: '🔍', selector: 'input[name="q"]',
    color: { bg: '#fff', accent: '#4285f4', text: '#202124' },
    generate: (q) => Array.from({length: 6}, (_, i) => ({
      title: i === 0 ? `${q} - Wikipedia` : i === 1 ? `${q} Official` : `${q} ${['Guide', 'Tutorial', 'Review', 'News'][i-2] || 'Result'}`,
      description: `Information about ${q}. ${['Expert insights', 'Latest updates', 'Analysis', 'Overview'][i % 4]}.`,
      link: `https://example${i}.com/${q.toLowerCase().replace(/\s/g, '-')}`, type: i === 2 ? 'ad' : 'organic'
    }))
  },
  booking: {
    url: 'https://www.booking.com', name: 'Booking.com', icon: '🏨', selector: 'input[name="ss"]',
    color: { bg: '#003580', accent: '#feba02', text: '#fff' },
    generate: (q) => [
      { title: `Hôtel Le Marais ★★★★`, description: `${q} centre. WiFi, breakfast, spa.`, price: '€145', rating: '8.9', reviews: '2,847' },
      { title: `Grand Palace ★★★★★`, description: `${q} luxury. Pool, restaurant.`, price: '€289', rating: '9.4', reviews: '1,523' },
      { title: `Budget Inn ★★★`, description: `${q} budget friendly.`, price: '€65', rating: '7.8', reviews: '4,102' },
      { title: `Boutique Residence ★★★★`, description: `${q} design apartments.`, price: '€175', rating: '9.1', reviews: '892' },
      { title: `City Suites ★★★★`, description: `${q} downtown.`, price: '€198', rating: '8.7', reviews: '1,234' },
    ]
  },
  github: {
    url: 'https://github.com', name: 'GitHub', icon: '💻', selector: 'input[name="q"]',
    color: { bg: '#0d1117', accent: '#238636', text: '#c9d1d9' },
    generate: (q) => [
      { title: `awesome-${q.toLowerCase()}`, description: `🎉 Curated ${q} resources`, stars: '45.2k', forks: '5.8k', lang: 'Markdown' },
      { title: `${q.toLowerCase()}-starter`, description: `🚀 Production ${q} template`, stars: '12.8k', forks: '2.1k', lang: 'TypeScript' },
      { title: `learn-${q.toLowerCase()}`, description: `📚 Free ${q} course`, stars: '28.5k', forks: '8.2k', lang: 'JavaScript' },
      { title: `${q.toLowerCase()}-cli`, description: `⚡ Fast ${q} CLI`, stars: '8.1k', forks: '1.2k', lang: 'Rust' },
    ]
  },
  amazon: {
    url: 'https://www.amazon.com', name: 'Amazon', icon: '🛒', selector: 'input#twotabsearchtextbox',
    color: { bg: '#131921', accent: '#ff9900', text: '#fff' },
    generate: (q) => [
      { title: `${q} - Best Seller`, description: `Top rated. Prime shipping.`, price: '$299.99', rating: '4.8', reviews: '15,234', prime: true },
      { title: `${q} Pro Edition`, description: `Professional grade.`, price: '$449.99', rating: '4.6', reviews: '8,567', prime: true },
      { title: `${q} Budget`, description: `Great value.`, price: '$89.99', rating: '4.3', reviews: '5,892' },
    ]
  },
  linkedin: {
    url: 'https://www.linkedin.com/jobs', name: 'LinkedIn', icon: '💼', selector: 'input',
    color: { bg: '#f3f2ef', accent: '#0a66c2', text: '#000' },
    generate: (q) => [
      { title: `Senior ${q} Engineer`, company: 'Google', location: 'Remote', salary: '$180-250k' },
      { title: `${q} Developer`, company: 'Microsoft', location: 'Seattle', salary: '$150-200k' },
      { title: `Lead ${q} Architect`, company: 'Amazon', location: 'NYC', salary: '$200-280k' },
    ]
  },
  youtube: {
    url: 'https://www.youtube.com', name: 'YouTube', icon: '📺', selector: 'input#search',
    color: { bg: '#0f0f0f', accent: '#ff0000', text: '#fff' },
    generate: (q) => [
      { title: `${q} Tutorial Beginners`, channel: 'TechMaster', views: '2.4M', duration: '45:32' },
      { title: `${q} Full Course`, channel: 'FreeCodeCamp', views: '1.8M', duration: '4:23:15' },
      { title: `${q} Crash Course`, channel: 'Traversy', views: '890K', duration: '32:18' },
    ]
  },
  twitter: {
    url: 'https://twitter.com', name: 'X/Twitter', icon: '🐦', selector: 'input',
    color: { bg: '#000', accent: '#1d9bf0', text: '#e7e9ea' },
    generate: (q) => [
      { author: '@techleader', content: `Amazing ${q} thread 🧵`, likes: '12.4K', retweets: '3.2K' },
      { author: '@devnews', content: `Breaking: ${q} update!`, likes: '8.9K', retweets: '2.1K' },
    ]
  },
  reddit: {
    url: 'https://www.reddit.com', name: 'Reddit', icon: '🔴', selector: 'input',
    color: { bg: '#1a1a1b', accent: '#ff4500', text: '#d7dadc' },
    generate: (q) => [
      { title: `Best ${q} resources?`, subreddit: `r/${q.toLowerCase()}`, upvotes: '2.4K', comments: '342' },
      { title: `I built a ${q} tool`, subreddit: 'r/programming', upvotes: '1.8K', comments: '156' },
    ]
  },
  wikipedia: {
    url: 'https://www.wikipedia.org', name: 'Wikipedia', icon: '📚', selector: 'input#searchInput',
    color: { bg: '#fff', accent: '#3366cc', text: '#202122' },
    generate: (q) => [{ title: q, description: `${q} is a significant topic.`, sections: ['History', 'Overview', 'Applications'] }]
  },
  imdb: {
    url: 'https://www.imdb.com', name: 'IMDb', icon: '🎬', selector: 'input',
    color: { bg: '#121212', accent: '#f5c518', text: '#fff' },
    generate: (q) => [{ title: q, year: '2024', rating: '8.5', votes: '125K', genre: 'Drama/Thriller' }]
  },
};

function genSVG(site, query, step, prog) {
  const { bg, accent, text } = site.color;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800">
    <rect fill="${bg}" width="100%" height="100%"/><rect fill="${accent}" width="100%" height="52"/>
    <text x="20" y="33" fill="white" font-family="system-ui" font-size="16" font-weight="700">${site.icon} ${site.name}</text>
    <rect fill="${bg}" x="180" y="10" width="500" height="32" rx="16" opacity="0.95"/>
    <text x="200" y="31" fill="${text}" font-family="system-ui" font-size="13" opacity="0.8">${query}</text>
    <rect fill="${bg}" x="440" y="760" width="400" height="4" rx="2" opacity="0.2"/>
    <rect fill="${accent}" x="440" y="760" width="${Math.round(prog*400)}" height="4" rx="2"/>
    <text x="640" y="340" fill="${accent}" font-family="system-ui" font-size="56" text-anchor="middle">🤖</text>
    <text x="640" y="400" fill="${text}" font-family="system-ui" font-size="24" font-weight="700" text-anchor="middle">JSLAI RobotWeb Ultimate</text>
    <text x="640" y="432" fill="${text}" font-family="system-ui" font-size="14" text-anchor="middle" opacity="0.6">${step}</text>
    <rect fill="${accent}" x="560" y="460" width="160" height="28" rx="14" opacity="0.12"/>
    <text x="640" y="480" fill="${accent}" font-family="system-ui" font-size="11" font-weight="600" text-anchor="middle">🎭 SIMULATION</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function detect(task) {
  const t = task.toLowerCase();
  if (/booking|hotel|hôtel/.test(t)) { const m = task.match(/(?:à|in|on)\s+(\w+)/i); return { site: SITES.booking, name: 'booking', query: m?.[1] || 'Paris' }; }
  if (/github|repo/.test(t)) { const m = task.match(/(\w+)\s+(?:sur|on)\s+github/i) || task.match(/projet\s+(\w+)/i); return { site: SITES.github, name: 'github', query: m?.[1] || 'React' }; }
  if (/amazon|buy|prix|acheter/.test(t)) { const m = task.match(/(?:buy|prix|acheter)\s+(.+?)(?:\s+sur|$)/i); return { site: SITES.amazon, name: 'amazon', query: m?.[1]?.trim() || 'laptop' }; }
  if (/linkedin|job|emploi/.test(t)) { return { site: SITES.linkedin, name: 'linkedin', query: 'Developer' }; }
  if (/youtube|video|tutorial/.test(t)) { return { site: SITES.youtube, name: 'youtube', query: 'coding' }; }
  if (/twitter|tweet/.test(t)) { return { site: SITES.twitter, name: 'twitter', query: 'tech' }; }
  if (/reddit/.test(t)) { return { site: SITES.reddit, name: 'reddit', query: 'programming' }; }
  if (/wikipedia|wiki/.test(t)) { return { site: SITES.wikipedia, name: 'wikipedia', query: task }; }
  if (/imdb|movie|film/.test(t)) { return { site: SITES.imdb, name: 'imdb', query: 'Inception' }; }
  return { site: SITES.google, name: 'google', query: task.split(/\s+/).filter(w => w.length > 3).slice(0, 4).join(' ') || task };
}

async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({ 
      name: 'JSLAI Ultimate Simulation', 
      version: '5.0', 
      status: 'ready', 
      cost: 'FREE',
      sites: Object.entries(SITES).map(([id, s]) => ({ id, name: s.name, icon: s.icon })) 
    });
  }

  if (req.method === 'POST') {
    const encoder = new TextEncoder();
    const startTime = Date.now();
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (msg) => {
      res.write(`data: ${JSON.stringify({...msg, _t: Date.now()-startTime})}\n\n`);
    };

    try {
      const { task, expertMode = false, config = {} } = req.body;
      if (!task) { 
        send({ type: 'error', message: 'Task required' }); 
        res.end();
        return;
      }
      
      const { site, name, query } = detect(task);
      send({ type: 'init', mode: 'simulation', provider: 'internal', version: '5.0', site: name });
      send({ type: 'status', message: `🎭 Simulation: ${site.name}` });
      await new Promise(r => setTimeout(r, config.speed === 'fast' ? 100 : 300));
      
      send({ type: 'session', sessionId: `sim-${Date.now()}`, mode: 'simulation' });
      if (expertMode) send({ type: 'log', level: 'info', message: `Site: ${name}, Query: "${query}"` });
      
      const actions = [
        { type: 'navigate', url: site.url, description: `Go to ${site.name}` },
        { type: 'wait', description: 'Wait for load' },
        { type: 'type', selector: site.selector, text: query, description: `Type "${query}"` },
        { type: 'press', key: 'Enter', description: 'Submit' },
        { type: 'wait', description: 'Wait results' },
        { type: 'extract', description: 'Extract data' }
      ];
      
      send({ type: 'actions', actions: actions.map(a => ({...a, status: 'pending'})) });
      const steps = ['Connecting...', 'Loading...', `Typing: ${query}`, 'Searching...', 'Results...', 'Extracting...'];
      let url = site.url;
      
      for (let i = 0; i < actions.length; i++) {
        send({ type: 'action_start', index: i, action: actions[i].type, description: actions[i].description });
        if (expertMode) send({ type: 'log', level: 'debug', message: `Exec: ${actions[i].type}` });
        await new Promise(r => setTimeout(r, config.speed === 'fast' ? 150 : actions[i].type === 'navigate' ? 800 : 400));
        if (i >= 3) url = `${site.url}/search?q=${encodeURIComponent(query)}`;
        send({ 
          type: 'action_complete', 
          index: i, 
          success: true, 
          screenshot: genSVG(site, query, steps[i], (i+1)/actions.length), 
          url,
          metrics: expertMode ? { duration: Date.now()-startTime, memory: 45+Math.round(Math.random()*25) } : undefined 
        });
      }
      
      const results = site.generate(query);
      send({ 
        type: 'complete', 
        results, 
        finalUrl: url, 
        message: `✅ ${results.length} results`, 
        mode: 'simulation',
        stats: { totalTime: Date.now()-startTime, actions: actions.length, results: results.length } 
      });
    } catch (e) { 
      send({ type: 'error', message: e.message }); 
    }
    
    res.end();
  }
}

export default handler;

