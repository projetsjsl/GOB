import React, { useEffect } from 'react';
import BetaCombinedDashboard from './components/BetaCombinedDashboard';

// Import utils pour exposition globale
import { IconoirIcon, ProfessionalModeSystem } from './utils/iconMapping';

// Déclarations TypeScript pour bibliothèques CDN
declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

const App: React.FC = () => {
    useEffect(() => {
        // Guard pour éviter le double-montage
        if ((window as any).__GOB_DASHBOARD_MOUNTED) {
            console.warn('⚠️ Dashboard déjà monté');
            return;
        }
        (window as any).__GOB_DASHBOARD_MOUNTED = true;

        // Exposer les utils globalement pour compatibilité
        (window as any).IconoirIcon = IconoirIcon;
        (window as any).LucideIcon = IconoirIcon; // Backward compatibility
        (window as any).ProfessionalModeSystem = ProfessionalModeSystem;

        console.log('✅ GOB Dashboard monté (Vite + React + TypeScript)');
    }, []);

    // Rendu direct du dashboard - UI friendly, pas de loader
    return <BetaCombinedDashboard />;
};

export default App;
