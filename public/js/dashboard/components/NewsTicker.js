/**
 * Composant NewsTicker - Bandeau d'actualités financières défilant
 */

const { useState, useEffect, useRef } = React;

const NewsTicker = ({ isDarkMode = true }) => {
    const [news, setNews] = useState([]);
    const [isVisible, setIsVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [newsType, setNewsType] = useState('all');
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const tickerRef = useRef(null);
    const animationRef = useRef(null);

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

    // Animation du défilement
    useEffect(() => {
        if (!isVisible || news.length === 0 || !tickerRef.current) return;

        const ticker = tickerRef.current;
        const content = ticker.querySelector('.news-ticker-content');
        if (!content) return;

        let position = 0;
        const speed = 0.5; // pixels per frame
        const gap = 100; // gap between news items

        const animate = () => {
            if (content.scrollWidth > ticker.offsetWidth) {
                position -= speed;
                
                // Reset position when all content has scrolled
                if (Math.abs(position) >= content.scrollWidth + gap) {
                    position = ticker.offsetWidth;
                }
                
                content.style.transform = `translateX(${position}px)`;
            }
            
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [news, isVisible]);

    const loadNews = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/finviz-news?type=${newsType}&limit=40`);
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
            // Fallback news
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
            setIsLoading(false);
        }
    };

    // Restaurer depuis localStorage
    useEffect(() => {
        const saved = localStorage.getItem('news-ticker-visible');
        if (saved !== null) {
            setIsVisible(saved === 'true');
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('news-ticker-visible', 'false');
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

    if (!isVisible) return null;

    // Masquer le NewsTicker si un modal est ouvert
    if (isModalOpen) return null;

    return (
        <div
            className="relative w-full border-b overflow-hidden"
            style={{
                backgroundColor: '#0a0e27', // Couleur fixe sombre pour contraste
                borderTop: '3px solid #10b981', // Bordure supérieure verte visible et fixe
                borderBottom: '2px solid #10b981', // Bordure inférieure verte visible et fixe
                height: '52px', // Hauteur augmentée pour plus de visibilité
                zIndex: 5,
                position: 'relative',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)' // Ombre verte subtile
            }}
        >
            {/* Left icon + Type selector */}
            <div
                className="absolute left-4 top-0 bottom-0 flex items-center gap-2 z-20"
            >
                <div
                    className="flex items-center justify-center"
                    style={{
                        width: '20px',
                        height: '20px',
                        color: '#10b981',
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
                    className="px-3 py-1.5 rounded-md text-sm font-semibold transition-colors hover:opacity-90"
                    style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.25)',
                        color: '#10b981',
                        border: '2px solid #10b981',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                    }}
                    title="Filtrer par type de nouvelle"
                >
                    {newsTypes.find(t => t.value === newsType)?.icon || '📰'} {newsTypes.find(t => t.value === newsType)?.label || 'Toutes'}
                </button>
                
                {/* Type selector dropdown */}
                {showTypeSelector && (
                    <div
                        className="absolute left-0 top-full mt-1 rounded-lg shadow-xl border overflow-hidden"
                        style={{
                            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                            borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)',
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
                                        ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
                                        : 'transparent',
                                    color: isDarkMode ? '#ffffff' : '#1f2937'
                                }}
                            >
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Scrolling news content */}
            <div
                ref={tickerRef}
                className="absolute left-48 right-20 top-0 bottom-0 overflow-hidden"
            >
                <div
                    className="news-ticker-content flex items-center h-full whitespace-nowrap"
                    style={{
                        willChange: 'transform'
                    }}
                >
                    {isLoading ? (
                        <div
                            className="flex items-center gap-2 px-4"
                            style={{ color: '#10b981' }}
                        >
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium" style={{ color: '#10b981' }}>Chargement des actualités...</span>
                        </div>
                    ) : (
                        news.map((item, index) => (
                            <React.Fragment key={index}>
                                <div 
                                    className="flex items-center gap-2 px-4 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                        if (item.url) {
                                            window.open(item.url, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                    title={item.url ? `${item.source} - ${item.type} - Cliquer pour ouvrir l'article` : `${item.source} - ${item.type}`}
                                >
                                    {/* Type icon */}
                                    <span className="text-base flex-shrink-0" title={`Type: ${item.type || 'other'}`}>
                                        {getTypeIcon(item.type || 'other')}
                                    </span>
                                    
                                    {/* Source icon */}
                                    <span className="text-sm flex-shrink-0" title={`Source: ${item.source}`}>
                                        {getSourceIcon(item.source)}
                                    </span>
                                    
                                    <span
                                        className="text-sm font-semibold"
                                        style={{ color: '#10b981', minWidth: '110px', flexShrink: 0 }}
                                    >
                                        {item.time}
                                    </span>
                                    <span
                                        className="text-base font-medium"
                                        style={{ 
                                            color: '#e0e7ff',
                                            cursor: item.url ? 'pointer' : 'default'
                                        }}
                                    >
                                        {item.headline}
                                    </span>
                                    {item.url && (
                                        <svg 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            className="w-3 h-3 flex-shrink-0"
                                            style={{ color: isDarkMode ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)' }}
                                        >
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                            <polyline points="15 3 21 3 21 9"></polyline>
                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                        </svg>
                                    )}
                                </div>
                                <div
                                    className="w-8 h-px mx-4"
                                    style={{ backgroundColor: isDarkMode ? 'rgba(156, 163, 175, 0.3)' : 'rgba(107, 114, 128, 0.3)' }}
                                ></div>
                            </React.Fragment>
                        ))
                    )}
                    {/* Duplicate for seamless loop */}
                    {!isLoading && news.length > 0 && (
                        <>
                            {news.map((item, index) => (
                                <React.Fragment key={`dup-${index}`}>
                                    <div 
                                        className="flex items-center gap-2 px-4 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => {
                                            if (item.url) {
                                                window.open(item.url, '_blank', 'noopener,noreferrer');
                                            }
                                        }}
                                        title={item.url ? `${item.source} - ${item.type} - Cliquer pour ouvrir l'article` : `${item.source} - ${item.type}`}
                                    >
                                        {/* Type icon */}
                                        <span className="text-base flex-shrink-0" title={`Type: ${item.type || 'other'}`}>
                                            {getTypeIcon(item.type || 'other')}
                                        </span>
                                        
                                        {/* Source icon */}
                                        <span className="text-sm flex-shrink-0" title={`Source: ${item.source}`}>
                                            {getSourceIcon(item.source)}
                                        </span>
                                        
                                        <span
                                            className="text-sm font-semibold"
                                            style={{ color: '#10b981', minWidth: '110px', flexShrink: 0 }}
                                        >
                                            {item.time}
                                        </span>
                                        <span
                                            className="text-base font-medium"
                                            style={{ 
                                                color: '#e0e7ff',
                                                cursor: item.url ? 'pointer' : 'default'
                                            }}
                                        >
                                            {item.headline}
                                        </span>
                                        {item.url && (
                                            <svg 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                className="w-3 h-3 flex-shrink-0"
                                                style={{ color: isDarkMode ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)' }}
                                            >
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                <polyline points="15 3 21 3 21 9"></polyline>
                                                <line x1="10" y1="14" x2="21" y2="3"></line>
                                            </svg>
                                        )}
                                    </div>
                                    <div
                                        className="w-8 h-px mx-4"
                                        style={{ backgroundColor: isDarkMode ? 'rgba(156, 163, 175, 0.3)' : 'rgba(107, 114, 128, 0.3)' }}
                                    ></div>
                                </React.Fragment>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={handleClose}
                className="absolute right-4 top-0 bottom-0 flex items-center justify-center z-20 transition-opacity hover:opacity-80"
                style={{
                    width: '28px',
                    height: '28px',
                    color: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
                title="Fermer le bandeau d'actualités"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
};

window.NewsTicker = NewsTicker;

