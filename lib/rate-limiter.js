/**
 * Rate Limiter - Utilitaire pour limiter le taux d'appels API
 * 
 * Utilisé pour éviter les surcharges sur les APIs externes (Resend, OpenAI, etc.)
 */

// Cache en mémoire pour les limites
const rateLimitCache = new Map();

/**
 * Configuration par défaut des limites
 */
const DEFAULT_LIMITS = {
  email: { requests: 10, windowMs: 60000 },      // 10 emails/min
  sms: { requests: 5, windowMs: 60000 },         // 5 SMS/min
  openai: { requests: 20, windowMs: 60000 },     // 20 requêtes/min
  preview: { requests: 100, windowMs: 60000 }    // 100 previews/min
};

/**
 * Vérifie si une action est autorisée selon les limites de taux
 * @param {string} key - Clé unique (ex: 'email:user@domain.com')
 * @param {string} type - Type de limite ('email', 'sms', 'openai', 'preview')
 * @returns {Object} { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(key, type = 'preview') {
  const limit = DEFAULT_LIMITS[type] || DEFAULT_LIMITS.preview;
  const now = Date.now();
  const windowStart = now - limit.windowMs;
  
  // Récupérer ou créer l'entrée
  let entry = rateLimitCache.get(key);
  
  if (!entry) {
    entry = { requests: [], type };
    rateLimitCache.set(key, entry);
  }
  
  // Nettoyer les anciennes requêtes (hors fenêtre)
  entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
  
  // Vérifier si autorisé
  const remaining = Math.max(0, limit.requests - entry.requests.length);
  const allowed = remaining > 0;
  
  // Calculer le temps avant reset
  const oldestRequest = entry.requests[0];
  const resetIn = oldestRequest ? Math.max(0, (oldestRequest + limit.windowMs) - now) : 0;
  
  return {
    allowed,
    remaining,
    resetIn,
    limit: limit.requests
  };
}

/**
 * Enregistre une nouvelle requête
 * @param {string} key - Clé unique
 * @param {string} type - Type de limite
 */
export function recordRequest(key, type = 'preview') {
  const entry = rateLimitCache.get(key) || { requests: [], type };
  entry.requests.push(Date.now());
  rateLimitCache.set(key, entry);
}

/**
 * Middleware Express pour le rate limiting
 * @param {string} type - Type de limite
 * @returns {Function} Middleware
 */
export function rateLimitMiddleware(type = 'preview') {
  return (req, res, next) => {
    // Utiliser IP ou user ID comme clé
    const key = `${type}:${req.ip || req.headers['x-forwarded-for'] || 'anonymous'}`;
    const result = checkRateLimit(key, type);
    
    // Ajouter les headers de rate limit
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000));
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: Math.ceil(result.resetIn / 1000),
        message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetIn / 1000)}s`
      });
    }
    
    // Enregistrer la requête
    recordRequest(key, type);
    next();
  };
}

/**
 * Nettoie le cache des entrées expirées
 * Appeler périodiquement pour éviter les fuites mémoire
 */
export function cleanupRateLimitCache() {
  const now = Date.now();
  const maxAge = 300000; // 5 minutes
  
  for (const [key, entry] of rateLimitCache.entries()) {
    const limit = DEFAULT_LIMITS[entry.type] || DEFAULT_LIMITS.preview;
    const windowStart = now - limit.windowMs;
    
    // Supprimer si toutes les requêtes sont expirées
    entry.requests = entry.requests.filter(ts => ts > windowStart);
    if (entry.requests.length === 0) {
      rateLimitCache.delete(key);
    }
  }
}

// Nettoyage automatique toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitCache, 300000);
}

export default {
  checkRateLimit,
  recordRequest,
  rateLimitMiddleware,
  cleanupRateLimitCache,
  DEFAULT_LIMITS
};
