/**
 * API Briefing Prompts - Gestion centralisée des prompts de briefing
 * 
 * Permet de récupérer et modifier les prompts depuis config/briefing-prompts.json
 * Utilisé par n8n et l'interface Emma En Direct
 * 
 * GET /api/briefing-prompts
 *   - Récupère tous les prompts
 *   - Query: ?type=morning|midday|evening (optionnel, pour un type spécifique)
 * 
 * PUT /api/briefing-prompts
 *   - Modifie un prompt spécifique
 *   - Body: { type: 'morning'|'midday'|'evening', prompt: '...', ... }
 * 
 * POST /api/briefing-prompts
 *   - Même fonction que PUT (pour compatibilité)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Charge la configuration des briefings
 */
function loadBriefingConfig() {
  try {
    const configPath = join(__dirname, '..', 'config', 'briefing-prompts.json');
    const configContent = readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Erreur chargement config briefings:', error);
    throw new Error('Failed to load briefing configuration');
  }
}

/**
 * Sauvegarde la configuration des briefings
 */
function saveBriefingConfig(config) {
  try {
    const configPath = join(__dirname, '..', 'config', 'briefing-prompts.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde config briefings:', error);
    throw new Error('Failed to save briefing configuration');
  }
}

/**
 * Handler principal
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Récupérer les prompts
    if (req.method === 'GET') {
      const config = loadBriefingConfig();
      const type = req.query.type;

      if (type) {
        // Retourner un type spécifique
        const validTypes = ['morning', 'midday', 'evening'];
        if (!validTypes.includes(type)) {
          return res.status(400).json({
            success: false,
            error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
          });
        }

        const promptConfig = config[type];
        if (!promptConfig) {
          return res.status(404).json({
            success: false,
            error: `Configuration not found for type: ${type}`
          });
        }

        return res.status(200).json({
          success: true,
          type: type,
          config: promptConfig
        });
      }

      // Retourner tous les prompts (sans la config globale)
      const { config: globalConfig, ...prompts } = config;
      return res.status(200).json({
        success: true,
        prompts: prompts,
        global_config: globalConfig
      });
    }

    // PUT/POST - Modifier un prompt
    if (req.method === 'PUT' || req.method === 'POST') {
      const { type, prompt, name, tone, length, tools_priority, email_config } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          error: 'Missing type parameter. Must be: morning, midday, or evening'
        });
      }

      const validTypes = ['morning', 'midday', 'evening'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      // Charger la config actuelle
      const config = loadBriefingConfig();
      const promptConfig = config[type];

      if (!promptConfig) {
        return res.status(404).json({
          success: false,
          error: `Configuration not found for type: ${type}`
        });
      }

      // Mettre à jour les champs fournis
      if (prompt !== undefined) {
        promptConfig.prompt = prompt;
      }
      if (name !== undefined) {
        promptConfig.name = name;
      }
      if (tone !== undefined) {
        promptConfig.tone = tone;
      }
      if (length !== undefined) {
        promptConfig.length = length;
      }
      if (tools_priority !== undefined) {
        promptConfig.tools_priority = tools_priority;
      }
      if (email_config !== undefined) {
        promptConfig.email_config = { ...promptConfig.email_config, ...email_config };
      }

      // Sauvegarder
      saveBriefingConfig(config);

      console.log(`✅ Prompt ${type} mis à jour`);

      return res.status(200).json({
        success: true,
        type: type,
        config: promptConfig,
        message: `Prompt ${type} mis à jour avec succès`
      });
    }

    // Méthode non supportée
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET, PUT, or POST'
    });

  } catch (error) {
    console.error('❌ Erreur API briefing-prompts:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

