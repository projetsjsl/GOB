/**
 * TitresTabRGL.js
 * Dashboard "Titres & Portfolio" ultra-flexible avec React-Grid-Layout
 * 
 * Features:
 * - Templates de disposition (Trading, Overview, Data)
 * - Redimensionnement libre
 * - Persistance automatique
 */

(function() {
    'use strict';

    // Note: React hooks imported for future extensibility if needed

    // ===================================
    // COMPOSANT PRINCIPAL - WRAPPER
    // ===================================
    const TitresTabRGL = ({ isDarkMode = true, isAdmin = false }) => {
        // We simply render the main AdvancedAnalysisTab (Titres) within this RGL container
        // This ensures 100% consistency with the main dashboard.
        
        const Component = window.AdvancedAnalysisTab;

        // Ensure the component exists
        if (!Component) {
            return (
                <div className="flex items-center justify-center h-full p-4 text-center">
                    <div className="text-red-500">
                        <window.LucideIcon name="AlertTriangle" className="w-8 h-8 mx-auto mb-2" />
                        Composant AdvancedAnalysisTab introuvable
                    </div>
                </div>
            );
        }

        return (
            <div className="h-full w-full overflow-auto bg-transparent">
                <Component isDarkMode={isDarkMode} />
            </div>
        );
    };

    window.TitresTabRGL = TitresTabRGL;
})();
