// Main Dashboard Component - Refactored to use modular tab components
// This replaces the monolithic BetaCombinedDashboard inline component

import React, { useState, useEffect, useRef } from 'react';

// Import all tab components
import { AdminJSLaiTab } from './components/tabs/AdminJSLaiTab.js';
import { AskEmmaTab } from './components/tabs/AskEmmaTab.js';
import { DansWatchlistTab } from './components/tabs/DansWatchlistTab.js';
import { EconomicCalendarTab } from './components/tabs/EconomicCalendarTab.js';
import { EmailBriefingsTab } from './components/tabs/EmailBriefingsTab.js';
import { EmmaSmsPanel } from './components/tabs/EmmaSmsPanel.js';
import { JLabTab } from './components/tabs/JLabTab.js';
import { InvestingCalendarTab } from './components/tabs/InvestingCalendarTab.js';
import { MarketsEconomyTab } from './components/tabs/MarketsEconomyTab.js';
import { PlusTab } from './components/tabs/PlusTab.js';
import { ScrappingSATab } from './components/tabs/ScrappingSATab.js';
import { SeekingAlphaTab } from './components/tabs/SeekingAlphaTab.js';
import { StocksNewsTab } from './components/tabs/StocksNewsTab.js';
import { YieldCurveTab } from './components/tabs/YieldCurveTab.js';

// Import utilities
import {
    cleanText,
    getNewsIcon,
    getSourceCredibility,
    sortNewsByCredibility,
    isFrenchArticle,
    getCompanyLogo,
    getUserLoginId,
    getGradeColor,
    parseSeekingAlphaRawText,
    formatNumber,
    getTabIcon
} from './utils.js';

// Import API helpers
import * as apiHelpers from './api-helpers.js';

// Import cache manager
import * as cacheManager from './cache-manager.js';

// Import common components
import { Icon, LoadingSpinner, ErrorMessage, Card, Button } from './components/common.js';

/**
 * Main Dashboard Component
 * Manages all state and orchestrates tab rendering
 */
export const BetaCombinedDashboard = () => {
    // NOTE: This component needs to be populated with the full state management
    // and logic from the original monolithic BetaCombinedDashboard component.
    // For now, this is a skeleton that shows the structure.

    // États principaux
    const [activeTab, setActiveTab] = useState('stocks-news');
    const [tickers, setTickers] = useState([]);
    const [teamTickers, setTeamTickers] = useState([]);
    const [watchlistTickers, setWatchlistTickers] = useState([]);
    const [stockData, setStockData] = useState({});
    const [newsData, setNewsData] = useState([]);
    const [newsContext, setNewsContext] = useState('general');
    const [githubUser, setGithubUser] = useState(null);
    const [finvizNews, setFinvizNews] = useState({});
    const [tickerLatestNews, setTickerLatestNews] = useState({});
    const [tickerMoveReasons, setTickerMoveReasons] = useState({});
    const [seekingAlphaData, setSeekingAlphaData] = useState({});
    const [seekingAlphaStockData, setSeekingAlphaStockData] = useState({});
    const [economicCalendarData, setEconomicCalendarData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [selectedStock, setSelectedStock] = useState(null);
    const [newTicker, setNewTicker] = useState('');
    const [showTickerManager, setShowTickerManager] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [showAdmin, setShowAdmin] = useState(false);
    const [apiStatus, setApiStatus] = useState({});
    const [viewMode, setViewMode] = useState('cards');
    const [seekingAlphaViewMode, setSeekingAlphaViewMode] = useState('list');
    const [newsFilter, setNewsFilter] = useState('all');
    const [filteredNews, setFilteredNews] = useState([]);
    const [frenchOnly, setFrenchOnly] = useState(false);
    const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
    const [slashSuggestions, setSlashSuggestions] = useState([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [showCommandsHelp, setShowCommandsHelp] = useState(false);

    // États pour la gestion du cache
    const [cacheSettings, setCacheSettings] = useState(() => {
        const saved = localStorage.getItem('cacheSettings');
        return saved ? JSON.parse(saved) : {
            maxAgeHours: 4,
            refreshOnNavigation: true,
            refreshIntervalMinutes: 10
        };
    });
    const [cacheStatus, setCacheStatus] = useState({});
    const [loadingCacheStatus, setLoadingCacheStatus] = useState(false);

    // États pour l'interface Seeking Alpha
    const [githubToken, setGithubToken] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [showScraperPopup, setShowScraperPopup] = useState(false);

    // États pour la modal de comparaison de peers
    const [showPeersModal, setShowPeersModal] = useState(false);
    const [selectedTickerForPeers, setSelectedTickerForPeers] = useState(null);
    const [peersData, setPeersData] = useState(null);
    const [loadingPeers, setLoadingPeers] = useState(false);

    // États pour le scraping
    const [scrapingStatus, setScrapingStatus] = useState('idle');
    const [scrapingProgress, setScrapingProgress] = useState(0);
    const [scrapingLogs, setScrapingLogs] = useState([]);

    // États pour les logs système
    const [systemLogs, setSystemLogs] = useState([]);

    // État pour le thème
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try {
            const saved = localStorage.getItem('theme');
            if (saved === 'dark') return true;
            if (saved === 'light') return false;
        } catch (_) {}
        return true;
    });

    // TODO: Extract all useEffect hooks, handlers, and logic from original component
    // TODO: This needs to be completed with the full component logic

    // Render
    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <header className="mb-6">
                    <h1 className="text-3xl font-bold">GOB Financial Dashboard</h1>
                    <p className="text-sm opacity-75">Powered by JSL AI</p>
                </header>

                {/* Navigation Tabs */}
                <nav className="flex space-x-2 mb-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('stocks-news')} className={`px-4 py-2 rounded ${activeTab === 'stocks-news' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                        Stocks & News
                    </button>
                    <button onClick={() => setActiveTab('ask-emma')} className={`px-4 py-2 rounded ${activeTab === 'ask-emma' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                        Ask Emma
                    </button>
                    <button onClick={() => setActiveTab('jlab')} className={`px-4 py-2 rounded ${activeTab === 'jlab' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                        JLAB
                    </button>
                    {/* Add more tab buttons as needed */}
                </nav>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'stocks-news' && <StocksNewsTab />}
                    {activeTab === 'ask-emma' && <AskEmmaTab />}
                    {activeTab === 'jlab' && <JLabTab />}
                    {activeTab === 'economic-calendar' && <EconomicCalendarTab />}
                    {activeTab === 'investing-calendar' && <InvestingCalendarTab />}
                    {activeTab === 'yield-curve' && <YieldCurveTab />}
                    {activeTab === 'markets-economy' && <MarketsEconomyTab />}
                    {activeTab === 'dans-watchlist' && <DansWatchlistTab />}
                    {activeTab === 'scrapping-sa' && <ScrappingSATab />}
                    {activeTab === 'seeking-alpha' && <SeekingAlphaTab />}
                    {activeTab === 'email-briefings' && <EmailBriefingsTab />}
                    {activeTab === 'admin-jslai' && <AdminJSLaiTab />}
                    {activeTab === 'emma-sms' && <EmmaSmsPanel />}
                    {activeTab === 'plus' && <PlusTab />}
                </div>
            </div>
        </div>
    );
};

// Initialize and render dashboard
export function initDashboard(rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<BetaCombinedDashboard />);
}
