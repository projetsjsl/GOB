/**
 * Channel Adapter - Adaptation des réponses selon le canal
 *
 * Adapte le format des messages selon les contraintes et capacités
 * de chaque canal de communication (SMS, Email, Messenger, Web).
 */

/**
 * Adapte une réponse pour un canal spécifique
 *
 * @param {string} response - La réponse brute d'Emma
 * @param {string} channel - Le canal ('web', 'email', 'sms', 'messenger')
 * @returns {string|object} Réponse adaptée au canal
 */
export function adaptForChannel(response, channel) {
  switch (channel) {
    case 'sms':
      return adaptForSMS(response);
    case 'email':
      return adaptForEmail(response);
    case 'messenger':
      return adaptForMessenger(response);
    case 'web':
    default:
      return response; // Web peut gérer le contenu complet
  }
}

/**
 * Adapte pour SMS (limite 1600 chars avec pagination)
 *
 * @param {string} text - Le texte à adapter
 * @returns {string} Texte adapté pour SMS
 */
export function adaptForSMS(text) {
  const MAX_LENGTH = 1600;

  if (text.length <= MAX_LENGTH) {
    return text;
  }

  // Tronquer intelligemment au dernier point avant la limite
  const truncated = text.substring(0, MAX_LENGTH);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastPeriod, lastNewline);

  if (cutPoint > MAX_LENGTH * 0.7) {
    // Si on a trouvé un bon point de coupe
    return text.substring(0, cutPoint + 1) + '\n\n...(1/n) Réponse tronquée. Consultez le web pour plus de détails.';
  }

  // Sinon, coupe brutale avec ellipse
  return truncated.substring(0, MAX_LENGTH - 50) + '...\n\n(Réponse tronquée. Consultez le web pour le détail complet)';
}

/**
 * Découpe un texte en chunks pour SMS
 *
 * @param {string} text - Le texte à découper
 * @param {number} chunkSize - Taille max de chaque chunk
 * @returns {string[]} Tableau de chunks
 */
export function chunkTextForSMS(text, chunkSize = 1500) {
  const chunks = [];
  let currentChunk = '';

  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Adapte pour Email (format HTML avec styling)
 *
 * @param {string} text - Le texte à adapter
 * @returns {string} HTML formaté pour email
 */
export function adaptForEmail(text) {
  // Convertir markdown simple en HTML
  let html = text;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 style="color: #1a73e8; margin-top: 20px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="color: #1a73e8; margin-top: 24px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="color: #1a73e8; margin-top: 28px;">$1</h1>');

  // Bold et italique
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Liens
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #1a73e8;">$1</a>');

  // Bullet points
  html = html.replace(/^- (.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul style="margin-left: 20px;">$1</ul>');

  // Paragraphes
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Template email complet
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Emma IA™</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Assistante Financière GOB</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    ${html}
  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;">
    <p>Groupe Ouellet Bolduc - Analyse Financière Avancée</p>
    <p style="margin: 5px 0;">Propulsé par Emma IA™ & JSLAI™ Score</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Adapte pour Facebook Messenger (format texte structuré)
 *
 * @param {string} text - Le texte à adapter
 * @returns {string} Texte adapté pour Messenger
 */
export function adaptForMessenger(text) {
  // Messenger supporte les emojis et un formatage limité
  // Limite de 2000 caractères par message

  const MAX_LENGTH = 2000;

  if (text.length <= MAX_LENGTH) {
    return text;
  }

  // Tronquer intelligemment
  const truncated = text.substring(0, MAX_LENGTH);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastPeriod, lastNewline);

  if (cutPoint > MAX_LENGTH * 0.7) {
    return text.substring(0, cutPoint + 1) + '\n\n💬 Réponse complète disponible sur le web dashboard.';
  }

  return truncated.substring(0, MAX_LENGTH - 80) + '...\n\n💬 Réponse tronquée. Plus de détails sur le dashboard web.';
}

/**
 * Extrait un résumé court d'une réponse (pour notifications)
 *
 * @param {string} text - Le texte complet
 * @param {number} maxLength - Longueur max du résumé
 * @returns {string} Résumé
 */
export function extractSummary(text, maxLength = 150) {
  if (text.length <= maxLength) {
    return text;
  }

  const firstSentence = text.split(/[.!?]/)[0];

  if (firstSentence.length <= maxLength) {
    return firstSentence + '.';
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Nettoie le texte des caractères problématiques pour SMS
 *
 * @param {string} text - Le texte à nettoyer
 * @returns {string} Texte nettoyé
 */
export function sanitizeForSMS(text) {
  // Supprimer emojis complexes (garder les simples)
  let cleaned = text.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Symbols & pictographs
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport & map
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags

  // Normaliser les espaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Détermine si un message nécessite un canal spécifique
 *
 * @param {string} text - Le texte du message
 * @returns {object} Recommandations de canal
 */
export function getChannelRecommendations(text) {
  const hasImages = /\!\[.*\]\(.*\)/.test(text);
  const hasTables = /\|.*\|.*\|/.test(text);
  const hasLongCode = /```[\s\S]{200,}```/.test(text);
  const isLong = text.length > 2000;

  return {
    sms: !hasImages && !hasTables && !hasLongCode && !isLong,
    email: true, // Email peut tout gérer
    messenger: !hasTables && !hasLongCode,
    web: true, // Web peut tout gérer
    preferredChannel: hasImages || hasTables || hasLongCode || isLong ? 'email' : 'any'
  };
}

export default {
  adaptForChannel,
  adaptForSMS,
  adaptForEmail,
  adaptForMessenger,
  chunkTextForSMS,
  extractSummary,
  sanitizeForSMS,
  getChannelRecommendations
};
