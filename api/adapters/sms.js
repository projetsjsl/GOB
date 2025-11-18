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
import { sendConversationEmail } from '../../lib/email-notifier.js';
import { isInvitationCommand, handleInvitationCommand } from '../../lib/invitation-handler.js';
import { isKnownContact } from '../../lib/phone-contacts.js';
import { HybridIntentAnalyzer } from '../../lib/intent-analyzer.js';
import { TickerExtractor } from '../../lib/utils/ticker-extractor.js';

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
    console.log('[SMS Adapter] Method:', req.method);
    console.log('[SMS Adapter] Content-Type:', req.headers['content-type']);
    console.log('[SMS Adapter] Body type:', typeof req.body);
    console.log('[SMS Adapter] Body keys:', req.body ? Object.keys(req.body) : 'null');

    // 1. PARSER LES DONNÉES TWILIO
    // Twilio envoie les données en application/x-www-form-urlencoded
    let twilioData;

    // Vercel parse automatiquement application/x-www-form-urlencoded en objet
    if (req.body && typeof req.body === 'object' && (req.body.From || req.body.Body)) {
      // Déjà parsé par Vercel
      twilioData = req.body;
      console.log('[SMS Adapter] Body déjà parsé par Vercel');
    } else if (typeof req.body === 'string') {
      // Parser manuellement si nécessaire
      console.log('[SMS Adapter] Parsing manuel du body string');
      const params = new URLSearchParams(req.body);
      twilioData = {
        From: params.get('From'),
        To: params.get('To'),
        Body: params.get('Body'),
        MessageSid: params.get('MessageSid')
      };
    } else if (req.body && typeof req.body === 'object') {
      // Essayer d'extraire directement les propriétés
      twilioData = {
        From: req.body.From || req.body.from,
        To: req.body.To || req.body.to,
        Body: req.body.Body || req.body.body || req.body.message,
        MessageSid: req.body.MessageSid || req.body.messageSid || req.body.SmsMessageSid
      };
      console.log('[SMS Adapter] Extraction directe des propriétés');
    } else {
      console.error('[SMS Adapter] Format body invalide:', {
        type: typeof req.body,
        body: req.body,
        headers: req.headers
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid Twilio webhook format',
        details: 'Body is not in expected format'
      });
    }

    let { From: senderPhone, Body: messageBody, MessageSid } = twilioData;

    // ✅ FIX: Nettoyer le numéro de téléphone (enlever = au début si présent)
    // Problème: n8n peut envoyer =+15551111111 au lieu de +15551111111
    if (senderPhone && typeof senderPhone === 'string') {
      senderPhone = senderPhone.trim();
      // Enlever = au début si présent (problème d'URL encoding)
      if (senderPhone.startsWith('=')) {
        senderPhone = senderPhone.substring(1);
        console.log(`[SMS Adapter] ⚠️ Numéro nettoyé (enlevé = au début): ${senderPhone}`);
      }
      // Valider format (doit commencer par +)
      if (!senderPhone.startsWith('+')) {
        console.error(`[SMS Adapter] ❌ Format numéro invalide: ${senderPhone}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format',
          details: `Phone number must start with +, got: ${senderPhone}`
        });
      }
    }

    // ✅ FIX: Nettoyer le message (enlever = au début si présent)
    // Problème: n8n peut envoyer =TEST... ou =ANALYSE AAPL... au lieu de TEST... ou ANALYSE AAPL...
    if (messageBody && typeof messageBody === 'string') {
      const originalMessage = messageBody;
      messageBody = messageBody.trim();
      // Enlever = au début si présent (problème d'URL encoding)
      if (messageBody.startsWith('=')) {
        messageBody = messageBody.substring(1);
        console.log(`[SMS Adapter] ⚠️ Message nettoyé (enlevé = au début): "${originalMessage}" → "${messageBody}"`);
      }
    }

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

    // 3. DÉTECTER LES COMMANDES D'INVITATION (Admin uniquement)
    if (isKnownContact(senderPhone) && isInvitationCommand(messageBody)) {
      console.log('[SMS Adapter] Commande d\'invitation détectée');

      try {
        const invitationResult = await handleInvitationCommand(messageBody, senderPhone);

        console.log(`[SMS Adapter] Résultat invitation: ${invitationResult.success ? 'Succès' : 'Échec'}`);

        // Répondre à l'admin via TwiML
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(invitationResult.response)}</Message>
</Response>`);

      } catch (inviteError) {
        console.error('[SMS Adapter] Erreur commande invitation:', inviteError);
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>❌ Erreur lors de l'envoi de l'invitation. Vérifiez les logs.</Message>
</Response>`);
      }
    }

    // 4. VÉRIFICATION ANTI-SPAM (optionnel)
    // TODO: Implémenter rate limiting basé sur le numéro de téléphone

    // ✅ FIX TIMEOUT N8N: Répondre immédiatement à n8n (< 5s) et traiter en arrière-plan
    // n8n a un timeout de 5s, mais l'API Emma peut prendre 30-90s
    // Solution: Répondre immédiatement avec TwiML, traiter en arrière-plan
    
    // ✅ FIX MODE TEST: En mode test, générer réponse simulée immédiate pour dashboard
    const isTest = isTestPhoneNumber(senderPhone);
    let immediateResponse = '⏳ Analyse en cours, réponse dans quelques instants...';
    
    if (isTest) {
      console.log('[SMS Adapter] 🧪 Mode test: Génération réponse simulée immédiate pour dashboard...');
      try {
        // Générer réponse simulée immédiatement (sans attendre API chat)
        const simulatedResponse = await generateSimulatedResponse(messageBody, senderPhone);
        immediateResponse = simulatedResponse;
        console.log(`[SMS Adapter] 🧪 Réponse simulée générée (${simulatedResponse.length} chars) - Envoyée immédiatement à n8n`);
      } catch (simError) {
        console.error('[SMS Adapter] Erreur génération réponse simulée immédiate:', simError);
        // Fallback: message par défaut
      }
    }
    
    // Répondre immédiatement à n8n (avec réponse simulée en mode test, ou message d'attente en prod)
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(immediateResponse)}</Message>
</Response>`);
    
    // Traiter la requête en arrière-plan (ne pas bloquer la réponse n8n)
    // En mode test, on a déjà envoyé la réponse simulée, donc on peut skip le traitement
    if (isTest) {
      console.log('[SMS Adapter] 🧪 Mode test: Réponse simulée déjà envoyée, skip traitement arrière-plan');
      return;
    }
    
    (async () => {
      try {
        // 4.5. ENVOYER UN SMS DE CONFIRMATION IMMÉDIAT (UX)
        // L'utilisateur sait qu'Emma travaille pendant le traitement
        try {
          await sendSMS(
            senderPhone,
            '👩🏻 Message reçu! J\'analyse ta demande, je te reviens! 📈🔍⏳'
          );
          console.log('[SMS Adapter] SMS de confirmation envoyé');
        } catch (confirmError) {
          console.error('[SMS Adapter] Erreur envoi SMS confirmation:', confirmError);
          // Non-bloquant: on continue même si la confirmation échoue
        }

        // 5. APPELER L'API CHAT CENTRALISÉE
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

          // ✅ FIX: Logging détaillé pour diagnostiquer les erreurs
          if (!chatResponseData) {
            console.error('[SMS Adapter] ❌ Chat API n\'a retourné aucune donnée');
            throw new Error('Chat API returned no data');
          }

          if (!chatResponseData.success) {
            console.error('[SMS Adapter] ❌ Chat API returned unsuccessful response:');
            console.error('[SMS Adapter] ❌ Error:', chatResponseData.error);
            console.error('[SMS Adapter] ❌ Details:', chatResponseData.details);
            console.error('[SMS Adapter] ❌ Full response:', JSON.stringify(chatResponseData, null, 2));
            throw new Error(`Chat API returned unsuccessful response: ${chatResponseData.error || 'Unknown error'}`);
          }

          chatResponse = chatResponseData;
          console.log(`[SMS Adapter] ✅ Réponse reçue de /api/chat (${chatResponse.response?.length || 0} chars)`);

        } catch (error) {
          console.error('[SMS Adapter] Erreur appel /api/chat:', error);
          
          // ✅ FIX: En mode test, générer une réponse simulée basée sur l'intent
          if (isTestPhoneNumber(senderPhone)) {
            console.log('[SMS Adapter] 🧪 Mode test: Génération réponse simulée basée sur intent...');
            try {
              const simulatedResponse = await generateSimulatedResponse(messageBody, senderPhone);
              console.log(`[SMS Adapter] 🧪 Réponse simulée générée (${simulatedResponse.length} chars)`);
              
              // Envoyer la réponse simulée
              await sendSMS(senderPhone, simulatedResponse);
              return;
            } catch (simError) {
              console.error('[SMS Adapter] Erreur génération réponse simulée:', simError);
              // Fallback: message d'erreur standard
            }
          }
          
          // Message d'erreur standard (si pas en mode test ou si simulation échoue)
          await sendSMS(
            senderPhone,
            '❌ Désolé, une erreur est survenue. Réessayez dans quelques instants.'
          );
          return;
        }

        // 6. ENVOYER LA RÉPONSE PAR SMS (en arrière-plan)
        try {
          const response = chatResponse.response;

          // 🛡️ PROTECTION ANTI-SPAM: Refuser les réponses > 4500 chars (3 SMS max)
          if (response.length > 4500) {
            console.error(`❌ [SMS Adapter] RÉPONSE TROP LONGUE (${response.length} chars) - REFUSÉE!`);

            // Envoyer un message d'erreur court
            await sendSMS(
              senderPhone,
              "❌ Désolé, la réponse est trop longue pour SMS. Essayez une question plus spécifique ou consultez gobapps.com pour l'analyse complète."
            );
            return;
          }

          // Envoyer la vraie réponse via Twilio API (tous les messages, pas seulement > 800 chars)
          // Car on a déjà répondu à n8n avec TwiML, donc on envoie toujours via API
          console.log(`[SMS Adapter] Envoi réponse via Twilio API (${response.length} chars)`);
          await sendSMS(senderPhone, response);

          // 6.5. ENVOYER NOTIFICATION EMAIL EN ARRIÈRE-PLAN (après SMS)
          sendConversationEmail({
            userName: chatResponse.metadata?.name || senderPhone,
            userPhone: senderPhone,
            userId: chatResponse.metadata?.user_id || 'unknown',
            userMessage: messageBody,
            emmaResponse: chatResponse.response,
            metadata: {
              conversationId: chatResponse.metadata?.conversation_id,
              model: chatResponse.metadata?.model,
              tools_used: chatResponse.metadata?.tools_used || [],
              execution_time_ms: chatResponse.metadata?.execution_time_ms,
              intent_data: chatResponse.metadata?.intent,
              timestamp: new Date().toISOString()
            }
          }).then(() => {
            console.log('✅ [SMS Adapter] Notification email envoyée (arrière-plan)');
          }).catch((emailError) => {
            console.error('⚠️ [SMS Adapter] Erreur envoi email (non-bloquant):', emailError.message);
          });

        } catch (error) {
          console.error('[SMS Adapter] Erreur envoi SMS (arrière-plan):', error);
          // Envoyer message d'erreur à l'utilisateur
          try {
            await sendSMS(
              senderPhone,
              '❌ Erreur technique. Réessayez ou consultez gobapps.com'
            );
          } catch (smsError) {
            console.error('[SMS Adapter] Impossible d\'envoyer SMS d\'erreur:', smsError);
          }
        }
      } catch (error) {
        console.error('[SMS Adapter] Erreur traitement arrière-plan:', error);
        // Envoyer message d'erreur à l'utilisateur
        try {
          await sendSMS(
            senderPhone,
            '❌ Erreur système. Contactez le support GOB si le problème persiste.'
          );
        } catch (smsError) {
          console.error('[SMS Adapter] Impossible d\'envoyer SMS d\'erreur:', smsError);
        }
      }
    })();
    
    // Retourner immédiatement (réponse déjà envoyée ci-dessus)
    return;

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
 * Génère une réponse simulée basée sur l'intent détecté (mode test uniquement)
 * @param {string} message - Message de l'utilisateur
 * @param {string} phoneNumber - Numéro de téléphone (pour contexte)
 * @returns {Promise<string>} Réponse simulée formatée pour SMS
 */
async function generateSimulatedResponse(message, phoneNumber) {
  try {
    const analyzer = new HybridIntentAnalyzer();
    const intentResult = await analyzer.analyze(message, { channel: 'sms' });
    
    const intent = intentResult.intent || 'general_conversation';
    const tickers = TickerExtractor.extract(message);
    const primaryTicker = tickers.length > 0 ? tickers[0] : null;
    
    console.log(`[SMS Adapter] 🧪 Intent détecté: ${intent}, Ticker: ${primaryTicker || 'aucun'}`);
    
    // Générer réponse selon intent
    let response = '';
    
    switch (intent) {
      case 'comprehensive_analysis':
      case 'fundamentals':
        if (primaryTicker) {
          response = `📊 ANALYSE ${primaryTicker} (Mode Test)\n\n` +
            `💰 Prix: ~$150.25 (+2.3%)\n` +
            `📈 P/E: 28.5x\n` +
            `💵 Marge: 25.8%\n` +
            `📊 RSI: 58\n` +
            `🎯 Score JSLAI: 78/100\n\n` +
            `✅ Solide, croissance stable. Bon point d'entrée.`;
        } else {
          response = `📊 Analyse complète demandée\n\n` +
            `Indiquez un ticker (ex: ANALYSE AAPL) pour une analyse détaillée.`;
        }
        break;
        
      case 'stock_price':
        if (primaryTicker) {
          response = `💰 ${primaryTicker}: ~$150.25\n` +
            `📈 +2.3% aujourd'hui\n` +
            `📊 Volume: 45M\n` +
            `🕐 Dernière mise à jour: maintenant`;
        } else {
          response = `💰 Indiquez un ticker pour le prix (ex: PRIX AAPL)`;
        }
        break;
        
      case 'technical_analysis':
        if (primaryTicker) {
          response = `📈 ANALYSE TECHNIQUE ${primaryTicker}\n\n` +
            `📊 RSI: 58 (neutre)\n` +
            `📉 MACD: Signal haussier\n` +
            `📈 Support: $145\n` +
            `📉 Résistance: $155\n` +
            `✅ Tendance: Haussière`;
        } else {
          response = `📈 Indiquez un ticker pour l'analyse technique`;
        }
        break;
        
      case 'news':
        if (primaryTicker) {
          response = `📰 ACTUALITÉS ${primaryTicker}\n\n` +
            `• Résultats Q4 dépassent attentes\n` +
            `• Guidance positive pour 2025\n` +
            `• Analystes maintiennent Buy\n\n` +
            `📅 Il y a 2h`;
        } else {
          response = `📰 Indiquez un ticker pour les actualités (ex: NEWS AAPL)`;
        }
        break;
        
      case 'greeting':
        response = `👋 Bonjour ! Je suis Emma, ton assistante financière IA.\n\n` +
          `Je peux analyser des actions, donner des prix, actualités, et plus.\n\n` +
          `Exemples:\n• ANALYSE AAPL\n• PRIX TSLA\n• NEWS MSFT`;
        break;
        
      case 'help':
        response = `🆘 AIDE EMMA\n\n` +
          `📊 ANALYSE [TICKER] - Analyse complète\n` +
          `💰 PRIX [TICKER] - Prix actuel\n` +
          `📈 RSI [TICKER] - Indicateurs techniques\n` +
          `📰 NEWS [TICKER] - Actualités récentes\n` +
          `📋 LISTE - Votre watchlist\n\n` +
          `💡 Mode TEST - Réponses simulées`;
        break;
        
      case 'recommendation':
        if (primaryTicker) {
          response = `💡 RECOMMANDATION ${primaryTicker}\n\n` +
            `🎯 ACHETER\n` +
            `📊 Score JSLAI: 78/100\n` +
            `💰 Prix cible: $165\n` +
            `⏱️ Horizon: 12 mois\n\n` +
            `✅ Solide fondamentaux, bonne croissance.`;
        } else {
          response = `💡 Indiquez un ticker pour une recommandation`;
        }
        break;
        
      case 'market_overview':
        response = `🌍 MARCHÉ ACTUEL\n\n` +
          `📈 S&P 500: +0.8%\n` +
          `📊 NASDAQ: +1.2%\n` +
          `📉 DOW: +0.5%\n\n` +
          `✅ Sentiment: Positif\n` +
          `📊 Secteurs: Tech en tête`;
        break;
        
      default:
        if (primaryTicker) {
          response = `📊 ${primaryTicker} (Mode Test)\n\n` +
            `💰 Prix: ~$150.25\n` +
            `📈 Variation: +2.3%\n\n` +
            `💡 Utilisez ANALYSE ${primaryTicker} pour plus de détails.`;
        } else {
          response = `👋 Je suis Emma, assistante financière IA.\n\n` +
            `Je peux analyser des actions, donner des prix, actualités, etc.\n\n` +
            `Exemples:\n• ANALYSE AAPL\n• PRIX TSLA\n• NEWS MSFT`;
        }
    }
    
    // Ajouter emoji Emma au début si pas déjà présent
    if (!response.startsWith('👩🏻') && !response.startsWith('👋') && !response.startsWith('📊') && !response.startsWith('💰') && !response.startsWith('📈') && !response.startsWith('📰') && !response.startsWith('🆘') && !response.startsWith('💡') && !response.startsWith('🌍')) {
      response = `👩🏻 ${response}`;
    }
    
    return response;
    
  } catch (error) {
    console.error('[SMS Adapter] Erreur génération réponse simulée:', error);
    // Fallback: réponse générique
    return `👩🏻 Mode TEST - Réponse simulée\n\nJe suis Emma, assistante financière IA. En mode test, je génère des réponses simulées.\n\nPour une vraie analyse, utilisez gobapps.com`;
  }
}

/**
 * Détecte si un numéro est un numéro de test/fictif
 * @param {string} phoneNumber - Numéro de téléphone à vérifier
 * @returns {boolean} true si c'est un numéro de test
 */
function isTestPhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  
  const cleaned = phoneNumber.trim().replace(/^=/, ''); // Enlever = au début
  
  // Patterns de numéros de test communs
  const testPatterns = [
    /^\+1555\d{7}$/,        // +1555XXXXXXX (US test numbers)
    /^\+15551\d{6}$/,       // +15551XXXXXX (US test numbers)
    /^\+1555123\d{4}$/,     // +1555123XXXX (US test numbers)
    /^\+1555111\d{4}$/,     // +1555111XXXX (US test numbers)
    /^\+1555222\d{4}$/,     // +1555222XXXX (US test numbers)
    /^\+1555987\d{4}$/,     // +1555987XXXX (US test numbers)
    /^\+1\d{10}$/,          // +1XXXXXXXXXX (US format, mais peut être test)
  ];
  
  // Vérifier si le numéro correspond à un pattern de test
  const isTestPattern = testPatterns.some(pattern => pattern.test(cleaned));
  
  // Vérifier aussi si c'est un numéro connu de test
  const knownTestNumbers = [
    '+15551111111',
    '+15551234567',
    '+15552222222',
    '+15559876543',
    '+15554343638',
    '+15558866755',
    '+15559048339'
  ];
  
  return isTestPattern || knownTestNumbers.includes(cleaned);
}

/**
 * Envoie un SMS via Twilio
 *
 * @param {string} to - Numéro du destinataire
 * @param {string} message - Message à envoyer
 * @param {boolean} simulate - Forcer mode simulation (optionnel)
 * @returns {Promise<object>} Résultat Twilio
 */
async function sendSMS(to, message, simulate = false) {
  try {
    // ✅ FIX: Nettoyer et valider le numéro de téléphone
    if (to && typeof to === 'string') {
      to = to.trim();
      // Enlever = au début si présent (problème d'URL encoding)
      if (to.startsWith('=')) {
        to = to.substring(1);
        console.log(`[SMS Adapter] ⚠️ Numéro nettoyé (enlevé = au début): ${to}`);
      }
      // Valider format (doit commencer par +)
      if (!to.startsWith('+')) {
        throw new Error(`Invalid phone number format: ${to} (must start with +)`);
      }
    } else {
      throw new Error(`Invalid phone number type: ${typeof to}, value: ${to}`);
    }

    // ✅ FIX: Détecter automatiquement les numéros de test et activer simulation
    // Évite d'appeler Twilio avec des numéros invalides
    if (!simulate && isTestPhoneNumber(to)) {
      console.log(`[SMS Adapter] 🧪 Numéro de test détecté: ${to} → Mode simulation activé automatiquement`);
      simulate = true;
    }

    // 🧪 MODE SIMULATION: Ne pas envoyer de vrai SMS
    if (simulate) {
      console.log(`[SMS Adapter] 🧪 MODE SIMULATION - SMS NON ENVOYÉ à ${to} (${message.length} chars)`);
      console.log(`[SMS Adapter] 🧪 Contenu simulé: "${message.substring(0, 100)}..."`);
      return { 
        success: true, 
        simulated: true, 
        messageCount: message.length > 1600 ? Math.ceil(message.length / 1500) : 1,
        message: 'SMS simulé (pas envoyé)'
      };
    }

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

      // Limite réelle: 1600 (Twilio) - 30 (préfixe "👩🏻 Partie X/Y\n\n") - 70 (marge sécurité)
      const chunks = chunkMessage(message, 1500);

      // Envoyer les SMS dans l'ORDRE INVERSE pour compenser l'affichage inversé des téléphones
      // Les téléphones affichent souvent le dernier SMS reçu en haut
      // Donc on envoie 3/3, puis 2/3, puis 1/3 pour qu'ils s'affichent 1/3, 2/3, 3/3
      for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i];
        // 🚨 PAS d'emoji 📱 dans le préfixe (force UCS-2 = coût ×2.3)
        const prefix = chunks.length > 1 ? `👩🏻 Partie ${i + 1}/${chunks.length}\n\n` : '👩🏻 ';

        await client.messages.create({
          from: twilioPhoneNumber,
          to: to,
          body: prefix + chunk
        });

        // Délai entre les SMS pour garantir l'ordre (Twilio peut livrer hors séquence)
        // 5 secondes garantit que le message est REÇU et AFFICHÉ avant d'envoyer le suivant
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      console.log(`[SMS Adapter] ${chunks.length} SMS envoyés avec succès`);
      return { success: true, messageCount: chunks.length };

    } else {
      // Message simple (< 1600 chars) - Ajouter emoji Emma au début SI PAS DÉJÀ PRÉSENT
      const hasEmmaEmoji = message.startsWith('👩🏻');
      const finalMessage = hasEmmaEmoji ? message : `👩🏻 ${message}`;
      
      const result = await client.messages.create({
        from: twilioPhoneNumber,
        to: to,
        body: finalMessage
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
 * AMÉLIORATION: Respecte les sections complètes (titres + contenu)
 *
 * @param {string} text - Le texte à découper
 * @param {number} maxLength - Longueur max par chunk
 * @returns {string[]} Tableau de chunks
 */
function chunkMessage(text, maxLength) {
  const chunks = [];
  let currentChunk = '';

  // 🎯 AMÉLIORATION: Découper par sections (paragraphes) au lieu de phrases
  // Cela évite de couper un titre de son contenu
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    const paragraphWithSpacing = currentChunk ? '\n\n' + paragraph : paragraph;
    
    // Si ajouter ce paragraphe ne dépasse pas la limite
    if ((currentChunk + paragraphWithSpacing).length <= maxLength) {
      currentChunk += paragraphWithSpacing;
    } else {
      // Sauvegarder le chunk actuel si non vide
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Si le paragraphe seul est trop long, le découper par phrases
      if (paragraph.length > maxLength) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        
        for (const sentence of sentences) {
          if ((currentChunk + (currentChunk ? ' ' : '') + sentence).length <= maxLength) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            
            // Phrase trop longue: couper au dernier espace
            if (sentence.length > maxLength) {
              let remaining = sentence;
              while (remaining.length > 0) {
                if (remaining.length <= maxLength) {
                  currentChunk = remaining;
                  remaining = '';
                } else {
                  const lastSpace = remaining.lastIndexOf(' ', maxLength);
                  const cutPos = lastSpace > maxLength * 0.7 ? lastSpace : maxLength;
                  chunks.push(remaining.substring(0, cutPos).trim());
                  remaining = remaining.substring(cutPos).trim();
                }
              }
            } else {
              currentChunk = sentence;
            }
          }
        }
      } else {
        // Le paragraphe entier devient le nouveau chunk
        currentChunk = paragraph;
      }
    }
  }

  // Ajouter le dernier chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Export pour utilisation par emma-agent streaming
export { sendSMS };

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
