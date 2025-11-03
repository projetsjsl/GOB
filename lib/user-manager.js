/**
 * User Manager - Gestion des utilisateurs unifiés multi-canal
 *
 * Permet d'identifier et gérer les utilisateurs à travers différents canaux
 * (web, email, SMS, messenger) avec un profil unifié.
 */

import { createClient } from '@supabase/supabase-js';

// Mapping des champs selon le canal
const channelFieldMap = {
  email: 'email',
  sms: 'phone',
  messenger: 'messenger_id',
  web: 'email' // Par défaut, web utilise email
};

/**
 * Obtient ou crée un profil utilisateur unifié
 *
 * @param {string} identifier - L'identifiant (email, phone, messenger_id)
 * @param {string} channel - Le canal ('email', 'sms', 'messenger', 'web')
 * @param {object} metadata - Métadonnées supplémentaires (name, etc.)
 * @returns {Promise<object>} Le profil utilisateur
 */
export async function getOrCreateUserProfile(identifier, channel, metadata = {}) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const fieldName = channelFieldMap[channel] || 'email';

    // Chercher utilisateur existant
    const { data: existingUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq(fieldName, identifier)
      .single();

    if (existingUser && !fetchError) {
      console.log(`[User Manager] Utilisateur existant trouvé: ${existingUser.id}`);
      return existingUser;
    }

    // Créer nouvel utilisateur
    const newUserData = {
      [fieldName]: identifier,
      name: metadata.name || identifier,
      metadata: metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newUser, error: createError } = await supabase
      .from('user_profiles')
      .insert([newUserData])
      .select()
      .single();

    if (createError) {
      console.error('[User Manager] Erreur création utilisateur:', createError);
      throw createError;
    }

    console.log(`[User Manager] Nouvel utilisateur créé: ${newUser.id}`);
    return newUser;

  } catch (error) {
    console.error('[User Manager] Erreur getOrCreateUserProfile:', error);
    throw error;
  }
}

/**
 * Met à jour le profil d'un utilisateur
 *
 * @param {string} userId - ID de l'utilisateur
 * @param {object} updates - Données à mettre à jour
 * @returns {Promise<object>} Le profil mis à jour
 */
export async function updateUserProfile(userId, updates) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[User Manager] Erreur mise à jour utilisateur:', error);
      throw error;
    }

    console.log(`[User Manager] Utilisateur mis à jour: ${userId}`);
    return data;

  } catch (error) {
    console.error('[User Manager] Erreur updateUserProfile:', error);
    throw error;
  }
}

/**
 * Récupère un utilisateur par son ID
 *
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<object|null>} Le profil utilisateur ou null
 */
export async function getUserById(userId) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[User Manager] Erreur récupération utilisateur:', error);
      return null;
    }

    return data;

  } catch (error) {
    console.error('[User Manager] Erreur getUserById:', error);
    return null;
  }
}

/**
 * Récupère un utilisateur par identifiant de canal
 *
 * @param {string} identifier - L'identifiant (email, phone, messenger_id)
 * @param {string} channel - Le canal
 * @returns {Promise<object|null>} Le profil utilisateur ou null
 */
export async function getUserByChannelIdentifier(identifier, channel) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const fieldName = channelFieldMap[channel] || 'email';

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq(fieldName, identifier)
      .single();

    if (error) {
      console.error('[User Manager] Utilisateur non trouvé:', error);
      return null;
    }

    return data;

  } catch (error) {
    console.error('[User Manager] Erreur getUserByChannelIdentifier:', error);
    return null;
  }
}

/**
 * Lie un nouveau canal à un utilisateur existant
 *
 * @param {string} userId - ID de l'utilisateur
 * @param {string} channel - Le nouveau canal
 * @param {string} identifier - L'identifiant du canal
 * @returns {Promise<object>} Le profil mis à jour
 */
export async function linkChannelToUser(userId, channel, identifier) {
  try {
    const fieldName = channelFieldMap[channel];

    if (!fieldName) {
      throw new Error(`Canal non supporté: ${channel}`);
    }

    return await updateUserProfile(userId, {
      [fieldName]: identifier
    });

  } catch (error) {
    console.error('[User Manager] Erreur linkChannelToUser:', error);
    throw error;
  }
}

export default {
  getOrCreateUserProfile,
  updateUserProfile,
  getUserById,
  getUserByChannelIdentifier,
  linkChannelToUser
};
