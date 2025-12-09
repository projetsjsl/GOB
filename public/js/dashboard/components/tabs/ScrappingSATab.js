// Auto-converted from monolithic dashboard file
// Component: ScrappingSATab

const ScrappingSATab = () => {
    // État pour gérer le modal expandable
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalUrl, setModalUrl] = useState('');

    // Fonction pour ouvrir le modal avec une URL
    const openModal = (url) => {
        setModalUrl(url);
        setIsModalOpen(true);
    };

    // Fonction pour fermer le modal
    const closeModal = () => {
        setIsModalOpen(false);
        setModalUrl('');
    };

    return (
                <div className="space-y-6">
            {/* Navigation Secondaire */}
            {window.SecondaryNavBar && (
                <window.SecondaryNavBar 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab} 
                    isDarkMode={isDarkMode} 
                />
            )}


                    <div className="flex justify-between items-center">
                        <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>🔧 Scrapping SA</h2>
                    </div>


                    {/* Fiche détaillée du titre sélectionné */}
                    {selectedStock && (
                        <div className="seeking-alpha-card rounded-lg p-6 border border-gray-600">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-2xl font-bold text-white">{selectedStock}</h3>
                                <button
                                    onClick={() => setSelectedStock(null)}
                                    className="text-blue-400 hover:text-blue-300"
                                >
                                    ✕ Fermer
                                </button>
                            </div>
                            
                            {/* Fiche détaillée comme dans les images */}
                            {(() => {
                                const claudeData = seekingAlphaStockData.stocks?.[selectedStock];
                                const seekingAlphaItem = seekingAlphaData.stocks?.find(s => s.ticker === selectedStock);
                                const parsedData = seekingAlphaItem?.parsedData;
                                
                                if (claudeData || parsedData) {
                                    return (
                                        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                                            {/* Header avec gradient bleu */}
                                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-white">{selectedStock}</h3>
                                                        <p className="text-blue-100 text-sm">
                                                            {claudeData?.companyName || parsedData?.companyName || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedStock(null)}
                                                        className="text-white hover:text-gray-200 text-xl"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Contenu principal */}
                                            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                                                {/* Métriques Clés */}
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                        <div className="w-1 h-6 bg-green-600 mr-3"></div>
                                                        Métriques Clés
                                                    </h4>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="text-gray-600 text-sm">Capitalisation</div>
                                                            <div className="text-gray-800 font-bold text-lg">{claudeData?.metrics?.marketCap || 'N/A'}</div>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="text-gray-600 text-sm">Croissance BPA</div>
                                                            <div className="text-gray-800 font-bold text-lg">{claudeData?.metrics?.bpaGrowth || 'N/A'}</div>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="text-gray-600 text-sm">P/E Ratio</div>
                                                            <div className="text-gray-800 font-bold text-lg">{claudeData?.metrics?.peRatio || 'N/A'}</div>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="text-gray-600 text-sm">Secteur</div>
                                                            <div className="text-gray-800 font-bold text-lg">{claudeData?.metrics?.sector || 'N/A'}</div>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="text-gray-600 text-sm">Rendement Dividende</div>
                                                            <div className="text-green-600 font-bold text-lg">{claudeData?.metrics?.dividendYield || 'N/A'}</div>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="text-gray-600 text-sm">Fréquence</div>
                                                            <div className="text-gray-800 font-bold text-lg">{claudeData?.metrics?.dividendFrequency || 'N/A'}</div>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="text-gray-600 text-sm">Ex-Dividende</div>
                                                            <div className="text-gray-800 font-bold text-lg">{claudeData?.metrics?.exDivDate || 'N/A'}</div>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="text-gray-600 text-sm">Paiement Annuel</div>
                                                            <div className="text-green-600 font-bold text-lg">{claudeData?.metrics?.annualPayout || 'N/A'}</div>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="text-gray-600 text-sm">Prix Actuel</div>
                                                            <div className="text-blue-600 font-bold text-lg">{claudeData?.metrics?.price || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Profil de l'Entreprise */}
                                                {claudeData?.companyProfile && (
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-800 mb-4">Profil de l'Entreprise</h4>
                                                        <div className="text-gray-700 leading-relaxed">
                                                            {cleanText(claudeData.companyProfile.description)}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Analyse Quantitative */}
                                                {claudeData?.quantRating && (
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-800 mb-4">Analyse Quantitative</h4>
                                                        <div className="flex gap-4 mb-6">
                                                            {Object.entries(claudeData.quantRating).map(([key, value]) => {
                                                                if (!value || key === 'overall') return null;
                                                                return (
                                                                    <div key={key} className="text-center">
                                                                        <div className="text-gray-600 text-sm mb-2 capitalize">{key}</div>
                                                                        <span className={`px-3 py-2 rounded-lg text-sm font-bold ${getGradeColor(value)}`}>
                                                                            {value}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Analyse Sectorielle */}
                                                {claudeData?.sectorAnalysis && (
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                            <div className="w-1 h-6 bg-green-600 mr-3"></div>
                                                            Analyse Sectorielle
                                                        </h4>
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="text-gray-700 leading-relaxed">
                                                                {typeof claudeData.sectorAnalysis === 'string' 
                                                                    ? cleanText(claudeData.sectorAnalysis)
                                                                    : Object.entries(claudeData.sectorAnalysis).map(([key, value]) => (
                                                                        <div key={key} className="mb-3">
                                                                            <div className="font-bold text-gray-800 capitalize mb-2">{cleanText(key)}:</div>
                                                                            <div className="text-gray-700 leading-relaxed">{cleanText(value)}</div>
                                                                </div>
                                                                    ))
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Points Positifs */}
                                                {claudeData?.strengths && (
                                                    <div className="bg-green-50 rounded-lg p-4">
                                                        <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                                                            <span className="mr-2">✅</span>
                                                            Points Positifs
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {claudeData.strengths.map((strength, index) => (
                                                                <div key={index} className="text-green-700">
                                                                    <span className="font-bold">{index + 1}.</span> {cleanText(strength)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Préoccupations */}
                                                {claudeData?.concerns && (
                                                    <div className="bg-red-50 rounded-lg p-4">
                                                        <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                                                            <span className="mr-2">⚠️</span>
                                                            Préoccupations
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {claudeData.concerns.map((concern, index) => (
                                                                <div key={index} className="text-red-700 flex items-start">
                                                                    <span className="mr-2">⚠️</span>
                                                                    <span>{cleanText(concern)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Conclusion Finale */}
                                                {claudeData?.finalConclusion && (
                                                    <div className="bg-gray-800 rounded-lg p-6 text-white">
                                                        <h4 className="text-xl font-bold mb-4">Conclusion Finale</h4>
                                                        <div className="bg-white rounded-lg p-4 text-gray-800">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="font-bold">Recommandation:</span>
                                                                <span className="bg-yellow-400 text-black px-3 py-1 rounded font-bold">
                                                                    {claudeData.finalConclusion.rating}
                                                                </span>
                                                            </div>
                                                            <div className="text-gray-700 leading-relaxed">
                                                                {cleanText(claudeData.finalConclusion.recommendation)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Lien vers Seeking Alpha */}
                                                {seekingAlphaItem?.url && (
                                                    <div className="text-center pt-4 border-t">
                                                        <button
                                                            onClick={() => openModal(seekingAlphaItem.url)}
                                                            className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                                        >
                                                            Lire l'analyse complète sur Seeking Alpha →
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            
                            {/* Analyse Seeking Alpha */}
                            {(() => {
                                const seekingAlphaItem = seekingAlphaData.stocks?.find(s => s.ticker === selectedStock);
                                const parsedData = seekingAlphaItem?.parsedData;
                                
                                if (parsedData?.analysis) {
                                    return (
                                        <div className="mb-4">
                                            <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                                <Icon emoji="📈" size={20} />
                                                Analyse Seeking Alpha
                                            </h4>
                                            <div className="text-gray-200 text-sm leading-relaxed">
                                                {parsedData.analysis}
                                            </div>
                                            <button
                                                onClick={() => openModal(seekingAlphaItem.url)}
                                                className="inline-block mt-2 text-blue-300 hover:text-blue-200 underline cursor-pointer"
                                            >
                                                Lire l'analyse complète sur Seeking Alpha →
                                            </button>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            
                            {/* Données en temps réel */}
                            {stockData[selectedStock] && (
                                <div className="mb-4">
                                    <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                        <Icon emoji="📊" size={20} />
                                        Données Temps Réel
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <span className="text-blue-200">Ouverture:</span>
                                            <span className="text-white ml-2">${stockData[selectedStock].o?.toFixed(2) || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-200">Plus haut:</span>
                                            <span className="text-white ml-2">${stockData[selectedStock].h?.toFixed(2) || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-200">Plus bas:</span>
                                            <span className="text-white ml-2">${stockData[selectedStock].l?.toFixed(2) || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Liste des tickers disponibles si aucune donnée Seeking Alpha */}
                    {!selectedStock && (!seekingAlphaData.stocks || seekingAlphaData.stocks.length === 0) && tickers.length > 0 && (
                        <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                📊 Tickers disponibles ({tickers.length})
                            </h3>
                            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Cliquez sur un ticker pour voir ses détails ou lancez le scraper pour collecter les données Seeking Alpha.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {tickers.map((ticker) => (
                                    <button
                                        key={ticker}
                                        onClick={() => setSelectedStock(ticker)}
                                        className={`p-3 rounded-lg border transition-all hover:scale-105 ${
                                            isDarkMode
                                                ? 'bg-gray-700/50 border-gray-600 hover:border-green-500 text-white'
                                                : 'bg-white border-gray-300 hover:border-green-500 text-gray-900'
                                        }`}
                                    >
                                        <div className="font-mono font-bold text-lg">{ticker}</div>
                                        {stockData[ticker] && (
                                            <div className={`text-xs mt-1 ${
                                                (stockData[ticker].dp || stockData[ticker].changePercent || 0) >= 0
                                                    ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                                ${(stockData[ticker].c || stockData[ticker].price || 0).toFixed(2)}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cartes d'analyse comme dans les images */}
                    {!selectedStock && seekingAlphaData.stocks && seekingAlphaData.stocks.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Icon emoji="📈" size={20} />
                                Analyses Complètes
                            </h3>
                                <div className="flex bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setSeekingAlphaViewMode('list')}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            seekingAlphaViewMode === 'list' 
                                                ? 'bg-gray-800 text-white' 
                                                : 'text-gray-300 hover:text-white'
                                        }`}
                                    >
                                        📋 Liste
                                    </button>
                                    <button
                                        onClick={() => setSeekingAlphaViewMode('cards')}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            seekingAlphaViewMode === 'cards' 
                                                ? 'bg-gray-800 text-white' 
                                                : 'text-gray-300 hover:text-white'
                                        }`}
                                    >
                                        🎴 Cartes
                                    </button>
                                </div>
                            </div>

                            {/* Vue en liste compacte pour Seeking Alpha */}
                            {seekingAlphaViewMode === 'list' && (
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Icon emoji="📋" size={20} />
                                        Vue Liste - Analyses
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-600">
                                                    <th className="text-left py-2 text-gray-300">Ticker</th>
                                                    <th className="text-left py-2 text-gray-300">Prix</th>
                                                    <th className="text-left py-2 text-gray-300">Change</th>
                                                    <th className="text-left py-2 text-gray-300">P/E</th>
                                                    <th className="text-left py-2 text-gray-300">Dividende</th>
                                                    <th className="text-left py-2 text-gray-300">Secteur</th>
                                                    <th className="text-left py-2 text-gray-300">Quant</th>
                                                    <th className="text-left py-2 text-gray-300">Rating</th>
                                                    <th className="text-left py-2 text-gray-300">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                            {seekingAlphaData.stocks
                                .slice()
                                .sort((a, b) => a.ticker.localeCompare(b.ticker))
                                .map((stock, index) => {
                                const claudeData = seekingAlphaStockData.stocks?.[stock.ticker];
                                const parsedData = stock.parsedData;
                                                    
                                                    // Priorité: Claude > Parsed
                                                    const price = claudeData?.metrics?.price || parsedData?.price || 'N/A';
                                                    const change = claudeData?.metrics?.priceChange || parsedData?.change || 'N/A';
                                                    const peRatio = claudeData?.metrics?.peRatio || parsedData?.peRatio || 'N/A';
                                                    const dividendYield = claudeData?.metrics?.dividendYield || parsedData?.dividendYield || 'N/A';
                                                    const sector = claudeData?.metrics?.sector || parsedData?.sector || 'N/A';
                                                    const quantRating = parsedData?.quantRating || claudeData?.quantRating || 'N/A';
                                                    const rating = claudeData?.finalConclusion?.rating || 'Hold';

                                                    const changeColor = (change.includes('+') || change.includes('green')) ? 'text-green-400' : 'text-red-400';
                                
                                return (
                                                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-800 cursor-pointer"
                                                            onClick={() => setSelectedStock(stock.ticker)}>
                                                            <td className="py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <img 
                                                                        src={getCompanyLogo(stock.ticker)} 
                                                                        alt={`${stock.ticker} logo`}
                                                                        className="w-6 h-6 rounded"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                        }}
                                                                    />
                                                                    <span className="font-mono text-white font-bold">{stock.ticker}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 text-white">{price}</td>
                                                            <td className={`py-3 ${changeColor}`}>{change}</td>
                                                            <td className="py-3 text-white">{peRatio}</td>
                                                            <td className="py-3 text-white">{dividendYield}</td>
                                                            <td className="py-3 text-white text-xs">{cleanText(sector)}</td>
                                                            <td className="py-3">
                                                                {quantRating !== 'N/A' ? (
                                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                                        getGradeColor(quantRating)
                                                                    }`}>
                                                                        {quantRating}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-500 text-xs">N/A</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3">
                                                                <span className="bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                                                                    {rating}
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedStock(stock.ticker);
                                                                        }}
                                                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
                                                                    >
                                                                        <LucideIcon name="FileText" className="w-3 h-3" />
                                                                        Fiche
                                                                    </button>
                                                                    {stock.url && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openModal(stock.url);
                                                                            }}
                                                                            className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
                                                                        >
                                                                            <LucideIcon name="ExternalLink" className="w-3 h-3" />
                                                                            Article SA
                                                                        </button>
                                                                    )}
                                                                    {parsedData?.peers && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                alert(`Peers for ${stock.ticker}:\n${parsedData.peers.join('\n')}`);
                                                                            }}
                                                                            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
                                                                        >
                                                                            <LucideIcon name="Users" className="w-3 h-3" />
                                                                            Peers
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Vue en cartes pour Seeking Alpha */}
                            {seekingAlphaViewMode === 'cards' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {seekingAlphaData.stocks
                                        .slice()
                                        .sort((a, b) => a.ticker.localeCompare(b.ticker))
                                        .map((stock, index) => {
                                        const claudeData = seekingAlphaStockData.stocks?.[stock.ticker];
                                        const parsedData = stock.parsedData;
                                        
                                        return (
                                            <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-300/40 transition-all cursor-pointer"
                                                 onClick={() => setSelectedStock(stock.ticker)}>
                                                
                                        {/* Header avec ticker et rating */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={getCompanyLogo(stock.ticker)} 
                                                    alt={`${stock.ticker} logo`}
                                                    className="w-12 h-12 rounded-lg"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <div>
                                                    <h3 className="text-2xl font-bold text-white">{stock.ticker}</h3>
                                                    <p className="text-sm text-gray-400">
                                                        {claudeData?.companyName || parsedData?.companyName || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-yellow-400 text-black px-3 py-1 rounded font-bold text-sm">
                                                {claudeData?.finalConclusion?.rating || 'Hold'}
                                            </div>
                                        </div>

                                        {/* Prix et changement */}
                                        <div className="bg-gray-700 rounded-lg p-4 mb-6">
                                            <div className="text-3xl font-bold text-white mb-1">
                                                {claudeData?.metrics?.price || parsedData?.price || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-gray-700 rounded"></div>
                                                <span className={`text-sm font-medium ${claudeData?.metrics?.priceChange?.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
                                                    {claudeData?.metrics?.priceChange || parsedData?.change || 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Métriques clés */}
                                        <div className="space-y-3 mb-6">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Market Cap</span>
                                                <span className="text-white font-medium">{claudeData?.metrics?.marketCap || parsedData?.marketCap || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">P/E Ratio</span>
                                                <span className="text-white font-medium">{claudeData?.metrics?.peRatio || parsedData?.peRatio || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Dividend</span>
                                                <span className="text-white font-medium">{claudeData?.metrics?.dividendYield || parsedData?.dividendYield || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Secteur</span>
                                                <span className="text-white font-medium">{claudeData?.metrics?.sector || parsedData?.sector || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Quant Ratings */}
                                        {claudeData?.quantRating && (
                                            <div className="mb-6">
                                                <div className="border-t border-gray-600 pt-4">
                                                    <h4 className="text-center text-gray-300 text-sm font-medium mb-4">QUANT RATINGS</h4>
                                                    <div className="flex justify-center gap-3">
                                                        {Object.entries(claudeData.quantRating).map(([key, value]) => {
                                                            if (!value || key === 'overall') return null;
                                                            const shortKey = key.substring(0, 3);
                                                            return (
                                                                <div key={key} className="text-center">
                                                                    <div className="text-xs text-gray-400 mb-1">{shortKey}</div>
                                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(value)}`}>
                                                                        {value}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Lien vers Seeking Alpha */}
                                        {stock.url && (
                                            <div className="mb-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openModal(stock.url);
                                                    }}
                                                    className="block w-full px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors text-center"
                                                >
                                                    📰 Lire sur Seeking Alpha →
                                                </button>
                                            </div>
                                        )}

                                        {/* Call to action */}
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                                                <span>👆</span>
                                                <span>Cliquez pour le rapport détaillé</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                        </div>
                    )}
                </div>

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
                                    <span className="ml-4 text-white font-semibold text-sm">Seeking Alpha</span>
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
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Contenu iframe */}
                            <div className="flex-1 relative overflow-hidden">
                                <iframe
                                    src={modalUrl}
                                    className="w-full h-full border-0"
                                    title="Seeking Alpha Article"
                                    allow="fullscreen"
                                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
};

window.ScrappingSATab = ScrappingSATab;