/**
 * Conversation Manager - Gestion des conversations multi-canal
 *
 * Gère la création, récupération et mise à jour des conversations
 * à travers tous les canaux de communication.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Obtient ou crée une conversation pour un utilisateur et un canal
 *
 * @param {string} userProfileId - ID du profil utilisateur
 * @param {string} channel - Le canal ('web', 'email', 'sms', 'messenger')
 * @param {string} channelIdentifier - Identifiant du canal (email, phone, etc.)
 * @returns {Promise<object>} La conversation
 */
export async function getOrCreateConversation(userProfileId, channel, channelIdentifier) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Chercher conversation active existante
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', userProfileId)
      .eq('channel', channel)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (existingConversation && !fetchError) {
      console.log(`[Conversation Manager] Conversation existante: ${existingConversation.id}`);
      return existingConversation;
    }

    // Créer nouvelle conversation
    const newConversation = {
      user_id: userProfileId,
      session_id: generateSessionId(),
      channel: channel,
      channel_identifier: channelIdentifier,
      messages: [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: created, error: createError } = await supabase
      .from('conversation_history')
      .insert([newConversation])
      .select()
      .single();

    if (createError) {
      console.error('[Conversation Manager] Erreur création conversation:', createError);
      throw createError;
    }

    console.log(`[Conversation Manager] Nouvelle conversation créée: ${created.id}`);
    return created;

  } catch (error) {
    console.error('[Conversation Manager] Erreur getOrCreateConversation:', error);
    throw error;
  }
}

/**
 * Ajoute un message à une conversation
 *
 * @param {string} conversationId - ID de la conversation
 * @param {object} message - Le message à ajouter
 * @returns {Promise<object>} La conversation mise à jour
 */
export async function addMessageToConversation(conversationId, message) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Récupérer la conversation actuelle
    const { data: conversation, error: fetchError } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      console.error('[Conversation Manager] Conversation non trouvée:', fetchError);
      throw fetchError;
    }

    // Ajouter le message
    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });

    // Mettre à jour la conversation
    const { data: updated, error: updateError } = await supabase
      .from('conversation_history')
      .update({
        messages: messages,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError) {
      console.error('[Conversation Manager] Erreur mise à jour conversation:', updateError);
      throw updateError;
    }

    return updated;

  } catch (error) {
    console.error('[Conversation Manager] Erreur addMessageToConversation:', error);
    throw error;
  }
}

/**
 * Sauvegarde une paire question/réponse dans la conversation
 *
 * @param {string} conversationId - ID de la conversation
 * @param {string} userMessage - Message de l'utilisateur
 * @param {string} assistantResponse - Réponse d'Emma
 * @param {object} metadata - Métadonnées (modèle utilisé, outils, etc.)
 * @returns {Promise<object>} La conversation mise à jour
 */
export async function saveConversationTurn(conversationId, userMessage, assistantResponse, metadata = {}) {
  try {
    // Ajouter le message utilisateur
    await addMessageToConversation(conversationId, {
      role: 'user',
      content: userMessage
    });

    // Ajouter la réponse de l'assistant
    return await addMessageToConversation(conversationId, {
      role: 'assistant',
      content: assistantResponse,
      metadata: metadata
    });

  } catch (error) {
    console.error('[Conversation Manager] Erreur saveConversationTurn:', error);
    throw error;
  }
}

/**
 * Récupère l'historique d'une conversation
 *
 * @param {string} conversationId - ID de la conversation
 * @param {number} limit - Nombre max de messages (0 = tous)
 * @returns {Promise<object[]>} Les messages
 */
export async function getConversationHistory(conversationId, limit = 0) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: conversation, error } = await supabase
      .from('conversation_history')
      .select('messages')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('[Conversation Manager] Erreur récupération historique:', error);
      return [];
    }

    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];

    if (limit > 0) {
      return messages.slice(-limit);
    }

    return messages;

  } catch (error) {
    console.error('[Conversation Manager] Erreur getConversationHistory:', error);
    return [];
  }
}

/**
 * Récupère toutes les conversations d'un utilisateur
 *
 * @param {string} userProfileId - ID du profil utilisateur
 * @param {string} channel - Filtrer par canal (optionnel)
 * @returns {Promise<object[]>} Les conversations
 */
export async function getUserConversations(userProfileId, channel = null) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let query = supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', userProfileId)
      .order('updated_at', { ascending: false });

    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Conversation Manager] Erreur récupération conversations:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('[Conversation Manager] Erreur getUserConversations:', error);
    return [];
  }
}

/**
 * Marque une conversation comme terminée
 *
 * @param {string} conversationId - ID de la conversation
 * @returns {Promise<object>} La conversation mise à jour
 */
export async function closeConversation(conversationId) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('conversation_history')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      console.error('[Conversation Manager] Erreur fermeture conversation:', error);
      throw error;
    }

    console.log(`[Conversation Manager] Conversation fermée: ${conversationId}`);
    return data;

  } catch (error) {
    console.error('[Conversation Manager] Erreur closeConversation:', error);
    throw error;
  }
}

/**
 * Supprime les anciennes conversations inactives
 *
 * @param {number} daysOld - Supprimer les conversations de plus de X jours
 * @returns {Promise<number>} Nombre de conversations supprimées
 */
export async function cleanupOldConversations(daysOld = 90) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('conversation_history')
      .delete()
      .lt('updated_at', cutoffDate.toISOString())
      .eq('status', 'closed')
      .select();

    if (error) {
      console.error('[Conversation Manager] Erreur nettoyage conversations:', error);
      return 0;
    }

    const count = data ? data.length : 0;
    console.log(`[Conversation Manager] ${count} conversations nettoyées (>${daysOld} jours)`);
    return count;

  } catch (error) {
    console.error('[Conversation Manager] Erreur cleanupOldConversations:', error);
    return 0;
  }
}

/**
 * Génère un ID de session unique (UUID)
 *
 * @returns {string} Session ID (UUID format)
 */
function generateSessionId() {
  // Node.js 16+ has crypto.randomUUID() built-in
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Formatte l'historique pour le contexte d'Emma
 *
 * @param {object[]} messages - Les messages de la conversation
 * @param {number} maxMessages - Nombre max de messages à inclure
 * @returns {object[]} Historique formaté pour Emma
 */
export function formatHistoryForEmma(messages, maxMessages = 10) {
  const recentMessages = messages.slice(-maxMessages);

  return recentMessages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));
}

export default {
  getOrCreateConversation,
  addMessageToConversation,
  saveConversationTurn,
  getConversationHistory,
  getUserConversations,
  closeConversation,
  cleanupOldConversations,
  formatHistoryForEmma
};
