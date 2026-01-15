/**
 * API de Gestion des Conversations Emma
 * Gere la sauvegarde et recuperation des conversations avec permissions
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Methode non autorisee'
    });
  }

  const { action, user_id, session_id, messages, requesting_user_role } = req.body;

  try {

    // ============================================================
    // ACTION: SAVE - Sauvegarder une conversation
    // ============================================================
    if (action === 'save') {
      if (!user_id || !session_id || !messages) {
        return res.status(400).json({
          success: false,
          error: 'user_id, session_id et messages requis'
        });
      }

      // Verifier les permissions
      const canSave = await checkSavePermission(user_id);
      if (!canSave) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'avez pas la permission de sauvegarder les conversations'
        });
      }

      // Upsert (insert ou update) de la conversation
      const { data, error } = await supabase
        .from('conversation_history')
        .upsert({
          user_id,
          session_id,
          messages,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        })
        .select();

      if (error) {
        console.error('Erreur Supabase save:', error);
        throw error;
      }

      return res.status(200).json({
        success: true,
        message: 'Conversation sauvegardee',
        data: data[0]
      });
    }

    // ============================================================
    // ACTION: GET_LATEST - Recuperer la derniere conversation
    // ============================================================
    if (action === 'get_latest') {
      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'user_id requis'
        });
      }

      // Verifier les permissions
      const canView = await checkViewPermission(user_id, requesting_user_role);
      if (!canView) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'avez pas la permission de voir cet historique'
        });
      }

      const { data, error } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', user_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour eviter l'erreur si pas de resultat

      if (error) {
        console.error('Erreur Supabase get_latest:', error);
        throw error;
      }

      return res.status(200).json({
        success: true,
        messages: data?.messages || [],
        session_id: data?.session_id || null
      });
    }

    // ============================================================
    // ACTION: GET_HISTORY - Recuperer toutes les conversations d'un user
    // ============================================================
    if (action === 'get_history') {
      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'user_id requis'
        });
      }

      // Verifier les permissions
      const canView = await checkViewPermission(user_id, requesting_user_role);
      if (!canView) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'avez pas la permission de voir cet historique'
        });
      }

      const { data, error } = await supabase
        .from('conversation_history')
        .select('id, session_id, created_at, updated_at, messages')
        .eq('user_id', user_id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur Supabase get_history:', error);
        throw error;
      }

      return res.status(200).json({
        success: true,
        conversations: data || []
      });
    }

    // ============================================================
    // ACTION: GET_ALL_USERS - Recuperer les conversations de TOUS les users (ADMIN ONLY)
    // ============================================================
    if (action === 'get_all_users') {
      // Verifier que c'est un admin
      if (requesting_user_role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Acces reserve aux administrateurs'
        });
      }

      // Recuperer toutes les conversations groupees par user
      const { data, error } = await supabase
        .from('conversation_history')
        .select('user_id, session_id, created_at, updated_at, messages')
        .order('updated_at', { ascending: false })
        .limit(200); // Limiter a 200 dernieres conversations

      if (error) {
        console.error('Erreur Supabase get_all_users:', error);
        throw error;
      }

      // Grouper par user_id
      const groupedByUser = {};
      data.forEach(conv => {
        if (!groupedByUser[conv.user_id]) {
          groupedByUser[conv.user_id] = [];
        }
        groupedByUser[conv.user_id].push(conv);
      });

      return res.status(200).json({
        success: true,
        users: Object.keys(groupedByUser),
        conversations_by_user: groupedByUser,
        total_conversations: data.length
      });
    }

    // ============================================================
    // ACTION: DELETE_SESSION - Supprimer une session
    // ============================================================
    if (action === 'delete_session') {
      if (!session_id) {
        return res.status(400).json({
          success: false,
          error: 'session_id requis'
        });
      }

      // Recuperer la conversation pour verifier les permissions
      const { data: conv, error: fetchError } = await supabase
        .from('conversation_history')
        .select('user_id')
        .eq('session_id', session_id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Verifier que c'est le proprietaire ou un admin
      if (conv.user_id !== user_id && requesting_user_role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Vous ne pouvez supprimer que vos propres conversations'
        });
      }

      const { error: deleteError } = await supabase
        .from('conversation_history')
        .delete()
        .eq('session_id', session_id);

      if (deleteError) {
        throw deleteError;
      }

      return res.status(200).json({
        success: true,
        message: 'Conversation supprimee'
      });
    }

    // ============================================================
    // ACTION NON RECONNUE
    // ============================================================
    return res.status(400).json({
      success: false,
      error: 'Action non reconnue',
      available_actions: ['save', 'get_latest', 'get_history', 'get_all_users', 'delete_session']
    });

  } catch (error) {
    console.error('Erreur API Conversation:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
}

/**
 * Verifie si un utilisateur peut sauvegarder des conversations
 */
async function checkSavePermission(user_id) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('username', user_id)
      .single();

    if (error) {
      console.error('Erreur verification permission:', error);
      return false;
    }

    // Seuls daniel, gob et admin peuvent sauvegarder
    return ['daniel', 'gob', 'admin'].includes(data.role);

  } catch (error) {
    console.error('Erreur checkSavePermission:', error);
    return false;
  }
}

/**
 * Verifie si un utilisateur peut voir un historique
 */
async function checkViewPermission(target_user_id, requesting_user_role) {
  // Admin peut tout voir
  if (requesting_user_role === 'admin') {
    return true;
  }

  // Les users peuvent voir seulement leur propre historique
  // Et seulement si ils ont la permission view_own_history (daniel, gob, admin)
  const allowedRoles = ['daniel', 'gob', 'admin'];

  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('username', target_user_id)
      .single();

    if (error) {
      return false;
    }

    return allowedRoles.includes(data.role);

  } catch (error) {
    console.error('Erreur checkViewPermission:', error);
    return false;
  }
}
