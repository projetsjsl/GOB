/**
 * API Prompt Delivery Schedule - Récupère les prompts à envoyer maintenant
 *
 * Usage:
 * GET /api/prompt-delivery-schedule - Retourne tous les prompts à envoyer MAINTENANT
 * GET /api/prompt-delivery-schedule?check_time=09:00 - Simule une heure spécifique
 * GET /api/prompt-delivery-schedule?timezone=America/Montreal - Force un fuseau horaire
 *
 * Utilisé par n8n pour savoir quels prompts envoyer à l'heure actuelle
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Vérifie si un prompt doit être envoyé maintenant
 */
function shouldSendNow(schedule, currentTime, currentDay, timezone) {
  if (!schedule || !schedule.time) return false;

  // Vérifier la fréquence
  if (schedule.frequency === 'manual') return false;

  // Vérifier l'heure (format HH:mm)
  const [scheduleHour, scheduleMinute] = schedule.time.split(':').map(Number);
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);

  // Tolérance de ±5 minutes pour éviter de manquer l'envoi
  const scheduleMinutes = scheduleHour * 60 + scheduleMinute;
  const currentMinutes = currentHour * 60 + currentMinute;
  const diff = Math.abs(currentMinutes - scheduleMinutes);

  if (diff > 5) return false; // Pas dans la fenêtre d'envoi

  // Vérifier les jours (si applicable)
  if (schedule.frequency === 'daily' || schedule.frequency === 'weekly') {
    if (!schedule.days || schedule.days.length === 0) return false;
    if (!schedule.days.includes(currentDay)) return false;
  }

  // Vérifier le mois (si mensuel)
  if (schedule.frequency === 'monthly') {
    // Pour mensuel, on peut vérifier si c'est le bon jour du mois
    // Pour l'instant, on envoie tous les 1er du mois
    const date = new Date();
    if (date.getDate() !== 1) return false;
  }

  return true;
}

/**
 * Convertit un fuseau horaire en heure locale
 */
function getCurrentTimeInTimezone(timezone) {
  const now = new Date();
  const options = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  const timeString = new Intl.DateTimeFormat('en-US', options).format(now);
  return timeString;
}

/**
 * Récupère le jour actuel dans un fuseau horaire
 */
function getCurrentDayInTimezone(timezone) {
  const now = new Date();
  const options = {
    timeZone: timezone,
    weekday: 'long'
  };

  const dayName = new Intl.DateTimeFormat('en-US', options).format(now);
  return dayName.toLowerCase();
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Paramètres optionnels pour testing
    const { check_time, timezone: forcedTimezone } = req.query;

    // Récupérer tous les prompts actifs
    const { data: prompts, error } = await supabase
      .from('prompt_delivery_configs')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!prompts || prompts.length === 0) {
      return res.status(200).json({
        success: true,
        prompts_to_send: [],
        count: 0,
        checked_at: new Date().toISOString()
      });
    }

    // Filtrer les prompts à envoyer maintenant
    const promptsToSend = [];

    for (const prompt of prompts) {
      const schedule = typeof prompt.delivery_schedule === 'string'
        ? JSON.parse(prompt.delivery_schedule)
        : prompt.delivery_schedule;

      // Utiliser le fuseau horaire du prompt ou celui forcé (pour testing)
      const timezone = forcedTimezone || schedule.timezone || 'America/Montreal';

      // Heure actuelle dans le fuseau horaire du prompt
      const currentTime = check_time || getCurrentTimeInTimezone(timezone);
      const currentDay = getCurrentDayInTimezone(timezone);

      if (shouldSendNow(schedule, currentTime, currentDay, timezone)) {
        // Parser les destinataires
        const recipients = typeof prompt.email_recipients === 'string'
          ? JSON.parse(prompt.email_recipients)
          : prompt.email_recipients || [];

        // Filtrer uniquement les actifs
        const activeRecipients = recipients.filter(r => r.active);

        if (activeRecipients.length > 0) {
          promptsToSend.push({
            prompt_id: prompt.prompt_id,
            prompt_number: prompt.prompt_number,
            section: prompt.section,
            key: prompt.key,
            recipients: activeRecipients,
            schedule: schedule,
            metadata: typeof prompt.metadata === 'string'
              ? JSON.parse(prompt.metadata)
              : prompt.metadata,
            prompt_content: typeof prompt.config === 'string'
              ? JSON.parse(prompt.config)?.prompt
              : prompt.config?.prompt
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      prompts_to_send: promptsToSend,
      count: promptsToSend.length,
      checked_at: new Date().toISOString(),
      debug: {
        check_time: check_time || 'current',
        forced_timezone: forcedTimezone || null,
        total_prompts_checked: prompts.length
      }
    });

  } catch (error) {
    console.error('[Prompt Delivery Schedule] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
