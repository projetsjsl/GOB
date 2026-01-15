/**
 * NewsOverlay - Overlay de nouveautes en bas a gauche
 * S'affiche lorsque active depuis AdminJSLaiTab
 */

const { useState, useEffect } = React;

const NewsOverlay = ({ isDarkMode = true }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [config, setConfig] = useState({
        enabled: false,
        title: 'Nouveautes',
        items: []
    });

    // Charger la configuration depuis Supabase/localStorage
    useEffect(() => {
        const loadConfig = async () => {
            try {
                // Essayer Supabase d'abord
                const response = await fetch('/api/admin/emma-config?section=ui&key=news_overlay');
                const data = await response.json();
                
                if (data && data.config && data.config.value) {
                    setConfig(data.config.value);
                    setIsVisible(data.config.value.enabled);
                } else {
                    // Fallback localStorage
                    const saved = localStorage.getItem('news-overlay-config');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        setConfig(parsed);
                        setIsVisible(parsed.enabled);
                    }
                }
            } catch (e) {
                console.warn('Erreur chargement config overlay:', e);
                // Fallback localStorage
                const saved = localStorage.getItem('news-overlay-config');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setConfig(parsed);
                    setIsVisible(parsed.enabled);
                }
            }
        };

        loadConfig();

        // Ecouter les changements de configuration
        const handleConfigChange = () => {
            loadConfig();
        };

        window.addEventListener('news-overlay-config-changed', handleConfigChange);
        return () => {
            window.removeEventListener('news-overlay-config-changed', handleConfigChange);
        };
    }, []);

    // Ne rien afficher si desactive
    if (!isVisible || !config.enabled) {
        return null;
    }

    return (
        <>
            <style>{`
                @keyframes slideInUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutDown {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                }
                .news-overlay-container {
                    animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .news-overlay-minimized {
                    animation: slideOutDown 0.3s ease-in;
                }
            `}</style>
            <div
                className={`fixed bottom-4 left-4 z-[9998] transition-all duration-300 ${
                    isMinimized ? 'news-overlay-minimized' : 'news-overlay-container'
                }`}
                style={{
                    maxWidth: '380px',
                    width: 'calc(100vw - 2rem)',
                    maxHeight: isMinimized ? '60px' : '500px',
                    pointerEvents: 'auto'
                }}
            >
                <div
                    className={`rounded-xl shadow-2xl border overflow-hidden backdrop-blur-xl ${
                        isDarkMode 
                            ? 'bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-emerald-500/30' 
                            : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-emerald-500/50'
                    }`}
                    style={{
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                >
                    {/* Header */}
                    <div
                        className={`flex items-center justify-between px-4 py-3 border-b ${
                            isDarkMode ? 'border-emerald-500/20' : 'border-emerald-500/30'
                        }`}
                        style={{
                            background: isDarkMode 
                                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))'
                                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))'
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="flex items-center justify-center w-8 h-8 rounded-lg"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))',
                                    border: '1px solid rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                <span className="text-lg"></span>
                            </div>
                            <div>
                                <h3
                                    className={`font-bold text-sm ${
                                        isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                                    }`}
                                >
                                    {config.title || 'Nouveautes'}
                                </h3>
                                {!isMinimized && config.items && config.items.length > 0 && (
                                    <p className={`text-xs ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        {config.items.length} {config.items.length === 1 ? 'nouvelle' : 'nouvelles'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Minimize/Maximize */}
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${
                                    isDarkMode 
                                        ? 'hover:bg-emerald-500/20 text-emerald-400' 
                                        : 'hover:bg-emerald-500/10 text-emerald-600'
                                }`}
                                title={isMinimized ? 'Agrandir' : 'Reduire'}
                            >
                                <svg 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    className="w-4 h-4"
                                >
                                    {isMinimized ? (
                                        <>
                                            <polyline points="4 14 10 14 10 20"></polyline>
                                            <polyline points="20 10 14 10 14 4"></polyline>
                                            <line x1="14" y1="10" x2="21" y2="3"></line>
                                            <line x1="3" y1="21" x2="10" y2="14"></line>
                                        </>
                                    ) : (
                                        <polyline points="18 15 12 9 6 15"></polyline>
                                    )}
                                </svg>
                            </button>
                            {/* Close */}
                            <button
                                onClick={() => {
                                    setIsVisible(false);
                                    // Desactiver temporairement (peut etre reactive depuis Admin)
                                    const newConfig = { ...config, enabled: false };
                                    setConfig(newConfig);
                                    localStorage.setItem('news-overlay-config', JSON.stringify(newConfig));
                                }}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${
                                    isDarkMode 
                                        ? 'hover:bg-red-500/20 text-red-400' 
                                        : 'hover:bg-red-500/10 text-red-600'
                                }`}
                                title="Fermer"
                            >
                                <svg 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    className="w-4 h-4"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {!isMinimized && (
                        <div
                            className="overflow-y-auto"
                            style={{
                                maxHeight: '400px',
                                scrollbarWidth: 'thin',
                                scrollbarColor: isDarkMode ? 'rgba(16, 185, 129, 0.3) transparent' : 'rgba(0, 0, 0, 0.3) transparent'
                            }}
                        >
                            {config.items && config.items.length > 0 ? (
                                <div className="p-3 space-y-2">
                                    {config.items.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                                                isDarkMode 
                                                    ? 'bg-slate-800/50 border-emerald-500/20 hover:border-emerald-500/40' 
                                                    : 'bg-white/50 border-emerald-500/30 hover:border-emerald-500/50'
                                            }`}
                                        >
                                            {item.date && (
                                                <div className={`text-xs mb-1.5 font-semibold ${
                                                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                                                }`}>
                                                    {item.date}
                                                </div>
                                            )}
                                            <h4
                                                className={`font-semibold text-sm mb-1.5 ${
                                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}
                                            >
                                                {item.title}
                                            </h4>
                                            {item.description && (
                                                <p className={`text-xs leading-relaxed ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                }`}>
                                                    {item.description}
                                                </p>
                                            )}
                                            {item.url && (
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-1 mt-2 text-xs font-medium transition-colors ${
                                                        isDarkMode 
                                                            ? 'text-emerald-400 hover:text-emerald-300' 
                                                            : 'text-emerald-600 hover:text-emerald-700'
                                                    }`}
                                                >
                                                    En savoir plus
                                                    <svg 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        strokeWidth="2" 
                                                        className="w-3 h-3"
                                                    >
                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                        <polyline points="15 3 21 3 21 9"></polyline>
                                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`p-6 text-center ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    <p className="text-sm">Aucune nouveaute pour le moment</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

window.NewsOverlay = NewsOverlay;
