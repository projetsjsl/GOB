/**
 * CurveWatchTab - Intégration de YieldCurveAnalytics
 * 
 * Ce composant charge le nouveau dashboard de courbe des taux depuis /yieldcurveanalytics
 * en utilisant le cache global du dashboard pour éviter les blocages.
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
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        
        const init = async () => {
            console.log('🔄 CurveWatchTab: Initialisation du nouveau moteur...');
            
            // On vérifie d'abord si le composant est déjà chargé en mémoire
            if (window.CurveWatchV0) {
                if (mounted) setComponentReady(true);
                return;
            }

            // Tentative de chargement via V0Integration
            if (window.V0Integration) {
                try {
                    console.log('📡 CurveWatchTab: Appel V0Integration.loadV0Component...');
                    const component = await window.V0Integration.loadV0Component(
                        '/yieldcurveanalytics/components/curve-watch-compatible.tsx',
                        'CurveWatchV0'
                    );
                    console.log('📡 CurveWatchTab: Résultat chargement:', !!component);
                    if (mounted) {
                        setComponentReady(true);
                        console.log('✅ CurveWatchTab: Composant v0 chargé avec succès');
                    }
                } catch (err) {
                    console.error('❌ CurveWatchTab: Échec du chargement v0:', err);
                    if (mounted) setError(`Erreur de chargement du moteur v0: ${err.message}`);
                }
            } else {
                // Attente active courte pour V0Integration
                let attempts = 0;
                const checkV0 = setInterval(async () => {
                    attempts++;
                    if (window.V0Integration) {
                        clearInterval(checkV0);
                        try {
                            await window.V0Integration.loadV0Component(
                                '/yieldcurveanalytics/components/curve-watch-compatible.tsx',
                                'CurveWatchV0'
                            );
                            if (mounted) setComponentReady(true);
                        } catch (err) {
                            if (window.CurveWatchContainer) {
                                if (mounted) setComponentReady(true);
                            } else {
                                if (mounted) setError("V0 fail");
                            }
                        }
                    } else if (attempts > 30) {
                        clearInterval(checkV0);
                        if (window.CurveWatchContainer) {
                            if (mounted) setComponentReady(true);
                        } else {
                            if (mounted) setError("Timeout chargement");
                        }
                    }
                }, 100);
            }
        };

        init();
        return () => { mounted = false; };
    }, []);

    if (error) {
        return (
            <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-900 text-red-400' : 'bg-white text-red-600'}`}>
                <div className="text-center p-6 border-2 border-red-500 rounded-xl bg-red-500/5">
                    <p className="font-bold text-lg mb-2">Erreur CurveWatch</p>
                    <p className="text-sm opacity-80">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-xs">
                        Actualiser la page
                    </button>
                </div>
            </div>
        );
    }

    if (!componentReady) {
        return (
            <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-blue-500' : 'border-blue-600'} mx-auto mb-4`}></div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Initialisation de YieldCurve Analytics...
                    </p>
                </div>
            </div>
        );
    }

    // Priorité au composant moderne
    if (window.CurveWatchV0) {
        return (
            <div className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <window.CurveWatchV0 isDarkMode={isDark} />
            </div>
        );
    }

    // Fallback Legacy
    if (window.CurveWatchContainer) {
        return (
            <div className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <window.CurveWatchContainer embedded={true} />
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Composant indisponible.</p>
        </div>
    );
};

window.CurveWatchTab = CurveWatchTab;
console.log('✅ CurveWatchTab: Moteur YieldCurveAnalytics activé');
