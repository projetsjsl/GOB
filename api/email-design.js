/**
 * API Email Design Configuration
 *
 * GET  → Récupère la config actuelle
 * POST → Met à jour la config
 *
 * Utilisé par emma-config.html pour éditer le design des emails
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_PATH = join(__dirname, '..', 'config', 'email-design.json');

function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (error) {
    console.error('[Email Design API] Error loading config:', error);
  }
  return null;
}

function saveConfig(config) {
  try {
    config.lastUpdated = new Date().toISOString();
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[Email Design API] Error saving config:', error);
    return false;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Récupérer la config
  if (req.method === 'GET') {
    const config = loadConfig();
    if (!config) {
      return res.status(500).json({ error: 'Failed to load config' });
    }
    return res.status(200).json(config);
  }

  // POST - Mettre à jour la config
  if (req.method === 'POST') {
    try {
      const updates = req.body;

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const currentConfig = loadConfig();
      if (!currentConfig) {
        return res.status(500).json({ error: 'Failed to load current config' });
      }

      // Merge updates with current config (deep merge)
      const mergedConfig = deepMerge(currentConfig, updates);
      mergedConfig.updatedBy = updates.updatedBy || 'emma-config';

      if (saveConfig(mergedConfig)) {
        return res.status(200).json({
          success: true,
          message: 'Configuration saved successfully',
          config: mergedConfig
        });
      } else {
        return res.status(500).json({ error: 'Failed to save config' });
      }
    } catch (error) {
      console.error('[Email Design API] Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Deep merge helper
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
