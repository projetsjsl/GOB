import React, { useEffect } from 'react';
import BetaCombinedDashboard from './components/BetaCombinedDashboard';
import { logger } from '../lib/logger';

// Import utils pour exposition globale
import { IconoirIcon, ProfessionalModeSystem } from './utils/iconMapping';

// Déclarations TypeScript pour bibliothèques CDN
interface ChartLibrary {
  [key: string]: unknown;
}

declare const Chart: ChartLibrary;
declare const Recharts: ChartLibrary;
declare const LightweightCharts: ChartLibrary;

interface WindowWithDashboard extends Window {
  __GOB_DASHBOARD_MOUNTED?: boolean;
  IconoirIcon?: typeof IconoirIcon;
  LucideIcon?: typeof IconoirIcon;
  ProfessionalModeSystem?: typeof ProfessionalModeSystem;
}

const App: React.FC = () => {
    useEffect(() => {
        const win = window as WindowWithDashboard;
        
        // Guard pour éviter le double-montage
        if (win.__GOB_DASHBOARD_MOUNTED) {
            logger.warn('⚠️ Dashboard déjà monté');
            return;
        }
        win.__GOB_DASHBOARD_MOUNTED = true;

        // Exposer les utils globalement pour compatibilité
        win.IconoirIcon = IconoirIcon;
        win.LucideIcon = IconoirIcon; // Backward compatibility
        win.ProfessionalModeSystem = ProfessionalModeSystem;

        logger.info('✅ GOB Dashboard monté (Vite + React + TypeScript)');
    }, []);

    // Rendu direct du dashboard - UI friendly, pas de loader
    return <BetaCombinedDashboard />;
};

export default App;
