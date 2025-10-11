// ========================================
// GEMINI FUNCTION CALLING - Déclarations & Exécution
// ========================================

export const functionDeclarations = [
  {
    name: 'getStockPrice',
    description: 'Obtenir le prix actuel et métriques d’un titre boursier (source: marketdata unifiée).',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getNews',
    description: 'Récupérer des actualités récentes liées à un titre ou un thème.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Mot-clé ou symbole, ex: AAPL, GOOGL, “banques canadiennes”' },
        limit: { type: 'NUMBER', description: 'Nombre maximum d’articles (défaut 5)' }
      },
      required: ['query']
    }
  },
  {
    name: 'compareTickers',
    description: 'Comparer rapidement plusieurs tickers sur prix et variation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbols: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Liste de symboles, ex: ["AAPL", "MSFT"]' }
      },
      required: ['symbols']
    }
  },
  {
    name: 'getFundamentals',
    description: 'Récupérer des fondamentaux (P/E, EV/EBITDA, ROE, marges, dividende, etc.).',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' }
      },
      required: ['symbol']
    }
  }
];

const getBaseUrl = () => {
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
};

export async function executeFunction(name, args = {}) {
  switch (name) {
    case 'getStockPrice': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/marketdata?endpoint=quote&symbol=${encodeURIComponent(symbol)}&source=auto`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`marketdata quote error: ${r.status}`);
      const d = await r.json();
      return {
        symbol,
        price: d.c ?? null,
        change: d.d ?? null,
        changePercent: d.dp ?? null,
        high: d.h ?? null,
        low: d.l ?? null,
        open: d.o ?? null,
        previousClose: d.pc ?? null
      };
    }
    case 'getNews': {
      const query = String(args.query || '').trim();
      const limit = Number(args.limit || 5);
      if (!query) throw new Error('Paramètre query requis');
      const url = `${getBaseUrl()}/api/news?q=${encodeURIComponent(query)}&limit=${limit}&strict=true`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`news error: ${r.status}`);
      const d = await r.json();
      return { query, items: d?.articles || d?.items || d || [] };
    }
    case 'compareTickers': {
      const symbols = Array.isArray(args.symbols) ? args.symbols : [];
      if (!symbols.length) throw new Error('Paramètre symbols requis (array)');
      const results = [];
      for (const s of symbols) {
        try {
          const one = await executeFunction('getStockPrice', { symbol: s });
          results.push(one);
        } catch (e) {
          results.push({ symbol: s, error: String(e?.message || e) });
        }
      }
      return { results };
    }
    case 'getFundamentals': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/marketdata?endpoint=fundamentals&symbol=${encodeURIComponent(symbol)}&source=auto`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`marketdata fundamentals error: ${r.status}`);
      const d = await r.json();
      return d;
    }
    default:
      throw new Error(`Fonction inconnue: ${name}`);
  }
}
