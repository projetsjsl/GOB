/**
 * Email HTML Helpers - Utilitaires pour générer du HTML email compatible
 * 
 * Ce module fournit des fonctions helper pour créer facilement des emails
 * HTML compatibles avec tous les clients (Outlook, Gmail, Apple Mail).
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * UTILISATION:
 * import { createEmailTable, createEmailRow, createEmailButton } from './email-helpers.js';
 * 
 * const html = createEmailWrapper({
 *   header: createEmailHeader({ title: 'Mon Titre', subtitle: 'Sous-titre' }),
 *   content: createEmailTable([
 *     createEmailRow('Contenu ici'),
 *     createEmailRow('Autre contenu')
 *   ]),
 *   footer: createEmailFooter({ text: '© 2025' })
 * });
 * ════════════════════════════════════════════════════════════════════════════
 */

// Constantes de style par défaut
const DEFAULT_FONT = 'Arial, Helvetica, sans-serif';
const DEFAULT_COLORS = {
  primary: '#667eea',
  primaryDark: '#5a67d8',
  text: '#333333',
  textMuted: '#666666',
  background: '#f4f4f4',
  white: '#ffffff',
  border: '#e0e0e0'
};

/**
 * Crée un wrapper table pour email (conteneur principal)
 * @param {Object} options - Options de configuration
 * @param {string} options.header - HTML du header
 * @param {string} options.content - HTML du contenu
 * @param {string} options.footer - HTML du footer
 * @param {number} options.width - Largeur max (défaut: 600)
 * @param {Object} options.colors - Couleurs personnalisées
 * @returns {string} HTML complet de l'email
 */
export function createEmailWrapper({ header = '', content = '', footer = '', width = 600, colors = {} }) {
  const c = { ...DEFAULT_COLORS, ...colors };
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: ${DEFAULT_FONT}; background-color: ${c.background};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="${width}" cellpadding="0" cellspacing="0" border="0" style="max-width: ${width}px; background-color: ${c.white};">
          ${header}
          ${content}
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Crée un header d'email
 * @param {Object} options - Options
 * @param {string} options.title - Titre principal
 * @param {string} options.subtitle - Sous-titre optionnel
 * @param {string} options.emoji - Emoji optionnel
 * @param {Object} options.colors - Couleurs
 * @returns {string} HTML du header
 */
export function createEmailHeader({ title, subtitle = '', emoji = '', colors = {} }) {
  const c = { ...DEFAULT_COLORS, ...colors };
  
  const emojiHtml = emoji ? `
    <tr>
      <td style="font-size: 48px; text-align: center; padding-bottom: 12px;">${emoji}</td>
    </tr>` : '';
  
  const subtitleHtml = subtitle ? `
    <tr>
      <td style="font-size: 14px; color: ${c.white}; text-align: center; opacity: 0.9; font-family: ${DEFAULT_FONT};">
        ${subtitle}
      </td>
    </tr>` : '';
  
  return `
  <tr>
    <td style="background-color: ${c.primary}; color: ${c.white}; padding: 32px; text-align: center;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${emojiHtml}
        <tr>
          <td style="font-size: 28px; font-weight: bold; color: ${c.white}; text-align: center; font-family: ${DEFAULT_FONT}; padding-bottom: 8px;">
            ${title}
          </td>
        </tr>
        ${subtitleHtml}
      </table>
    </td>
  </tr>`;
}

/**
 * Crée une section de contenu
 * @param {string} content - Contenu HTML
 * @param {Object} options - Options
 * @param {number} options.padding - Padding (défaut: 32)
 * @returns {string} HTML de la section
 */
export function createEmailContent(content, { padding = 32 } = {}) {
  return `
  <tr>
    <td style="padding: ${padding}px;">
      ${content}
    </td>
  </tr>`;
}

/**
 * Crée une table de contenu interne
 * @param {string[]} rows - Tableau de rows HTML
 * @returns {string} HTML de la table
 */
export function createEmailTable(rows) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${rows.join('\n')}
  </table>`;
}

/**
 * Crée une row simple
 * @param {string} content - Contenu
 * @param {Object} options - Options de style
 * @returns {string} HTML de la row
 */
export function createEmailRow(content, { padding = '8px 0', fontSize = '14px', color = DEFAULT_COLORS.text } = {}) {
  return `
  <tr>
    <td style="padding: ${padding}; font-size: ${fontSize}; color: ${color}; line-height: 1.6; font-family: ${DEFAULT_FONT};">
      ${content}
    </td>
  </tr>`;
}

/**
 * Crée un bouton CTA (Call to Action)
 * @param {string} text - Texte du bouton
 * @param {string} url - URL de destination
 * @param {Object} options - Options de style
 * @returns {string} HTML du bouton
 */
export function createEmailButton(text, url, { backgroundColor = DEFAULT_COLORS.primary, textColor = '#ffffff', padding = '12px 24px' } = {}) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0;">
    <tr>
      <td style="background-color: ${backgroundColor}; padding: ${padding}; text-align: center;">
        <a href="${url}" style="color: ${textColor}; text-decoration: none; font-weight: bold; font-family: ${DEFAULT_FONT}; font-size: 14px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

/**
 * Crée un footer d'email
 * @param {Object} options - Options
 * @param {string} options.text - Texte principal
 * @param {string} options.disclaimer - Texte disclaimer optionnel
 * @param {Object} options.colors - Couleurs
 * @returns {string} HTML du footer
 */
export function createEmailFooter({ text = '', disclaimer = '', colors = {} }) {
  const c = { ...DEFAULT_COLORS, ...colors };
  
  const disclaimerHtml = disclaimer ? `
    <tr>
      <td style="padding-top: 12px; font-size: 10px; color: ${c.textMuted}; text-align: center; font-family: ${DEFAULT_FONT};">
        ${disclaimer}
      </td>
    </tr>` : '';
  
  return `
  <tr>
    <td style="padding: 20px; text-align: center; border-top: 1px solid ${c.border};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size: 12px; color: ${c.textMuted}; text-align: center; font-family: ${DEFAULT_FONT};">
            ${text}
          </td>
        </tr>
        ${disclaimerHtml}
      </table>
    </td>
  </tr>`;
}

/**
 * Crée un espaceur vertical
 * @param {number} height - Hauteur en pixels
 * @returns {string} HTML de l'espaceur
 */
export function createEmailSpacer(height = 20) {
  return `
  <tr>
    <td style="height: ${height}px; line-height: ${height}px;">&nbsp;</td>
  </tr>`;
}

/**
 * Crée un diviseur horizontal
 * @param {Object} options - Options de style
 * @returns {string} HTML du diviseur
 */
export function createEmailDivider({ color = DEFAULT_COLORS.border, margin = '16px 0' } = {}) {
  return `
  <tr>
    <td style="padding: ${margin};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-top: 1px solid ${color};"></td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/**
 * Échappe le HTML pour éviter les injections
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export default {
  createEmailWrapper,
  createEmailHeader,
  createEmailContent,
  createEmailTable,
  createEmailRow,
  createEmailButton,
  createEmailFooter,
  createEmailSpacer,
  createEmailDivider,
  escapeHtml,
  DEFAULT_COLORS,
  DEFAULT_FONT
};
