/**
 * Système de logging unifié pour GOB
 *
 * Usage:
 * import { logger } from '../lib/logger.js';
 *
 * logger.debug('Message de debug', { data });
 * logger.info('Message info', { data });
 * logger.warn('Avertissement', { data });
 * logger.error('Erreur critique', error);
 */

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

/**
 * Formate un message de log avec timestamp
 */
function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  const prefix = getPrefix(level);

  if (data) {
    return `[${timestamp}] ${prefix} ${message}`;
  }
  return `[${timestamp}] ${prefix} ${message}`;
}

/**
 * Retourne le préfixe selon le niveau de log
 */
function getPrefix(level) {
  const prefixes = {
    debug: '🔍 DEBUG',
    info: 'ℹ️  INFO',
    warn: '⚠️  WARN',
    error: '❌ ERROR',
    success: '✅ SUCCESS'
  };
  return prefixes[level] || 'LOG';
}

/**
 * Envoie les logs critiques à un service externe (optionnel)
 * Peut être connecté à Sentry, Vercel Analytics, etc.
 */
function sendToMonitoring(level, message, data) {
  // TODO: Implémenter l'envoi vers un service de monitoring
  // Exemple: Sentry.captureMessage(message, { level, extra: data });

  if (isProduction && (level === 'error' || level === 'warn')) {
    // En production, on pourrait envoyer vers un service externe
    // Pour l'instant, on log juste dans la console
  }
}

/**
 * Logger principal
 */
export const logger = {
  /**
   * Logs de debug (uniquement en développement)
   */
  debug: (message, data = null) => {
    if (isDevelopment) {
      const formatted = formatMessage('debug', message, data);
      console.log(formatted, data || '');
    }
  },

  /**
   * Logs d'information (toujours affichés)
   */
  info: (message, data = null) => {
    const formatted = formatMessage('info', message, data);
    console.log(formatted, data || '');
  },

  /**
   * Logs de succès (toujours affichés)
   */
  success: (message, data = null) => {
    const formatted = formatMessage('success', message, data);
    console.log(formatted, data || '');
  },

  /**
   * Avertissements (toujours affichés + monitoring en prod)
   */
  warn: (message, data = null) => {
    const formatted = formatMessage('warn', message, data);
    console.warn(formatted, data || '');

    if (isProduction) {
      sendToMonitoring('warn', message, data);
    }
  },

  /**
   * Erreurs critiques (toujours affichées + monitoring en prod)
   */
  error: (message, error = null) => {
    const formatted = formatMessage('error', message, error);
    console.error(formatted);

    if (error) {
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      } else {
        console.error('Error details:', error);
      }
    }

    if (isProduction) {
      sendToMonitoring('error', message, error);
    }
  },

  /**
   * Log d'API avec timing (utile pour monitoring de performance)
   */
  api: (endpoint, duration, status, details = null) => {
    const message = `API ${endpoint} - ${status} (${duration}ms)`;

    if (status >= 500) {
      logger.error(message, details);
    } else if (status >= 400) {
      logger.warn(message, details);
    } else {
      logger.info(message, details);
    }
  }
};

/**
 * Wrapper pour timer une fonction
 * Usage: const result = await logger.time('Nom opération', async () => { ... });
 */
logger.time = async (label, fn) => {
  const start = Date.now();
  logger.debug(`⏱️  Début: ${label}`);

  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.success(`${label} terminé en ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${label} échoué après ${duration}ms`, error);
    throw error;
  }
};

/**
 * Export par défaut
 */
export default logger;
