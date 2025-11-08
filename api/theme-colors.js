/**
 * API endpoint pour servir la configuration des couleurs du thème
 * 
 * Permet aux workflows n8n et autres services externes d'accéder
 * aux couleurs centralisées sans avoir à charger le fichier directement.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadThemeConfig() {
  try {
    const configPath = join(__dirname, '..', 'config', 'theme-colors.json');
    const configContent = readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Erreur chargement config couleurs:', error);
    throw new Error('Failed to load theme configuration');
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const config = loadThemeConfig();
    
    // Retourner la config complète
    return res.status(200).json({
      success: true,
      theme: config
    });

  } catch (error) {
    console.error('❌ Erreur API theme-colors:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

