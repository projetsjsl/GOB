/**
 * API d'Authentification GOB
 * Gère la connexion, déconnexion et validation des utilisateurs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Configuration des utilisateurs et permissions
 */
const USER_ROLES = {
  invite: {
    display_name: 'Invité',
    permissions: {
      view_dashboard: true,
      view_emma: true,
      save_conversations: false,
      view_own_history: false,
      view_all_history: false
    }
  },
  client: {
    display_name: 'Client',
    permissions: {
      view_dashboard: true,
      view_emma: true,
      save_conversations: false,
      view_own_history: false,
      view_all_history: false
    }
  },
  daniel: {
    display_name: 'Daniel',
    permissions: {
      view_dashboard: true,
      view_emma: true,
      save_conversations: true,
      view_own_history: true,
      view_all_history: false
    }
  },
  gob: {
    display_name: 'GOB',
    permissions: {
      view_dashboard: true,
      view_emma: true,
      save_conversations: true,
      view_own_history: true,
      view_all_history: false
    }
  },
  admin: {
    display_name: 'Admin',
    permissions: {
      view_dashboard: true,
      view_emma: true,
      save_conversations: true,
      view_own_history: true,
      view_all_history: true
    }
  }
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { action, username, password } = req.body;

  try {

    // ============================================================
    // ACTION: LOGIN
    // ============================================================
    if (action === 'login') {
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Nom d\'utilisateur et mot de passe requis'
        });
      }

      const normalizedUsername = username.toLowerCase().trim();

      // Vérifier si l'utilisateur existe dans la config
      if (!USER_ROLES[normalizedUsername]) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non reconnu'
        });
      }

      // Validation: mot de passe = nom d'utilisateur
      if (password.toLowerCase().trim() !== normalizedUsername) {
        return res.status(401).json({
          success: false,
          error: 'Mot de passe incorrect'
        });
      }

      // Vérifier/Créer l'utilisateur dans Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', normalizedUsername)
        .single();

      let userData;

      if (fetchError && fetchError.code === 'PGRST116') {
        // Utilisateur n'existe pas, le créer
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            username: normalizedUsername,
            display_name: USER_ROLES[normalizedUsername].display_name,
            role: normalizedUsername,
            last_login: new Date().toISOString()
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Erreur création utilisateur:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            username: normalizedUsername,
            role: normalizedUsername
          });

          // Provide more specific error message based on the error
          if (insertError.message && insertError.message.includes('pattern')) {
            throw new Error(`Erreur de validation: ${insertError.message}. Vérifiez la configuration de la base de données.`);
          } else if (insertError.message && insertError.message.includes('policy')) {
            throw new Error('Erreur de permissions: Exécutez le script supabase-auth-migration.sql dans votre base de données.');
          } else {
            throw new Error(`Erreur lors de la création de l'utilisateur: ${insertError.message || 'Erreur inconnue'}`);
          }
        }

        userData = newUser;
      } else if (existingUser) {
        // Mettre à jour le last_login
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('username', normalizedUsername)
          .select()
          .single();

        if (updateError) {
          console.error('Erreur mise à jour utilisateur:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            username: normalizedUsername
          });

          // Provide more specific error message
          if (updateError.message && updateError.message.includes('policy')) {
            throw new Error('Erreur de permissions: Exécutez le script supabase-auth-migration.sql dans votre base de données.');
          } else if (updateError.message && updateError.message.includes('pattern')) {
            throw new Error(`Erreur de validation: ${updateError.message}. Vérifiez la configuration de la base de données.`);
          }
          // If update fails, we can still continue with existing user data
          console.warn('Continuing with existing user data despite update error');
        }

        userData = updatedUser || existingUser;
      } else {
        console.error('Erreur récupération utilisateur:', {
          code: fetchError?.code,
          message: fetchError?.message,
          details: fetchError?.details,
          username: normalizedUsername
        });
        throw fetchError;
      }

      // Retourner les infos utilisateur avec permissions
      return res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        user: {
          id: userData.id,
          username: normalizedUsername,
          display_name: USER_ROLES[normalizedUsername].display_name,
          role: normalizedUsername,
          permissions: USER_ROLES[normalizedUsername].permissions
        }
      });
    }

    // ============================================================
    // ACTION: VALIDATE (vérifier si la session est valide)
    // ============================================================
    if (action === 'validate') {
      const { username: validateUsername } = req.body;

      if (!validateUsername) {
        return res.status(400).json({
          success: false,
          error: 'Nom d\'utilisateur requis'
        });
      }

      const normalizedUsername = validateUsername.toLowerCase().trim();

      if (!USER_ROLES[normalizedUsername]) {
        return res.status(401).json({
          success: false,
          error: 'Session invalide'
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          username: normalizedUsername,
          display_name: USER_ROLES[normalizedUsername].display_name,
          role: normalizedUsername,
          permissions: USER_ROLES[normalizedUsername].permissions
        }
      });
    }

    // ============================================================
    // ACTION: GET_PERMISSIONS
    // ============================================================
    if (action === 'get_permissions') {
      const { username: permUsername } = req.body;

      if (!permUsername) {
        return res.status(400).json({
          success: false,
          error: 'Nom d\'utilisateur requis'
        });
      }

      const normalizedUsername = permUsername.toLowerCase().trim();

      if (!USER_ROLES[normalizedUsername]) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      return res.status(200).json({
        success: true,
        permissions: USER_ROLES[normalizedUsername].permissions
      });
    }

    // ============================================================
    // ACTION NON RECONNUE
    // ============================================================
    return res.status(400).json({
      success: false,
      error: 'Action non reconnue',
      available_actions: ['login', 'validate', 'get_permissions']
    });

  } catch (error) {
    console.error('Erreur API Auth:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'authentification',
      details: error.message
    });
  }
}
