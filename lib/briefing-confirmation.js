/**
 * Confirmation d'envoi de briefing par email
 * 
 * Envoie un email de confirmation à l'admin après l'envoi d'un briefing,
 * similaire aux confirmations SMS.
 */

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

    // Template HTML de confirmation
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation d'envoi - Briefing ${typeFrench}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <h1 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 700;">
          Briefing ${typeFrench} envoyé avec succès
        </h1>
      </div>

      <!-- Content -->
      <div style="color: #374151; line-height: 1.6;">
        <p style="margin: 0 0 16px 0;">
          Le briefing <strong>${typeFrench}</strong> a été envoyé avec succès.
        </p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600; width: 140px;">Type:</td>
              <td style="padding: 8px 0; color: #1f2937;">${typeFrench}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Sujet:</td>
              <td style="padding: 8px 0; color: #1f2937;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Destinataires:</td>
              <td style="padding: 8px 0; color: #1f2937;">${recipients.join(', ')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Message ID:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-size: 12px;">${messageId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Envoyé à:</td>
              <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
            </tr>
            ${metadata.tickers && metadata.tickers.length > 0 ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Tickers:</td>
              <td style="padding: 8px 0; color: #1f2937;">${metadata.tickers.join(', ')}</td>
            </tr>
            ` : ''}
            ${metadata.execution_time_ms ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Temps:</td>
              <td style="padding: 8px 0; color: #1f2937;">${(metadata.execution_time_ms / 1000).toFixed(1)}s</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">
          Ceci est une confirmation automatique. Le briefing a été généré par Emma IA et envoyé aux destinataires configurés.
        </p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">
          🤖 Généré automatiquement par <strong>Emma IA</strong><br>
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

