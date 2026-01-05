// @ts-nocheck
import React, { useState, useEffect, memo } from 'react';
import type { TabProps } from '../../types';

/**
 * GroundNewsTab
 * Composant dédié pour Ground News - Analyse de biais médiatiques
 *
 * Ground News compare les sources médiatiques et révèle les biais politiques
 * dans la couverture d'actualité.
 */

export const GroundNewsTab: React.FC<TabProps> = memo((props) => {
    const {
        isDarkMode = true,
        LucideIcon: LucideIconProp
    } = props;

    const [iframeLoaded, setIframeLoaded] = useState(false);

    const LucideIcon = LucideIconProp || (({ name, className = '' }) => (
        <span className={className}>{name}</span>
    ));

    // Get credentials from environment (if available)
    const hasCredentials = typeof window !== 'undefined' &&
        (window as any).GROUND_NEWS_EMAIL &&
        (window as any).GROUND_NEWS_PASSWORD;

    const groundNewsUrl = 'https://ground.news/';

    return (
        <div className={`min-h-screen p-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-4 rounded-full ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                        <LucideIcon name="Globe" className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            🌍 Ground News
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Analyse de biais médiatiques et couverture d'actualité
                            {hasCredentials && <span className="ml-2 text-green-500">● Connecté</span>}
                        </p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-blue-900/20 border border-blue-600/30' : 'bg-blue-50 border border-blue-200'
                }`}>
                    <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                        <strong>Ground News</strong> compare les sources médiatiques et révèle les biais politiques dans la couverture d'actualité.
                        Découvrez comment différentes sources rapportent la même histoire.
                    </p>
                </div>
            </div>

            {/* Loading Indicator */}
            {!iframeLoaded && (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Chargement de Ground News...
                        </p>
                    </div>
                </div>
            )}

            {/* Iframe Container */}
            <div className={`relative rounded-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
            } ${iframeLoaded ? 'block' : 'hidden'}`}>
                <iframe
                    src={groundNewsUrl}
                    className="w-full h-[calc(100vh-250px)] min-h-[800px] rounded-lg"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                    onLoad={() => setIframeLoaded(true)}
                    title="Ground News"
                />
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-between items-center">
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <LucideIcon name="Info" className="w-4 h-4 inline mr-2" />
                    Ground News analyse les biais médiatiques en temps réel
                </div>
                <a
                    href={groundNewsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                        isDarkMode
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                >
                    <LucideIcon name="ExternalLink" className="w-4 h-4" />
                    Ouvrir dans un nouvel onglet
                </a>
            </div>
        </div>
    );
});

// Set display name for debugging
GroundNewsTab.displayName = 'GroundNewsTab';

export default GroundNewsTab;
