const ThemeSelector = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentTheme, setCurrentTheme] = React.useState('darkmode');
    const dropdownRef = React.useRef(null);

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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('themeChanged', handleThemeChange);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
            case 'marketq': return 'graph-up';
            case 'bloomberg-terminal': return 'terminal';
            default: return 'palette';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center gap-2"
                title="Changer le thème"
            >
                <i className={`iconoir-${getIcon(currentTheme)} text-xl`}></i>
                <span className="hidden lg:inline text-sm font-medium">
                    {window.GOBThemes?.themes[currentTheme]?.name || 'Thème'}
                </span>
                <i className="iconoir-nav-arrow-down text-xs opacity-50"></i>
            </button>

            {isOpen && (
                <div 
                    className="fixed w-56 rounded-xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 py-2 z-50 overflow-hidden animate-slide-down"
                    style={{
                        top: '80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</span>
                    </div>
                    
                    {['light', 'darkmode', 'ia'].map(id => (
                        <button
                            key={id}
                            onClick={() => toggleTheme(id)}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                                currentTheme === id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <i className={`iconoir-${getIcon(id)} text-lg`}></i>
                            {window.GOBThemes?.themes[id]?.name}
                            {currentTheme === id && <i className="iconoir-check ml-auto text-blue-500"></i>}
                        </button>
                    ))}

                    <div className="px-4 py-2 border-b border-t border-gray-100 dark:border-gray-800 my-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Professionnel</span>
                    </div>

                    {['marketq', 'bloomberg-terminal', 'seeking-alpha'].map(id => (
                        <button
                            key={id}
                            onClick={() => toggleTheme(id)}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                                currentTheme === id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                             <i className={`iconoir-${getIcon(id)} text-lg`}></i>
                            {window.GOBThemes?.themes[id]?.name}
                            {currentTheme === id && <i className="iconoir-check ml-auto text-blue-500"></i>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Expose to window
window.ThemeSelector = ThemeSelector;
