/**
 * Component: TerminalEmmaIATab
 * Intégration iframe du Terminal Emma IA dans le Dashboard
 * 
 * Ce composant charge la page Terminal Emma IA via iframe pour l'intégrer
 * dans le dashboard sans ouvrir une nouvelle page.
 * 
 * Le Terminal Emma IA fournit :
 * - Dashboard marché (indices, heatmap)
 * - Screener & watchlists
 * - Fiche titre avec KPIs
 * - Données FMP Premier via Supabase
 */

const { useState } = React;

const TerminalEmmaIATab = ({ isDarkMode, activeTab, setActiveTab }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleIframeLoad = () => {
        console.log('Terminal Emma IA iframe chargé avec succès');
        setIsLoading(false);
        setError(null);
    };

    const handleIframeError = () => {
        console.error('Erreur chargement Terminal Emma IA iframe');
        setIsLoading(false);
        setError('Impossible de charger le Terminal Emma IA');
    };

    return (
        <div 
            className="h-full w-full relative" 
            style={{ 
                minHeight: 'calc(100vh - 140px)',
                backgroundColor: '#0a0e27',
                isolation: 'isolate'
            }}
        >



            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-400">Chargement du Terminal Emma IA...</p>
                        <p className="text-gray-500 text-sm mt-2">Dashboard marché • Screener • KPIs</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 z-10">
                    <div className="text-center bg-red-900/50 p-4 rounded-lg">
                        <p className="text-red-400 font-semibold">Erreur</p>
                        <p className="text-red-300 text-sm mt-2">{error}</p>
                        <button
                            onClick={() => {
                                setError(null);
                                setIsLoading(true);
                                // Recharger l'iframe
                                const iframe = document.querySelector('#terminal-emma-ia-iframe');
                                if (iframe) {
                                    iframe.src = iframe.src;
                                }
                            }}
                            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}
            <iframe
                id="terminal-emma-ia-iframe"
                src="/terminal-emma-ia.html"
                className="w-full h-full border-0"
                style={{ 
                    minHeight: 'calc(100vh - 140px)',
                    isolation: 'isolate',
                    backgroundColor: '#0a0e27',
                    display: 'block',
                    border: 'none',
                    margin: 0,
                    padding: 0
                }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title="Terminal Emma IA - Dashboard Marché & KPIs"
                allow="fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
        </div>
    );
};

window.TerminalEmmaIATab = TerminalEmmaIATab;

