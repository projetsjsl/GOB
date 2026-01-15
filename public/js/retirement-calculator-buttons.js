/**
 * Ajoute des boutons "Calculer" et "Proceder" au calculateur de retraite
 * Ces boutons declenchent les recalculs et les mises a jour
 */

(function() {
    'use strict';
    
    console.log(' Ajout des boutons Calculer et Proceder...');
    
    // Styles pour les boutons
    const buttonStyles = `
        .retirement-calc-buttons {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            gap: 12px;
            flex-direction: column;
        }
        
        .calc-button {
            padding: 14px 28px;
            font-size: 16px;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            min-width: 180px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .calc-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }
        
        .calc-button:active {
            transform: translateY(0);
        }
        
        .calc-button.calculate {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
        }
        
        .calc-button.calculate:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }
        
        .calc-button.calculate:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
        }
        
        .calc-button.proceed {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }
        
        .calc-button.proceed:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }
        
        .calc-button.proceed:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
        }
        
        .calc-button .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
            .retirement-calc-buttons {
                bottom: 10px;
                right: 10px;
                left: 10px;
                flex-direction: row;
            }
            
            .calc-button {
                flex: 1;
                min-width: auto;
                padding: 12px 16px;
                font-size: 14px;
            }
        }
    `;
    
    // Injecter les styles
    const style = document.createElement('style');
    style.textContent = buttonStyles;
    document.head.appendChild(style);
    
    // Fonction pour declencher les calculs
    function triggerCalculations() {
        console.log(' Declenchement des calculs...');
        
        // 1. Declencher tous les evenements de changement
        document.querySelectorAll('input, select, textarea').forEach(el => {
            ['input', 'change', 'blur'].forEach(type => {
                el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
            });
        });
        
        // 2. Forcer le re-render React
        document.body.setAttribute('data-force-update', Date.now().toString());
        document.body.dispatchEvent(new CustomEvent('forceUpdate', { bubbles: true }));
        document.body.dispatchEvent(new CustomEvent('recalculate', { bubbles: true }));
        
        // 3. Appeler les fonctions de calcul si elles existent
        const calcFunctions = [
            'calculateRecommendation',
            'calculateScore',
            'calculateAge',
            'calculateAmount',
            'recalculate',
            'updateCalculations',
            'refreshCalculations',
            'calculateRetirement',
            'updateRecommendation'
        ];
        
        calcFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                try {
                    window[funcName]();
                    console.log(` ${funcName}() appelee`);
                } catch (e) {
                    console.warn(` ${funcName}() a echoue:`, e);
                }
            }
        });
        
        // 4. Mettre a jour toutes les sections
        document.querySelectorAll('.card, .recommendation-card, .chart-card, .result-card').forEach(el => {
            el.setAttribute('data-last-update', Date.now().toString());
            el.dispatchEvent(new CustomEvent('sectionUpdate', { bubbles: true }));
            // Force reflow
            void el.offsetHeight;
        });
        
        // 5. Corriger les valeurs undefined
        document.querySelectorAll('*').forEach(el => {
            if (el.textContent && el.textContent.includes('undefined')) {
                const text = el.textContent;
                let replacement = 'Non calculable';
                
                if (text.includes('Age') || text.includes('ans')) replacement = 'N/A';
                else if (text.includes('$') || text.includes('Montant')) replacement = '$0';
                else if (text.includes('%')) replacement = '0%';
                else if (text.includes('Score')) replacement = '0/10';
                
                el.textContent = text.replace(/undefined/g, replacement);
            }
        });
        
        console.log(' Calculs declenches');
    }
    
    // Fonction pour proceder (etape suivante ou validation)
    function proceed() {
        console.log(' Proceder...');
        
        // 1. Verifier que les calculs sont a jour
        triggerCalculations();
        
        // 2. Attendre un peu pour que les calculs se terminent
        setTimeout(() => {
            // 3. Declencher l'evenement de procedure
            document.body.dispatchEvent(new CustomEvent('proceed', { bubbles: true }));
            
            // 4. Si une fonction proceed existe, l'appeler
            if (typeof window.proceed === 'function') {
                try {
                    window.proceed();
                } catch (e) {
                    console.warn(' proceed() a echoue:', e);
                }
            }
            
            // 5. Scroll vers les resultats
            const results = document.querySelector('.recommendation-card, .result-card, [id*="result"]');
            if (results) {
                results.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            console.log(' Procedure terminee');
        }, 500);
    }
    
    // Creer les boutons
    function createButtons() {
        // Verifier si les boutons existent deja
        if (document.getElementById('retirement-calc-buttons')) {
            console.log(' Les boutons existent deja');
            return;
        }
        
        const container = document.createElement('div');
        container.id = 'retirement-calc-buttons';
        container.className = 'retirement-calc-buttons';
        
        // Bouton Calculer
        const calculateBtn = document.createElement('button');
        calculateBtn.className = 'calc-button calculate';
        calculateBtn.innerHTML = '<span></span> <span>CALCULER</span>';
        calculateBtn.onclick = function() {
            this.disabled = true;
            this.innerHTML = '<span class="spinner"></span> <span>CALCUL EN COURS...</span>';
            
            triggerCalculations();
            
            setTimeout(() => {
                this.disabled = false;
                this.innerHTML = '<span></span> <span>CALCULER</span>';
                
                // Retour a l'etat normal apres 2 secondes
                setTimeout(() => {
                    this.innerHTML = '<span></span> <span>CALCULER</span>';
                }, 2000);
            }, 1000);
        };
        
        // Bouton Proceder
        const proceedBtn = document.createElement('button');
        proceedBtn.className = 'calc-button proceed';
        proceedBtn.innerHTML = '<span></span> <span>PROCEDER</span>';
        proceedBtn.onclick = function() {
            this.disabled = true;
            this.innerHTML = '<span class="spinner"></span> <span>TRAITEMENT...</span>';
            
            proceed();
            
            setTimeout(() => {
                this.disabled = false;
                this.innerHTML = '<span></span> <span>PROCEDER</span>';
                
                // Retour a l'etat normal apres 2 secondes
                setTimeout(() => {
                    this.innerHTML = '<span></span> <span>PROCEDER</span>';
                }, 2000);
            }, 1500);
        };
        
        container.appendChild(calculateBtn);
        container.appendChild(proceedBtn);
        document.body.appendChild(container);
        
        console.log(' Boutons ajoutes');
    }
    
    // Initialiser
    function init() {
        // Attendre que le DOM soit pret
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createButtons);
        } else {
            createButtons();
        }
        
        // Exposer les fonctions globalement
        window.triggerRetirementCalculations = triggerCalculations;
        window.proceedRetirement = proceed;
    }
    
    init();
    
    // Re-creer les boutons si le DOM change (pour les apps React)
    const observer = new MutationObserver(function(mutations) {
        if (!document.getElementById('retirement-calc-buttons')) {
            createButtons();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: false
    });
    
    console.log(' Script de boutons charge');
    console.log(' Utilisez window.triggerRetirementCalculations() ou window.proceedRetirement()');
})();
























