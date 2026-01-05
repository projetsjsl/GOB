// Nouvelles Tab - Financial news aggregator with filters
// Simplified version for beta-combined-dashboard.html

const NouvellesTab = (props = {}) => {
    const dashboard = typeof window !== 'undefined' ? window.BetaCombinedDashboard || {} : {};
    const isDarkMode = props.isDarkMode ?? dashboard.isDarkMode ?? true;
    const newsData = props.newsData || dashboard.newsData || [];
    const loading = props.loading ?? dashboard.loading ?? false;
    const fetchNews = props.fetchNews || dashboard.fetchNews || (() => {});
    const LucideIcon = props.LucideIcon || window.LucideIcon || window.IconoirIcon;

    const [frenchOnly, setFrenchOnly] = React.useState(false);
    const [selectedSource, setSelectedSource] = React.useState('all');
    const [filteredNews, setFilteredNews] = React.useState([]);
    const [groundNewsExpanded, setGroundNewsExpanded] = React.useState(false);
    const [groundNewsLoaded, setGroundNewsLoaded] = React.useState(false);

    const sources = ['Bloomberg', 'Reuters', 'WSJ', 'CNBC', 'MarketWatch'];

    const IconComponent = LucideIcon || (({ name, className }) => (
        React.createElement('i', { className: `iconoir-${name.toLowerCase()} ${className}` })
    ));

    // Helper: Detect French articles
    const isFrench = (article) => {
        const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
        const indicators = ['le ', 'la ', 'les ', 'un ', 'une ', 'des ', 'québec', 'montréal', 'canada'];
        return indicators.some(ind => text.includes(ind));
    };

    // Helper: Clean text
    const cleanText = (text) => {
        if (!text) return '';
        return text.replace(/\[.*?\]/g, '').trim();
    };

    // Helper: Get news icon
    const getNewsIcon = (title, desc) => {
        const text = ((title || '') + ' ' + (desc || '')).toLowerCase();
        if (text.includes('crypto') || text.includes('bitcoin')) return { icon: 'Bitcoin', color: 'text-orange-500' };
        if (text.includes('tech') || text.includes('apple')) return { icon: 'Cpu', color: 'text-blue-500' };
        if (text.includes('bank') || text.includes('fed')) return { icon: 'Building', color: 'text-green-500' };
        return { icon: 'Newspaper', color: 'text-gray-500' };
    };

    // Filter news
    React.useEffect(() => {
        let filtered = newsData;

        if (frenchOnly) {
            filtered = filtered.filter(isFrench);
        }

        if (selectedSource !== 'all') {
            filtered = filtered.filter(article => {
                const source = (article.source?.name || '').toLowerCase();
                return source.includes(selectedSource.toLowerCase());
            });
        }

        setFilteredNews(filtered);
    }, [newsData, frenchOnly, selectedSource]);

    return React.createElement('div', {
        className: 'space-y-6'
    },
        // Header
        React.createElement('div', {
            className: 'flex justify-between items-center'
        },
            React.createElement('h2', {
                className: `text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
            }, '📰 Nouvelles Financières'),
            React.createElement('div', {
                className: 'flex gap-2'
            },
                React.createElement('button', {
                    onClick: () => setFrenchOnly(!frenchOnly),
                    className: `px-4 py-2 rounded-lg font-semibold transition-all ${
                        frenchOnly
                            ? 'bg-blue-600 text-white'
                            : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900')
                    }`
                }, `🇫🇷 Français ${frenchOnly ? '✓' : ''}`),
                React.createElement('button', {
                    onClick: fetchNews,
                    disabled: loading,
                    className: `px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                        isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`
                }, loading ? '⏳ Actualisation...' : '🔄 Actualiser')
            )
        ),

        // Stats
        React.createElement('div', {
            className: `p-4 rounded-xl ${
                isDarkMode
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            }`
        },
            React.createElement('div', {
                className: 'flex items-center justify-between'
            },
                React.createElement('div', null,
                    React.createElement('div', {
                        className: `text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                    }, filteredNews.length),
                    React.createElement('div', {
                        className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                    }, 'Articles filtrés')
                ),
                React.createElement(IconComponent, { name: 'Newspaper', className: `w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}` })
            )
        ),

        // Filters
        React.createElement('div', {
            className: `p-6 rounded-xl ${
                isDarkMode
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            }`
        },
            React.createElement('h3', {
                className: `text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`
            }, '🔍 Filtres'),
            React.createElement('div', {
                className: 'mb-4'
            },
                React.createElement('label', {
                    className: `text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`
                }, '📰 Source'),
                React.createElement('div', {
                    className: 'flex flex-wrap gap-2'
                },
                    React.createElement('button', {
                        onClick: () => setSelectedSource('all'),
                        className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedSource === 'all'
                                ? 'bg-blue-600 text-white'
                                : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                        }`
                    }, 'Toutes'),
                    ...sources.map(source =>
                        React.createElement('button', {
                            key: source,
                            onClick: () => setSelectedSource(source),
                            className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                selectedSource === source
                                    ? 'bg-blue-600 text-white'
                                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                            }`
                        }, source)
                    )
                )
            )
        ),

        // Ground News Expandable Section
        React.createElement('div', {
            className: `rounded-xl transition-all ${
                isDarkMode
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            }`
        },
            // Header
            React.createElement('button', {
                onClick: () => setGroundNewsExpanded(!groundNewsExpanded),
                className: 'w-full p-6 flex items-center justify-between hover:bg-gray-700/20 transition-colors rounded-t-xl'
            },
                React.createElement('div', {
                    className: 'flex items-center gap-4'
                },
                    React.createElement('div', {
                        className: `p-3 rounded-full ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`
                    },
                        React.createElement(IconComponent, { name: 'Globe', className: 'w-6 h-6 text-green-500' })
                    ),
                    React.createElement('div', {
                        className: 'text-left'
                    },
                        React.createElement('h3', {
                            className: `text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                        }, '🌍 Ground News'),
                        React.createElement('p', {
                            className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, 'Actualités avec analyse de biais médiatiques')
                    )
                ),
                React.createElement(IconComponent, {
                    name: groundNewsExpanded ? 'ChevronUp' : 'ChevronDown',
                    className: `w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                })
            ),

            // Expanded content
            groundNewsExpanded && React.createElement('div', {
                className: 'p-6 pt-0'
            },
                !groundNewsLoaded && React.createElement('div', {
                    className: 'flex items-center justify-center py-12'
                },
                    React.createElement('div', {
                        className: 'text-center'
                    },
                        React.createElement('div', {
                            className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4'
                        }),
                        React.createElement('p', {
                            className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, 'Chargement de Ground News...')
                    )
                ),
                React.createElement('iframe', {
                    src: 'https://ground.news/',
                    className: `w-full h-[800px] rounded-lg ${!groundNewsLoaded ? 'hidden' : ''}`,
                    sandbox: 'allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation',
                    onLoad: () => setGroundNewsLoaded(true),
                    title: 'Ground News'
                })
            )
        ),

        // News List
        React.createElement('div', {
            className: 'space-y-4'
        },
            filteredNews.length === 0
                ? React.createElement('div', {
                    className: `text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                },
                    React.createElement(IconComponent, { name: 'AlertCircle', className: 'w-16 h-16 mx-auto mb-4 opacity-50' }),
                    React.createElement('p', {
                        className: 'text-lg font-semibold mb-2'
                    }, 'Aucune nouvelle disponible'),
                    React.createElement('p', {
                        className: 'text-sm'
                    }, 'Cliquez sur Actualiser pour charger les dernières nouvelles')
                )
                : filteredNews.map((article, index) => {
                    const iconData = getNewsIcon(article.title, article.description);
                    return React.createElement('div', {
                        key: index,
                        className: `p-6 rounded-xl transition-all hover:scale-[1.01] ${
                            isDarkMode
                                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-gray-600'
                                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300'
                        }`
                    },
                        React.createElement('div', {
                            className: 'flex items-start gap-4'
                        },
                            React.createElement('div', {
                                className: `p-3 rounded-full ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/60'}`
                            },
                                React.createElement(IconComponent, { name: iconData.icon, className: `w-6 h-6 ${iconData.color}` })
                            ),
                            React.createElement('div', {
                                className: 'flex-1'
                            },
                                React.createElement('h3', {
                                    className: `font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                                },
                                    article.url
                                        ? React.createElement('a', {
                                            href: article.url,
                                            target: '_blank',
                                            rel: 'noopener noreferrer',
                                            className: `hover:underline ${isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`
                                        }, cleanText(article.title))
                                        : cleanText(article.title)
                                ),
                                React.createElement('p', {
                                    className: `text-base mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`
                                }, cleanText(article.description)),
                                React.createElement('div', {
                                    className: 'flex items-center gap-4 flex-wrap'
                                },
                                    React.createElement('div', {
                                        className: `px-3 py-1 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`
                                    },
                                        React.createElement('span', {
                                            className: 'text-xs font-semibold'
                                        }, article.source?.name || 'Source inconnue')
                                    ),
                                    React.createElement('span', {
                                        className: `text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`
                                    }, new Date(article.publishedAt || article.publishedDate).toLocaleString('fr-FR')),
                                    isFrench(article) && React.createElement('span', {
                                        className: 'px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                    }, '🇫🇷 FR')
                                )
                            )
                        )
                    );
                })
        )
    );
};

// Make available globally
if (typeof window !== 'undefined') {
    window.NouvellesTab = NouvellesTab;
}
