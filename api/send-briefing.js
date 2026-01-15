/**
 * API Send Briefing - Envoie immediatement un briefing par email
 *
 * Usage:
 * POST /api/send-briefing
 * Body: {
 *   prompt_id: 'briefing_evening',
 *   recipients: [{email, name, active}],  // Optionnel, sinon utilise config
 *   custom_prompt: 'texte'  // Optionnel
 * }
 *
 * Utilise par emma-config.html pour tester l'envoi immediat
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Genere le briefing via /api/briefing
 */
async function generateBriefing(type, customPrompt) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://gob-projetsjsls-projects.vercel.app';

    const body = customPrompt
      ? { type: 'custom', custom_prompt: customPrompt }
      : { type };

    const response = await fetch(`${baseUrl}/api/briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Briefing API error: ${response.status} - ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error(' Erreur generation briefing:', error);
    throw error;
  }
}

/**
 * Envoie l'email via Resend
 */
async function sendEmail(to, name, subject, htmlContent) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Emma IA <emma@gobapps.com>',
        to: [to],
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    console.error(` Erreur envoi email a ${to}:`, error);
    throw error;
  }
}

/**
 * Handler principal
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt_id, recipients: providedRecipients, custom_prompt } = req.body;

    if (!prompt_id) {
      return res.status(400).json({ error: 'prompt_id is required' });
    }

    console.log(` Envoi immediat du briefing: ${prompt_id}`);

    // 1. RECUPERER LA CONFIGURATION (si recipients non fournis)
    let recipients = providedRecipients;
    let briefingType = 'custom';

    if (!recipients) {
      const { data: config, error } = await supabase
        .from('emma_config')
        .select('*')
        .eq('key', prompt_id)
        .single();

      if (error || !config) {
        return res.status(404).json({ error: 'Prompt configuration not found' });
      }

      // Parser les recipients depuis la config
      const emailRecipients = typeof config.email_recipients === 'string'
        ? JSON.parse(config.email_recipients)
        : config.email_recipients;

      recipients = emailRecipients?.filter(r => r.active) || [];

      if (recipients.length === 0) {
        return res.status(400).json({ error: 'No active recipients configured' });
      }

      // Extraire le type depuis le prompt_id (ex: "briefing_evening" -> "evening")
      const keyParts = prompt_id.split('_');
      briefingType = keyParts[keyParts.length - 1] || 'custom';
    }

    // 2. GENERER LE BRIEFING
    const briefing = await generateBriefing(briefingType, custom_prompt);

    if (!briefing.success) {
      throw new Error(`Failed to generate briefing: ${briefing.error}`);
    }

    console.log(` Briefing genere: ${briefing.subject}`);

    // 3. ENVOYER A TOUS LES DESTINATAIRES ACTIFS
    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      if (!recipient.active) continue;

      try {
        const emailResult = await sendEmail(
          recipient.email,
          recipient.name,
          briefing.subject,
          briefing.html_content
        );

        results.push({
          email: recipient.email,
          name: recipient.name,
          status: 'sent',
          resend_id: emailResult.id
        });

        console.log(` Email envoye a ${recipient.email} (${emailResult.id})`);
      } catch (error) {
        errors.push({
          email: recipient.email,
          name: recipient.name,
          status: 'failed',
          error: error.message
        });

        console.error(` Echec envoi a ${recipient.email}:`, error.message);
      }
    }

    // 4. RETOURNER LE RESULTAT
    const success = results.length > 0;
    const response = {
      success,
      message: success
        ? `Briefing envoye a ${results.length}/${recipients.length} destinataire(s)`
        : 'Echec de tous les envois',
      sent_count: results.length,
      failed_count: errors.length,
      total_recipients: recipients.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      briefing: {
        type: briefingType,
        subject: briefing.subject,
        generated_at: briefing.metadata?.generated_at
      }
    };

    return res.status(success ? 200 : 500).json(response);

  } catch (error) {
    console.error(' Erreur send-briefing:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
