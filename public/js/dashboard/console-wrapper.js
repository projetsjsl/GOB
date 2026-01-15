/**
 * Console Wrapper pour Production
 * 
 * Supprime automatiquement les console.log en production
 * et les remplace par logger.debug en developpement
 */

(function() {
  'use strict';

  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1' &&
                       !window.location.hostname.includes('localhost');

  // Logger disponible (si charge)
  // Attendre que logger.js soit charge - verifier de maniere asynchrone
  const hasLogger = () => {
    if (typeof window === 'undefined') return false;
    
    // Verifier si logger est deja charge
    if (typeof window.logger !== 'undefined' && 
        window.logger && 
        typeof window.logger.debug === 'function') {
      return true;
    }
    
    // Verifier si le script logger.js est en cours de chargement
    const loggerScript = document.querySelector('script[src*="logger.js"]');
    if (loggerScript && !loggerScript.hasAttribute('data-loaded')) {
      // Script pas encore charge, retourner false pour l'instant
      return false;
    }
    
    return false;
  };

  // Sauvegarder les methodes originales
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalDebug = console.debug;

  // Map des methodes originales pour eviter la recursion infinie
  const originalMethods = {
    log: originalLog,
    warn: originalWarn,
    error: originalError,
    debug: originalDebug
  };

  // Fonction pour logger conditionnel
  function conditionalLog(level, args) {
    if (isProduction) {
      // En production, utiliser logger si disponible, sinon ne rien faire
      if (hasLogger() && window.logger && window.logger[level]) {
        try {
          window.logger[level](...args);
        } catch (e) {
          // Si logger echoue, ne rien faire en production
        }
      }
      // Sinon, ne rien logger en production
      return;
    }

    // En developpement, utiliser la methode ORIGINALE (pas l'overridee)
    const method = originalMethods[level] || originalLog;
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

  // Exposer une methode pour restaurer (pour debugging)
  console._restore = function() {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    console.debug = originalDebug;
  };

  // Exposer une methode pour verifier l'etat
  console._isProduction = isProduction;
  console._hasLogger = hasLogger();

  // Attendre que logger.js soit charge si necessaire
  if (typeof window !== 'undefined' && !hasLogger()) {
    const checkLogger = setInterval(() => {
      if (hasLogger()) {
        clearInterval(checkLogger);
        if (!isProduction) {
          console.log(' Console wrapper: Logger maintenant disponible');
        }
      }
    }, 100);
    
    // Arreter apres 5 secondes
    setTimeout(() => clearInterval(checkLogger), 5000);
  }

  if (!isProduction) {
    console.log(' Console wrapper active (mode developpement)');
  }
})();
