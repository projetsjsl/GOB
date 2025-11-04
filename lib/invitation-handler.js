/**
 * Invitation Handler - Gestion des invitations SMS via commandes
 *
 * Permet d'envoyer des invitations en textant à Emma:
 * "Invite Marc +18193425966"
 * "Invitation Sophie 514-555-1234"
 */

import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

/**
 * Détecte si un message est une commande d'invitation
 *
 * Patterns reconnus:
 * - "Invite Marc +18193425966"
 * - "Invitation Sophie (514) 555-1234"
 * - "Envoie invitation Pierre 438-555-1234"
 */
export function isInvitationCommand(message) {
  const normalizedMessage = message.toLowerCase().trim();

  // Patterns de commandes
  const patterns = [
    /^invite?\s+/i,          // "Invite ..."
    /^invitation\s+/i,       // "Invitation ..."
    /^envoie?\s+invitation/i // "Envoie invitation ..."
  ];

  return patterns.some(pattern => pattern.test(normalizedMessage));
}

/**
 * Parse une commande d'invitation
 *
 * Extrait le nom et le numéro de téléphone
 *
 * @param {string} message - Le message complet
 * @returns {Object|null} { name, phone } ou null si parsing échoue
 */
export function parseInvitationCommand(message) {
  // Nettoyer le message
  let cleanMessage = message.trim();

  // Enlever le préfixe de commande
  cleanMessage = cleanMessage
    .replace(/^invite?\s+/i, '')
    .replace(/^invitation\s+/i, '')
    .replace(/^envoie?\s+invitation\s+/i, '');

  // Pattern pour extraire nom et téléphone
  // Supporte: "Marc +18193425966", "Sophie (514) 555-1234", "Pierre 438-555-1234"
  const phonePatterns = [
    /\+?\d[\d\s\-\(\)]{9,}/,  // Numéro avec ou sans +, avec espaces/tirets/parenthèses
  ];

  let phone = null;
  let phoneMatch = null;

  // Trouver le numéro
  for (const pattern of phonePatterns) {
    phoneMatch = cleanMessage.match(pattern);
    if (phoneMatch) {
      phone = phoneMatch[0];
      break;
    }
  }

  if (!phone) {
    return null; // Pas de numéro trouvé
  }

  // Normaliser le numéro (enlever espaces, tirets, parenthèses)
  phone = phone.replace(/[\s\-\(\)]/g, '');

  // Ajouter +1 si nécessaire (Canada/USA)
  if (!phone.startsWith('+')) {
    if (phone.length === 10) {
      phone = '+1' + phone;
    } else if (phone.length === 11 && phone.startsWith('1')) {
      phone = '+' + phone;
    }
  }

  // Extraire le nom (tout ce qui est avant le numéro)
  const name = cleanMessage.replace(phoneMatch[0], '').trim();

  if (!name || name.length === 0) {
    return null; // Pas de nom
  }

  return { name, phone };
}

/**
 * Templates d'invitation
 */
const INVITATION_TEMPLATES = {
  standard: (name) => `Bonjour ${name} ! 👋

Je suis Emma, ton assistante IA financière propulsée par JSLAI 🚀

Je peux t'aider avec :
📊 Analyses de marchés et actions
📈 Données financières en temps réel
📰 Nouvelles économiques
💡 Conseils personnalisés

Écris-moi au 1-438-544-EMMA 📱

Pose-moi une question pour essayer !

Pour arrêter: réponds STOP`,

  short: (name) => `Bonjour ${name} ! 👋

Emma, ton assistante IA financière JSLAI 🚀

Analyses marchés • Données temps réel • Conseils

Écris-moi au 1-438-544-EMMA 📱

Essaie maintenant !`,

  vip: (name) => `Bonjour ${name} ! 👋

Accès exclusif à Emma, l'assistante IA JSLAI 🚀

Analyses marchés • Alertes • Conseils stratégiques

Écris-moi au 1-438-544-EMMA 📱

Écris "Test Emma" pour commencer !

Service exclusif JSLAI 💎`
};

/**
 * Envoie une invitation par SMS
 *
 * @param {Object} params - Paramètres de l'invitation
 * @param {string} params.name - Nom du destinataire
 * @param {string} params.phone - Numéro de téléphone
 * @param {string} params.template - Template à utiliser (standard, short, vip)
 * @param {string} params.sentBy - Admin qui envoie (phone ou email)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function sendInvitation({
  name,
  phone,
  template = 'standard',
  sentBy = 'admin'
}) {
  try {
    // 1. Vérifier si déjà invité récemment (30 jours)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: existingInvitation } = await supabase
      .from('sms_invitations')
      .select('*')
      .eq('phone', phone)
      .gte('sent_at', thirtyDaysAgo.toISOString())
      .single();

    if (existingInvitation) {
      return {
        success: false,
        error: 'already_invited',
        message: `${name} a déjà été invité le ${new Date(existingInvitation.sent_at).toLocaleDateString('fr-FR')}`,
        lastInvitation: existingInvitation
      };
    }

    // 2. Générer le message d'invitation
    const templateFunction = INVITATION_TEMPLATES[template] || INVITATION_TEMPLATES.standard;
    const message = templateFunction(name);

    // 3. Envoyer via Twilio
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const twilioMessage = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
      body: message
    });

    console.log(`✅ [Invitation] SMS envoyé à ${name} (${phone}): ${twilioMessage.sid}`);

    // 4. Enregistrer dans la base de données
    const { data: invitation, error: dbError } = await supabase
      .from('sms_invitations')
      .insert({
        phone,
        name,
        template_used: template,
        message_sent: message,
        sent_by: sentBy,
        twilio_message_sid: twilioMessage.sid,
        delivery_status: twilioMessage.status,
        status: 'sent',
        metadata: {
          sent_via: 'sms_command'
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Invitation] Erreur DB (non-bloquant):', dbError);
    }

    // 5. Créer/Mettre à jour user_profile
    await supabase
      .from('user_profiles')
      .upsert({
        phone,
        name,
        metadata: {
          invited: true,
          invitation_date: new Date().toISOString(),
          invited_by: sentBy
        }
      }, {
        onConflict: 'phone'
      });

    return {
      success: true,
      name,
      phone,
      twilioSid: twilioMessage.sid,
      invitationId: invitation?.id,
      message: `✅ Invitation envoyée à ${name} (${phone})`
    };

  } catch (error) {
    console.error('[Invitation] Erreur:', error);
    return {
      success: false,
      error: 'send_failed',
      message: `❌ Erreur lors de l'envoi de l'invitation à ${name}: ${error.message}`,
      details: error
    };
  }
}

/**
 * Traite une commande d'invitation reçue par SMS
 *
 * @param {string} message - Message reçu
 * @param {string} senderPhone - Numéro de l'expéditeur (admin)
 * @returns {Promise<Object>} Résultat du traitement
 */
export async function handleInvitationCommand(message, senderPhone) {
  // 1. Vérifier que c'est une commande d'invitation
  if (!isInvitationCommand(message)) {
    return {
      success: false,
      error: 'not_invitation_command'
    };
  }

  // 2. Parser la commande
  const parsed = parseInvitationCommand(message);

  if (!parsed) {
    return {
      success: false,
      error: 'invalid_format',
      response: `❌ Format invalide. Utilise:\n\nInvite [Nom] [Numéro]\n\nExemple:\nInvite Marc +18193425966`
    };
  }

  // 3. Envoyer l'invitation
  const result = await sendInvitation({
    name: parsed.name,
    phone: parsed.phone,
    template: 'standard',
    sentBy: senderPhone
  });

  // 4. Générer réponse pour l'admin
  if (result.success) {
    return {
      success: true,
      response: `✅ Invitation envoyée !\n\n👤 ${result.name}\n📱 ${result.phone}\n\nEmma va se présenter et inviter ${result.name} à essayer.`
    };
  } else if (result.error === 'already_invited') {
    return {
      success: false,
      response: `⚠️ ${result.message}\n\nAttends 30 jours avant de réinviter.`
    };
  } else {
    return {
      success: false,
      response: `❌ Erreur lors de l'envoi\n\n${result.message}`
    };
  }
}

export default {
  isInvitationCommand,
  parseInvitationCommand,
  sendInvitation,
  handleInvitationCommand
};
