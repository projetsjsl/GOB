// Client Frontend pour l'endpoint unifié /api/unified
export const api = {
  async status(test = false) {
    const url = `/api/unified?action=status${test ? '&test=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async finnhub(endpoint, symbol, extra = {}) {
    const params = new URLSearchParams({ action: 'finnhub', endpoint, symbol, ...extra });
    const res = await fetch(`/api/unified?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async news(query, limit = 20) {
    const params = new URLSearchParams({ action: 'news', q: query || '', limit: String(limit) });
    const res = await fetch(`/api/unified?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async gemini(message, prompt) {
    const res = await fetch('/api/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'gemini_chat', message, prompt })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async geminiKey() {
    const params = new URLSearchParams({ action: 'gemini_key' });
    const res = await fetch(`/api/unified?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async githubTickers(method = 'GET', payload) {
    if (method === 'GET') {
      const params = new URLSearchParams({ action: 'github_tickers' });
      const res = await fetch(`/api/unified?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }
    const res = await fetch('/api/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'github_tickers', ...payload })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async githubWatchlist(method = 'GET', payload) {
    if (method === 'GET') {
      const params = new URLSearchParams({ action: 'github_watchlist' });
      const res = await fetch(`/api/unified?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }
    const res = await fetch('/api/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'github_watchlist', ...payload })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async githubToken(action, file, data) {
    if (!action) {
      const params = new URLSearchParams({ action: 'github_token' });
      const res = await fetch(`/api/unified?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }
    const res = await fetch('/api/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Le routeur unifié lit action directement et attend les paramètres au même niveau
      body: JSON.stringify({ action: 'github_token', action: action, file, data })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async saveTickers(tickers) {
    const res = await fetch('/api/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_tickers', tickers })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async fallback(params) {
    const qs = new URLSearchParams({ action: 'fallback', ...params });
    const res = await fetch(`/api/unified?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async claude(prompt, ticker) {
    const res = await fetch('/api/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claude', prompt, ticker })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};
