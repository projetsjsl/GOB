/**
 * Supabase Watchlist API - Version simplifiée
 * Gestion de la watchlist avec Supabase
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Variables Supabase manquantes');
    return res.status(503).json({
      error: 'Configuration Supabase manquante',
      message: 'Configurez SUPABASE_URL et SUPABASE_ANON_KEY dans Vercel',
      helpUrl: 'https://vercel.com/projetsjsl/gob/settings/environment-variables'
    });
  }

  try {
    const { method } = req;
    const { action, tickers, userId = 'default' } = req.body || {};

    console.log(`🔧 Supabase Watchlist - ${method} ${action || 'GET'}`);

    // Créer le client Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    switch (method) {
      case 'GET':
        return await handleGet(supabase, userId, res);
      
      case 'POST':
        if (action === 'save') {
          return await handleSave(supabase, userId, tickers, res);
        } else if (action === 'add') {
          return await handleAdd(supabase, userId, tickers, res);
        } else if (action === 'remove') {
          return await handleRemove(supabase, userId, tickers, res);
        }
        return res.status(400).json({ error: 'Action POST invalide' });
      
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('❌ Erreur Supabase Watchlist:', error);
    return res.status(500).json({
      error: 'Erreur serveur Supabase',
      details: String(error?.message || error),
      timestamp: new Date().toISOString()
    });
  }
}

// Récupérer la watchlist
async function handleGet(supabase, userId, res) {
  try {
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = pas de ligne trouvée
      throw error;
    }

    const tickers = data?.tickers || [];
    
    return res.status(200).json({
      success: true,
      tickers,
      count: tickers.length,
      lastUpdated: data?.updated_at || new Date().toISOString(),
      source: 'supabase'
    });

  } catch (error) {
    console.error('Erreur GET Supabase:', error);
    return res.status(500).json({
      error: 'Erreur récupération watchlist',
      details: String(error?.message || error)
    });
  }
}

// Sauvegarder la watchlist complète
async function handleSave(supabase, userId, tickers, res) {
  if (!Array.isArray(tickers)) {
    return res.status(400).json({ error: 'tickers doit être un array' });
  }

  try {
    const watchlistData = {
      user_id: userId,
      tickers,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('watchlists')
      .upsert(watchlistData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Watchlist sauvegardée (${tickers.length} tickers)`,
      data: {
        tickers,
        count: tickers.length,
        lastUpdated: data.updated_at
      },
      source: 'supabase'
    });

  } catch (error) {
    console.error('Erreur SAVE Supabase:', error);
    return res.status(500).json({
      error: 'Erreur sauvegarde watchlist',
      details: String(error?.message || error)
    });
  }
}

// Ajouter un ticker
async function handleAdd(supabase, userId, ticker, res) {
  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'ticker requis (string)' });
  }

  try {
    // Récupérer la watchlist actuelle
    const { data: current, error: getError } = await supabase
      .from('watchlists')
      .select('tickers')
      .eq('user_id', userId)
      .single();

    if (getError && getError.code !== 'PGRST116') {
      throw getError;
    }

    const currentTickers = current?.tickers || [];
    
    // Vérifier si le ticker existe déjà
    if (currentTickers.includes(ticker)) {
      return res.status(200).json({
        success: true,
        message: `${ticker} déjà dans la watchlist`,
        data: {
          tickers: currentTickers,
          count: currentTickers.length
        }
      });
    }

    // Ajouter le ticker
    const updatedTickers = [...currentTickers, ticker];
    
    const { data, error } = await supabase
      .from('watchlists')
      .upsert({
        user_id: userId,
        tickers: updatedTickers,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `${ticker} ajouté à la watchlist`,
      data: {
        tickers: updatedTickers,
        count: updatedTickers.length,
        lastUpdated: data.updated_at
      },
      source: 'supabase'
    });

  } catch (error) {
    console.error('Erreur ADD Supabase:', error);
    return res.status(500).json({
      error: 'Erreur ajout ticker',
      details: String(error?.message || error)
    });
  }
}

// Supprimer un ticker
async function handleRemove(supabase, userId, ticker, res) {
  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'ticker requis (string)' });
  }

  try {
    // Récupérer la watchlist actuelle
    const { data: current, error: getError } = await supabase
      .from('watchlists')
      .select('tickers')
      .eq('user_id', userId)
      .single();

    if (getError && getError.code !== 'PGRST116') {
      throw getError;
    }

    const currentTickers = current?.tickers || [];
    
    // Vérifier si le ticker existe
    if (!currentTickers.includes(ticker)) {
      return res.status(200).json({
        success: true,
        message: `${ticker} n'était pas dans la watchlist`,
        data: {
          tickers: currentTickers,
          count: currentTickers.length
        }
      });
    }

    // Supprimer le ticker
    const updatedTickers = currentTickers.filter(t => t !== ticker);
    
    const { data, error } = await supabase
      .from('watchlists')
      .upsert({
        user_id: userId,
        tickers: updatedTickers,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `${ticker} supprimé de la watchlist`,
      data: {
        tickers: updatedTickers,
        count: updatedTickers.length,
        lastUpdated: data.updated_at
      },
      source: 'supabase'
    });

  } catch (error) {
    console.error('Erreur REMOVE Supabase:', error);
    return res.status(500).json({
      error: 'Erreur suppression ticker',
      details: String(error?.message || error)
    });
  }
}
