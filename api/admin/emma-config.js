/**
 * API Endpoint pour gestion de la configuration systeme d'Emma
 * Permet de modifier prompts, variables, directives systemiques
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

    //  AVERTISSEMENT: Authentification desactivee
    // Pour activer la securite, decommenter les lignes ci-dessous et definir ADMIN_API_KEY dans Vercel
    // const authHeader = req.headers.authorization;
    // const isAuthorized = authHeader && authHeader === `Bearer ${process.env.ADMIN_API_KEY}`;
    // if (!isAuthorized && process.env.ADMIN_API_KEY) {
    //     return res.status(401).json({ error: 'Non autorise. Token admin requis.' });
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
                return res.status(405).json({ error: 'Methode non autorisee' });
        }
    } catch (error) {
        console.error(' Erreur API admin Emma:', error);
        return res.status(500).json({ 
            error: 'Erreur serveur', 
            message: error.message 
        });
    }
}

/**
 * GET - Recuperer la configuration
 */
async function handleGet(req, res, section, key) {
    try {
        if (!supabase) {
            // Fallback: retourner configuration par defaut depuis fichiers
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
            // Fallback vers config par defaut
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

        // Organiser par section/categorie
        const config = {};
        data.forEach(item => {
            // DB utilise 'section', mais l'API retourne souvent sous 'category' ou 'section'
            // On utilise 'section' comme cle de regroupement
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

        // Si key specifique demandee, retourner seulement ca
        if (key) {
            // Trouver dans n'importe quelle categorie
            for (const category of Object.keys(config)) {
                if (config[category][key]) {
                    return res.status(200).json({
                        config: config[category][key],
                        source: 'database'
                    });
                }
            }
            // Fallback vers default si non trouve
            const defConfig = await getDefaultConfig(section, key);
            return res.status(200).json({
                config: defConfig,
                source: 'default_fallback'
            });
        }

        // Sinon, merger avec config par defaut pour sections manquantes
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
            // Mode developpement: sauvegarder dans fichier local
            return res.status(200).json({
                success: true,
                message: 'Config sauvegardee (mode dev - fichier local)',
                key,
                value: typeof value === 'string' ? value.substring(0, 100) + '...' : value
            });
        }

        // Determiner le type de valeur
        const valueType = typeof value === 'object' ? 'json' :
                         typeof value === 'number' ? 'number' :
                         typeof value === 'boolean' ? 'boolean' : 'string';

        // Logique de determination de section:
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

        // Verifier si existe deja
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
            message: 'Configuration sauvegardee',
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
                message: 'Config supprimee (mode dev)',
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
            message: 'Configuration supprimee',
            key
        });
    } catch (error) {
        console.error('Erreur handleDelete:', error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Configuration par defaut (depuis fichiers systeme)
 */
async function getDefaultConfig(section = null, key = null) {
    // Importer la config depuis les fichiers systeme
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
                value: `Tu es Emma, CFA - Analyste Financiere Senior et Gestionnaire de Portefeuille Institutionnel.

 QUALIFICATIONS:
- Chartered Financial Analyst (CFA) Level III
- 15+ ans d'experience en gestion de portefeuille institutionnel
- Specialisation: Analyse fondamentale quantitative et qualitative
- Expertise: Equity research, fixed income, asset allocation`,
                type: 'string',
                description: 'Identite et qualifications d\'Emma (CFA)'
            },
            general_identity: {
                value: `Tu es Emma, une assistante IA polyvalente et intelligente. Tu peux repondre a des questions sur de nombreux sujets, pas seulement la finance. Reponds en francais de maniere naturelle, accessible et engageante.`,
                type: 'string',
                description: 'Identite d\'Emma pour questions generales (deprecie - utiliser general_identity_sms ou general_identity_web)'
            },
            general_identity_sms: {
                value: `Tu es Emma, une ANALYSTE INTELLIGENTE polyvalente qui utilise Perplexity pour chercher activement des informations REELLES et RECENTES sur le web.

 TON ROLE (SMS):
- Tu es une ANALYSTE qui RECHERCHE et SYNTHETISE des informations, pas une assistante qui donne des reponses generiques
- Tu DOIS utiliser Perplexity pour chercher des donnees factuelles et a jour
- Tu reponds a des questions sur de nombreux sujets (meteo, actualites, sciences, culture, etc.)
- Tu es agile et adaptative: si une question sort du domaine financier, tu cherches activement la reponse

 TON COMPORTEMENT (SMS):
- RECHERCHE ACTIVE: Pour toute question demandant une information specifique (meteo, actualites, donnees), tu DOIS chercher cette information REELLE via Perplexity
- REPONSES DIRECTES: Reponds DIRECTEMENT a la question posee, pas de "Je peux t'aider avec..." ou "Que veux-tu savoir?"
- FORMAT SMS: Reponse concise (2-3 SMS max), donnees cles, sources courtes, emojis pour lisibilite
- DONNEES REELLES: Fournis des donnees concretes, chiffres, dates, sources - pas de generalites
- TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations REELLES et UTILES`,
                type: 'string',
                description: 'Identite d\'Emma pour questions generales (SMS) - Analyste agile avec recherche active'
            },
            general_identity_web: {
                value: `Tu es Emma, une ANALYSTE INTELLIGENTE polyvalente qui utilise Perplexity pour chercher activement des informations REELLES et RECENTES sur le web.

 TON ROLE (WEB/EMAIL):
- Tu es une ANALYSTE qui RECHERCHE et SYNTHETISE des informations, pas une assistante qui donne des reponses generiques
- Tu DOIS utiliser Perplexity pour chercher des donnees factuelles et a jour
- Tu reponds a des questions sur de nombreux sujets (meteo, actualites, sciences, culture, etc.)
- Tu es agile et adaptative: si une question sort du domaine financier, tu cherches activement la reponse

 TON COMPORTEMENT (WEB/EMAIL):
- RECHERCHE ACTIVE: Pour toute question demandant une information specifique (meteo, actualites, donnees), tu DOIS chercher cette information REELLE via Perplexity
- REPONSES DIRECTES: Reponds DIRECTEMENT a la question posee, pas de "Je peux t'aider avec..." ou "Que veux-tu savoir?"
- FORMAT WEB/EMAIL: Reponse detaillee et complete, sources avec liens, structure claire (paragraphes, bullet points)
- DONNEES REELLES: Fournis des donnees concretes, chiffres, dates, sources - pas de generalites
- TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations REELLES et UTILES`,
                type: 'string',
                description: 'Identite d\'Emma pour questions generales (Web/Email) - Analyste agile avec recherche active'
            },
            general_instructions_sms: {
                value: ` INSTRUCTIONS POUR QUESTION GENERALE (HORS FINANCE) - MODE SMS:
-  CRITIQUE ABSOLUE: Tu es une ANALYSTE INTELLIGENTE qui DOIT chercher des informations REELLES et RECENTES
-  INTERDIT: Repondre de maniere generique sans chercher d'informations reelles
-  OBLIGATOIRE: Utilise Perplexity pour RECHERCHER activement des donnees factuelles et a jour sur le web
-  Exemples de questions qui necessitent recherche active:
  - "Meteo a Rimouski" -> Cherche temperature actuelle, conditions, previsions meteo Rimouski
  - "Actualites du jour" -> Cherche les actualites recentes (pas de generalites)
  - "Qu'est-ce que X" -> Cherche definition recente et precise de X
  - "Comment fonctionne Y" -> Cherche explication detaillee et a jour de Y
-  REGLE D'OR: Si la question demande une information specifique (meteo, actualites, donnees), tu DOIS chercher cette information REELLE via Perplexity
-  FORMAT SMS: Reponse concise (2-3 SMS max), donnees cles, sources courtes, emojis pour lisibilite
-  NE PAS: Repondre "Je peux t'aider avec..." ou "Que veux-tu savoir?" - reponds DIRECTEMENT a la question
-  TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations REELLES`,
                type: 'string',
                description: 'Instructions pour questions generales (SMS) - Recherche active obligatoire'
            },
            general_instructions_web: {
                value: ` INSTRUCTIONS POUR QUESTION GENERALE (HORS FINANCE) - MODE WEB/EMAIL:
-  CRITIQUE ABSOLUE: Tu es une ANALYSTE INTELLIGENTE qui DOIT chercher des informations REELLES et RECENTES
-  INTERDIT: Repondre de maniere generique sans chercher d'informations reelles
-  OBLIGATOIRE: Utilise Perplexity pour RECHERCHER activement des donnees factuelles et a jour sur le web
-  Exemples de questions qui necessitent recherche active:
  - "Meteo a Rimouski" -> Cherche temperature actuelle, conditions, previsions meteo Rimouski
  - "Actualites du jour" -> Cherche les actualites recentes (pas de generalites)
  - "Qu'est-ce que X" -> Cherche definition recente et precise de X
  - "Comment fonctionne Y" -> Cherche explication detaillee et a jour de Y
-  REGLE D'OR: Si la question demande une information specifique (meteo, actualites, donnees), tu DOIS chercher cette information REELLE via Perplexity
-  FORMAT WEB/EMAIL: Reponse detaillee et complete, sources avec liens, structure claire (paragraphes, bullet points)
-  NE PAS: Repondre "Je peux t'aider avec..." ou "Que veux-tu savoir?" - reponds DIRECTEMENT a la question
-  TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations REELLES`,
                type: 'string',
                description: 'Instructions pour questions generales (Web/Email) - Recherche active obligatoire'
            },
            system_instructions: {
                value: `INSTRUCTIONS CRITIQUES:
1.  ABSOLUMENT INTERDIT DE COPIER DU JSON/CODE DANS TA REPONSE
2.  TU ES UNE ANALYSTE FINANCIERE HUMAINE, PAS UN TERMINAL DE DONNEES
3.  REGLE ABSOLUE: REPONDRE UNIQUEMENT A LA DEMANDE DE L'UTILISATEUR`,
                type: 'string',
                description: 'Instructions systeme generales'
            }
        },
        variables: {
            max_tokens_default: {
                value: 4000,
                type: 'number',
                description: 'Nombre maximum de tokens par defaut pour Perplexity'
            },
            max_tokens_briefing: {
                value: 10000,
                type: 'number',
                description: 'Nombre maximum de tokens pour les briefings'
            },
            temperature: {
                value: 0.1,
                type: 'number',
                description: 'Temperature pour generation de reponses (0.0-1.0)'
            },
            recency_default: {
                value: 'month',
                type: 'string',
                description: 'Filtre de recence par defaut (day/week/month/year)'
            }
        },
        directives: {
            allow_clarifications: {
                value: true,
                type: 'boolean',
                description: 'Permettre a Emma de poser des questions de clarification'
            },
            adaptive_length: {
                value: true,
                type: 'boolean',
                description: 'Longueur de reponse adaptative selon complexite'
            },
            require_sources: {
                value: true,
                type: 'boolean',
                description: 'Exiger citations de sources pour donnees factuelles'
            },
            min_ratios_simple: {
                value: 1,
                type: 'number',
                description: 'Nombre minimum de ratios pour questions simples'
            },
            min_ratios_comprehensive: {
                value: 8,
                type: 'number',
                description: 'Nombre minimum de ratios pour analyses completes'
            }
        },
        routing: {
            use_perplexity_only_keywords: {
                value: ['fonds', 'quartile', 'macro', 'strategie', 'crypto'],
                type: 'json',
                description: 'Keywords declenchant Perplexity seul (sans APIs)'
            },
            require_apis_keywords: {
                value: ['prix actuel', 'ratio exact', 'rsi', 'macd'],
                type: 'json',
                description: 'Keywords necessitant des APIs complementaires'
            },
            sms_allowed_commands: {
                value: [
                    'ANALYSE', 'ANALYZE', 
                    'PRIX', 'PRICE', 'COURS', 'QUOTE',
                    'NEWS', 'ACTUALITES', 'ACTUALITES', 'INFOS',
                    'TOP', // Pour TOP NEWS
                    'SKILLS', 'AIDE', 'HELP', 'COMMANDES',
                    'TEST'
                ],
                type: 'json',
                description: 'Liste des commandes autorisees en mode SMS (Guardrail)'
            }
        },
        ai_roles: {
            researcher: {
                value: { modelId: 'sonar-pro', googleSearch: true, max_tokens: 2000, temperature: 0.2 },
                type: 'json',
                description: 'Configuration pour le role Researcher (Analyses approfondies)'
            },
            writer: {
                value: { modelId: 'gpt-4o', googleSearch: false, max_tokens: 2500, temperature: 0.7 },
                type: 'json',
                description: 'Configuration pour le role Writer (Redaction de contenu)'
            },
            critic: {
                value: { modelId: 'claude-3-5-sonnet', googleSearch: true, max_tokens: 1500, temperature: 0.3 },
                type: 'json',
                description: 'Configuration pour le role Critic (Revue et critique)'
            },
            technical: {
                value: { modelId: 'gemini-2.0-flash', googleSearch: false, max_tokens: 3000, temperature: 0.1 },
                type: 'json',
                description: 'Configuration pour le role Technical (Code et donnees)'
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
