/**
 * API de gestion du cache quotidien Supabase
 * 
 * GET /api/supabase-daily-cache?type=top_movers&date=2025-01-15
 * POST /api/supabase-daily-cache
 * 
 * Gere le cache des donnees de marche qui changent peu pendant la journee
 */

import { createClient } from '@supabase/supabase-js';

// Duree du cache par defaut (peut etre modifiee via parametre)
const DEFAULT_MAX_CACHE_AGE_HOURS = 4; // Cache valide pendant 4 heures par defaut

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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

    // GET : Recuperer depuis le cache
    if (req.method === 'GET') {
      const { type, date } = req.query;

      // Endpoint special pour recuperer le statut de tous les caches
      if (type === 'status') {
        const today = new Date().toISOString().split('T')[0];
        const cacheTypes = ['top_movers', 'general_news', 'ticker_news', 'gemini_analysis', 'top_movers_news'];
        const status = {};

        for (const cacheType of cacheTypes) {
          try {
            const { data: cacheEntry } = await supabase
              .from('daily_market_cache')
              .select('*')
              .eq('date', today)
              .eq('cache_type', cacheType)
              .single();

            if (cacheEntry) {
              const updatedAt = new Date(cacheEntry.updated_at);
              const now = new Date();
              const ageHours = (now - updatedAt) / (1000 * 60 * 60);
            const maxAgeHours = parseInt(req.query.maxAgeHours) || DEFAULT_MAX_CACHE_AGE_HOURS;
              status[cacheType] = {
                exists: true,
                age_hours: ageHours.toFixed(2),
                expired: ageHours >= maxAgeHours,
                updated_at: cacheEntry.updated_at,
                max_age_hours: maxAgeHours
              };
            } else {
              status[cacheType] = {
                exists: false,
                expired: true
              };
            }
          } catch (error) {
            status[cacheType] = {
              exists: false,
              error: error.message
            };
          }
        }

        const maxAgeHours = parseInt(req.query.maxAgeHours) || DEFAULT_MAX_CACHE_AGE_HOURS;
        return res.status(200).json({
          success: true,
          status,
          max_age_hours: maxAgeHours
        });
      }

      if (!type) {
        return res.status(400).json({
          success: false,
          error: 'Parametre "type" requis (ex: top_movers, general_news, etc.) ou "status" pour le statut global'
        });
      }

      const cacheDate = date || new Date().toISOString().split('T')[0]; // Date du jour par defaut
      // Recuperer la duree max du cache depuis les parametres (defaut: 4h)
      const maxAgeHours = parseInt(req.query.maxAgeHours) || DEFAULT_MAX_CACHE_AGE_HOURS;

      console.log(` Recuperation cache: type=${type}, date=${cacheDate}, maxAge=${maxAgeHours}h`);

      // Recuperer le cache depuis Supabase
      const { data: cacheEntry, error } = await supabase
        .from('daily_market_cache')
        .select('*')
        .eq('date', cacheDate)
        .eq('cache_type', type)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error(' Erreur recuperation cache:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la recuperation du cache',
          details: error.message
        });
      }

      // Verifier si le cache existe et est recent
      if (cacheEntry) {
        const updatedAt = new Date(cacheEntry.updated_at);
        const now = new Date();
        const ageHours = (now - updatedAt) / (1000 * 60 * 60);

        if (ageHours < maxAgeHours) {
          console.log(` Cache trouve et recent (${ageHours.toFixed(1)}h, max: ${maxAgeHours}h)`);
          return res.status(200).json({
            success: true,
            cached: true,
            data: cacheEntry.data,
            updated_at: cacheEntry.updated_at,
            age_hours: ageHours.toFixed(2),
            max_age_hours: maxAgeHours
          });
        } else {
          console.log(` Cache expire (${ageHours.toFixed(1)}h, max: ${maxAgeHours}h)`);
          return res.status(200).json({
            success: true,
            cached: false,
            expired: true,
            data: cacheEntry.data, // Retourner quand meme les donnees expirees
            updated_at: cacheEntry.updated_at,
            age_hours: ageHours.toFixed(2),
            max_age_hours: maxAgeHours
          });
        }
      }

      // Cache non trouve
      console.log(' Cache non trouve');
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
          error: 'Parametres "type" et "data" requis'
        });
      }

      const cacheDate = date || new Date().toISOString().split('T')[0];

      console.log(` Sauvegarde cache: type=${type}, date=${cacheDate}`);

      // Inserer ou mettre a jour le cache
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
        console.error(' Erreur sauvegarde cache:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la sauvegarde du cache',
          details: error.message
        });
      }

      console.log(' Cache sauvegarde avec succes');
      return res.status(200).json({
        success: true,
        cached: true,
        data: cacheEntry.data,
        updated_at: cacheEntry.updated_at
      });
    }

    // DELETE : Vider le cache
    if (req.method === 'DELETE') {
      const today = new Date().toISOString().split('T')[0];
      
      try {
        const { error } = await supabase
          .from('daily_market_cache')
          .delete()
          .eq('date', today);

        if (error) {
          throw error;
        }

        console.log(' Cache vide pour la date:', today);
        return res.status(200).json({
          success: true,
          message: 'Cache vide avec succes',
          date: today
        });
      } catch (error) {
        console.error(' Erreur vidage cache:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors du vidage du cache',
          details: error.message
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Methode non autorisee'
    });

  } catch (error) {
    console.error(' Erreur API cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
}

