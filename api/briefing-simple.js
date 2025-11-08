/**
 * Version simplifiée de /api/briefing sans imports externes
 * Pour tester si le problème vient des imports
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. DÉTERMINER LE TYPE DE BRIEFING
    let briefingType = req.query.type || req.body?.type;

    if (!briefingType) {
      return res.status(400).json({
        success: false,
        error: 'Missing type parameter. Must be: morning, midday, or evening'
      });
    }

    // Normaliser le type
    if (briefingType === 'noon') {
      briefingType = 'midday';
    }

    const validTypes = ['morning', 'midday', 'evening'];
    if (!validTypes.includes(briefingType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // 2. CHARGER LA CONFIGURATION (sans imports externes pour test)
    let promptConfig;
    try {
      const configPath = join(__dirname, '..', 'config', 'briefing-prompts.json');
      const configContent = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      promptConfig = config[briefingType];
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: `Failed to load briefing config: ${error.message}`
      });
    }

    if (!promptConfig) {
      return res.status(400).json({
        success: false,
        error: `Configuration not found for type: ${briefingType}`
      });
    }

    // 3. Retourner une réponse simple pour test
    return res.status(200).json({
      success: true,
      type: briefingType,
      message: 'Endpoint works! Config loaded successfully.',
      prompt_name: promptConfig.name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur génération briefing:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

