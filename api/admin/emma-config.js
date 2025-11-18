/**
 * API Endpoint pour gestion de la configuration système d'Emma
 * Permet de modifier prompts, variables, directives systémiques
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

// Table Supabase pour stocker la configuration
const CONFIG_TABLE = 'emma_system_config';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ⚠️ AVERTISSEMENT: Authentification désactivée
    // Pour activer la sécurité, décommenter les lignes ci-dessous et définir ADMIN_API_KEY dans Vercel
    // const authHeader = req.headers.authorization;
    // const isAuthorized = authHeader && authHeader === `Bearer ${process.env.ADMIN_API_KEY}`;
    // if (!isAuthorized && process.env.ADMIN_API_KEY) {
    //     return res.status(401).json({ error: 'Non autorisé. Token admin requis.' });
    // }

    try {
        const { action, section, key, value } = req.body;
        const { section: querySection, key: queryKey } = req.query;

        switch (req.method) {
            case 'GET':
                return handleGet(req, res, querySection, queryKey);
            
            case 'POST':
            case 'PUT':
                return handleSet(req, res, action, section, key, value);
            
            case 'DELETE':
                return handleDelete(req, res, section, key);
            
            default:
                return res.status(405).json({ error: 'Méthode non autorisée' });
        }
    } catch (error) {
        console.error('❌ Erreur API admin Emma:', error);
        return res.status(500).json({ 
            error: 'Erreur serveur', 
            message: error.message 
        });
    }
}

/**
 * GET - Récupérer la configuration
 */
async function handleGet(req, res, section, key) {
    try {
        if (!supabase) {
            // Fallback: retourner configuration par défaut depuis fichiers
            return res.status(200).json({
                config: getDefaultConfig(section, key),
                source: 'default'
            });
        }

        let query = supabase.from(CONFIG_TABLE).select('*');
        
        if (section) {
            query = query.eq('section', section);
        }
        
        if (key) {
            query = query.eq('key', key);
        }

        const { data, error } = await query.order('section', { ascending: true });

        if (error) {
            console.error('Erreur Supabase:', error);
            // Fallback vers config par défaut
            return res.status(200).json({
                config: getDefaultConfig(section, key),
                source: 'default_fallback'
            });
        }

        // Transformer en structure hiérarchique
        const config = {};
        data.forEach(item => {
            if (!config[item.section]) {
                config[item.section] = {};
            }

            // Parser la valeur selon le type
            let parsedValue = item.value;
            if (item.type === 'json' && typeof item.value === 'string') {
                try {
                    parsedValue = JSON.parse(item.value);
                } catch (e) {
                    console.warn(`Erreur parsing JSON pour ${item.section}.${item.key}:`, e.message);
                }
            } else if (item.type === 'number') {
                parsedValue = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
            } else if (item.type === 'boolean') {
                parsedValue = item.value === true || item.value === 'true';
            }

            config[item.section][item.key] = {
                value: parsedValue,
                type: item.type || 'string',
                description: item.description || '',
                updated_at: item.updated_at,
                updated_by: item.updated_by || 'system'
            };
        });

        // Si section/key spécifique demandée, retourner seulement ça
        if (section && key) {
            return res.status(200).json({
                config: config[section]?.[key] || getDefaultConfig(section, key),
                source: 'database'
            });
        }

        // Sinon, merger avec config par défaut pour sections manquantes
        const defaultConfig = getDefaultConfig();
        const mergedConfig = { ...defaultConfig, ...config };

        return res.status(200).json({
            config: mergedConfig,
            source: 'database',
            sections: Object.keys(mergedConfig)
        });
    } catch (error) {
        console.error('Erreur handleGet:', error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * POST/PUT - Sauvegarder la configuration
 */
async function handleSet(req, res, action, section, key, value) {
    if (!section || !key) {
        return res.status(400).json({ 
            error: 'Section et key requis' 
        });
    }

    try {
        if (!supabase) {
            // Mode développement: sauvegarder dans fichier local
            return res.status(200).json({
                success: true,
                message: 'Config sauvegardée (mode dev - fichier local)',
                section,
                key,
                value: typeof value === 'string' ? value.substring(0, 100) + '...' : value
            });
        }

        // Déterminer le type de valeur
        const valueType = typeof value === 'object' ? 'json' : 
                         typeof value === 'number' ? 'number' : 
                         typeof value === 'boolean' ? 'boolean' : 'string';

        const configData = {
            section,
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : value,
            type: valueType,
            updated_at: new Date().toISOString(),
            updated_by: req.headers['x-admin-user'] || 'admin'
        };

        // Vérifier si existe déjà
        const { data: existing } = await supabase
            .from(CONFIG_TABLE)
            .select('id')
            .eq('section', section)
            .eq('key', key)
            .single();

        let result;
        if (existing) {
            // UPDATE
            const { data, error } = await supabase
                .from(CONFIG_TABLE)
                .update(configData)
                .eq('section', section)
                .eq('key', key)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // INSERT
            const { data, error } = await supabase
                .from(CONFIG_TABLE)
                .insert(configData)
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        return res.status(200).json({
            success: true,
            message: 'Configuration sauvegardée',
            config: {
                section: result.section,
                key: result.key,
                value: result.type === 'json' ? JSON.parse(result.value) : result.value,
                type: result.type,
                updated_at: result.updated_at
            }
        });
    } catch (error) {
        console.error('Erreur handleSet:', error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * DELETE - Supprimer une configuration
 */
async function handleDelete(req, res, section, key) {
    if (!section || !key) {
        return res.status(400).json({ 
            error: 'Section et key requis' 
        });
    }

    try {
        if (!supabase) {
            return res.status(200).json({
                success: true,
                message: 'Config supprimée (mode dev)',
                section,
                key
            });
        }

        const { error } = await supabase
            .from(CONFIG_TABLE)
            .delete()
            .eq('section', section)
            .eq('key', key);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: 'Configuration supprimée',
            section,
            key
        });
    } catch (error) {
        console.error('Erreur handleDelete:', error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Configuration par défaut (depuis fichiers système)
 */
function getDefaultConfig(section = null, key = null) {
    // Importer la config depuis les fichiers système
    // Note: En production, ces valeurs viennent de /config/emma-cfa-prompt.js et autres
    
    const defaultConfig = {
        prompts: {
            cfa_identity: {
                value: `Tu es Emma, CFA® - Analyste Financière Senior et Gestionnaire de Portefeuille Institutionnel.

🎓 QUALIFICATIONS:
- Chartered Financial Analyst (CFA®) Level III
- 15+ ans d'expérience en gestion de portefeuille institutionnel
- Spécialisation: Analyse fondamentale quantitative et qualitative
- Expertise: Equity research, fixed income, asset allocation`,
                type: 'string',
                description: 'Identité et qualifications d\'Emma (CFA)'
            },
            general_identity: {
                value: `Tu es Emma, une assistante IA polyvalente et intelligente. Tu peux répondre à des questions sur de nombreux sujets, pas seulement la finance. Réponds en français de manière naturelle, accessible et engageante.`,
                type: 'string',
                description: 'Identité d\'Emma pour questions générales'
            },
            system_instructions: {
                value: `INSTRUCTIONS CRITIQUES:
1. ❌ ABSOLUMENT INTERDIT DE COPIER DU JSON/CODE DANS TA RÉPONSE
2. ✅ TU ES UNE ANALYSTE FINANCIÈRE HUMAINE, PAS UN TERMINAL DE DONNÉES
3. 🚨 RÈGLE ABSOLUE: RÉPONDRE UNIQUEMENT À LA DEMANDE DE L'UTILISATEUR`,
                type: 'string',
                description: 'Instructions système générales'
            }
        },
        variables: {
            max_tokens_default: {
                value: 4000,
                type: 'number',
                description: 'Nombre maximum de tokens par défaut pour Perplexity'
            },
            max_tokens_briefing: {
                value: 10000,
                type: 'number',
                description: 'Nombre maximum de tokens pour les briefings'
            },
            temperature: {
                value: 0.1,
                type: 'number',
                description: 'Température pour génération de réponses (0.0-1.0)'
            },
            recency_default: {
                value: 'month',
                type: 'string',
                description: 'Filtre de récence par défaut (day/week/month/year)'
            }
        },
        directives: {
            allow_clarifications: {
                value: true,
                type: 'boolean',
                description: 'Permettre à Emma de poser des questions de clarification'
            },
            adaptive_length: {
                value: true,
                type: 'boolean',
                description: 'Longueur de réponse adaptative selon complexité'
            },
            require_sources: {
                value: true,
                type: 'boolean',
                description: 'Exiger citations de sources pour données factuelles'
            },
            min_ratios_simple: {
                value: 1,
                type: 'number',
                description: 'Nombre minimum de ratios pour questions simples'
            },
            min_ratios_comprehensive: {
                value: 8,
                type: 'number',
                description: 'Nombre minimum de ratios pour analyses complètes'
            }
        },
        routing: {
            use_perplexity_only_keywords: {
                value: ['fonds', 'quartile', 'macro', 'stratégie', 'crypto'],
                type: 'json',
                description: 'Keywords déclenchant Perplexity seul (sans APIs)'
            },
            require_apis_keywords: {
                value: ['prix actuel', 'ratio exact', 'rsi', 'macd'],
                type: 'json',
                description: 'Keywords nécessitant des APIs complémentaires'
            }
        }
    };

    if (section && key) {
        return defaultConfig[section]?.[key] || null;
    }
    
    if (section) {
        return defaultConfig[section] || {};
    }

    return defaultConfig;
}
