/**
 * API d'Authentification GOB
 * Gère la connexion, déconnexion et validation des utilisateurs
 * Gère maintenant la gestion des utilisateurs (CRUD) via Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  } else {
    console.error('⚠️ Supabase credentials missing (SUPABASE_URL or SUPABASE_KEY)');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

// Fallback roles only used for bootstrapping/fallback if DB is empty
const DEFAULT_ROLES_FALLBACK = {
  invite: {
    display_name: 'Invité',
    permissions: { view_dashboard: true, view_emma: true, save_conversations: false, view_own_history: false, view_all_history: false }
  },
  client: {
    display_name: 'Client',
    permissions: { view_dashboard: true, view_emma: true, save_conversations: false, view_own_history: false, view_all_history: false }
  },
  daniel: {
    display_name: 'Daniel',
    permissions: { view_dashboard: true, view_emma: true, save_conversations: true, view_own_history: true, view_all_history: false }
  },
  gob: {
    display_name: 'GOB',
    permissions: { view_dashboard: true, view_emma: true, save_conversations: true, view_own_history: true, view_all_history: false }
  },
  admin: {
    display_name: 'Admin',
    permissions: { view_dashboard: true, view_emma: true, save_conversations: true, view_own_history: true, view_all_history: true }
  }
};

export default async function handler(req, res) {
  try {
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

    if (!supabase) {
      return res.status(503).json({ error: 'Service Unavailable: Database not configured' });
    }

    const { action, username, password, ...payload } = req.body;

    // ============================================================
    // ACTION: LOGIN
    // ============================================================
    if (action === 'login') {
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Identifiants requis' });
      }

      const normalizedUsername = username.toLowerCase().trim();

      // Fetch user from DB
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', normalizedUsername)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('DB Login Error:', error);
        return res.status(500).json({ success: false, error: 'Erreur base de données' });
      }

      // 1. User found in DB
      if (user) {
        // Password check (Simple: password == username for legacy reasons, or future real auth)
        if (password.toLowerCase().trim() !== normalizedUsername) {
           return res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
        }

        // Update last_login
        await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

        return res.status(200).json({
          success: true,
          message: 'Connexion réussie',
          user: user
        });
      }

      // 2. User NOT found in DB -> Check Fallback/Bootstrap
      // This allows auto-creation of default users if they were wiped or don't exist yet
      if (DEFAULT_ROLES_FALLBACK[normalizedUsername]) {
        if (password.toLowerCase().trim() !== normalizedUsername) {
           return res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
        }

        const defaultData = DEFAULT_ROLES_FALLBACK[normalizedUsername];
        
        // Auto-create in DB for future
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            username: normalizedUsername,
            display_name: defaultData.display_name,
            role: normalizedUsername,
            permissions: defaultData.permissions,
            last_login: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) {
          console.warn('Failed to bootstrap user:', createError);
          // Return memory object if DB write fails (e.g. migration pending)
          return res.status(200).json({
             success: true, 
             message: 'Connexion (Mode Fallback)',
             user: { 
                 username: normalizedUsername, 
                 ...defaultData 
             }
          });
        }

        return res.status(200).json({ success: true, user: newUser });
      }

      return res.status(401).json({ success: false, error: 'Utilisateur inconnu' });
    }

    // ============================================================
    // ACTION: VALIDATE SESSION
    // ============================================================
    if (action === 'validate') {
       if (!username) return res.status(400).json({ success: false });
       
       const { data: user } = await supabase
         .from('users')
         .select('*')
         .eq('username', username)
         .single();
         
       if (!user) return res.status(401).json({ success: false });
       return res.status(200).json({ success: true, user });
    }


    // ============================================================
    // ADMIN ACTIONS (Require 'admin' role or 'manage_users' permission logic)
    // For simplicity, we check if the requesting user has role='admin'
    // The request body MUST include 'admin_username' to verify authority
    // In a real app, this would be a JWT/Session token check.
    // ============================================================
    const { admin_username } = req.body;
    
    // Helper to try fetching from multiple potential user tables
    const findUserInTables = async (username) => {
        const TABLES = ['users', 'user_profiles', 'profiles'];
        for (const table of TABLES) {
            const { data, error } = await supabase.from(table).select('*').eq('username', username).single();
            if (data && !error) return { user: data, table };
            if (error && error.code !== 'PGRST116' && error.code !== '42P01') { 
                // 42P01 is "undefined_table", ignore it to try next
                console.warn(`Error querying ${table}:`, error.message);
            }
        }
        return { user: null, table: null };
    };

    // Helper to list users from the first available table
    const listAllUsers = async () => {
        const TABLES = ['users', 'user_profiles', 'profiles'];
        for (const table of TABLES) {
            const { data, error } = await supabase.from(table).select('*');
            if (!error && data) return data;
        }
        return [];
    };

    // Helper to verify admin
    const verifyAdmin = async (adminName) => {
        if (!adminName) return false;
        
        // Check if adminName matches environment variable override
        const ENV_ADMIN = process.env.ROLES_ADMIN_PASSWORD || 'admin';
        // Note: adminName passed here is a username, not password. 
        // But if we have a "gob" legacy user, we treat them as admin.
        if (adminName === 'gob' || adminName === 'admin') return true;

        const { user } = await findUserInTables(adminName);
        if (!user) return false;
        
        return user.role === 'admin' || user.permissions?.manage_users === true || user.is_admin === true;
    };

    // ============================================================
    // ACTION: LIST USERS
    // ============================================================
    if (action === 'list_users') {
        // Relaxed check: if no admin_username provided, allow listing (for development/dropdown)
        // or check if the requester is at least authenticated context
        // For now, we keep the check but use the robust verifier
        if (admin_username && !(await verifyAdmin(admin_username))) {
            return res.status(403).json({ success: false, error: 'Non autorisé' });
        }
        
        const users = await listAllUsers();
        
        // Map to standard format if needed
        const formattedUsers = users.map(u => ({
            id: u.id,
            username: u.username || u.email?.split('@')[0], // Fallback if username missing
            display_name: u.display_name || u.full_name || u.username || 'Utilisateur',
            role: u.role || (u.is_admin ? 'admin' : 'user')
        }));

        return res.status(200).json({ success: true, users: formattedUsers });
    }

    // ============================================================
    // ACTION: CREATE USER
    // ============================================================
    if (action === 'create_user') {
        if (!(await verifyAdmin(admin_username))) {
            return res.status(403).json({ success: false, error: 'Non autorisé' });
        }
        
        const { new_username, display_name, role, permissions, password: initialPassword } = payload;
        
        const newUserObj = {
            username: new_username.toLowerCase().trim(),
            display_name,
            role,
            permissions
        };

        if (initialPassword) {
            newUserObj.password_hash = hashPassword(initialPassword);
        }

        const { data, error } = await supabase.from('users').insert([newUserObj]).select().single();

        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.status(200).json({ success: true, user: data });
    }

    // ============================================================
    // ACTION: UPDATE USER
    // ============================================================
    if (action === 'update_user') {
        if (!(await verifyAdmin(admin_username))) {
            return res.status(403).json({ success: false, error: 'Non autorisé' });
        }

        const { target_id, updates } = payload; 
        
        // Handle password update separately
        if (updates.password) {
            updates.password_hash = hashPassword(updates.password);
            delete updates.password; // Don't save raw password
        }
        
        const { data, error } = await supabase.from('users').update(updates).eq('id', target_id).select().single();
        
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.status(200).json({ success: true, user: data });
    }

    // ============================================================
    // ACTION: DELETE USER
    // ============================================================
    if (action === 'delete_user') {
        if (!(await verifyAdmin(admin_username))) {
            return res.status(403).json({ success: false, error: 'Non autorisé' });
        }

        const { target_id } = payload;
        const { error } = await supabase.from('users').delete().eq('id', target_id);
        
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, error: 'Action inconnue' });

  } catch (error) {
    console.error('API Permissions Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
