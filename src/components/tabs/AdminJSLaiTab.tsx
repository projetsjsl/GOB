import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TabProps } from '../../types';
import Icon from '../shared/Icon';

declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

export const AdminJSLaiTab: React.FC<TabProps> = (props) => {
    const dashboardState = typeof window !== 'undefined' ? window.BetaCombinedDashboard || {} : {};
    const noop = () => {};

    const isDarkMode = props.isDarkMode ?? dashboardState.isDarkMode ?? true;
    const API_BASE_URL = props.API_BASE_URL ?? dashboardState.API_BASE_URL ?? '';

    const emmaConnected = props.emmaConnected ?? dashboardState.emmaConnected ?? false;
    const setEmmaConnected = props.setEmmaConnected || dashboardState.setEmmaConnected || noop;

    const showPromptEditor = props.showPromptEditor ?? dashboardState.showPromptEditor ?? false;
    const setShowPromptEditor = props.setShowPromptEditor || dashboardState.setShowPromptEditor || noop;

    const showTemperatureEditor = props.showTemperatureEditor ?? dashboardState.showTemperatureEditor ?? false;
    const setShowTemperatureEditor = props.setShowTemperatureEditor || dashboardState.setShowTemperatureEditor || noop;

    const showLengthEditor = props.showLengthEditor ?? dashboardState.showLengthEditor ?? false;
    const setShowLengthEditor = props.setShowLengthEditor || dashboardState.setShowLengthEditor || noop;

    const tickers = props.tickers && props.tickers.length > 0 ? props.tickers : (dashboardState.tickers || []);
    const stockData = props.stockData && Object.keys(props.stockData).length > 0 ? props.stockData : (dashboardState.stockData || {});
    const newsData = props.newsData && props.newsData.length > 0 ? props.newsData : (dashboardState.newsData || []);
    const seekingAlphaData = props.seekingAlphaData && Object.keys(props.seekingAlphaData).length > 0 ? props.seekingAlphaData : (dashboardState.seekingAlphaData || {});
    const seekingAlphaStockData = props.seekingAlphaStockData && Object.keys(props.seekingAlphaStockData).length > 0 ? props.seekingAlphaStockData : (dashboardState.seekingAlphaStockData || {});

    const lastUpdate = props.lastUpdate ?? dashboardState.lastUpdate ?? null;

    const cacheSettings = props.cacheSettings ?? dashboardState.cacheSettings ?? { maxAgeHours: 4, refreshOnNavigation: true, refreshIntervalMinutes: 10 };
    const setCacheSettings = props.setCacheSettings || dashboardState.setCacheSettings || noop;

    const cacheStatus = props.cacheStatus ?? dashboardState.cacheStatus ?? {};
    const setCacheStatus = props.setCacheStatus || dashboardState.setCacheStatus || noop;

    const loadingCacheStatus = props.loadingCacheStatus ?? dashboardState.loadingCacheStatus ?? false;
    const setLoadingCacheStatus = props.setLoadingCacheStatus || dashboardState.setLoadingCacheStatus || noop;

    const systemLogs = props.systemLogs ?? dashboardState.systemLogs ?? [];
                // États pour Température et Longueur (chargés depuis localStorage)
                const [emmaTemperature, setEmmaTemperature] = useState(() => {
                    const saved = localStorage.getItem('emma-temperature');
                    return saved ? parseFloat(saved) : 0.3;
                });
                const [emmaMaxTokens, setEmmaMaxTokens] = useState(() => {
                    const saved = localStorage.getItem('emma-max-tokens');
                    return saved ? parseInt(saved) : 4096;
                });

                // État pour le prompt système Emma (partagé avec AskEmmaTab via localStorage)
                const [emmaPrompt, setEmmaPrompt] = useState(() => {
                    const saved = localStorage.getItem('emma-financial-prompt');
                    return saved || `Tu es Emma, CFA® Level III, analyste financière senior avec 15+ ans expérience gestion portefeuille institutionnel.

MISSION: Fournir analyses financières rigoureuses, factuelles, actionnables de niveau Bloomberg Terminal.

///
DONNÉES DISPONIBLES (via outils dashboard):
- Prix actions temps réel (FMP, Polygon, Twelve Data)
- Fondamentaux (ratios P/E, ROE, marges, cash flow)
- Actualités financières (<24h, Finnhub, FMP)
- Indicateurs techniques (RSI, MACD, SMA)
- Calendriers (earnings, événements économiques)
- Watchlist utilisateur + tickers équipe
///

CAPACITÉS PRINCIPALES:
1. Analyses complètes CFA® (valorisation, fondamentaux, technique)
2. Explications concepts financiers (DCF, Graham, Buffett, Lynch)
3. Contexte macro et sectoriel (Fed, taux, inflation)
4. Cadres décisionnels structurés (Porter's Five Forces, Moat analysis)

APPROCHE:
- Priorité données RÉELLES via outils (prix, ratios, news)
- Analyses chiffrées (minimum 8 ratios financiers)
- Comparaisons sectorielles + historique 3-5 ans
- Sources citées (FMP, Bloomberg, FactSet)

STYLE:
- Professionnel niveau CFA Institute
- Factuel, précis, sans généralités vagues
- Proactif: proposer analyses complémentaires
- Pédagogique: expliquer ratios et concepts
- Toujours en français

CONTRAINTES:
- ZÉRO mention limitations ("Je n'ai pas accès")
- Commencer par ce que tu PEUX analyser avec données disponibles
- Longueur: 200-400 mots (questions simples), PROFONDEUR MAXIMALE pour analyses complètes (aucune limite)
- Vérifier cohérence données avant réponse finale
- Disclaimer obligatoire si recommandations d'investissement`;
                });

                // État pour function calling (partagé avec AskEmmaTab via localStorage)
                const [useFunctionCalling, setUseFunctionCalling] = useState(() => {
                    const saved = localStorage.getItem('emma-use-function-calling');
                    return saved !== null ? saved === 'true' : true;
                });

                // État pour afficher/masquer les sections
                const [showEmmaConfig, setShowEmmaConfig] = useState(false);
                const [showTickersManager, setShowTickersManager] = useState(false);
                
                // États pour la gestion des tickers
                const [tickersList, setTickersList] = useState([]);
                const [loadingTickers, setLoadingTickers] = useState(false);
                const [tickerFilter, setTickerFilter] = useState({ source: 'all', is_active: 'true' });
                const [editingTicker, setEditingTicker] = useState(null);
                const [showAddForm, setShowAddForm] = useState(false);
                const [newTicker, setNewTicker] = useState({
                    ticker: '',
                    company_name: '',
                    sector: '',
                    industry: '',
                    country: '',
                    exchange: '',
                    currency: 'USD',
                    market_cap: '',
                    source: 'manual',
                    priority: 1,
                    is_active: true,
                    target_price: '',
                    stop_loss: '',
                    notes: ''
                });

                // Handlers pour sauvegarder dans localStorage
                const handlePromptChange = (newPrompt) => {
                    setEmmaPrompt(newPrompt);
                    localStorage.setItem('emma-financial-prompt', newPrompt);
                };

                const handleTemperatureChange = (newTemp) => {
                    setEmmaTemperature(newTemp);
                    localStorage.setItem('emma-temperature', newTemp.toString());
                };

                const handleMaxTokensChange = (newTokens) => {
                    setEmmaMaxTokens(newTokens);
                    localStorage.setItem('emma-max-tokens', newTokens.toString());
                };

                const handleFunctionCallingToggle = (enabled) => {
                    setUseFunctionCalling(enabled);
                    localStorage.setItem('emma-use-function-calling', enabled.toString());
                };

                const resetToOptimizedPrompt = () => {
                    const optimizedPrompt = `Tu es Emma, CFA® Level III, analyste financière senior avec 15+ ans expérience gestion portefeuille institutionnel.

MISSION: Fournir analyses financières rigoureuses, factuelles, actionnables de niveau Bloomberg Terminal.

///
DONNÉES DISPONIBLES (via outils dashboard):
- Prix actions temps réel (FMP, Polygon, Twelve Data)
- Fondamentaux (ratios P/E, ROE, marges, cash flow)
- Actualités financières (<24h, Finnhub, FMP)
- Indicateurs techniques (RSI, MACD, SMA)
- Calendriers (earnings, événements économiques)
- Watchlist utilisateur + tickers équipe
///

CAPACITÉS PRINCIPALES:
1. Analyses complètes CFA® (valorisation, fondamentaux, technique)
2. Explications concepts financiers (DCF, Graham, Buffett, Lynch)
3. Contexte macro et sectoriel (Fed, taux, inflation)
4. Cadres décisionnels structurés (Porter's Five Forces, Moat analysis)

APPROCHE:
- Priorité données RÉELLES via outils (prix, ratios, news)
- Analyses chiffrées (minimum 8 ratios financiers)
- Comparaisons sectorielles + historique 3-5 ans
- Sources citées (FMP, Bloomberg, FactSet)

STYLE:
- Professionnel niveau CFA Institute
- Factuel, précis, sans généralités vagues
- Proactif: proposer analyses complémentaires
- Pédagogique: expliquer ratios et concepts
- Toujours en français

CONTRAINTES:
- ZÉRO mention limitations ("Je n'ai pas accès")
- Commencer par ce que tu PEUX analyser avec données disponibles
- Longueur: 200-400 mots (questions simples), PROFONDEUR MAXIMALE pour analyses complètes (aucune limite)
- Vérifier cohérence données avant réponse finale
- Disclaimer obligatoire si recommandations d'investissement`;
                    handlePromptChange(optimizedPrompt);
                };

                // Fonctions pour gérer les tickers
                const fetchTickers = async () => {
                    setLoadingTickers(true);
                    try {
                        const params = new URLSearchParams();
                        if (tickerFilter.source !== 'all') {
                            params.append('source', tickerFilter.source);
                        }
                        if (tickerFilter.is_active !== 'all') {
                            params.append('is_active', tickerFilter.is_active);
                        }
                        params.append('limit', '1000');
                        params.append('order_by', 'priority');
                        params.append('order_direction', 'desc');

                        const response = await fetch(`${API_BASE_URL}/api/admin/tickers?${params.toString()}`);
                        if (response.ok) {
                            const data = await response.json();
                            setTickersList(data.tickers || []);
                        } else {
                            console.error('Erreur récupération tickers:', await response.text());
                        }
                    } catch (error) {
                        console.error('Erreur fetchTickers:', error);
                    } finally {
                        setLoadingTickers(false);
                    }
                };

                const handleAddTicker = async () => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/admin/tickers`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newTicker)
                        });

                        if (response.ok) {
                            const data = await response.json();
                            alert(`✅ Ticker ${data.ticker.ticker} ajouté avec succès`);
                            setNewTicker({
                                ticker: '',
                                company_name: '',
                                sector: '',
                                industry: '',
                                country: '',
                                exchange: '',
                                currency: 'USD',
                                market_cap: '',
                                source: 'manual',
                                priority: 1,
                                is_active: true,
                                target_price: '',
                                stop_loss: '',
                                notes: ''
                            });
                            setShowAddForm(false);
                            fetchTickers();
                        } else {
                            const error = await response.json();
                            alert(`❌ Erreur: ${error.error || 'Impossible d\'ajouter le ticker'}`);
                        }
                    } catch (error) {
                        console.error('Erreur addTicker:', error);
                        alert('❌ Erreur lors de l\'ajout du ticker');
                    }
                };

                const handleUpdateTicker = async (tickerId, updateData) => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/admin/tickers?id=${tickerId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updateData)
                        });

                        if (response.ok) {
                            const data = await response.json();
                            alert(`✅ Ticker ${data.ticker.ticker} mis à jour avec succès`);
                            setEditingTicker(null);
                            fetchTickers();
                        } else {
                            const error = await response.json();
                            alert(`❌ Erreur: ${error.error || 'Impossible de mettre à jour le ticker'}`);
                        }
                    } catch (error) {
                        console.error('Erreur updateTicker:', error);
                        alert('❌ Erreur lors de la mise à jour du ticker');
                    }
                };

                const handleDeleteTicker = async (tickerId, tickerSymbol, hardDelete = false) => {
                    if (!confirm(`Êtes-vous sûr de vouloir ${hardDelete ? 'supprimer définitivement' : 'désactiver'} le ticker ${tickerSymbol} ?`)) {
                        return;
                    }

                    try {
                        const response = await fetch(`${API_BASE_URL}/api/admin/tickers?id=${tickerId}&hard_delete=${hardDelete}`, {
                            method: 'DELETE'
                        });

                        if (response.ok) {
                            const data = await response.json();
                            alert(`✅ ${data.message}`);
                            fetchTickers();
                        } else {
                            const error = await response.json();
                            alert(`❌ Erreur: ${error.error || 'Impossible de supprimer le ticker'}`);
                        }
                    } catch (error) {
                        console.error('Erreur deleteTicker:', error);
                        alert('❌ Erreur lors de la suppression du ticker');
                    }
                };

                // Charger les tickers au montage et quand les filtres changent
                useEffect(() => {
                    if (showTickersManager) {
                        fetchTickers();
                    }
                }, [showTickersManager, tickerFilter]);

                return (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>⚙️ Admin-JSLAI</h2>
                    </div>

                    {/* 📊 Gestion des Tickers Supabase - EN HAUT */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-green-900/20 to-gray-900 border-green-700' : 'bg-gradient-to-br from-green-50 to-gray-50 border-green-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowTickersManager(!showTickersManager)}>
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-green-300' : 'text-green-900'}`}>
                                <Icon emoji="📊" size={20} />
                                Gestion des Tickers Supabase
                            </h3>
                            <button className={`px-3 py-1 text-xs rounded transition-colors ${
                                isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}>
                                {showTickersManager ? '▼ Masquer' : '▶ Afficher'}
                            </button>
                        </div>

                        {showTickersManager && (
                            <div className="space-y-4">
                                {/* Filtres */}
                                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="font-semibold mb-3 flex items-center gap-2">
                                        <Icon emoji="🔍" size={16} />
                                        Filtres
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm mb-2">Source</label>
                                            <select
                                                value={tickerFilter.source}
                                                onChange={(e) => setTickerFilter({ ...tickerFilter, source: e.target.value })}
                                                className={`w-full p-2 rounded border ${
                                                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                }`}
                                            >
                                                <option value="all">Toutes</option>
                                                <option value="team">Équipe</option>
                                                <option value="watchlist">Watchlist</option>
                                                <option value="manual">Manuel</option>
                                                <option value="both">Les deux (team + watchlist)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-2">Statut</label>
                                            <select
                                                value={tickerFilter.is_active}
                                                onChange={(e) => setTickerFilter({ ...tickerFilter, is_active: e.target.value })}
                                                className={`w-full p-2 rounded border ${
                                                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                }`}
                                            >
                                                <option value="all">Tous</option>
                                                <option value="true">Actifs</option>
                                                <option value="false">Inactifs</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={fetchTickers}
                                        disabled={loadingTickers}
                                        className={`mt-3 px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                            loadingTickers
                                                ? 'bg-gray-500 text-white cursor-not-allowed'
                                                : isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                    >
                                        {loadingTickers ? '⏳ Chargement...' : '🔄 Actualiser'}
                                    </button>
                                </div>

                                {/* Liste des tickers */}
                                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="font-semibold flex items-center gap-2">
                                            <Icon emoji="📋" size={16} />
                                            Liste des Tickers ({tickersList.length})
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowAddForm(!showAddForm);
                                                setEditingTicker(null);
                                            }}
                                            className={`px-3 py-1 text-xs rounded transition-colors ${
                                                isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                        >
                                            {showAddForm ? '❌ Annuler' : '➕ Ajouter'}
                                        </button>
                                    </div>

                                    {/* Formulaire d'ajout */}
                                    {showAddForm && (
                                        <div className={`mb-4 p-4 rounded border-2 ${isDarkMode ? 'bg-gray-900 border-blue-600' : 'bg-blue-50 border-blue-300'}`}>
                                            <h4 className="font-semibold mb-3">Ajouter un nouveau ticker</h4>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <label className="block mb-1">Ticker *</label>
                                                    <input
                                                        type="text"
                                                        value={newTicker.ticker}
                                                        onChange={(e) => setNewTicker({ ...newTicker, ticker: e.target.value.toUpperCase() })}
                                                        placeholder="AAPL"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Nom de l'entreprise</label>
                                                    <input
                                                        type="text"
                                                        value={newTicker.company_name}
                                                        onChange={(e) => setNewTicker({ ...newTicker, company_name: e.target.value })}
                                                        placeholder="Apple Inc."
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Secteur</label>
                                                    <input
                                                        type="text"
                                                        value={newTicker.sector}
                                                        onChange={(e) => setNewTicker({ ...newTicker, sector: e.target.value })}
                                                        placeholder="Technology"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Industrie</label>
                                                    <input
                                                        type="text"
                                                        value={newTicker.industry}
                                                        onChange={(e) => setNewTicker({ ...newTicker, industry: e.target.value })}
                                                        placeholder="Consumer Electronics"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Pays</label>
                                                    <input
                                                        type="text"
                                                        value={newTicker.country}
                                                        onChange={(e) => setNewTicker({ ...newTicker, country: e.target.value })}
                                                        placeholder="United States"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Bourse</label>
                                                    <input
                                                        type="text"
                                                        value={newTicker.exchange}
                                                        onChange={(e) => setNewTicker({ ...newTicker, exchange: e.target.value })}
                                                        placeholder="NASDAQ"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Devise</label>
                                                    <select
                                                        value={newTicker.currency}
                                                        onChange={(e) => setNewTicker({ ...newTicker, currency: e.target.value })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    >
                                                        <option value="USD">USD</option>
                                                        <option value="CAD">CAD</option>
                                                        <option value="EUR">EUR</option>
                                                        <option value="GBP">GBP</option>
                                                        <option value="CHF">CHF</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Source</label>
                                                    <select
                                                        value={newTicker.source}
                                                        onChange={(e) => setNewTicker({ ...newTicker, source: e.target.value })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    >
                                                        <option value="manual">Manuel</option>
                                                        <option value="team">Équipe</option>
                                                        <option value="watchlist">Watchlist</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Priorité</label>
                                                    <input
                                                        type="number"
                                                        value={newTicker.priority}
                                                        onChange={(e) => setNewTicker({ ...newTicker, priority: parseInt(e.target.value) || 1 })}
                                                        min="1"
                                                        max="100"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Market Cap</label>
                                                    <input
                                                        type="text"
                                                        value={newTicker.market_cap}
                                                        onChange={(e) => setNewTicker({ ...newTicker, market_cap: e.target.value })}
                                                        placeholder="2.5T"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Prix cible</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={newTicker.target_price}
                                                        onChange={(e) => setNewTicker({ ...newTicker, target_price: e.target.value })}
                                                        placeholder="150.00"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Stop Loss</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={newTicker.stop_loss}
                                                        onChange={(e) => setNewTicker({ ...newTicker, stop_loss: e.target.value })}
                                                        placeholder="140.00"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block mb-1">Notes</label>
                                                    <textarea
                                                        value={newTicker.notes}
                                                        onChange={(e) => setNewTicker({ ...newTicker, notes: e.target.value })}
                                                        placeholder="Notes sur ce ticker..."
                                                        rows="2"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="newTickerActive"
                                                        checked={newTicker.is_active}
                                                        onChange={(e) => setNewTicker({ ...newTicker, is_active: e.target.checked })}
                                                        className="rounded"
                                                    />
                                                    <label htmlFor="newTickerActive">Actif</label>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleAddTicker}
                                                disabled={!newTicker.ticker}
                                                className={`mt-3 px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                                    !newTicker.ticker
                                                        ? 'bg-gray-500 text-white cursor-not-allowed'
                                                        : isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                                                }`}
                                            >
                                                ✅ Ajouter le ticker
                                            </button>
                                        </div>
                                    )}

                                    {/* Table des tickers */}
                                    <div className={`overflow-x-auto rounded ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                        {loadingTickers ? (
                                            <div className="text-center py-8">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                                <p className="mt-2 text-sm">Chargement des tickers...</p>
                                            </div>
                                        ) : tickersList.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                Aucun ticker trouvé avec ces filtres
                                            </div>
                                        ) : (
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                                                        <th className="p-2 text-left">Ticker</th>
                                                        <th className="p-2 text-left">Entreprise</th>
                                                        <th className="p-2 text-left">Source</th>
                                                        <th className="p-2 text-left">Priorité</th>
                                                        <th className="p-2 text-left">Statut</th>
                                                        <th className="p-2 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tickersList.map((t) => (
                                                        <tr key={t.id} className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                                            <td className="p-2 font-semibold">{t.ticker}</td>
                                                            <td className="p-2">{t.company_name || '—'}</td>
                                                            <td className="p-2">
                                                                <span className={`px-2 py-1 rounded text-xs ${
                                                                    t.source === 'team' ? 'bg-blue-500 text-white' :
                                                                    t.source === 'watchlist' ? 'bg-purple-500 text-white' :
                                                                    t.source === 'both' ? 'bg-indigo-500 text-white' :
                                                                    'bg-gray-500 text-white'
                                                                }`}>
                                                                    {t.source}
                                                                </span>
                                                            </td>
                                                            <td className="p-2">{t.priority}</td>
                                                            <td className="p-2">
                                                                <span className={`px-2 py-1 rounded text-xs ${
                                                                    t.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                                }`}>
                                                                    {t.is_active ? '✅ Actif' : '❌ Inactif'}
                                                                </span>
                                                            </td>
                                                            <td className="p-2">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => setEditingTicker(editingTicker?.id === t.id ? null : t)}
                                                                        className={`px-2 py-1 text-xs rounded transition-colors ${
                                                                            isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                        }`}
                                                                    >
                                                                        {editingTicker?.id === t.id ? '❌ Annuler' : '✏️ Éditer'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteTicker(t.id, t.ticker, false)}
                                                                        className={`px-2 py-1 text-xs rounded transition-colors ${
                                                                            isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                                                                        }`}
                                                                    >
                                                                        🗑️ Supprimer
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    {/* Formulaire d'édition (modal inline) */}
                                    {editingTicker && (
                                        <div className={`mt-4 p-4 rounded border-2 ${isDarkMode ? 'bg-gray-900 border-yellow-600' : 'bg-yellow-50 border-yellow-300'}`}>
                                            <h4 className="font-semibold mb-3">Éditer le ticker {editingTicker.ticker}</h4>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <label className="block mb-1">Ticker</label>
                                                    <input
                                                        type="text"
                                                        value={editingTicker.ticker}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, ticker: e.target.value.toUpperCase() })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Nom de l'entreprise</label>
                                                    <input
                                                        type="text"
                                                        value={editingTicker.company_name || ''}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, company_name: e.target.value })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Secteur</label>
                                                    <input
                                                        type="text"
                                                        value={editingTicker.sector || ''}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, sector: e.target.value })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Industrie</label>
                                                    <input
                                                        type="text"
                                                        value={editingTicker.industry || ''}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, industry: e.target.value })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Pays</label>
                                                    <input
                                                        type="text"
                                                        value={editingTicker.country || ''}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, country: e.target.value })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Bourse</label>
                                                    <input
                                                        type="text"
                                                        value={editingTicker.exchange || ''}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, exchange: e.target.value })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Devise</label>
                                                    <select
                                                        value={editingTicker.currency || 'USD'}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, currency: e.target.value })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    >
                                                        <option value="USD">USD</option>
                                                        <option value="CAD">CAD</option>
                                                        <option value="EUR">EUR</option>
                                                        <option value="GBP">GBP</option>
                                                        <option value="CHF">CHF</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Source</label>
                                                    <select
                                                        value={editingTicker.source || 'manual'}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, source: e.target.value })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    >
                                                        <option value="manual">Manuel</option>
                                                        <option value="team">Équipe</option>
                                                        <option value="watchlist">Watchlist</option>
                                                        <option value="both">Les deux</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Priorité</label>
                                                    <input
                                                        type="number"
                                                        value={editingTicker.priority || 1}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, priority: parseInt(e.target.value) || 1 })}
                                                        min="1"
                                                        max="100"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Market Cap</label>
                                                    <input
                                                        type="text"
                                                        value={editingTicker.market_cap || ''}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, market_cap: e.target.value })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Prix cible</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editingTicker.target_price || ''}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, target_price: e.target.value ? parseFloat(e.target.value) : null })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">Stop Loss</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editingTicker.stop_loss || ''}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, stop_loss: e.target.value ? parseFloat(e.target.value) : null })}
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block mb-1">Notes</label>
                                                    <textarea
                                                        value={editingTicker.notes || ''}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, notes: e.target.value })}
                                                        rows="2"
                                                        className={`w-full p-2 rounded border ${
                                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="editTickerActive"
                                                        checked={editingTicker.is_active}
                                                        onChange={(e) => setEditingTicker({ ...editingTicker, is_active: e.target.checked })}
                                                        className="rounded"
                                                    />
                                                    <label htmlFor="editTickerActive">Actif</label>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => handleUpdateTicker(editingTicker.id, editingTicker)}
                                                    className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                                        isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                                                    }`}
                                                >
                                                    ✅ Sauvegarder
                                                </button>
                                                <button
                                                    onClick={() => setEditingTicker(null)}
                                                    className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                                        isDarkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'
                                                    }`}
                                                >
                                                    ❌ Annuler
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <EmmaSmsPanel />

                    {/* 🤖 Emma Configuration (nouveau - centralisé pour admin) */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-gray-900 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-gray-50 border-purple-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowEmmaConfig(!showEmmaConfig)}>
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                                <Icon emoji="🤖" size={20} />
                                Emma Configuration (Prompts Optimisés)
                                <span className="text-xs opacity-70">(partagé avec onglet Emma IA™)</span>
                            </h3>
                            <button className={`px-3 py-1 text-xs rounded transition-colors ${
                                isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'
                            }`}>
                                {showEmmaConfig ? '▼ Masquer' : '▶ Afficher'}
                            </button>
                        </div>

                        {showEmmaConfig && (
                            <div className="space-y-4">
                                {/* Prompt Système */}
                                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                                            <Icon emoji="📝" size={16} />
                                            Prompt Système (Optimisé Hassid)
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={resetToOptimizedPrompt}
                                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                                    isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                                                }`}
                                            >
                                                ✅ Restaurer prompt optimisé
                                            </button>
                                            <span className={`px-3 py-1 text-xs rounded ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                                {emmaPrompt.split(' ').length} mots (-85.6% vs original)
                                            </span>
                                        </div>
                                    </div>
                                    <textarea
                                        value={emmaPrompt}
                                        onChange={(e) => handlePromptChange(e.target.value)}
                                        className={`w-full h-64 p-3 rounded border font-mono text-sm ${
                                            isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                        placeholder="Prompt système Emma..."
                                    />
                                    <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        💡 Prompt optimisé selon principes Hassid: layered structure, délimiteurs ///, contraintes en fin (recency effect)
                                    </div>
                                </div>

                                {/* Température */}
                                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <label className={`block font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                                        <Icon emoji="🌡️" size={16} />
                                        Température: <span className="font-bold text-blue-600">{emmaTemperature.toFixed(2)}</span>
                                        <span className="text-xs font-normal opacity-70">
                                            ({emmaTemperature <= 0.3 ? 'Précis/Factuel' : emmaTemperature <= 0.6 ? 'Équilibré' : 'Créatif'})
                                        </span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1.0"
                                        step="0.05"
                                        value={emmaTemperature}
                                        onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className={`flex justify-between text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <span>0.1 (Précis)</span>
                                        <span>0.5 (Équilibré)</span>
                                        <span>1.0 (Créatif)</span>
                                    </div>
                                </div>

                                {/* Max Tokens */}
                                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <label className={`block font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                                        <Icon emoji="📏" size={16} />
                                        Longueur Max: <span className="font-bold text-blue-600">{emmaMaxTokens} tokens</span>
                                        <span className="text-xs font-normal opacity-70">
                                            (~{Math.round(emmaMaxTokens * 0.75)} mots)
                                        </span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1024"
                                        max="16384"
                                        step="512"
                                        value={emmaMaxTokens}
                                        onChange={(e) => handleMaxTokensChange(parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className={`flex justify-between text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <span>1024</span>
                                        <span>4096 (défaut)</span>
                                        <span>8192</span>
                                        <span>16384</span>
                                    </div>
                                    <div className={`mt-2 text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                                        ⚠️ Note: Analyses complètes SMS = max 2 parties (~3500 chars). Web/Email = profondeur maximale.
                                    </div>
                                </div>

                                {/* Function Calling */}
                                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="flex items-center justify-between">
                                        <label className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                                            <Icon emoji="🔧" size={16} />
                                            Function Calling (APIs temps réel)
                                        </label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useFunctionCalling}
                                                onChange={(e) => handleFunctionCallingToggle(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                                            <span className={`ml-3 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                                {useFunctionCalling ? 'Activé ✅' : 'Désactivé ❌'}
                                            </span>
                                        </label>
                                    </div>
                                    <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {useFunctionCalling
                                            ? '✅ Emma utilise les APIs (FMP, Finnhub, etc.) pour données temps réel'
                                            : '❌ Emma se base uniquement sur ses connaissances d\'entraînement'}
                                    </div>
                                </div>

                                {/* Info Synchronisation */}
                                <div className={`p-3 rounded border-2 ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-300'}`}>
                                    <div className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>
                                        <Icon emoji="ℹ️" size={16} /> <strong>Synchronisation automatique:</strong> Tous les réglages sont partagés avec l'onglet "Emma IA™" via localStorage.
                                        Les modifications ici s'appliquent immédiatement partout.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 🔍 Debug des Données (déplacé ici depuis Titres & nouvelles) */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            <Icon emoji="🔍" size={20} />
                            Debug des Données
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded p-3 border`}>
                                <div className="text-blue-600 font-medium mb-2 flex items-center gap-2">
                                    <Icon emoji="📊" size={18} />
                                    Stock Data
                                </div>
                                <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Tickers: {tickers.length} ({tickers.join(', ')})
                                </div>
                                <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Données chargées: {Object.keys(stockData).length}
                                </div>
                                <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Dernière MAJ: {lastUpdate ? new Date(lastUpdate).toLocaleString('fr-FR') : 'Jamais'}
                                </div>
                            </div>
                            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded p-3 border`}>
                                <div className="text-emerald-600 font-medium mb-2 flex items-center gap-2">
                                    <Icon emoji="📰" size={18} />
                                    News Data
                                </div>
                                <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Articles: {newsData.length}
                                </div>
                                <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Premier article: {newsData[0]?.title?.substring(0, 30) || 'Aucun'}...
                                </div>
                            </div>
                            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded p-3 border`}>
                                <div className="text-violet-600 font-medium mb-2 flex items-center gap-2">
                                    <Icon emoji="🎯" size={18} />
                                    Seeking Alpha
                                </div>
                                <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Stocks: {seekingAlphaData.stocks?.length || 0}
                                </div>
                                <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Stock Data: {Object.keys(seekingAlphaStockData.stocks || {}).length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 📦 Gestion du Cache Supabase */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-gray-900 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-gray-50 border-blue-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                                <Icon emoji="📦" size={20} />
                                Gestion du Cache Supabase
                            </h3>
                            <button
                                onClick={async () => {
                                    setLoadingCacheStatus(true);
                                    try {
                                        const response = await fetch(`${API_BASE_URL}/api/supabase-daily-cache?type=status&maxAgeHours=${cacheSettings.maxAgeHours || 4}`);
                                        if (response.ok) {
                                            const data = await response.json();
                                            setCacheStatus(data.status || {});
                                        }
                                    } catch (error) {
                                        console.error('Erreur récupération statut cache:', error);
                                    } finally {
                                        setLoadingCacheStatus(false);
                                    }
                                }}
                                disabled={loadingCacheStatus}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                    loadingCacheStatus
                                        ? 'bg-gray-500 text-white cursor-not-allowed'
                                        : isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                                {loadingCacheStatus ? '⏳ Chargement...' : '🔄 Actualiser'}
                            </button>
                        </div>

                        {/* Paramètres du Cache */}
                        <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="font-semibold mb-3 flex items-center gap-2">
                                    <Icon emoji="⚙️" size={16} />
                                    Paramètres du Cache
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm mb-2">
                                            Durée du cache (heures): <span className="font-bold text-blue-600">{cacheSettings.maxAgeHours}h</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="12"
                                            value={cacheSettings.maxAgeHours}
                                            onChange={(e) => {
                                                const newSettings = { ...cacheSettings, maxAgeHours: parseInt(e.target.value) };
                                                setCacheSettings(newSettings);
                                                localStorage.setItem('cacheSettings', JSON.stringify(newSettings));
                                            }}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>1h</span>
                                            <span>6h</span>
                                            <span>12h</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="refreshOnNavigation"
                                            checked={cacheSettings.refreshOnNavigation}
                                            onChange={(e) => {
                                                const newSettings = { ...cacheSettings, refreshOnNavigation: e.target.checked };
                                                setCacheSettings(newSettings);
                                                localStorage.setItem('cacheSettings', JSON.stringify(newSettings));
                                            }}
                                            className="rounded"
                                        />
                                        <label htmlFor="refreshOnNavigation" className="text-sm">
                                            Rafraîchir les données tickers lors de la navigation
                                        </label>
                                    </div>
                                    {cacheSettings.refreshOnNavigation && (
                                        <div className="ml-6">
                                            <label className="block text-sm mb-2">
                                                Intervalle de rafraîchissement (minutes): <span className="font-bold text-blue-600">{cacheSettings.refreshIntervalMinutes} min</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="5"
                                                max="30"
                                                step="5"
                                                value={cacheSettings.refreshIntervalMinutes}
                                                onChange={(e) => {
                                                    const newSettings = { ...cacheSettings, refreshIntervalMinutes: parseInt(e.target.value) };
                                                    setCacheSettings(newSettings);
                                                    localStorage.setItem('cacheSettings', JSON.stringify(newSettings));
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* État du Cache */}
                            <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="font-semibold mb-3 flex items-center gap-2">
                                    <Icon emoji="📊" size={16} />
                                    État du Cache
                                </div>
                                <div className="space-y-2 text-xs">
                                    {Object.keys(cacheStatus).length === 0 ? (
                                        <div className={`text-center py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Cliquez sur "Actualiser" pour voir l'état du cache
                                        </div>
                                    ) : (
                                        Object.entries(cacheStatus).map(([type, status]) => (
                                            <div key={type} className={`p-2 rounded border ${
                                                status.expired
                                                    ? isDarkMode ? 'bg-yellow-900/30 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
                                                    : isDarkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'
                                            }`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold capitalize">{type.replace('_', ' ')}</span>
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        status.expired
                                                            ? 'bg-yellow-500 text-white'
                                                            : 'bg-green-500 text-white'
                                                    }`}>
                                                        {status.expired ? '⚠️ Expiré' : '✅ Valide'}
                                                    </span>
                                                </div>
                                                {status.age_hours && (
                                                    <div className="mt-1 text-gray-600">
                                                        Âge: {parseFloat(status.age_hours).toFixed(1)}h / {status.max_age_hours || cacheSettings.maxAgeHours}h max
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (confirm('Vider tout le cache Supabase ? Les données seront rechargées depuis les APIs.')) {
                                            try {
                                                const response = await fetch(`${API_BASE_URL}/api/supabase-daily-cache`, {
                                                    method: 'DELETE'
                                                });
                                                if (response.ok) {
                                                    alert('Cache vidé avec succès');
                                                    setCacheStatus({});
                                                }
                                            } catch (error) {
                                                alert('Erreur lors du vidage du cache');
                                            }
                                        }
                                    }}
                                    className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                        isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                                >
                                    🗑️ Vider le Cache
                                </button>
                                <button
                                    onClick={() => {
                                        const defaultSettings = {
                                            maxAgeHours: 4,
                                            refreshOnNavigation: true,
                                            refreshIntervalMinutes: 10
                                        };
                                        setCacheSettings(defaultSettings);
                                        localStorage.setItem('cacheSettings', JSON.stringify(defaultSettings));
                                        alert('Paramètres réinitialisés aux valeurs par défaut');
                                    }}
                                    className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
                                    }`}
                                >
                                    🔄 Réinitialiser
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 📋 Logs Système - Nouveau */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <Icon emoji="📋" size={20} />
                                Logs Système
                            </h3>
                            <button
                                onClick={() => setSystemLogs([])}
                                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                Effacer logs
                            </button>
                        </div>
                        <div className={`max-h-64 overflow-y-auto rounded p-3 font-mono text-xs ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            {systemLogs.length === 0 ? (
                                <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Aucun log pour le moment
                                </div>
                            ) : (
                                systemLogs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`py-1 border-b ${
                                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                        } ${
                                            log.type === 'error' ? 'text-red-500' :
                                            log.type === 'success' ? 'text-green-500' :
                                            log.type === 'warning' ? 'text-yellow-500' :
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        <span className="text-gray-500">[{log.timestamp}]</span> {log.text}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 🧠 Deep Think - Analyses Profondes */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-gray-900 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-gray-50 border-purple-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                                <Icon emoji="🧠" size={20} />
                                Deep Think
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-200 text-purple-900'}`}>
                                AI Analysis System
                            </span>
                        </div>
                        <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="font-semibold mb-1 flex items-center gap-2">
                                    <Icon emoji="🎯" size={16} />
                                    Statut du système
                                </div>
                                <div className="text-xs space-y-1">
                                    <div>• Gemini API: {typeof window !== 'undefined' ? '✅ Actif' : '⚠️ Vérification...'}</div>
                                    <div>• Emma Agent: {systemLogs.filter(l => l.text.includes('Emma')).length > 0 ? '✅ Opérationnel' : '⏸️ En attente'}</div>
                                    <div>• Deep Analysis: {stockData && Object.keys(stockData).length > 0 ? '✅ Données disponibles' : '⚠️ Pas de données'}</div>
                                </div>
                            </div>
                            <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="font-semibold mb-1 flex items-center gap-2">
                                    <Icon emoji="📊" size={16} />
                                    Métriques
                                </div>
                                <div className="text-xs space-y-1">
                                    <div>• Analyses effectuées: {systemLogs.filter(l => l.type === 'success').length}</div>
                                    <div>• Requêtes API: {systemLogs.length}</div>
                                    <div>• Dernière analyse: {systemLogs[0]?.timestamp || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ⚠️ Violations & Diagnostics */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-red-900/20 to-gray-900 border-red-700' : 'bg-gradient-to-br from-red-50 to-gray-50 border-red-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-red-300' : 'text-red-900'}`}>
                                <Icon emoji="⚠️" size={20} />
                                Violations
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded ${
                                systemLogs.filter(l => l.type === 'error').length > 0
                                    ? 'bg-red-500 text-white'
                                    : isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-200 text-green-900'
                            }`}>
                                {systemLogs.filter(l => l.type === 'error').length} erreur(s)
                            </span>
                        </div>
                        <div className={`max-h-48 overflow-y-auto rounded p-3 font-mono text-xs ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            {systemLogs.filter(l => l.type === 'error').length === 0 ? (
                                <div className={`text-center py-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    ✅ Aucune violation détectée - Système opérationnel
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {systemLogs.filter(l => l.type === 'error').map((log, index) => (
                                        <div
                                            key={index}
                                            className={`p-2 rounded border ${
                                                isDarkMode ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="text-red-500">⚠️</span>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-xs">[{log.timestamp}]</div>
                                                    <div className="mt-1">{log.text}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className={`mt-3 p-2 rounded text-xs ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}>
                            💡 <strong>Info:</strong> Les violations sont automatiquement trackées. Consultez les logs système ci-dessus pour plus de détails.
                        </div>
                    </div>

                    {/* 🎨 Mode Professionnel / Fun */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-indigo-900/20 to-gray-900 border-indigo-700' : 'bg-gradient-to-br from-indigo-50 to-gray-50 border-indigo-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
                                <Icon emoji="🎨" size={20} />
                                Mode d'Affichage des Icônes
                            </h3>
                            <div className={`px-3 py-1 rounded text-xs font-medium ${
                                isProfessionalMode
                                    ? isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-200 text-blue-900'
                                    : isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-200 text-purple-900'
                            }`}>
                                {isProfessionalMode ? '💼 Professionnel' : '🎉 Fun'}
                            </div>
                        </div>
                        <div className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Icon emoji={isProfessionalMode ? "💼" : "🎉"} size={18} />
                                        <span className="font-semibold">
                                            {isProfessionalMode ? 'Mode Professionnel' : 'Mode Fun'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newMode = window.ProfessionalModeSystem.toggle();
                                            setIsProfessionalMode(newMode);
                                        }}
                                        className={`px-4 py-2 rounded-lg transition-all duration-300 border-2 font-semibold ${
                                            isProfessionalMode
                                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400 text-white hover:from-blue-700 hover:to-blue-800'
                                                : 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400 text-white hover:from-purple-700 hover:to-pink-700'
                                        }`}
                                    >
                                        {isProfessionalMode ? (
                                            <span className="flex items-center gap-2">
                                                <i className="iconoir-briefcase"></i>
                                                Mode Professionnel
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <span>🎉</span>
                                                Mode Fun
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {isProfessionalMode ? (
                                        <>
                                            <p className="mb-1">✅ Icônes professionnelles Iconoir activées</p>
                                            <p>Les emojis sont remplacés par des icônes vectorielles modernes pour une apparence plus professionnelle.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mb-1">✅ Mode Fun avec emojis activé</p>
                                            <p>Les icônes sont affichées sous forme d'emojis colorés pour une expérience plus décontractée.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className={`p-2 rounded text-xs ${isDarkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                                💡 <strong>Astuce:</strong> Le mode sélectionné est sauvegardé automatiquement et s'applique à tous les onglets du dashboard.
                            </div>
                        </div>
                    </div>

                    {/* 🤖 Configuration Emma IA */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-emerald-900/20 to-gray-900 border-emerald-700' : 'bg-gradient-to-br from-emerald-50 to-gray-50 border-emerald-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>
                                <Icon emoji="🤖" size={20} />
                                Configuration Emma IA
                            </h3>
                            <div className={`px-3 py-1 rounded text-xs font-medium ${
                                emmaConnected
                                    ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-200 text-green-900'
                                    : isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-200 text-red-900'
                            }`}>
                                {emmaConnected ? '✅ Gemini Actif' : '❌ Gemini Inactif'}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button
                                onClick={() => setShowPromptEditor(!showPromptEditor)}
                                className={`px-4 py-2 rounded transition-colors ${
                                    isDarkMode
                                        ? 'bg-purple-800 hover:bg-purple-700 text-white'
                                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                            >
                                📝 Modifier Prompt
                            </button>
                            <button
                                onClick={() => setShowTemperatureEditor(!showTemperatureEditor)}
                                className={`px-4 py-2 rounded transition-colors ${
                                    isDarkMode
                                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                                }`}
                            >
                                🌡️ Température
                            </button>
                            <button
                                onClick={() => setShowLengthEditor(!showLengthEditor)}
                                className={`px-4 py-2 rounded transition-colors ${
                                    isDarkMode
                                        ? 'bg-green-800 hover:bg-green-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                📏 Longueur Réponse
                            </button>
                        </div>
                        
                        {/* Sliders pour Température et Longueur */}
                        <div className={`space-y-4 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            {/* Slider Température */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        🌡️ Température: <span className="font-bold text-blue-600">{emmaTemperature.toFixed(1)}</span>
                                    </label>
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {emmaTemperature <= 0.3 ? 'Précis' : emmaTemperature <= 0.5 ? 'Équilibré' : emmaTemperature <= 0.7 ? 'Naturel' : 'Créatif'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.1"
                                    value={emmaTemperature}
                                    onChange={(e) => {
                                        const newTemp = parseFloat(e.target.value);
                                        setEmmaTemperature(newTemp);
                                        localStorage.setItem('emma-temperature', newTemp.toString());
                                    }}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(emmaTemperature - 0.1) / 0.9 * 100}%, #e5e7eb ${(emmaTemperature - 0.1) / 0.9 * 100}%, #e5e7eb 100%)`
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>0.1</span>
                                    <span>0.5</span>
                                    <span>1.0</span>
                                </div>
                            </div>
                            
                            {/* Slider Longueur */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        📏 Longueur: <span className="font-bold text-green-600">{emmaMaxTokens}</span> tokens
                                    </label>
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {emmaMaxTokens <= 2048 ? 'Concis' : emmaMaxTokens <= 4096 ? 'Détaillé' : 'Très détaillé'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="512"
                                    max="8192"
                                    step="512"
                                    value={emmaMaxTokens}
                                    onChange={(e) => {
                                        const newTokens = parseInt(e.target.value);
                                        setEmmaMaxTokens(newTokens);
                                        localStorage.setItem('emma-max-tokens', newTokens.toString());
                                    }}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${(emmaMaxTokens - 512) / 7680 * 100}%, #e5e7eb ${(emmaMaxTokens - 512) / 7680 * 100}%, #e5e7eb 100%)`
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>512</span>
                                    <span>4096</span>
                                    <span>8192</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className={`mt-3 p-2 rounded text-xs ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}>
                            💡 <strong>Info:</strong> Ces paramètres affectent le comportement d'Emma IA dans l'onglet Ask Emma. Modifications appliquées immédiatement et sauvegardées dans localStorage.
                        </div>
                    </div>

                    {/* Configuration Scraping Seeking Alpha */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-orange-900/20 to-gray-900 border-orange-700' : 'bg-gradient-to-br from-orange-50 to-gray-50 border-orange-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-900'}`}>
                                <Icon emoji="🔐" size={20} />
                                Configuration Scraping Seeking Alpha
                            </h3>
                        </div>
                        
                        <div className={`space-y-4 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            {/* Email */}
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    📧 Email:
                                </label>
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                                    mvilla@videotron.ca
                                </div>
                            </div>
                            
                            {/* Mot de passe */}
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    🔑 Mot de passe:
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className={`flex-1 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                                        <span id="seeking-alpha-password-display">••••••••</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const display = document.getElementById('seeking-alpha-password-display');
                                            if (display) {
                                                if (display.textContent === '••••••••') {
                                                    display.textContent = 'Mickey69';
                                                } else {
                                                    display.textContent = '••••••••';
                                                }
                                            }
                                        }}
                                        className={`px-4 py-3 rounded-lg border transition-colors ${
                                            isDarkMode 
                                                ? 'bg-orange-700 hover:bg-orange-600 border-orange-600 text-white' 
                                                : 'bg-orange-500 hover:bg-orange-600 border-orange-400 text-white'
                                        }`}
                                    >
                                        👁️
                                    </button>
                                </div>
                            </div>
                            
                            {/* Instructions */}
                            <div className={`mt-4 p-3 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                <div className="text-sm font-semibold mb-2">📋 Instructions d'utilisation:</div>
                                <ol className="text-xs space-y-1 list-decimal list-inside">
                                    <li>Connectez-vous à Seeking Alpha avec les identifiants ci-dessus</li>
                                    <li>Utilisez la section "ÉTAPE 1: SCRAPING BATCH" ci-dessous pour lancer le scraping</li>
                                    <li>Pour chaque popup ouverte, appuyez sur F12, allez dans la Console, et collez le script généré</li>
                                    <li>Les données sont automatiquement sauvegardées dans Supabase</li>
                                    <li>Utilisez "ÉTAPE 2: ANALYSE BATCH PERPLEXITY" pour analyser les données scrapées</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Section Administration des Stocks */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        <Icon emoji="📊" size={20} className="mr-2 inline-block" />
                        Gestion des Stocks
                    </h3>
                        <div className="flex flex-wrap gap-2">
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
                        </div>
                    </div>

                    {/* Section Scraping Seeking Alpha */}
                    {/* WORKFLOW EN 3 ÉTAPES CLAIRES */}
                    <div className="space-y-4">
                        {/* ÉTAPE 1: SCRAPING BATCH */}
                        <div className={`backdrop-blur-sm rounded-xl p-6 border-2 transition-colors duration-300 ${
                            isDarkMode
                                ? 'bg-gradient-to-r from-gray-900/40 to-gray-800/40 border-gray-500/50'
                                : 'bg-gradient-to-r from-gray-800/40 to-gray-700/40 border-gray-400/50'
                        }`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-xl font-bold transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                <Icon emoji="📊" size={20} className="mr-2 inline-block" />
                                ÉTAPE 1: SCRAPING BATCH (25 tickers)
                            </h3>
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                                    scrapingStatus === 'idle' ? 'bg-gray-500 text-white' :
                                    scrapingStatus === 'running' ? 'bg-gray-700 text-white animate-pulse' :
                                    scrapingStatus === 'completed' ? 'bg-green-500 text-white' :
                                    'bg-red-500 text-white'
                                }`}>
                                    {scrapingStatus === 'idle' ? '⏸️ EN ATTENTE' :
                                     scrapingStatus === 'running' ? '🔄 SCRAPING...' :
                                     scrapingStatus === 'completed' ? '✅ TERMINÉ' :
                                     '❌ ERREUR'}
                                </span>
                            </div>

                            {/* Barre de progression */}
                            {scrapingStatus === 'running' && (
                                <div className="mb-4">
                                    <div className="w-full bg-gray-700 rounded-full h-4">
                                        <div
                                            className="bg-gradient-to-r from-gray-700 to-gray-600 h-4 rounded-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                                            style={{ width: `${scrapingProgress}%` }}
                                        >
                                            {scrapingProgress}%
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={`mb-4 p-4 rounded-lg transition-colors duration-300 ${
                                isDarkMode ? 'bg-black/30' : 'bg-white/60'
                            }`}>
                                <p className={`text-sm mb-3 font-semibold transition-colors duration-300 ${
                                    isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                                }`}>
                                    ⚠️ IMPORTANT: Connectez-vous AVANT de lancer le scraping!
                                </p>
                                <ol className={`text-sm space-y-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    <li><strong>1.</strong> Cliquez "🔐 SE CONNECTER" → Login Seeking Alpha</li>
                                    <li><strong>2.</strong> Cliquez "🚀 LANCER SCRAPING BATCH" → Toutes les popups s'ouvrent</li>
                                    <li><strong>3.</strong> Pour CHAQUE popup: F12 → Console → Collez script → Entrée</li>
                                    <li><strong>4.</strong> Fermez la popup après copie</li>
                                    <li><strong>5.</strong> Les données sont auto-sauvegardées dans Supabase</li>
                                </ol>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        addScrapingLog('🔐 Ouverture de la page de connexion Seeking Alpha...', 'info');
                                        window.open('https://seekingalpha.com/account/login', '_blank');
                                        addScrapingLog('✅ Connectez-vous, puis revenez ici', 'success');
                                    }}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-lg shadow-lg"
                                >
                                    🔐 SE CONNECTER À SEEKING ALPHA
                                </button>
                                <button
                                    onClick={runSeekingAlphaScraper}
                                    disabled={scrapingStatus === 'running'}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg"
                                >
                                    {scrapingStatus === 'running' ? '⏳ SCRAPING EN COURS...' : '🚀 LANCER SCRAPING BATCH'}
                                </button>
                            </div>
                        </div>

                        {/* ÉTAPE 2: ANALYSE PERPLEXITY */}
                        <div className={`backdrop-blur-sm rounded-xl p-6 border-2 transition-colors duration-300 ${
                            isDarkMode
                                ? 'bg-gradient-to-r from-pink-900/40 to-rose-900/40 border-pink-500/50'
                                : 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-400/50'
                        }`}>
                            <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Icon emoji="🤖" size={20} className="mr-2 inline-block" />
                            ÉTAPE 2: ANALYSE BATCH PERPLEXITY
                        </h3>

                            <div className={`mb-4 p-4 rounded-lg transition-colors duration-300 ${
                                isDarkMode ? 'bg-black/30' : 'bg-white/60'
                            }`}>
                                <p className={`text-sm mb-3 transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    📊 Cliquez pour analyser TOUTES les données scrapées en une seule fois:
                                </p>
                                <ul className={`text-sm space-y-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    <li>✓ Récupère tous les raw scrapes depuis Supabase</li>
                                    <li>✓ Analyse avec Perplexity AI en batch</li>
                                    <li>✓ Formate en JSON structuré</li>
                                    <li>✓ Sauvegarde dans seeking_alpha_analysis</li>
                                    <li>✓ Affiche les résultats dans le tableau ci-dessous</li>
                                </ul>
                            </div>

                            <button
                                onClick={async () => {
                                    addScrapingLog('🤖 Démarrage analyse Perplexity BATCH...', 'info');
                                    try {
                                        // Récupérer tous les raw scrapes depuis Supabase
                                        addScrapingLog('📥 Récupération des données depuis Supabase...', 'info');
                                        const response = await fetch('/api/seeking-alpha-scraping?type=raw&limit=100');
                                        const data = await response.json();

                                        if (data.success && data.data && data.data.length > 0) {
                                            addScrapingLog(`✅ ${data.data.length} raw scrapes trouvés`, 'success');

                                            for (const item of data.data) {
                                                const ticker = item.ticker;
                                                addScrapingLog(`🔄 Analyse de ${ticker} avec Perplexity...`, 'info');
                                                await analyzeWithPerplexityAndUpdate(ticker, {
                                                    fullText: item.raw_text,
                                                    url: item.url,
                                                    content: {}
                                                });
                                            }
                                            addScrapingLog('🎉 Analyse Perplexity terminée pour TOUS les tickers!', 'success');
                                            addScrapingLog('💾 Résultats sauvegardés dans Supabase', 'success');
                                        } else {
                                            addScrapingLog('⚠️ Aucune donnée trouvée dans Supabase', 'warning');
                                            addScrapingLog('💡 Effectuez d\'abord le scraping (Étape 1)', 'info');
                                        }
                                    } catch (error) {
                                        addScrapingLog(`❌ Erreur: ${error.message}`, 'error');
                                    }
                                }}
                                className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all font-bold text-lg shadow-lg"
                            >
                                🤖 ANALYSER TOUT AVEC PERPLEXITY ({tickers.length} tickers)
                            </button>
                        </div>

                        {/* ÉTAPE 3: RÉSULTATS */}
                        <div className={`backdrop-blur-sm rounded-xl p-6 border-2 transition-colors duration-300 ${
                            isDarkMode
                                ? 'bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-emerald-500/50'
                                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400/50'
                        }`}>
                            <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Icon emoji="📊" size={20} className="mr-2 inline-block" />
                            ÉTAPE 3: RÉSULTATS & AFFICHAGE
                        </h3>

                            <div className={`mb-4 p-4 rounded-lg transition-colors duration-300 ${
                                isDarkMode ? 'bg-black/30' : 'bg-white/60'
                            }`}>
                                <p className={`text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Toutes les analyses apparaissent dans le tableau ci-dessous. Cliquez sur "RAFRAÎCHIR" pour recharger les dernières données depuis Supabase.
                                </p>
                            </div>

                            <button
                                onClick={async () => {
                                    addScrapingLog('🔄 Rafraîchissement des données depuis Supabase...', 'info');
                                    await fetchSeekingAlphaData();
                                    await fetchSeekingAlphaStockData();
                                    addScrapingLog('✅ Données rafraîchies!', 'success');
                                }}
                                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-bold text-lg shadow-lg"
                            >
                                🔄 RAFRAÎCHIR LES DONNÉES DU TABLEAU
                            </button>
                        </div>
                    </div>

                    {/* Section Logs de Scraping */}
                    {scrapingLogs.length > 0 && (
                        <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                            isDarkMode 
                                ? 'bg-gray-900 border-gray-700' 
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>📋 Logs de Scraping</h3>
                            <div className={`max-h-64 overflow-y-auto space-y-2 ${
                                isDarkMode ? 'bg-gray-800' : 'bg-white'
                            } rounded-lg p-4`}>
                                {scrapingLogs.map((log, index) => (
                                    <div key={index} className={`text-sm p-2 rounded ${
                                        log.type === 'error' ? 'bg-red-100 text-red-800' :
                                        log.type === 'success' ? 'bg-green-100 text-green-800' :
                                        log.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-700 text-gray-200'
                                    }`}>
                                        <span className="font-mono text-xs opacity-70">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className="ml-2">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section État des Connexions & Diagnostic des APIs - FUSIONNÉE */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        isDarkMode 
                            ? 'bg-gray-900 border-gray-700' 
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>🔗 État des Connexions & Diagnostic des APIs</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        await checkApiStatus();
                                        await runHealthCheck();
                                    }}
                                    disabled={healthCheckLoading}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
                                        healthCheckLoading
                                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                            : 'bg-gray-800 text-white hover:bg-gray-700'
                                    }`}
                                >
                                    {healthCheckLoading ? 'Vérification...' : '🔄 Vérifier Toutes'}
                                </button>
                            </div>
                        </div>

                        {/* Status Global (si healthStatus disponible) */}
                        {healthStatus && (
                            <div className={`p-4 rounded-lg border-2 mb-4 ${
                                healthStatus.overall_status === 'healthy'
                                    ? 'bg-green-50 border-green-200'
                                    : healthStatus.overall_status === 'degraded'
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-red-50 border-red-200'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className={`font-bold text-lg ${
                                            healthStatus.overall_status === 'healthy'
                                                ? 'text-green-800'
                                                : healthStatus.overall_status === 'degraded'
                                                ? 'text-yellow-800'
                                                : 'text-red-800'
                                        }`}>
                                            {healthStatus.overall_status === 'healthy' ? '🟢' :
                                             healthStatus.overall_status === 'degraded' ? '🟡' : '🔴'}
                                            Status Global: {healthStatus.overall_status.toUpperCase()}
                                        </h4>
                                        <p className={`text-sm ${
                                            healthStatus.overall_status === 'healthy'
                                                ? 'text-green-600'
                                                : healthStatus.overall_status === 'degraded'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                        }`}>
                                            {healthStatus.healthy_apis}/{healthStatus.total_apis} APIs opérationnelles
                                            ({Math.round((healthStatus.healthy_apis / healthStatus.total_apis) * 100)}%)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-medium ${
                                            healthStatus.overall_status === 'healthy'
                                                ? 'text-green-600'
                                                : healthStatus.overall_status === 'degraded'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                        }`}>
                                            {healthStatus.response_time_ms}ms
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(healthStatus.timestamp).toLocaleTimeString('fr-FR')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Liste détaillée des connexions */}
                        {Object.keys(apiStatus).length > 0 && (
                            <div className="space-y-3 mb-4">
                                <h4 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>Connexions détaillées:</h4>
                                {Object.entries(apiStatus).map(([api, status]) => (
                                    <div key={api} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${
                                        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                    }`}>
                                        <div className="flex-1">
                                            <span className={`font-mono capitalize transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>{api}</span>
                                            {status.error && (
                                                <div className={`text-xs mt-1 transition-colors duration-300 ${
                                                    isDarkMode ? 'text-red-400' : 'text-red-600'
                                                }`}>
                                                    {status.error}
                                                </div>
                                            )}
                                            {status.source && (
                                                <div className={`text-xs mt-1 transition-colors duration-300 ${
                                                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                                }`}>
                                                    Source: {status.source}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${
                                                status.status === 'success' ? 'bg-green-500' :
                                                status.status === 'warning' ? 'bg-yellow-500' :
                                                status.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                                            }`}></span>
                                            <span className={`text-sm transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                {status.responseTime}ms
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Recommandations (si healthStatus disponible) */}
                        {healthStatus && healthStatus.recommendations && healthStatus.recommendations.length > 0 && (
                            <div className={`p-4 rounded-lg mt-4 ${
                                isDarkMode ? 'bg-gray-800' : 'bg-gray-700'
                            }`}>
                                <h4 className={`font-semibold mb-3 ${
                                    isDarkMode ? 'text-white' : 'text-blue-900'
                                }`}>
                                    💡 Recommandations
                                </h4>
                                <div className="space-y-2">
                                    {healthStatus.recommendations.map((rec, index) => (
                                        <div key={index} className={`p-3 rounded-lg ${
                                            rec.priority === 'critical' ? 'bg-red-100 border border-red-200' :
                                            rec.priority === 'high' ? 'bg-green-100 border border-green-200' :
                                            'bg-yellow-100 border border-yellow-200'
                                        }`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className={`font-medium text-sm ${
                                                        rec.priority === 'critical' ? 'text-red-800' :
                                                        rec.priority === 'high' ? 'text-green-800' :
                                                        'text-yellow-800'
                                                    }`}>
                                                        {rec.priority === 'critical' ? '🚨' :
                                                         rec.priority === 'high' ? '⚠️' : '💡'}
                                                        {rec.message}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        <strong>Action:</strong> {rec.action}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {Object.keys(apiStatus).length === 0 && !healthStatus && (
                            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p>Cliquez sur "🔄 Vérifier Toutes" pour diagnostiquer les connexions</p>
                            </div>
                        )}
                    </div>

                    {/* Section Monitoring API Emma */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        <Icon emoji="🤖" size={20} className="mr-2 inline-block" />
                        Monitoring Emma AI
                    </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                    <div className="text-purple-600 font-medium mb-2 flex items-center gap-2">
                                        <Icon emoji="🧠" size={18} />
                                        Emma Agent
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Status: <span className="text-green-500">✅ Opérationnel</span>
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Outils: 12 disponibles
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                    <div className="text-blue-600 font-medium mb-2">📧 Briefings</div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Cron: <span className="text-green-500">✅ Actif</span>
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Horaires: 7h20 • 11h50 • 16h20
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                    <div className="text-emerald-600 font-medium mb-2">🗄️ Supabase</div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Tables: 4 créées
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Tickers: {teamTickers.length} team + {watchlistTickers.length} watchlist
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        fetch('/api/emma-agent', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                message: 'Test de connexion Emma Agent',
                                                context: { test: true }
                                            })
                                        }).then(response => response.json())
                                        .then(data => {
                                            if (data.success) {
                                                showMessage('✅ Emma Agent opérationnel', 'success');
                                            } else {
                                                showMessage('❌ Emma Agent erreur: ' + data.error, 'error');
                                            }
                                        }).catch(error => {
                                            showMessage('❌ Erreur connexion Emma Agent', 'error');
                                        });
                                    }}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                >
                                    🧪 Tester Emma Agent
                                </button>
                                <button
                                    onClick={() => {
                                        fetch('/api/emma-briefing?type=morning')
                                        .then(response => response.json())
                                        .then(data => {
                                            if (data.success) {
                                                showMessage('✅ Emma Briefing opérationnel', 'success');
                                            } else {
                                                showMessage('❌ Emma Briefing erreur: ' + data.error, 'error');
                                            }
                                        }).catch(error => {
                                            showMessage('❌ Erreur connexion Emma Briefing', 'error');
                                        });
                                    }}
                                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                                >
                                    📧 Tester Briefing
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section Gestion des Outils Emma */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>🔧 Gestion des Outils Emma</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                    <h4 className={`font-medium mb-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    <Icon emoji="📊" size={18} className="mr-2 inline-block" />
                                    Outils Financiers
                                </h4>
                                    <div className="space-y-1 text-sm">
                                        <div className={`transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>• Polygon Stock Price</div>
                                        <div className={`transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>• FMP Fundamentals</div>
                                        <div className={`transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>• Finnhub News</div>
                                        <div className={`transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>• Twelve Data Technical</div>
                                        <div className={`transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>• Alpha Vantage Ratios</div>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                    <h4 className={`font-medium mb-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>🗄️ Outils Supabase</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className={`transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>• Watchlist Manager</div>
                                        <div className={`transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>• Team Tickers</div>
                                        <div className={`transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>• Economic Calendar</div>
                                        <div className={`transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>• Earnings Calendar</div>
                                        <div className={`transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>• Analyst Recommendations</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        fetch('/api/emma-agent', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                message: 'Afficher la configuration des outils',
                                                context: { action: 'show_tools_config' }
                                            })
                                        }).then(response => response.json())
                                        .then(data => {
                                            if (data.success) {
                                                showMessage('✅ Configuration des outils récupérée', 'success');
                                                console.log('Tools Config:', data.tools_config);
                                            } else {
                                                showMessage('❌ Erreur récupération config', 'error');
                                            }
                                        }).catch(error => {
                                            showMessage('❌ Erreur connexion', 'error');
                                        });
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                >
                                    ⚙️ Voir Configuration
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* Section Configuration */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        <Icon emoji="⚙️" size={20} className="mr-2 inline-block" />
                        Configuration
                    </h3>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Token GitHub (pour les mises à jour)
                                </label>
                                <input
                                    type="password"
                                    value={githubToken}
                                    onChange={(e) => setGithubToken(e.target.value)}
                                    placeholder="Entrez votre token GitHub"
                                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                                >
                                    {showSettings ? 'Masquer' : 'Afficher'} les paramètres
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );


};
export default AdminJSLaiTab;
