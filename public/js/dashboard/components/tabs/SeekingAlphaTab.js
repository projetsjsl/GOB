// Auto-converted from monolithic dashboard file
// Component: SeekingAlphaTab




const SeekingAlphaTab = () => (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        <Icon emoji="📈" size={24} className="mr-2 inline-block" />
                        Analyses Seeking Alpha
                    </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={refreshAllStocks}
                                disabled={loading}
                                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Actualisation...' : 'Actualiser Stocks'}
                            </button>
                            <button
                                onClick={fetchNews}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                                Actualiser News
                            </button>
                            <button
                                onClick={runSeekingAlphaScraper}
                                disabled={scrapingStatus === 'running'}
                                className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 transition-colors"
                            >
                                {scrapingStatus === 'running' ? 'Scraping...' : '🚀 Lancer le Scraper'}
                            </button>
                            <button
                                onClick={() => openSeekingAlpha('AAPL')}
                                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                            >
                                🌐 Ouvrir Seeking Alpha
                            </button>
                            <button
                                onClick={() => {
                                    const script = generateScrapingScript('CVS');
                                    navigator.clipboard.writeText(script).then(() => {
                                        addScrapingLog('📋 Script de scraping copié dans le presse-papiers', 'success');
                                        addScrapingLog('💡 Collez-le dans la console F12 de Seeking Alpha', 'info');
                                    });
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            >
                                📋 Script F12
                            </button>
                            <button
                                onClick={async () => {
                                    addScrapingLog('🤖 Démarrage de l\'analyse Perplexity sur les données existantes...', 'info');
                                    try {
                                        for (const ticker of tickers) {
                                            const seekingAlphaItem = seekingAlphaData.stocks?.find(s => s.ticker === ticker);
                                            if (seekingAlphaItem?.parsedData) {
                                                await analyzeWithClaude(ticker, seekingAlphaItem.parsedData);
                                            }
                                        }
                                        addScrapingLog('✅ Analyse Perplexity terminée pour tous les titres', 'success');
                                    } catch (error) {
                                        addScrapingLog(`❌ Erreur analyse Perplexity: ${error.message}`, 'error');
                                    }
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                            >
                                🤖 Analyser avec Claude
                            </button>
                        </div>
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
                                                {claudeData?.concerns && claudeData.concerns[0] !== "Analyse en attente" && (
                                                    <div className="bg-red-50 rounded-lg p-4">
                                                        <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                                                            <span className="mr-2">⚠️</span>
                                                            Préoccupations
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {claudeData.concerns.map((concern, index) => (
                                                                <div key={index} className="text-red-700">
                                                                    <span className="font-bold">{index + 1}.</span> {cleanText(concern)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Recommandation */}
                                                {(claudeData?.recommendation || claudeData?.finalConclusion?.recommendation) &&
                                                 !claudeData?.recommendation?.includes('En attente') &&
                                                 !claudeData?.finalConclusion?.recommendation?.includes('En attente') && (
                                                    <div className="bg-blue-50 rounded-lg p-4">
                                                        <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                                                            <span className="mr-2">💡</span>
                                                            Recommandation
                                                        </h4>
                                                        <div className="text-blue-700 leading-relaxed">
                                                            {cleanText(claudeData?.recommendation || claudeData?.finalConclusion?.recommendation)}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Message si données en attente */}
                                                {(!parsedData || Object.keys(parsedData).length < 5) && 
                                                 claudeData?.metrics?.marketCap === 'En attente d\'analyse' && (
                                                    <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
                                                        <h4 className="text-lg font-bold text-yellow-800 mb-3 flex items-center">
                                                            <span className="mr-2">⏳</span>
                                                            Données en cours de traitement
                                                        </h4>
                                                        <div className="text-yellow-700 leading-relaxed space-y-2">
                                                            <p>Les données brutes ont été collectées avec succès, mais l'analyse détaillée n'est pas encore disponible.</p>
                                                            <p className="font-semibold">Pour obtenir l'analyse complète :</p>
                                                            <ol className="list-decimal pl-5 space-y-1">
                                                                <li>Configurez la clé API Claude dans l'onglet Admin-JSLAI</li>
                                                                <li>Cliquez sur "🤖 Analyser avec Claude" pour traiter les données</li>
                                                                <li>Les métriques détaillées seront extraites et affichées ici</li>
                                                            </ol>
                                                            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                                                <p className="text-sm text-blue-800">
                                                                    💡 <strong>Astuce :</strong> Les données parsées automatiquement sont affichées ci-dessus. 
                                                                    Pour une analyse plus approfondie avec insights IA, utilisez l'API Claude.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Lien vers Seeking Alpha */}
                                                {seekingAlphaItem?.url && (
                                                    <div className="text-center pt-4 border-t">
                                                        <a 
                                                            href={seekingAlphaItem.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                                        >
                                                            Lire l'analyse complète sur Seeking Alpha →
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    )}

                    {/* Message si aucune donnée et aucun ticker */}
                    {(!seekingAlphaData.stocks || seekingAlphaData.stocks.length === 0) && tickers.length === 0 && (
                        <div className={`backdrop-blur-sm rounded-lg p-8 border transition-colors duration-300 ${
                            isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-300'
                        }`}>
                            <div className="text-center">
                                <div className="text-5xl mb-4"><Icon emoji="📊" size={48} /></div>
                                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                                    Aucun ticker disponible
                                </h3>
                                <p className={`mb-4 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                    Ajoutez des tickers dans l'onglet "Titres & Nouvelles" pour commencer.
                                </p>
                                <button
                                    onClick={() => setActiveTab('stocks-news')}
                                    className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Aller à Titres & Nouvelles →
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Affichage des analyses en cartes */}
                    {seekingAlphaData.stocks && seekingAlphaData.stocks.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {seekingAlphaData.stocks.map((stock, index) => {
                                const claudeData = seekingAlphaStockData.stocks?.[stock.ticker];
                                const parsedData = stock.parsedData;

                                // Afficher la carte même sans données complètes
                                // mais vérifier qu'il y a au moins un ticker
                                if (!stock.ticker) return null;
                                
                                return (
                                    <div key={index} className="seeking-alpha-card rounded-lg p-6 border border-gray-600">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-white">{stock.ticker}</h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openPeersComparison(stock.ticker)}
                                                    className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs rounded-lg transition-all duration-300 shadow-lg"
                                                    title="Comparaison avec les peers"
                                                >
                                                    🔍 Peers
                                                </button>
                                                <button
                                                    onClick={() => setSelectedStock(stock.ticker)}
                                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                                >
                                                    Voir détail
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Métriques principales */}
                                        <div className="space-y-3 mb-4">
                                            {claudeData?.metrics?.marketCap && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-200">Capitalisation:</span>
                                                    <span className="text-white font-semibold">{claudeData.metrics.marketCap}</span>
                                                </div>
                                            )}
                                            {claudeData?.metrics?.peRatio && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-200">P/E:</span>
                                                    <span className="text-white font-semibold">{claudeData.metrics.peRatio}</span>
                                                </div>
                                            )}
                                            {claudeData?.metrics?.dividendYield && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-200">Dividende:</span>
                                                    <span className="text-green-300 font-semibold">{claudeData.metrics.dividendYield}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Rating quantitatif */}
                                        {claudeData?.quantRating?.overall && (
                                            <div className="mb-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-blue-200">Rating Quantitatif:</span>
                                                    <span className={`px-3 py-1 rounded text-sm font-bold ${getGradeColor(claudeData.quantRating.overall)}`}>
                                                        {claudeData.quantRating.overall}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Recommandation courte */}
                                        {claudeData?.recommendation && (
                                            <div className="text-blue-100 text-sm line-clamp-3">
                                                {cleanText(claudeData.recommendation).substring(0, 150)}...
                                            </div>
                                        )}

                                        {/* Lien vers Seeking Alpha */}
                                        {stock.url && (
                                            <div className="mt-4 pt-4 border-t border-gray-500">
                                                <a 
                                                    href={stock.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-300 hover:text-blue-200 text-sm"
                                                >
                                                    Lire l'analyse complète →
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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

                    {/* Affichage en  liste si pas de cartes */}
                    {!selectedStock && (!seekingAlphaData.stocks || seekingAlphaData.stocks.length === 0) && tickers.length === 0 && (
                        <div className="seeking-alpha-card rounded-lg p-6 border border-gray-600">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Icon emoji="📋" size={24} />
                                Analyses Seeking Alpha
                            </h3>
                            <div className="text-center py-8">
                                <p className="text-gray-400 mb-4">Aucun ticker disponible. Ajoutez des tickers dans l'onglet "Titres & Nouvelles".</p>
                                <button
                                    onClick={() => setActiveTab('stocks-news')}
                                    className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Aller à Titres & Nouvelles →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Affichage en liste avec données */}
                    {!selectedStock && seekingAlphaData.stocks && seekingAlphaData.stocks.length > 0 && (
                        <div className="seeking-alpha-card rounded-lg p-6 border border-gray-600">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Icon emoji="📋" size={24} />
                                Analyses Seeking Alpha
                            </h3>
                            <div className="space-y-4">
                                {seekingAlphaData.stocks.map((stock, index) => {
                                    const ticker = stock.ticker;
                                    const claudeData = seekingAlphaStockData.stocks?.[ticker];
                                    const seekingAlphaItem = seekingAlphaData.stocks?.find(s => s.ticker === ticker);
                                    const parsedData = seekingAlphaItem?.parsedData;
                                    
                                    if (!claudeData && !parsedData) return null;
                                    
                                    return (
                                        <div key={index} className="bg-white rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="text-lg font-bold text-gray-800">{ticker}</h4>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openPeersComparison(ticker)}
                                                        className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs rounded-lg transition-all duration-300 shadow-lg"
                                                        title="Comparaison avec les peers"
                                                    >
                                                        🔍 Peers
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedStock(ticker)}
                                                        className="text-blue-600 hover:text-blue-700 text-sm"
                                                    >
                                                        Voir détail
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Métriques principales */}
                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                {claudeData?.metrics?.marketCap && (
                                                    <div>
                                                        <div className="text-gray-600 text-sm">Capitalisation</div>
                                                        <div className="text-gray-800 font-semibold">{claudeData.metrics.marketCap}</div>
                                                    </div>
                                                )}
                                                {claudeData?.metrics?.peRatio && (
                                                    <div>
                                                        <div className="text-gray-600 text-sm">P/E Ratio</div>
                                                        <div className="text-gray-800 font-semibold">{claudeData.metrics.peRatio}</div>
                                                    </div>
                                                )}
                                                {claudeData?.metrics?.dividendYield && (
                                                    <div>
                                                        <div className="text-gray-600 text-sm">Dividende</div>
                                                        <div className="text-green-600 font-semibold">{claudeData.metrics.dividendYield}</div>
                                                    </div>
                                                )}
                                                {claudeData?.quantRating?.overall && (
                                                    <div>
                                                        <div className="text-gray-600 text-sm">Rating</div>
                                                        <span className={`px-2 py-1 rounded text-sm font-bold ${getGradeColor(claudeData.quantRating.overall)}`}>
                                                            {claudeData.quantRating.overall}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Recommandation courte */}
                                            {claudeData?.recommendation && (
                                                <div className="text-gray-700 text-sm line-clamp-2">
                                                    {cleanText(claudeData.recommendation).substring(0, 200)}...
                                                </div>
                                            )}

                                            {/* Lien vers Seeking Alpha */}
                                            {seekingAlphaItem?.url && (
                                                <div className="mt-3 pt-3 border-t">
                                                    <a 
                                                        href={seekingAlphaItem.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-700 text-sm"
                                                    >
                                                        Lire l'analyse complète sur Seeking Alpha →
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            );

window.SeekingAlphaTab = SeekingAlphaTab;