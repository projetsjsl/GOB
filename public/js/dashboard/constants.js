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
})();
