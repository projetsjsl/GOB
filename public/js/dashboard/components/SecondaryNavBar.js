/**
 * SecondaryNavBar Component
 * Standardized secondary navigation bar for dashboard tabs.
 * Styled with "Emma IA" aesthetics (Glassmorphism, gradients, hover effects).
 */

const SecondaryNavBar = ({ activeTab, onTabChange, isDarkMode, items = [] }) => {
    // Liste des onglets de navigation secondaire fournie via props (items)
    const navItems = items;

    if (!navItems || navItems.length === 0) return null;

    return (
        <div className={`mb-6 p-2 rounded-2xl flex items-center gap-3 overflow-x-auto custom-scrollbar ${
            isDarkMode 
                ? 'bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-white/10' 
                : 'bg-gradient-to-r from-white/80 to-gray-50/80 border border-gray-200'
        } backdrop-blur-md shadow-xl`}>
            {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onTabChange && onTabChange(item.id)}
                        className={`group relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 border overflow-hidden ${
                            isActive
                                ? (isDarkMode 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105' 
                                    : 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105')
                                : (isDarkMode 
                                    ? 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-105' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 hover:scale-105')
                        }`}
                    >
                        {/* Glow effect for active/hover */}
                        {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer" />
                        )}
                        
                        <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                           {typeof Icon !== 'undefined' ? (
                                <Icon name={item.icon} size={18} />
                            ) : (
                                item.label && item.label[0]
                            )}
                        </span>
                        <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

window.SecondaryNavBar = SecondaryNavBar;
