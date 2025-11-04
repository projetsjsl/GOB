/**
 * Email Notifier - Notifications email pour conversations SMS Emma
 *
 * Envoie un email à chaque conversation SMS avec:
 * - Message utilisateur et réponse Emma
 * - Métadonnées complètes (model, tools, timing)
 * - Reply-to pour répondre par email
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envoie une notification email pour une conversation SMS
 *
 * @param {Object} params - Paramètres de la notification
 * @param {string} params.userName - Nom de l'utilisateur
 * @param {string} params.userPhone - Numéro de téléphone
 * @param {string} params.userId - UUID de l'utilisateur (pour reply-to)
 * @param {string} params.userMessage - Message reçu de l'utilisateur
 * @param {string} params.emmaResponse - Réponse d'Emma
 * @param {Object} params.metadata - Métadonnées (conversationId, model, tools, etc.)
 */
export async function sendConversationEmail({
  userName,
  userPhone,
  userId,
  userMessage,
  emmaResponse,
  metadata = {}
}) {
  try {
    // Formater le sujet (max 50 chars du message)
    const messagePreview = userMessage.length > 50
      ? userMessage.substring(0, 47) + '...'
      : userMessage;

    // Tag unique pour éviter les triggers n8n
    const subject = `[JSLAI SMS] 📱 ${userName} - "${messagePreview}"`;

    // Reply-To unique pour répondre par email
    // Format: emma-reply+{userId}@gobapps.com
    const replyTo = `emma-reply+${userId}@gobapps.com`;

    // Formater la date
    const timestamp = metadata.timestamp
      ? new Date(metadata.timestamp)
      : new Date();
    const formattedDate = timestamp.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Tools utilisés
    const toolsList = metadata.tools_used && metadata.tools_used.length > 0
      ? metadata.tools_used.join(', ')
      : 'Aucun (conversation générale)';

    // Intention détectée
    const intentInfo = metadata.intent_data
      ? `${metadata.intent_data.intent} (${Math.round(metadata.intent_data.confidence * 100)}% confiance)`
      : 'Non analysée';

    // HTML Email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-top: none;
      padding: 20px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      border-left: 4px solid #667eea;
    }
    .message-box {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .user-message {
      border-left: 4px solid #4CAF50;
    }
    .emma-response {
      border-left: 4px solid #2196F3;
    }
    .metadata {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 20px;
    }
    .metadata-item {
      margin: 8px 0;
      padding: 5px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .metadata-item:last-child {
      border-bottom: none;
    }
    .metadata-label {
      font-weight: bold;
      color: #666;
      display: inline-block;
      width: 150px;
    }
    .actions {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .action-link {
      display: inline-block;
      padding: 10px 20px;
      background: #2196F3;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 5px;
    }
    .reply-instructions {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">📱 Nouvelle Conversation SMS Emma</h1>
  </div>

  <div class="content">
    <!-- Informations utilisateur -->
    <div class="info-box">
      <p style="margin: 5px 0;"><strong>👤 Utilisateur:</strong> ${userName}</p>
      <p style="margin: 5px 0;"><strong>📱 Téléphone:</strong> ${userPhone}</p>
      <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
      <p style="margin: 5px 0;"><strong>🆔 User ID:</strong> <code style="font-size: 11px;">${userId}</code></p>
    </div>

    <!-- Message reçu -->
    <div class="message-box user-message">
      <h3 style="margin-top: 0; color: #4CAF50;">💬 MESSAGE REÇU</h3>
      <p style="white-space: pre-wrap; margin: 0;">${userMessage}</p>
    </div>

    <!-- Réponse Emma -->
    <div class="message-box emma-response">
      <h3 style="margin-top: 0; color: #2196F3;">🤖 RÉPONSE EMMA</h3>
      <p style="white-space: pre-wrap; margin: 0;">${emmaResponse}</p>
    </div>

    <!-- Instructions pour répondre -->
    <div class="reply-instructions">
      <h3 style="margin-top: 0;">💡 Pour répondre par SMS via Emma:</h3>
      <p style="margin: 10px 0;">
        <strong>Clique sur "Répondre" à cet email</strong> et écris ton message.<br>
        Emma enverra automatiquement ton message par SMS à ${userName}.
      </p>
      <p style="margin: 0; font-size: 12px; color: #666;">
        ✉️ Reply-To: <code>${replyTo}</code>
      </p>
    </div>

    <!-- Métadonnées techniques -->
    <div class="metadata">
      <h3 style="margin-top: 0;">📊 MÉTADONNÉES TECHNIQUES</h3>

      <div class="metadata-item">
        <span class="metadata-label">🤖 Model AI:</span>
        <span>${metadata.model || 'unknown'}</span>
      </div>

      <div class="metadata-item">
        <span class="metadata-label">🔧 Tools utilisés:</span>
        <span>${toolsList}</span>
      </div>

      <div class="metadata-item">
        <span class="metadata-label">🎯 Intention:</span>
        <span>${intentInfo}</span>
      </div>

      <div class="metadata-item">
        <span class="metadata-label">⏱️ Temps exécution:</span>
        <span>${metadata.execution_time_ms ? `${metadata.execution_time_ms}ms` : 'N/A'}</span>
      </div>

      <div class="metadata-item">
        <span class="metadata-label">💬 Conversation ID:</span>
        <span><code style="font-size: 11px;">${metadata.conversationId || 'N/A'}</code></span>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="actions">
      <h3 style="margin-top: 0;">🔗 Actions Rapides</h3>
      <p style="margin: 10px 0;">
        <a href="https://app.supabase.com/project/${process.env.SUPABASE_PROJECT_ID || 'your-project'}/editor"
           class="action-link"
           target="_blank">
          📊 Voir dans Supabase
        </a>
        <a href="https://console.twilio.com/us1/monitor/logs/sms"
           class="action-link"
           target="_blank">
          📱 Logs Twilio
        </a>
      </p>
    </div>
  </div>

  <div class="footer">
    <p>
      <strong>Emma IA propulsée par JSLAI</strong> 🚀<br>
      Système de notifications email • Conversations SMS<br>
      <span style="font-size: 11px; color: #999;">ID Notification: ${Date.now()}</span>
    </p>
  </div>
</body>
</html>
    `;

    // Envoyer l'email
    const result = await resend.emails.send({
      from: 'Emma IA <emma@gobapps.com>',
      to: process.env.ADMIN_EMAIL || 'projetsjsl@gmail.com',
      replyTo: replyTo, // 🔥 Important: permet de répondre par email
      subject: subject,
      html: html,
      tags: [
        { name: 'type', value: 'sms_conversation' },
        { name: 'user', value: userName },
        { name: 'channel', value: 'sms' },
        { name: 'user_id', value: userId }
      ]
    });

    console.log(`✅ [Email Notifier] Email envoyé: ${result.id}`);
    return result;

  } catch (error) {
    console.error('❌ [Email Notifier] Erreur envoi email:', error);
    throw error;
  }
}

/**
 * Envoie un email de notification d'erreur
 */
export async function sendErrorNotification({
  error,
  context = {}
}) {
  try {
    await resend.emails.send({
      from: 'Emma IA <emma@gobapps.com>',
      to: process.env.ADMIN_EMAIL || 'projetsjsl@gmail.com',
      subject: '[JSLAI SMS] ⚠️ Erreur système',
      html: `
        <h2>⚠️ Erreur détectée dans Emma SMS</h2>
        <p><strong>Message:</strong> ${error.message}</p>
        <p><strong>Stack:</strong></p>
        <pre>${error.stack}</pre>
        <p><strong>Context:</strong></p>
        <pre>${JSON.stringify(context, null, 2)}</pre>
      `,
      tags: [
        { name: 'type', value: 'error_notification' }
      ]
    });
  } catch (err) {
    console.error('Failed to send error notification:', err);
  }
}

export default {
  sendConversationEmail,
  sendErrorNotification
};
