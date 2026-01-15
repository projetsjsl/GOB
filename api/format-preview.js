/**
 * API Format Preview - Point unique de formatage
 *
 * Utilise par:
 * - emma-config.html (preview)
 * - n8n workflows (si besoin)
 * - Tout autre client
 *
 * Garantit un rendu identique partout.
 * Charge les configs depuis Supabase pour persistance.
 */

import { getDesignConfig } from '../lib/design-config.js';
import { 
  createEmailWrapper, 
  createEmailHeader, 
  createEmailContent, 
  createEmailTable, 
  createEmailRow, 
  createEmailFooter,
  DEFAULT_COLORS 
} from '../lib/email-helpers.js';

/**
 * Convertit le markdown en HTML pour email
 * Fonction simple de conversion markdown -> HTML avec styles inline
 */
function markdownToEmailHtml(markdown, colors = DEFAULT_COLORS) {
  if (!markdown) return '';
  
  let html = markdown
    // Headers avec couleurs du theme
    .replace(/^### (.+)$/gm, `<h3 style="color: ${colors.primary || DEFAULT_COLORS.primary}; margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600; border-left: 4px solid ${colors.primaryLight || DEFAULT_COLORS.primary}; padding-left: 12px;">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="color: ${colors.primaryDark || DEFAULT_COLORS.primaryDark}; margin-top: 28px; margin-bottom: 16px; font-size: 20px; font-weight: 700; border-bottom: 3px solid ${colors.primary || DEFAULT_COLORS.primary}; padding-bottom: 8px;">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="color: ${colors.primaryDark || DEFAULT_COLORS.primaryDark}; margin-top: 32px; margin-bottom: 20px; font-size: 24px; font-weight: 700;">$1</h1>`)
    // Bold avec couleur primary
    .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight: 700; color: ${colors.primary || DEFAULT_COLORS.primary};">$1</strong>`)
    // Italic
    .replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>')
    // Line breaks
    .replace(/\n\n/g, `</p><p style="margin: 12px 0; line-height: 1.8; color: ${colors.textDark || DEFAULT_COLORS.text};">`)
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^/, `<p style="margin: 12px 0; line-height: 1.8; color: ${colors.textDark || DEFAULT_COLORS.text};">`)
    .replace(/$/, '</p>');
  
  return html;
}

/**
 * Genere le template email complet (TABLE-BASED pour Outlook)
 * Utilise le moteur de rendu unifie (lib/email-helpers.js)
 */
function generateEmailTemplate(content, type, config) {
  const colors = config.colors || DEFAULT_COLORS;
  const branding = config.branding;
  const header = config.header;
  const footer = config.footer;
  
  // Conversion contenu Markdown
  const htmlContent = markdownToEmailHtml(content, colors);
  
  // Date et Emoji contextuel
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const emojis = { morning: '', midday: '', evening: '' };
  const labels = { morning: 'MATIN', midday: 'MI-JOURNEE', evening: 'SOIREE' };
  
  // Configuration du Header
  const headerSubtitle = header.showDate 
    ? `${header.showEdition ? `EDITION ${labels[type] || 'BRIEFING'} | ` : ''}${date}`
    : '';

  const headerConfig = {
    title: branding.companyName,
    subtitle: branding.tagline + (headerSubtitle ? `<br>${headerSubtitle}` : ''), 
    emoji: (header.showAvatar && branding.avatar.url) 
      ? `<img src="${branding.avatar.url}" alt="${branding.avatar.alt}" width="${branding.avatar.size}" height="${branding.avatar.size}" style="border-radius:50%;border:4px solid rgba(255,255,255,0.3);display:block;margin:0 auto;">` 
      : (emojis[type] || ''),
    colors: colors
  };

  // Configuration du Footer
  const footerConfig = {
    text: ` Genere par <strong style="color:${colors.primaryDark};">Emma IA</strong>`,
    disclaimer: [
      footer.showDisclaimer ? footer.disclaimerText : '',
      footer.copyrightText || ' 2025 GOB Apps - Tous droits reserves'
    ].filter(Boolean).join('<br>'),
    colors: colors
  };
  
  // Si logo footer actif
  if (footer.showLogo && branding.logo.url) {
    // Note: createEmailFooter ne supporte pas encore logo directement, on l'ajoute au text ou disclaimer
    // Pour "World Class" on pourrait ameliorer le helper, mais ici on l'injecte proprement.
    // Ou mieux: on utilise createEmailRow avant le footer.
  }

  // Construction avec le moteur unifie
  return createEmailWrapper({
    width: 600,
    colors: colors,
    header: createEmailHeader(headerConfig),
    content: createEmailContent(
      createEmailTable([
         createEmailRow(htmlContent, { padding: '8px 0', fontSize: '16px', color: colors.textDark })
      ]),
      { padding: 32 }
    ),
    footer: createEmailFooter(footerConfig)
  });
}

/**
 * Genere le template SMS
 * Note: Pas de limite - Twilio gere automatiquement le multi-SMS
 */
async function generateSmsTemplate(content) {
  // Import dynamique avec fallback
  let adaptForSMS;
  try {
    const channelAdapter = await import('../lib/channel-adapter.js');
    adaptForSMS = channelAdapter.adaptForSMS;
  } catch (e) {
    console.warn(' channel-adapter.js non trouve, utilisation de fallback');
    adaptForSMS = (content) => content.replace(/<[^>]*>/g, '').trim();
  }
  
  const sms = await adaptForSMS(content, {});
  const chars = sms.length;
  // SMS standard = 160 chars (GSM-7) ou 70 chars (UCS-2 avec emojis)
  // On utilise 153 car SMS concatenes = 153 chars utiles par segment
  const smsCount = Math.ceil(chars / 153);

  return {
    text: sms,
    chars,
    smsCount,
    segments: smsCount, // Alias pour clarte
    estimatedCost: `~${(smsCount * 0.0079).toFixed(2)}$ USD` // Twilio pricing
  };
}

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
    const startTime = Date.now();
    const { text, channel = 'web', briefingType = 'morning', customDesign } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    // Log request info for debugging
    console.log(`[Format Preview] Channel: ${channel}, Type: ${briefingType}, Text length: ${text.length}`);


    // 
    // DESIGN: Chaque prompt peut avoir son propre design
    // - Si customDesign fourni -> utiliser ce design specifique
    // - Sinon -> charger le design global depuis Supabase
    // 
    let config;
    if (customDesign) {
      // Design personnalise passe par le prompt
      config = customDesign;
    } else {
      // Design global par defaut (cache 1min)
      config = await getDesignConfig();
    }

    const colors = config.colors || DEFAULT_COLORS;

    let result;

    switch (channel) {
      case 'sms':
        result = await generateSmsTemplate(text);
        break;
      case 'email':
        result = { html: generateEmailTemplate(text, briefingType, config) };
        break;
      case 'web':
      default:
        result = { html: markdownToEmailHtml(text, colors) };
    }

    const duration = Date.now() - startTime;
    console.log(`[Format Preview]  Generated in ${duration}ms`);

    return res.status(200).json({
      success: true,
      channel,
      colors, // Expose colors for client sync
      config: {
        branding: config.branding,
        header: config.header,
        footer: config.footer,
        sms: config.sms
      },
      performance: { generationTimeMs: duration },
      ...result
    });

  } catch (error) {
    console.error('[Format Preview]  Error:', error.message);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
