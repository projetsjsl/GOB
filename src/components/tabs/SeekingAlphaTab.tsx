import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TabProps } from '../../types';

// Déclarations pour bibliothèques CDN
declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

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

            // ============================================================================
            // TEMPLATES HTML EMAIL
            // ============================================================================
            
            // FONCTION D'ENRICHISSEMENT MULTIMÉDIA
            // Convertit les tags [CHART], [TABLE], [SOURCE], etc. en HTML
            const enrichBriefingWithVisuals = (markdownContent, data) => {
                console.log('🎨 Enriching briefing with visuals...');
                let enriched = markdownContent;

                // 1. TABLEAUX - Convertir [TABLE:...] en HTML
                enriched = enriched.replace(/\[TABLE:([^\]]+)\]/g, (match, tableData) => {
                    const parts = tableData.split('|');
                    const tableName = parts[0];
                    const headers = parts[1]?.split(',') || [];
                    const rows = parts.slice(2);

                    let tableHtml = `\n\n<div style="margin: 20px 0; overflow-x: auto;">
<table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
<thead style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white;">
<tr>`;

                    headers.forEach(header => {
                        tableHtml += `<th style="padding: 12px; text-align: left; font-weight: 600;">${header.trim()}</th>`;
                    });

                    tableHtml += `</tr></thead><tbody>`;

                    rows.forEach((row, idx) => {
                        const cells = row.split(',');
                        const bgColor = idx % 2 === 0 ? '#f9fafb' : 'white';
                        tableHtml += `<tr style="background: ${bgColor};">`;
                        cells.forEach(cell => {
                            tableHtml += `<td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${cell.trim()}</td>`;
                        });
                        tableHtml += `</tr>`;
                    });

                    tableHtml += `</tbody></table></div>\n\n`;
                    return tableHtml;
                });

                // 2. CHARTS TRADINGVIEW - Widget embed
                enriched = enriched.replace(/\[CHART:TRADINGVIEW:([^:]+):([^\]]+)\]/g, (match, exchange, ticker) => {
                    return `\n\n<div style="margin: 20px 0;">
<iframe src="https://www.tradingview.com/embed-widget/mini-symbol-overview/?symbol=${exchange}%3A${ticker}&width=100%&height=350&locale=fr&dateRange=12M&colorTheme=light&isTransparent=false&autosize=true&largeChartUrl=https%3A%2F%2Fwww.tradingview.com%2Fsymbols%2F${exchange}-${ticker}%2F"
        style="width: 100%; height: 350px; border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
        frameborder="0"></iframe>
<p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 5px;">Source: TradingView - ${ticker}</p>
</div>\n\n`;
                });

                // 3. CHARTS FINVIZ - Image directe
                enriched = enriched.replace(/\[CHART:FINVIZ:([^\]]+)\]/g, (match, ticker) => {
                    if (ticker === 'SECTORS') {
                        return `\n\n<div style="margin: 20px 0; text-align: center;">
<img src="https://finviz.com/grp_image.ashx?bar_sector_t.png"
     alt="Heatmap Sectorielle"
     style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
<p style="color: #6b7280; font-size: 12px; margin-top: 5px;">Source: Finviz - Heatmap Sectorielle en temps réel</p>
</div>\n\n`;
                    } else {
                        return `\n\n<div style="margin: 20px 0; text-align: center;">
<img src="https://finviz.com/chart.ashx?t=${ticker}&ty=c&ta=1&p=d&s=l"
     alt="${ticker} Chart"
     style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
<p style="color: #6b7280; font-size: 12px; margin-top: 5px;">Source: Finviz - ${ticker} Daily Chart</p>
</div>\n\n`;
                    }
                });

                // 4. LOGOS - Clearbit Logo API
                enriched = enriched.replace(/\[LOGO:([^\]]+)\]/g, (match, ticker) => {
                    const companyDomains = {
                        'AAPL': 'apple.com',
                        'MSFT': 'microsoft.com',
                        'GOOGL': 'google.com',
                        'AMZN': 'amazon.com',
                        'TSLA': 'tesla.com',
                        'META': 'meta.com',
                        'NVDA': 'nvidia.com'
                    };
                    const domain = companyDomains[ticker] || `${ticker.toLowerCase()}.com`;
                    return `<img src="https://logo.clearbit.com/${domain}" alt="${ticker} logo" style="height: 24px; width: auto; margin: 0 5px; vertical-align: middle;" onerror="this.style.display='none'" />`;
                });

                // 5. SOURCES - Liens web formatés
                enriched = enriched.replace(/\[SOURCE:([^|]+)\|([^\]]+)\]/g, (match, sourceName, url) => {
                    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none; border-bottom: 1px dotted #2563eb; transition: all 0.2s;" onmouseover="this.style.borderBottom='1px solid #2563eb'" onmouseout="this.style.borderBottom='1px dotted #2563eb'">${sourceName}</a>`;
                });

                // 6. TIMELINE - Événements visuels
                enriched = enriched.replace(/\[TIMELINE:EVENTS\]/g, () => {
                    return `\n\n<div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #3b82f6; border-radius: 8px;">
<h4 style="margin: 0 0 15px 0; color: #1e40af; display: flex; align-items: center;">
    <span style="font-size: 24px; margin-right: 10px;">📅</span>
    Timeline des Événements Clés
</h4>
<div style="font-size: 14px; color: #334155; line-height: 1.8;">
    <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 6px;">
        <strong>🔔 Prochaines 24h:</strong> Résultats trimestriels attendus, annonces Fed/BCE, données économiques majeures
    </div>
</div>
</div>\n\n`;
                });

                // 7. SCREENSHOT (placeholder pour futur)
                enriched = enriched.replace(/\[SCREENSHOT:([^:]+):([^\]]+)\]/g, (match, ticker, timeframe) => {
                    return `\n\n<div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; text-align: center;">
<p style="color: #6b7280; margin: 0;">📸 Screenshot Chart ${ticker} (${timeframe}) - Disponible prochainement</p>
</div>\n\n`;
                });

                console.log('✅ Briefing enriched with visuals');
                return enriched;
            };

            const createMorningBriefingHTML = (analysis, data) => {
                // ============================================================================
                // EMMA EN DIRECT - MORNING BRIEFING - TEMPLATE EXPERT
                // ============================================================================
                
                const expertModules = data.expert_modules || {};
                const watchlist = data.watchlist || {};
                
                return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emma En Direct · Matin</title>
  <style>
    body {
      font-family: 'Segoe UI', 'Arial', sans-serif;
      background: #f4f7fa;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
      color: #1f2937;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .beta-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      background: #fbbf24;
      color: #78350f;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .emma-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 4px solid white;
      margin-bottom: 15px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header-subtitle {
      margin: 10px 0 0;
      font-size: 14px;
      opacity: 0.95;
      font-weight: 400;
    }
    .header-time {
      margin: 5px 0 0;
      font-size: 12px;
      opacity: 0.85;
      font-style: italic;
    }
    .content {
      padding: 35px;
    }
    .section {
      margin-bottom: 35px;
    }
    .section-title {
      color: #1e40af;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 18px;
      padding-bottom: 10px;
      border-bottom: 3px solid #1e40af;
      display: flex;
      align-items: center;
    }
    .section-title-icon {
      margin-right: 10px;
      font-size: 24px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 18px;
      margin: 20px 0;
    }
    .metric-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 18px;
      border-radius: 8px;
      border-left: 5px solid #3b82f6;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }
    .metric-label {
      font-size: 12px;
      color: #475569;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .metric-value {
      font-size: 26px;
      font-weight: 800;
      margin: 8px 0;
      color: #0f172a;
    }
    .metric-change {
      font-size: 14px;
      font-weight: 600;
    }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .neutral { color: #6b7280; }
    .analysis-content {
      background: #f8fafc;
      padding: 25px;
      border-radius: 10px;
      border-left: 5px solid #3b82f6;
      margin: 20px 0;
      white-space: pre-wrap;
      font-size: 15px;
      line-height: 1.8;
    }
    .news-item {
      background: white;
      padding: 18px;
      border-radius: 8px;
      border-left: 4px solid #10b981;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .news-ticker {
      font-weight: 800;
      color: #1e40af;
      font-size: 14px;
      margin-bottom: 6px;
    }
    .news-title {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 6px;
      font-size: 15px;
    }
    .news-meta {
      font-size: 12px;
      color: #64748b;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .table th {
      background: #1e40af;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 700;
      font-size: 13px;
    }
    .table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .table tr:hover {
      background: #f8fafc;
    }
    .beta-warning {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 20px;
      border-left: 5px solid #f59e0b;
      border-radius: 8px;
      margin: 25px 0;
    }
    .beta-warning-title {
      font-weight: 700;
      color: #92400e;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .beta-warning-text {
      color: #78350f;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer {
      background: #f8fafc;
      padding: 30px 35px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
    }
    .footer-logo {
      height: 45px;
      margin-bottom: 15px;
      opacity: 0.9;
    }
    .footer-brand {
      font-weight: 700;
      color: #1e40af;
      font-size: 15px;
      margin-bottom: 8px;
    }
    .footer-tagline {
      color: #64748b;
      font-size: 12px;
      margin-bottom: 15px;
      font-style: italic;
    }
    .footer-disclaimer {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }
    .footer-legal {
      color: #94a3b8;
      font-size: 10px;
      margin-top: 10px;
    }
    .cta-button {
      display: inline-block;
      background: #1e40af;
      color: white !important;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 20px;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.3s;
    }
    .cta-button:hover {
      background: #1e3a8a;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header Emma En Direct -->
    <div class="header">
      <div class="beta-badge">BÊTA v1.0</div>
      <h1>📡 Emma En Direct · Matin</h1>
      <div class="header-subtitle">L'analyse des marchés, sans filtre</div>
      <div class="header-time">${new Date().toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Toronto'
      })} ET</div>
    </div>
    
    <div class="content">
      <!-- Beta Warning -->
      <div class="beta-warning">
        <div class="beta-warning-title">🔬 VERSION BÊTA EN DÉVELOPPEMENT</div>
        <div class="beta-warning-text">
          Emma En Direct est actuellement en phase de test. Nous perfectionnons nos algorithmes et sources de données. 
          <strong>Veuillez toujours vérifier les informations auprès de sources officielles</strong> avant toute décision d'investissement. 
          Vos retours sont précieux pour améliorer ce service !
        </div>
      </div>
      
      <!-- Marchés Asiatiques -->
      ${data.asian_markets ? `
      <div class="section">
        <div class="section-title">
          <span class="section-title-icon">🌏</span>
          Marchés Asiatiques (Clôture)
        </div>
        <div class="metric-grid">
          ${data.asian_markets.map((market) => `
            <div class="metric-card">
              <div class="metric-label">${market.name}</div>
              <div class="metric-value">${market.price ? market.price.toFixed(2) : 'N/A'}</div>
              <div class="metric-change ${market.change >= 0 ? 'positive' : 'negative'}">
                ${market.change >= 0 ? '+' : ''}${market.change ? market.change.toFixed(2) : 'N/A'} 
                (${market.changePct >= 0 ? '+' : ''}${market.changePct ? market.changePct.toFixed(2) : 'N/A'}%)
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <!-- Futures US -->
      ${data.futures ? `
      <div class="section">
        <div class="section-title">
          <span class="section-title-icon">📈</span>
          Futures US
        </div>
        <div class="metric-grid">
          ${data.futures.map((future) => `
            <div class="metric-card">
              <div class="metric-label">${future.name}</div>
              <div class="metric-value">${future.price ? future.price.toFixed(2) : 'N/A'}</div>
              <div class="metric-change ${future.change >= 0 ? 'positive' : 'negative'}">
                ${future.change >= 0 ? '+' : ''}${future.change ? future.change.toFixed(2) : 'N/A'} 
                (${future.changePct >= 0 ? '+' : ''}${future.changePct ? future.changePct.toFixed(2) : 'N/A'}%)
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <!-- MODULES EXPERT EMMA -->
      
      <!-- Courbes de Taux US + CA -->
      ${expertModules.yield_curves ? `
      <div class="section">
        <div class="section-title">
          <span class="section-title-icon">💵</span>
          Courbes de Taux US & Canada
        </div>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">🇺🇸 US 2Y</div>
            <div class="metric-value">${expertModules.yield_curves.us?.terms['2y']?.toFixed(2) || 'N/A'}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">🇺🇸 US 10Y</div>
            <div class="metric-value">${expertModules.yield_curves.us?.terms['10y']?.toFixed(2) || 'N/A'}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">🇨🇦 CA 2Y</div>
            <div class="metric-value">${expertModules.yield_curves.ca?.terms['2y']?.toFixed(2) || 'N/A'}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">🇨🇦 CA 10Y</div>
            <div class="metric-value">${expertModules.yield_curves.ca?.terms['10y']?.toFixed(2) || 'N/A'}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Spread US 2-10Y</div>
            <div class="metric-value ${expertModules.yield_curves.us?.spreads['2y-10y'] < 0 ? 'negative' : 'positive'}">
              ${expertModules.yield_curves.us?.spreads['2y-10y']?.toFixed(2) || 'N/A'}%
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Différentiel 10Y US-CA</div>
            <div class="metric-value">${expertModules.yield_curves.us_ca_differential?.['10y']?.toFixed(2) || 'N/A'} pb</div>
          </div>
        </div>
      </div>
      ` : ''}
      
      <!-- Forex Détaillé -->
      ${expertModules.forex_detailed ? `
      <div class="section">
        <div class="section-title">
          <span class="section-title-icon">💱</span>
          Devises vs USD & CAD
        </div>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">EUR/USD</div>
            <div class="metric-value">${expertModules.forex_detailed.vs_usd?.EUR?.toFixed(4) || 'N/A'}</div>
            <div class="metric-change ${expertModules.forex_detailed.changes_24h_pct?.['EUR/USD'] >= 0 ? 'positive' : 'negative'}">
              ${expertModules.forex_detailed.changes_24h_pct?.['EUR/USD']}%
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">GBP/USD</div>
            <div class="metric-value">${expertModules.forex_detailed.vs_usd?.GBP?.toFixed(4) || 'N/A'}</div>
            <div class="metric-change ${expertModules.forex_detailed.changes_24h_pct?.['GBP/USD'] >= 0 ? 'positive' : 'negative'}">
              ${expertModules.forex_detailed.changes_24h_pct?.['GBP/USD']}%
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">USD/CAD</div>
            <div class="metric-value">${expertModules.forex_detailed.vs_usd?.CAD?.toFixed(4) || 'N/A'}</div>
            <div class="metric-change ${expertModules.forex_detailed.changes_24h_pct?.['USD/CAD'] >= 0 ? 'positive' : 'negative'}">
              ${expertModules.forex_detailed.changes_24h_pct?.['USD/CAD']}%
            </div>
          </div>
        </div>
      </div>
      ` : ''}
      
      <!-- Volatilité VIX + MOVE -->
      ${expertModules.volatility_advanced ? `
      <div class="section">
        <div class="section-title">
          <span class="section-title-icon">📊</span>
          Volatilité & Sentiment
        </div>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">VIX (CBOE)</div>
            <div class="metric-value">${expertModules.volatility_advanced.vix?.level?.toFixed(2) || 'N/A'}</div>
            <div class="metric-change neutral">${expertModules.volatility_advanced.vix?.interpretation || 'N/A'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">MOVE Index (ICE)</div>
            <div class="metric-value">${expertModules.volatility_advanced.move?.level?.toFixed(0) || 'N/A'}</div>
            <div class="metric-change neutral">${expertModules.volatility_advanced.move?.interpretation || 'N/A'}</div>
          </div>
        </div>
      </div>
      ` : ''}
      
      <!-- Commodities -->
      ${expertModules.commodities ? `
      <div class="section">
        <div class="section-title">
          <span class="section-title-icon">🧭</span>
          Matières Premières
        </div>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">🛢️ WTI (USD/bbl)</div>
            <div class="metric-value">${expertModules.commodities.wti?.price?.toFixed(2) || 'N/A'}</div>
            <div class="metric-change ${expertModules.commodities.wti?.change_pct >= 0 ? 'positive' : 'negative'}">
              ${expertModules.commodities.wti?.change_pct}%
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">🪙 Or (USD/oz)</div>
            <div class="metric-value">${expertModules.commodities.gold?.price?.toFixed(0) || 'N/A'}</div>
            <div class="metric-change ${expertModules.commodities.gold?.change_pct >= 0 ? 'positive' : 'negative'}">
              ${expertModules.commodities.gold?.change_pct}%
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">🔧 Cuivre (USD/lb)</div>
            <div class="metric-value">${expertModules.commodities.copper?.price?.toFixed(2) || 'N/A'}</div>
            <div class="metric-change ${expertModules.commodities.copper?.change_pct >= 0 ? 'positive' : 'negative'}">
              ${expertModules.commodities.copper?.change_pct}%
            </div>
          </div>
        </div>
      </div>
      ` : ''}
      
      <!-- Top Nouvelles Tickers Suivis -->
      ${expertModules.tickers_news?.main_tickers && expertModules.tickers_news.main_tickers.length > 0 ? `
      <div class="section">
        <div class="section-title">
          <span class="section-title-icon">📰</span>
          Top Nouvelles - Tickers Suivis
        </div>
        ${expertModules.tickers_news.main_tickers.slice(0, 5).map(news => `
          <div class="news-item">
            <div class="news-ticker">${news.ticker}</div>
            <div class="news-title">${news.title}</div>
            <div class="news-meta">${news.source} • ${news.time}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      <!-- Watchlist Dan - Analyse Rapide -->
      ${expertModules.tickers_news?.watchlist_dan && expertModules.tickers_news.watchlist_dan.length > 0 ? `
      <div class="section">
        <div class="section-title">
          <span class="section-title-icon">⭐</span>
          Watchlist Dan - Analyse Rapide
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Actualité Clé</th>
              <th>Heure</th>
            </tr>
          </thead>
          <tbody>
            ${expertModules.tickers_news.watchlist_dan.slice(0, 10).map(ticker => `
              <tr>
                <td style="font-weight: 700; color: #1e40af;">${ticker.ticker}</td>
                <td>${ticker.title}</td>
                <td style="font-size: 12px; color: #64748b;">${ticker.time}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <!-- Analyse IA Emma -->
      <div class="section">
        <div class="section-title">
          <span class="section-title-icon">🤖</span>
          Analyse Emma - Perspective Stratégique
        </div>
        <div class="analysis-content">${analysis}</div>
      </div>
      
      <a href="${window.location.origin}" class="cta-button">
        📊 Voir le Dashboard Complet →
      </a>
    </div>
    
    <!-- Footer Emma En Direct -->
    <div class="footer">
      <div class="footer-brand">Emma En Direct</div>
      <div class="footer-tagline">L'analyse des marchés, sans filtre · Powered by JSL AI</div>
      
      <div class="footer-disclaimer">
        <strong>⚠️ AVERTISSEMENT IMPORTANT</strong><br/>
        Emma En Direct fournit des analyses éducatives basées sur des données publiques. 
        Ce contenu ne constitue pas un conseil en investissement personnalisé. 
        Consultez toujours un conseiller financier qualifié avant toute décision d'investissement. 
        Les performances passées ne garantissent pas les résultats futurs.
      </div>
      
      <div class="footer-legal">
        Sources : ${expertModules.sources_status ? Object.values(expertModules.sources_status).join(', ') : 'Yahoo Finance, Alpha Vantage, FMP, Finnhub, Perplexity, OpenAI'}<br/>
        © ${new Date().getFullYear()} JSL AI - Emma En Direct. Tous droits réservés.
      </div>
    </div>
  </div>
</body>
</html>
                `;
            };

            const createNoonBriefingHTML = (analysis, data) => {
                return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f4f4f4;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .timestamp {
      opacity: 0.9;
      font-size: 14px;
      margin-top: 8px;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      color: #f59e0b;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #f59e0b;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .metric-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #f59e0b;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 700;
      margin: 5px 0;
    }
    .metric-change {
      font-size: 14px;
      font-weight: 600;
    }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .neutral { color: #6b7280; }
    .analysis-content {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      margin: 15px 0;
      white-space: pre-wrap;
    }
    .mover-list {
      list-style: none;
      padding: 0;
    }
    .mover-item {
      background: #f8f9fa;
      padding: 12px;
      margin: 8px 0;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cta-button {
      display: inline-block;
      background: #f59e0b;
      color: white !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 15px;
      font-weight: 600;
    }
    .footer {
      background: #1f2937;
      color: white;
      padding: 20px 30px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ Update Mi-Journée</h1>
      <div class="timestamp">${new Date().toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</div>
    </div>
    
    <div class="content">
      ${data.us_markets ? `
      <div class="section">
        <div class="section-title">📊 Marchés US (Mi-séance)</div>
        <div class="metric-grid">
          ${data.us_markets.map((market) => `
            <div class="metric-card">
              <div class="metric-label">${market.name}</div>
              <div class="metric-value">${market.price ? market.price.toFixed(2) : 'N/A'}</div>
              <div class="metric-change ${market.change >= 0 ? 'positive' : 'negative'}">
                ${market.change >= 0 ? '+' : ''}${market.change ? market.change.toFixed(2) : 'N/A'} 
                (${market.changePct >= 0 ? '+' : ''}${market.changePct ? market.changePct.toFixed(2) : 'N/A'}%)
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      ${data.top_movers ? `
      <div class="section">
        <div class="section-title">🚀 Top Movers</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h4 style="color: #10b981; margin-bottom: 10px;">📈 Hausses</h4>
            <ul class="mover-list">
              ${data.top_movers.gainers?.map((stock) => `
                <li class="mover-item">
                  <strong>${stock.symbol}</strong>
                  <span class="positive">+${(() => {
                    const change = stock.change;
                    if (!change) return '0.00';
                    if (typeof change === 'number') return change.toFixed(2);
                    if (typeof change === 'object') return (change.raw || change.fmt || 0).toFixed(2);
                    return (parseFloat(change) || 0).toFixed(2);
                  })()}%</span>
                </li>
              `).join('') || ''}
            </ul>
          </div>
          <div>
            <h4 style="color: #ef4444; margin-bottom: 10px;">📉 Baisses</h4>
            <ul class="mover-list">
              ${data.top_movers.losers?.map((stock) => `
                <li class="mover-item">
                  <strong>${stock.symbol}</strong>
                  <span class="negative">${(() => {
                    const change = stock.change;
                    if (!change) return '0.00';
                    if (typeof change === 'number') return change.toFixed(2);
                    if (typeof change === 'object') return (change.raw || change.fmt || 0).toFixed(2);
                    return (parseFloat(change) || 0).toFixed(2);
                  })()}%</span>
                </li>
              `).join('') || ''}
            </ul>
          </div>
        </div>
      </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">🤖 Analyse IA</div>
        <div class="analysis-content">${analysis}</div>
      </div>
      
      <a href="${window.location.origin}" class="cta-button">
        Voir le dashboard complet →
      </a>
    </div>
    
    <div class="footer">
      <p><strong>Financial AI Dashboard</strong> - Analyse automatisée</p>
      <p>Sources : Yahoo Finance, OpenAI GPT-4, Perplexity</p>
      <p style="opacity:0.7; margin-top: 10px;">
        ⚠️ Analyse à titre informatif uniquement
      </p>
    </div>
  </div>
</body>
</html>
                `;
            };

            const createEveningBriefingHTML = (analysis, data) => {
                return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f4f4f4;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .timestamp {
      opacity: 0.9;
      font-size: 14px;
      margin-top: 8px;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      color: #1e40af;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #1e40af;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .metric-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #1e40af;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 700;
      margin: 5px 0;
    }
    .metric-change {
      font-size: 14px;
      font-weight: 600;
    }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .neutral { color: #6b7280; }
    .analysis-content {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      margin: 15px 0;
      white-space: pre-wrap;
    }
    .summary-box {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #1e40af;
    }
    .cta-button {
      display: inline-block;
      background: #1e40af;
      color: white !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 15px;
      font-weight: 600;
    }
    .footer {
      background: #1f2937;
      color: white;
      padding: 20px 30px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌙 Rapport de Clôture</h1>
      <div class="timestamp">${new Date().toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</div>
    </div>
    
    <div class="content">
      ${data.us_markets ? `
      <div class="section">
        <div class="section-title">📊 Performance Finale</div>
        <div class="metric-grid">
          ${data.us_markets.map((market) => `
            <div class="metric-card">
              <div class="metric-label">${market.name}</div>
              <div class="metric-value">${market.price ? market.price.toFixed(2) : 'N/A'}</div>
              <div class="metric-change ${market.change >= 0 ? 'positive' : 'negative'}">
                ${market.change >= 0 ? '+' : ''}${market.change ? market.change.toFixed(2) : 'N/A'} 
                (${market.changePct >= 0 ? '+' : ''}${market.changePct ? market.changePct.toFixed(2) : 'N/A'}%)
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">🤖 Analyse Approfondie</div>
        <div class="analysis-content">${analysis}</div>
      </div>
      
      <div class="summary-box">
        <h3 style="margin-top: 0; color: #1e40af;">📅 À Surveiller Demain</h3>
        <p>Les catalyseurs et événements clés pour la prochaine séance sont détaillés dans l'analyse ci-dessus.</p>
      </div>
      
      <a href="${window.location.origin}" class="cta-button">
        Dashboard Complet →
      </a>
    </div>
    
    <div class="footer">
      <p><strong>Financial AI Dashboard</strong> - Rapport journalier automatisé</p>
      <p>Sources : Yahoo Finance, OpenAI GPT-4, Perplexity</p>
      <p style="opacity:0.7; margin-top: 10px;">
        ⚠️ Analyse à titre informatif uniquement - Pas de conseil d'investissement
      </p>
    </div>
  </div>
</body>
</html>
                `;
            };

            // ============================================================================
            // COMPOSANT EMAIL BRIEFINGS TAB
            // ============================================================================
            
            // Composant EmailRecipientsManager pour gérer les destinataires email (Supabase)

export default SeekingAlphaTab;
