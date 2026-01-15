/**
 * Email to SMS - Endpoint pour repondre par email
 *
 * Recoit un webhook de Resend quand un email arrive sur:
 * emma-reply+{userId}@gobapps.com
 *
 * Parse l'email, extrait le user ID, et envoie le message par SMS
 */

import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

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
    console.log('[Email-to-SMS] Webhook recu');

    // 1. PARSER LE WEBHOOK RESEND
    const emailData = req.body;

    // Format Resend webhook: https://resend.com/docs/api-reference/webhooks
    const {
      to,          // "emma-reply+cc583758@gobapps.com"
      from,        // "projetsjsl@gmail.com"
      subject,
      text,        // Corps du message en texte brut
      html
    } = emailData;

    if (!to || !text) {
      console.error('[Email-to-SMS] Email invalide - manque to ou text');
      return res.status(400).json({ error: 'Invalid email data' });
    }

    console.log(`[Email-to-SMS] Email de: ${from}, to: ${to}`);

    // 2. EXTRAIRE USER ID du destinataire
    // Format: emma-reply+{userId}@gobapps.com
    const match = to.match(/emma-reply\+([a-f0-9-]+)@/i);

    if (!match) {
      console.error('[Email-to-SMS] Format email invalide:', to);
      return res.status(400).json({ error: 'Invalid reply-to format' });
    }

    const userId = match[1];
    console.log(`[Email-to-SMS] User ID extrait: ${userId}`);

    // 3. RECUPERER LE NUMERO DE TELEPHONE DE L'UTILISATEUR
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: userProfile, error: dbError } = await supabase
      .from('user_profiles')
      .select('phone, name')
      .eq('id', userId)
      .single();

    if (dbError || !userProfile) {
      console.error('[Email-to-SMS] Utilisateur non trouve:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Email-to-SMS] Utilisateur trouve: ${userProfile.name} (${userProfile.phone})`);

    // 4. NETTOYER LE MESSAGE
    // Enlever les signatures, citations, etc.
    let cleanMessage = text;

    // Enlever les citations d'email precedents (lignes commencant par >)
    cleanMessage = cleanMessage
      .split('\n')
      .filter(line => !line.trim().startsWith('>'))
      .join('\n');

    // Enlever les signatures communes
    const signaturePatterns = [
      /^--[\s\S]*$/m,
      /^On .* wrote:[\s\S]*$/m,
      /^Le .* a ecrit :[\s\S]*$/m,
      /^Envoye depuis .*$/m,
      /^Sent from .*$/m
    ];

    for (const pattern of signaturePatterns) {
      cleanMessage = cleanMessage.replace(pattern, '');
    }

    cleanMessage = cleanMessage.trim();

    if (!cleanMessage || cleanMessage.length < 1) {
      console.error('[Email-to-SMS] Message vide apres nettoyage');
      return res.status(400).json({ error: 'Empty message' });
    }

    console.log(`[Email-to-SMS] Message nettoye (${cleanMessage.length} chars)`);

    // 5. ENVOYER LE SMS VIA TWILIO
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const twilioMessage = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: userProfile.phone,
      body: cleanMessage
    });

    console.log(` [Email-to-SMS] SMS envoye avec succes: ${twilioMessage.sid}`);

    // 6. SAUVEGARDER DANS LA BASE DE DONNEES
    try {
      // Recuperer la conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (conversation) {
        // Sauvegarder le message admin
        await supabase
          .from('conversation_history')
          .insert({
            conversation_id: conversation.id,
            user_id: userId,
            message: null, // Message de l'admin, pas de l'utilisateur
            response: cleanMessage,
            metadata: {
              type: 'admin_reply',
              channel: 'sms',
              sent_via: 'email',
              from_email: from,
              twilio_sid: twilioMessage.sid
            }
          });

        console.log('[Email-to-SMS] Message sauvegarde dans conversation_history');
      }
    } catch (saveError) {
      console.error('[Email-to-SMS] Erreur sauvegarde (non-bloquant):', saveError);
      // Non-bloquant - le SMS est deja envoye
    }

    // 7. REPONSE AU WEBHOOK
    return res.status(200).json({
      success: true,
      userId: userId,
      userPhone: userProfile.phone,
      messageSent: cleanMessage.substring(0, 50) + '...',
      twilioSid: twilioMessage.sid
    });

  } catch (error) {
    console.error('[Email-to-SMS] Erreur:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
