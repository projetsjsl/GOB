// Ground News Tab - Iframe integration for media bias analysis
// Full-screen dedicated tab for Ground News

const GroundNewsTab = (props = {}) => {
    const { isDarkMode = true, LucideIcon } = props;
    const [iframeLoaded, setIframeLoaded] = React.useState(false);

    const groundNewsUrl = 'https://ground.news/';

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
                className: `p-3 rounded-full ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`
            },
                React.createElement(IconComponent, { name: 'Globe', className: 'w-8 h-8 text-green-500' })
            ),
            React.createElement('div', null,
                React.createElement('h2', {
                    className: `text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                }, '🌍 Ground News'),
                React.createElement('p', {
                    className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                }, 'Actualités avec analyse de biais médiatiques multi-sources')
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
                    className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4'
                }),
                React.createElement('p', {
                    className: isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }, 'Chargement de Ground News...')
            )
        ),

        // Iframe
        React.createElement('iframe', {
            src: groundNewsUrl,
            className: `w-full h-[calc(100vh-250px)] min-h-[800px] rounded-xl border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } ${!iframeLoaded ? 'hidden' : ''}`,
            sandbox: 'allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation',
            onLoad: () => setIframeLoaded(true),
            title: 'Ground News'
        })
    );
};

// Make available globally
if (typeof window !== 'undefined') {
    window.GroundNewsTab = GroundNewsTab;
}
