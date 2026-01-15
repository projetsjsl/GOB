/**
 * Adaptateur Facebook Messenger
 *
 * Recoit les messages via Messenger webhook,
 * appelle /api/chat, et renvoie la reponse via Messenger Send API.
 *
 * Configuration requise:
 * 1. Creer une app Facebook sur developers.facebook.com
 * 2. Ajouter le produit "Messenger"
 * 3. Generer un Page Access Token
 * 4. Configurer le webhook URL: https://your-app.vercel.app/api/adapters/messenger
 * 5. Souscrire aux evenements: messages, messaging_postbacks
 */

/**
 * Handler POST /api/adapters/messenger (webhook)
 * Handler GET /api/adapters/messenger (verification)
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // WEBHOOK VERIFICATION (GET)
  if (req.method === 'GET') {
    return handleVerification(req, res);
  }

  // MESSAGE HANDLING (POST)
  if (req.method === 'POST') {
    return handleWebhook(req, res);
  }

  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed'
  });
}

/**
 * Verification du webhook (GET)
 * Facebook envoie cette requete pour verifier l'authenticite du webhook
 */
function handleVerification(req, res) {
  const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || 'gob_emma_verify_token_2025';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('[Messenger Adapter] Verification request:', { mode, token });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Messenger Adapter] Webhook verified successfully');
    return res.status(200).send(challenge);
  } else {
    console.error('[Messenger Adapter] Verification failed');
    return res.status(403).send('Forbidden');
  }
}

/**
 * Gestion des messages entrants (POST)
 */
async function handleWebhook(req, res) {
  try {
    console.log('[Messenger Adapter] Webhook event received');

    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      console.error('[Messenger Adapter] Invalid webhook format:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook format'
      });
    }

    // Repondre immediatement a Facebook (obligatoire)
    res.status(200).send('EVENT_RECEIVED');

    // Traiter les evenements de maniere asynchrone
    for (const pageEntry of entry) {
      const webhookEvent = pageEntry.messaging?.[0];

      if (!webhookEvent) {
        console.log('[Messenger Adapter] No messaging event found');
        continue;
      }

      // Ignorer les messages de notre propre bot
      if (webhookEvent.message?.is_echo) {
        console.log('[Messenger Adapter] Echo message ignored');
        continue;
      }

      // Traiter le message
      await processMessage(webhookEvent);
    }

  } catch (error) {
    console.error('[Messenger Adapter] Error handling webhook:', error);
    // Ne pas renvoyer d'erreur a Facebook, on a deja repondu 200
  }
}

/**
 * Traite un message Messenger
 */
async function processMessage(event) {
  try {
    const senderId = event.sender.id;
    const messageText = event.message?.text;

    if (!messageText) {
      console.log('[Messenger Adapter] Non-text message, ignored');
      return;
    }

    console.log(`[Messenger Adapter] Message de ${senderId}: "${messageText}"`);

    // Envoyer "typing..." pour montrer que le bot traite
    await sendTypingIndicator(senderId, true);

    // 1. APPELER L'API CHAT CENTRALISEE
    let chatResponse;
    try {
      const chatModule = await import('../chat.js');

      const chatRequest = {
        method: 'POST',
        body: {
          message: messageText,
          userId: senderId,
          channel: 'messenger',
          metadata: {
            messengerId: senderId,
            timestamp: event.timestamp
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
      console.log(`[Messenger Adapter] Reponse recue de /api/chat`);

    } catch (error) {
      console.error('[Messenger Adapter] Erreur appel /api/chat:', error);
      await sendTypingIndicator(senderId, false);
      await sendTextMessage(
        senderId,
        ' Desole, une erreur est survenue. Reessayez dans quelques instants.'
      );
      return;
    }

    // 2. ENVOYER LA REPONSE VIA MESSENGER
    await sendTypingIndicator(senderId, false);
    await sendTextMessage(senderId, chatResponse.response);

    console.log('[Messenger Adapter] Message envoye avec succes');

  } catch (error) {
    console.error('[Messenger Adapter] Erreur processMessage:', error);
  }
}

/**
 * Envoie un message texte via Messenger Send API
 */
async function sendTextMessage(recipientId, text) {
  try {
    const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

    if (!PAGE_ACCESS_TOKEN) {
      throw new Error('MESSENGER_PAGE_ACCESS_TOKEN is not configured');
    }

    // Messenger limite: 2000 caracteres par message
    if (text.length > 2000) {
      console.log('[Messenger Adapter] Message trop long, decoupage');
      const chunks = chunkMessage(text, 1900);

      for (const chunk of chunks) {
        await sendTextMessage(recipientId, chunk);
        // Delai entre les messages
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return;
    }

    const requestBody = {
      recipient: { id: recipientId },
      message: { text: text }
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Messenger API error: ${error}`);
    }

    const result = await response.json();
    console.log(`[Messenger Adapter] Message envoye - ID: ${result.message_id}`);

    return result;

  } catch (error) {
    console.error('[Messenger Adapter] Erreur sendTextMessage:', error);
    throw error;
  }
}

/**
 * Envoie l'indicateur "typing..." ou "mark_seen"
 */
async function sendTypingIndicator(recipientId, isTyping = true) {
  try {
    const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

    if (!PAGE_ACCESS_TOKEN) {
      return; // Non-bloquant
    }

    const action = isTyping ? 'typing_on' : 'typing_off';

    const requestBody = {
      recipient: { id: recipientId },
      sender_action: action
    };

    await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

  } catch (error) {
    console.error('[Messenger Adapter] Erreur typing indicator:', error);
    // Non-bloquant, on continue
  }
}

/**
 * Envoie une reponse rapide (Quick Reply)
 */
async function sendQuickReply(recipientId, text, quickReplies) {
  try {
    const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

    if (!PAGE_ACCESS_TOKEN) {
      throw new Error('MESSENGER_PAGE_ACCESS_TOKEN is not configured');
    }

    const requestBody = {
      recipient: { id: recipientId },
      message: {
        text: text,
        quick_replies: quickReplies.map(reply => ({
          content_type: 'text',
          title: reply.title,
          payload: reply.payload
        }))
      }
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Messenger API error: ${error}`);
    }

    return await response.json();

  } catch (error) {
    console.error('[Messenger Adapter] Erreur sendQuickReply:', error);
    throw error;
  }
}

/**
 * Decoupe un message en chunks
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
      currentChunk = sentence.length > maxLength
        ? sentence.substring(0, maxLength)
        : sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Configuration Facebook App:
 *
 * 1. Aller sur developers.facebook.com
 * 2. Creer une app -> Type: Business
 * 3. Ajouter Messenger
 * 4. Generer un Page Access Token
 * 5. Webhooks:
 *    - Callback URL: https://your-app.vercel.app/api/adapters/messenger
 *    - Verify Token: gob_emma_verify_token_2025 (ou votre token custom)
 *    - Events: messages, messaging_postbacks
 *
 * Variables d'environnement:
 * - MESSENGER_PAGE_ACCESS_TOKEN=EAAxxxxx
 * - MESSENGER_VERIFY_TOKEN=gob_emma_verify_token_2025
 */
