/**
 * API endpoint pour gerer les horaires et l'activation des briefings automatises
 * 
 * GET : Recupere la configuration des horaires
 * PUT : Met a jour la configuration des horaires
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_PATH = join(__dirname, '..', 'config', 'briefing-schedule.json');

function loadScheduleConfig() {
  try {
    const configContent = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error(' Erreur chargement config schedule:', error);
    throw new Error('Failed to load schedule configuration');
  }
}

function saveScheduleConfig(config) {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error(' Erreur sauvegarde config schedule:', error);
    throw new Error('Failed to save schedule configuration');
  }
}

/**
 * Convertit heure/minute/timezone en expression cron UTC
 */
function generateCronUTC(hour, minute, timezone = 'America/Montreal') {
  // Conversion basique: America/Montreal = UTC-5 (hiver) ou UTC-4 (ete)
  // Pour simplifier, on utilise UTC-5 (hiver)
  const utcOffset = -5;
  let utcHour = hour - utcOffset;
  let utcMinute = minute;
  
  if (utcHour < 0) {
    utcHour += 24;
  } else if (utcHour >= 24) {
    utcHour -= 24;
  }
  
  // Format: minute hour * * 1-5 (lundi a vendredi)
  return `${utcMinute} ${utcHour} * * 1-5`;
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
      const config = loadScheduleConfig();
      return res.status(200).json({
        success: true,
        schedule: config
      });
    } else if (req.method === 'PUT') {
      const { morning, midday, evening, config: globalConfig } = req.body;
      
      const currentConfig = loadScheduleConfig();
      
      // Mettre a jour chaque briefing
      if (morning !== undefined) {
        if (morning.hour !== undefined) currentConfig.morning.hour = morning.hour;
        if (morning.minute !== undefined) currentConfig.morning.minute = morning.minute;
        if (morning.enabled !== undefined) currentConfig.morning.enabled = morning.enabled;
        // Regenerer le cron UTC
        currentConfig.morning.cron_utc = generateCronUTC(
          currentConfig.morning.hour,
          currentConfig.morning.minute,
          currentConfig.morning.timezone
        );
      }
      
      if (midday !== undefined) {
        if (midday.hour !== undefined) currentConfig.midday.hour = midday.hour;
        if (midday.minute !== undefined) currentConfig.midday.minute = midday.minute;
        if (midday.enabled !== undefined) currentConfig.midday.enabled = midday.enabled;
        currentConfig.midday.cron_utc = generateCronUTC(
          currentConfig.midday.hour,
          currentConfig.midday.minute,
          currentConfig.midday.timezone
        );
      }
      
      if (evening !== undefined) {
        if (evening.hour !== undefined) currentConfig.evening.hour = evening.hour;
        if (evening.minute !== undefined) currentConfig.evening.minute = evening.minute;
        if (evening.enabled !== undefined) currentConfig.evening.enabled = evening.enabled;
        currentConfig.evening.cron_utc = generateCronUTC(
          currentConfig.evening.hour,
          currentConfig.evening.minute,
          currentConfig.evening.timezone
        );
      }
      
      if (globalConfig !== undefined) {
        currentConfig.config = { ...currentConfig.config, ...globalConfig };
      }
      
      saveScheduleConfig(currentConfig);
      
      return res.status(200).json({
        success: true,
        message: 'Configuration des horaires mise a jour avec succes',
        schedule: currentConfig
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error(' Erreur API briefing-schedule:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

