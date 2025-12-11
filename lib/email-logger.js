/**
 * Email Logger - Utilitaire de journalisation des emails
 * 
 * Stocke les logs en mémoire avec option de persistence Supabase.
 * Utile pour le debugging et les analytics.
 */

// Log en mémoire (max 1000 entrées)
const emailLogs = [];
const MAX_LOGS = 1000;

/**
 * Structure d'un log email
 * @typedef {Object} EmailLogEntry
 * @property {string} id - ID unique
 * @property {string} timestamp - ISO timestamp
 * @property {string} type - 'briefing' | 'notification' | 'alert' | 'manual'
 * @property {string} channel - 'email' | 'sms'
 * @property {string} recipient - Email ou téléphone (masqué)
 * @property {string} subject - Sujet de l'email
 * @property {number} sizeBytes - Taille du contenu
 * @property {string} status - 'pending' | 'sent' | 'failed'
 * @property {number} durationMs - Temps d'envoi
 * @property {string} error - Message d'erreur si échec
 */

/**
 * Génère un ID unique
 */
function generateId() {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Masque une adresse email pour la vie privée
 * @param {string} email - Email complet
 * @returns {string} Email masqué (ex: t***@gmail.com)
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Masque un numéro de téléphone
 * @param {string} phone - Numéro complet
 * @returns {string} Numéro masqué (ex: +1***1234)
 */
export function maskPhone(phone) {
  if (!phone || phone.length < 4) return '***';
  return phone.slice(0, 3) + '***' + phone.slice(-4);
}

/**
 * Log un envoi d'email
 * @param {Object} data - Données du log
 * @returns {string} ID du log
 */
export function logEmail(data) {
  const entry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: data.type || 'manual',
    channel: data.channel || 'email',
    recipient: data.channel === 'sms' 
      ? maskPhone(data.recipient) 
      : maskEmail(data.recipient),
    subject: data.subject?.slice(0, 100) || 'N/A',
    sizeBytes: data.sizeBytes || 0,
    status: data.status || 'pending',
    durationMs: data.durationMs || 0,
    error: data.error || null,
    metadata: data.metadata || {}
  };
  
  // Ajouter au début (plus récent en premier)
  emailLogs.unshift(entry);
  
  // Limiter la taille
  if (emailLogs.length > MAX_LOGS) {
    emailLogs.pop();
  }
  
  // Log console pour debugging
  const emoji = entry.status === 'sent' ? '✅' : entry.status === 'failed' ? '❌' : '⏳';
  console.log(`[Email Log] ${emoji} ${entry.type} to ${entry.recipient} - ${entry.status} (${entry.durationMs}ms)`);
  
  return entry.id;
}

/**
 * Met à jour le statut d'un log
 * @param {string} id - ID du log
 * @param {Object} updates - Mises à jour
 */
export function updateEmailLog(id, updates) {
  const entry = emailLogs.find(e => e.id === id);
  if (entry) {
    Object.assign(entry, updates);
  }
}

/**
 * Récupère les logs récents
 * @param {Object} options - Options de filtrage
 * @param {number} options.limit - Nombre max de résultats
 * @param {string} options.status - Filtrer par statut
 * @param {string} options.type - Filtrer par type
 * @returns {EmailLogEntry[]} Logs filtrés
 */
export function getEmailLogs({ limit = 50, status = null, type = null } = {}) {
  let filtered = [...emailLogs];
  
  if (status) {
    filtered = filtered.filter(e => e.status === status);
  }
  if (type) {
    filtered = filtered.filter(e => e.type === type);
  }
  
  return filtered.slice(0, limit);
}

/**
 * Obtient les statistiques des emails
 * @returns {Object} Stats agrégées
 */
export function getEmailStats() {
  const now = new Date();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  
  const recent24h = emailLogs.filter(e => new Date(e.timestamp) > last24h);
  const recent7d = emailLogs.filter(e => new Date(e.timestamp) > last7d);
  
  return {
    total: emailLogs.length,
    last24h: {
      total: recent24h.length,
      sent: recent24h.filter(e => e.status === 'sent').length,
      failed: recent24h.filter(e => e.status === 'failed').length
    },
    last7d: {
      total: recent7d.length,
      sent: recent7d.filter(e => e.status === 'sent').length,
      failed: recent7d.filter(e => e.status === 'failed').length
    },
    byType: {
      briefing: emailLogs.filter(e => e.type === 'briefing').length,
      notification: emailLogs.filter(e => e.type === 'notification').length,
      alert: emailLogs.filter(e => e.type === 'alert').length,
      manual: emailLogs.filter(e => e.type === 'manual').length
    },
    avgDurationMs: emailLogs.length > 0
      ? Math.round(emailLogs.reduce((sum, e) => sum + (e.durationMs || 0), 0) / emailLogs.length)
      : 0
  };
}

/**
 * Efface tous les logs (pour tests)
 */
export function clearEmailLogs() {
  emailLogs.length = 0;
}

export default {
  logEmail,
  updateEmailLog,
  getEmailLogs,
  getEmailStats,
  clearEmailLogs,
  maskEmail,
  maskPhone
};
