/**
 * MarketsEconomyTabRGL.js
 * Version React-Grid-Layout du MarketsEconomyTab
 */

(function() {
    'use strict';

    // Note: React hooks imported for future extensibility if needed

    // ===================================
    // COMPOSANT PRINCIPAL - WRAPPER
    // ===================================
    const MarketsEconomyTabRGL = ({ isDarkMode = true, isAdmin = false }) => {
        // We simply render the main MarketsEconomyTab within this RGL container
        // This ensures 100% consistency with the main dashboard.
        
        // Ensure the component exists
        if (!window.MarketsEconomyTab) {
            return (
                <div className="flex items-center justify-center h-full p-4 text-center">
                    <div className="text-red-500">
                        <window.LucideIcon name="AlertTriangle" className="w-8 h-8 mx-auto mb-2" />
                        Composant MarketsEconomyTab introuvable
                    </div>
                </div>
            );
        }

        return (
            <div className="h-full w-full overflow-auto bg-transparent">
                <window.MarketsEconomyTab isDarkMode={isDarkMode} />
            </div>
        );
    };

    window.MarketsEconomyTabRGL = MarketsEconomyTabRGL;
})();
