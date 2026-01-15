/**
 * Adaptateur Email - ImprovMX + Resend
 *
 * Recoit les emails via webhook n8n (ImprovMX forward),
 * appelle /api/chat, et renvoie la reponse par email via Resend.
 *
 * Flow:
 * 1. Email arrive a emma@gobapps.com (ImprovMX)
 * 2. ImprovMX forward vers n8n webhook
 * 3. n8n parse et call /api/adapters/email
 * 4. Cet endpoint appelle /api/chat
 * 5. Reponse envoyee via Resend
 */

import { Resend } from 'resend';

// Initialiser Resend client
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(apiKey);
};

/**
 * Handler POST /api/adapters/email
 *
 * Body (de n8n):
 * {
 *   from: "user@example.com",
 *   to: "emma@gobapps.com",
 *   subject: "Question sur AAPL",
 *   text: "Peux-tu analyser Apple ?",
 *   html: "<p>Peux-tu analyser Apple ?</p>"
 * }
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
    console.log('[Email Adapter] Webhook email recu');

    // 1. PARSER LES DONNEES EMAIL
    const { from, to, subject, text, html } = req.body;

    if (!from || (!text && !html)) {
      console.error('[Email Adapter] Donnees email invalides:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Missing from, text, or html parameters',
        received: {
          hasFrom: !!from,
          hasText: !!text,
          hasHtml: !!html,
          keys: Object.keys(req.body || {})
        },
        expected: {
          from: 'user@example.com (expediteur)',
          text: 'Contenu texte de email (ou html)',
          html: 'Contenu HTML de email (optionnel si text present)'
        },
        note: 'Cet endpoint est concu pour recevoir des webhooks n8n/ImprovMX, pas des appels directs'
      });
    }

    // Extraire le contenu textuel (priorite: text, sinon strip HTML)
    const messageBody = text || stripHTML(html);

    console.log(`[Email Adapter] Email de ${from}, Sujet: "${subject}"`);
    console.log(`[Email Adapter] Message: "${messageBody.substring(0, 100)}..."`);

    // 2. VALIDATION ANTI-SPAM
    if (messageBody.trim().length === 0) {
      return await sendEmail(
        from,
        'Re: ' + (subject || 'Message vide'),
        'Votre message etait vide. Veuillez envoyer une question pour Emma IA.'
      );
    }

    // Verifier que ce n'est pas une reponse automatique
    if (isAutoReply(subject, messageBody)) {
      console.log('[Email Adapter] Auto-reply detecte, ignore');
      return res.status(200).json({
        success: true,
        message: 'Auto-reply ignored'
      });
    }

    // 3. APPELER L'API CHAT CENTRALISEE
    let chatResponse;
    try {
      const chatModule = await import('../chat.js');

      const chatRequest = {
        method: 'POST',
        body: {
          message: messageBody,
          userId: from,
          channel: 'email',
          metadata: {
            subject: subject,
            originalEmail: from,
            to: to
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
      console.log(`[Email Adapter] Reponse recue de /api/chat`);

    } catch (error) {
      console.error('[Email Adapter] Erreur appel /api/chat:', error);
      return await sendEmail(
        from,
        'Re: ' + (subject || 'Votre question'),
        ' Desole, une erreur est survenue lors du traitement de votre demande. Veuillez reessayer dans quelques instants.\n\nEquipe GOB'
      );
    }

    // 4. ENVOYER LA REPONSE PAR EMAIL
    try {
      // La reponse est deja formatee en HTML par channel-adapter
      await sendEmail(
        from,
        'Re: ' + (subject || 'Votre question'),
        chatResponse.response,
        true // isHTML
      );

      return res.status(200).json({
        success: true,
        message: 'Email response sent',
        conversationId: chatResponse.conversationId
      });

    } catch (error) {
      console.error('[Email Adapter] Erreur envoi email:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send email response',
        details: error.message
      });
    }

  } catch (error) {
    console.error('[Email Adapter] Erreur generale:', error);

    // Tenter d'envoyer un email d'erreur
    try {
      if (req.body.from) {
        await sendEmail(
          req.body.from,
          'Re: ' + (req.body.subject || 'Erreur'),
          ' Une erreur systeme est survenue. Si le probleme persiste, contactez le support GOB.\n\nEquipe GOB'
        );
      }
    } catch (emailError) {
      console.error('[Email Adapter] Impossible d\'envoyer email d\'erreur:', emailError);
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Envoie un email via Resend
 *
 * @param {string} to - Email du destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} content - Contenu (text ou HTML)
 * @param {boolean} isHTML - Si true, content est du HTML
 * @returns {Promise<object>} Resultat Resend
 */
async function sendEmail(to, subject, content, isHTML = false) {
  try {
    const resend = getResendClient();
    const fromEmail = process.env.EMAIL_FROM || 'emma@gob.ai';

    console.log(`[Email Adapter] Envoi email a ${to}`);

    const emailData = {
      from: fromEmail,
      to: to,
      subject: subject
    };

    if (isHTML) {
      emailData.html = content;
    } else {
      emailData.text = content;
    }

    const result = await resend.emails.send(emailData);

    console.log(`[Email Adapter] Email envoye avec succes - ID: ${result.id}`);
    return result;

  } catch (error) {
    console.error('[Email Adapter] Erreur Resend:', error);
    throw error;
  }
}

/**
 * Supprime les balises HTML d'un texte
 *
 * @param {string} html - HTML a convertir
 * @returns {string} Texte brut
 */
function stripHTML(html) {
  if (!html) return '';

  // Remplacer les balises communes par des equivalents texte
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n');

  // Supprimer toutes les autres balises
  text = text.replace(/<[^>]*>/g, '');

  // Decoder les entites HTML
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Nettoyer les espaces multiples
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Detecte si c'est une reponse automatique (Out of Office, etc.)
 *
 * @param {string} subject - Sujet de l'email
 * @param {string} body - Corps de l'email
 * @returns {boolean} True si auto-reply
 */
function isAutoReply(subject, body) {
  const autoReplyIndicators = [
    'out of office',
    'automatic reply',
    'auto-reply',
    'autoreply',
    'absence',
    'vacation',
    'do not reply',
    'unsubscribe',
    'delivery failure',
    'mailer-daemon'
  ];

  const subjectLower = (subject || '').toLowerCase();
  const bodyLower = (body || '').toLowerCase();

  for (const indicator of autoReplyIndicators) {
    if (subjectLower.includes(indicator) || bodyLower.includes(indicator)) {
      return true;
    }
  }

  return false;
}

/**
 * Exemple de requete n8n:
 *
 * POST /api/adapters/email
 * {
 *   "from": "user@example.com",
 *   "to": "emma@gob.ai",
 *   "subject": "Analyse AAPL",
 *   "text": "Peux-tu me donner une analyse d'Apple ?",
 *   "html": "<p>Peux-tu me donner une analyse d'Apple ?</p>"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Email response sent",
 *   "conversationId": "uuid-1234"
 * }
 */
