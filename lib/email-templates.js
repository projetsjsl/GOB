/**
 * Templates HTML pour les briefings automatisés
 * 
 * Chaque type (morning/midday/evening) a son propre template avec:
 * - Design adapté au moment de la journée
 * - Couleurs et styles spécifiques (centralisés dans config/theme-colors.json)
 * - Structure optimisée pour le contenu
 * - Responsive et compatible email clients
 */

import { colors, gradients, briefingTypes, emailConfig } from './theme-colors.js';

/**
 * Convertit le markdown en HTML pour email
 */
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  return markdown
    // Headers avec couleurs du thème
    .replace(/^### (.+)$/gm, `<h3 style="color: ${colors.primary}; margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600; border-left: 4px solid ${colors.primaryLight}; padding-left: 12px;">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="color: ${colors.primaryDark}; margin-top: 28px; margin-bottom: 16px; font-size: 20px; font-weight: 700; border-bottom: 3px solid ${colors.primary}; padding-bottom: 8px;">$2</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="color: ${colors.primaryDark}; margin-top: 32px; margin-bottom: 20px; font-size: 24px; font-weight: 700;">$1</h1>`)
    // Bold avec couleur primary
    .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight: 700; color: ${colors.primary};">$1</strong>`)
    // Italic
    .replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>')
    // Line breaks
    .replace(/\n\n/g, `</p><p style="margin: 12px 0; line-height: 1.8; color: ${colors.text.dark};">`)
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^/, `<p style="margin: 12px 0; line-height: 1.8; color: ${colors.text.dark};">`)
    .replace(/$/, '</p>');
}

/**
 * Template pour briefing MATIN
 * Design: Énergique, optimiste, couleurs chaudes (orange/jaune)
 */
export function generateMorningTemplate(content, metadata = {}) {
  const briefingConfig = briefingTypes.morning;
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

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emma En Direct - Matin</title>
</head>
<body style="margin: 0; padding: 0; font-family: ${emailConfig.fonts.primary}; background-color: ${briefingConfig.backgroundColor};">
  <div style="max-width: ${emailConfig.spacing.containerMaxWidth}; margin: 0 auto; padding: ${emailConfig.spacing.padding.small};">
    
    <!-- Header Matin - Couleurs du thème -->
    <div style="background: ${briefingConfig.headerGradient}; color: white; padding: ${emailConfig.spacing.padding.large} ${emailConfig.spacing.padding.medium}; border-radius: ${emailConfig.spacing.borderRadius.large} ${emailConfig.spacing.borderRadius.large} 0 0; margin-bottom: 0; box-shadow: ${emailConfig.shadows.medium};">
      <div style="font-size: 56px; margin-bottom: 16px; text-align: center;">${briefingConfig.emoji}</div>
      <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">Emma En Direct</h1>
      <div style="text-align: center; opacity: 0.95; font-size: 16px; font-weight: 500; margin-top: 8px;">
        ÉDITION MATIN | ${date}
      </div>
      <div style="text-align: center; opacity: 0.9; font-size: 14px; margin-top: 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.3);">
        📡 Généré à ${time} (heure de Montréal) • Briefing matinal des marchés
      </div>
    </div>

    <!-- Content -->
    <div style="background: ${colors.background.white}; padding: ${emailConfig.spacing.padding.large} ${emailConfig.spacing.padding.medium}; border-radius: 0 0 ${emailConfig.spacing.borderRadius.large} ${emailConfig.spacing.borderRadius.large}; box-shadow: ${emailConfig.shadows.medium}; margin-bottom: 24px;">
      ${markdownToHtml(content)}
      
      ${metadata.tickers && metadata.tickers.length > 0 ? `
      <!-- Tickers Box -->
      <div style="margin-top: 32px; padding: 24px; background: ${briefingConfig.tickerBoxGradient}; border-radius: ${emailConfig.spacing.borderRadius.medium}; border-left: 5px solid ${briefingConfig.tickerBoxBorder};">
        <strong style="color: ${briefingConfig.tickerTextColor}; font-size: 16px; display: block; margin-bottom: 12px;">📈 Tickers suivis :</strong>
        <div style="color: ${briefingConfig.tickerTextColor}; font-weight: 500; font-size: 15px; line-height: 1.8;">
          ${metadata.tickers.join(', ')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: ${colors.text.medium}; font-size: 13px; background: ${colors.background.white}; border-radius: ${emailConfig.spacing.borderRadius.medium}; box-shadow: ${emailConfig.shadows.small};">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: ${colors.text.medium};">
        🤖 Généré automatiquement par <strong style="color: ${colors.primaryDark};">Emma IA</strong>
      </p>
      <p style="margin: 0 0 12px 0; opacity: 0.8;">
        GOB Apps • Intelligence Financière
      </p>
      <p style="margin: 0; font-size: 11px; opacity: 0.7; color: ${colors.text.muted};">
        Les informations fournies sont à des fins éducatives uniquement et ne constituent pas des conseils financiers personnalisés.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Template pour briefing MIDI
 * Design: Équilibré, analytique, couleurs bleues (professionnel)
 */
export function generateMiddayTemplate(content, metadata = {}) {
  const briefingConfig = briefingTypes.midday;
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

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emma En Direct - Midi</title>
</head>
<body style="margin: 0; padding: 0; font-family: ${emailConfig.fonts.primary}; background-color: ${briefingConfig.backgroundColor};">
  <div style="max-width: ${emailConfig.spacing.containerMaxWidth}; margin: 0 auto; padding: ${emailConfig.spacing.padding.small};">
    
    <!-- Header Midi - Couleurs du thème -->
    <div style="background: ${briefingConfig.headerGradient}; color: white; padding: ${emailConfig.spacing.padding.large} ${emailConfig.spacing.padding.medium}; border-radius: ${emailConfig.spacing.borderRadius.large} ${emailConfig.spacing.borderRadius.large} 0 0; margin-bottom: 0; box-shadow: ${emailConfig.shadows.medium};">
      <div style="font-size: 56px; margin-bottom: 16px; text-align: center;">${briefingConfig.emoji}</div>
      <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">Emma En Direct</h1>
      <div style="text-align: center; opacity: 0.95; font-size: 16px; font-weight: 500; margin-top: 8px;">
        ÉDITION MIDI | ${date}
      </div>
      <div style="text-align: center; opacity: 0.9; font-size: 14px; margin-top: 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.3);">
        📡 Généré à ${time} (heure de Montréal) • Point mi-journée des marchés
      </div>
    </div>

    <!-- Content -->
    <div style="background: ${colors.background.white}; padding: ${emailConfig.spacing.padding.large} ${emailConfig.spacing.padding.medium}; border-radius: 0 0 ${emailConfig.spacing.borderRadius.large} ${emailConfig.spacing.borderRadius.large}; box-shadow: ${emailConfig.shadows.medium}; margin-bottom: 24px;">
      ${markdownToHtml(content)}
      
      ${metadata.tickers && metadata.tickers.length > 0 ? `
      <!-- Tickers Box -->
      <div style="margin-top: 32px; padding: 24px; background: ${briefingConfig.tickerBoxGradient}; border-radius: ${emailConfig.spacing.borderRadius.medium}; border-left: 5px solid ${briefingConfig.tickerBoxBorder};">
        <strong style="color: ${briefingConfig.tickerTextColor}; font-size: 16px; display: block; margin-bottom: 12px;">📈 Tickers suivis :</strong>
        <div style="color: ${briefingConfig.tickerTextColor}; font-weight: 500; font-size: 15px; line-height: 1.8;">
          ${metadata.tickers.join(', ')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: ${colors.text.medium}; font-size: 13px; background: ${colors.background.white}; border-radius: ${emailConfig.spacing.borderRadius.medium}; box-shadow: ${emailConfig.shadows.small};">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: ${colors.text.medium};">
        🤖 Généré automatiquement par <strong style="color: ${colors.primaryDark};">Emma IA</strong>
      </p>
      <p style="margin: 0 0 12px 0; opacity: 0.8;">
        GOB Apps • Intelligence Financière
      </p>
      <p style="margin: 0; font-size: 11px; opacity: 0.7; color: ${colors.text.muted};">
        Les informations fournies sont à des fins éducatives uniquement et ne constituent pas des conseils financiers personnalisés.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Template pour briefing SOIR
 * Design: Calme, synthétique, couleurs violettes (élégant)
 */
export function generateEveningTemplate(content, metadata = {}) {
  const briefingConfig = briefingTypes.evening;
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

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emma En Direct - Soir</title>
</head>
<body style="margin: 0; padding: 0; font-family: ${emailConfig.fonts.primary}; background-color: ${briefingConfig.backgroundColor};">
  <div style="max-width: ${emailConfig.spacing.containerMaxWidth}; margin: 0 auto; padding: ${emailConfig.spacing.padding.small};">
    
    <!-- Header Soir - Couleurs du thème -->
    <div style="background: ${briefingConfig.headerGradient}; color: white; padding: ${emailConfig.spacing.padding.large} ${emailConfig.spacing.padding.medium}; border-radius: ${emailConfig.spacing.borderRadius.large} ${emailConfig.spacing.borderRadius.large} 0 0; margin-bottom: 0; box-shadow: ${emailConfig.shadows.medium};">
      <div style="font-size: 56px; margin-bottom: 16px; text-align: center;">${briefingConfig.emoji}</div>
      <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">Emma En Direct</h1>
      <div style="text-align: center; opacity: 0.95; font-size: 16px; font-weight: 500; margin-top: 8px;">
        ÉDITION SOIR | ${date}
      </div>
      <div style="text-align: center; opacity: 0.9; font-size: 14px; margin-top: 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.3);">
        📡 Généré à ${time} (heure de Montréal) • Bilan de clôture des marchés
      </div>
    </div>

    <!-- Content -->
    <div style="background: ${colors.background.white}; padding: ${emailConfig.spacing.padding.large} ${emailConfig.spacing.padding.medium}; border-radius: 0 0 ${emailConfig.spacing.borderRadius.large} ${emailConfig.spacing.borderRadius.large}; box-shadow: ${emailConfig.shadows.medium}; margin-bottom: 24px;">
      ${markdownToHtml(content)}
      
      ${metadata.tickers && metadata.tickers.length > 0 ? `
      <!-- Tickers Box -->
      <div style="margin-top: 32px; padding: 24px; background: ${briefingConfig.tickerBoxGradient}; border-radius: ${emailConfig.spacing.borderRadius.medium}; border-left: 5px solid ${briefingConfig.tickerBoxBorder};">
        <strong style="color: ${briefingConfig.tickerTextColor}; font-size: 16px; display: block; margin-bottom: 12px;">📈 Tickers suivis :</strong>
        <div style="color: ${briefingConfig.tickerTextColor}; font-weight: 500; font-size: 15px; line-height: 1.8;">
          ${metadata.tickers.join(', ')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: ${colors.text.medium}; font-size: 13px; background: ${colors.background.white}; border-radius: ${emailConfig.spacing.borderRadius.medium}; box-shadow: ${emailConfig.shadows.small};">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: ${colors.text.medium};">
        🤖 Généré automatiquement par <strong style="color: ${colors.primaryDark};">Emma IA</strong>
      </p>
      <p style="margin: 0 0 12px 0; opacity: 0.8;">
        GOB Apps • Intelligence Financière
      </p>
      <p style="margin: 0; font-size: 11px; opacity: 0.7; color: ${colors.text.muted};">
        Les informations fournies sont à des fins éducatives uniquement et ne constituent pas des conseils financiers personnalisés.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Sélectionne le template selon le type
 */
export function generateBriefingTemplate(type, content, metadata = {}) {
  switch (type) {
    case 'morning':
      return generateMorningTemplate(content, metadata);
    case 'midday':
    case 'noon':
      return generateMiddayTemplate(content, metadata);
    case 'evening':
      return generateEveningTemplate(content, metadata);
    default:
      // Par défaut, utiliser le template midi
      return generateMiddayTemplate(content, metadata);
  }
}

