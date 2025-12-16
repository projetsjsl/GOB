// Auto-converted from monolithic dashboard file
// Component: ScrappingSATab

const ScrappingSATab = (props) => {
    const {
        isDarkMode,
        runSeekingAlphaScraper,
        scrapingStatus,
        scrapingLogs,
        clearScrapingLogs,
        generateScrapingScript,
        addScrapingLog,
        tickers,
        Icon,
        seekingAlphaData
    } = props;

    // Local state
    const [manualTicker, setManualTicker] = React.useState('');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [modalUrl, setModalUrl] = React.useState('');

    const openModal = (url) => {
        setModalUrl(url);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalUrl('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                    <Icon emoji="🕷️" size={24} className="mr-2 inline-block" />
                    Scraping Seeking Alpha
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={clearScrapingLogs}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                        🗑️ Effacer logs
                    </button>
                </div>
            </div>

            {/* Status Card */}
            <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>État du Scraping</h3>
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-4 h-4 rounded-full ${
                        scrapingStatus === 'idle' ? 'bg-gray-400' :
                        scrapingStatus === 'running' ? 'bg-blue-500 animate-pulse' :
                        scrapingStatus === 'success' ? 'bg-green-500' :
                        'bg-red-500'
                    }`}></div>
                    <span className={`font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{scrapingStatus}</span>
                </div>
                
                <div className="flex gap-4">
                     <button
                        onClick={runSeekingAlphaScraper}
                        disabled={scrapingStatus === 'running'}
                        className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors font-bold flex justify-center items-center gap-2"
                    >
                        {scrapingStatus === 'running' ? (
                            <>
                                <span className="animate-spin">⏳</span> Scraping en cours...
                            </>
                        ) : (
                            <>
                                🚀 Lancer le Scraper Automatique
                            </>
                        )}
                    </button>
                </div>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Le scraper va ouvrir un nouvel onglet, collecter les données pour chaque ticker, et les sauvegarder automatiquement.
                    Gardez l'onglet du dashboard ouvert pendant le processus.
                </p>
            </div>

            {/* Manual Script Generator */}
            <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Générateur de Script Manuel (F12)</h3>
                <div className="flex gap-4 mb-4">
                    <input 
                        type="text" 
                        value={manualTicker}
                        onChange={(e) => setManualTicker(e.target.value.toUpperCase())}
                        placeholder="TICKER (ex: AAPL)"
                        className={`border rounded px-4 py-2 w-32 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                    <button
                        onClick={() => {
                            if (!manualTicker) return;
                            const script = generateScrapingScript(manualTicker);
                            navigator.clipboard.writeText(script).then(() => {
                                addScrapingLog(`📋 Script pour ${manualTicker} copié!`, 'success');
                            });
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                        Copier Script
                    </button>
                    <button
                         onClick={() => {
                             if (!manualTicker) return;
                             const url = `https://seekingalpha.com/symbol/${manualTicker}`;
                             window.open(url, '_blank');
                         }}
                         className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                    >
                        Ouvrir Page
                    </button>
                    <button
                         onClick={() => {
                             if (!manualTicker) return;
                             const url = `https://seekingalpha.com/symbol/${manualTicker}`;
                             openModal(url);
                         }}
                         className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
                    >
                        Prévisualiser
                    </button>
                </div>
                <div className={`p-4 rounded text-sm font-mono ${isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    <p className="mb-2 font-bold">Instructions:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>Entrez un ticker et cliquez sur "Copier Script"</li>
                        <li>Cliquez sur "Ouvrir Page" pour aller sur Seeking Alpha</li>
                        <li>Ouvrez la console développeur (F12 ou Clic Droit &gt; Inspecter &gt; Console)</li>
                        <li>Collez le script (Ctrl+V) et appuyez sur Entrée</li>
                        <li>Revenez ici, les données devraient apparaître dans les logs</li>
                    </ol>
                </div>
            </div>

            {/* Logs Console */}
            <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-gray-200 font-mono text-sm">Console Logs</h3>
                    <span className="text-xs text-gray-500">{scrapingLogs.length} événements</span>
                </div>
                <div className="p-4 h-96 overflow-y-auto font-mono text-sm space-y-1" id="scraping-console">
                    {scrapingLogs.length === 0 && (
                        <div className="text-gray-500 italic">En attente de logs...</div>
                    )}
                    {scrapingLogs.map((log, index) => (
                        <div key={index} className={`border-l-2 pl-2 ${
                            log.type === 'error' ? 'border-red-500 text-red-400' :
                            log.type === 'success' ? 'border-green-500 text-green-400' :
                            log.type === 'warning' ? 'border-yellow-500 text-yellow-400' :
                            'border-blue-500 text-blue-300'
                        }`}>
                            <span className="text-gray-500 text-xs mr-2">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            {log.message}
                        </div>
                    ))}
                </div>
            </div>

             {/* Raw Data Preview */}
             {seekingAlphaData.stocks && seekingAlphaData.stocks.length > 0 && (
                <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Données Récupérées ({seekingAlphaData.stocks.length})</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className={isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}>
                                    <th className="p-2 text-left">Ticker</th>
                                    <th className="p-2 text-left">Date</th>
                                    <th className="p-2 text-left">Données</th>
                                </tr>
                            </thead>
                            <tbody className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>
                                {seekingAlphaData.stocks.map((item, idx) => (
                                    <tr key={idx} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <td className="p-2 font-bold">{item.ticker}</td>
                                        <td className="p-2 opacity-75">{new Date(item.lastUpdated).toLocaleString()}</td>
                                        <td className="p-2 font-mono text-xs text-blue-500 truncate max-w-md">
                                            {JSON.stringify(item.parsedData).substring(0, 100)}...
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal expandable pour Seeking Alpha */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={closeModal}>
                    <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header du modal */}
                        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="ml-4 text-white font-semibold text-sm">Seeking Alpha - Prévisualisation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.open(modalUrl, '_blank', 'noopener,noreferrer')}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors"
                                    title="Ouvrir dans un nouvel onglet"
                                >
                                    Ouvrir dans un nouvel onglet
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                    title="Fermer"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        
                        {/* Contenu iframe */}
                        <div className="flex-1 relative overflow-hidden bg-white">
                            <iframe
                                src={modalUrl}
                                className="w-full h-full border-0"
                                title="Seeking Alpha Preview"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

window.ScrappingSATab = ScrappingSATab;