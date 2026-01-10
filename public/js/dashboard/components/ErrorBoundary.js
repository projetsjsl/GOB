/**
 * TECH #1 FIX: Error Boundary réutilisable pour widgets TradingView et autres composants
 * Protège contre les erreurs JavaScript et affiche un fallback UI
 */

// Error Boundary pour widgets individuels (TradingView, etc.)
const WidgetErrorBoundary = React.memo(class WidgetErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[WidgetErrorBoundary] Widget Error:', error);
        console.error('[WidgetErrorBoundary] Error Info:', errorInfo);
        
        // Log to monitoring service if available
        if (window.trackError) {
            window.trackError({
                error: error.toString(),
                componentStack: errorInfo.componentStack,
                widgetName: this.props.widgetName || 'Unknown'
            });
        }

        this.setState({
            errorInfo: errorInfo
        });
    }

    handleRetry = () => {
        this.setState({ 
            hasError: false, 
            error: null,
            errorInfo: null 
        });
    };

    render() {
        if (this.state.hasError) {
            const { isDarkMode = true, widgetName = 'Widget', onRetry } = this.props;
            
            return (
                <div className={`h-full flex flex-col items-center justify-center p-6 rounded-lg border-2 ${
                    isDarkMode 
                        ? 'bg-red-900/20 border-red-500/50 text-red-200' 
                        : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                        Erreur {widgetName}
                    </h3>
                    <p className={`text-sm text-center mb-4 max-w-md ${isDarkMode ? 'text-red-300/80' : 'text-red-600'}`}>
                        {this.state.error?.message || "Une erreur est survenue lors du chargement du widget."}
                    </p>
                    <div className="flex gap-2">
                        <button 
                            onClick={onRetry || this.handleRetry}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                isDarkMode 
                                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                        >
                            Réessayer
                        </button>
                        {this.props.onReload && (
                            <button 
                                onClick={this.props.onReload}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                    isDarkMode 
                                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                        : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                                }`}
                            >
                                Recharger
                            </button>
                        )}
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                        <details className={`mt-4 text-xs max-w-full overflow-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <summary className="cursor-pointer hover:underline">
                                Détails techniques
                            </summary>
                            <pre className={`mt-2 p-3 rounded text-left whitespace-pre-wrap overflow-auto max-h-40 ${
                                isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800'
                            }`}>
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
});

// HOC pour wrapper un composant avec ErrorBoundary
const withErrorBoundary = (Component, options = {}) => {
    return function WithErrorBoundaryWrapper(props) {
        return (
            <WidgetErrorBoundary 
                widgetName={options.widgetName || Component.name || 'Component'}
                isDarkMode={props.isDarkMode}
                onRetry={options.onRetry}
                onReload={options.onReload}
            >
                <Component {...props} />
            </WidgetErrorBoundary>
        );
    };
};

// Exposer globalement
if (typeof window !== 'undefined') {
    window.WidgetErrorBoundary = WidgetErrorBoundary;
    window.withErrorBoundary = withErrorBoundary;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WidgetErrorBoundary, withErrorBoundary };
}
