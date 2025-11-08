/**
 * API endpoint pour gérer les destinataires email
 * 
 * GET : Récupère la configuration des destinataires
 * PUT : Met à jour la configuration des destinataires
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_PATH = join(__dirname, '..', 'config', 'email-recipients.json');

function loadEmailRecipients() {
  try {
    const configContent = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Erreur chargement config destinataires:', error);
    throw new Error('Failed to load email recipients configuration');
  }
}

function saveEmailRecipients(config) {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Erreur sauvegarde config destinataires:', error);
    throw new Error('Failed to save email recipients configuration');
  }
}

/**
 * Récupère les adresses email actives pour un type de briefing
 */
export function getActiveRecipients(briefingType = 'custom') {
  try {
    const config = loadEmailRecipients();
    const typeConfig = config.recipients[briefingType] || config.recipients.custom;
    
    if (!typeConfig.enabled) {
      return [];
    }
    
    return typeConfig.addresses
      .filter(addr => addr.enabled)
      .map(addr => addr.email);
  } catch (error) {
    console.error('❌ Erreur récupération destinataires:', error);
    return [config?.default_recipient || 'projetsjsl@gmail.com'];
  }
}

/**
 * Récupère l'adresse email pour les previews
 */
export function getPreviewEmail() {
  try {
    const config = loadEmailRecipients();
    return config.preview_email.address;
  } catch (error) {
    console.error('❌ Erreur récupération email preview:', error);
    return 'projetsjsl@gmail.com';
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const config = loadEmailRecipients();
      return res.status(200).json({
        success: true,
        config: config
      });
    } else if (req.method === 'PUT') {
      const { preview_email, recipients, default_recipient } = req.body;
      
      const config = loadEmailRecipients();
      
      // Mettre à jour l'email de preview
      if (preview_email !== undefined) {
        config.preview_email = preview_email;
      }
      
      // Mettre à jour les destinataires
      if (recipients !== undefined) {
        config.recipients = recipients;
      }
      
      // Mettre à jour le destinataire par défaut
      if (default_recipient !== undefined) {
        config.default_recipient = default_recipient;
      }
      
      saveEmailRecipients(config);
      
      return res.status(200).json({
        success: true,
        message: 'Configuration des destinataires mise à jour avec succès',
        config: config
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Erreur API email-recipients:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

