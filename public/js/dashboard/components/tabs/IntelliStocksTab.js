// IntelliStocks Tab - FastGraphs Integration with Auto-Login
// Provides seamless access to FastGraphs charting via Browserbase session

const IntelliStocksTab = (props = {}) => {
    const { isDarkMode = true, LucideIcon } = props;
    const [isExpanded, setIsExpanded] = React.useState(() => {
        return localStorage.getItem('fastgraph_expanded') === 'true';
    });
    const [iframeLoaded, setIframeLoaded] = React.useState(false);
    const [sessionUrl, setSessionUrl] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const IconComponent = LucideIcon || window.LucideIcon || window.IconoirIcon || (({ name, className }) => (
        React.createElement('i', { className: `iconoir-${name.toLowerCase()} ${className}` })
    ));

    // Save expand state
    React.useEffect(() => {
        localStorage.setItem('fastgraph_expanded', String(isExpanded));
    }, [isExpanded]);

    // Auto-login when expanded
    React.useEffect(() => {
        if (isExpanded && !sessionUrl && !isLoading) {
            handleAutoLogin();
        }
    }, [isExpanded]);

    const handleAutoLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/fastgraphs-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error('Échec de la connexion FastGraphs');
            }

            const data = await response.json();

            if (data.success && data.session) {
                setSessionUrl(data.session.connectUrl);
                console.log('✅ FastGraphs session créée:', data.session.id);
            } else {
                throw new Error(data.error || 'Session non disponible');
            }
        } catch (err) {
            console.error('❌ Erreur FastGraphs auto-login:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return React.createElement('div', {
        className: `min-h-screen p-6 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`
    },
        // Header
        React.createElement('div', {
            className: 'mb-6'
        },
            React.createElement('div', {
                className: `rounded-xl transition-all duration-300 ${
                    isDarkMode
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                        : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                }`
            },
                // Expandable Header
                React.createElement('button', {
                    onClick: () => setIsExpanded(!isExpanded),
                    className: 'w-full p-6 flex items-center justify-between hover:bg-gray-700/20 transition-colors duration-200 rounded-t-xl'
                },
                    React.createElement('div', {
                        className: 'flex items-center gap-4'
                    },
                        React.createElement('div', {
                            className: `p-3 rounded-full ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`
                        },
                            React.createElement(IconComponent, { name: 'TrendingUp', className: 'w-6 h-6 text-blue-500' })
                        ),
                        React.createElement('div', {
                            className: 'text-left'
                        },
                            React.createElement('h3', {
                                className: `text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                            }, '📊 FastGraphs'),
                            React.createElement('p', {
                                className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                            }, 'Analyse graphique avancée avec fondamentaux')
                        )
                    ),
                    React.createElement(IconComponent, {
                        name: isExpanded ? 'ChevronUp' : 'ChevronDown',
                        className: `w-5 h-5 transition-transform ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                    })
                ),

                // Expanded Content
                isExpanded && React.createElement('div', {
                    className: 'p-6 pt-0'
                },
                    // Status Message
                    React.createElement('div', {
                        className: `mb-4 p-4 rounded-lg border ${
                            error
                                ? (isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200')
                                : isLoading
                                    ? (isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200')
                                    : sessionUrl
                                        ? (isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200')
                                        : (isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200')
                        }`
                    },
                        error
                            ? React.createElement('div', {
                                className: 'flex items-center gap-3'
                            },
                                React.createElement(IconComponent, { name: 'AlertCircle', className: 'w-5 h-5 text-red-500' }),
                                React.createElement('div', null,
                                    React.createElement('p', {
                                        className: `font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`
                                    }, 'Erreur de connexion'),
                                    React.createElement('p', {
                                        className: `text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`
                                    }, error),
                                    React.createElement('button', {
                                        onClick: handleAutoLogin,
                                        className: 'mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700'
                                    }, 'Réessayer')
                                )
                            )
                            : isLoading
                                ? React.createElement('div', {
                                    className: 'flex items-center gap-3'
                                },
                                    React.createElement('div', {
                                        className: 'animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500'
                                    }),
                                    React.createElement('p', {
                                        className: isDarkMode ? 'text-blue-400' : 'text-blue-700'
                                    }, 'Connexion à FastGraphs...')
                                )
                                : sessionUrl
                                    ? React.createElement('div', {
                                        className: 'flex items-center gap-3'
                                    },
                                        React.createElement(IconComponent, { name: 'Check', className: 'w-5 h-5 text-green-500' }),
                                        React.createElement('p', {
                                            className: isDarkMode ? 'text-green-400' : 'text-green-700'
                                        }, '✓ Connecté à FastGraphs')
                                    )
                                    : React.createElement('div', {
                                        className: 'flex items-center gap-3'
                                    },
                                        React.createElement(IconComponent, { name: 'Info', className: 'w-5 h-5 text-gray-500' }),
                                        React.createElement('p', {
                                            className: isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }, 'Connexion automatique en cours...')
                                    )
                    ),

                    // Iframe
                    sessionUrl && !iframeLoaded && React.createElement('div', {
                        className: 'flex items-center justify-center h-96'
                    },
                        React.createElement('div', {
                            className: 'text-center'
                        },
                            React.createElement('div', {
                                className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'
                            }),
                            React.createElement('p', {
                                className: isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }, 'Chargement de FastGraphs...')
                        )
                    ),

                    sessionUrl && React.createElement('iframe', {
                        src: sessionUrl,
                        className: `w-full h-[calc(100vh-400px)] min-h-[600px] rounded-lg border ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        } ${!iframeLoaded ? 'hidden' : ''}`,
                        sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation',
                        onLoad: () => setIframeLoaded(true),
                        title: 'FastGraphs'
                    })
                )
            )
        )
    );
};

// Make available globally
if (typeof window !== 'undefined') {
    window.IntelliStocksTab = IntelliStocksTab;
}
