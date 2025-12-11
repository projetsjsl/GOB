/**
 * API Format Preview - Point unique de formatage
 *
 * Utilisé par:
 * - emma-config.html (preview)
 * - n8n workflows (si besoin)
 * - Tout autre client
 *
 * Garantit un rendu identique partout.
 * Charge les configs depuis Supabase pour persistance.
 */

import { adaptForChannel, adaptForSMS } from '../lib/channel-adapter.js';
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

// ... (keep markdownToEmailHtml unchanged or update it if needed, but for now focus on the template structure)

/**
 * Génère le template email complet (TABLE-BASED pour Outlook)
 * Utilise le moteur de rendu unifié (lib/email-helpers.js)
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
  const emojis = { morning: '☀️', midday: '📊', evening: '🌙' };
  const labels = { morning: 'MATIN', midday: 'MI-JOURNÉE', evening: 'SOIRÉE' };
  
  // Configuration du Header
  const headerSubtitle = header.showDate 
    ? `${header.showEdition ? `ÉDITION ${labels[type] || 'BRIEFING'} | ` : ''}${date}`
    : '';

  const headerConfig = {
    title: branding.companyName,
    subtitle: branding.tagline + (headerSubtitle ? `<br>${headerSubtitle}` : ''), 
    emoji: (header.showAvatar && branding.avatar.url) 
      ? `<img src="${branding.avatar.url}" alt="${branding.avatar.alt}" width="${branding.avatar.size}" height="${branding.avatar.size}" style="border-radius:50%;border:4px solid rgba(255,255,255,0.3);display:block;margin:0 auto;">` 
      : (emojis[type] || '📊'),
    colors: colors
  };

  // Configuration du Footer
  const footerConfig = {
    text: `🤖 Généré par <strong style="color:${colors.primaryDark};">Emma IA</strong>`,
    disclaimer: [
      footer.showDisclaimer ? footer.disclaimerText : '',
      footer.copyrightText || '© 2025 GOB Apps - Tous droits réservés'
    ].filter(Boolean).join('<br>'),
    colors: colors
  };
  
  // Si logo footer actif
  if (footer.showLogo && branding.logo.url) {
    // Note: createEmailFooter ne supporte pas encore logo directement, on l'ajoute au text ou disclaimer
    // Pour "World Class" on pourrait améliorer le helper, mais ici on l'injecte proprement.
    // Ou mieux: on utilise createEmailRow avant le footer.
  }

  // Construction avec le moteur unifié
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
 * Génère le template SMS
 * Note: Pas de limite - Twilio gère automatiquement le multi-SMS
 */
function generateSmsTemplate(content) {
  const sms = adaptForSMS(content, {});
  const chars = sms.length;
  // SMS standard = 160 chars (GSM-7) ou 70 chars (UCS-2 avec emojis)
  // On utilise 153 car SMS concaténés = 153 chars utiles par segment
  const smsCount = Math.ceil(chars / 153);

  return {
    text: sms,
    chars,
    smsCount,
    segments: smsCount, // Alias pour clarté
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


    // ═══════════════════════════════════════════════════════════
    // DESIGN: Chaque prompt peut avoir son propre design
    // - Si customDesign fourni → utiliser ce design spécifique
    // - Sinon → charger le design global depuis Supabase
    // ═══════════════════════════════════════════════════════════
    let config;
    if (customDesign) {
      // Design personnalisé passé par le prompt
      config = customDesign;
    } else {
      // Design global par défaut (cache 1min)
      config = await getDesignConfig();
    }

    const colors = config.colors || DEFAULT_COLORS;

    let result;

    switch (channel) {
      case 'sms':
        result = generateSmsTemplate(text);
        break;
      case 'email':
        result = { html: generateEmailTemplate(text, briefingType, config) };
        break;
      case 'web':
      default:
        result = { html: markdownToEmailHtml(text, colors) };
    }

    const duration = Date.now() - startTime;
    console.log(`[Format Preview] ✅ Generated in ${duration}ms`);

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
    console.error('[Format Preview] ❌ Error:', error.message);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
