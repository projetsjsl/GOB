/**
 * Adaptateur SMS - Twilio
 *
 * Reçoit les SMS via Twilio webhook, appelle /api/chat,
 * et renvoie la réponse par SMS.
 *
 * Twilio Configuration:
 * - Account SID: Configuré via TWILIO_ACCOUNT_SID env var
 * - Auth Token: Configuré via TWILIO_AUTH_TOKEN env var
 * - Phone Number: Configuré via TWILIO_PHONE_NUMBER env var
 * - Webhook URL: https://your-app.vercel.app/api/adapters/sms
 */

import twilio from 'twilio';

// Initialiser Twilio client
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    throw new Error('TWILIO_AUTH_TOKEN is not configured');
  }

  return twilio(accountSid, authToken);
};

/**
 * Handler POST /api/adapters/sms
 *
 * Reçoit webhook de Twilio avec format:
 * - From: +14385443662 (numéro de l'expéditeur)
 * - To: +1234567890 (notre numéro Twilio)
 * - Body: "Analyse AAPL"
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
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
    });
  }

  try {
    console.log('[SMS Adapter] Webhook Twilio reçu');

    // 1. PARSER LES DONNÉES TWILIO
    // Twilio envoie les données en application/x-www-form-urlencoded
    let twilioData;

    if (req.body.From && req.body.Body) {
      // Déjà parsé par Vercel
      twilioData = req.body;
    } else if (typeof req.body === 'string') {
      // Parser manuellement si nécessaire
      const params = new URLSearchParams(req.body);
      twilioData = {
        From: params.get('From'),
        To: params.get('To'),
        Body: params.get('Body'),
        MessageSid: params.get('MessageSid')
      };
    } else {
      throw new Error('Invalid Twilio webhook format');
    }

    const { From: senderPhone, Body: messageBody, MessageSid } = twilioData;

    console.log(`[SMS Adapter] SMS de ${senderPhone}: "${messageBody}"`);

    if (!senderPhone || !messageBody) {
      console.error('[SMS Adapter] Données Twilio invalides:', twilioData);
      return res.status(400).json({
        success: false,
        error: 'Missing From or Body parameters'
      });
    }

    // 2. VALIDER LE MESSAGE
    if (messageBody.trim().length === 0) {
      return await sendSMS(senderPhone, 'Message vide reçu. Envoyez une question pour Emma IA.');
    }

    // 3. VÉRIFICATION ANTI-SPAM (optionnel)
    // TODO: Implémenter rate limiting basé sur le numéro de téléphone

    // 4. APPELER L'API CHAT CENTRALISÉE
    let chatResponse;
    try {
      // Import dynamique pour éviter les circular dependencies
      const chatModule = await import('../chat.js');

      const chatRequest = {
        method: 'POST',
        body: {
          message: messageBody,
          userId: senderPhone,
          channel: 'sms',
          metadata: {
            messageSid: MessageSid,
            twilioFrom: senderPhone
          }
        }
      };

      // Mock response object
      let chatResponseData = null;
      const chatRes = {
        status: (code) => ({
          json: (data) => {
            chatResponseData = data;
            return chatResponseData;
          }
        }),
        setHeader: () => {}
      };

      await chatModule.default(chatRequest, chatRes);

      if (!chatResponseData || !chatResponseData.success) {
        throw new Error('Chat API returned unsuccessful response');
      }

      chatResponse = chatResponseData;
      console.log(`[SMS Adapter] Réponse reçue de /api/chat (${chatResponse.response.length} chars)`);

    } catch (error) {
      console.error('[SMS Adapter] Erreur appel /api/chat:', error);
      return await sendSMS(
        senderPhone,
        '❌ Désolé, une erreur est survenue. Réessayez dans quelques instants.'
      );
    }

    // 5. ENVOYER LA RÉPONSE PAR SMS via TwiML
    try {
      // Option A: Répondre directement via TwiML (recommandé pour Twilio)
      const response = chatResponse.response;

      console.log(`[SMS Adapter] Envoi réponse via TwiML (${response.length} chars)`);

      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(response)}</Message>
</Response>`);

      // Option B: Envoi manuel (désactivé temporairement)
      // await sendSMS(senderPhone, chatResponse.response);
      // res.setHeader('Content-Type', 'text/xml');
      // return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);

    } catch (error) {
      console.error('[SMS Adapter] Erreur envoi SMS:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send SMS response',
        details: error.message
      });
    }

  } catch (error) {
    console.error('[SMS Adapter] Erreur générale:', error);

    // Tenter d'envoyer un SMS d'erreur
    try {
      if (req.body.From) {
        await sendSMS(
          req.body.From,
          '❌ Erreur système. Contactez le support GOB si le problème persiste.'
        );
      }
    } catch (smsError) {
      console.error('[SMS Adapter] Impossible d\'envoyer SMS d\'erreur:', smsError);
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Envoie un SMS via Twilio
 *
 * @param {string} to - Numéro du destinataire
 * @param {string} message - Message à envoyer
 * @returns {Promise<object>} Résultat Twilio
 */
async function sendSMS(to, message) {
  try {
    const client = getTwilioClient();
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioPhoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER is not configured');
    }

    console.log(`[SMS Adapter] Envoi SMS à ${to} (${message.length} chars)`);

    // Twilio limite: 1600 caractères par SMS
    // Si dépassement, on envoie plusieurs SMS
    if (message.length > 1600) {
      console.log('[SMS Adapter] Message trop long, découpage en plusieurs SMS');

      const chunks = chunkMessage(message, 1500);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const prefix = chunks.length > 1 ? `(${i + 1}/${chunks.length}) ` : '';

        await client.messages.create({
          from: twilioPhoneNumber,
          to: to,
          body: prefix + chunk
        });

        // Délai entre les SMS pour éviter rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`[SMS Adapter] ${chunks.length} SMS envoyés avec succès`);
      return { success: true, messageCount: chunks.length };

    } else {
      // Message simple
      const result = await client.messages.create({
        from: twilioPhoneNumber,
        to: to,
        body: message
      });

      console.log(`[SMS Adapter] SMS envoyé avec succès - SID: ${result.sid}`);
      return result;
    }

  } catch (error) {
    console.error('[SMS Adapter] Erreur Twilio:', error);
    throw error;
  }
}

/**
 * Échappe les caractères XML spéciaux
 *
 * @param {string} text - Le texte à échapper
 * @returns {string} Texte avec caractères XML échappés
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Découpe un message en chunks pour SMS
 *
 * @param {string} text - Le texte à découper
 * @param {number} maxLength - Longueur max par chunk
 * @returns {string[]} Tableau de chunks
 */
function chunkMessage(text, maxLength) {
  const chunks = [];
  let currentChunk = '';

  const sentences = text.split(/(?<=[.!?\n])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // Si une phrase est trop longue, la couper brutalement
      if (sentence.length > maxLength) {
        let remaining = sentence;
        while (remaining.length > 0) {
          chunks.push(remaining.substring(0, maxLength));
          remaining = remaining.substring(maxLength);
        }
        currentChunk = '';
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Exemple de requête Twilio:
 *
 * POST /api/adapters/sms
 * Content-Type: application/x-www-form-urlencoded
 *
 * From=+14385443662&To=+1234567890&Body=Analyse+AAPL&MessageSid=SM1234567890
 *
 * Réponse TwiML:
 * <?xml version="1.0" encoding="UTF-8"?>
 * <Response></Response>
 */
