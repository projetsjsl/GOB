/**
 * NewsBanner - Design Premium Réinventé
 * UI/UX Professionnel avec Hiérarchie Visuelle Claire
 */

const { useState, useEffect, useRef } = React;

const NewsBanner = ({ isDarkMode = true, forceVisible = false }) => {
    const getInitialVisibility = () => {
        if (forceVisible) return true;
        const saved = localStorage.getItem('news-banner-visible');
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
    const [timeRemaining, setTimeRemaining] = useState(5);
    const tickerRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        const checkModalOpen = () => {
            const modal = document.querySelector('.theme-selector-modal');
            setIsModalOpen(modal !== null && modal.style.display !== 'none');
        };
        checkModalOpen();
        const observer = new MutationObserver(checkModalOpen);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
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

    useEffect(() => {
        loadNews();
        const interval = setInterval(loadNews, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [newsType]);

    useEffect(() => {
        if (!isVisible || news.length === 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }
        setCurrentNewsIndex(0);
        if (!isPaused) {
            intervalRef.current = setInterval(() => {
                setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % news.length);
            }, 5000);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [news, isVisible, isPaused]);

    useEffect(() => {
        if (!isVisible || news.length === 0 || isPaused) return;
        const timer = setInterval(() => {
            setTimeRemaining((prev) => prev <= 0.1 ? 5 : prev - 0.1);
        }, 100);
        return () => clearInterval(timer);
    }, [isVisible, news.length, isPaused, currentNewsIndex]);

    useEffect(() => {
        setTimeRemaining(5);
    }, [currentNewsIndex]);

    const loadNews = async () => {
        try {
            setIsLoading(true);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(`/api/finviz-news?type=${newsType}&limit=40`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success && data.news && data.news.length > 0) {
                setNews(data.news);
            } else {
                setNews([{
                    time: 'Aujourd\'hui, 11:15 AM',
                    headline: 'Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data',
                    source: 'MarketWatch',
                    type: 'market',
                    url: 'https://www.marketwatch.com'
                }]);
            }
        } catch (error) {
            console.error('Erreur chargement actualités:', error);
            setNews([{
                time: 'Aujourd\'hui, 11:15 AM',
                headline: 'Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data',
                source: 'MarketWatch',
                type: 'market',
                url: 'https://www.marketwatch.com'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (forceVisible) {
            setIsVisible(true);
            localStorage.setItem('news-banner-visible', 'true');
            return;
        }
        const saved = localStorage.getItem('news-banner-visible');
        if (saved === null) {
            setIsVisible(true);
            localStorage.setItem('news-banner-visible', 'true');
        } else {
            setIsVisible(true);
            localStorage.setItem('news-banner-visible', 'true');
        }
    }, [forceVisible]);
    
    useEffect(() => {
        window.showNewsBanner = () => {
            setIsVisible(true);
            localStorage.setItem('news-banner-visible', 'true');
        };
        return () => { delete window.showNewsBanner; };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('news-banner-visible', 'false');
    };

    const getTypeIcon = (type) => {
        const icons = {
            'market': '📈', 'economy': '🏛️', 'stocks': '💼', 'crypto': '₿',
            'forex': '💱', 'commodities': '🛢️', 'earnings': '📊', 'ipo': '🚀',
            'mergers': '🤝', 'other': '📰'
        };
        return icons[type] || icons['other'];
    };

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

    if (!isVisible && !forceVisible) return null;
    if (isModalOpen && !forceVisible) return null;

    const currentNews = news[currentNewsIndex];

    return (
        <>
            <style>{`
                @keyframes slideInFromRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .news-banner-container {
                    background: ${isDarkMode 
                        ? 'linear-gradient(135deg, rgba(10, 14, 27, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.98) 100%)'
                    };
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                    border-bottom: 1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'};
                    box-shadow: ${isDarkMode 
                        ? '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                        : '0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    };
                }
                .news-content-wrapper {
                    animation: slideInFromRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .type-badge {
                    background: ${isDarkMode 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.05))'
                    };
                    border: 1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)'};
                    backdrop-filter: blur(8px);
                }
                .source-badge-premium {
                    background: ${isDarkMode 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.08))'
                    };
                    border: 1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)'};
                    backdrop-filter: blur(8px);
                }
                .progress-bar-gradient {
                    background: linear-gradient(90deg, #10b981, #059669, #10b981);
                    background-size: 200% 100%;
                    animation: shimmer 2s linear infinite;
                }
                .news-headline {
                    color: ${isDarkMode ? '#ffffff' : '#111827'};
                    text-shadow: ${isDarkMode 
                        ? '0 1px 3px rgba(0, 0, 0, 0.5)'
                        : '0 1px 2px rgba(255, 255, 255, 0.8)'
                    };
                }
                .news-headline:hover {
                    color: ${isDarkMode ? '#34d399' : '#059669'};
                }
            `}</style>
            
            <div className="news-banner-container relative w-full h-16 flex items-center">
                {/* LEFT SECTION: Icon + Filter */}
                <div className="absolute left-0 h-full flex items-center gap-3 px-4 z-30">
                    {/* News Icon */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg type-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" style={{ color: 'var(--theme-primary, #10b981)' }}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                    </div>
                    
                    {/* Type Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTypeSelector(!showTypeSelector)}
                            className="type-badge px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 hover:scale-105"
                            style={{ color: 'var(--theme-primary, #10b981)' }}
                        >
                            <span className="text-sm">{newsTypes.find(t => t.value === newsType)?.icon || '📰'}</span>
                            <span>{newsTypes.find(t => t.value === newsType)?.label || 'Toutes'}</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3 h-3 transition-transform duration-200 ${showTypeSelector ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showTypeSelector && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowTypeSelector(false)} style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}></div>
                                <div className="absolute left-0 top-full mt-2 rounded-xl shadow-2xl border overflow-hidden z-50"
                                    style={{
                                        background: isDarkMode 
                                            ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.98), rgba(17, 24, 39, 0.98))'
                                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.98))',
                                        borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                                        minWidth: '160px',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        boxShadow: isDarkMode 
                                            ? '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                            : '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                                    }}
                                >
                                    {newsTypes.map(type => (
                                        <button
                                            key={type.value}
                                            onClick={() => {
                                                setNewsType(type.value);
                                                setShowTypeSelector(false);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center gap-3"
                                            style={{
                                                background: newsType === type.value 
                                                    ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
                                                    : 'transparent',
                                                color: newsType === type.value 
                                                    ? 'var(--theme-primary, #10b981)'
                                                    : (isDarkMode ? '#e5e7eb' : '#374151'),
                                                borderLeft: newsType === type.value 
                                                    ? '3px solid var(--theme-primary, #10b981)'
                                                    : '3px solid transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (newsType !== type.value) {
                                                    e.currentTarget.style.background = isDarkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (newsType !== type.value) {
                                                    e.currentTarget.style.background = 'transparent';
                                                }
                                            }}
                                        >
                                            <span className="text-base">{type.icon}</span>
                                            <span className="font-medium">{type.label}</span>
                                            {newsType === type.value && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 ml-auto" style={{ color: 'var(--theme-primary, #10b981)' }}>
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* CENTER SECTION: News Content */}
                <div 
                    ref={tickerRef}
                    className="absolute left-48 right-32 top-0 bottom-0 flex items-center overflow-hidden"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {isLoading ? (
                        <div className="flex items-center gap-3 px-6 w-full">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--theme-primary, #10b981)' }}></div>
                            <span className="text-sm font-medium" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                                Chargement des actualités...
                            </span>
                        </div>
                    ) : news.length > 0 && currentNews ? (
                        <div 
                            className="news-content-wrapper flex items-center gap-4 w-full cursor-pointer group"
                            onClick={() => {
                                if (currentNews.url) {
                                    window.open(currentNews.url, '_blank', 'noopener,noreferrer');
                                }
                            }}
                        >
                            {/* Type Badge */}
                            <div className="type-badge flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                                <span className="text-lg">{getTypeIcon(currentNews.type || 'other')}</span>
                            </div>
                            
                            {/* Source Badge */}
                            <div className="source-badge-premium px-3 py-1 rounded-lg flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm">{getSourceIcon(currentNews.source)}</span>
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary, #10b981)' }}>
                                    {currentNews.source || currentNews.source_provider || currentNews.source_original || 'Source'}
                                </span>
                            </div>
                            
                            {/* Divider */}
                            <div className="w-px h-6 flex-shrink-0" style={{ backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)' }}></div>
                            
                            {/* Headline - BUG #6 FIX: Améliorer ellipsis pour texte tronqué */}
                            <span 
                                className="news-headline font-semibold flex-1 transition-colors duration-200" 
                                style={{ 
                                    fontSize: '15px', 
                                    lineHeight: '1.5',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '600px'
                                }}
                                title={currentNews.headline}
                            >
                                {currentNews.headline}
                            </span>
                            
                            {/* Progress & Counter */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Progress Bar */}
                                <div className="h-1 rounded-full overflow-hidden relative" style={{ width: '40px', backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }}>
                                    <div 
                                        className="progress-bar-gradient h-full rounded-full"
                                        style={{
                                            width: `${(timeRemaining / 5) * 100}%`,
                                            transition: 'width 0.1s linear',
                                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                                        }}
                                    ></div>
                                </div>
                                
                                {/* Counter - BUG #7 FIX: Ajouter label explicite */}
                                <div className="px-2 py-0.5 rounded text-xs font-bold tabular-nums" style={{ color: 'var(--theme-primary, #10b981)' }} title={`Article ${currentNewsIndex + 1} sur ${news.length}`}>
                                    <span className="hidden sm:inline">Article </span>
                                    <strong>{currentNewsIndex + 1}</strong>
                                    <span className="mx-0.5">/</span>
                                    <strong>{news.length}</strong>
                                </div>
                            </div>
                            
                            {/* External Link Icon */}
                            {currentNews.url && (
                                <div className="flex items-center justify-center w-6 h-6 rounded flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-12" style={{ color: 'var(--theme-primary, #10b981)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="px-6 text-sm flex items-center gap-2" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span>Aucune actualité disponible</span>
                        </div>
                    )}
                </div>

                {/* RIGHT SECTION: Pause Indicator + Close Button */}
                <div className="absolute right-0 h-full flex items-center gap-2 px-4 z-30">
                    {/* Pause Indicator */}
                    {isPaused && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{
                            backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                            border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`
                        }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3" style={{ color: 'var(--theme-primary, #10b981)' }}>
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                            <span className="text-xs font-semibold" style={{ color: 'var(--theme-primary, #10b981)' }}>Pause</span>
                        </div>
                    )}
                    
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 hover:scale-110"
                        style={{
                            color: '#ef4444',
                            backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                            border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`
                        }}
                        title="Fermer le bandeau d'actualités"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
};

window.NewsBanner = NewsBanner;
