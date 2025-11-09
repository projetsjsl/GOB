/**
 * API de gestion du cache quotidien Supabase
 * 
 * GET /api/supabase-daily-cache?type=top_movers&date=2025-01-15
 * POST /api/supabase-daily-cache
 * 
 * Gère le cache des données de marché qui changent peu pendant la journée
 */

import { createClient } from '@supabase/supabase-js';

const MAX_CACHE_AGE_HOURS = 2; // Cache valide pendant 2 heures

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Configuration Supabase manquante',
        message: 'Configurez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Vercel'
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // GET : Récupérer depuis le cache
    if (req.method === 'GET') {
      const { type, date } = req.query;

      if (!type) {
        return res.status(400).json({
          success: false,
          error: 'Paramètre "type" requis (ex: top_movers, general_news, etc.)'
        });
      }

      const cacheDate = date || new Date().toISOString().split('T')[0]; // Date du jour par défaut

      console.log(`📦 Récupération cache: type=${type}, date=${cacheDate}`);

      // Récupérer le cache depuis Supabase
      const { data: cacheEntry, error } = await supabase
        .from('daily_market_cache')
        .select('*')
        .eq('date', cacheDate)
        .eq('cache_type', type)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('❌ Erreur récupération cache:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération du cache',
          details: error.message
        });
      }

      // Vérifier si le cache existe et est récent
      if (cacheEntry) {
        const updatedAt = new Date(cacheEntry.updated_at);
        const now = new Date();
        const ageHours = (now - updatedAt) / (1000 * 60 * 60);

        if (ageHours < MAX_CACHE_AGE_HOURS) {
          console.log(`✅ Cache trouvé et récent (${ageHours.toFixed(1)}h)`);
          return res.status(200).json({
            success: true,
            cached: true,
            data: cacheEntry.data,
            updated_at: cacheEntry.updated_at,
            age_hours: ageHours.toFixed(2)
          });
        } else {
          console.log(`⚠️ Cache expiré (${ageHours.toFixed(1)}h, max: ${MAX_CACHE_AGE_HOURS}h)`);
          return res.status(200).json({
            success: true,
            cached: false,
            expired: true,
            data: cacheEntry.data, // Retourner quand même les données expirées
            updated_at: cacheEntry.updated_at,
            age_hours: ageHours.toFixed(2)
          });
        }
      }

      // Cache non trouvé
      console.log('📭 Cache non trouvé');
      return res.status(200).json({
        success: true,
        cached: false,
        data: null
      });

    }

    // POST : Sauvegarder dans le cache
    if (req.method === 'POST') {
      const { type, date, data, update_times } = req.body;

      if (!type || !data) {
        return res.status(400).json({
          success: false,
          error: 'Paramètres "type" et "data" requis'
        });
      }

      const cacheDate = date || new Date().toISOString().split('T')[0];

      console.log(`💾 Sauvegarde cache: type=${type}, date=${cacheDate}`);

      // Insérer ou mettre à jour le cache
      const { data: cacheEntry, error } = await supabase
        .from('daily_market_cache')
        .upsert({
          date: cacheDate,
          cache_type: type,
          data: data,
          updated_at: new Date().toISOString(),
          update_times: update_times || []
        }, {
          onConflict: 'date,cache_type'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur sauvegarde cache:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la sauvegarde du cache',
          details: error.message
        });
      }

      console.log('✅ Cache sauvegardé avec succès');
      return res.status(200).json({
        success: true,
        cached: true,
        data: cacheEntry.data,
        updated_at: cacheEntry.updated_at
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Méthode non autorisée'
    });

  } catch (error) {
    console.error('❌ Erreur API cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
}

