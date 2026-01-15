/**
 * Utilitaires pour le God Mode (Modular Dashboard)
 * Patch pour les fonctions manquantes de l'architecture monolithique.
 */

window.showCommandsHelp = function() {
    alert("i Aide Commandes :\n\n- /reset : Reinitialiser le chat\n- /clear : Effacer l'historique\n- /help : Afficher ce message");
};

// Patch pour 'exports' si jamais un module mal transpile l'utilise
if (typeof exports === 'undefined') {
    window.exports = {};
}

// Patch pour 'module'
if (typeof module === 'undefined') {
    window.module = { exports: {} };
}
