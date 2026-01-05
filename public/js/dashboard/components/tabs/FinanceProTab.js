// Finance Pro Tab (3p1) - Advanced financial analysis and portfolio management
// Loads the standalone Finance Pro application in iframe

const FinanceProTab = (props = {}) => {
    const { isDarkMode = true, LucideIcon } = props;
    const [iframeLoaded, setIframeLoaded] = React.useState(false);

    const IconComponent = LucideIcon || window.LucideIcon || window.IconoirIcon || (({ name, className }) => (
        React.createElement('i', { className: `iconoir-${name.toLowerCase()} ${className}` })
    ));

    return React.createElement('div', {
        className: `min-h-screen p-6 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`
    },
        // Header
        React.createElement('div', {
            className: 'mb-6 flex items-center gap-4'
        },
            React.createElement('div', {
                className: `p-3 rounded-full ${isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'}`
            },
                React.createElement(IconComponent, { name: 'PieChart', className: 'w-8 h-8 text-indigo-500' })
            ),
            React.createElement('div', null,
                React.createElement('h2', {
                    className: `text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                }, '💼 Finance Pro (3p1)'),
                React.createElement('p', {
                    className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                }, 'Analyse financière avancée et gestion de portfolio')
            )
        ),

        // Info Cards
        React.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'
        },
            React.createElement('div', {
                className: `p-4 rounded-lg border ${
                    isDarkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                }`
            },
                React.createElement('div', {
                    className: 'flex items-center gap-3'
                },
                    React.createElement(IconComponent, { name: 'TrendingUp', className: 'w-6 h-6 text-green-500' }),
                    React.createElement('div', null,
                        React.createElement('h3', {
                            className: `font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                        }, 'Analyse 3 Points'),
                        React.createElement('p', {
                            className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, 'Rendement, Qualité, Prix')
                    )
                )
            ),
            React.createElement('div', {
                className: `p-4 rounded-lg border ${
                    isDarkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                }`
            },
                React.createElement('div', {
                    className: 'flex items-center gap-3'
                },
                    React.createElement(IconComponent, { name: 'Target', className: 'w-6 h-6 text-blue-500' }),
                    React.createElement('div', null,
                        React.createElement('h3', {
                            className: `font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                        }, 'Portfolio'),
                        React.createElement('p', {
                            className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, 'Suivi de performance')
                    )
                )
            ),
            React.createElement('div', {
                className: `p-4 rounded-lg border ${
                    isDarkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                }`
            },
                React.createElement('div', {
                    className: 'flex items-center gap-3'
                },
                    React.createElement(IconComponent, { name: 'Database', className: 'w-6 h-6 text-purple-500' }),
                    React.createElement('div', null,
                        React.createElement('h3', {
                            className: `font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                        }, 'Données'),
                        React.createElement('p', {
                            className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, 'Snapshots & Historique')
                    )
                )
            )
        ),

        // Loading indicator
        !iframeLoaded && React.createElement('div', {
            className: 'flex items-center justify-center h-96'
        },
            React.createElement('div', {
                className: 'text-center'
            },
                React.createElement('div', {
                    className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4'
                }),
                React.createElement('p', {
                    className: isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }, 'Chargement de Finance Pro...')
            )
        ),

        // Finance Pro Iframe
        React.createElement('iframe', {
            src: '/3p1/index.html',
            className: `w-full h-[calc(100vh-300px)] min-h-[800px] rounded-xl border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } ${!iframeLoaded ? 'hidden' : ''}`,
            title: 'Finance Pro 3p1',
            sandbox: 'allow-same-origin allow-scripts allow-forms allow-modals allow-popups',
            onLoad: () => setIframeLoaded(true)
        })
    );
};

// Make available globally
if (typeof window !== 'undefined') {
    window.FinanceProTab = FinanceProTab;
}
