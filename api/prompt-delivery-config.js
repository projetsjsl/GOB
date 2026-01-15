/**
 * API Prompt Delivery Config - Configuration d'envoi par prompt
 *
 * Usage:
 * GET /api/prompt-delivery-config - Liste tous les prompts configures pour envoi
 * GET /api/prompt-delivery-config?prompt_id=briefing_morning - Config d'un prompt specifique
 * POST /api/prompt-delivery-config - Mettre a jour la config d'envoi d'un prompt
 *
 * Utilise par:
 * - n8n workflows pour router les briefings
 * - emma-config.html pour gerer les destinataires
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 
    // GET: Recuperer les configurations
    // 
    if (req.method === 'GET') {
      const { prompt_id } = req.query;

      if (prompt_id) {
        // Config d'un prompt specifique
        const { data, error } = await supabase
          .rpc('get_prompt_delivery_config', { p_prompt_id: prompt_id });

        if (error) {
          console.error('Supabase error:', error);
          return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
          return res.status(404).json({ error: 'Prompt not found or delivery not enabled' });
        }

        return res.status(200).json({
          success: true,
          config: data[0]
        });
      } else {
        // Liste tous les prompts configures
        const { data, error } = await supabase
          .from('prompt_delivery_configs')
          .select('*')
          .order('prompt_number', { ascending: true });

        if (error) {
          console.error('Supabase error:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({
          success: true,
          prompts: data || [],
          count: data?.length || 0
        });
      }
    }

    // 
    // POST: Mettre a jour la configuration d'envoi
    // 
    if (req.method === 'POST') {
      const {
        key,
        email_recipients,
        delivery_enabled,
        delivery_schedule
      } = req.body;

      if (!key) {
        return res.status(400).json({ error: 'key is required' });
      }

      // Le prompt_id est simplement le key
      const prompt_id = key;

      // Mettre a jour la config
      const { data, error } = await supabase
        .from('emma_config')
        .update({
          prompt_id,
          email_recipients: email_recipients || [],
          delivery_enabled: delivery_enabled !== undefined ? delivery_enabled : false,
          delivery_schedule: delivery_schedule || {},
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Delivery config updated',
        config: data[0]
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[Prompt Delivery Config] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
