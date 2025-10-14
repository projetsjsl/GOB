// ============================================================================
// API Endpoint: Supabase Briefings
// Gestion des briefings dans Supabase
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// Initialiser le client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur Supabase Briefings:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
}

// ============================================================================
// GET: Récupérer l'historique des briefings
// ============================================================================
async function handleGet(req, res) {
  try {
    const { 
      type, 
      limit = 10, 
      offset = 0,
      order = 'desc' 
    } = req.query;

    // Construire la requête
    let query = supabase
      .from('briefings')
      .select('*')
      .order('created_at', { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    // Filtrer par type si spécifié
    if (type && ['morning', 'noon', 'evening'].includes(type)) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count || 0
      }
    });

  } catch (error) {
    console.error('Erreur GET briefings:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la récupération des briefings',
      details: error.message 
    });
  }
}

// ============================================================================
// POST: Sauvegarder un nouveau briefing
// ============================================================================
async function handlePost(req, res) {
  try {
    const { 
      type, 
      subject, 
      html_content, 
      market_data, 
      analysis,
      recipients 
    } = req.body;

    // Validation des paramètres requis
    if (!type || !subject || !html_content) {
      return res.status(400).json({ 
        error: 'Paramètres manquants',
        required: ['type', 'subject', 'html_content']
      });
    }

    // Validation du type
    if (!['morning', 'noon', 'evening'].includes(type)) {
      return res.status(400).json({ 
        error: 'Type invalide. Utilisez: morning, noon, evening' 
      });
    }

    // Préparer les données
    const briefingData = {
      type,
      subject,
      html_content,
      market_data: market_data || null,
      analysis: analysis || null,
      recipients: recipients || null
    };

    // Insérer dans Supabase
    const { data, error } = await supabase
      .from('briefings')
      .insert([briefingData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data,
      message: 'Briefing sauvegardé avec succès'
    });

  } catch (error) {
    console.error('Erreur POST briefing:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde du briefing',
      details: error.message 
    });
  }
}

// ============================================================================
// DELETE: Supprimer un briefing
// ============================================================================
async function handleDelete(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID du briefing requis' });
    }

    // Supprimer de Supabase
    const { error } = await supabase
      .from('briefings')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Briefing supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur DELETE briefing:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la suppression du briefing',
      details: error.message 
    });
  }
}
