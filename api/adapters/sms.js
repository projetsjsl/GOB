/**
 * Adaptateur SMS - Twilio
 *
 * Recoit les SMS via Twilio webhook, appelle /api/chat,
 * et renvoie la reponse par SMS.
 *
 * Twilio Configuration:
 * - Account SID: Configure via TWILIO_ACCOUNT_SID env var
 * - Auth Token: Configure via TWILIO_AUTH_TOKEN env var
 * - Phone Number: Configure via TWILIO_PHONE_NUMBER env var
 * - Webhook URL: https://your-app.vercel.app/api/adapters/sms
 */

import twilio from 'twilio';
import { waitUntil } from '@vercel/functions';
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
 * Recoit webhook de Twilio avec format:
 * - From: +14385443662 (numero de l'expediteur)
 * - To: +1234567890 (notre numero Twilio)
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
    console.log('[SMS Adapter] Webhook Twilio recu');
    console.log('[SMS Adapter] Method:', req.method);
    console.log('[SMS Adapter] Content-Type:', req.headers['content-type']);
    console.log('[SMS Adapter] Body type:', typeof req.body);
    console.log('[SMS Adapter] Body keys:', req.body ? Object.keys(req.body) : 'null');

    // 1. PARSER LES DONNEES TWILIO
    // Twilio envoie les donnees en application/x-www-form-urlencoded
    let twilioData;

    // Vercel parse automatiquement application/x-www-form-urlencoded en objet
    if (req.body && typeof req.body === 'object' && (req.body.From || req.body.Body)) {
      // Deja parse par Vercel
      twilioData = req.body;
      console.log('[SMS Adapter] Body deja parse par Vercel');
    } else if (typeof req.body === 'string') {
      // Parser manuellement si necessaire
      console.log('[SMS Adapter] Parsing manuel du body string');
      const params = new URLSearchParams(req.body);
      twilioData = {
        From: params.get('From'),
        To: params.get('To'),
        Body: params.get('Body'),
        MessageSid: params.get('MessageSid')
      };
    } else if (req.body && typeof req.body === 'object') {
      // Essayer d'extraire directement les proprietes
      twilioData = {
        From: req.body.From || req.body.from,
        To: req.body.To || req.body.to,
        Body: req.body.Body || req.body.body || req.body.message,
        MessageSid: req.body.MessageSid || req.body.messageSid || req.body.SmsMessageSid
      };
      console.log('[SMS Adapter] Extraction directe des proprietes');
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

    //  FIX: Nettoyer le numero de telephone (enlever = au debut si present)
    // Probleme: n8n peut envoyer =+15551111111 au lieu de +15551111111
    if (senderPhone && typeof senderPhone === 'string') {
      senderPhone = senderPhone.trim();
      // Enlever = au debut si present (probleme d'URL encoding)
      if (senderPhone.startsWith('=')) {
        senderPhone = senderPhone.substring(1);
        console.log(`[SMS Adapter]  Numero nettoye (enleve = au debut): ${senderPhone}`);
      }
      // Valider format (doit commencer par +)
      if (!senderPhone.startsWith('+')) {
        console.error(`[SMS Adapter]  Format numero invalide: ${senderPhone}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format',
          details: `Phone number must start with +, got: ${senderPhone}`
        });
      }
    }

    //  FIX: Nettoyer le message (enlever = au debut si present)
    // Probleme: n8n peut envoyer =TEST... ou =ANALYSE AAPL... au lieu de TEST... ou ANALYSE AAPL...
    if (messageBody && typeof messageBody === 'string') {
      const originalMessage = messageBody;
      messageBody = messageBody.trim();
      // Enlever = au debut si present (probleme d'URL encoding)
      if (messageBody.startsWith('=')) {
        messageBody = messageBody.substring(1);
        console.log(`[SMS Adapter]  Message nettoye (enleve = au debut): "${originalMessage}" -> "${messageBody}"`);
      }
    }

    console.log(`[SMS Adapter] SMS de ${senderPhone}: "${messageBody}"`);

    if (!senderPhone || !messageBody) {
      console.error('[SMS Adapter] Donnees Twilio invalides:', twilioData);
      return res.status(400).json({
        success: false,
        error: 'Missing From or Body parameters'
      });
    }

    // 2. VALIDER LE MESSAGE
    if (messageBody.trim().length === 0) {
      return await sendSMS(senderPhone, 'Message vide recu. Envoyez une question pour Emma IA.');
    }

    // 3. DETECTER LES COMMANDES D'INVITATION (Admin uniquement)
    if (isKnownContact(senderPhone) && isInvitationCommand(messageBody)) {
      console.log('[SMS Adapter] Commande d\'invitation detectee');

      try {
        const invitationResult = await handleInvitationCommand(messageBody, senderPhone);

        console.log(`[SMS Adapter] Resultat invitation: ${invitationResult.success ? 'Succes' : 'Echec'}`);

        // Repondre a l'admin via TwiML
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
  <Message> Erreur lors de l'envoi de l'invitation. Verifiez les logs.</Message>
</Response>`);
      }
    }

    // 4. VERIFICATION ANTI-SPAM (optionnel)
    // TODO: Implementer rate limiting base sur le numero de telephone

    //  FIX TIMEOUT N8N: Repondre immediatement a n8n (< 5s) et traiter en arriere-plan
    // n8n a un timeout de 5s, mais l'API Emma peut prendre 30-90s
    // Solution: Repondre immediatement avec TwiML, traiter en arriere-plan
    
    //  FIX MODE TEST: En mode test, generer reponse simulee immediate pour dashboard
    const isTest = isTestPhoneNumber(senderPhone);
    let immediateResponse = ' Message recu! J\'analyse ta demande, je te reviens! ';
    
    if (isTest) {
      console.log('[SMS Adapter]  Mode test: Generation reponse simulee immediate pour dashboard...');
      try {
        // Generer reponse simulee immediatement (sans attendre API chat)
        const simulatedResponse = await generateSimulatedResponse(messageBody, senderPhone);
        immediateResponse = simulatedResponse;
        console.log(`[SMS Adapter]  Reponse simulee generee (${simulatedResponse.length} chars) - Envoyee immediatement a n8n`);
      } catch (simError) {
        console.error('[SMS Adapter] Erreur generation reponse simulee immediate:', simError);
        // Fallback: message par defaut
      }
    }
    
    // 5. PREPARER LA TACHE DE FOND (ARRIERE-PLAN)
    // On la definit mais on ne l'attend pas tout de suite
    const backgroundTask = (async () => {
      // Si mode test, on ne fait rien en arriere-plan (reponse deja simulee)
      if (isTest) {
        console.log('[SMS Adapter]  Mode test: Skip background task');
        return;
      }

      try {
        // 4.5. ENVOYER UN SMS DE CONFIRMATION IMMEDIAT (UX) (Si pas deja fait pour n8n)
        // En prod, n8n a recu le XML mais l'utilisateur sur son mobile ne voit rien encore
        // sauf si le XML Twilio envoie un SMS. Le XML envoyait "Analyse en cours..."
        // On envoie QUAND MEME un SMS de confirmation "Message recu" pour etre sur
        // Ou on s'abstient pour eviter le doublon ?
        // Le XML renvoye a Twilio : <Message> Analyse en cours...</Message>
        // Donc l'utilisateur RECOIT ce message.
        // Envoyer un 2eme message "Message recu" est redondant.
        // On log juste.
        console.log('[SMS Adapter] Confirmation envoyee via TwiML (XML)');

        // 5. APPELER L'API CHAT CENTRALISEE
        let chatResponse;
        try {
          // Import dynamique
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

          // Validation reponse
          if (!chatResponseData) throw new Error('Chat API returned no data');
          if (!chatResponseData.success) {
            console.error('[SMS Adapter]  Chat API error:', JSON.stringify(chatResponseData, null, 2));
            throw new Error(`Chat API error: ${chatResponseData.error}`);
          }

          chatResponse = chatResponseData;
          console.log(`[SMS Adapter]  Reponse recue de /api/chat (${chatResponse.response?.length || 0} chars)`);

        } catch (error) {
          console.error('[SMS Adapter] Erreur appel /api/chat:', error);
          // Pour les vrais utilisateurs, une erreur ici est fatale pour l'analyse
          // On propage pour le catch global qui enverra le Rescue SMS
          throw error;
        }

        // 6. ENVOYER LA REPONSE PAR SMS
        try {
          let response = chatResponse.response;

          // Protection anti-spam / Limite SMS
          // Au lieu de rejeter, on tronque a ~3 SMS (4400 chars + suffixe)
          if (response.length > 4500) {
            console.warn(`[SMS Adapter] Reponse trop longue (${response.length} chars), tronquee a 4500.`);
            response = response.substring(0, 4400) + "\n\n[...Suite trop longue pour SMS]";
          }

          console.log(`[SMS Adapter] Envoi reponse finale via Twilio API`);
          await sendSMS(senderPhone, response);

          // 6.5. EMAIL (Non-bloquant)
          sendConversationEmail({
            userName: chatResponse.metadata?.name || senderPhone,
            userPhone: senderPhone,
            userId: chatResponse.metadata?.user_id || 'unknown',
            userMessage: messageBody,
            emmaResponse: chatResponse.response,
            metadata: {
              conversationId: chatResponse.metadata?.conversation_id,
              model: chatResponse.metadata?.model,
              timestamp: new Date().toISOString()
            }
          }).catch(e => console.error(' Email notification failed:', e.message));

        } catch (error) {
          console.error('[SMS Adapter] Erreur envoi SMS final:', error);
          throw error;
        }

      } catch (error) {
        console.error('[SMS Adapter]  CRITICAL BACKGROUND ERROR:', error);
        // RESCUE SMS
        try {
          await sendSMS(
            senderPhone,
            ' Desole, une erreur technique est survenue. Veuillez reessayer.'
          );
        } catch (e) {
          console.error('Failed to send rescue SMS:', e);
        }
      }
    })();

    //  FIX: Enregistrer la tache de fond AVANT de repondre
    // Cela garantit que Vercel est au courant qu'il doit attendre
    waitUntil(backgroundTask);

    // 7. REPONDRE AU WEBHOOK (immediatement)
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(immediateResponse)}</Message>
</Response>`);
    
    // Fin de la fonction handler
    return;

  } catch (error) {
    console.error('[SMS Adapter] Erreur generale Handler:', error);
    console.error('[SMS Adapter] Erreur generale:', error);

    // Tenter d'envoyer un SMS d'erreur
    try {
      if (req.body.From) {
        await sendSMS(
          req.body.From,
          ' Erreur systeme. Contactez le support GOB si le probleme persiste.'
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
 * Genere une reponse simulee basee sur l'intent detecte (mode test uniquement)
 * @param {string} message - Message de l'utilisateur
 * @param {string} phoneNumber - Numero de telephone (pour contexte)
 * @returns {Promise<string>} Reponse simulee formatee pour SMS
 */
async function generateSimulatedResponse(message, phoneNumber) {
  try {
    const analyzer = new HybridIntentAnalyzer();
    const intentResult = await analyzer.analyze(message, { channel: 'sms' });
    
    const intent = intentResult.intent || 'general_conversation';
    const tickers = TickerExtractor.extract(message);
    const primaryTicker = tickers.length > 0 ? tickers[0] : null;
    
    console.log(`[SMS Adapter]  Intent detecte: ${intent}, Ticker: ${primaryTicker || 'aucun'}`);
    
    // Generer reponse selon intent
    let response = '';
    
    switch (intent) {
      case 'comprehensive_analysis':
      case 'fundamentals':
        if (primaryTicker) {
          response = ` ANALYSE ${primaryTicker} (Mode Test)\n\n` +
            ` Prix: ~$150.25 (+2.3%)\n` +
            ` P/E: 28.5x\n` +
            ` Marge: 25.8%\n` +
            ` RSI: 58\n` +
            ` Score JSLAI: 78/100\n\n` +
            ` Solide, croissance stable. Bon point d'entree.`;
        } else {
          response = ` Analyse complete demandee\n\n` +
            `Indiquez un ticker (ex: ANALYSE AAPL) pour une analyse detaillee.`;
        }
        break;
        
      case 'stock_price':
        if (primaryTicker) {
          response = ` ${primaryTicker}: ~$150.25\n` +
            ` +2.3% aujourd'hui\n` +
            ` Volume: 45M\n` +
            ` Derniere mise a jour: maintenant`;
        } else {
          response = ` Indiquez un ticker pour le prix (ex: PRIX AAPL)`;
        }
        break;
        
      case 'technical_analysis':
        if (primaryTicker) {
          response = ` ANALYSE TECHNIQUE ${primaryTicker}\n\n` +
            ` RSI: 58 (neutre)\n` +
            ` MACD: Signal haussier\n` +
            ` Support: $145\n` +
            ` Resistance: $155\n` +
            ` Tendance: Haussiere`;
        } else {
          response = ` Indiquez un ticker pour l'analyse technique`;
        }
        break;
        
      case 'news':
        if (primaryTicker) {
          response = ` ACTUALITES ${primaryTicker}\n\n` +
            `- Resultats Q4 depassent attentes\n` +
            `- Guidance positive pour 2025\n` +
            `- Analystes maintiennent Buy\n\n` +
            ` Il y a 2h`;
        } else {
          response = ` Indiquez un ticker pour les actualites (ex: NEWS AAPL)`;
        }
        break;
        
      case 'greeting':
        response = ` Bonjour ! Je suis Emma, ton assistante financiere IA.\n\n` +
          `Je peux analyser des actions, donner des prix, actualites, et plus.\n\n` +
          `Exemples:\n- ANALYSE AAPL\n- PRIX TSLA\n- NEWS MSFT`;
        break;
        
      case 'help':
        response = ` AIDE EMMA\n\n` +
          ` ANALYSE [TICKER] - Analyse complete\n` +
          ` PRIX [TICKER] - Prix actuel\n` +
          ` RSI [TICKER] - Indicateurs techniques\n` +
          ` NEWS [TICKER] - Actualites recentes\n` +
          ` LISTE - Votre watchlist\n\n` +
          ` Mode TEST - Reponses simulees`;
        break;
        
      case 'recommendation':
        if (primaryTicker) {
          response = ` RECOMMANDATION ${primaryTicker}\n\n` +
            ` ACHETER\n` +
            ` Score JSLAI: 78/100\n` +
            ` Prix cible: $165\n` +
            ` Horizon: 12 mois\n\n` +
            ` Solide fondamentaux, bonne croissance.`;
        } else {
          response = ` Indiquez un ticker pour une recommandation`;
        }
        break;
        
      case 'market_overview':
        response = ` MARCHE ACTUEL\n\n` +
          ` S&P 500: +0.8%\n` +
          ` NASDAQ: +1.2%\n` +
          ` DOW: +0.5%\n\n` +
          ` Sentiment: Positif\n` +
          ` Secteurs: Tech en tete`;
        break;
        
      default:
        if (primaryTicker) {
          response = ` ${primaryTicker} (Mode Test)\n\n` +
            ` Prix: ~$150.25\n` +
            ` Variation: +2.3%\n\n` +
            ` Utilisez ANALYSE ${primaryTicker} pour plus de details.`;
        } else {
          response = ` Je suis Emma, assistante financiere IA.\n\n` +
            `Je peux analyser des actions, donner des prix, actualites, etc.\n\n` +
            `Exemples:\n- ANALYSE AAPL\n- PRIX TSLA\n- NEWS MSFT`;
        }
    }
    
    // Ajouter emoji Emma au debut de facon intelligente
    // Eviter le "Double Salut" (ex: " Salut! Salut Daniel")
    const greetingRegex = /^(salut|bonjour|hello|hi|hey|coucou|bonsoir)/i;
    
    if (!response.startsWith('') && !response.startsWith('') && !response.startsWith('') && !response.startsWith('') && !response.startsWith('') && !response.startsWith('') && !response.startsWith('') && !response.startsWith('') && !response.startsWith('')) {
      // Si la reponse commence deja par une salutation, on insere l'emoji AVANT
      if (greetingRegex.test(response)) {
         response = ` ${response}`;
      } else {
         response = ` ${response}`;
      }
    }
    
    return response;
    
  } catch (error) {
    console.error('[SMS Adapter] Erreur generation reponse simulee:', error);
    // Fallback: reponse generique
    return ` Mode TEST - Reponse simulee\n\nJe suis Emma, assistante financiere IA. En mode test, je genere des reponses simulees.\n\nPour une vraie analyse, utilisez gobapps.com`;
  }
}

/**
 * Detecte si un numero est un numero de test/fictif
 * @param {string} phoneNumber - Numero de telephone a verifier
 * @returns {boolean} true si c'est un numero de test
 */
function isTestPhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  
  const cleaned = phoneNumber.trim().replace(/^=/, ''); // Enlever = au debut
  
  // Patterns de numeros de test communs (SEULEMENT numeros 555)
  const testPatterns = [
    /^\+1555\d{7}$/,        // +1555XXXXXXX (US test numbers)
    /^\+15551\d{6}$/,       // +15551XXXXXX (US test numbers)
    /^\+1555123\d{4}$/,     // +1555123XXXX (US test numbers)
    /^\+1555111\d{4}$/,     // +1555111XXXX (US test numbers)
    /^\+1555222\d{4}$/,     // +1555222XXXX (US test numbers)
    /^\+1555987\d{4}$/,     // +1555987XXXX (US test numbers)
    //  FIX: Removed /^\+1\d{10}$/ - was matching ALL US numbers as test!
  ];
  
  // Verifier si le numero correspond a un pattern de test
  const isTestPattern = testPatterns.some(pattern => pattern.test(cleaned));
  
  // Verifier aussi si c'est un numero connu de test
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
 * @param {string} to - Numero du destinataire
 * @param {string} message - Message a envoyer
 * @param {boolean} simulate - Forcer mode simulation (optionnel)
 * @returns {Promise<object>} Resultat Twilio
 */
async function sendSMS(to, message, simulate = false) {
  try {
    //  FIX: Nettoyer et valider le numero de telephone
    if (to && typeof to === 'string') {
      to = to.trim();
      // Enlever = au debut si present (probleme d'URL encoding)
      if (to.startsWith('=')) {
        to = to.substring(1);
        console.log(`[SMS Adapter]  Numero nettoye (enleve = au debut): ${to}`);
      }
      // Valider format (doit commencer par +)
      if (!to.startsWith('+')) {
        throw new Error(`Invalid phone number format: ${to} (must start with +)`);
      }
    } else {
      throw new Error(`Invalid phone number type: ${typeof to}, value: ${to}`);
    }

    //  FIX: Detecter automatiquement les numeros de test et activer simulation
    // Evite d'appeler Twilio avec des numeros invalides
    if (!simulate && isTestPhoneNumber(to)) {
      console.log(`[SMS Adapter]  Numero de test detecte: ${to} -> Mode simulation active automatiquement`);
      simulate = true;
    }

    //  MODE SIMULATION: Ne pas envoyer de vrai SMS
    if (simulate) {
      console.log(`[SMS Adapter]  MODE SIMULATION - SMS NON ENVOYE a ${to} (${message.length} chars)`);
      console.log(`[SMS Adapter]  Contenu simule: "${message.substring(0, 100)}..."`);
      return { 
        success: true, 
        simulated: true, 
        messageCount: message.length > 1600 ? Math.ceil(message.length / 1500) : 1,
        message: 'SMS simule (pas envoye)'
      };
    }

    const client = getTwilioClient();
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioPhoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER is not configured');
    }

    console.log(`[SMS Adapter] Envoi SMS a ${to} (${message.length} chars)`);

    // Twilio limite: 1600 caracteres par SMS
    // Si depassement, on envoie plusieurs SMS
    if (message.length > 1600) {
      console.log('[SMS Adapter] Message trop long, decoupage en plusieurs SMS');

      // Limite reelle: 1600 (Twilio) - 30 (prefixe " Partie X/Y\n\n") - 70 (marge securite)
      const chunks = chunkMessage(message, 1500);

      // Envoyer les SMS dans l'ORDRE NORMAL (1, 2, 3...)
      // Les reseaux modernes trient souvent par timestamp de reception
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        //  PAS d'emoji  dans le prefixe (force UCS-2 = cout x2.3)
        const prefix = chunks.length > 1 ? ` Partie ${i + 1}/${chunks.length}\n\n` : ' ';

        await client.messages.create({
          from: twilioPhoneNumber,
          to: to,
          body: prefix + chunk
        });

        // Delai explicite entre les SMS pour garantir l'ordre de reception
        // 5 secondes garantit que le premier message a un timestamp distinct du second
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      console.log(`[SMS Adapter] ${chunks.length} SMS envoyes avec succes`);
      return { success: true, messageCount: chunks.length };

    } else {
      // Message simple (< 1600 chars) - Ajouter emoji Emma au debut SI PAS DEJA PRESENT
      const hasEmmaEmoji = message.startsWith('');
      const finalMessage = hasEmmaEmoji ? message : ` ${message}`;
      
      const result = await client.messages.create({
        from: twilioPhoneNumber,
        to: to,
        body: finalMessage
      });

      console.log(`[SMS Adapter] SMS envoye avec succes - SID: ${result.sid}`);
      return result;
    }

  } catch (error) {
    console.error('[SMS Adapter] Erreur Twilio:', error);
    throw error;
  }
}

/**
 * Echappe les caracteres XML speciaux
 *
 * @param {string} text - Le texte a echapper
 * @returns {string} Texte avec caracteres XML echappes
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
 * Decoupe un message en chunks pour SMS
 * AMELIORATION: Respecte les sections completes (titres + contenu)
 *
 * @param {string} text - Le texte a decouper
 * @param {number} maxLength - Longueur max par chunk
 * @returns {string[]} Tableau de chunks
 */
function chunkMessage(text, maxLength) {
  const chunks = [];
  let currentChunk = '';

  //  AMELIORATION: Decouper par sections (paragraphes) au lieu de phrases
  // Cela evite de couper un titre de son contenu
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    const paragraphWithSpacing = currentChunk ? '\n\n' + paragraph : paragraph;
    
    // Si ajouter ce paragraphe ne depasse pas la limite
    if ((currentChunk + paragraphWithSpacing).length <= maxLength) {
      currentChunk += paragraphWithSpacing;
    } else {
      // Sauvegarder le chunk actuel si non vide
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Si le paragraphe seul est trop long, le decouper par phrases
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
 * Exemple de requete Twilio:
 *
 * POST /api/adapters/sms
 * Content-Type: application/x-www-form-urlencoded
 *
 * From=+14385443662&To=+1234567890&Body=Analyse+AAPL&MessageSid=SM1234567890
 *
 * Reponse TwiML:
 * <?xml version="1.0" encoding="UTF-8"?>
 * <Response></Response>
 */
