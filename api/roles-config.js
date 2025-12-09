/**
 * API pour la configuration des rôles et permissions
 * Gestion complète des rôles utilisateur et permissions des composants
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


// Hash du mot de passe admin (par défaut: "admin")
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
    { id: 'economic-calendar', label: 'Calendrier Économique', category: 'Calendriers' },
    { id: 'investing-calendar', label: 'Calendrier Investissement', category: 'Calendriers' },
    { id: 'yield-curve', label: 'Courbe des Rendements', category: 'Analyse' },
    { id: 'markets-economy', label: 'Marchés & Économie', category: 'Analyse' },
    { id: 'dans-watchlist', label: 'Watchlist', category: 'Données' },
    { id: 'scrapping-sa', label: 'Scrapping SA', category: 'Données' },
    { id: 'seeking-alpha', label: 'Seeking Alpha', category: 'Données' },
    { id: 'email-briefings', label: 'Briefings Email', category: 'Communication' },
    { id: 'admin-jslai', label: 'Admin JSL AI', category: 'Admin' },
    { id: 'emma-sms', label: 'Emma SMS', category: 'Communication' },
    { id: 'fastgraphs', label: 'FastGraphs', category: 'Outils' },
    { id: 'plus', label: 'Plus', category: 'Autres' },
    { id: 'news-ticker', label: 'Bandeau Actualités', category: 'Principal' },
    { id: 'theme-selector', label: 'Sélecteur de Thème', category: 'Interface' }
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

        // ============================================================
        // ACTION: VERIFY_ADMIN - Vérifier le mot de passe admin
        // ============================================================
        if (action === 'verify_admin') {
            if (!adminPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Mot de passe admin requis'
                });
            }

            // Vérifier le mot de passe admin (par défaut: "admin")
            // En production, récupérer depuis une variable d'environnement ou Supabase
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
                message: 'Authentification admin réussie',
                components: AVAILABLE_COMPONENTS
            });
        }

        // ============================================================
        // ACTION: GET_ROLES - Récupérer tous les rôles
        // ============================================================
        if (action === 'get_roles') {
            const { data: roles, error } = await supabase
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
        // ACTION: GET_ROLE - Récupérer un rôle spécifique
        // ============================================================
        if (action === 'get_role') {
            if (!roleId && !roleName) {
                return res.status(400).json({
                    success: false,
                    error: 'roleId ou roleName requis'
                });
            }

            let query = supabase.from('user_roles').select('*');
            
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
        // ACTION: CREATE_ROLE - Créer un nouveau rôle
        // ============================================================
        if (action === 'create_role') {
            if (!adminPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentification admin requise'
                });
            }

            // Vérifier le mot de passe admin
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

            const { data: role, error } = await supabase
                .from('user_roles')
                .insert([newRole])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return res.status(201).json({
                success: true,
                message: 'Rôle créé avec succès',
                role: role
            });
        }

        // ============================================================
        // ACTION: UPDATE_ROLE - Mettre à jour un rôle
        // ============================================================
        if (action === 'update_role') {
            if (!adminPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentification admin requise'
                });
            }

            // Vérifier le mot de passe admin
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

            const { data: role, error } = await supabase
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
                message: 'Rôle mis à jour avec succès',
                role: role
            });
        }

        // ============================================================
        // ACTION: DELETE_ROLE - Supprimer un rôle
        // ============================================================
        if (action === 'delete_role') {
            if (!adminPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentification admin requise'
                });
            }

            // Vérifier le mot de passe admin
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

            const { error } = await supabase
                .from('user_roles')
                .delete()
                .eq('id', roleId);

            if (error) {
                throw error;
            }

            return res.status(200).json({
                success: true,
                message: 'Rôle supprimé avec succès'
            });
        }

        // ============================================================
        // ACTION: ASSIGN_ROLE - Assigner un rôle à un utilisateur
        // ============================================================
        if (action === 'assign_role') {
            if (!adminPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentification admin requise'
                });
            }

            // Vérifier le mot de passe admin
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

            const { data: mapping, error } = await supabase
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
                message: 'Rôle assigné avec succès',
                mapping: mapping
            });
        }

        // ============================================================
        // ACTION: GET_USER_PERMISSIONS - Récupérer les permissions d'un utilisateur
        // ============================================================
        if (action === 'get_user_permissions') {
            if (!username) {
                return res.status(400).json({
                    success: false,
                    error: 'username requis'
                });
            }

            const { data: permissions, error } = await supabase
                .from('user_permissions')
                .select('*')
                .eq('username', username.toLowerCase().trim())
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }

            return res.status(200).json({
                success: true,
                permissions: permissions || null
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
            error: error.message || 'Erreur serveur lors de la gestion des rôles'
        });
    }
}

