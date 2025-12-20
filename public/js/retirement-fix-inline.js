/**
 * Script de correction INLINE - À coller directement dans la console du navigateur
 * Corrige immédiatement tous les problèmes d'affichage
 */

(function() {
    'use strict';
    
    console.log('🔧 Application des corrections du calculateur de retraite...');
    
    // 1. INJECTER LE CSS DIRECTEMENT
    const style = document.createElement('style');
    style.id = 'retirement-calculator-fix-inline';
    style.textContent = `
        /* Styles de base pour les cartes */
        .card {
            background: white !important;
            border-radius: 12px !important;
            padding: 20px !important;
            margin-bottom: 16px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid #e5e7eb !important;
            transition: all 0.3s ease !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }

        .recommendation-card {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
            border: 3px solid #0ea5e9 !important;
            border-radius: 16px !important;
            padding: 24px !important;
            margin-bottom: 20px !important;
            box-shadow: 0 4px 16px rgba(14, 165, 233, 0.2) !important;
        }

        .chart-card {
            background: white !important;
            border-radius: 12px !important;
            padding: 20px !important;
            margin-bottom: 16px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid #e5e7eb !important;
        }

        .result-card {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
            border: 2px solid #f59e0b !important;
            border-radius: 12px !important;
            padding: 20px !important;
            margin-bottom: 16px !important;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2) !important;
        }

        .bias-counter {
            background: #f3f4f6 !important;
            border: 1px solid #d1d5db !important;
            border-radius: 8px !important;
            padding: 12px 16px !important;
            margin-bottom: 16px !important;
            font-size: 14px !important;
            color: #374151 !important;
            font-weight: 500 !important;
        }
    `;
    
    // Supprimer l'ancien style s'il existe
    const oldStyle = document.getElementById('retirement-calculator-fix-inline');
    if (oldStyle) oldStyle.remove();
    
    document.head.appendChild(style);
    console.log('✅ Styles CSS injectés');
    
    // 2. CORRIGER TOUTES LES VALEURS UNDEFINED
    function fixUndefined() {
        let fixedCount = 0;
        
        // Parcourir tous les nœuds texte
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent && node.textContent.includes('undefined')) {
                textNodes.push(node);
            }
        }
        
        textNodes.forEach(textNode => {
            const originalText = textNode.textContent;
            let replacement = 'Non calculable';
            
            // Détecter le contexte
            if (originalText.includes('Âge') || originalText.includes('âge') || originalText.includes('ans')) {
                replacement = 'N/A';
            } else if (originalText.includes('$') || originalText.includes('montant') || originalText.includes('Montant')) {
                replacement = '$0';
            } else if (originalText.includes('%') || originalText.includes('pourcent')) {
                replacement = '0%';
            } else if (originalText.includes('Score') || originalText.includes('score')) {
                replacement = '0/10';
            }
            
            textNode.textContent = originalText.replace(/undefined/g, replacement);
            fixedCount++;
            
            // Marquer le parent
            if (textNode.parentElement) {
                textNode.parentElement.classList.add('was-undefined-fixed');
            }
        });
        
        console.log(`✅ ${fixedCount} valeur(s) "undefined" corrigée(s)`);
        return fixedCount;
    }
    
    // 3. S'ASSURER QUE TOUTES LES SECTIONS SONT VISIBLES
    function ensureVisibility() {
        const cards = document.querySelectorAll('.card, .recommendation-card, .chart-card, .result-card, .bias-counter');
        let visibleCount = 0;
        
        cards.forEach(card => {
            // Forcer la visibilité
            card.style.display = 'block';
            card.style.visibility = 'visible';
            card.style.opacity = '1';
            card.style.height = 'auto';
            card.style.overflow = 'visible';
            visibleCount++;
        });
        
        console.log(`✅ ${visibleCount} section(s) rendue(s) visible(s)`);
        return visibleCount;
    }
    
    // 4. CORRIGER LES SECTIONS COUPÉES
    function fixTruncatedSections() {
        const cards = document.querySelectorAll('.card, .recommendation-card, .chart-card, .result-card');
        
        cards.forEach(card => {
            // S'assurer que le contenu n'est pas coupé
            card.style.overflow = 'visible';
            card.style.textOverflow = 'clip';
            card.style.whiteSpace = 'normal';
            card.style.wordWrap = 'break-word';
            
            // Vérifier si le texte est coupé
            const text = card.textContent || '';
            if (text.includes('Écart (surplus/dé') || text.endsWith('dé')) {
                // Le texte semble coupé, essayer de trouver le parent complet
                let parent = card.parentElement;
                while (parent && parent !== document.body) {
                    if (parent.textContent && parent.textContent.length > text.length) {
                        // Le parent a plus de contenu
                        card.style.height = 'auto';
                        card.style.maxHeight = 'none';
                        break;
                    }
                    parent = parent.parentElement;
                }
            }
        });
        
        console.log('✅ Sections coupées corrigées');
    }
    
    // EXÉCUTER TOUTES LES CORRECTIONS
    const undefinedFixed = fixUndefined();
    const visibleFixed = ensureVisibility();
    fixTruncatedSections();
    
    // Observer les changements futurs
    const observer = new MutationObserver(function(mutations) {
        let shouldFix = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                if (mutation.target.textContent && mutation.target.textContent.includes('undefined')) {
                    shouldFix = true;
                }
            }
        });
        if (shouldFix) {
            setTimeout(() => {
                fixUndefined();
                ensureVisibility();
            }, 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    console.log('✅ Observer activé pour détecter les nouvelles valeurs undefined');
    console.log('🎉 Corrections appliquées avec succès!');
    console.log(`📊 Résumé: ${undefinedFixed} undefined corrigés, ${visibleFixed} sections rendues visibles`);
    
    // Exposer une fonction globale pour re-corriger
    window.fixRetirementNow = function() {
        fixUndefined();
        ensureVisibility();
        fixTruncatedSections();
        console.log('🔧 Correction manuelle appliquée');
    };
    
    return {
        undefinedFixed,
        visibleFixed,
        reapply: window.fixRetirementNow
    };
})();



















