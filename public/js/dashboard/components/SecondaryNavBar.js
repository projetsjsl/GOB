/**
 * SecondaryNavBar Component
 * Standardized secondary navigation bar for dashboard tabs.
 */

const SecondaryNavBar = ({ activeTab, onTabChange, isDarkMode, items = [] }) => {
    // Liste des onglets de navigation secondaire fournie via props (items)
    // Si items est vide, on n'affiche rien ou une liste par défaut si nécessaire
    const navItems = items;

    if (!navItems || navItems.length === 0) return null;

    return (
        <div className={`mb-6 p-2 rounded-lg flex items-center gap-2 overflow-x-auto ${
            isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/50 border border-gray-200'
        } backdrop-blur-sm`}>
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onTabChange && onTabChange(item.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        activeTab === item.id
                            ? (isDarkMode 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                : 'bg-blue-500 text-white shadow-md')
                            : (isDarkMode 
                                ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50')
                    }`}
                >
                    {typeof Icon !== 'undefined' ? (
                        <Icon name={item.icon} size={16} />
                    ) : (
                        item.label[0]
                    )}
                    <span className="whitespace-nowrap">{item.label}</span>
                </button>
            ))}
        </div>
    );
};

window.SecondaryNavBar = SecondaryNavBar;
