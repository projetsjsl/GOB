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

// Couleurs par défaut (si Supabase non dispo)
const DEFAULT_COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#8b5cf6',
  textDark: '#1f2937',
  textMuted: '#6b7280'
};

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BONNES PRATIQUES HTML EMAIL (compatibilité Outlook, Gmail, Apple Mail)
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * ✅ UTILISER: Tables role="presentation", inline styles, Arial font, padding
 * ❌ NE PAS UTILISER: divs, flexbox, linear-gradient, box-shadow, margin
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * Convertit markdown en HTML pour email (Outlook-compatible)
 */
function markdownToEmailHtml(text, colors) {
  if (!text) return '';
  
  const fontStack = 'Arial, Helvetica, sans-serif';

  return text
    .replace(/^### (.+)$/gm, `<tr><td style="color:${colors.primary};padding:20px 0 10px 12px;font-size:16px;font-weight:bold;border-left:4px solid ${colors.primaryLight};font-family:${fontStack};">$1</td></tr>`)
    .replace(/^## (.+)$/gm, `<tr><td style="color:${colors.primaryDark};padding:24px 0 12px 0;font-size:18px;font-weight:bold;border-bottom:2px solid ${colors.primary};font-family:${fontStack};">$1</td></tr>`)
    .replace(/^# (.+)$/gm, `<tr><td style="color:${colors.primaryDark};padding:28px 0 16px 0;font-size:22px;font-weight:bold;font-family:${fontStack};">$1</td></tr>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:bold;color:${colors.primary};">$1</strong>`)
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic;">$1</em>')
    .replace(/\n\n/g, `</td></tr><tr><td style="padding:8px 0;line-height:1.7;color:${colors.textDark};font-family:${fontStack};">`)
    .replace(/\n/g, '<br>');
}

/**
 * Génère le template email complet (TABLE-BASED pour Outlook)
 */
function generateEmailTemplate(content, type, config) {
  const colors = config.colors;
  const branding = config.branding;
  const header = config.header;
  const footer = config.footer;
  const fontStack = 'Arial, Helvetica, sans-serif';

  const html = markdownToEmailHtml(content, colors);
  const date = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const emojis = { morning: '☀️', midday: '📊', evening: '🌙' };
  const labels = { morning: 'MATIN', midday: 'MI-JOURNÉE', evening: 'SOIRÉE' };

  // Avatar dans le header (optionnel) - avec attributs width/height explicites
  const avatarHtml = header.showAvatar && branding.avatar.url
    ? `<tr><td style="text-align:center;padding-bottom:16px;"><img src="${branding.avatar.url}" alt="${branding.avatar.alt}" width="${branding.avatar.size}" height="${branding.avatar.size}" style="border-radius:50%;border:4px solid rgba(255,255,255,0.3);display:block;margin:0 auto;"></td></tr>`
    : `<tr><td style="font-size:48px;text-align:center;padding-bottom:12px;">${emojis[type] || '📊'}</td></tr>`;

  // Date et édition
  const dateHtml = header.showDate ? `<tr><td style="font-size:14px;color:#ffffff;text-align:center;opacity:0.95;font-family:${fontStack};">${header.showEdition ? `ÉDITION ${labels[type] || 'BRIEFING'} | ` : ''}${date}</td></tr>` : '';

  // Logo dans le footer (optionnel)
  const logoHtml = footer.showLogo && branding.logo.url
    ? `<tr><td style="text-align:center;padding-bottom:12px;"><img src="${branding.logo.url}" alt="${branding.logo.alt}" width="${branding.logo.width}" style="display:block;margin:0 auto;border:0;"></td></tr>`
    : '';

  // Disclaimer
  const disclaimerHtml = footer.showDisclaimer && footer.disclaimerText
    ? `<tr><td style="padding:8px 0;font-size:11px;color:${colors.textMuted};text-align:center;font-family:${fontStack};">${footer.disclaimerText}</td></tr>`
    : '';

  // Template TABLE-BASED pour compatibilité Outlook
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.background || '#f8fafc'};">
  <tr>
    <td align="center" style="padding:10px;">
      
      <!-- CONTENEUR PRINCIPAL - max 600px -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;">
        
        <!-- HEADER - couleur solide (pas de gradient) -->
        <tr>
          <td style="background-color:${colors.primary};color:#ffffff;padding:32px 24px;text-align:center;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${avatarHtml}
              <tr>
                <td style="font-size:28px;font-weight:bold;color:#ffffff;text-align:center;font-family:${fontStack};padding-bottom:8px;">
                  ${branding.companyName}
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#ffffff;text-align:center;opacity:0.9;font-family:${fontStack};padding-bottom:4px;">
                  ${branding.tagline}
                </td>
              </tr>
              ${dateHtml}
            </table>
          </td>
        </tr>
        
        <!-- CONTENT -->
        <tr>
          <td style="padding:32px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:8px 0;line-height:1.7;color:${colors.textDark};font-family:${fontStack};">${html}</td></tr>
            </table>
          </td>
        </tr>
        
        <!-- FOOTER -->
        <tr>
          <td style="padding:20px 24px;text-align:center;border-top:1px solid #e0e0e0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${logoHtml}
              <tr>
                <td style="font-size:12px;color:${colors.textMuted};text-align:center;font-family:${fontStack};">
                  🤖 Généré par <strong style="color:${colors.primaryDark};">Emma IA</strong>
                </td>
              </tr>
              ${disclaimerHtml}
              <tr>
                <td style="padding-top:8px;font-size:10px;color:${colors.textMuted};text-align:center;font-family:${fontStack};">
                  ${footer.copyrightText || '© 2025 GOB Apps - Tous droits réservés'}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
      </table>
      
    </td>
  </tr>
</table>
  `;
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
