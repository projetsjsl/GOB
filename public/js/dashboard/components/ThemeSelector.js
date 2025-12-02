/**
 * Composant ThemeSelector - Sélecteur de thème professionnel avec aperçus visuels
 */

const { useState, useEffect, useRef } = React;

const ThemeSelector = ({ isDarkMode = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('default');
    const modalRef = useRef(null);

    // Charger le thème au montage
    useEffect(() => {
        if (window.GOBThemes) {
            const themeId = window.GOBThemes.getCurrentTheme();
            setCurrentTheme(themeId);
        }
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
        const isLightTheme = ['seeking-alpha', 'bloomberg-nostalgie'].includes(theme.id);
        const previewBg = isLightTheme ? '#ffffff' : (colors.background || '#000000');
        const previewText = isLightTheme ? '#202124' : (colors.text || '#ffffff');

        return (
            <div
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    isSelected ? 'ring-4 ring-blue-500 ring-offset-2' : ''
                }`}
                style={{
                    backgroundColor: previewBg,
                    color: previewText,
                    border: `2px solid ${isSelected ? '#3b82f6' : colors.border || '#374151'}`,
                    borderRadius: '0.75rem',
                    overflow: 'hidden'
                }}
            >
                {/* Header de l'aperçu */}
                <div
                    className="p-3 border-b"
                    style={{
                        backgroundColor: colors.surface || colors.background,
                        borderColor: colors.border || '#374151'
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{getThemeIcon(theme.id)}</span>
                            <span className="font-bold text-sm" style={{ color: colors.text || previewText }}>
                                {theme.name}
                            </span>
                        </div>
                        {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Aperçu des couleurs */}
                <div className="p-4 space-y-2">
                    {/* Palette de couleurs principales */}
                    <div className="grid grid-cols-4 gap-1 mb-3">
                        <div
                            className="h-8 rounded"
                            style={{ backgroundColor: colors.primary || '#3b82f6' }}
                            title="Primary"
                        ></div>
                        <div
                            className="h-8 rounded"
                            style={{ backgroundColor: colors.accent || colors.primary || '#8b5cf6' }}
                            title="Accent"
                        ></div>
                        <div
                            className="h-8 rounded"
                            style={{ backgroundColor: colors.success || '#10b981' }}
                            title="Success"
                        ></div>
                        <div
                            className="h-8 rounded"
                            style={{ backgroundColor: colors.danger || '#ef4444' }}
                            title="Danger"
                        ></div>
                    </div>

                    {/* Exemple de card */}
                    <div
                        className="p-3 rounded border"
                        style={{
                            backgroundColor: colors.surface || colors.background,
                            borderColor: colors.border || '#374151',
                            color: colors.text || previewText
                        }}
                    >
                        <div className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary || colors.text }}>
                            Exemple de card
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span style={{ color: colors.success || '#10b981' }}>+2.5%</span>
                            <span style={{ color: colors.textSecondary || '#9ca3af' }}>•</span>
                            <span style={{ color: colors.danger || '#ef4444' }}>-1.2%</span>
                        </div>
                    </div>

                    {/* Badge de type */}
                    <div className="flex justify-end mt-2">
                        <span
                            className="text-xs px-2 py-1 rounded"
                            style={{
                                backgroundColor: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                                color: previewText
                            }}
                        >
                            {isLightTheme ? 'Light' : 'Dark'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Toggle DarkMode/Light si thème par défaut */}
            {isDarkLightTheme && (
                <button
                    onClick={handleToggleDarkLight}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                        isDarkMode
                            ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                    }`}
                    title={currentTheme === 'darkmode' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                >
                    <span className="text-lg">{currentTheme === 'darkmode' ? '🌙' : '☀️'}</span>
                    <span className="hidden sm:inline">{currentTheme === 'darkmode' ? 'Dark' : 'Light'}</span>
                </button>
            )}
            
            {/* Bouton pour ouvrir la modal */}
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                    isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                }`}
                title="Changer le thème"
            >
                <span className="text-lg">{currentThemeData ? getThemeIcon(currentThemeData.id) : '🎨'}</span>
                <span className="hidden sm:inline">{currentThemeData?.name || 'Thème'}</span>
                <span className="iconoir-nav-arrow-down text-sm"></span>
            </button>

            {/* Modal de sélection de thème */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
                >
                    <div
                        ref={modalRef}
                        className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
                            isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}
                    >
                        {/* Header de la modal */}
                        <div className={`sticky top-0 z-10 p-6 border-b ${
                            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Sélectionner un thème
                                    </h2>
                                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Choisissez l'apparence de votre dashboard
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        isDarkMode
                                            ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                                    }`}
                                    title="Fermer"
                                >
                                    <span className="iconoir-cancel text-xl"></span>
                                </button>
                            </div>
                        </div>

                        {/* Grille des thèmes */}
                        <div className="p-6">
                            {/* Thèmes par défaut */}
                            {defaultThemesList.length > 0 && (
                                <div className="mb-6">
                                    <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Thèmes par défaut
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {defaultThemesList.map(theme => renderThemePreview(theme))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Thèmes personnalisés */}
                            {customThemesList.length > 0 && (
                                <div>
                                    <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Thèmes personnalisés
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {customThemesList.map(theme => renderThemePreview(theme))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Message si aucun thème */}
                            {themes.length === 0 && (
                                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <p>Aucun thème disponible</p>
                                </div>
                            )}
                        </div>

                        {/* Footer avec info */}
                        <div className={`p-4 border-t ${
                            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                            <p className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Le thème sélectionné est sauvegardé automatiquement
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Exposer globalement
window.ThemeSelector = ThemeSelector;
