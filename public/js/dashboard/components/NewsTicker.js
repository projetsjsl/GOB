/**
 * Composant NewsTicker - Bandeau d'actualités financières défilant
 */

const { useState, useEffect, useRef } = React;

const NewsTicker = ({ isDarkMode = true }) => {
    const [news, setNews] = useState([]);
    const [isVisible, setIsVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const tickerRef = useRef(null);
    const animationRef = useRef(null);

    // Charger les actualités au montage
    useEffect(() => {
        loadNews();
        
        // Recharger les actualités toutes les 5 minutes
        const interval = setInterval(loadNews, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

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
            const response = await fetch('/api/finviz-news');
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
                        url: 'https://www.marketwatch.com'
                    },
                    {
                        time: 'Aujourd\'hui, 10:45 AM',
                        headline: 'Federal Reserve signals potential rate cuts as inflation cools',
                        source: 'Reuters',
                        url: 'https://www.reuters.com'
                    },
                    {
                        time: 'Aujourd\'hui, 10:20 AM',
                        headline: 'Oil prices rise on supply concerns amid Middle East tensions',
                        source: 'Bloomberg',
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

    if (!isVisible) return null;

    return (
        <div
            className="relative w-full border-b overflow-hidden"
            style={{
                backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)',
                height: '40px',
                zIndex: 100
            }}
        >
            {/* Left icon */}
            <div
                className="absolute left-4 top-0 bottom-0 flex items-center z-20"
                style={{ pointerEvents: 'none' }}
            >
                <div
                    className="flex items-center justify-center"
                    style={{
                        width: '20px',
                        height: '20px',
                        color: '#10b981'
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                </div>
            </div>

            {/* Scrolling news content */}
            <div
                ref={tickerRef}
                className="absolute left-12 right-20 top-0 bottom-0 overflow-hidden"
                style={{ pointerEvents: 'none' }}
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
                            style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
                        >
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Chargement des actualités...</span>
                        </div>
                    ) : (
                        news.map((item, index) => (
                            <React.Fragment key={index}>
                                <div 
                                    className="flex items-center gap-3 px-4 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                        if (item.url) {
                                            window.open(item.url, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                    title={item.url ? 'Cliquer pour ouvrir l\'article' : ''}
                                >
                                    <span
                                        className="text-xs font-medium"
                                        style={{ color: '#10b981', minWidth: '100px' }}
                                    >
                                        {item.time}
                                    </span>
                                    <span
                                        className="text-sm"
                                        style={{ 
                                            color: isDarkMode ? '#ffffff' : '#1f2937',
                                            textDecoration: item.url ? 'none' : 'none',
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
                                        className="flex items-center gap-3 px-4 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => {
                                            if (item.url) {
                                                window.open(item.url, '_blank', 'noopener,noreferrer');
                                            }
                                        }}
                                        title={item.url ? 'Cliquer pour ouvrir l\'article' : ''}
                                    >
                                        <span
                                            className="text-xs font-medium"
                                            style={{ color: '#10b981', minWidth: '100px' }}
                                        >
                                            {item.time}
                                        </span>
                                        <span
                                            className="text-sm"
                                            style={{ 
                                                color: isDarkMode ? '#ffffff' : '#1f2937',
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
                className="absolute right-4 top-0 bottom-0 flex items-center justify-center z-20 transition-opacity hover:opacity-70"
                style={{
                    width: '24px',
                    height: '24px',
                    color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}
                title="Fermer le bandeau d'actualités"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
};

window.NewsTicker = NewsTicker;

