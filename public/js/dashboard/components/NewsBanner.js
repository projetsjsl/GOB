/**
 * Composant NewsBanner - Bandeau d'actualités financières défilant
 */

const { useState, useEffect, useRef } = React;

const NewsBanner = ({ isDarkMode = true, forceVisible = false }) => {
    // Initialiser isVisible en vérifiant localStorage, mais forcer visible si demandé
    const getInitialVisibility = () => {
        if (forceVisible) return true;
        const saved = localStorage.getItem('news-banner-visible');
        // Par défaut visible si non défini
        return saved === null ? true : saved === 'true';
    };
    
    const [news, setNews] = useState([]);
    const [isVisible, setIsVisible] = useState(getInitialVisibility());
    const [isLoading, setIsLoading] = useState(true);
    const [newsType, setNewsType] = useState('all');
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const tickerRef = useRef(null);
    const animationRef = useRef(null);
    const intervalRef = useRef(null);

    // Écouter si le modal ThemeSelector est ouvert
    useEffect(() => {
        const checkModalOpen = () => {
            // Vérifier si le modal ThemeSelector est ouvert en cherchant l'élément
            const modal = document.querySelector('.theme-selector-modal');
            setIsModalOpen(modal !== null && modal.style.display !== 'none');
        };

        // Vérifier initialement
        checkModalOpen();

        // Observer les changements dans le DOM
        const observer = new MutationObserver(checkModalOpen);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

        // Écouter les événements personnalisés
        const handleModalOpen = () => setIsModalOpen(true);
        const handleModalClose = () => setIsModalOpen(false);
        
        window.addEventListener('themeSelectorOpen', handleModalOpen);
        window.addEventListener('themeSelectorClose', handleModalClose);

        return () => {
            observer.disconnect();
            window.removeEventListener('themeSelectorOpen', handleModalOpen);
            window.removeEventListener('themeSelectorClose', handleModalClose);
        };
    }, []);

    // Charger les actualités au montage et quand le type change
    useEffect(() => {
        loadNews();
        
        // Recharger les actualités toutes les 5 minutes
        const interval = setInterval(loadNews, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, [newsType]);

    // Animation séquentielle comme un compteur de kilomètres (pause, prochaine, pause, prochaine)
    useEffect(() => {
        if (!isVisible || news.length === 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Réinitialiser l'index quand les nouvelles changent
        setCurrentNewsIndex(0);

        // Changer de nouvelle toutes les 5 secondes (pause de 5s)
        if (!isPaused) {
            intervalRef.current = setInterval(() => {
                setCurrentNewsIndex((prevIndex) => {
                    return (prevIndex + 1) % news.length;
                });
            }, 5000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [news, isVisible, isPaused]);

    const loadNews = async () => {
        try {
            setIsLoading(true);

            // 🔥 FIX: Add timeout to prevent infinite loading
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            const response = await fetch(`/api/finviz-news?type=${newsType}&limit=40`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // 🔥 FIX: Check if response is OK before parsing
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.news && data.news.length > 0) {
                setNews(data.news);
            } else {
                // Fallback: news par défaut
                setNews([
                    {
                        time: 'Aujourd\'hui, 11:15 AM',
                        headline: 'Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data',
                        source: 'MarketWatch',
                        type: 'market',
                        url: 'https://www.marketwatch.com'
                    },
                    {
                        time: 'Aujourd\'hui, 10:45 AM',
                        headline: 'Federal Reserve signals potential rate cuts as inflation cools',
                        source: 'Reuters',
                        type: 'economy',
                        url: 'https://www.reuters.com'
                    },
                    {
                        time: 'Aujourd\'hui, 10:20 AM',
                        headline: 'Oil prices rise on supply concerns amid Middle East tensions',
                        source: 'Bloomberg',
                        type: 'commodities',
                        url: 'https://www.bloomberg.com'
                    }
                ]);
            }
        } catch (error) {
            console.error('Erreur chargement actualités:', error);

            // 🔥 FIX: Show more specific error message
            if (error.name === 'AbortError') {
                console.warn('⚠️ News API timeout - using fallback news');
            }

            // Fallback news - always load something so UI isn't stuck
            setNews([
                {
                    time: 'Aujourd\'hui, 11:15 AM',
                    headline: 'Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data',
                    source: 'MarketWatch',
                    type: 'market',
                    url: 'https://www.marketwatch.com'
                }
            ]);
        } finally {
            // 🔥 FIX: ALWAYS set loading to false, no matter what
            setIsLoading(false);
        }
    };

    // Restaurer depuis localStorage - Par défaut visible si non défini
    // Si forceVisible est true, ignorer localStorage
    useEffect(() => {
        if (forceVisible) {
            setIsVisible(true);
            localStorage.setItem('news-banner-visible', 'true');
            return;
        }
        const saved = localStorage.getItem('news-banner-visible');
        // Si aucune préférence sauvegardée, le banner est visible par défaut
        if (saved === null) {
            setIsVisible(true);
            localStorage.setItem('news-banner-visible', 'true');
        } else {
            // Forcer l'affichage par défaut - le banner sera toujours visible au chargement
            // L'utilisateur peut toujours le fermer manuellement, mais il réapparaîtra au prochain chargement
            setIsVisible(true);
            localStorage.setItem('news-banner-visible', 'true');
        }
    }, [forceVisible]);
    
    // Exposer une fonction globale pour réactiver le banner
    useEffect(() => {
        window.showNewsBanner = () => {
            setIsVisible(true);
            localStorage.setItem('news-banner-visible', 'true');
            void('📰 NewsBanner réactivé');
        };
        return () => {
            delete window.showNewsBanner;
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('news-banner-visible', 'false');
    };

    // Icônes pour les types de nouvelles
    const getTypeIcon = (type) => {
        const icons = {
            'market': '📈',
            'economy': '🏛️',
            'stocks': '💼',
            'crypto': '₿',
            'forex': '💱',
            'commodities': '🛢️',
            'earnings': '📊',
            'ipo': '🚀',
            'mergers': '🤝',
            'other': '📰'
        };
        return icons[type] || icons['other'];
    };

    // Icônes pour les sources
    const getSourceIcon = (source) => {
        const sourceLower = source.toLowerCase();
        if (sourceLower.includes('bloomberg')) return '🔵';
        if (sourceLower.includes('reuters')) return '🔴';
        if (sourceLower.includes('marketwatch')) return '🟡';
        if (sourceLower.includes('cnbc')) return '🟢';
        if (sourceLower.includes('wsj') || sourceLower.includes('wall street')) return '📰';
        if (sourceLower.includes('ft') || sourceLower.includes('financial times')) return '📄';
        if (sourceLower.includes('yahoo')) return '💜';
        if (sourceLower.includes('finviz')) return '📊';
        return '📰';
    };

    // Types de nouvelles disponibles
    const newsTypes = [
        { value: 'all', label: 'Toutes', icon: '📰' },
        { value: 'market', label: 'Marché', icon: '📈' },
        { value: 'economy', label: 'Économie', icon: '🏛️' },
        { value: 'stocks', label: 'Actions', icon: '💼' },
        { value: 'crypto', label: 'Crypto', icon: '₿' },
        { value: 'forex', label: 'Forex', icon: '💱' },
        { value: 'commodities', label: 'Matières', icon: '🛢️' },
        { value: 'earnings', label: 'Résultats', icon: '📊' },
        { value: 'ipo', label: 'IPO', icon: '🚀' },
        { value: 'mergers', label: 'Fusions', icon: '🤝' }
    ];

    // Debug: Log l'état de visibilité
    useEffect(() => {
        void('📰 NewsBanner - État:', { isVisible, isModalOpen, forceVisible, newsCount: news.length });
    }, [isVisible, isModalOpen, forceVisible, news.length]);

    if (!isVisible && !forceVisible) {
        void('📰 NewsBanner masqué: isVisible=false');
        return null;
    }

    // Masquer le NewsBanner si un modal est ouvert (sauf si forceVisible)
    if (isModalOpen && !forceVisible) {
        void('📰 NewsBanner masqué: modal ouvert');
        return null;
    }

    return (
        <>
            <style>{`
                @keyframes fadeInSlide {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
            <div
                className="relative w-full border-b overflow-hidden transition-colors duration-300"
                style={{
                    backgroundColor: 'var(--theme-header-bg, #0a0e27)',
                    borderTop: '1px solid var(--theme-border, rgba(16, 185, 129, 0.3))',
                    borderBottom: '1px solid var(--theme-border, rgba(16, 185, 129, 0.3))',
                    height: '52px',
                    zIndex: 5,
                    position: 'relative',
                    boxShadow: 'var(--theme-shadow, 0 2px 8px rgba(0, 0, 0, 0.1))',
                    backdropFilter: 'var(--theme-backdrop-filter, none)',
                    WebkitBackdropFilter: 'var(--theme-backdrop-filter, none)',
                }}
            >
            {/* Left icon + Type selector */}
            <div
                className="absolute left-4 top-0 bottom-0 flex items-center gap-2 z-20"
            >
                <div
                    className="flex items-center justify-center transition-colors duration-300"
                    style={{
                        width: '20px',
                        height: '20px',
                        color: 'var(--theme-primary, #10b981)',
                        pointerEvents: 'none'
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                </div>
                
                {/* Type selector button */}
                <button
                    onClick={() => setShowTypeSelector(!showTypeSelector)}
                    className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 hover:opacity-90"
                    style={{
                        backgroundColor: 'rgba(var(--theme-primary-rgb, 16, 185, 129), 0.15)',
                        color: 'var(--theme-primary, #10b981)',
                        border: '1px solid rgba(var(--theme-primary-rgb, 16, 185, 129), 0.3)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}
                    title="Filtrer par type de nouvelle"
                >
                    {newsTypes.find(t => t.value === newsType)?.icon || '📰'} {newsTypes.find(t => t.value === newsType)?.label || 'Toutes'}
                </button>
                
                {/* Type selector dropdown */}
                {showTypeSelector && (
                    <div
                        className="absolute left-0 top-full mt-1 rounded-lg shadow-xl border overflow-hidden backdrop-blur-md"
                        style={{
                            backgroundColor: 'var(--theme-surface, #1f2937)',
                            borderColor: 'var(--theme-border, rgba(255,255,255,0.1))',
                            minWidth: '150px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 50
                        }}
                    >
                        {newsTypes.map(type => (
                            <button
                                key={type.value}
                                onClick={() => {
                                    setNewsType(type.value);
                                    setShowTypeSelector(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm transition-colors hover:opacity-80 flex items-center gap-2"
                                style={{
                                    backgroundColor: newsType === type.value 
                                        ? 'rgba(var(--theme-primary-rgb, 16, 185, 129), 0.2)'
                                        : 'transparent',
                                    color: 'var(--theme-text, #e0e7ff)'
                                }}
                            >
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* News content - Affichage séquentiel comme un compteur de kilomètres */}
            <div
                ref={tickerRef}
                className="absolute left-48 right-20 top-0 bottom-0 overflow-hidden flex items-center"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {isLoading ? (
                    <div
                        className="flex items-center gap-2 px-4"
                        style={{ color: 'var(--theme-primary, #10b981)' }}
                    >
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium" style={{ color: 'var(--theme-text, #e0e7ff)' }}>Chargement des actualités...</span>
                    </div>
                ) : news.length > 0 ? (
                    <div 
                        key={currentNewsIndex}
                        className="flex items-center gap-2 px-4 cursor-pointer hover:opacity-80 transition-all duration-500 ease-in-out w-full"
                        style={{
                            animation: 'fadeInSlide 0.5s ease-in-out',
                            opacity: 1
                        }}
                        onClick={() => {
                            const currentItem = news[currentNewsIndex];
                            if (currentItem && currentItem.url) {
                                window.open(currentItem.url, '_blank', 'noopener,noreferrer');
                            }
                        }}
                        title={news[currentNewsIndex]?.url ? `${news[currentNewsIndex].source} - ${news[currentNewsIndex].type} - Cliquer pour ouvrir l'article` : `${news[currentNewsIndex]?.source} - ${news[currentNewsIndex]?.type}`}
                    >
                        {/* Type icon */}
                        <span className="text-base flex-shrink-0" title={`Type: ${news[currentNewsIndex]?.type || 'other'}`}>
                            {getTypeIcon(news[currentNewsIndex]?.type || 'other')}
                        </span>
                        
                        {/* Source icon */}
                        <span className="text-sm flex-shrink-0" title={`Source: ${news[currentNewsIndex]?.source}`}>
                            {getSourceIcon(news[currentNewsIndex]?.source)}
                        </span>
                        
                        <span
                            className="text-sm font-semibold transition-colors duration-300"
                            style={{ color: 'var(--theme-primary, #10b981)', minWidth: '80px', maxWidth: '100px', flexShrink: 0 }}
                        >
                            {news[currentNewsIndex]?.source || news[currentNewsIndex]?.source_provider || news[currentNewsIndex]?.source_original || 'Source'}
                        </span>
                        <span
                            className="text-base font-medium flex-1 transition-colors duration-300"
                            style={{ 
                                color: 'var(--theme-text, #e0e7ff)',
                                cursor: news[currentNewsIndex]?.url ? 'pointer' : 'default',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginLeft: '8px'
                            }}
                        >
                            {news[currentNewsIndex]?.headline}
                        </span>
                        {news[currentNewsIndex]?.url && (
                            <svg 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                className="w-3 h-3 flex-shrink-0"
                                style={{ color: 'var(--theme-text-secondary, rgba(156, 163, 175, 0.6))' }}
                            >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        )}
                        {/* Indicateur de progression (comme un compteur) */}
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            <span className="text-xs transition-colors duration-300" style={{ color: 'var(--theme-primary, #10b981)' }}>
                                {currentNewsIndex + 1}/{news.length}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 text-sm transition-colors duration-300" style={{ color: 'var(--theme-text-secondary, #9ca3af)' }}>
                        Aucune actualité disponible
                    </div>
                )}
            </div>

            {/* Close button */}
            <button
                onClick={handleClose}
                className="absolute right-4 top-0 bottom-0 flex items-center justify-center z-20 transition-all duration-300 hover:opacity-80"
                style={{
                    width: '28px',
                    height: '28px',
                    color: 'var(--theme-primary, #10b981)',
                    backgroundColor: 'rgba(var(--theme-primary-rgb, 16, 185, 129), 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(var(--theme-primary-rgb, 16, 185, 129), 0.3)'
                }}
                title="Fermer le bandeau d'actualités"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        </>
    );
};

window.NewsBanner = NewsBanner;


