const ThemeSelector = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentTheme, setCurrentTheme] = React.useState('darkmode');
    const modalRef = React.useRef(null);


    React.useEffect(() => {
        // Init state from global system
        if (window.GOBThemes) {
            setCurrentTheme(window.GOBThemes.getCurrentTheme());
        }

        // Listen for global theme changes
        const handleThemeChange = (e) => {
            setCurrentTheme(e.detail.themeId);
        };
        window.addEventListener('themeChanged', handleThemeChange);

        // Click outside listener
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        
        // ESC key to close
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEsc);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
            // Émettre événement pour NewsBanner
            window.dispatchEvent(new CustomEvent('themeSelectorOpen'));
        } else {
            // Émettre événement de fermeture
            window.dispatchEvent(new CustomEvent('themeSelectorClose'));
        }

        return () => {
            window.removeEventListener('themeChanged', handleThemeChange);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const toggleTheme = (themeId) => {
        if (window.GOBThemes) {
            window.GOBThemes.applyTheme(themeId);
            setIsOpen(false);
            
            // Show toast feedback
            if (window.showToast) {
                const themeName = window.GOBThemes.themes[themeId]?.name || themeId;
                window.showToast(`Thème activé : ${themeName}`, 'info');
            }
        }
    };

    // Icons map (using Iconoir classes)
    const getIcon = (themeId) => {
        switch(themeId) {
            case 'light': return 'sun-light';
            case 'darkmode': return 'half-moon';
            case 'ia': return 'magic-wand';
            case 'terminal': return 'terminal';
            case 'marketq': return 'graph-up';
            case 'marketq-dark': return 'graph-up';
            case 'bloomberg-terminal': return 'terminal';
            case 'bloomberg-mobile': return 'smartphone';
            case 'bloomberg-nostalgie': return 'retro-tv';
            case 'seeking-alpha': return 'newspaper';
            case 'lightglass': return 'sparkles';
            case 'desjardins': return 'leaf';
            case 'default': return 'palette';
            default: return 'palette';
        }
    };

    // Créer un aperçu visuel style iPhone pour un thème
    const ThemePreview = ({ themeId, theme }) => {
        const isActive = currentTheme === themeId;
        
        return (
            <button
                onClick={() => toggleTheme(themeId)}
                className={`relative group cursor-pointer transition-all duration-300 ${
                    isActive ? 'scale-105' : 'hover:scale-102'
                }`}
                style={{
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
            >
                {/* iPhone Frame */}
                <div 
                    className="relative rounded-[2.5rem] p-2 shadow-2xl transition-all duration-300"
                    style={{
                        background: theme.colors.background === 'fixed' 
                            ? (themeId === 'lightglass' ? 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' 
                                : themeId === 'ia' ? 'linear-gradient(135deg, #000000 0%, #1a0a2e 100%)'
                                : themeId === 'marketq' || themeId === 'marketq-dark' ? 'linear-gradient(135deg, #0a0e27 0%, #141b3d 100%)'
                                : themeId === 'darkmode' ? 'linear-gradient(135deg, #000000 0%, #111827 100%)'
                                : 'linear-gradient(135deg, #000000 0%, #111827 100%)')
                            : (theme.colors.background || '#000000'),
                        border: `3px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                        boxShadow: isActive 
                            ? `0 0 30px ${theme.colors.primary}40, 0 20px 60px rgba(0,0,0,0.3)`
                            : '0 10px 40px rgba(0,0,0,0.2)',
                        width: '120px',
                        height: '240px',
                    }}
                >
                    {/* Notch */}
                    <div 
                        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 rounded-b-2xl"
                        style={{ 
                            background: theme.colors.background === 'fixed' 
                                ? (theme.colors.surface || '#111827')
                                : (theme.colors.background || '#000000')
                        }}
                    />
                    
                    {/* Screen Content */}
                    <div 
                        className="rounded-[2rem] h-full overflow-hidden relative"
                        style={{
                            background: theme.colors.surface,
                            border: `1px solid ${theme.colors.border}`,
                        }}
                    >
                        {/* Status Bar */}
                        <div 
                            className="h-6 flex items-center justify-between px-2 text-[10px]"
                            style={{ 
                                background: (theme.styles && theme.styles.headerBg) || theme.colors.surface || '#111827',
                                color: theme.colors.textSecondary || '#9ca3af'
                            }}
                        >
                            <span>9:41</span>
                            <div className="flex gap-0.5">
                                <div className="w-3 h-1.5 rounded border" style={{ borderColor: theme.colors.textSecondary || '#9ca3af' }} />
                                <div className="w-5 h-1.5 rounded" style={{ background: theme.colors.primary || '#3b82f6' }} />
                            </div>
                        </div>
                        
                        {/* Header */}
                        <div 
                            className="h-10 flex items-center justify-center font-semibold text-xs px-2"
                            style={{ 
                                background: (theme.styles && theme.styles.headerBg) || theme.colors.surface || '#111827',
                                color: theme.colors.text || '#ffffff'
                            }}
                        >
                            {theme.name}
                        </div>
                        
                        {/* Content Preview */}
                        <div className="p-2 space-y-1.5">
                            {/* Card 1 */}
                            <div 
                                className="rounded p-1.5"
                                style={{
                                    background: (theme.styles && theme.styles.cardBg) || theme.colors.surface || '#111827',
                                    border: (theme.styles && theme.styles.cardBorder) || `1px solid ${theme.colors.border || '#374151'}`,
                                    borderRadius: (theme.styles && theme.styles.borderRadius) || '0.5rem',
                                }}
                            >
                                <div className="flex items-center justify-between mb-0.5">
                                    <div 
                                        className="text-[10px] font-semibold"
                                        style={{ color: theme.colors.text || '#ffffff' }}
                                    >
                                        AAPL
                                    </div>
                                    <div 
                                        className="text-[10px] font-bold"
                                        style={{ color: theme.colors.success || theme.colors.textGreen || '#10b981' }}
                                    >
                                        +2.5%
                                    </div>
                                </div>
                                <div 
                                    className="text-[10px]"
                                    style={{ color: theme.colors.textSecondary || '#9ca3af' }}
                                >
                                    $175.50
                                </div>
                            </div>
                            
                            {/* Card 2 */}
                            <div 
                                className="rounded p-1.5"
                                style={{
                                    background: (theme.styles && theme.styles.cardBg) || theme.colors.surface || '#111827',
                                    border: (theme.styles && theme.styles.cardBorder) || `1px solid ${theme.colors.border || '#374151'}`,
                                    borderRadius: (theme.styles && theme.styles.borderRadius) || '0.5rem',
                                }}
                            >
                                <div className="flex items-center justify-between mb-0.5">
                                    <div 
                                        className="text-[10px] font-semibold"
                                        style={{ color: theme.colors.text || '#ffffff' }}
                                    >
                                        MSFT
                                    </div>
                                    <div 
                                        className="text-[10px] font-bold"
                                        style={{ color: theme.colors.danger || theme.colors.textRed || '#ef4444' }}
                                    >
                                        -1.2%
                                    </div>
                                </div>
                                <div 
                                    className="text-[10px]"
                                    style={{ color: theme.colors.textSecondary || '#9ca3af' }}
                                >
                                    $380.20
                                </div>
                            </div>
                            
                            {/* Accent Bar */}
                            <div 
                                className="h-0.5 rounded-full mt-1.5"
                                style={{ background: theme.colors.primary || '#3b82f6' }}
                            />
                        </div>
                    </div>
                    
                    {/* Active Indicator */}
                    {isActive && (
                        <div 
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-10"
                            style={{ 
                                background: theme.colors.primary || '#3b82f6',
                                border: `2px solid ${theme.colors.background === 'fixed' ? '#000' : (theme.colors.background || '#000')}`
                            }}
                        >
                            <i className="iconoir-check text-white" style={{ fontSize: '10px' }} />
                        </div>
                    )}
                </div>
                
                {/* Theme Name */}
                <div className="mt-2 text-center">
                    <div 
                        className="text-xs sm:text-sm font-semibold truncate px-1"
                        style={{ color: isActive ? 'var(--theme-primary, #3b82f6)' : 'var(--theme-text, #ffffff)' }}
                    >
                        {theme.name}
                    </div>
                </div>
            </button>
        );
    };

    // Organiser les thèmes par catégories
    const themeCategories = {
        'Mode': ['light', 'darkmode', 'ia', 'terminal'],
        'Professionnel': ['marketq', 'marketq-dark', 'bloomberg-terminal', 'seeking-alpha'],
        'Spécial': ['lightglass', 'bloomberg-mobile', 'bloomberg-nostalgie', 'desjardins', 'default']
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="px-4 py-2.5 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border-2 shadow-lg"
                style={{
                    background: 'linear-gradient(135deg, var(--theme-surface-light, #1f2937) 0%, var(--theme-surface, #111827) 100%)',
                    borderColor: 'var(--theme-primary, #3b82f6)',
                    color: 'var(--theme-text, #ffffff)',
                    boxShadow: '0 4px 12px rgba(var(--theme-primary-rgb, 59, 130, 246), 0.3)',
                }}
                title="Choisir un thème - Cliquez pour ouvrir"
            >
                <i className={`iconoir-${getIcon(currentTheme)} text-xl`} style={{ color: 'var(--theme-primary, #3b82f6)' }}></i>
                <span className="text-sm font-semibold">
                    {window.GOBThemes?.themes[currentTheme]?.name || 'Thème'}
                </span>
                <i className="iconoir-nav-arrow-down text-xs" style={{ color: 'var(--theme-primary, #3b82f6)' }}></i>
            </button>

            {/* Fenêtre Popup - Portail vers body pour éviter les problèmes de z-index/transform */}
            {isOpen && ReactDOM.createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
                    {/* Overlay semi-transparent pour fermer en cliquant à l'extérieur */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        style={{ pointerEvents: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                    {/* Fenêtre centrée */}
                    <div 
                        ref={modalRef}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-slide-down"
                        style={{
                            background: 'var(--theme-surface, #111827)',
                            border: '1px solid var(--theme-border, #374151)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                            pointerEvents: 'auto',
                            zIndex: 10001
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header avec X - Style fenêtre */}
                        <div 
                            className="flex items-center justify-between px-5 py-4 border-b cursor-move flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, var(--theme-surface-light, #1f2937) 0%, var(--theme-surface, #111827) 100%)',
                                borderColor: 'var(--theme-border, #374151)',
                            }}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <div 
                                    className="p-2 rounded-lg"
                                    style={{
                                        background: 'rgba(var(--theme-primary-rgb, 59, 130, 246), 0.1)',
                                    }}
                                >
                                    <i className="iconoir-palette text-lg" style={{ color: 'var(--theme-primary, #3b82f6)' }} />
                                </div>
                                <div className="flex-1">
                                    <h2 
                                        className="text-lg font-bold leading-tight"
                                        style={{ color: 'var(--theme-text, #ffffff)' }}
                                    >
                                        Choisir un thème
                                    </h2>
                                    <p 
                                        className="text-xs mt-0.5 opacity-75"
                                        style={{ color: 'var(--theme-text-secondary, #9ca3af)' }}
                                    >
                                        Sélectionnez un thème pour personnaliser votre dashboard
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="ml-4 p-2 rounded-lg hover:bg-red-500/20 active:bg-red-500/30 transition-all group flex-shrink-0"
                                style={{ 
                                    color: 'var(--theme-text, #ffffff)',
                                }}
                                title="Fermer (ESC)"
                            >
                                <i className="iconoir-cancel text-xl group-hover:text-red-400 group-hover:scale-110 transition-all" />
                            </button>
                        </div>

                        {/* Content avec scroll */}
                        <div 
                            className="overflow-y-auto scrollbar-thin"
                            style={{ 
                                maxHeight: 'calc(85vh - 80px)',
                                background: 'var(--theme-surface, #111827)',
                            }}
                        >
                            <div className="p-4 sm:p-6">
                                {Object.entries(themeCategories).map(([category, themeIds]) => {
                                    const themes = themeIds
                                        .map(id => ({ id, theme: window.GOBThemes?.themes[id] }))
                                        .filter(({ theme }) => theme); // Filtrer les thèmes inexistants

                                    if (themes.length === 0) return null;

                                    return (
                                        <div key={category} className="mb-8">
                                            <h3 
                                                className="text-base sm:text-lg font-semibold mb-4 uppercase tracking-wider"
                                                style={{ color: 'var(--theme-text-secondary, #9ca3af)' }}
                                            >
                                                {category}
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                                {themes.map(({ id, theme }) => (
                                                    <ThemePreview key={id} themeId={id} theme={theme} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

// Expose to window
window.ThemeSelector = ThemeSelector;

// Debug: Vérifier que le composant est bien chargé
void('✅ ThemeSelector chargé:', typeof window.ThemeSelector !== 'undefined');
