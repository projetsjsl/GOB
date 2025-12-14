/**
 * Auto Expand Initializer v2.0
 * 
 * Ajoute automatiquement des boutons d'expansion fullscreen à TOUTES les sections,
 * divs, tableaux, composants et widgets du dashboard.
 */

(function initAutoExpand() {
    'use strict';

    // Configuration étendue des sélecteurs pour TOUS les types d'éléments
    const EXPANDABLE_SELECTORS = [
        // Sections avec bordures
        '.border.rounded-lg',
        '.border.rounded-xl',
        '.border.rounded-md',
        '.border.rounded',
        '[class*="rounded"][class*="border"]',
        
        // Backgrounds avec bordures
        '[class*="bg-neutral-900"][class*="border"]',
        '[class*="bg-neutral-800"][class*="border"]',
        '[class*="bg-gray-900"][class*="border"]',
        '[class*="bg-gray-800"][class*="border"]',
        '[class*="bg-white"][class*="border"]',
        '[class*="bg-slate"][class*="border"]',
        
        // Cards et panels
        '[class*="card"]',
        '[class*="panel"]',
        '[class*="box"]',
        '[class*="container"][class*="border"]',
        
        // Widgets TradingView et autres
        '.tradingview-widget-container',
        '[class*="widget-container"]',
        '[class*="chart-container"]',
        '[class*="graph-container"]',
        
        // Tableaux
        'table',
        '.table-container',
        '[class*="table-wrapper"]',
        'div:has(> table)',
        
        // Sections spécifiques
        '[class*="section"]',
        '[class*="module"]',
        '[class*="block"]',
        
        // Grids et layouts
        '.grid > div',
        '[class*="grid-item"]',
        
        // Iframes
        'iframe',
        '[class*="iframe-container"]',
        
        // Composants avec padding significatif
        '[class*="p-4"]',
        '[class*="p-5"]',
        '[class*="p-6"]',
        
        // Éléments avec shadow
        '[class*="shadow"]'
    ];

    // Taille minimum pour considérer un élément comme expandable
    const MIN_WIDTH = 150;
    const MIN_HEIGHT = 80;

    // Classes/éléments à exclure
    const EXCLUDE_PATTERNS = [
        'expand-btn', 'modal', 'tooltip', 'dropdown', 'menu', 'popup',
        'nav', 'header', 'footer', 'sidebar', 'button', 'btn', 'input',
        'select', 'textarea', 'label', 'icon', 'badge', 'tag', 'chip',
        'fullscreen-modal', 'fullscreen-content', 'backdrop'
    ];

    // Vérifier si un élément doit avoir un bouton d'expansion
    function shouldBeExpandable(element) {
        // Ignorer les éléments sans taille
        const rect = element.getBoundingClientRect();
        if (rect.width < MIN_WIDTH || rect.height < MIN_HEIGHT) return false;

        // Ignorer les éléments cachés
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;

        // Vérifier les exclusions
        const classList = element.className || '';
        const classStr = typeof classList === 'string' ? classList : classList.toString();
        if (EXCLUDE_PATTERNS.some(p => classStr.toLowerCase().includes(p))) return false;

        // Exclure les éléments déjà traités
        if (element.dataset.expandable === 'true') return false;
        if (element.querySelector('.expand-btn')) return false;

        // Exclure si un parent proche a déjà le bouton
        let parent = element.parentElement;
        let depth = 0;
        while (parent && depth < 3) {
            if (parent.dataset.expandable === 'true') return false;
            parent = parent.parentElement;
            depth++;
        }

        return true;
    }

    // Créer le bouton d'expansion
    function createExpandButton() {
        const btn = document.createElement('button');
        btn.className = 'expand-btn';
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
        `;
        btn.title = 'Agrandir en plein écran (ESC pour fermer)';
        return btn;
    }

    // Extraire un titre depuis l'élément
    function extractTitle(element) {
        // Chercher un titre dans les enfants
        const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="heading"]');
        for (const h of headings) {
            const text = h.textContent?.trim();
            if (text && text.length > 2 && text.length < 100) return text;
        }
        
        // Chercher dans les attributs
        if (element.title) return element.title;
        if (element.getAttribute('aria-label')) return element.getAttribute('aria-label');
        
        return 'Vue agrandie';
    }

    // Ouvrir en plein écran
    function openFullscreen(element) {
        const title = extractTitle(element);
        const isDark = document.body.classList.contains('dark') || 
                       document.documentElement.classList.contains('dark') ||
                       element.closest('[class*="bg-neutral-9"]') ||
                       element.closest('[class*="bg-gray-9"]') ||
                       element.closest('[class*="bg-black"]');

        const modal = document.createElement('div');
        modal.className = 'fullscreen-modal' + (isDark ? ' dark' : '');
        modal.innerHTML = `
            <div class="fullscreen-content">
                <div class="fullscreen-header">
                    <span class="fullscreen-title">${title}</span>
                    <div class="fullscreen-actions">
                        <span class="fullscreen-hint">ESC pour fermer</span>
                        <button class="fullscreen-close" title="Fermer">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="fullscreen-body"></div>
            </div>
        `;

        const body = modal.querySelector('.fullscreen-body');
        const clone = element.cloneNode(true);
        
        // Supprimer le bouton expand du clone
        const cloneBtn = clone.querySelector('.expand-btn');
        if (cloneBtn) cloneBtn.remove();
        
        // Ajuster les styles pour le fullscreen
        clone.style.width = '100%';
        clone.style.height = '100%';
        clone.style.maxWidth = 'none';
        clone.style.maxHeight = 'none';
        clone.style.margin = '0';
        clone.style.overflow = 'auto';
        
        body.appendChild(clone);

        // Fermeture
        const closeModal = () => {
            modal.classList.add('closing');
            setTimeout(() => modal.remove(), 200);
            document.body.style.overflow = '';
        };

        modal.querySelector('.fullscreen-close').onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);

        document.body.style.overflow = 'hidden';
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('open'));
    }

    // Appliquer les boutons d'expansion à tous les éléments
    function applyExpandButtons() {
        let count = 0;
        
        EXPANDABLE_SELECTORS.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(element => {
                    if (shouldBeExpandable(element)) {
                        element.dataset.expandable = 'true';
                        
                        // Assurer le positionnement relatif
                        const style = window.getComputedStyle(element);
                        if (style.position === 'static') {
                            element.style.position = 'relative';
                        }

                        const btn = createExpandButton();
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            openFullscreen(element);
                        };
                        element.appendChild(btn);
                        count++;
                    }
                });
            } catch (e) {
                // Ignorer les erreurs de sélecteur invalide
            }
        });
        
        if (count > 0) {
            console.log(`✅ Auto-Expand: ${count} boutons ajoutés`);
        }
    }

    // Injecter les styles CSS
    function injectStyles() {
        if (document.getElementById('auto-expand-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'auto-expand-styles';
        styles.textContent = `
            /* Bouton d'expansion */
            .expand-btn {
                position: absolute !important;
                top: 4px !important;
                right: 4px !important;
                z-index: 50 !important;
                padding: 5px !important;
                border-radius: 6px !important;
                background: rgba(255, 255, 255, 0.95) !important;
                border: 1px solid rgba(0, 0, 0, 0.15) !important;
                color: #555 !important;
                cursor: pointer !important;
                opacity: 0.6 !important;
                transition: all 0.2s ease !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                line-height: 1 !important;
            }
            
            .expand-btn:hover {
                opacity: 1 !important;
                transform: scale(1.15) !important;
                background: white !important;
                color: #000 !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
            }

            /* Dark mode pour le bouton */
            .dark .expand-btn,
            [class*="bg-neutral-9"] .expand-btn,
            [class*="bg-gray-9"] .expand-btn,
            [class*="bg-black"] .expand-btn,
            [class*="bg-slate-9"] .expand-btn {
                background: rgba(55, 65, 81, 0.95) !important;
                border-color: rgba(75, 85, 99, 0.6) !important;
                color: #9CA3AF !important;
            }

            .dark .expand-btn:hover,
            [class*="bg-neutral-9"] .expand-btn:hover,
            [class*="bg-gray-9"] .expand-btn:hover,
            [class*="bg-black"] .expand-btn:hover,
            [class*="bg-slate-9"] .expand-btn:hover {
                background: rgb(55, 65, 81) !important;
                color: white !important;
            }

            /* Modal fullscreen */
            .fullscreen-modal {
                position: fixed !important;
                inset: 0 !important;
                z-index: 99999 !important;
                background: rgba(0, 0, 0, 0.95) !important;
                backdrop-filter: blur(8px) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .fullscreen-modal.open {
                opacity: 1;
            }

            .fullscreen-modal.closing {
                opacity: 0;
            }

            .fullscreen-content {
                width: 100% !important;
                height: 100% !important;
                background: white !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
            }

            .fullscreen-modal.dark .fullscreen-content {
                background: #0f172a !important;
                color: white !important;
            }

            .fullscreen-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 12px 20px !important;
                border-bottom: 1px solid #e5e7eb !important;
                flex-shrink: 0 !important;
            }

            .fullscreen-modal.dark .fullscreen-header {
                border-color: #334155 !important;
            }

            .fullscreen-title {
                font-size: 18px !important;
                font-weight: 600 !important;
                color: #111827 !important;
            }

            .fullscreen-modal.dark .fullscreen-title {
                color: white !important;
            }

            .fullscreen-actions {
                display: flex !important;
                align-items: center !important;
                gap: 16px !important;
            }

            .fullscreen-hint {
                font-size: 12px !important;
                color: #6b7280 !important;
            }

            .fullscreen-modal.dark .fullscreen-hint {
                color: #9ca3af !important;
            }

            .fullscreen-close {
                padding: 8px !important;
                border-radius: 8px !important;
                background: transparent !important;
                border: none !important;
                color: #6b7280 !important;
                cursor: pointer !important;
                transition: all 0.2s !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            .fullscreen-close:hover {
                background: #f3f4f6 !important;
                color: #111827 !important;
            }

            .fullscreen-modal.dark .fullscreen-close:hover {
                background: #334155 !important;
                color: white !important;
            }

            .fullscreen-body {
                flex: 1 !important;
                overflow: auto !important;
                padding: 20px !important;
                min-height: 0 !important;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .expand-btn {
                    padding: 4px !important;
                }
                .expand-btn svg {
                    width: 12px !important;
                    height: 12px !important;
                }
                .fullscreen-header {
                    padding: 10px 12px !important;
                }
                .fullscreen-hint {
                    display: none !important;
                }
                .fullscreen-body {
                    padding: 12px !important;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Observer les changements du DOM
    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && !node.classList?.contains('expand-btn') && 
                            !node.classList?.contains('fullscreen-modal')) {
                            shouldUpdate = true;
                            break;
                        }
                    }
                }
                if (shouldUpdate) break;
            }
            if (shouldUpdate) {
                setTimeout(applyExpandButtons, 300);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialisation
    function init() {
        console.log('🚀 Auto-Expand v2.0: Initialisation...');
        injectStyles();
        
        const runInit = () => {
            setTimeout(applyExpandButtons, 500);
            setTimeout(applyExpandButtons, 1500);
            setTimeout(applyExpandButtons, 3000);
            observeDOM();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runInit);
        } else {
            runInit();
        }

        // Réappliquer régulièrement pour les contenus dynamiques
        setInterval(applyExpandButtons, 8000);
    }

    // Exposer méthode de refresh manuel
    window.refreshExpandButtons = applyExpandButtons;
    window.forceExpandAll = () => {
        document.querySelectorAll('[data-expandable]').forEach(el => {
            delete el.dataset.expandable;
            const btn = el.querySelector('.expand-btn');
            if (btn) btn.remove();
        });
        applyExpandButtons();
    };

    init();
})();
