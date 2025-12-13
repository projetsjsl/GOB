/**
 * API Endpoint pour gestion de la configuration système d'Emma
 * Permet de modifier prompts, variables, directives systémiques
 */

import { createClient } from '@supabase/supabase-js';
// Dynamic import used later to prevent build/runtime crashes if path is issue
// import { INTENT_PROMPTS } from '../../config/intent-prompts.js';

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
        switch (req.method) {
            case 'GET': {
                const { section: querySection, key: queryKey } = req.query;
                return handleGet(req, res, querySection, queryKey);
            }

            case 'POST':
            case 'PUT': {
                const { action, key, value, category, section } = req.body || {};
                return handleSet(req, res, action, key, value, category, section);
            }

            case 'DELETE': {
                const { key } = req.body || {};
                return handleDelete(req, res, key);
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

        // Filtrer par section (anciennement category)
        if (section) {
            query = query.eq('section', section);
        }

        if (key) {
            query = query.eq('key', key);
        }

        const { data, error } = await query.order('key', { ascending: true });

        if (error) {
            console.error('Erreur Supabase:', error);
            // Fallback vers config par défaut
            const defConfig = await getDefaultConfig(section, key);
            return res.status(200).json({
                config: defConfig,
                source: 'default_fallback'
            });
        }
        
        // Safety check for null data
        if (!data) {
             const defConfig = await getDefaultConfig(section, key);
             return res.status(200).json({
                config: defConfig,
                source: 'default_fallback_null_data'
            });
        }

        // Organiser par section/catégorie
        const config = {};
        data.forEach(item => {
            // DB utilise 'section', mais l'API retourne souvent sous 'category' ou 'section'
            // On utilise 'section' comme clé de regroupement
            const group = item.section || item.category || 'prompts';

            if (!config[group]) {
                config[group] = {};
            }

            // Parser la valeur selon le type
            let parsedValue = item.value;
            if (item.type === 'json' && typeof item.value === 'string') {
                try {
                    parsedValue = JSON.parse(item.value);
                } catch (e) {
                    console.warn(`Erreur parsing JSON pour ${item.key}:`, e.message);
                }
            } else if (item.type === 'number') {
                parsedValue = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
            } else if (item.type === 'boolean') {
                parsedValue = item.value === true || item.value === 'true';
            }

            // Fix potential issue where 'category' variable might be undefined here if using item.section
            // The original code used config[category][item.key] but 'category' is not defined in loop scope?
            // It should be config[group][item.key]
            
            config[group][item.key] = {
                value: parsedValue,
                type: item.type || 'string',
                description: item.description || '',
                updated_at: item.updated_at,
                updated_by: item.updated_by || 'system'
            };
        });

        // Si key spécifique demandée, retourner seulement ça
        if (key) {
            // Trouver dans n'importe quelle catégorie
            for (const category of Object.keys(config)) {
                if (config[category][key]) {
                    return res.status(200).json({
                        config: config[category][key],
                        source: 'database'
                    });
                }
            }
            // Fallback vers default si non trouvé
            const defConfig = await getDefaultConfig(section, key);
            return res.status(200).json({
                config: defConfig,
                source: 'default_fallback'
            });
        }

        // Sinon, merger avec config par défaut pour sections manquantes
        const defaultConfig = await getDefaultConfig();
        // Merge deep? Or just top level sections? 
        // defaultConfig structure: { prompts: {...}, variables: {...} }
        // config structure: { prompts: {...}, variables: {...} }
        
        const mergedConfig = { ...defaultConfig };
        
        // Merge database config on top
        Object.keys(config).forEach(sec => {
            if (!mergedConfig[sec]) {
                mergedConfig[sec] = {};
            }
            mergedConfig[sec] = { ...mergedConfig[sec], ...config[sec] };
        });

        return res.status(200).json({
            config: mergedConfig,
            source: 'database',
            categories: Object.keys(mergedConfig)
        });
    } catch (error) {
        console.error('Erreur handleGet:', error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * POST/PUT - Sauvegarder la configuration
 */
async function handleSet(req, res, action, key, value, category, explicitSection) {
    if (!key) {
        return res.status(400).json({
            error: 'Key requis'
        });
    }

    try {
        if (!supabase) {
            // Mode développement: sauvegarder dans fichier local
            return res.status(200).json({
                success: true,
                message: 'Config sauvegardée (mode dev - fichier local)',
                key,
                value: typeof value === 'string' ? value.substring(0, 100) + '...' : value
            });
        }

        // Déterminer le type de valeur
        const valueType = typeof value === 'object' ? 'json' :
                         typeof value === 'number' ? 'number' :
                         typeof value === 'boolean' ? 'boolean' : 'string';

        // Logique de détermination de section:
        // 1. Explicit 'section' param
        // 2. 'category' param
        // 3. 'prompt' fallback
        const finalSection = explicitSection || category || 'prompt';

        const configData = {
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : value,
            type: valueType,
            section: finalSection, 
            category: category || finalSection, // Backward compatibility
            updated_at: new Date().toISOString(),
            updated_by: req.headers['x-admin-user'] || 'admin'
        };

        // Vérifier si existe déjà
        const { data: existing } = await supabase
            .from(CONFIG_TABLE)
            .select('id')
            .eq('key', key)
            .single();

        let result;
        if (existing) {
            // UPDATE
            const { data, error } = await supabase
                .from(CONFIG_TABLE)
                .update(configData)
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
                key: result.key,
                value: result.type === 'json' ? JSON.parse(result.value) : result.value,
                type: result.type,
                category: result.category,
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
async function handleDelete(req, res, key) {
    if (!key) {
        return res.status(400).json({
            error: 'Key requis'
        });
    }

    try {
        if (!supabase) {
            return res.status(200).json({
                success: true,
                message: 'Config supprimée (mode dev)',
                key
            });
        }

        const { error } = await supabase
            .from(CONFIG_TABLE)
            .delete()
            .eq('key', key);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: 'Configuration supprimée',
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
async function getDefaultConfig(section = null, key = null) {
    // Importer la config depuis les fichiers système
    // Note: En production, ces valeurs viennent de /config/emma-cfa-prompt.js et autres
    
    let INTENT_PROMPTS = {};
    try {
        const module = await import('../../config/intent-prompts.js');
        INTENT_PROMPTS = module.INTENT_PROMPTS || {};
    } catch (e) {
        console.warn('Cannot load intent-prompts.js', e);
    }
    
    const defaultConfig = {
        prompts: {
            // Import dynamic prompts from intent-prompts.js
            ...Object.entries(INTENT_PROMPTS).reduce((acc, [key, value]) => {
                acc[`intent_${key}`] = {
                    value: value,
                    type: 'string',
                    description: `Prompt pour l'intention: ${key}`
                };
                return acc;
            }, {}),

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
            },
            sms_allowed_commands: {
                value: [
                    'ANALYSE', 'ANALYZE', 
                    'PRIX', 'PRICE', 'COURS', 'QUOTE',
                    'NEWS', 'ACTUALITES', 'ACTUALITÉS', 'INFOS',
                    'TOP', // Pour TOP NEWS
                    'SKILLS', 'AIDE', 'HELP', 'COMMANDES',
                    'TEST'
                ],
                type: 'json',
                description: 'Liste des commandes autorisées en mode SMS (Guardrail)'
            }
        },
        ai_roles: {
            researcher: {
                value: { modelId: 'sonar-pro', googleSearch: true, max_tokens: 2000, temperature: 0.2 },
                type: 'json',
                description: 'Configuration pour le rôle Researcher (Analyses approfondies)'
            },
            writer: {
                value: { modelId: 'gpt-4o', googleSearch: false, max_tokens: 2500, temperature: 0.7 },
                type: 'json',
                description: 'Configuration pour le rôle Writer (Rédaction de contenu)'
            },
            critic: {
                value: { modelId: 'claude-3-5-sonnet', googleSearch: true, max_tokens: 1500, temperature: 0.3 },
                type: 'json',
                description: 'Configuration pour le rôle Critic (Revue et critique)'
            },
            technical: {
                value: { modelId: 'gemini-2.0-flash', googleSearch: false, max_tokens: 3000, temperature: 0.1 },
                type: 'json',
                description: 'Configuration pour le rôle Technical (Code et données)'
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
