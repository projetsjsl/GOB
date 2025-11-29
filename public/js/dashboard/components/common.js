/**
 * Common Components for Dashboard
 * Contains shared UI components used across the dashboard
 */


// Note: IconoirIcon and ProfessionalModeSystem are defined globally in the HTML file
// and attached to window object. They should remain there for now due to dependencies.

/**
 * Icon Component - Wrapper for Iconoir icons
 * This is a placeholder - the actual implementation is in window.IconoirIcon
 * @param {string} name - Icon name
 * @param {string} className - CSS classes
 * @param {number} size - Icon size
 * @param {string} emoji - Emoji fallback
 */
// Destructure React hooks
const { useState, useEffect, useRef } = React;

/**
 * Icon Component - Wrapper for Iconoir icons
 * This is a placeholder - the actual implementation is in window.IconoirIcon
 * @param {string} name - Icon name
 * @param {string} className - CSS classes
 * @param {number} size - Icon size
 * @param {string} emoji - Emoji fallback
 */
const Icon = ({ name, className = "w-4 h-4", size, emoji }) => {
    if (window.IconoirIcon) {
        return window.IconoirIcon({ name, className });
    }

    // Fallback to emoji if Icon system not available
    if (emoji) {
        return <span className="inline-block">{emoji}</span>;
    }

    return <i className={`iconoir-${name} ${className}`}></i>;
};

/**
 * Loading Spinner Component
 */
const LoadingSpinner = ({ size = "medium", className = "" }) => {
    const sizeClasses = {
        small: "w-4 h-4",
        medium: "w-8 h-8",
        large: "w-12 h-12"
    };

    return (
        <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
            <Icon name="RefreshCw" />
        </div>
    );
};

/**
 * Error Message Component
 */
const ErrorMessage = ({ message, onDismiss, isDarkMode = true }) => {
    return (
        <div className={`p-4 rounded-lg border ${isDarkMode
                ? 'bg-red-900/20 border-red-700 text-red-200'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                    <Icon name="AlertTriangle" className="w-5 h-5 mt-0.5" />
                    <p className="text-sm">{message}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="ml-4 text-current opacity-70 hover:opacity-100"
                    >
                        <Icon name="X" className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Success Message Component
 */
const SuccessMessage = ({ message, onDismiss, isDarkMode = true }) => {
    return (
        <div className={`p-4 rounded-lg border ${isDarkMode
                ? 'bg-green-900/20 border-green-700 text-green-200'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                    <Icon name="CheckCircle" className="w-5 h-5 mt-0.5" />
                    <p className="text-sm">{message}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="ml-4 text-current opacity-70 hover:opacity-100"
                    >
                        <Icon name="X" className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Card Component
 */
const Card = ({ children, className = "", isDarkMode = true }) => {
    return (
        <div className={`rounded-lg border p-4 ${isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            } ${className}`}>
            {children}
        </div>
    );
};

/**
 * Button Component
 */
const Button = ({
    children,
    onClick,
    variant = "primary",
    size = "medium",
    disabled = false,
    className = "",
    isDarkMode = true
}) => {
    const baseClasses = "font-semibold rounded-lg transition-all duration-300";

    const sizeClasses = {
        small: "px-3 py-1.5 text-sm",
        medium: "px-4 py-2",
        large: "px-6 py-3 text-lg"
    };

    const variantClasses = {
        primary: isDarkMode
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white",
        secondary: isDarkMode
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-gray-900",
        danger: isDarkMode
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-red-500 hover:bg-red-600 text-white",
        success: isDarkMode
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-green-500 hover:bg-green-600 text-white",
        ghost: isDarkMode
            ? "bg-transparent hover:bg-gray-800 text-gray-300"
            : "bg-transparent hover:bg-gray-100 text-gray-700"
    };

    const disabledClasses = "opacity-50 cursor-not-allowed";

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                ${baseClasses}
                ${sizeClasses[size]}
                ${variantClasses[variant]}
                ${disabled ? disabledClasses : ''}
                ${className}
            `}
        >
            {children}
        </button>
    );
};

/**
 * Badge Component
 */
const Badge = ({
    children,
    variant = "default",
    className = "",
    isDarkMode = true
}) => {
    const variantClasses = {
        default: isDarkMode
            ? "bg-gray-700 text-gray-200"
            : "bg-gray-200 text-gray-800",
        success: isDarkMode
            ? "bg-green-900/50 text-green-200"
            : "bg-green-100 text-green-800",
        warning: isDarkMode
            ? "bg-yellow-900/50 text-yellow-200"
            : "bg-yellow-100 text-yellow-800",
        danger: isDarkMode
            ? "bg-red-900/50 text-red-200"
            : "bg-red-100 text-red-800",
        info: isDarkMode
            ? "bg-blue-900/50 text-blue-200"
            : "bg-blue-100 text-blue-800"
    };

    return (
        <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${variantClasses[variant]}
            ${className}
        `}>
            {children}
        </span>
    );
};

/**
 * Modal Component
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = "medium",
    isDarkMode = true
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        small: "max-w-md",
        medium: "max-w-2xl",
        large: "max-w-4xl",
        xl: "max-w-6xl"
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className={`
                w-full ${sizeClasses[size]} rounded-lg shadow-xl
                ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
            `}>
                {/* Header */}
                <div className={`
                    flex items-center justify-between p-4 border-b
                    ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                `}>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded hover:bg-opacity-10 ${isDarkMode ? 'hover:bg-white' : 'hover:bg-black'
                            }`}
                    >
                        <Icon name="X" className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className={`
                        flex items-center justify-end gap-2 p-4 border-t
                        ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                    `}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Tabs Component
 */
const Tabs = ({ tabs, activeTab, onTabChange, isDarkMode = true }) => {
    return (
        <div className="flex gap-2 border-b overflow-x-auto">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                        px-4 py-2 font-medium whitespace-nowrap transition-colors
                        ${activeTab === tab.id
                            ? isDarkMode
                                ? 'border-b-2 border-blue-500 text-blue-400'
                                : 'border-b-2 border-blue-600 text-blue-600'
                            : isDarkMode
                                ? 'text-gray-400 hover:text-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                        }
                    `}
                >
                    {tab.icon && <Icon name={tab.icon} className="w-4 h-4 inline mr-2" />}
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

/**
 * ExpandableComponent - Allows content to be expanded into a fullscreen modal
 */
const ExpandableComponent = ({ children, title = '', className = '', icon = '🔍', isDarkMode = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const contentRef = useRef(null);
    const modalRef = useRef(null);

    // Gérer la touche ESC pour fermer
    useEffect(() => {
        if (!isExpanded) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsExpanded(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isExpanded]);

    // Déplacer le contenu dans la modal au lieu de le cloner
    useEffect(() => {
        if (!isExpanded || !contentRef.current || !modalRef.current) return;

        const content = contentRef.current;
        const modalContent = modalRef.current.querySelector('.expandable-modal-content');

        if (modalContent && content) {
            // Déplacer le contenu dans la modal
            const originalParent = content.parentNode;
            const originalNextSibling = content.nextSibling;
            const originalDisplay = content.style.display;
            const originalHeight = content.style.height;

            modalContent.appendChild(content);
            content.style.display = 'block';

            // Agrandir les widgets TradingView dans la modal
            const tradingViewContainers = content.querySelectorAll('.tradingview-widget-container, [style*="height"]');
            tradingViewContainers.forEach(container => {
                const currentHeight = container.style.height || container.getAttribute('style');
                if (currentHeight && currentHeight.includes('px')) {
                    const heightValue = parseInt(currentHeight.match(/\d+/)?.[0] || '400');
                    // Augmenter la hauteur de 50% à 100% selon le contexte
                    const newHeight = Math.max(heightValue * 1.5, window.innerHeight * 0.7);
                    container.style.height = `${newHeight}px`;
                } else if (!currentHeight) {
                    // Si pas de hauteur définie, utiliser une hauteur généreuse
                    container.style.height = `${window.innerHeight * 0.7}px`;
                }
            });

            // Agrandir les canvas et autres éléments graphiques
            const canvasElements = content.querySelectorAll('canvas');
            canvasElements.forEach(canvas => {
                const parent = canvas.parentElement;
                if (parent && !parent.style.height) {
                    parent.style.height = `${window.innerHeight * 0.7}px`;
                }
            });

            return () => {
                // Restaurer le contenu à sa position originale
                if (originalNextSibling) {
                    originalParent.insertBefore(content, originalNextSibling);
                } else {
                    originalParent.appendChild(content);
                }
                content.style.display = originalDisplay;
                if (originalHeight) {
                    content.style.height = originalHeight;
                }
            };
        }
    }, [isExpanded]);

    return (
        <>
            <div className={`relative ${className}`}>
                {/* Bouton d'agrandissement */}
                <button
                    onClick={() => setIsExpanded(true)}
                    className={`absolute top-2 right-2 z-10 p-1.5 md:p-2 rounded-lg transition-all duration-200 hover:scale-110 ${isDarkMode
                            ? 'bg-gray-800/90 hover:bg-gray-700 text-white border border-gray-600 shadow-lg'
                            : 'bg-white/90 hover:bg-gray-100 text-gray-700 border border-gray-300 shadow-lg'
                        }`}
                    title="Agrandir dans une fenêtre"
                >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
                <div ref={contentRef}>
                    {children}
                </div>
            </div>

            {/* Modal fullscreen */}
            {isExpanded && (
                <div
                    ref={modalRef}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm"
                    onClick={() => setIsExpanded(false)}
                >
                    <div
                        className={`relative w-full h-full p-2 md:p-4 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header avec titre et bouton fermer - plus compact */}
                        <div className={`flex items-center justify-between mb-2 pb-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {icon} {title || 'Vue agrandie'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    ESC pour fermer
                                </span>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className={`p-1.5 rounded-lg transition-colors ${isDarkMode
                                            ? 'hover:bg-gray-800 text-white'
                                            : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                    title="Fermer (ESC)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Contenu agrandi - le contenu original sera déplacé ici */}
                        <div className="expandable-modal-content flex-1 overflow-auto min-h-0">
                            {/* Le contenu sera déplacé ici dynamiquement */}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Exposer les composants globalement
window.Icon = Icon;
window.LoadingSpinner = LoadingSpinner;
window.ErrorMessage = ErrorMessage;
window.SuccessMessage = SuccessMessage;
window.Card = Card;
window.Button = Button;
window.Badge = Badge;
window.Modal = Modal;
window.Tabs = Tabs;
window.ExpandableComponent = ExpandableComponent;
