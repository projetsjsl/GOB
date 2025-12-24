/**
 * Script de correction pour les problèmes d'affichage du calculateur de retraite
 * - Corrige les valeurs "undefined"
 * - Ajoute les styles manquants pour les cartes
 * - Améliore le formatage des sections
 */

(function() {
    'use strict';

    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log('🔧 Initialisation des corrections du calculateur de retraite...');
        
        // Corriger les valeurs undefined
        fixUndefinedValues();
        
        // Ajouter les styles manquants
        ensureCardStyles();
        
        // Observer les changements du DOM pour corriger les nouvelles valeurs undefined
        observeDOMChanges();
    }

    /**
     * Corriger toutes les valeurs "undefined" dans le DOM
     */
    function fixUndefinedValues() {
        // Chercher tous les éléments contenant "undefined"
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.includes('undefined')) {
                textNodes.push(node);
            }
        }

        textNodes.forEach(textNode => {
            const parent = textNode.parentElement;
            const originalText = textNode.textContent;

            // Remplacer "undefined" par une valeur par défaut appropriée
            let replacement = 'Non calculable';
            
            // Détecter le contexte pour un remplacement plus intelligent
            if (originalText.includes('Âge') || originalText.includes('âge') || originalText.includes('ans')) {
                replacement = 'N/A';
            } else if (originalText.includes('$') || originalText.includes('montant') || originalText.includes('Montant')) {
                replacement = '$0';
            } else if (originalText.includes('%') || originalText.includes('pourcent')) {
                replacement = '0%';
            } else if (originalText.includes('Score') || originalText.includes('score')) {
                replacement = '0/10';
            }

            // Remplacer le texte
            textNode.textContent = originalText.replace(/undefined/g, replacement);
            
            // Ajouter une classe pour indiquer que c'était undefined
            if (parent) {
                parent.classList.add('was-undefined');
            }
        });

        // Corriger spécifiquement l'âge d'indifférence
        const ageElements = document.querySelectorAll('[class*="age"], [id*="age"], [class*="indifférence"], [id*="indifférence"]');
        ageElements.forEach(el => {
            if (el.textContent.includes('undefined')) {
                el.textContent = el.textContent.replace(/undefined/g, 'N/A');
                el.classList.add('age-undefined-fixed');
            }
        });

        console.log(`✅ ${textNodes.length} valeur(s) "undefined" corrigée(s)`);
    }

    /**
     * S'assurer que les styles CSS sont présents
     */
    function ensureCardStyles() {
        // Vérifier si le fichier CSS est déjà chargé
        const existingLink = document.querySelector('link[href*="retirement-calculator-fix.css"]');
        if (existingLink) {
            return;
        }

        // Créer un élément <style> avec les styles de base
        const style = document.createElement('style');
        style.id = 'retirement-calculator-fix-styles';
        style.textContent = `
            /* Styles de base pour les cartes */
            .card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
                transition: all 0.3s ease;
            }

            .recommendation-card {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 3px solid #0ea5e9;
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 20px;
                box-shadow: 0 4px 16px rgba(14, 165, 233, 0.2);
            }

            .chart-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
            }

            .result-card {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border: 2px solid #f59e0b;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
            }

            .bias-counter {
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 12px 16px;
                margin-bottom: 16px;
                font-size: 14px;
                color: #374151;
                font-weight: 500;
            }

            /* Styles pour les valeurs corrigées */
            .was-undefined {
                border-left: 3px solid #ef4444;
                background-color: #fef2f2 !important;
            }

            .age-undefined-fixed {
                color: #dc2626;
                font-style: italic;
            }

            /* Mode sombre */
            @media (prefers-color-scheme: dark) {
                .card, .chart-card {
                    background: #1f2937;
                    border-color: #374151;
                    color: #f3f4f6;
                }

                .recommendation-card {
                    background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%);
                    border-color: #3b82f6;
                    color: #e0f2fe;
                }

                .result-card {
                    background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
                    border-color: #f59e0b;
                    color: #fef3c7;
                }

                .bias-counter {
                    background: #374151;
                    border-color: #4b5563;
                    color: #d1d5db;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Styles CSS ajoutés');
    }

    /**
     * Observer les changements du DOM pour corriger les nouvelles valeurs undefined
     */
    function observeDOMChanges() {
        const observer = new MutationObserver(function(mutations) {
            let shouldFix = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.textContent && node.textContent.includes('undefined')) {
                            shouldFix = true;
                        }
                    });
                } else if (mutation.type === 'characterData') {
                    if (mutation.target.textContent && mutation.target.textContent.includes('undefined')) {
                        shouldFix = true;
                    }
                }
            });

            if (shouldFix) {
                // Délai pour éviter les appels trop fréquents
                setTimeout(fixUndefinedValues, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        console.log('✅ Observer DOM activé pour détecter les nouvelles valeurs undefined');
    }

    // Exposer une fonction globale pour forcer la correction
    window.fixRetirementCalculator = function() {
        fixUndefinedValues();
        ensureCardStyles();
        console.log('🔧 Correction manuelle appliquée');
    };

    console.log('✅ Script de correction du calculateur de retraite chargé');
})();





















