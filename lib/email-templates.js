/**
 * Templates HTML pour les briefings automatisés
 *
 * Chaque type (morning/midday/evening) a son propre template avec:
 * - Design adapté au moment de la journée
 * - Couleurs et styles configurables (Supabase: emma_config.email_design)
 * - Structure optimisée pour le contenu
 * - Responsive et compatible email clients
 */

import { getDesignConfig } from './design-config.js';
import { colors as fallbackColors, briefingTypes as fallbackBriefingTypes, emailConfig as fallbackEmailConfig } from './theme-colors.js';

/**
 * Convertit le markdown en HTML pour email
 */
function markdownToHtml(markdown, colors) {
  if (!markdown) return '';

  return markdown
    // Headers avec couleurs du thème
    .replace(/^### (.+)$/gm, `<h3 style="color: ${colors.primary}; margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600; border-left: 4px solid ${colors.primaryLight}; padding-left: 12px;">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="color: ${colors.primaryDark}; margin-top: 28px; margin-bottom: 16px; font-size: 20px; font-weight: 700; border-bottom: 3px solid ${colors.primary}; padding-bottom: 8px;">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="color: ${colors.primaryDark}; margin-top: 32px; margin-bottom: 20px; font-size: 24px; font-weight: 700;">$1</h1>`)
    // Bold avec couleur primary
    .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight: 700; color: ${colors.primary};">$1</strong>`)
    // Italic
    .replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>')
    // Line breaks
    .replace(/\n\n/g, `</p><p style="margin: 12px 0; line-height: 1.8; color: ${colors.textDark};">`)
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^/, `<p style="margin: 12px 0; line-height: 1.8; color: ${colors.textDark};">`)
    .replace(/$/, '</p>');
}

/**
 * Template pour briefing MATIN (wrapper async avec config Supabase)
 */
export async function generateMorningTemplate(content, metadata = {}) {
  const config = await getDesignConfig();
  return _generateBriefingTemplateInternal('morning', content, metadata, config);
}

/**
 * Génère un template générique (utilisé en interne)
 */
function _generateBriefingTemplateInternal(type, content, metadata, designConfig) {
  const colors = designConfig.colors;
  const branding = designConfig.branding;
  const header = designConfig.header;
  const footer = designConfig.footer;
  const briefingConfig = fallbackBriefingTypes[type] || fallbackBriefingTypes.midday;

  const date = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const time = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Montreal'
  });

  const labels = { morning: 'MATIN', midday: 'MI-JOURNÉE', evening: 'SOIR' };
  const descriptions = {
    morning: 'Briefing matinal des marchés',
    midday: 'Point mi-journée des marchés',
    evening: 'Bilan de clôture des marchés'
  };

  // Avatar dans le header (optionnel)
  const avatarHtml = header.showAvatar && branding.avatar.url
    ? `<img src="${branding.avatar.url}" alt="${branding.avatar.alt}" style="width:${branding.avatar.size}px;height:${branding.avatar.size}px;border-radius:50%;margin-bottom:16px;border:4px solid rgba(255,255,255,0.3);">`
    : `<div style="font-size: 56px; margin-bottom: 16px; text-align: center;">${briefingConfig.emoji}</div>`;

  // Logo dans le footer (optionnel)
  const logoHtml = footer.showLogo && branding.logo.url
    ? `<img src="${branding.logo.url}" alt="${branding.logo.alt}" style="width:${branding.logo.width}px;margin-bottom:12px;">`
    : '';

  // Disclaimer
  const disclaimerHtml = footer.showDisclaimer && footer.disclaimerText
    ? `<p style="margin: 8px 0; font-size: 11px; opacity: 0.7; color: ${colors.textMuted};">${footer.disclaimerText}</p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${branding.companyName} - Briefing ${labels[type]}</title>
</head>
<body style="margin: 0; padding: 0; font-family: ${fallbackEmailConfig.fonts.primary}; background-color: ${briefingConfig.backgroundColor};">
  <div style="max-width: ${fallbackEmailConfig.spacing.containerMaxWidth}; margin: 0 auto; padding: ${fallbackEmailConfig.spacing.padding.small};">

    <!-- Header -->
    <div style="background: ${briefingConfig.headerGradient}; color: white; padding: ${fallbackEmailConfig.spacing.padding.large} ${fallbackEmailConfig.spacing.padding.medium}; border-radius: ${fallbackEmailConfig.spacing.borderRadius.large} ${fallbackEmailConfig.spacing.borderRadius.large} 0 0; margin-bottom: 0; box-shadow: ${fallbackEmailConfig.shadows.medium};">
      ${avatarHtml}
      <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">${branding.companyName}</h1>
      <div style="text-align: center; opacity: 0.9; font-size: 13px; margin-bottom: 4px;">${branding.tagline}</div>
      ${header.showDate && header.showEdition ? `
      <div style="text-align: center; opacity: 0.95; font-size: 16px; font-weight: 500; margin-top: 8px;">
        ÉDITION ${labels[type]} | ${date}
      </div>
      <div style="text-align: center; opacity: 0.9; font-size: 14px; margin-top: 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.3);">
        📡 Généré à ${time} (heure de Montréal) • ${descriptions[type]}
      </div>
      ` : ''}
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: ${fallbackEmailConfig.spacing.padding.large} ${fallbackEmailConfig.spacing.padding.medium}; border-radius: 0 0 ${fallbackEmailConfig.spacing.borderRadius.large} ${fallbackEmailConfig.spacing.borderRadius.large}; box-shadow: ${fallbackEmailConfig.shadows.medium}; margin-bottom: 24px;">
      ${markdownToHtml(content, colors)}

      ${metadata.tickers && metadata.tickers.length > 0 ? `
      <!-- Tickers Box -->
      <div style="margin-top: 32px; padding: 24px; background: ${briefingConfig.tickerBoxGradient}; border-radius: ${fallbackEmailConfig.spacing.borderRadius.medium}; border-left: 5px solid ${briefingConfig.tickerBoxBorder};">
        <strong style="color: ${briefingConfig.tickerTextColor}; font-size: 16px; display: block; margin-bottom: 12px;">📈 Tickers suivis :</strong>
        <div style="color: ${briefingConfig.tickerTextColor}; font-weight: 500; font-size: 15px; line-height: 1.8;">
          ${metadata.tickers.join(', ')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: ${colors.textMuted}; font-size: 13px; background: #ffffff; border-radius: ${fallbackEmailConfig.spacing.borderRadius.medium}; box-shadow: ${fallbackEmailConfig.shadows.small};">
      ${logoHtml}
      <p style="margin: 0 0 8px 0; font-weight: 600; color: ${colors.textMuted};">
        🤖 Généré automatiquement par <strong style="color: ${colors.primaryDark};">Emma IA</strong>
      </p>
      <p style="margin: 0 0 12px 0; opacity: 0.8;">
        ${branding.companyName}
      </p>
      ${disclaimerHtml}
      <p style="margin: 8px 0 0; font-size: 10px;">${footer.copyrightText || '© 2025 GOB Apps - Tous droits réservés'}</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Template pour briefing MIDI (wrapper async)
 */
export async function generateMiddayTemplate(content, metadata = {}) {
  const config = await getDesignConfig();
  return _generateBriefingTemplateInternal('midday', content, metadata, config);
}

/**
 * Template pour briefing SOIR (wrapper async)
 */
export async function generateEveningTemplate(content, metadata = {}) {
  const config = await getDesignConfig();
  return _generateBriefingTemplateInternal('evening', content, metadata, config);
}

/**
 * Sélectionne le template selon le type (async)
 */
export async function generateBriefingTemplate(type, content, metadata = {}) {
  const config = await getDesignConfig();
  const normalizedType = type === 'noon' ? 'midday' : type;
  return _generateBriefingTemplateInternal(normalizedType, content, metadata, config);
}
