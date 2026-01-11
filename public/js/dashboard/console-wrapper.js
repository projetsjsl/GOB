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
  const hasLogger = typeof window.logger !== 'undefined' || 
                   (typeof window !== 'undefined' && window.logger);

  // Sauvegarder les méthodes originales
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalDebug = console.debug;

  // Fonction pour logger conditionnel
  function conditionalLog(level, args) {
    if (isProduction) {
      // En production, utiliser logger si disponible, sinon ne rien faire
      if (hasLogger && window.logger && window.logger[level]) {
        window.logger[level](...args);
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
    if (isProduction && hasLogger && window.logger) {
      window.logger.warn(...args);
    } else {
      originalWarn.apply(console, args);
    }
  };

  console.error = function(...args) {
    if (isProduction && hasLogger && window.logger) {
      window.logger.error(...args);
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
  console._hasLogger = hasLogger;

  if (!isProduction) {
    console.log('🔧 Console wrapper activé (mode développement)');
  }
})();
