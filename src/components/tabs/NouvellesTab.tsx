// @ts-nocheck
import React, { useState, useEffect, memo, useRef } from 'react';
import type { TabProps } from '../../types';

// Ground News Expandable Section Component
const GroundNewsSection: React.FC<{ isDarkMode: boolean; LucideIcon: any }> = ({ isDarkMode, LucideIcon }) => {
    const [isExpanded, setIsExpanded] = useState(() => {
        return localStorage.getItem('groundnews_expanded') === 'true';
    });
    const [iframeLoaded, setIframeLoaded] = useState(false);

    // Save expand state
    useEffect(() => {
        localStorage.setItem('groundnews_expanded', String(isExpanded));
    }, [isExpanded]);

    // Get credentials from environment (if available)
    const hasCredentials = typeof window !== 'undefined' &&
        (window as any).GROUND_NEWS_EMAIL &&
        (window as any).GROUND_NEWS_PASSWORD;

    const groundNewsUrl = 'https://ground.news/';

    return (
        <div className={`rounded-xl transition-all duration-300 ${
            isDarkMode
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        }`}>
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-700/20 transition-colors duration-200 rounded-t-xl"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                        <LucideIcon name="Globe" className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="text-left">
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            🌍 Ground News
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Actualités avec analyse de biais médiatiques
                            {hasCredentials && <span className="ml-2 text-green-500">● Connecté</span>}
                        </p>
                    </div>
                </div>
                <LucideIcon
                    name={isExpanded ? "ChevronUp" : "ChevronDown"}
                    className={`w-6 h-6 transition-transform duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                />
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="p-6 pt-0 space-y-4">
                    {/* Info Banner */}
                    <div className={`p-4 rounded-lg ${
                        isDarkMode ? 'bg-blue-900/20 border border-blue-600/30' : 'bg-blue-50 border border-blue-200'
                    }`}>
                        <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                            <strong>Ground News</strong> compare les sources médiatiques et révèle les biais politiques dans la couverture d'actualité.
                        </p>
                    </div>

                    {/* Loading Indicator */}
                    {!iframeLoaded && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Chargement de Ground News...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Iframe */}
                    <div className={`relative rounded-lg overflow-hidden ${iframeLoaded ? 'block' : 'hidden'}`}>
                        <iframe
                            src={groundNewsUrl}
                            className="w-full h-[800px] rounded-lg"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                            onLoad={() => setIframeLoaded(true)}
                            title="Ground News"
                        />
                    </div>

                    {/* Open in New Tab Button */}
                    <div className="flex justify-end">
                        <a
                            href={groundNewsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                                isDarkMode
                                    ? 'bg-green-600 hover:bg-green-500 text-white'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                        >
                            <LucideIcon name="ExternalLink" className="w-4 h-4" />
                            Ouvrir dans un nouvel onglet
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export const NouvellesTab: React.FC<TabProps> = memo((props) => {
    const {
        isDarkMode = true,
        newsData: newsDataProp = [],
        loading = false,
        lastUpdate,
        fetchNews,
        LucideIcon: LucideIconProp
    } = props;

    const newsData = newsDataProp;
    const LucideIcon = LucideIconProp || (({ name, className = '' }) => (
        <span className={className}>{name}</span>
    ));

    // Sub-tabs state
    const [activeSubTab, setActiveSubTab] = useState<'all' | 'french' | 'by-source' | 'by-market' | 'ground'>('all');
    
    const [localFrenchOnly, setLocalFrenchOnly] = useState(false);
    const [selectedSource, setSelectedSource] = useState('all');
    const [selectedMarket, setSelectedMarket] = useState('all');
    const [selectedTheme, setSelectedTheme] = useState('all');
    const [localFilteredNews, setLocalFilteredNews] = useState<any[]>([]);
    const [isApproximateMatch, setIsApproximateMatch] = useState(false);
    const [isLoadingNews, setIsLoadingNews] = useState(false);

    // ✅ FIX: Charger les news automatiquement si vides au montage ou quand newsData change
    useEffect(() => {
        if ((!newsData || newsData.length === 0) && fetchNews && !loading && !isLoadingNews) {
            console.log('📰 NouvellesTab: newsData vide, chargement automatique...');
            setIsLoadingNews(true);
            fetchNews('general', 100).then(() => {
                setIsLoadingNews(false);
            }).catch(err => {
                console.error('Erreur chargement news:', err);
                setIsLoadingNews(false);
            });
        }
    }, [newsData.length, fetchNews, loading]); // Se déclenche quand newsData change ou au montage
    
    // BUG #1 FIX: Pagination et lazy loading pour éviter freeze
    const [displayedCount, setDisplayedCount] = useState(20); // Limiter à 20 articles initialement
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const ARTICLES_PER_PAGE = 20;

    // Listes de filtres
    const sources = ['Bloomberg', 'Reuters', 'WSJ', 'CNBC', 'MarketWatch', 'La Presse', 'Les Affaires'];
    const markets = ['US', 'Canada', 'Europe', 'Asie'];
    const themes = ['Tech', 'Finance', 'Énergie', 'Santé', 'Crypto', 'IA'];

    // Fonction pour détecter si un article est en français
    const isFrenchArticle = (article: any) => {
        const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
        const frenchIndicators = ['le ', 'la ', 'les ', 'un ', 'une ', 'des ', 'du ', 'de la ', 'au ', 'aux ', 
            'est ', 'sont ', 'pour ', 'dans ', 'avec ', 'sur ', 'par ', 'qui ', 'que ', 
            'québec', 'montréal', 'canada', 'français', 'économie', 'marchés'];
        return frenchIndicators.some(indicator => text.includes(indicator));
    };

    // Fonction pour nettoyer le texte
    const cleanText = (text: string) => {
        if (!text) return '';
        return text.replace(/\[.*?\]/g, '').trim();
    };

    // Fonction pour obtenir l'icône de news
    const getNewsIcon = (title: string, description: string, sentiment?: string) => {
        const text = ((title || '') + ' ' + (description || '')).toLowerCase();
        
        if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum')) {
            return { icon: 'Bitcoin', color: 'text-orange-500' };
        }
        if (text.includes('tech') || text.includes('apple') || text.includes('google') || text.includes('microsoft')) {
            return { icon: 'Cpu', color: 'text-blue-500' };
        }
        if (text.includes('oil') || text.includes('energy') || text.includes('gas')) {
            return { icon: 'Flame', color: 'text-yellow-500' };
        }
        if (text.includes('bank') || text.includes('fed') || text.includes('rate')) {
            return { icon: 'Building2', color: 'text-green-500' };
        }
        if (sentiment === 'positive' || text.includes('surge') || text.includes('gain') || text.includes('rise')) {
            return { icon: 'TrendingUp', color: 'text-green-500' };
        }
        if (sentiment === 'negative' || text.includes('fall') || text.includes('drop') || text.includes('crash')) {
            return { icon: 'TrendingDown', color: 'text-red-500' };
        }
        return { icon: 'Newspaper', color: 'text-gray-500' };
    };

    // Fonction pour obtenir la crédibilité de la source
    const getSourceCredibility = (sourceName?: string) => {
        if (!sourceName) return 50;
        const source = sourceName.toLowerCase();
        const highCredibility = ['bloomberg', 'reuters', 'wsj', 'wall street journal', 'financial times', 'cnbc'];
        const mediumCredibility = ['marketwatch', 'yahoo finance', 'seeking alpha', 'investopedia'];
        
        if (highCredibility.some(s => source.includes(s))) return 100;
        if (mediumCredibility.some(s => source.includes(s))) return 85;
        if (source.includes('la presse') || source.includes('les affaires')) return 90;
        return 70;
    };

    // Fonction pour détecter la source avec variations de noms
    const matchesSource = (articleSource: string, selected: string) => {
        if (!articleSource || !selected) return false;
        const source = articleSource.toLowerCase();
        const sel = selected.toLowerCase();
        
        const sourceVariations: Record<string, string[]> = {
            'bloomberg': ['bloomberg', 'bloomberg.com', 'bloomberg news'],
            'reuters': ['reuters', 'reuters.com', 'thomson reuters'],
            'wsj': ['wsj', 'wall street journal', 'the wall street journal', 'wsj.com'],
            'cnbc': ['cnbc', 'cnbc.com'],
            'marketwatch': ['marketwatch', 'marketwatch.com', 'market watch'],
            'la presse': ['la presse', 'lapresse', 'lapresse.ca', 'presse'],
            'les affaires': ['les affaires', 'lesaffaires', 'lesaffaires.com', 'affaires']
        };
        
        if (source.includes(sel) || sel.includes(source)) return true;
        
        const variations = sourceVariations[sel];
        if (variations) {
            return variations.some(variation => source.includes(variation));
        }
        
        return false;
    };

    // Fonction pour résumer avec Emma
    const summarizeWithEmma = (url: string, title: string) => {
        const message = `Résume cet article: ${title}\n${url}`;
        if (props.setPrefillMessage) {
            props.setPrefillMessage(message);
        }
        if (props.setActiveTab) {
            props.setActiveTab('ask-emma');
        }
    };

    // Filtrer les nouvelles
    useEffect(() => {
        // ✅ FIX: Vérifier que newsData existe et est un tableau non vide
        if (!newsData || !Array.isArray(newsData) || newsData.length === 0) {
            setLocalFilteredNews([]);
            setIsApproximateMatch(false);
            // Si pas de données et fetchNews disponible, essayer de charger
            if (fetchNews && newsData.length === 0) {
                fetchNews('general', 100).catch(err => {
                    console.error('Erreur chargement nouvelles:', err);
                });
            }
            return;
        }

        let filtered = newsData;
        let hasExactMatches = true;

        // Appliquer le filtre français si activé
        if (localFrenchOnly) {
            filtered = filtered.filter(article => isFrenchArticle(article));
        }

        // Appliquer le filtre source avec détection flexible
        if (selectedSource !== 'all') {
            const beforeFilter = filtered.length;
            filtered = filtered.filter(article =>
                matchesSource(article.source?.name, selectedSource)
            );
            if (filtered.length === 0 && beforeFilter > 0) {
                filtered = newsData.filter(article => {
                    const sourceName = (article.source?.name || '').toLowerCase();
                    const selected = selectedSource.toLowerCase();
                    return sourceName.includes(selected) || selected.includes(sourceName);
                });
                hasExactMatches = false;
            }
        }

        // Appliquer le filtre marché
        if (selectedMarket !== 'all') {
            const marketKeywords: Record<string, string[]> = {
                'US': ['u.s.', 'united states', 'american', 'wall street', 'nasdaq', 'dow', 's&p', 'sp500', 'federal reserve', 'fed', 'sec', 'new york', 'nyse', 'us market', 'us economy'],
                'Canada': ['canada', 'canadian', 'toronto', 'tsx', 'montreal', 'quebec', 'ontario', 'alberta', 'vancouver', 'canadian market', 'canadian economy', 'bank of canada', 'boc'],
                'Europe': ['europe', 'european', 'eu', 'ecb', 'london', 'frankfurt', 'paris', 'ftse', 'dax', 'cac', 'eurozone', 'euro', 'uk', 'germany', 'france', 'italy', 'spain'],
                'Asie': ['asia', 'asian', 'china', 'chinese', 'japan', 'japanese', 'tokyo', 'shanghai', 'hong kong', 'nikkei', 'south korea', 'korean', 'singapore', 'india', 'indian', 'taiwan']
            };
            const beforeFilter = filtered.length;
            filtered = filtered.filter(article => {
                const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                return marketKeywords[selectedMarket]?.some(keyword => text.includes(keyword));
            });
            if (filtered.length === 0 && beforeFilter > 0) {
                const fallbackKeywords: Record<string, string[]> = {
                    'US': ['us', 'usa', 'america'],
                    'Canada': ['canada'],
                    'Europe': ['europe', 'eu'],
                    'Asie': ['asia', 'china', 'japan']
                };
                filtered = newsData.filter(article => {
                    const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                    return fallbackKeywords[selectedMarket]?.some(keyword => text.includes(keyword));
                });
                hasExactMatches = false;
            }
        }

        // Appliquer le filtre thème
        if (selectedTheme !== 'all') {
            const themeKeywords: Record<string, string[]> = {
                'Tech': ['tech', 'technology', 'software', 'cloud', 'apple', 'google', 'microsoft', 'amazon', 'meta', 'tesla', 'nvidia', 'amd', 'intel', 'samsung', 'iphone', 'android', 'ai', 'artificial intelligence'],
                'Finance': ['bank', 'banque', 'finance', 'financial', 'trading', 'investment', 'investor', 'credit', 'loan', 'mortgage', 'interest rate', 'fed', 'central bank', 'stock market', 'equity', 'bond'],
                'Énergie': ['energy', 'oil', 'gas', 'petroleum', 'renewable', 'solar', 'wind', 'nuclear', 'exxon', 'chevron', 'bp', 'shell', 'crude', 'barrel', 'opec'],
                'Santé': ['health', 'healthcare', 'pharma', 'pharmaceutical', 'medical', 'drug', 'medicine', 'vaccine', 'hospital', 'medicare', 'pfizer', 'moderna', 'johnson & johnson'],
                'Crypto': ['crypto', 'cryptocurrency', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'coinbase', 'binance', 'crypto market', 'digital currency'],
                'IA': ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'chatgpt', 'openai', 'nvidia', 'neural network', 'llm', 'large language model']
            };
            const beforeFilter = filtered.length;
            filtered = filtered.filter(article => {
                const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                return themeKeywords[selectedTheme]?.some(keyword => text.includes(keyword));
            });
            if (filtered.length === 0 && beforeFilter > 0) {
                const fallbackKeywords: Record<string, string[]> = {
                    'Tech': ['tech', 'technology'],
                    'Finance': ['finance', 'financial', 'bank'],
                    'Énergie': ['energy', 'oil', 'gas'],
                    'Santé': ['health', 'medical'],
                    'Crypto': ['crypto', 'bitcoin'],
                    'IA': ['ai', 'artificial intelligence']
                };
                filtered = newsData.filter(article => {
                    const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                    return fallbackKeywords[selectedTheme]?.some(keyword => text.includes(keyword));
                });
                hasExactMatches = false;
            }
        }

        // Si toujours aucun résultat, afficher toutes les nouvelles
        if (filtered.length === 0 && newsData.length > 0) {
            filtered = newsData.slice(0, 20);
            hasExactMatches = false;
        }

        setIsApproximateMatch(!hasExactMatches);
        setLocalFilteredNews(filtered);
        // BUG #1 FIX: Réinitialiser le compteur d'affichage quand les filtres changent
        setDisplayedCount(ARTICLES_PER_PAGE);
    }, [newsData, localFrenchOnly, selectedSource, selectedMarket, selectedTheme]);

    // BUG #1 FIX: Intersection Observer pour lazy loading automatique
    useEffect(() => {
        if (!loadMoreRef.current || displayedCount >= localFilteredNews.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);
                    // Debounce: charger plus d'articles après un court délai
                    setTimeout(() => {
                        setDisplayedCount(prev => Math.min(prev + ARTICLES_PER_PAGE, localFilteredNews.length));
                        setIsLoadingMore(false);
                    }, 300);
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [displayedCount, localFilteredNews.length, isLoadingMore]);

    // Articles à afficher (limités par pagination)
    const displayedNews = localFilteredNews.slice(0, displayedCount);
    const hasMore = displayedCount < localFilteredNews.length;

    // Sub-tabs configuration
    const subTabs = [
        { id: 'all' as const, label: 'Toutes', icon: 'Newspaper' },
        { id: 'french' as const, label: 'Français', icon: 'Languages' },
        { id: 'by-source' as const, label: 'Par Source', icon: 'Building2' },
        { id: 'by-market' as const, label: 'Par Marché', icon: 'Globe' },
        { id: 'ground' as const, label: 'Ground News', icon: 'Globe' }
    ];

    // Sync sub-tab changes with filters
    useEffect(() => {
        switch (activeSubTab) {
            case 'french':
                setLocalFrenchOnly(true);
                setSelectedSource('all');
                setSelectedMarket('all');
                setSelectedTheme('all');
                break;
            case 'by-source':
                setLocalFrenchOnly(false);
                setSelectedMarket('all');
                setSelectedTheme('all');
                break;
            case 'by-market':
                setLocalFrenchOnly(false);
                setSelectedSource('all');
                setSelectedTheme('all');
                break;
            case 'all':
            default:
                setLocalFrenchOnly(false);
                setSelectedSource('all');
                setSelectedMarket('all');
                setSelectedTheme('all');
                break;
        }
    }, [activeSubTab]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>📰 Nouvelles Financières</h2>
                <div className="flex gap-2">
                    {/* Toggle Français */}
                    <button
                        onClick={() => setLocalFrenchOnly(!localFrenchOnly)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                            localFrenchOnly
                                ? 'bg-blue-600 text-white'
                                : (isDarkMode
                                    ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900')
                        }`}
                    >
                        🇫🇷 Français {localFrenchOnly && '✓'}
                    </button>
                    <button
                        onClick={() => fetchNews && fetchNews()}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 ${
                            isDarkMode
                                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                        {loading ? '⏳ Actualisation...' : '🔄 Actualiser'}
                    </button>
                </div>
            </div>

            {lastUpdate && (
                <p className="text-gray-400 text-sm">
                    Dernière mise à jour: {new Date(lastUpdate).toLocaleString('fr-FR')}
                </p>
            )}

            {/* Secondary Navigation Bar - Sub-tabs */}
            <div className={`mb-6 p-2 rounded-2xl flex items-center gap-3 overflow-x-auto custom-scrollbar ${
                isDarkMode 
                    ? 'bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-white/10' 
                    : 'bg-gradient-to-r from-white/80 to-gray-50/80 border border-gray-200'
            }`}>
                {subTabs.map((subTab) => {
                    const isActive = activeSubTab === subTab.id;
                    return (
                        <button
                            key={subTab.id}
                            data-subtab={subTab.id}
                            onClick={() => setActiveSubTab(subTab.id)}
                            className={`group relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 border overflow-hidden ${
                                isActive
                                    ? (isDarkMode 
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105' 
                                        : 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105')
                                    : (isDarkMode 
                                        ? 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-105' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 hover:scale-105')
                            }`}
                        >
                            {/* Glow effect for active/hover */}
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer" />
                            )}
                            
                            <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                <LucideIcon name={subTab.icon} className="w-4 h-4" />
                            </span>
                            <span className="relative z-10 whitespace-nowrap">{subTab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Statistiques */}
            <div className={`p-4 rounded-xl transition-colors duration-300 ${
                isDarkMode
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {localFilteredNews.length}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Articles filtrés
                        </div>
                    </div>
                    <LucideIcon name="Newspaper" className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                </div>
            </div>

            {/* Filtres - Only show when relevant sub-tab is active */}
            {(activeSubTab === 'by-source' || activeSubTab === 'by-market' || activeSubTab === 'all') && (
            <div className={`p-6 rounded-xl transition-colors duration-300 ${
                isDarkMode
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            }`}>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    🔍 Filtres
                </h3>

                {/* Filtre Source */}
                <div className="mb-4">
                    <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        📰 Source
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedSource('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                selectedSource === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                            }`}
                        >
                            Toutes
                        </button>
                        {sources.map(source => (
                            <button
                                key={source}
                                onClick={() => setSelectedSource(source)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    selectedSource === source
                                        ? 'bg-blue-600 text-white'
                                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                }`}
                            >
                                {source}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtre Marché */}
                <div className="mb-4">
                    <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        🌍 Marché
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedMarket('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                selectedMarket === 'all'
                                    ? 'bg-green-600 text-white'
                                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                            }`}
                        >
                            Tous
                        </button>
                        {markets.map(market => (
                            <button
                                key={market}
                                onClick={() => setSelectedMarket(market)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    selectedMarket === market
                                        ? 'bg-green-600 text-white'
                                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                }`}
                            >
                                {market}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtre Thème */}
                <div>
                    <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        🏷️ Thématique
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedTheme('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                selectedTheme === 'all'
                                    ? 'bg-purple-600 text-white'
                                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                            }`}
                        >
                            Toutes
                        </button>
                        {themes.map(theme => (
                            <button
                                key={theme}
                                onClick={() => setSelectedTheme(theme)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    selectedTheme === theme
                                        ? 'bg-purple-600 text-white'
                                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                }`}
                            >
                                {theme}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message informatif pour les résultats approximatifs */}
                {isApproximateMatch && localFilteredNews.length > 0 && (
                    <div className={`mt-4 p-4 rounded-lg border-2 ${
                        isDarkMode
                            ? 'bg-yellow-900/20 border-yellow-600/50 text-yellow-200'
                            : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                    }`}>
                        <div className="flex items-start gap-3">
                            <span className="text-xl">💡</span>
                            <div>
                                <p className="font-semibold mb-1">Résultats similaires affichés</p>
                                <p className="text-sm">
                                    Aucun résultat exact trouvé pour les filtres sélectionnés. Nous affichons des articles similaires qui pourraient vous intéresser.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Ground News Section - Only show when ground sub-tab is active */}
            {activeSubTab === 'ground' && (
                <GroundNewsSection isDarkMode={isDarkMode} LucideIcon={LucideIcon} />
            )}

            {/* Liste des nouvelles avec pagination lazy - Hide when ground sub-tab is active */}
            {activeSubTab !== 'ground' && (
            <div className="space-y-4">
                {(loading || isLoadingNews) ? (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-lg font-semibold mb-2">Chargement des actualités...</p>
                        <p className="text-sm">Récupération des dernières nouvelles financières</p>
                    </div>
                ) : localFilteredNews.length === 0 ? (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <LucideIcon name="AlertCircle" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold mb-2">
                            {newsData.length === 0 
                                ? 'Aucune nouvelle chargée'
                                : localFrenchOnly 
                                    ? 'Aucun article en français trouvé' 
                                    : 'Aucune nouvelle disponible après filtrage'}
                        </p>
                        <p className="text-sm mb-4">
                            {newsData.length === 0
                                ? 'Les actualités sont en cours de chargement ou indisponibles'
                                : localFrenchOnly
                                    ? 'Essayez de désactiver le filtre français ou actualisez les données'
                                    : 'Essayez de modifier les filtres ou cliquez sur Actualiser'}
                        </p>
                        {fetchNews && (
                            <button
                                onClick={() => fetchNews('general', 100)}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                                    isDarkMode
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                                🔄 Charger les actualités
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {displayedNews.map((article, index) => {
                        const newsIconData = getNewsIcon(article.title, article.description, article.sentiment);
                        const credibility = getSourceCredibility(article.source?.name);

                        return (
                            <div
                                key={index}
                                className={`p-6 rounded-xl transition-all duration-300 hover:scale-[1.01] ${
                                    isDarkMode
                                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-gray-600'
                                        : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icône */}
                                    <div className={`p-3 rounded-full transition-colors duration-300 ${
                                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/60'
                                    }`}>
                                        <LucideIcon name={newsIconData.icon} className={`w-6 h-6 ${newsIconData.color}`} />
                                    </div>

                                    {/* Contenu */}
                                    <div className="flex-1">
                                        {/* Titre */}
                                        <h3 className={`font-bold text-lg mb-2 transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {article.url ? (
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`hover:underline transition-colors duration-300 ${
                                                        isDarkMode
                                                            ? 'text-blue-300 hover:text-blue-200'
                                                            : 'text-blue-600 hover:text-blue-700'
                                                    }`}
                                                >
                                                    {cleanText(article.title)}
                                                </a>
                                            ) : (
                                                cleanText(article.title)
                                            )}
                                        </h3>

                                        {/* Description */}
                                        <p className={`text-base mb-4 leading-relaxed transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                            {cleanText(article.description)}
                                        </p>

                                        {/* Métadonnées */}
                                        <div className="flex items-center gap-4 flex-wrap">
                                            {/* Source avec badge de crédibilité */}
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors duration-300 ${
                                                credibility >= 100
                                                    ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30'
                                                    : credibility >= 85
                                                    ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                                    : credibility >= 75
                                                    ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                                    : (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700')
                                            }`}>
                                                {credibility >= 100 && <span className="text-xs">⭐</span>}
                                                <span className="text-xs font-semibold">{article.source?.name || 'Source inconnue'}</span>
                                            </div>

                                            {/* Date */}
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {new Date(article.publishedAt || article.publishedDate).toLocaleString('fr-FR')}
                                            </span>

                                            {/* Badge français */}
                                            {isFrenchArticle(article) && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">
                                                    🇫🇷 FR
                                                </span>
                                            )}

                                            {/* Bouton Résumé avec Emma */}
                                            {article.url && (
                                                <button
                                                    onClick={() => summarizeWithEmma(article.url, article.title)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 ${
                                                        isDarkMode
                                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                                                            : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-1">
                                                        <LucideIcon name="Brain" className="w-3 h-3" />
                                                        Résumé avec Emma
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                        })}
                        
                        {/* BUG #1 FIX: Intersection Observer trigger et bouton "Charger plus" */}
                        {hasMore && (
                            <div ref={loadMoreRef} className="flex justify-center py-6">
                                {isLoadingMore ? (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                        <span>Chargement...</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsLoadingMore(true);
                                            setTimeout(() => {
                                                setDisplayedCount(prev => Math.min(prev + ARTICLES_PER_PAGE, localFilteredNews.length));
                                                setIsLoadingMore(false);
                                            }, 300);
                                        }}
                                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                                            isDarkMode
                                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                        }`}
                                    >
                                        Charger plus ({localFilteredNews.length - displayedCount} restants)
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* Indicateur de fin */}
                        {!hasMore && localFilteredNews.length > 0 && (
                            <div className={`text-center py-4 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                Tous les articles ont été chargés ({localFilteredNews.length} articles)
                            </div>
                        )}
                    </>
                )}
            </div>
            )}
        </div>
    );
});

// Set display name for debugging
NouvellesTab.displayName = 'NouvellesTab';

export default NouvellesTab;













