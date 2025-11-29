// Auto-converted from monolithic dashboard file
// Component: FinanceProTab

const { useState, useEffect, useRef } = React;

const FinanceProTab = () => {
    // Accès aux variables globales depuis le scope parent (comme dans la version monolithique)
    const isDarkMode = window.BetaCombinedDashboard?.isDarkMode ?? true;
    const containerRef = useRef(null);
    const scriptRef = useRef(null);
    const styleRef = useRef(null);
    const isInitializedRef = useRef(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Fonction pour vérifier si l'application est chargée
        const checkIfLoaded = () => {
            const root = document.getElementById('finance-pro-root');
            if (root) {
                // Vérifier si React a monté l'application (chercher des éléments React typiques)
                const hasReactContent = root.querySelector('#root') ||
                    root.querySelector('[class*="App"]') ||
                    root.querySelector('[class*="container"]') ||
                    root.innerHTML.trim().length > 100; // Contenu significatif

                return hasReactContent;
            }
            return false;
        };

        // Vérifier immédiatement si l'application est déjà chargée
        if (checkIfLoaded()) {
            const existingRoot = document.getElementById('finance-pro-root');
            if (existingRoot) {
                // S'assurer que le root est dans notre conteneur
                if (existingRoot.parentNode !== containerRef.current) {
                    containerRef.current.innerHTML = '';
                    containerRef.current.appendChild(existingRoot);
                }
                setIsLoaded(true);
                setLoadError(false);
                console.log('✅ Application 3p1 déjà chargée');
                return;
            }
        }

        // Vérifier si l'application est déjà chargée et si le root existe toujours dans le DOM
        const existingRoot = document.getElementById('finance-pro-root');
        if (isInitializedRef.current && existingRoot && existingRoot.innerHTML.trim() !== '') {
            // Vérifier que le root est bien dans notre conteneur
            if (existingRoot.parentNode === containerRef.current) {
                if (checkIfLoaded()) {
                    setIsLoaded(true);
                    setLoadError(false);
                    return;
                }
            } else {
                // Le root existe mais n'est pas dans notre conteneur, le déplacer
                containerRef.current.innerHTML = '';
                containerRef.current.appendChild(existingRoot);
                if (checkIfLoaded()) {
                    setIsLoaded(true);
                    setLoadError(false);
                    return;
                }
            }
        }

        // Si on arrive ici, l'application n'est pas encore chargée ou a été supprimée
        isInitializedRef.current = true;
        setIsLoaded(false); // Réinitialiser l'état de chargement
        setLoadError(false);

        // Nettoyer les références précédentes si elles existent
        if (scriptRef.current && scriptRef.current.parentNode) {
            scriptRef.current.parentNode.removeChild(scriptRef.current);
        }
        if (styleRef.current && styleRef.current.parentNode) {
            styleRef.current.parentNode.removeChild(styleRef.current);
        }

        // Créer un conteneur pour l'application 3p1
        // L'application 3p1 cherche un élément avec id="finance-pro-root" (ou "root" en fallback)
        // Vérifier si le conteneur existe déjà (évite de le recréer lors des re-renders)
        let rootDiv = document.getElementById('finance-pro-root');
        if (!rootDiv) {
            // Créer un nouveau root
            rootDiv = document.createElement('div');
            rootDiv.id = 'finance-pro-root';
            rootDiv.className = 'w-full h-full';
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(rootDiv);
        } else {
            // Le conteneur existe déjà, s'assurer qu'il est dans le bon parent
            if (rootDiv.parentNode !== containerRef.current) {
                // Déplacer le root vers notre conteneur
                containerRef.current.innerHTML = '';
                containerRef.current.appendChild(rootDiv);
            } else if (rootDiv.innerHTML.trim() === '') {
                // Le root existe mais est vide, le réinitialiser
                rootDiv.innerHTML = '';
            }
        }

        // Créer et charger les styles nécessaires
        const style = document.createElement('style');
        style.id = 'finance-pro-styles'; // ID pour éviter les doublons
        style.textContent = `
                        #finance-pro-root #root {
                            width: 100%;
                            height: 100%;
                            overflow: auto;
                        }
                        #finance-pro-root #root ::-webkit-scrollbar {
                            width: 8px;
                            height: 8px;
                        }
                        #finance-pro-root ::-webkit-scrollbar-track {
                            background: #f1f1f1;
                        }
                        #finance-pro-root ::-webkit-scrollbar-thumb {
                            background: #c1c1c1;
                            border-radius: 4px;
                        }
                        #finance-pro-root ::-webkit-scrollbar-thumb:hover {
                            background: #a8a8a8;
                        }
                        #finance-pro-root #root input[type=number]::-webkit-inner-spin-button,
                        #finance-pro-root #root input[type=number]::-webkit-outer-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                        }
                    `;
        // Vérifier si le style existe déjà avant de l'ajouter
        const existingStyle = document.getElementById('finance-pro-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        document.head.appendChild(style);
        styleRef.current = style;

        // Charger le script compilé de l'application 3p1
        // Vérifier si le script existe déjà
        const existingScript = document.querySelector('script[data-finance-pro="true"]');
        if (existingScript) {
            // Le script existe déjà, vérifier si l'application est montée
            scriptRef.current = existingScript;

            // Vérifier immédiatement
            if (checkIfLoaded()) {
                setIsLoaded(true);
                setLoadError(false);
                console.log('✅ Application 3p1 détectée comme chargée');
                return; // Déjà chargé
            }

            // Si pas encore chargé, vérifier périodiquement
            let checkCount = 0;
            const maxChecks = 20; // 20 * 500ms = 10 secondes max
            const checkInterval = setInterval(() => {
                checkCount++;
                if (checkIfLoaded()) {
                    setIsLoaded(true);
                    setLoadError(false);
                    clearInterval(checkInterval);
                    console.log(`✅ Application 3p1 chargée après ${checkCount * 500}ms`);
                } else if (checkCount >= maxChecks) {
                    clearInterval(checkInterval);
                    console.warn('⚠️ Application 3p1 pas encore montée après 10s');
                    // Forcer l'affichage si le root existe avec du contenu
                    const root = document.getElementById('finance-pro-root');
                    if (root && root.innerHTML.trim().length > 50) {
                        setIsLoaded(true);
                    }
                }
            }, 500);
        } else {
            // Le script n'existe pas, le charger
            const script = document.createElement('script');
            script.type = 'module';
            script.src = '/3p1/dist/assets/index.js';
            script.setAttribute('data-finance-pro', 'true'); // Marquer pour identification

            script.onload = () => {
                console.log('✅ Script 3p1 chargé, attente du montage React...');
                // Vérifier périodiquement si React a monté l'app
                let checkCount = 0;
                const maxChecks = 20; // 20 * 500ms = 10 secondes max
                const checkInterval = setInterval(() => {
                    checkCount++;
                    if (checkIfLoaded()) {
                        setIsLoaded(true);
                        setLoadError(false);
                        clearInterval(checkInterval);
                        console.log(`✅ Application 3p1 montée après ${checkCount * 500}ms`);
                    } else if (checkCount >= maxChecks) {
                        clearInterval(checkInterval);
                        console.warn('⚠️ React n\'a pas monté l\'application après 10s');
                        setLoadError(true);
                    }
                }, 500);
            };

            script.onerror = (error) => {
                console.error('❌ Erreur de chargement de 3p1:', error);
                console.error('❌ Chemin tenté: /3p1/dist/assets/index.js');
                setLoadError(true);
                setIsLoaded(false);
            };

            document.head.appendChild(script);
            scriptRef.current = script;
        }

        // Timeout de sécurité global (si React ne monte pas)
        const timeoutId = setTimeout(() => {
            if (!checkIfLoaded() && !isLoaded) {
                console.warn("⚠️ Timeout global de chargement de 3p1 - Vérifiez la console");
                const errorDiv = document.getElementById('finance-pro-error');
                if (errorDiv) {
                    errorDiv.classList.remove('hidden');
                }
            }
        }, 15000); // 15 secondes

        return () => {
            clearTimeout(timeoutId);
            // Cleanup seulement si le composant est démonté
            // On ne nettoie PAS le root ni le script car on veut que l'application reste chargée
            // même si l'utilisateur change de vue (portfolio/watchlist/3pour1)
            // Le root et le script restent dans le DOM pour être réutilisés lors du remontage
        };
    }, []); // Seulement au montage initial, pas lors du changement de thème ou de vue

    return (
        <div className="w-full h-full flex flex-col">
            {loadError && (
                <div className={`p-4 mb-4 rounded-lg border transition-colors duration-300 ${isDarkMode
                    ? 'bg-yellow-900/20 border-yellow-600/50 text-yellow-200'
                    : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                    }`}>
                    <p className="font-semibold mb-2">⚠️ Erreur de chargement</p>
                    <p className="text-sm">
                        L'application n'a pas pu être chargée. Assurez-vous que l'application 3p1 a été construite.
                    </p>
                </div>
            )}
            {!isLoaded && !loadError && (
                <div className={`p-4 mb-4 rounded-lg border transition-colors duration-300 ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300'
                    : 'bg-gray-100 border-gray-200 text-gray-600'
                    }`}>
                    <p className="text-sm">Chargement de l'application Analyse Financière Pro...</p>
                </div>
            )}
            <div
                ref={containerRef}
                className={`flex-1 rounded-lg overflow-hidden border transition-colors duration-300 ${isDarkMode
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white border-gray-200'
                    }`}
                style={{ minHeight: '600px' }}
            >
                {/* Le conteneur #finance-pro-root sera créé dynamiquement par useEffect */}
            </div>
        </div>
    );
};

// Exposition globale pour Babel standalone
window.FinanceProTab = FinanceProTab;

