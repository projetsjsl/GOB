/**
 * Toast Notification Manager
 * Provides global, beautiful, glassmorphic toast notifications.
 * Usage: window.Toast.show(message, type, duration)
 * Types: 'success', 'error', 'info', 'warning'
 */

class ToastManager {
    constructor() {
        this.container = null;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // Create container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            // BUG #A3 FIX: Toast positionné pour ne pas couvrir la navigation (z-index inférieur à nav)
            this.container.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 9998;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
                max-width: 400px;
            `;
            if (document.body) {
                document.body.appendChild(this.container);
            } else {
                // Fallback should not happen due to DOMContentLoaded check, but safety first
                console.warn('ToastManager: document.body not ready');
            }
        } else {
            this.container = document.getElementById('toast-container');
        }

        // Inject Styles
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast-item {
                    min-width: 300px;
                    max-width: 400px;
                    padding: 16px 20px;
                    border-radius: 16px;
                    background: rgba(18, 18, 18, 0.85);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    color: white;
                    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    transform: translateX(100%);
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    pointer-events: auto;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .toast-item.show {
                    transform: translateX(0);
                    opacity: 1;
                }

                .toast-item.hide {
                    transform: translateX(120%);
                    opacity: 0;
                }

                .toast-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }

                .toast-content {
                    flex-grow: 1;
                }

                .toast-title {
                    font-weight: 600;
                    margin-bottom: 2px;
                    display: block;
                }

                .toast-message {
                    color: #9ca3af;
                    font-size: 13px;
                }

                /* Variants */
                .toast-success { border-left: 4px solid #10b981; }
                .toast-success .toast-icon { color: #10b981; }

                .toast-error { border-left: 4px solid #ef4444; }
                .toast-error .toast-icon { color: #ef4444; }

                .toast-warning { border-left: 4px solid #f59e0b; }
                .toast-warning .toast-icon { color: #f59e0b; }

                .toast-info { border-left: 4px solid #3b82f6; }
                .toast-info .toast-icon { color: #3b82f6; }
                
                .toast-gold { border-left: 4px solid #d08f23; }
                .toast-gold .toast-icon { color: #d08f23; }
            `;
            if (document.head) {
                document.head.appendChild(style);
            }
        }
    }

    show(message, type = 'info', title = '', duration = 4000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        
        // Icon mapping
        const icons = {
            success: '✓', // Or iconoir class if font is loaded
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            gold: '★'
        };

        // If iconoir is loaded, use classes
        const iconHTML = document.querySelector('link[href*="iconoir"]') 
            ? `<i class="toast-icon iconoir-${this.getIconName(type)}"></i>`
            : `<span class="toast-icon">${icons[type] || 'ℹ'}</span>`;

        toast.innerHTML = `
            ${iconHTML}
            <div class="toast-content">
                ${title ? `<span class="toast-title">${title}</span>` : ''}
                <span class="toast-message">${message}</span>
            </div>
        `;

        if (this.container) {
            this.container.appendChild(toast);
            
            // Animate in
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });

            // Auto dismiss
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        } else {
            console.warn('Toast container not initialized');
        }
    }

    dismiss(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 500); // Wait for transition
    }

    getIconName(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'warning-circle';
            case 'warning': return 'warning-triangle';
            case 'gold': return 'star-solid';
            default: return 'info-circle';
        }
    }
}

// Expose global instance
window.Toast = new ToastManager();

// Test method
window.testToast = () => {
    window.Toast.show('Données sauvegardées avec succès', 'success', 'Succès');
    setTimeout(() => window.Toast.show('Erreur de connexion au serveur', 'error', 'Erreur'), 1000);
    setTimeout(() => window.Toast.show('Mise à jour disponible', 'info', 'Info'), 2000);
};
