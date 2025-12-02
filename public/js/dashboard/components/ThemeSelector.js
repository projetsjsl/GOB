/**
 * Composant ThemeSelector - Sélecteur de thème pour le dashboard
 */

const { useState, useEffect, useRef } = React;

const ThemeSelector = ({ isDarkMode = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('default');
    const dropdownRef = useRef(null);

    // Charger le thème au montage
    useEffect(() => {
        if (window.GOBThemes) {
            const themeId = window.GOBThemes.getCurrentTheme();
            setCurrentTheme(themeId);
        }
    }, []);

    // Fermer le dropdown si on clique en dehors
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themes = [
        { id: 'default', name: 'Par défaut', icon: '🎨' },
        { id: 'marketq', name: 'MarketQ', icon: '📊' },
        { id: 'marketq-dark', name: 'MarketQ Noir', icon: '⚫' },
        { id: 'bloomberg-terminal', name: 'Bloomberg Terminal', icon: '💻' },
        { id: 'seeking-alpha', name: 'Seeking Alpha', icon: '📈' },
        { id: 'bloomberg-mobile', name: 'Bloomberg Mobile', icon: '📱' },
        { id: 'bloomberg-nostalgie', name: 'Bloomberg Nostalgie', icon: '🕰️' }
    ];

    const handleThemeChange = (themeId) => {
        if (window.GOBThemes) {
            window.GOBThemes.applyTheme(themeId);
            setCurrentTheme(themeId);
            setIsOpen(false);
            
            // Déclencher un événement personnalisé pour notifier les autres composants
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeId } }));
        }
    };

    const currentThemeData = themes.find(t => t.id === currentTheme) || themes[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                }`}
                title="Changer le thème"
            >
                <span className="text-lg">{currentThemeData.icon}</span>
                <span className="hidden sm:inline">{currentThemeData.name}</span>
                <span className={`iconoir-nav-arrow-${isOpen ? 'up' : 'down'} text-sm`}></span>
            </button>

            {isOpen && (
                <div
                    className={`absolute right-0 mt-2 w-64 rounded-lg shadow-xl border z-50 ${
                        isDarkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                    }`}
                    style={{ top: '100%' }}
                >
                    <div className="p-2">
                        <div className={`text-xs font-semibold px-3 py-2 mb-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            THÈMES DISPONIBLES
                        </div>
                        {themes.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => handleThemeChange(theme.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-left ${
                                    currentTheme === theme.id
                                        ? isDarkMode
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-blue-100 text-blue-900'
                                        : isDarkMode
                                            ? 'hover:bg-gray-700 text-gray-200'
                                            : 'hover:bg-gray-100 text-gray-900'
                                }`}
                            >
                                <span className="text-xl">{theme.icon}</span>
                                <span className="flex-1 font-medium">{theme.name}</span>
                                {currentTheme === theme.id && (
                                    <span className="iconoir-check text-lg"></span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Exposer globalement
window.ThemeSelector = ThemeSelector;

