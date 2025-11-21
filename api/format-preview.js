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
 * Convertit markdown en HTML pour email
 */
function markdownToEmailHtml(text, colors) {
  if (!text) return '';

  return text
    .replace(/^### (.+)$/gm, `<h3 style="color:${colors.primary};margin:24px 0 12px;font-size:18px;font-weight:600;border-left:4px solid ${colors.primaryLight};padding-left:12px;">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="color:${colors.primaryDark};margin:28px 0 16px;font-size:20px;font-weight:700;border-bottom:3px solid ${colors.primary};padding-bottom:8px;">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="color:${colors.primaryDark};margin:32px 0 20px;font-size:24px;font-weight:700;">$1</h1>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:700;color:${colors.primary};">$1</strong>`)
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic;">$1</em>')
    .replace(/\n\n/g, `</p><p style="margin:12px 0;line-height:1.8;color:${colors.textDark};">`)
    .replace(/\n/g, '<br>');
}

/**
 * Génère le template email complet
 */
function generateEmailTemplate(content, type, config) {
  const colors = config.colors;
  const branding = config.branding;
  const header = config.header;
  const footer = config.footer;

  const html = markdownToEmailHtml(content, colors);
  const date = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const emojis = { morning: '☀️', midday: '📊', evening: '🌙' };
  const labels = { morning: 'MATIN', midday: 'MI-JOURNÉE', evening: 'SOIRÉE' };

  // Avatar dans le header (optionnel)
  const avatarHtml = header.showAvatar && branding.avatar.url
    ? `<img src="${branding.avatar.url}" alt="${branding.avatar.alt}" style="width:${branding.avatar.size}px;height:${branding.avatar.size}px;border-radius:50%;margin-bottom:16px;border:4px solid rgba(255,255,255,0.3);">`
    : `<div style="font-size:48px;margin-bottom:12px;">${emojis[type] || '📊'}</div>`;

  // Date et édition
  const dateHtml = header.showDate ? `<div style="opacity:0.95;font-size:14px;">${header.showEdition ? `ÉDITION ${labels[type] || 'BRIEFING'} | ` : ''}${date}</div>` : '';

  // Logo dans le footer (optionnel)
  const logoHtml = footer.showLogo && branding.logo.url
    ? `<img src="${branding.logo.url}" alt="${branding.logo.alt}" style="width:${branding.logo.width}px;margin-bottom:12px;">`
    : '';

  // Disclaimer
  const disclaimerHtml = footer.showDisclaimer && footer.disclaimerText
    ? `<p style="margin:8px 0;font-size:11px;color:${colors.textMuted};">${footer.disclaimerText}</p>`
    : '';

  return `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Roboto,sans-serif;background:${colors.background || '#f8fafc'};padding:10px;">
      <div style="background:linear-gradient(135deg,${colors.primary} 0%,${colors.primaryLight} 100%);color:white;padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
        ${avatarHtml}
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;">${branding.companyName}</h1>
        <div style="opacity:0.9;font-size:13px;margin-bottom:4px;">${branding.tagline}</div>
        ${dateHtml}
      </div>
      <div style="background:white;padding:32px 24px;border-radius:0 0 12px 12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <p style="margin:12px 0;line-height:1.8;color:${colors.textDark};">${html}</p>
      </div>
      <div style="text-align:center;padding:20px;color:${colors.textMuted};font-size:12px;">
        ${logoHtml}
        <p style="margin:0;">🤖 Généré par <strong style="color:${colors.primaryDark};">Emma IA</strong></p>
        ${disclaimerHtml}
        <p style="margin:8px 0 0;font-size:10px;">${footer.copyrightText || '© 2025 GOB Apps - Tous droits réservés'}</p>
      </div>
    </div>
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
    const { text, channel = 'web', briefingType = 'morning', customDesign } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

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
      ...result
    });

  } catch (error) {
    console.error('[Format Preview] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
