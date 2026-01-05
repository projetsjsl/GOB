// Orchestrator Tab - Multi-agent workflow automation
// Integrates workflow-builder.html for visual workflow creation

const OrchestratorTab = (props = {}) => {
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
                className: `p-3 rounded-full ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`
            },
                React.createElement(IconComponent, { name: 'GitBranch', className: 'w-8 h-8 text-purple-500' })
            ),
            React.createElement('div', null,
                React.createElement('h2', {
                    className: `text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                }, '🔄 Orchestrateur Multi-Agents'),
                React.createElement('p', {
                    className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                }, 'Créez et gérez des workflows d\'automatisation avec agents IA')
            )
        ),

        // Quick Actions Cards
        React.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'
        },
            // Active Workflows Card
            React.createElement('div', {
                className: `p-4 rounded-lg border ${
                    isDarkMode
                        ? 'bg-gray-800 border-gray-700 hover:border-purple-500'
                        : 'bg-white border-gray-200 hover:border-purple-400'
                } transition-colors cursor-pointer`
            },
                React.createElement('div', {
                    className: 'flex items-center gap-3'
                },
                    React.createElement(IconComponent, { name: 'Activity', className: 'w-6 h-6 text-purple-500' }),
                    React.createElement('div', null,
                        React.createElement('h3', {
                            className: `font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                        }, 'Workflows Actifs'),
                        React.createElement('p', {
                            className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, 'Gérer vos automatisations')
                    )
                )
            ),

            // Schedules Card
            React.createElement('div', {
                className: `p-4 rounded-lg border ${
                    isDarkMode
                        ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                        : 'bg-white border-gray-200 hover:border-blue-400'
                } transition-colors cursor-pointer`
            },
                React.createElement('div', {
                    className: 'flex items-center gap-3'
                },
                    React.createElement(IconComponent, { name: 'Calendar', className: 'w-6 h-6 text-blue-500' }),
                    React.createElement('div', null,
                        React.createElement('h3', {
                            className: `font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                        }, 'Planifications'),
                        React.createElement('p', {
                            className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, 'Tâches programmées')
                    )
                )
            ),

            // History Card
            React.createElement('div', {
                className: `p-4 rounded-lg border ${
                    isDarkMode
                        ? 'bg-gray-800 border-gray-700 hover:border-green-500'
                        : 'bg-white border-gray-200 hover:border-green-400'
                } transition-colors cursor-pointer`
            },
                React.createElement('div', {
                    className: 'flex items-center gap-3'
                },
                    React.createElement(IconComponent, { name: 'Clock', className: 'w-6 h-6 text-green-500' }),
                    React.createElement('div', null,
                        React.createElement('h3', {
                            className: `font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                        }, 'Historique'),
                        React.createElement('p', {
                            className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, 'Exécutions passées')
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
                    className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4'
                }),
                React.createElement('p', {
                    className: isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }, 'Chargement du workflow builder...')
            )
        ),

        // Workflow Builder Iframe
        React.createElement('iframe', {
            src: '/workflow-builder.html',
            className: `w-full h-[calc(100vh-300px)] min-h-[700px] rounded-xl border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } ${!iframeLoaded ? 'hidden' : ''}`,
            title: 'Workflow Builder',
            sandbox: 'allow-same-origin allow-scripts allow-forms allow-modals',
            onLoad: () => setIframeLoaded(true)
        })
    );
};

// Make available globally
if (typeof window !== 'undefined') {
    window.OrchestratorTab = OrchestratorTab;
}
