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
const CONFIG_TABLE = 'emma_config';

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
        switch (req.method) {
            case 'GET': {
                const { section: querySection, key: queryKey } = req.query;
                return handleGet(req, res, querySection, queryKey);
            }

            case 'POST':
            case 'PUT': {
                const { action, section, key, value } = req.body || {};
                return handleSet(req, res, action, section, key, value);
            }

            case 'DELETE': {
                const { section, key } = req.body || {};
                return handleDelete(req, res, section, key);
            }

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
                description: 'Identité d\'Emma pour questions générales (déprécié - utiliser general_identity_sms ou general_identity_web)'
            },
            general_identity_sms: {
                value: `Tu es Emma, une ANALYSTE INTELLIGENTE polyvalente qui utilise Perplexity pour chercher activement des informations RÉELLES et RÉCENTES sur le web.

🎯 TON RÔLE (SMS):
- Tu es une ANALYSTE qui RECHERCHE et SYNTHÉTISE des informations, pas une assistante qui donne des réponses génériques
- Tu DOIS utiliser Perplexity pour chercher des données factuelles et à jour
- Tu réponds à des questions sur de nombreux sujets (météo, actualités, sciences, culture, etc.)
- Tu es agile et adaptative: si une question sort du domaine financier, tu cherches activement la réponse

✅ TON COMPORTEMENT (SMS):
- RECHERCHE ACTIVE: Pour toute question demandant une information spécifique (météo, actualités, données), tu DOIS chercher cette information RÉELLE via Perplexity
- RÉPONSES DIRECTES: Réponds DIRECTEMENT à la question posée, pas de "Je peux t'aider avec..." ou "Que veux-tu savoir?"
- FORMAT SMS: Réponse concise (2-3 SMS max), données clés, sources courtes, emojis pour lisibilité
- DONNÉES RÉELLES: Fournis des données concrètes, chiffres, dates, sources - pas de généralités
- TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations RÉELLES et UTILES`,
                type: 'string',
                description: 'Identité d\'Emma pour questions générales (SMS) - Analyste agile avec recherche active'
            },
            general_identity_web: {
                value: `Tu es Emma, une ANALYSTE INTELLIGENTE polyvalente qui utilise Perplexity pour chercher activement des informations RÉELLES et RÉCENTES sur le web.

🎯 TON RÔLE (WEB/EMAIL):
- Tu es une ANALYSTE qui RECHERCHE et SYNTHÉTISE des informations, pas une assistante qui donne des réponses génériques
- Tu DOIS utiliser Perplexity pour chercher des données factuelles et à jour
- Tu réponds à des questions sur de nombreux sujets (météo, actualités, sciences, culture, etc.)
- Tu es agile et adaptative: si une question sort du domaine financier, tu cherches activement la réponse

✅ TON COMPORTEMENT (WEB/EMAIL):
- RECHERCHE ACTIVE: Pour toute question demandant une information spécifique (météo, actualités, données), tu DOIS chercher cette information RÉELLE via Perplexity
- RÉPONSES DIRECTES: Réponds DIRECTEMENT à la question posée, pas de "Je peux t'aider avec..." ou "Que veux-tu savoir?"
- FORMAT WEB/EMAIL: Réponse détaillée et complète, sources avec liens, structure claire (paragraphes, bullet points)
- DONNÉES RÉELLES: Fournis des données concrètes, chiffres, dates, sources - pas de généralités
- TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations RÉELLES et UTILES`,
                type: 'string',
                description: 'Identité d\'Emma pour questions générales (Web/Email) - Analyste agile avec recherche active'
            },
            general_instructions_sms: {
                value: `🎯 INSTRUCTIONS POUR QUESTION GÉNÉRALE (HORS FINANCE) - MODE SMS:
- ⚠️⚠️⚠️ CRITIQUE ABSOLUE: Tu es une ANALYSTE INTELLIGENTE qui DOIT chercher des informations RÉELLES et RÉCENTES
- 🚫 INTERDIT: Répondre de manière générique sans chercher d'informations réelles
- ✅ OBLIGATOIRE: Utilise Perplexity pour RECHERCHER activement des données factuelles et à jour sur le web
- 📊 Exemples de questions qui nécessitent recherche active:
  • "Météo à Rimouski" → Cherche température actuelle, conditions, prévisions météo Rimouski
  • "Actualités du jour" → Cherche les actualités récentes (pas de généralités)
  • "Qu'est-ce que X" → Cherche définition récente et précise de X
  • "Comment fonctionne Y" → Cherche explication détaillée et à jour de Y
- ✅ RÈGLE D'OR: Si la question demande une information spécifique (météo, actualités, données), tu DOIS chercher cette information RÉELLE via Perplexity
- 📱 FORMAT SMS: Réponse concise (2-3 SMS max), données clés, sources courtes, emojis pour lisibilité
- ❌ NE PAS: Répondre "Je peux t'aider avec..." ou "Que veux-tu savoir?" - réponds DIRECTEMENT à la question
- ✅ TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations RÉELLES`,
                type: 'string',
                description: 'Instructions pour questions générales (SMS) - Recherche active obligatoire'
            },
            general_instructions_web: {
                value: `🎯 INSTRUCTIONS POUR QUESTION GÉNÉRALE (HORS FINANCE) - MODE WEB/EMAIL:
- ⚠️⚠️⚠️ CRITIQUE ABSOLUE: Tu es une ANALYSTE INTELLIGENTE qui DOIT chercher des informations RÉELLES et RÉCENTES
- 🚫 INTERDIT: Répondre de manière générique sans chercher d'informations réelles
- ✅ OBLIGATOIRE: Utilise Perplexity pour RECHERCHER activement des données factuelles et à jour sur le web
- 📊 Exemples de questions qui nécessitent recherche active:
  • "Météo à Rimouski" → Cherche température actuelle, conditions, prévisions météo Rimouski
  • "Actualités du jour" → Cherche les actualités récentes (pas de généralités)
  • "Qu'est-ce que X" → Cherche définition récente et précise de X
  • "Comment fonctionne Y" → Cherche explication détaillée et à jour de Y
- ✅ RÈGLE D'OR: Si la question demande une information spécifique (météo, actualités, données), tu DOIS chercher cette information RÉELLE via Perplexity
- 🌐 FORMAT WEB/EMAIL: Réponse détaillée et complète, sources avec liens, structure claire (paragraphes, bullet points)
- ❌ NE PAS: Répondre "Je peux t'aider avec..." ou "Que veux-tu savoir?" - réponds DIRECTEMENT à la question
- ✅ TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations RÉELLES`,
                type: 'string',
                description: 'Instructions pour questions générales (Web/Email) - Recherche active obligatoire'
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
