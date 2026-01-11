/**
 * Console Wrapper pour Production
 * 
 * Supprime automatiquement les console.log en production
 * et les remplace par logger.debug en développement
 */

(function() {
  'use strict';

  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1' &&
                       !window.location.hostname.includes('localhost');

  // Logger disponible (si chargé)
  // Attendre que logger.js soit chargé - vérifier de manière asynchrone
  const hasLogger = () => {
    if (typeof window === 'undefined') return false;
    
    // Vérifier si logger est déjà chargé
    if (typeof window.logger !== 'undefined' && 
        window.logger && 
        typeof window.logger.debug === 'function') {
      return true;
    }
    
    // Vérifier si le script logger.js est en cours de chargement
    const loggerScript = document.querySelector('script[src*="logger.js"]');
    if (loggerScript && !loggerScript.hasAttribute('data-loaded')) {
      // Script pas encore chargé, retourner false pour l'instant
      return false;
    }
    
    return false;
  };

  // Sauvegarder les méthodes originales
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalDebug = console.debug;

  // Fonction pour logger conditionnel
  function conditionalLog(level, args) {
    if (isProduction) {
      // En production, utiliser logger si disponible, sinon ne rien faire
      if (hasLogger() && window.logger && window.logger[level]) {
        try {
          window.logger[level](...args);
        } catch (e) {
          // Si logger échoue, ne rien faire en production
        }
      }
      // Sinon, ne rien logger en production
      return;
    }
    
    // En développement, logger normalement
    const method = console[level] || originalLog;
    method.apply(console, args);
  }

  // Remplacer console.log
  console.log = function(...args) {
    conditionalLog('debug', args);
  };

  // Remplacer console.debug
  console.debug = function(...args) {
    conditionalLog('debug', args);
  };

  // Garder console.warn et console.error (toujours utiles)
  console.warn = function(...args) {
    if (isProduction && hasLogger() && window.logger) {
      try {
        window.logger.warn(...args);
      } catch (e) {
        originalWarn.apply(console, args);
      }
    } else {
      originalWarn.apply(console, args);
    }
  };

  console.error = function(...args) {
    if (isProduction && hasLogger() && window.logger) {
      try {
        window.logger.error(...args);
      } catch (e) {
        originalError.apply(console, args);
      }
    } else {
      originalError.apply(console, args);
    }
  };

  // Exposer une méthode pour restaurer (pour debugging)
  console._restore = function() {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    console.debug = originalDebug;
  };

  // Exposer une méthode pour vérifier l'état
  console._isProduction = isProduction;
  console._hasLogger = hasLogger();

  // Attendre que logger.js soit chargé si nécessaire
  if (typeof window !== 'undefined' && !hasLogger()) {
    const checkLogger = setInterval(() => {
      if (hasLogger()) {
        clearInterval(checkLogger);
        if (!isProduction) {
          console.log('🔧 Console wrapper: Logger maintenant disponible');
        }
      }
    }, 100);
    
    // Arrêter après 5 secondes
    setTimeout(() => clearInterval(checkLogger), 5000);
  }

  if (!isProduction) {
    console.log('🔧 Console wrapper activé (mode développement)');
  }
})();
