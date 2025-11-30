/**
 * Component: FinVoxTab
 * Direct integration of FinVox Financial Assistant into Dashboard
 * 
 * This component loads the FinVox React app directly into the dashboard
 * content area, providing a seamless native experience.
 */

const { useState, useEffect, useRef } = React;

const FinVoxTab = ({ isDarkMode }) => {
    const containerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        const loadFinVox = async () => {
            try {
                // Check if assets are already loaded
                if (window.finvoxLoaded) {
                    console.log('FinVox already loaded');
                    setIsLoading(false);
                    return;
                }

                console.log('Loading FinVox assets...');

                // Load the main JS bundle
                const script = document.createElement('script');
                script.type = 'module';
                script.src = '/finvox-build/assets/index.js';
                script.async = true;

                script.onload = () => {
                    console.log('FinVox script loaded successfully');
                    window.finvoxLoaded = true;
                    setIsLoading(false);
                };

                script.onerror = (err) => {
                    console.error('Error loading FinVox script:', err);
                    setLoadError('Failed to load FinVox application');
                    setIsLoading(false);
                };

                document.head.appendChild(script);

            } catch (error) {
                console.error('Error in loadFinVox:', error);
                setLoadError(error.message);
                setIsLoading(false);
            }
        };

        loadFinVox();

        // Cleanup function
        return () => {
            // Note: We don't remove the script on unmount to avoid reloading
            // The script is cached and reused across tab switches
        };
    }, []);

    if (loadError) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                    <div className="text-red-500 mb-4">
                        <i className="iconoir-warning-triangle text-6xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-200 mb-2">Erreur de Chargement</h3>
                    <p className="text-gray-400 mb-4">{loadError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                        Recharger la page
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                    <p className="text-gray-400">Chargement de FinVox...</p>
                </div>
            </div>
        );
    }

    // The actual FinVox app will render into #finvox-root
    // This component just ensures the container is visible and styled
    return (
        <div
            ref={containerRef}
            className="h-full w-full overflow-hidden"
            style={{ minHeight: 'calc(100vh - 140px)' }}
        >
            {/* FinVox will mount here via React.createRoot in its own bundle */}
            <div id="finvox-root" className="h-full w-full"></div>
        </div>
    );
};

window.FinVoxTab = FinVoxTab;
