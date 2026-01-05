// TradingView Screener Tab - Stock filtering and analysis
// Full-screen TradingView Stock Screener widget

const ScreenerTab = (props = {}) => {
    const { isDarkMode = true, LucideIcon } = props;
    const containerRef = React.useRef(null);
    const [isLoading, setIsLoading] = React.useState(true);

    const IconComponent = LucideIcon || window.LucideIcon || window.IconoirIcon || (({ name, className }) => (
        React.createElement('i', { className: `iconoir-${name.toLowerCase()} ${className}` })
    ));

    React.useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        const widgetContainer = containerRef.current.querySelector('.tradingview-widget-container__widget');
        if (widgetContainer) {
            widgetContainer.innerHTML = '';
        }

        // Create TradingView script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            width: '100%',
            height: 800,
            defaultColumn: 'overview',
            defaultScreen: 'general',
            market: 'america',
            showToolbar: true,
            colorTheme: isDarkMode ? 'dark' : 'light',
            locale: 'fr',
            largeChartUrl: '',
            isTransparent: false,
            autosize: true
        });

        const widgetDiv = containerRef.current.querySelector('.tradingview-widget-container__widget');
        if (widgetDiv) {
            widgetDiv.appendChild(script);
            setIsLoading(false);
        }

        return () => {
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [isDarkMode]);

    return React.createElement('div', {
        className: `min-h-screen p-6 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`
    },
        // Header
        React.createElement('div', {
            className: 'mb-6 flex items-center gap-4'
        },
            React.createElement('div', {
                className: `p-3 rounded-full ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`
            },
                React.createElement(IconComponent, { name: 'Filter', className: 'w-8 h-8 text-blue-500' })
            ),
            React.createElement('div', null,
                React.createElement('h2', {
                    className: `text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                }, '🔍 Screener Actions'),
                React.createElement('p', {
                    className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                }, 'Filtrez et analysez des milliers d\'actions selon vos critères')
            )
        ),

        // Loading indicator
        isLoading && React.createElement('div', {
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
                }, 'Chargement du screener...')
            )
        ),

        // TradingView Widget Container
        React.createElement('div', {
            ref: containerRef,
            className: 'tradingview-widget-container'
        },
            React.createElement('div', {
                className: 'tradingview-widget-container__widget'
            })
        )
    );
};

// Make available globally
if (typeof window !== 'undefined') {
    window.ScreenerTab = ScreenerTab;
}
