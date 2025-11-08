/**
 * Confirmation d'envoi de briefing par email
 * 
 * Envoie un email de confirmation à l'admin après l'envoi d'un briefing,
 * similaire aux confirmations SMS.
 * 
 * Utilise les couleurs centralisées depuis config/theme-colors.json
 */

import { colors, gradients, emailConfig } from './theme-colors.js';

/**
 * Envoie une confirmation email après l'envoi d'un briefing
 * 
 * @param {Object} params - Paramètres de confirmation
 * @param {string} params.type - Type de briefing (morning/midday/evening)
 * @param {string} params.subject - Sujet du briefing envoyé
 * @param {string[]} params.recipients - Destinataires du briefing
 * @param {string} params.messageId - ID du message Resend
 * @param {Object} params.metadata - Métadonnées du briefing
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function sendBriefingConfirmation({
  type,
  subject,
  recipients,
  messageId,
  metadata = {}
}) {
  try {
    const { Resend } = await import('resend');
    
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY non configuré, confirmation non envoyée');
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_TO_EMAIL || 'projetsjsl@gmail.com';

    // Mapper les types en français
    const typeMap = {
      morning: 'Matin',
      midday: 'Midi',
      noon: 'Midi',
      evening: 'Soir'
    };
    const typeFrench = typeMap[type] || type;

    // Template HTML de confirmation avec couleurs centralisées
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation d'envoi - Briefing ${typeFrench}</title>
</head>
<body style="margin: 0; padding: 0; font-family: ${emailConfig.fonts.primary}; background-color: ${colors.background.light};">
  <div style="max-width: ${emailConfig.spacing.containerMaxWidth}; margin: 0 auto; padding: ${emailConfig.spacing.padding.small};">
    <div style="background: ${colors.background.white}; border-radius: ${emailConfig.spacing.borderRadius.medium}; padding: ${emailConfig.spacing.padding.medium}; box-shadow: ${emailConfig.shadows.medium};">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid ${colors.primary};">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <h1 style="margin: 0; color: ${colors.primaryDark}; font-size: 24px; font-weight: 700;">
          Briefing ${typeFrench} envoyé avec succès
        </h1>
      </div>

      <!-- Content -->
      <div style="color: ${colors.text.dark}; line-height: 1.6;">
        <p style="margin: 0 0 16px 0;">
          Le briefing <strong style="color: ${colors.primary};">${typeFrench}</strong> a été envoyé avec succès.
        </p>

        <div style="background: ${colors.background.light}; border-radius: ${emailConfig.spacing.borderRadius.small}; padding: ${emailConfig.spacing.padding.medium}; margin: 24px 0; border-left: 4px solid ${colors.primary};">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: ${colors.primaryDark}; font-weight: 700; width: 140px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Type:</td>
              <td style="padding: 8px 0; color: ${colors.text.dark}; font-weight: 500;">${typeFrench}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${colors.primaryDark}; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Sujet:</td>
              <td style="padding: 8px 0; color: ${colors.text.dark}; font-weight: 500;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${colors.primaryDark}; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Destinataires:</td>
              <td style="padding: 8px 0; color: ${colors.text.dark}; font-weight: 500;">${recipients.join(', ')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${colors.primaryDark}; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message ID:</td>
              <td style="padding: 8px 0; color: ${colors.text.dark}; font-family: ${emailConfig.fonts.monospace}; font-size: 12px;">${messageId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${colors.primaryDark}; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Envoyé à:</td>
              <td style="padding: 8px 0; color: ${colors.text.dark}; font-weight: 500;">${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
            </tr>
            ${metadata.tickers && metadata.tickers.length > 0 ? `
            <tr>
              <td style="padding: 8px 0; color: ${colors.primaryDark}; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Tickers:</td>
              <td style="padding: 8px 0; color: ${colors.text.dark}; font-weight: 500;">${metadata.tickers.join(', ')}</td>
            </tr>
            ` : ''}
            ${metadata.execution_time_ms ? `
            <tr>
              <td style="padding: 8px 0; color: ${colors.primaryDark}; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Temps:</td>
              <td style="padding: 8px 0; color: ${colors.success}; font-weight: 600;">${(metadata.execution_time_ms / 1000).toFixed(1)}s</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <p style="margin: 24px 0 0 0; color: ${colors.text.medium}; font-size: 14px;">
          Ceci est une confirmation automatique. Le briefing a été généré par Emma IA et envoyé aux destinataires configurés.
        </p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid ${colors.border.light}; text-align: center; color: ${colors.text.muted}; font-size: 12px;">
        <p style="margin: 0;">
          🤖 Généré automatiquement par <strong style="color: ${colors.primaryDark};">Emma IA</strong><br>
          GOB Apps • Intelligence Financière
        </p>
      </div>

    </div>
  </div>
</body>
</html>
    `.trim();

    // Envoyer l'email de confirmation
    const result = await resend.emails.send({
      from: 'Emma En Direct <noreply@gobapps.com>',
      to: adminEmail,
      subject: `✅ Briefing ${typeFrench} envoyé - ${new Date().toLocaleDateString('fr-FR')}`,
      html: htmlContent
    });

    console.log(`✅ [Briefing Confirmation] Email de confirmation envoyé à ${adminEmail}`);

    return {
      success: true,
      messageId: result.data?.id,
      sentTo: adminEmail
    };

  } catch (error) {
    console.error('❌ [Briefing Confirmation] Erreur envoi confirmation:', error);
    // Non-bloquant: on ne fait pas échouer le briefing si la confirmation échoue
    return {
      success: false,
      error: error.message
    };
  }
}

