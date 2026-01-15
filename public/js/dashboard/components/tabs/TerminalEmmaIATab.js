/**
 * Component: TerminalEmmaIATab
 * Integration iframe du Terminal Emma IA dans le Dashboard
 * 
 * Ce composant charge la page Terminal Emma IA via iframe pour l'integrer
 * dans le dashboard sans ouvrir une nouvelle page.
 * 
 * Le Terminal Emma IA fournit :
 * - Dashboard marche (indices, heatmap)
 * - Screener & watchlists
 * - Fiche titre avec KPIs
 * - Donnees FMP Premier via Supabase
 */

const { useState } = React;

const TerminalEmmaIATab = ({ isDarkMode, activeTab, setActiveTab }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleIframeLoad = () => {
        void('Terminal Emma IA iframe charge avec succes');
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e27] z-50">
                    <div className="relative w-24 h-24 mb-8">
                        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-[spin_1s_linear_infinite]"></div>
                        <div className="absolute inset-2 border-4 border-transparent border-t-purple-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <i className="iconoir-terminal text-3xl text-white opacity-80"></i>
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                            Terminal Emma <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">IA</span>
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            <span>Chargement du Dashboard Marche</span>
                        </div>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e27]/90 backdrop-blur-sm z-50">
                    <div className="text-center p-8 max-w-md bg-gray-900/50 border border-red-500/30 rounded-2xl shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                            <i className="iconoir-warning-triangle text-3xl text-red-500"></i>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Erreur de Connexion</h3>
                        <p className="text-gray-400 text-sm mb-6">{error}</p>
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
                            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30 flex items-center gap-2 mx-auto"
                        >
                            <i className="iconoir-refresh"></i>
                            Reessayer
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
                title="Terminal Emma IA - Dashboard Marche & KPIs"
                allow="fullscreen"
                sandbox="allow-scripts allow-forms allow-popups allow-modals"
            />
        </div>
    );
};

window.TerminalEmmaIATab = TerminalEmmaIATab;
