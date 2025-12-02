/**
 * Composant ThemeSelector - Sélecteur de thème professionnel avec aperçus visuels
 */

const { useState, useEffect, useRef } = React;

const ThemeSelector = ({ isDarkMode = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('default');
    const modalRef = useRef(null);

    // Charger le thème au montage et écouter les changements
    useEffect(() => {
        const loadTheme = () => {
            if (window.GOBThemes && window.GOBThemes.getCurrentTheme) {
                const themeId = window.GOBThemes.getCurrentTheme();
                setCurrentTheme(themeId);
            } else {
                // Attendre que GOBThemes soit disponible
                setTimeout(loadTheme, 100);
            }
        };
        
        loadTheme();
        
        // Écouter les changements de thème
        const handleThemeChange = (event) => {
            if (event.detail && event.detail.themeId) {
                setCurrentTheme(event.detail.themeId);
            }
        };
        
        window.addEventListener('themeChanged', handleThemeChange);
        return () => window.removeEventListener('themeChanged', handleThemeChange);
    }, []);

    // Fermer la modal si on clique en dehors
    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Empêcher le scroll du body quand la modal est ouverte
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Fermer avec Escape
    useEffect(() => {
        function handleEscape(event) {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        }
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Obtenir les thèmes depuis le système global
    const getThemes = () => {
        if (!window.GOBThemes || !window.GOBThemes.themes) {
            // Fallback si GOBThemes n'est pas encore chargé
            return [
                { id: 'darkmode', name: 'Dark Mode', isDefault: true },
                { id: 'light', name: 'Light', isDefault: true },
                { id: 'terminal', name: 'Terminal', isDefault: true },
                { id: 'ia', name: 'IA', isDefault: true }
            ];
        }
        return Object.values(window.GOBThemes.themes);
    };

    const themes = getThemes();
    const defaultThemesList = themes.filter(t => t.isDefault);
    const customThemesList = themes.filter(t => !t.isDefault);

    const handleThemeChange = (themeId) => {
        if (window.GOBThemes) {
            window.GOBThemes.applyTheme(themeId);
            setCurrentTheme(themeId);
            setIsOpen(false);
            
            // Déclencher un événement personnalisé pour notifier les autres composants
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeId } }));
        }
    };

    const getThemeIcon = (themeId) => {
        const icons = {
            'terminal': '💻',
            'ia': '🤖',
            'darkmode': '🌙',
            'light': '☀️',
            'default': '🎨',
            'marketq': '📊',
            'marketq-dark': '⚫',
            'bloomberg-terminal': '💻',
            'seeking-alpha': '📈',
            'bloomberg-mobile': '📱',
            'bloomberg-nostalgie': '🕰️',
            'desjardins': '🏦'
        };
        return icons[themeId] || '✨';
    };
    
    // Toggle pour DarkMode/Light
    const handleToggleDarkLight = () => {
        const currentId = currentTheme;
        if (currentId === 'darkmode') {
            handleThemeChange('light');
        } else if (currentId === 'light') {
            handleThemeChange('darkmode');
        } else {
            // Si autre thème, basculer vers darkmode
            handleThemeChange('darkmode');
        }
    };
    
    const isDarkLightTheme = currentTheme === 'darkmode' || currentTheme === 'light';

    const currentThemeData = themes.find(t => t.id === currentTheme) || themes[0];

    // Fonction pour générer un aperçu de couleurs du thème
    const renderThemePreview = (theme) => {
        const colors = theme.colors || {};
        const isSelected = currentTheme === theme.id;
        // Détecter les thèmes light
        const isLightTheme = ['seeking-alpha', 'bloomberg-nostalgie', 'desjardins', 'light'].includes(theme.id) || 
                            (colors.background && colors.background.toLowerCase() === '#ffffff');
        const previewBg = colors.background || (isLightTheme ? '#ffffff' : '#000000');
        const previewText = colors.text || (isLightTheme ? '#202124' : '#ffffff');

        return (
            <div
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`relative cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl group ${
                    isSelected ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''
                }`}
                style={{
                    backgroundColor: previewBg,
                    color: previewText,
                    border: `2px solid ${isSelected ? colors.primary || colors.accent || '#3b82f6' : 'transparent'}`,
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    boxShadow: isSelected 
                        ? `0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 2px ${colors.primary || colors.accent || '#3b82f6'}40`
                        : '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}
            >
                {/* Badge "Sélectionné" */}
                {isSelected && (
                    <div 
                        className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-pulse"
                        style={{ 
                            backgroundColor: colors.primary || colors.accent || '#3b82f6',
                            boxShadow: `0 0 12px ${colors.primary || colors.accent || '#3b82f6'}80`
                        }}
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}

                {/* Header de l'aperçu avec gradient */}
                <div
                    className="p-4 relative overflow-hidden"
                    style={{
                        background: colors.styles?.headerBg || `linear-gradient(135deg, ${colors.surface || colors.background} 0%, ${colors.surfaceLight || colors.surface || colors.background} 100%)`,
                        borderBottom: `1px solid ${colors.border || 'rgba(255,255,255,0.1)'}`
                    }}
                >
                    {/* Overlay subtle */}
                    <div className="absolute inset-0 opacity-50" style={{
                        background: `linear-gradient(135deg, ${colors.primary || 'transparent'}20 0%, transparent 100%)`
                    }}></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-md"
                                style={{ 
                                    backgroundColor: colors.primary || colors.accent || '#3b82f6',
                                    color: '#ffffff'
                                }}
                            >
                                {getThemeIcon(theme.id)}
                            </div>
                            <div>
                                <div className="font-bold text-base" style={{ color: colors.text || previewText }}>
                                    {theme.name}
                                </div>
                                {theme.isDefault && (
                                    <div className="text-xs opacity-70" style={{ color: colors.textSecondary || colors.text }}>
                                        Par défaut
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aperçu des couleurs */}
                <div className="p-5 space-y-4">
                    {/* Palette de couleurs principales avec labels */}
                    <div>
                        <div className="text-xs font-semibold mb-2 opacity-70" style={{ color: colors.textSecondary || colors.text }}>
                            Palette de couleurs
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="group/color">
                                <div
                                    className="h-10 rounded-lg shadow-md transition-transform duration-200 group-hover/color:scale-110"
                                    style={{ backgroundColor: colors.primary || '#3b82f6' }}
                                    title="Primary"
                                ></div>
                                <div className="text-[10px] text-center mt-1 opacity-60" style={{ color: colors.textSecondary || colors.text }}>
                                    Primary
                                </div>
                            </div>
                            <div className="group/color">
                                <div
                                    className="h-10 rounded-lg shadow-md transition-transform duration-200 group-hover/color:scale-110"
                                    style={{ backgroundColor: colors.accent || colors.primary || '#8b5cf6' }}
                                    title="Accent"
                                ></div>
                                <div className="text-[10px] text-center mt-1 opacity-60" style={{ color: colors.textSecondary || colors.text }}>
                                    Accent
                                </div>
                            </div>
                            <div className="group/color">
                                <div
                                    className="h-10 rounded-lg shadow-md transition-transform duration-200 group-hover/color:scale-110"
                                    style={{ backgroundColor: colors.success || '#10b981' }}
                                    title="Success"
                                ></div>
                                <div className="text-[10px] text-center mt-1 opacity-60" style={{ color: colors.textSecondary || colors.text }}>
                                    Success
                                </div>
                            </div>
                            <div className="group/color">
                                <div
                                    className="h-10 rounded-lg shadow-md transition-transform duration-200 group-hover/color:scale-110"
                                    style={{ backgroundColor: colors.danger || '#ef4444' }}
                                    title="Danger"
                                ></div>
                                <div className="text-[10px] text-center mt-1 opacity-60" style={{ color: colors.textSecondary || colors.text }}>
                                    Danger
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Exemple de card avec plus de détails */}
                    <div>
                        <div className="text-xs font-semibold mb-2 opacity-70" style={{ color: colors.textSecondary || colors.text }}>
                            Aperçu
                        </div>
                        <div
                            className="p-3 rounded-lg border backdrop-blur-sm transition-all duration-200 group-hover:shadow-lg"
                            style={{
                                backgroundColor: colors.surface || colors.background,
                                borderColor: colors.border || 'rgba(255,255,255,0.1)',
                                color: colors.text || previewText,
                                boxShadow: `0 2px 8px ${colors.primary || 'rgba(0,0,0,0.1)'}20`
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-bold" style={{ color: colors.text || previewText }}>
                                    AAPL
                                </div>
                                <div className="text-xs font-semibold" style={{ color: colors.success || '#10b981' }}>
                                    +2.5%
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <span style={{ color: colors.textSecondary || colors.text }}>$150.25</span>
                                <span style={{ color: colors.textSecondary || colors.text }}>•</span>
                                <span style={{ color: colors.danger || '#ef4444' }}>-1.2%</span>
                            </div>
                        </div>
                    </div>

                    {/* Badge de type avec icône */}
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: colors.border || 'rgba(255,255,255,0.1)' }}>
                        <span
                            className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5"
                            style={{
                                backgroundColor: isLightTheme 
                                    ? `${colors.primary || '#3b82f6'}15` 
                                    : `${colors.primary || '#3b82f6'}25`,
                                color: colors.primary || colors.accent || previewText,
                                border: `1px solid ${colors.primary || colors.accent || '#3b82f6'}40`
                            }}
                        >
                            {isLightTheme ? '☀️' : '🌙'}
                            {isLightTheme ? 'Light' : 'Dark'}
                        </span>
                        {!theme.isDefault && (
                            <span className="text-xs opacity-50" style={{ color: colors.textSecondary || colors.text }}>
                                Personnalisé
                            </span>
                        )}
                    </div>
                </div>

                {/* Overlay au hover */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary || 'transparent'}08 0%, transparent 100%)`
                    }}
                ></div>
            </div>
        );
    };

    return (
        <>
            {/* Toggle DarkMode/Light si thème par défaut */}
            {isDarkLightTheme && (
                <button
                    onClick={handleToggleDarkLight}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg ${
                        isDarkMode
                            ? 'bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white border border-gray-600/50'
                            : 'bg-gradient-to-r from-gray-100 to-white hover:from-gray-200 hover:to-gray-100 text-gray-900 border border-gray-300/50'
                    }`}
                    title={currentTheme === 'darkmode' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                >
                    <span className="text-xl transition-transform duration-300 hover:rotate-12">
                        {currentTheme === 'darkmode' ? '🌙' : '☀️'}
                    </span>
                    <span className="hidden sm:inline font-medium">{currentTheme === 'darkmode' ? 'Dark' : 'Light'}</span>
                </button>
            )}
            
            {/* Bouton pour ouvrir la modal */}
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg group ${
                    isDarkMode
                        ? 'bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white border border-gray-600/50'
                        : 'bg-gradient-to-r from-gray-100 to-white hover:from-gray-200 hover:to-gray-100 text-gray-900 border border-gray-300/50'
                }`}
                title="Changer le thème"
            >
                <span className="text-xl transition-transform duration-300 group-hover:rotate-12">
                    {currentThemeData ? getThemeIcon(currentThemeData.id) : '🎨'}
                </span>
                <span className="hidden sm:inline font-medium">{currentThemeData?.name || 'Thème'}</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Modal de sélection de thème */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
                    onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
                >
                    <div
                        ref={modalRef}
                        className={`relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl transform transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700/50' 
                                : 'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200/50'
                        }`}
                        style={{
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        {/* Header de la modal avec gradient */}
                        <div className={`sticky top-0 z-20 p-6 border-b backdrop-blur-xl ${
                            isDarkMode 
                                ? 'bg-gradient-to-r from-gray-900/95 to-gray-800/95 border-gray-700/50' 
                                : 'bg-gradient-to-r from-white/95 to-gray-50/95 border-gray-200/50'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                                        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                    }`}>
                                        🎨
                                    </div>
                                    <div>
                                        <h2 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Sélectionner un thème
                                        </h2>
                                        <p className={`text-sm mt-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Personnalisez l'apparence de votre dashboard
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
                                        isDarkMode
                                            ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                                    }`}
                                    title="Fermer (Esc)"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Grille des thèmes avec scroll personnalisé */}
                        <div className="p-8 overflow-y-auto max-h-[calc(92vh-180px)] custom-scrollbar">
                            {/* Thèmes par défaut */}
                            {defaultThemesList.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`w-1 h-6 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`}></div>
                                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Thèmes par défaut
                                        </h3>
                                        <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                        <span className={`text-xs px-3 py-1 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                            {defaultThemesList.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                        {defaultThemesList.map(theme => renderThemePreview(theme))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Thèmes personnalisés */}
                            {customThemesList.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`w-1 h-6 rounded-full ${isDarkMode ? 'bg-purple-500' : 'bg-purple-600'}`}></div>
                                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Thèmes personnalisés
                                        </h3>
                                        <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                        <span className={`text-xs px-3 py-1 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                            {customThemesList.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {customThemesList.map(theme => renderThemePreview(theme))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Message si aucun thème */}
                            {themes.length === 0 && (
                                <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <div className="text-4xl mb-4">🎨</div>
                                    <p className="text-lg font-medium">Aucun thème disponible</p>
                                </div>
                            )}
                        </div>

                        {/* Footer avec info et gradient */}
                        <div className={`p-5 border-t backdrop-blur-xl ${
                            isDarkMode 
                                ? 'bg-gradient-to-r from-gray-900/95 to-gray-800/95 border-gray-700/50' 
                                : 'bg-gradient-to-r from-white/95 to-gray-50/95 border-gray-200/50'
                        }`}>
                            <div className="flex items-center justify-center gap-2">
                                <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Le thème sélectionné est sauvegardé automatiquement
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Exposer globalement
window.ThemeSelector = ThemeSelector;
