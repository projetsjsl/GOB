/**
 * CurveWatchTab - Wrapper pour intégrer directement le composant v0
 * 
 * Utilise le code existant dans yieldcurveanalytics sans conversion manuelle
 * Le wrapper V0Integration gère automatiquement la conversion
 */

const { useState, useEffect } = React;

// Hook pour détecter le thème
const useDarkMode = () => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== "undefined" && typeof window.GOBThemes !== "undefined") {
            return window.GOBThemes.getCurrentTheme() === "dark";
        }
        if (typeof document !== "undefined") {
            return document.documentElement.getAttribute("data-theme") === "dark";
        }
        return true;
    });

    useEffect(() => {
        const handleThemeChange = () => {
            if (typeof window !== "undefined" && typeof window.GOBThemes !== "undefined") {
                setIsDark(window.GOBThemes.getCurrentTheme() === "dark");
            } else if (typeof document !== "undefined") {
                setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
            }
        };
        window.addEventListener("themeChanged", handleThemeChange);
        return () => window.removeEventListener("themeChanged", handleThemeChange);
    }, []);

    return isDark;
};

// Composant principal
const CurveWatchTab = ({ isDarkMode: isDarkModeProp }) => {
    const isDarkDetected = useDarkMode();
    const isDark = isDarkModeProp !== undefined ? isDarkModeProp : isDarkDetected;
    
    const [componentReady, setComponentReady] = useState(false);
    const [useV0Component, setUseV0Component] = useState(false);

    useEffect(() => {
        // Option 1: Utiliser CurveWatchContainer existant (déjà chargé)
        if (window.CurveWatchContainer) {
            setComponentReady(true);
            setUseV0Component(false);
            console.log('✅ CurveWatchTab: Utilise CurveWatchContainer existant');
            return;
        }

        // Option 2: Charger le composant v0 directement
        if (window.V0Integration) {
            console.log('🔄 CurveWatchTab: Tentative de chargement du composant v0...');
            window.V0Integration.loadV0Component(
                '/yieldcurveanalytics/components/curve-watch-compatible.tsx',
                'CurveWatchV0'
            ).then(() => {
                setComponentReady(true);
                setUseV0Component(true);
                console.log('✅ CurveWatchTab: Composant v0 chargé');
            }).catch((error) => {
                console.error('❌ CurveWatchTab: Erreur lors du chargement du composant v0', error);
                // Fallback vers CurveWatchContainer si disponible
                if (window.CurveWatchContainer) {
                    setComponentReady(true);
                    setUseV0Component(false);
                }
            });
        } else {
            // Attendre que V0Integration soit disponible
            const checkInterval = setInterval(() => {
                if (window.V0Integration) {
                    clearInterval(checkInterval);
                    window.V0Integration.loadV0Component(
                        '/yieldcurveanalytics/components/curve-watch-compatible.tsx',
                        'CurveWatchV0'
                    ).then(() => {
                        setComponentReady(true);
                        setUseV0Component(true);
                    }).catch(() => {
                        if (window.CurveWatchContainer) {
                            setComponentReady(true);
                            setUseV0Component(false);
                        }
                    });
                }
            }, 100);

            return () => clearInterval(checkInterval);
        }
    }, []);

    if (!componentReady) {
        return (
            <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-blue-500' : 'border-blue-600'} mx-auto mb-4`}></div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Chargement de CurveWatch...
                    </p>
                </div>
            </div>
        );
    }

    // Utiliser le composant approprié
    if (useV0Component && window.CurveWatchV0) {
        return (
            <div className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <window.CurveWatchV0 isDarkMode={isDark} />
            </div>
        );
    }

    // Fallback vers CurveWatchContainer
    if (window.CurveWatchContainer) {
        return (
            <div className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <window.CurveWatchContainer embedded={true} />
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="text-center">
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    CurveWatch non disponible. Vérifiez le chargement des scripts.
                </p>
            </div>
        </div>
    );
};

window.CurveWatchTab = CurveWatchTab;
console.log('✅ CurveWatchTab loaded - Support v0 + fallback CurveWatchContainer');
