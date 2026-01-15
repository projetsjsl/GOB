/**
 * Gestionnaire de barres d'annonces - Permet d'activer/desactiver et personnaliser les barres
 * Base sur les exemples de l'article Elfsight
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
        
        // Configuration par defaut
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

    // Charger la configuration depuis Supabase (Synchro Admin)
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/admin/emma-config?section=ui&key=announcement_bars');
                const data = await response.json();
                
                if (data && data.config && data.config.value) {
                    const dbConfig = data.config.value;
                    setBars(prev => {
                        // Fusionner en gardant les etats locaux si necessaire, 
                        // mais ici on veut surtout que l'admin dicte l'etat enabled/disabled
                        // On merge pour ne pas perdre des cles qui n'existeraient pas en DB (backward compat)
                        const merged = { ...prev, ...dbConfig };
                        
                        // Si le contenu a change, on met a jour
                        if (JSON.stringify(prev) !== JSON.stringify(merged)) {
                            void(' Config Announcement Bars mise a jour depuis Supabase');
                            return merged;
                        }
                        return prev;
                    });
                }
            } catch (e) {
                console.warn('Erreur synchro config barres:', e);
            }
        };
        fetchConfig();
    }, []);

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
                            // Reinitialiser le localStorage pour permettre de reafficher
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

























