/**
 * Templates HTML pour les briefings automatisés
 * 
 * Chaque type (morning/midday/evening) a son propre template avec:
 * - Design adapté au moment de la journée
 * - Couleurs et styles spécifiques
 * - Structure optimisée pour le contenu
 * - Responsive et compatible email clients
 */

/**
 * Convertit le markdown en HTML pour email
 */
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  return markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="color: #1e40af; margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color: #1e3a8a; margin-top: 28px; margin-bottom: 16px; font-size: 20px; font-weight: 700;">$2</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color: #1e3a8a; margin-top: 32px; margin-bottom: 20px; font-size: 24px; font-weight: 700;">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600; color: #1f2937;">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>')
    // Line breaks
    .replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.8; color: #374151;">')
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^/, '<p style="margin: 12px 0; line-height: 1.8; color: #374151;">')
    .replace(/$/, '</p>');
}

/**
 * Template pour briefing MATIN
 * Design: Énergique, optimiste, couleurs chaudes (orange/jaune)
 */
export function generateMorningTemplate(content, metadata = {}) {
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fef3c7;">
  <div style="max-width: 680px; margin: 0 auto; padding: 20px;">
    
    <!-- Header Matin - Couleurs chaudes (orange/jaune) -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 40px 32px; border-radius: 16px 16px 0 0; margin-bottom: 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="font-size: 56px; margin-bottom: 16px; text-align: center;">🌅</div>
      <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">Emma En Direct</h1>
      <div style="text-align: center; opacity: 0.95; font-size: 16px; font-weight: 500; margin-top: 8px;">
        ÉDITION MATIN | ${date}
      </div>
      <div style="text-align: center; opacity: 0.9; font-size: 14px; margin-top: 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.3);">
        📡 Généré à ${time} (heure de Montréal) • Briefing matinal des marchés
      </div>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 40px 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-bottom: 24px;">
      ${markdownToHtml(content)}
      
      ${metadata.tickers && metadata.tickers.length > 0 ? `
      <!-- Tickers Box -->
      <div style="margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border-left: 5px solid #f59e0b;">
        <strong style="color: #92400e; font-size: 16px; display: block; margin-bottom: 12px;">📈 Tickers suivis :</strong>
        <div style="color: #78350f; font-weight: 500; font-size: 15px; line-height: 1.8;">
          ${metadata.tickers.join(', ')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 13px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #4b5563;">
        🤖 Généré automatiquement par <strong>Emma IA</strong>
      </p>
      <p style="margin: 0 0 12px 0; opacity: 0.8;">
        GOB Apps • Intelligence Financière
      </p>
      <p style="margin: 0; font-size: 11px; opacity: 0.7; color: #9ca3af;">
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #eff6ff;">
  <div style="max-width: 680px; margin: 0 auto; padding: 20px;">
    
    <!-- Header Midi - Couleurs bleues (professionnel) -->
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 32px; border-radius: 16px 16px 0 0; margin-bottom: 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="font-size: 56px; margin-bottom: 16px; text-align: center;">☀️</div>
      <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">Emma En Direct</h1>
      <div style="text-align: center; opacity: 0.95; font-size: 16px; font-weight: 500; margin-top: 8px;">
        ÉDITION MIDI | ${date}
      </div>
      <div style="text-align: center; opacity: 0.9; font-size: 14px; margin-top: 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.3);">
        📡 Généré à ${time} (heure de Montréal) • Point mi-journée des marchés
      </div>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 40px 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-bottom: 24px;">
      ${markdownToHtml(content)}
      
      ${metadata.tickers && metadata.tickers.length > 0 ? `
      <!-- Tickers Box -->
      <div style="margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; border-left: 5px solid #3b82f6;">
        <strong style="color: #1e40af; font-size: 16px; display: block; margin-bottom: 12px;">📈 Tickers suivis :</strong>
        <div style="color: #1e3a8a; font-weight: 500; font-size: 15px; line-height: 1.8;">
          ${metadata.tickers.join(', ')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 13px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #4b5563;">
        🤖 Généré automatiquement par <strong>Emma IA</strong>
      </p>
      <p style="margin: 0 0 12px 0; opacity: 0.8;">
        GOB Apps • Intelligence Financière
      </p>
      <p style="margin: 0; font-size: 11px; opacity: 0.7; color: #9ca3af;">
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3e8ff;">
  <div style="max-width: 680px; margin: 0 auto; padding: 20px;">
    
    <!-- Header Soir - Couleurs violettes (élégant) -->
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px 32px; border-radius: 16px 16px 0 0; margin-bottom: 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="font-size: 56px; margin-bottom: 16px; text-align: center;">🌆</div>
      <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">Emma En Direct</h1>
      <div style="text-align: center; opacity: 0.95; font-size: 16px; font-weight: 500; margin-top: 8px;">
        ÉDITION SOIR | ${date}
      </div>
      <div style="text-align: center; opacity: 0.9; font-size: 14px; margin-top: 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.3);">
        📡 Généré à ${time} (heure de Montréal) • Bilan de clôture des marchés
      </div>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 40px 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-bottom: 24px;">
      ${markdownToHtml(content)}
      
      ${metadata.tickers && metadata.tickers.length > 0 ? `
      <!-- Tickers Box -->
      <div style="margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 12px; border-left: 5px solid #8b5cf6;">
        <strong style="color: #6b21a8; font-size: 16px; display: block; margin-bottom: 12px;">📈 Tickers suivis :</strong>
        <div style="color: #581c87; font-weight: 500; font-size: 15px; line-height: 1.8;">
          ${metadata.tickers.join(', ')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 13px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #4b5563;">
        🤖 Généré automatiquement par <strong>Emma IA</strong>
      </p>
      <p style="margin: 0 0 12px 0; opacity: 0.8;">
        GOB Apps • Intelligence Financière
      </p>
      <p style="margin: 0; font-size: 11px; opacity: 0.7; color: #9ca3af;">
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

