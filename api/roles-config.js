/**
 * API pour la configuration des roles et permissions
 * Gestion complete des roles utilisateur et permissions des composants
 */

import { createSupabaseClient } from '../lib/supabase-config.js';
import crypto from 'crypto';

// Lazy initialization - don't crash on module load if service role key is missing
let supabase = null;
function getSupabase() {
    if (!supabase) {
        try {
            supabase = createSupabaseClient(true); // Service role pour admin
        } catch (error) {
            console.warn('Supabase not configured for roles-config:', error.message);
            return null;
        }
    }
    return supabase;
}


// Hash du mot de passe admin (par defaut: "admin")
// En production, utiliser bcrypt ou argon2
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

// Liste des composants disponibles
const AVAILABLE_COMPONENTS = [
    { id: 'stocks-news', label: 'Stocks & News', category: 'Principal' },
    { id: 'ask-emma', label: 'Ask Emma', category: 'Principal' },
    { id: 'intellistocks', label: 'JLab', category: 'Principal' },
    { id: 'economic-calendar', label: 'Calendrier Economique', category: 'Calendriers' },
    { id: 'investing-calendar', label: 'Calendrier Investissement', category: 'Calendriers' },
    { id: 'yield-curve', label: 'Courbe des Rendements', category: 'Analyse' },
    { id: 'markets-economy', label: 'Marches & Economie', category: 'Analyse' },
    { id: 'dans-watchlist', label: 'Watchlist', category: 'Donnees' },
    { id: 'scrapping-sa', label: 'Scrapping SA', category: 'Donnees' },
    { id: 'seeking-alpha', label: 'Seeking Alpha', category: 'Donnees' },
    { id: 'email-briefings', label: 'Briefings Email', category: 'Communication' },
    { id: 'admin-jslai', label: 'Admin JSL AI', category: 'Admin' },
    { id: 'emma-sms', label: 'Emma SMS', category: 'Communication' },
    { id: 'fastgraphs', label: 'FastGraphs', category: 'Outils' },
    { id: 'plus', label: 'Plus', category: 'Autres' },
    { id: 'news-ticker', label: 'Bandeau Actualites', category: 'Principal' },
    { id: 'theme-selector', label: 'Selecteur de Theme', category: 'Interface' }
];

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action, adminPassword, roleId, roleName, displayName, description, componentPermissions, username, role_id, is_admin } = req.body;

        // Check if Supabase is available for database operations
        const db = getSupabase();
        
        // For get_user_permissions, return graceful fallback if Supabase is not configured
        // This allows the dashboard to work even without the roles database
        if (action === 'get_user_permissions' && !db) {
            console.log('[roles-config] Supabase not configured, returning empty permissions (dashboard will show all)');
            return res.status(200).json({
                success: true,
                permissions: null,
                fallback: true,
                message: 'Supabase not configured, all permissions granted by default'
            });
        }
        
        // For other database operations, return error if Supabase is not available
        if (!db && ['get_roles', 'get_role', 'create_role', 'update_role', 'delete_role', 'assign_role'].includes(action)) {
            return res.status(503).json({
                success: false,
                error: 'Database not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.',
                action: action
            });
        }

        // ============================================================
        // ACTION: VERIFY_ADMIN - Verifier le mot de passe admin
        // ============================================================
        if (action === 'verify_admin') {
            if (!adminPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Mot de passe admin requis'
                });
            }

            // Verifier le mot de passe admin (par defaut: "admin")
            // En production, recuperer depuis une variable d'environnement ou Supabase
            const ADMIN_PASSWORD = process.env.ROLES_ADMIN_PASSWORD || 'admin';
            const passwordHash = hashPassword(ADMIN_PASSWORD);

            if (!verifyPassword(adminPassword, passwordHash)) {
                return res.status(401).json({
                    success: false,
                    error: 'Mot de passe admin incorrect'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Authentification admin reussie',
                components: AVAILABLE_COMPONENTS
            });
        }

        // ============================================================
        // ACTION: GET_ROLES - Recuperer tous les roles
        // ============================================================
        if (action === 'get_roles') {
            const { data: roles, error } = await db
                .from('user_roles')
                .select('*')
                .order('display_name');

            if (error) {
                throw error;
            }

            return res.status(200).json({
                success: true,
                roles: roles || [],
                components: AVAILABLE_COMPONENTS
            });
        }

        // ============================================================
        // ACTION: GET_ROLE - Recuperer un role specifique
        // ============================================================
        if (action === 'get_role') {
            if (!roleId && !roleName) {
                return res.status(400).json({
                    success: false,
                    error: 'roleId ou roleName requis'
                });
            }

            let query = db.from('user_roles').select('*');
            
            if (roleId) {
                query = query.eq('id', roleId);
            } else {
                query = query.eq('role_name', roleName);
            }

            const { data: role, error } = await query.single();

            if (error) {
                throw error;
            }

            return res.status(200).json({
                success: true,
                role: role
            });
        }

        // ============================================================
        // ACTION: CREATE_ROLE - Creer un nouveau role
        // ============================================================
        if (action === 'create_role') {
            if (!adminPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentification admin requise'
                });
            }

            // Verifier le mot de passe admin
            const ADMIN_PASSWORD = process.env.ROLES_ADMIN_PASSWORD || 'admin';
            if (adminPassword !== ADMIN_PASSWORD) {
                return res.status(401).json({
                    success: false,
                    error: 'Mot de passe admin incorrect'
                });
            }

            if (!roleName || !displayName) {
                return res.status(400).json({
                    success: false,
                    error: 'roleName et displayName requis'
                });
            }

            const newRole = {
                role_name: roleName.toLowerCase().trim(),
                display_name: displayName,
                description: description || '',
                is_admin: false,
                component_permissions: componentPermissions || {}
            };

            const { data: role, error } = await db
                .from('user_roles')
                .insert([newRole])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return res.status(201).json({
                success: true,
                message: 'Role cree avec succes',
                role: role
            });
        }

        // ============================================================
        // ACTION: UPDATE_ROLE - Mettre a jour un role
        // ============================================================
        if (action === 'update_role') {
            if (!adminPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentification admin requise'
                });
            }

            // Verifier le mot de passe admin
            const ADMIN_PASSWORD = process.env.ROLES_ADMIN_PASSWORD || 'admin';
            if (adminPassword !== ADMIN_PASSWORD) {
                return res.status(401).json({
                    success: false,
                    error: 'Mot de passe admin incorrect'
                });
            }

            if (!roleId) {
                return res.status(400).json({
                    success: false,
                    error: 'roleId requis'
                });
            }

            const updates = {};
            if (displayName) updates.display_name = displayName;
            if (description !== undefined) updates.description = description;
            if (componentPermissions) updates.component_permissions = componentPermissions;
            if (is_admin !== undefined) updates.is_admin = is_admin;

            const { data: role, error } = await db
                .from('user_roles')
                .update(updates)
                .eq('id', roleId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return res.status(200).json({
                success: true,
                message: 'Role mis a jour avec succes',
                role: role
            });
        }

        // ============================================================
        // ACTION: DELETE_ROLE - Supprimer un role
        // ============================================================
        if (action === 'delete_role') {
            if (!adminPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentification admin requise'
                });
            }

            // Verifier le mot de passe admin
            const ADMIN_PASSWORD = process.env.ROLES_ADMIN_PASSWORD || 'admin';
            if (adminPassword !== ADMIN_PASSWORD) {
                return res.status(401).json({
                    success: false,
                    error: 'Mot de passe admin incorrect'
                });
            }

            if (!roleId) {
                return res.status(400).json({
                    success: false,
                    error: 'roleId requis'
                });
            }

            const { error } = await db
                .from('user_roles')
                .delete()
                .eq('id', roleId);

            if (error) {
                throw error;
            }

            return res.status(200).json({
                success: true,
                message: 'Role supprime avec succes'
            });
        }

        // ============================================================
        // ACTION: ASSIGN_ROLE - Assigner un role a un utilisateur
        // ============================================================
        if (action === 'assign_role') {
            if (!adminPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentification admin requise'
                });
            }

            // Verifier le mot de passe admin
            const ADMIN_PASSWORD = process.env.ROLES_ADMIN_PASSWORD || 'admin';
            if (adminPassword !== ADMIN_PASSWORD) {
                return res.status(401).json({
                    success: false,
                    error: 'Mot de passe admin incorrect'
                });
            }

            if (!username || !role_id) {
                return res.status(400).json({
                    success: false,
                    error: 'username et role_id requis'
                });
            }

            const { data: mapping, error } = await db
                .from('user_role_mapping')
                .upsert({
                    username: username.toLowerCase().trim(),
                    role_id: role_id
                }, {
                    onConflict: 'username,role_id'
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            return res.status(200).json({
                success: true,
                message: 'Role assigne avec succes',
                mapping: mapping
            });
        }

        // ============================================================
        // ACTION: GET_USER_PERMISSIONS - Recuperer les permissions d'un utilisateur
        // ============================================================
        if (action === 'get_user_permissions') {
            if (!username) {
                return res.status(400).json({
                    success: false,
                    error: 'username requis'
                });
            }

            // Wrap in try-catch to handle missing table or other DB errors gracefully
            try {
                const { data: permissions, error } = await db
                    .from('user_permissions')
                    .select('*')
                    .eq('username', username.toLowerCase().trim())
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                    // Log error but return graceful fallback
                    console.warn('[roles-config] DB error fetching permissions:', error.message);
                    return res.status(200).json({
                        success: true,
                        permissions: null,
                        fallback: true,
                        message: 'Could not fetch permissions, using defaults'
                    });
                }

                return res.status(200).json({
                    success: true,
                    permissions: permissions || null
                });
            } catch (dbError) {
                // Any DB error - return graceful fallback so dashboard loads
                console.warn('[roles-config] Exception fetching permissions:', dbError.message);
                return res.status(200).json({
                    success: true,
                    permissions: null,
                    fallback: true,
                    message: 'Database error, using default permissions'
                });
            }
        }


        // ============================================================
        // ACTION: POPULATE_DEFAULTS - Peupler les roles par defaut
        // ============================================================
        if (action === 'populate_defaults') {
            if (!adminPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentification admin requise'
                });
            }

            const ADMIN_PASSWORD = process.env.ROLES_ADMIN_PASSWORD || 'admin';
            if (adminPassword !== ADMIN_PASSWORD) {
                return res.status(401).json({
                    success: false,
                    error: 'Mot de passe admin incorrect'
                });
            }

            const DEFAULT_ROLES = [
                {
                    role_name: 'invite',
                    display_name: 'Invite',
                    description: 'Acces limite en lecture seule',
                    is_admin: false,
                    component_permissions: { 
                        'stocks-news': true, 'ask-emma': true, 'intellistocks': false, 
                        'economic-calendar': true, 'investing-calendar': true, 'yield-curve': false, 
                        'markets-economy': false, 'dans-watchlist': false, 'scrapping-sa': false, 
                        'seeking-alpha': false, 'email-briefings': false, 'admin-jslai': false, 
                        'emma-sms': false, 'fastgraphs': false, 'plus': false 
                    }
                },
                {
                    role_name: 'client',
                    display_name: 'Client',
                    description: 'Acces standard au tableau de bord',
                    is_admin: false,
                    component_permissions: { 
                        'stocks-news': true, 'ask-emma': true, 'intellistocks': true, 
                        'economic-calendar': true, 'investing-calendar': true, 'yield-curve': true, 
                        'markets-economy': true, 'dans-watchlist': false, 'scrapping-sa': false, 
                        'seeking-alpha': false, 'email-briefings': false, 'admin-jslai': false, 
                        'emma-sms': false, 'fastgraphs': false, 'plus': true 
                    }
                },
                {
                    role_name: 'daniel',
                    display_name: 'Daniel',
                    description: 'Acces avance et outils de gestion',
                    is_admin: false,
                    component_permissions: { 
                        'stocks-news': true, 'ask-emma': true, 'intellistocks': true, 
                        'economic-calendar': true, 'investing-calendar': true, 'yield-curve': true, 
                        'markets-economy': true, 'dans-watchlist': true, 'scrapping-sa': true, 
                        'seeking-alpha': true, 'email-briefings': true, 'admin-jslai': false, 
                        'emma-sms': true, 'fastgraphs': true, 'plus': true 
                    }
                },
                {
                    role_name: 'gob',
                    display_name: 'GOB',
                    description: 'Acces super-utilisateur systeme',
                    is_admin: true,
                    component_permissions: { 
                        'stocks-news': true, 'ask-emma': true, 'intellistocks': true, 
                        'economic-calendar': true, 'investing-calendar': true, 'yield-curve': true, 
                        'markets-economy': true, 'dans-watchlist': true, 'scrapping-sa': true, 
                        'seeking-alpha': true, 'email-briefings': true, 'admin-jslai': true, 
                        'emma-sms': true, 'fastgraphs': true, 'plus': true 
                    }
                },
                 {
                    role_name: 'admin',
                    display_name: 'Admin',
                    description: 'Administrateur global',
                    is_admin: true,
                    component_permissions: { 
                        'stocks-news': true, 'ask-emma': true, 'intellistocks': true, 
                        'economic-calendar': true, 'investing-calendar': true, 'yield-curve': true, 
                        'markets-economy': true, 'dans-watchlist': true, 'scrapping-sa': true, 
                        'seeking-alpha': true, 'email-briefings': true, 'admin-jslai': true, 
                        'emma-sms': true, 'fastgraphs': true, 'plus': true 
                    }
                }
            ];

            const results = { created: 0, skipped: 0, errors: [] };

            for (const role of DEFAULT_ROLES) {
                try {
                    // Check if role exists
                    const { data: existing } = await db.from('user_roles').select('id').eq('role_name', role.role_name).single();
                    
                    if (!existing) {
                        const { error } = await db.from('user_roles').insert([role]);
                        if (error) throw error;
                        results.created++;
                    } else {
                        results.skipped++;
                    }
                } catch (err) {
                    console.error(`Error processing role ${role.role_name}:`, err);
                    results.errors.push(role.role_name);
                }
            }

            return res.status(200).json({
                success: true,
                message: `Operation terminee: ${results.created} crees, ${results.skipped} existants.`,
                details: results
            });
        }

        // Action non reconnue
        return res.status(400).json({
            success: false,
            error: 'Action non reconnue'
        });

    } catch (error) {
        console.error('Erreur Roles Config API:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erreur serveur lors de la gestion des roles'
        });
    }
}

