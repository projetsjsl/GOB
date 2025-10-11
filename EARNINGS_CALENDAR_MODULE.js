// ==========================================
// MODULE CALENDRIER DES RÉSULTATS
// Nouvel onglet complet à intégrer
// ==========================================

/**
 * ÉTAPE 1: Ajouter le nouvel onglet dans la liste des tabs
 * Dans BetaCombinedDashboard, modifier le array tabs
 */
const ADD_TAB = `
// Ajouter dans le array tabs (après seeking-alpha, avant admin-jsla):
{ id: 'earnings-calendar', label: '📅 Calendrier Résultats', icon: 'Calendar' },
`;

/**
 * ÉTAPE 2: Ajouter le composant dans le switch des onglets
 */
const ADD_COMPONENT_SWITCH = `
// Ajouter dans le return principal:
{activeTab === 'earnings-calendar' && <EarningsCalendarTab />}
`;

/**
 * ÉTAPE 3: Créer le composant EarningsCalendarTab
 * À placer après SeekingAlphaTab et avant AdminJSLATab
 */
const EARNINGS_CALENDAR_COMPONENT = `
// ============================================
// COMPOSANT CALENDRIER DES RÉSULTATS
// ============================================
const EarningsCalendarTab = () => {
    const [earningsData, setEarningsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterSource, setFilterSource] = useState('all'); // 'all', 'jstocks', 'watchlist'
    const [sortBy, setSortBy] = useState('date'); // 'date', 'symbol', 'beat'
    
    // Liste des symboles JStocks
    const jstocksSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX', 'AMD', 'INTC'];
    
    // Fonction pour récupérer le calendrier des earnings
    const fetchEarningsCalendar = async () => {
        setLoading(true);
        try {
            let symbols = [];
            
            // Déterminer quels symboles charger
            if (filterSource === 'all' || filterSource === 'jstocks') {
                symbols.push(...jstocksSymbols);
            }
            if (filterSource === 'all' || filterSource === 'watchlist') {
                symbols.push(...watchlistTickers);
            }
            
            // Dédupliquer
            symbols = [...new Set(symbols)];
            
            console.log(\`📅 Chargement du calendrier earnings pour \${symbols.length} titres...\`);
            
            // Appeler l'API FMP pour chaque symbole
            const promises = symbols.map(async (symbol) => {
                try {
                    const response = await fetch(\`/api/fmp?endpoint=calendar-earnings&symbol=\${symbol}\`);
                    if (!response.ok) throw new Error(\`Erreur \${response.status}\`);
                    const data = await response.json();
                    return data.data || [];
                } catch (error) {
                    console.error(\`Erreur pour \${symbol}:\`, error);
                    return [];
                }
            });
            
            const results = await Promise.all(promises);
            const allEarnings = results.flat();
            
            // Trier par date
            allEarnings.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            setEarningsData(allEarnings);
            console.log(\`✅ \${allEarnings.length} événements earnings chargés\`);
            
        } catch (error) {
            console.error('❌ Erreur chargement calendrier earnings:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Charger au montage et quand le filtre change
    useEffect(() => {
        fetchEarningsCalendar();
    }, [filterSource]);
    
    // Fonctions utilitaires
    const isThisWeek = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return date >= weekStart && date < weekEnd;
    };
    
    const isThisMonth = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };
    
    const isPast = (dateString) => {
        return new Date(dateString) < new Date();
    };
    
    // Statistiques
    const stats = {
        total: earningsData.length,
        thisWeek: earningsData.filter(e => isThisWeek(e.date)).length,
        thisMonth: earningsData.filter(e => isThisMonth(e.date)).length,
        upcoming: earningsData.filter(e => !isPast(e.date)).length,
        past: earningsData.filter(e => isPast(e.date) && e.epsActual).length
    };
    
    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* En-tête */}
            <div className="mb-6">
                <h2 className={\`text-3xl font-bold mb-2 flex items-center gap-3 \${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }\`}>
                    <span className="text-4xl">📅</span>
                    Calendrier des Résultats
                </h2>
                <p className={\`text-sm \${isDarkMode ? 'text-gray-300' : 'text-gray-600'}\`}>
                    Suivez les dates de publication des résultats trimestriels et les estimations des analystes
                </p>
            </div>
            
            {/* Statistiques */}
            <div className="grid grid-cols-5 gap-4 mb-6">
                {[
                    { label: 'Total événements', value: stats.total, icon: '📊', color: 'blue' },
                    { label: 'Cette semaine', value: stats.thisWeek, icon: '📆', color: 'purple' },
                    { label: 'Ce mois', value: stats.thisMonth, icon: '🗓️', color: 'indigo' },
                    { label: 'À venir', value: stats.upcoming, icon: '⏰', color: 'green' },
                    { label: 'Résultats publiés', value: stats.past, icon: '✅', color: 'gray' }
                ].map((stat, i) => (
                    <div 
                        key={i}
                        className={\`p-4 rounded-lg border transition-colors \${
                            isDarkMode ? \`bg-\${stat.color}-900/20 border-\${stat.color}-800\` : \`bg-\${stat.color}-50 border-\${stat.color}-200\`
                        }\`}
                    >
                        <div className="text-2xl mb-1">{stat.icon}</div>
                        <div className={\`text-2xl font-bold \${isDarkMode ? 'text-white' : 'text-gray-900'}\`}>
                            {stat.value}
                        </div>
                        <div className={\`text-xs \${isDarkMode ? 'text-gray-400' : 'text-gray-600'}\`}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Filtres */}
            <div className={\`mb-6 p-4 rounded-lg border flex items-center justify-between \${
                isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
            }\`}>
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-sm">Filtrer par:</span>
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: 'Tous les titres', icon: '🌐' },
                            { id: 'jstocks', label: 'JStocks™ uniquement', icon: '📈' },
                            { id: 'watchlist', label: 'Watchlist uniquement', icon: '⭐' }
                        ].map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setFilterSource(filter.id)}
                                className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-all \${
                                    filterSource === filter.id
                                        ? 'bg-blue-600 text-white'
                                        : (isDarkMode ? 'bg-neutral-800 text-gray-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                                }\`}
                            >
                                {filter.icon} {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
                
                <button
                    onClick={fetchEarningsCalendar}
                    disabled={loading}
                    className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-colors \${
                        loading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }\`}
                >
                    {loading ? '⏳ Chargement...' : '🔄 Actualiser'}
                </button>
            </div>
            
            {/* Timeline des événements */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-bounce">📅</div>
                    <div className={\`text-lg font-semibold \${isDarkMode ? 'text-white' : 'text-gray-900'}\`}>
                        Chargement du calendrier...
                    </div>
                </div>
            ) : earningsData.length === 0 ? (
                <div className={\`text-center py-12 rounded-lg border \${
                    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-50 border-gray-200'
                }\`}>
                    <div className="text-6xl mb-4">📭</div>
                    <div className={\`text-lg font-semibold mb-2 \${isDarkMode ? 'text-white' : 'text-gray-900'}\`}>
                        Aucun événement trouvé
                    </div>
                    <p className={\`text-sm \${isDarkMode ? 'text-gray-400' : 'text-gray-600'}\`}>
                        Aucune publication de résultats prévue pour les titres sélectionnés
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {earningsData.map((earning, i) => {
                        const past = isPast(earning.date);
                        const beat = earning.epsActual && earning.epsEstimated && earning.epsActual > earning.epsEstimated;
                        const miss = earning.epsActual && earning.epsEstimated && earning.epsActual < earning.epsEstimated;
                        
                        return (
                            <div
                                key={i}
                                className={\`p-4 rounded-lg border transition-all hover:shadow-lg \${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-800 hover:border-blue-600' : 'bg-white border-gray-200 hover:border-blue-400'
                                }\`}
                            >
                                <div className="flex items-center justify-between">
                                    {/* Gauche: Date et symbole */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className={\`text-2xl font-bold \${isDarkMode ? 'text-white' : 'text-gray-900'}\`}>
                                                {new Date(earning.date).getDate()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(earning.date).toLocaleDateString('fr-FR', { month: 'short' })}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={\`text-xl font-bold \${isDarkMode ? 'text-white' : 'text-gray-900'}\`}>
                                                    {earning.symbol}
                                                </span>
                                                {past && earning.epsActual && (
                                                    <span className={\`px-2 py-0.5 rounded text-xs font-bold \${
                                                        beat ? 'bg-green-600 text-white' : miss ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                                                    }\`}>
                                                        {beat ? '✅ Beat' : miss ? '❌ Miss' : '➖ Inline'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {earning.time === 'bmo' ? '📅 Before Market Open' : 
                                                 earning.time === 'amc' ? '🌙 After Market Close' : 
                                                 '📅 Pendant la séance'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Droite: Estimations et résultats */}
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">EPS Estimé</div>
                                            <div className={\`text-lg font-bold \${isDarkMode ? 'text-white' : 'text-gray-900'}\`}>
                                                ${earning.epsEstimated?.toFixed(2) || 'N/A'}
                                            </div>
                                        </div>
                                        
                                        {earning.epsActual && (
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">EPS Réel</div>
                                                <div className={\`text-lg font-bold \${
                                                    beat ? 'text-green-600' : miss ? 'text-red-600' : 'text-gray-600'
                                                }\`}>
                                                    ${earning.epsActual?.toFixed(2)}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <button
                                            onClick={() => {
                                                setActiveTab('intellistocks');
                                                setSelectedStock(earning.symbol);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                                        >
                                            📊 Analyser
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
`;

console.log('📅 Module Calendrier des Résultats créé');
console.log('📊 Fonctionnalités: Timeline + Filtres + Stats + API FMP');
