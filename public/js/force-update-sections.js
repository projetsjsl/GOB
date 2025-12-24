/**
 * Script pour forcer la mise à jour des sections qui ne s'actualisent pas
 * Déclenche les recalculs et force les re-renders
 */

(function() {
    'use strict';
    
    console.log('🔄 Forçage de la mise à jour des sections...');
    
    // 1. FORCER LE RE-RENDER REACT
    function forceReactUpdate() {
        // Chercher tous les composants React montés
        const reactRoots = [];
        
        // Méthode 1: Chercher les divs avec data-reactroot
        document.querySelectorAll('[data-reactroot], [data-react-checksum]').forEach(el => {
            const fiber = el._reactInternalInstance || el._reactInternalFiber;
            if (fiber) reactRoots.push(fiber);
        });
        
        // Méthode 2: Chercher via React DevTools
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
            if (hook.renderers && hook.renderers.size > 0) {
                hook.renderers.forEach((renderer, id) => {
                    const roots = renderer.findFiberByHostInstance ? 
                        Object.values(renderer.findFiberByHostInstance(document.body)) : [];
                    reactRoots.push(...roots);
                });
            }
        }
        
        // Méthode 3: Déclencher un événement personnalisé pour forcer le re-render
        const event = new CustomEvent('forceUpdate', { bubbles: true });
        document.body.dispatchEvent(event);
        
        // Méthode 4: Modifier un attribut data pour forcer le re-render
        document.body.setAttribute('data-force-update', Date.now().toString());
        
        console.log(`✅ ${reactRoots.length} composant(s) React trouvé(s)`);
    }
    
    // 2. DÉCLENCHER LES RECALCULS
    function triggerRecalculations() {
        // Chercher tous les inputs qui pourraient déclencher des calculs
        const inputs = document.querySelectorAll('input[type="number"], input[type="text"], select');
        
        inputs.forEach(input => {
            // Déclencher les événements de changement
            const events = ['input', 'change', 'blur'];
            events.forEach(eventType => {
                const event = new Event(eventType, { bubbles: true, cancelable: true });
                input.dispatchEvent(event);
            });
        });
        
        console.log(`✅ ${inputs.length} input(s) déclenché(s)`);
    }
    
    // 3. FORCER LA MISE À JOUR DES SECTIONS SPÉCIFIQUES
    function updateSpecificSections() {
        const sections = [
            '.card',
            '.recommendation-card',
            '.chart-card',
            '.result-card',
            '[class*="card"]',
            '[id*="recommendation"]',
            '[id*="result"]',
            '[id*="score"]',
            '[id*="age"]',
            '[id*="indifférence"]'
        ];
        
        sections.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Forcer le re-render en modifiant un attribut
                el.setAttribute('data-last-update', Date.now().toString());
                
                // Déclencher un événement de mise à jour
                const event = new CustomEvent('sectionUpdate', { bubbles: true });
                el.dispatchEvent(event);
                
                // Si c'est un élément React, essayer de forcer le re-render
                if (el._reactInternalInstance || el._reactInternalFiber) {
                    // Déclencher un changement de style pour forcer le re-render
                    const originalDisplay = el.style.display;
                    el.style.display = 'none';
                    // Force reflow
                    void el.offsetHeight;
                    el.style.display = originalDisplay || '';
                }
            });
        });
        
        console.log(`✅ Sections mises à jour`);
    }
    
    // 4. OBSERVER ET RECALCULER AUTOMATIQUEMENT
    function setupAutoRecalculation() {
        // Observer les changements d'inputs
        const observer = new MutationObserver(function(mutations) {
            let shouldRecalculate = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'value' || 
                     mutation.attributeName === 'checked' ||
                     mutation.attributeName === 'selected')) {
                    shouldRecalculate = true;
                }
                
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && 
                            (node.tagName === 'INPUT' || 
                             node.tagName === 'SELECT' || 
                             node.tagName === 'TEXTAREA')) {
                            shouldRecalculate = true;
                        }
                    });
                }
            });
            
            if (shouldRecalculate) {
                setTimeout(() => {
                    triggerRecalculations();
                    updateSpecificSections();
                }, 100);
            }
        });
        
        // Observer tous les inputs et les sections
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            observer.observe(input, {
                attributes: true,
                attributeFilter: ['value', 'checked', 'selected']
            });
        });
        
        // Observer les sections
        const sections = document.querySelectorAll('.card, .recommendation-card, .chart-card, .result-card');
        sections.forEach(section => {
            observer.observe(section, {
                childList: true,
                subtree: true,
                characterData: true
            });
        });
        
        console.log('✅ Observer de recalcul activé');
    }
    
    // 5. FORCER LE RECALCUL DES VALEURS
    function recalculateValues() {
        // Chercher toutes les fonctions de calcul dans le scope global
        const calculationFunctions = [
            'calculateRecommendation',
            'calculateScore',
            'calculateAge',
            'calculateAmount',
            'recalculate',
            'updateCalculations',
            'refreshCalculations'
        ];
        
        calculationFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                try {
                    window[funcName]();
                    console.log(`✅ Fonction ${funcName}() appelée`);
                } catch (e) {
                    console.warn(`⚠️ Erreur lors de l'appel de ${funcName}:`, e);
                }
            }
        });
        
        // Chercher les fonctions dans les composants React
        if (window.React && window.ReactDOM) {
            // Essayer de trouver les composants et déclencher leurs recalculs
            const reactElements = document.querySelectorAll('[data-reactroot]');
            reactElements.forEach(el => {
                const event = new CustomEvent('recalculate', { bubbles: true });
                el.dispatchEvent(event);
            });
        }
    }
    
    // 6. FORCER LA MISE À JOUR VISUELLE
    function forceVisualUpdate() {
        // Forcer le reflow pour mettre à jour l'affichage
        const cards = document.querySelectorAll('.card, .recommendation-card, .chart-card, .result-card');
        cards.forEach(card => {
            // Technique de force reflow
            void card.offsetHeight;
            
            // Changer temporairement la classe pour forcer le re-render
            card.classList.add('force-update');
            setTimeout(() => {
                card.classList.remove('force-update');
            }, 10);
        });
        
        console.log(`✅ ${cards.length} carte(s) mise(s) à jour visuellement`);
    }
    
    // EXÉCUTER TOUTES LES CORRECTIONS
    console.log('🔄 Démarrage des mises à jour...');
    
    forceReactUpdate();
    triggerRecalculations();
    updateSpecificSections();
    recalculateValues();
    forceVisualUpdate();
    setupAutoRecalculation();
    
    // Exposer une fonction globale pour forcer la mise à jour manuellement
    window.forceUpdateSections = function() {
        console.log('🔄 Mise à jour manuelle déclenchée...');
        forceReactUpdate();
        triggerRecalculations();
        updateSpecificSections();
        recalculateValues();
        forceVisualUpdate();
        console.log('✅ Mise à jour manuelle terminée');
    };
    
    // Auto-refresh toutes les 2 secondes pendant 10 secondes
    let refreshCount = 0;
    const autoRefresh = setInterval(() => {
        if (refreshCount < 5) {
            triggerRecalculations();
            updateSpecificSections();
            forceVisualUpdate();
            refreshCount++;
        } else {
            clearInterval(autoRefresh);
        }
    }, 2000);
    
    console.log('✅ Script de mise à jour chargé');
    console.log('💡 Utilisez window.forceUpdateSections() pour forcer une mise à jour manuelle');
    
    return {
        forceUpdate: window.forceUpdateSections,
        triggerRecalculations,
        updateSpecificSections,
        recalculateValues
    };
})();
























