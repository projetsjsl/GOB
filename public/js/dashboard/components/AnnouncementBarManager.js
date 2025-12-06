/**
 * Gestionnaire de barres d'annonces - Permet d'activer/désactiver et personnaliser les barres
 * Basé sur les exemples de l'article Elfsight
 */

const { useState, useEffect } = React;

const AnnouncementBarManager = ({ isDarkMode = true }) => {
    const [bars, setBars] = useState(() => {
        // Charger la configuration depuis localStorage
        try {
            const saved = localStorage.getItem('announcement-bars-config');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Erreur chargement config barres:', e);
        }
        
        // Configuration par défaut
        return {
            'news-top': { enabled: true, type: 'news', section: 'top', design: 'default' },
            'update-top': { enabled: false, type: 'update', section: 'top', design: 'default' },
            'event-top': { enabled: false, type: 'event', section: 'top', design: 'default' },
            'market-alert-top': { enabled: false, type: 'market-alert', section: 'top', design: 'default' },
            'promotion-top': { enabled: false, type: 'promotion', section: 'top', design: 'default' }
        };
    });

    // Sauvegarder la configuration
    useEffect(() => {
        try {
            localStorage.setItem('announcement-bars-config', JSON.stringify(bars));
        } catch (e) {
            console.warn('Erreur sauvegarde config barres:', e);
        }
    }, [bars]);

    const toggleBar = (key) => {
        setBars(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                enabled: !prev[key].enabled
            }
        }));
    };

    const updateBarDesign = (key, design) => {
        setBars(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                design
            }
        }));
    };

    // Rendre les barres actives
    return (
        <>
            {Object.entries(bars).map(([key, config]) => {
                if (!config.enabled) return null;
                
                return (
                    <AnnouncementBar
                        key={key}
                        type={config.type}
                        section={config.section}
                        isDarkMode={isDarkMode}
                        config={{ design: config.design, zIndex: 1000 + Object.keys(bars).indexOf(key) }}
                        onClose={() => {
                            // Réinitialiser le localStorage pour permettre de réafficher
                            const dismissedKey = `announcement-${config.type}-${config.section}-dismissed`;
                            localStorage.removeItem(dismissedKey);
                        }}
                    />
                );
            })}
        </>
    );
};

// Exposer la configuration pour l'admin
window.AnnouncementBarManager = AnnouncementBarManager;
window.getAnnouncementBarsConfig = () => {
    try {
        const saved = localStorage.getItem('announcement-bars-config');
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
};
window.setAnnouncementBarsConfig = (config) => {
    try {
        localStorage.setItem('announcement-bars-config', JSON.stringify(config));
        window.location.reload();
    } catch (e) {
        console.error('Erreur sauvegarde config:', e);
    }
};





