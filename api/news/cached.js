import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { type = 'general', symbol, limit = 20 } = req.query;
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  try {
    if (type === 'symbol' && symbol) {
      // Nouvelles spécifiques au symbole
      const cacheAge = 15; // minutes
      const cutoff = new Date(Date.now() - cacheAge * 60000).toISOString();
      
      const { data, error } = await supabase
        .from('symbol_news_cache')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .gte('updated_at', cutoff)
        .order('published_at', { ascending: false })
        .limit(parseInt(limit));
      
      if (error) throw error;
      
      // Si cache vide ou trop vieux, déclencher refresh
      if (!data || data.length === 0) {
        return res.status(200).json({
          data: [],
          cached: false,
          needsRefresh: true,
          message: 'Cache vide, refresh nécessaire',
          symbol: symbol.toUpperCase(),
          cacheAge: cacheAge
        });
      }
      
      return res.status(200).json({
        data,
        cached: true,
        cacheAge: cacheAge,
        count: data.length,
        symbol: symbol.toUpperCase(),
        sources: [...new Set(data.map(item => item.source))],
        lastUpdated: data[0]?.updated_at
      });
    }
    
    // Nouvelles générales
    const cacheAge = 30; // minutes
    const cutoff = new Date(Date.now() - cacheAge * 60000).toISOString();
    
    const { data, error } = await supabase
      .from('market_news_cache')
      .select('*')
      .gte('updated_at', cutoff)
      .order('published_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(200).json({
        data: [],
        cached: false,
        needsRefresh: true,
        message: 'Cache vide, refresh nécessaire',
        cacheAge: cacheAge
      });
    }
    
    return res.status(200).json({
      data,
      cached: true,
      cacheAge: cacheAge,
      count: data.length,
      sources: [...new Set(data.map(item => item.source))],
      lastUpdated: data[0]?.updated_at
    });
    
  } catch (error) {
    console.error('❌ Erreur cache nouvelles:', error);
    return res.status(500).json({ 
      error: error.message,
      fallback: 'Utiliser API directe',
      timestamp: new Date().toISOString()
    });
  }
}
