/**
 * Composant AnnouncementBar - Barre d'annonce dynamique alimentée par Gemini
 * Basé sur les exemples de l'article Elfsight
 */

const { useState, useEffect, useRef } = React;

const AnnouncementBar = ({
    type = 'news',
    section = 'top',
    isDarkMode = true,
    config = {},
    onClose = () => {}
}) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);
    const barRef = useRef(null);

    // Vérifier si la barre a été fermée (localStorage)
    useEffect(() => {
        const dismissedKey = `announcement-${type}-${section}-dismissed`;
        const dismissed = localStorage.getItem(dismissedKey);
        if (dismissed === 'true') {
            setIsDismissed(true);
            setIsVisible(false);
        }
    }, [type, section]);

    // Charger le contenu depuis l'API Gemini
    useEffect(() => {
        if (isDismissed) return;

        const loadContent = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/announcement-bars', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ type, section })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.content) {
                        setContent(data.content);
                    }
                }
            } catch (error) {
                console.error('Erreur chargement announcement bar:', error);
            } finally {
                setLoading(false);
            }
        };

        loadContent();
        
        // Rafraîchir toutes les 30 minutes
        const interval = setInterval(loadContent, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [type, section, isDismissed]);

    // Gérer la fermeture
    const handleClose = () => {
        setIsVisible(false);
        const dismissedKey = `announcement-${type}-${section}-dismissed`;
        localStorage.setItem(dismissedKey, 'true');
        onClose();
    };

    // Styles selon le type (basés sur l'article Elfsight)
    const getStyles = () => {
        const baseStyles = {
            news: {
                bg: isDarkMode ? 'bg-gradient-to-r from-blue-900/90 to-blue-800/90' : 'bg-gradient-to-r from-blue-50 to-blue-100',
                text: isDarkMode ? 'text-blue-100' : 'text-blue-900',
                border: isDarkMode ? 'border-blue-700' : 'border-blue-300'
            },
            update: {
                bg: isDarkMode ? 'bg-gradient-to-r from-emerald-900/90 to-emerald-800/90' : 'bg-gradient-to-r from-emerald-50 to-emerald-100',
                text: isDarkMode ? 'text-emerald-100' : 'text-emerald-900',
                border: isDarkMode ? 'border-emerald-700' : 'border-emerald-300'
            },
            event: {
                bg: isDarkMode ? 'bg-gradient-to-r from-purple-900/90 to-purple-800/90' : 'bg-gradient-to-r from-purple-50 to-purple-100',
                text: isDarkMode ? 'text-purple-100' : 'text-purple-900',
                border: isDarkMode ? 'border-purple-700' : 'border-purple-300'
            },
            'market-alert': {
                bg: isDarkMode ? 'bg-gradient-to-r from-red-900/90 to-orange-900/90' : 'bg-gradient-to-r from-red-50 to-orange-100',
                text: isDarkMode ? 'text-red-100' : 'text-red-900',
                border: isDarkMode ? 'border-red-700' : 'border-red-300'
            },
            promotion: {
                bg: isDarkMode ? 'bg-gradient-to-r from-yellow-900/90 to-amber-900/90' : 'bg-gradient-to-r from-yellow-50 to-amber-100',
                text: isDarkMode ? 'text-yellow-100' : 'text-yellow-900',
                border: isDarkMode ? 'border-yellow-700' : 'border-yellow-300'
            }
        };

        return baseStyles[type] || baseStyles.news;
    };

    const styles = getStyles();

    if (!isVisible || isDismissed || (!content && !loading)) {
        return null;
    }

    return (
        <div
            ref={barRef}
            className={`${styles.bg} ${styles.border} border-b backdrop-blur-sm transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
            }`}
            style={{
                zIndex: config.zIndex || 1000,
                position: section === 'top' ? 'sticky' : section === 'bottom' ? 'fixed' : 'relative',
                top: section === 'top' ? 0 : 'auto',
                bottom: section === 'bottom' ? 0 : 'auto',
                left: 0,
                right: 0
            }}
        >
            <div className="max-w-7xl mx-auto px-4 py-2.5">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span className={`${styles.text} text-sm`}>Chargement...</span>
                            </div>
                        ) : (
                            <span className={`${styles.text} text-sm font-medium truncate`}>
                                {content}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0 p-1 rounded`}
                        aria-label="Fermer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Exposer globalement
window.AnnouncementBar = AnnouncementBar;

