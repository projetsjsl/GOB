// @ts-nocheck
import React, { useState, useEffect, useRef, memo } from 'react';
import type { TabProps } from '../../types';

/**
 * ScreenerTab
 * Composant dédié pour le Screener TradingView
 *
 * Permet de filtrer et screener des actions selon différents critères :
 * - Market Cap, P/E Ratio, Volume
 * - Secteur, Industrie, Pays
 * - Performance, Volatilité
 */

export const ScreenerTab: React.FC<TabProps> = memo((props) => {
    const {
        isDarkMode = true,
        LucideIcon: LucideIconProp
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const LucideIcon = LucideIconProp || (({ name, className = '' }) => (
        <span className={className}>{name}</span>
    ));

    // Initialize TradingView Screener Widget
    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        containerRef.current.innerHTML = '';

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
            locale: 'fr'
        });

        containerRef.current.appendChild(script);

        // Mark as loaded after script loads
        script.onload = () => {
            setTimeout(() => setIsLoading(false), 1000);
        };

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [isDarkMode]);

    return (
        <div className={`min-h-screen p-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-4 rounded-full ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                        <LucideIcon name="Filter" className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            🔍 Screener de Titres
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Filtrez et analysez des milliers d'actions selon vos critères
                        </p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-blue-900/20 border border-blue-600/30' : 'bg-blue-50 border border-blue-200'
                }`}>
                    <div className="flex items-start gap-3">
                        <LucideIcon name="Info" className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                            <p className="font-semibold mb-1">Critères de screening disponibles :</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Market Cap, P/E Ratio, P/B Ratio, Dividend Yield</li>
                                <li>Volume, Volatilité, Performance (1D, 1W, 1M, 1Y)</li>
                                <li>Secteur, Industrie, Pays, Exchange</li>
                                <li>RSI, MACD, Moving Averages, et plus</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Chargement du screener TradingView...
                        </p>
                    </div>
                </div>
            )}

            {/* TradingView Screener Widget */}
            <div className={`rounded-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
            } ${isLoading ? 'hidden' : 'block'}`}>
                <div ref={containerRef} className="tradingview-widget-container">
                    <div className="tradingview-widget-container__widget"></div>
                </div>
            </div>

            {/* Tips */}
            <div className="mt-6">
                <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-green-900/20 border border-green-600/30' : 'bg-green-50 border border-green-200'
                }`}>
                    <div className="flex items-start gap-3">
                        <LucideIcon name="Lightbulb" className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
                            <p className="font-semibold mb-1">💡 Conseils d'utilisation :</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Utilisez les filtres prédéfinis ou créez les vôtres</li>
                                <li>Cliquez sur les colonnes pour trier les résultats</li>
                                <li>Cliquez sur un titre pour voir les détails</li>
                                <li>Sauvegardez vos screenings favoris pour les réutiliser</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Set display name for debugging
ScreenerTab.displayName = 'ScreenerTab';

export default ScreenerTab;
