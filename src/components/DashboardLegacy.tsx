import React, { useEffect, useRef } from 'react';

/**
 * COMPOSANT LEGACY WRAPPER
 * =========================
 * Ce composant charge app.jsx (24K lignes) via Babel runtime
 * pendant qu'on migre progressivement vers des modules ES6
 *
 * TODO: Remplacer progressivement par des composants modulaires
 */

declare const Babel: any;

export const DashboardLegacy: React.FC = () => {
    const mountedRef = useRef(false);

    useEffect(() => {
        // Éviter le double-montage
        if (mountedRef.current) return;
        mountedRef.current = true;

        console.log('📦 Chargement du dashboard legacy via Babel...');

        // Le dashboard sera monté par app.jsx via Babel
        // Une fois app.jsx exécuté, il va render dans #root

    }, []);

    return (
        <div id="dashboard-legacy-container">
            {/* app.jsx va se monter ici via Babel */}
        </div>
    );
};

export default DashboardLegacy;
