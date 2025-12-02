// Shared constants for dashboard (exposed globally for Babel standalone)
(function() {
    const companyNames = {
        AAPL: 'Apple Inc.',
        TSLA: 'Tesla Inc.',
        GOOGL: 'Alphabet Inc.',
        GOOG: 'Alphabet Inc.',
        MSFT: 'Microsoft Corporation',
        NVDA: 'NVIDIA Corporation',
        AMZN: 'Amazon.com Inc.',
        META: 'Meta Platforms Inc.',
        NFLX: 'Netflix Inc.',
        AMD: 'Advanced Micro Devices Inc.',
        INTC: 'Intel Corporation',
        CRM: 'Salesforce Inc.',
        ORCL: 'Oracle Corporation',
        CSCO: 'Cisco Systems Inc.',
        ADBE: 'Adobe Inc.',
        PYPL: 'PayPal Holdings Inc.',
        DIS: 'The Walt Disney Company',
        BA: 'The Boeing Company',
        GE: 'General Electric Company',
        JPM: 'JPMorgan Chase & Co.',
        BAC: 'Bank of America Corporation',
        WMT: 'Walmart Inc.',
        HD: 'The Home Depot Inc.',
        PG: 'Procter & Gamble Company',
        JNJ: 'Johnson & Johnson',
        V: 'Visa Inc.',
        MA: 'Mastercard Incorporated',
        UNH: 'UnitedHealth Group Inc.',
        PFE: 'Pfizer Inc.',
        MRK: 'Merck & Co. Inc.'
    };

    window.DASHBOARD_CONSTANTS = window.DASHBOARD_CONSTANTS || {};
    window.DASHBOARD_CONSTANTS.companyNames = companyNames;

    // Suggestions rapides pour AskEmma
    window.DASHBOARD_CONSTANTS.askEmmaSuggestions = [
        "Analyse complète de Microsoft",
        "Comparer Tesla vs Nvidia",
        "Résultats récents d'Apple",
        "Actualités IA récentes",
        "Vue globale des marchés",
        "Valorisation Amazon (DCF)",
        "Explique-moi le Score JSLAI™",
        "Analyse des dividendes BCE",
        "Comment utiliser l'onglet JLab ?"
    ];

    // Professional Color Palette (Emma IA Style)
    window.DASHBOARD_CONSTANTS.professionalColors = {
        // Neutrals - Dark theme base
        background: {
            primary: '#0f172a',      // slate-950
            secondary: '#1e293b',    // slate-900
            tertiary: '#334155',     // slate-700
        },
        
        // Accent colors - Financial context
        accent: {
            bullish: '#10b981',      // green-500 (subtle, not bright)
            bearish: '#ef4444',      // red-500
            neutral: '#3b82f6',      // blue-500
            warning: '#f59e0b',      // amber-500
        },
        
        // Glass effects
        glass: {
            light: 'rgba(255, 255, 255, 0.05)',
            border: 'rgba(255, 255, 255, 0.1)',
        },
        
        // Typography
        text: {
            primary: '#f8fafc',      // slate-50
            secondary: '#cbd5e1',    // slate-300
            muted: '#64748b',        // slate-500
        }
    };

    // Professional icon paths (replacing emojis)
    window.DASHBOARD_CONSTANTS.professionalIcons = {
        bull: '/images/icons/bull-pro.svg',
        bear: '/images/icons/bear-pro.svg',
        chart: '/images/icons/chart-pro.svg',
        news: '/images/icons/news-pro.svg',
        analytics: '/images/icons/analytics-pro.svg',
    };

})();
