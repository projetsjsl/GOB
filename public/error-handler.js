/**
 * Gestionnaire d'erreurs pour GOB Apps
 * Résout les problèmes d'Eruda et autres erreurs de console
 */

(function() {
    'use strict';
    
    // Supprimer les erreurs Eruda si elles apparaissent
    const originalConsoleError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        
        // Filtrer les erreurs Eruda
        if (message.includes('[Eruda]') || message.includes('eruda.init()')) {
            return; // Ne pas afficher ces erreurs
        }
        
        // Afficher les autres erreurs normalement
        originalConsoleError.apply(console, args);
    };
    
    // Gestion des erreurs de script
    window.addEventListener('error', function(event) {
        console.log('Erreur de script détectée:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
        
        // Ne pas propager l'erreur si c'est une erreur de ressource externe
        if (event.filename && (
            event.filename.includes('unpkg.com') ||
            event.filename.includes('cdn.jsdelivr.net') ||
            event.filename.includes('cdnjs.cloudflare.com')
        )) {
            event.preventDefault();
            return false;
        }
    });
    
    // Gestion des erreurs de promesses non capturées
    window.addEventListener('unhandledrejection', function(event) {
        console.log('Promesse rejetée non gérée:', event.reason);
        
        // Empêcher l'erreur de s'afficher dans la console
        event.preventDefault();
    });
    
    // Vérifier et corriger les problèmes de chargement des ressources
    function checkResourceLoading() {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            script.addEventListener('error', function() {
                console.log('Erreur de chargement du script:', this.src);
                
                // Essayer de recharger le script après 2 secondes
                setTimeout(() => {
                    const newScript = document.createElement('script');
                    newScript.src = this.src;
                    newScript.crossOrigin = this.crossOrigin;
                    newScript.onload = () => console.log('Script rechargé avec succès:', this.src);
                    newScript.onerror = () => console.log('Échec du rechargement du script:', this.src);
                    document.head.appendChild(newScript);
                }, 2000);
            });
        });
    }
    
    // Initialiser le gestionnaire d'erreurs
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkResourceLoading);
    } else {
        checkResourceLoading();
    }
    
    // Fonction pour diagnostiquer les problèmes
    window.diagnoseErrors = function() {
        const errors = [];
        
        // Vérifier les scripts manquants
        const requiredScripts = [
            'https://unpkg.com/react@18/umd/react.production.min.js',
            'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
            'https://unpkg.com/@babel/standalone/babel.min.js',
            'https://cdn.tailwindcss.com'
        ];
        
        requiredScripts.forEach(src => {
            const script = document.querySelector(`script[src="${src}"]`);
            if (!script) {
                errors.push(`Script manquant: ${src}`);
            }
        });
        
        // Vérifier les erreurs de réseau
        if (!navigator.onLine) {
            errors.push('Connexion internet perdue');
        }
        
        // Vérifier les erreurs de CORS
        const corsErrors = document.querySelectorAll('[data-cors-error]');
        if (corsErrors.length > 0) {
            errors.push(`${corsErrors.length} erreur(s) CORS détectée(s)`);
        }
        
        return errors;
    };
    
    console.log('🔧 Gestionnaire d\'erreurs GOB Apps initialisé');
})();