# 🎯 Plan d'implémentation - Score JSLAI & Calendrier Résultats

## ✅ PHASE 1 : Score JSLAI (EN COURS)

### 1.1 Configuration & États ✅
- [x] Ajout du state `jslaiConfig` avec pondérations par défaut
- [x] Sauvegarde dans localStorage
- [x] 7 composantes avec poids total = 100%

### 1.2 Calcul du Score JSLAI ✅ 
Fonction `calculateJSLAIScore()` créée avec :

**Composantes (pondération par défaut):**
1. **Valuation (20%)** : P/E vs historique, Price/FCF
2. **Profitability (20%)** : Marge nette, ROE, ROA
3. **Growth (15%)** : Croissance revenus 3 ans
4. **Financial Health (20%)** : Bilan (reprise du score existant)
5. **Momentum (10%)** : RSI, moyennes mobiles
6. **Moat (10%)** : Marges stables + ROE élevé + prévisibilité
7. **Sector Position (5%)** : Position dans le secteur (score moyen pour l'instant)

**Output:**
```javascript
{
  total: 87,  // Score global 0-100
  breakdown: {
    valuation: 92,
    profitability: 85,
    growth: 80,
    financialHealth: 90,
    momentum: 75,
    moat: 95,
    sectorPosition: 60
  },
  interpretation: "Excellent", // Excellent, Très Bon, Bon, Moyen, Faible, Mauvais
  recommendation: "Achat Fort" // Achat Fort, Achat, Conserver, Surveiller, Éviter
}
```

### 1.3 Affichage du Score JSLAI ✅
- [x] Badge en haut de IntelliStocks (remplace 3 cols par 4)
- [x] Score avec couleur dynamique
- [x] Interprétation + Recommandation

### 1.4 Interface Admin - Configuration Score JSLAI ⏳
**Localisation**: Onglet "Admin-JSLAI"

**À créer**:
```html
<div className="Configuration Score JSLAI">
  <h3>⚙️ Configuration Score JSLAI™</h3>
  
  <!-- Sliders pour chaque composante -->
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label>Valuation: {jslaiConfig.valuation}%</label>
      <input type="range" min="0" max="40" value={jslaiConfig.valuation} />
    </div>
    <div>
      <label>Profitability: {jslaiConfig.profitability}%</label>
      <input type="range" min="0" max="40" value={jslaiConfig.profitability} />
    </div>
    <!-- ... autres composantes ... -->
  </div>
  
  <!-- Total doit faire 100% -->
  <div className="Total: {sum(jslaiConfig)}%">
    {sum === 100 ? '✅' : '⚠️ Doit faire 100%'}
  </div>
  
  <!-- Presets -->
  <div className="Presets">
    <button onClick={() => applyPreset('value')}>Value Investing</button>
    <button onClick={() => applyPreset('growth')}>Growth Investing</button>
    <button onClick={() => applyPreset('balanced')}>Balanced</button>
    <button onClick={() => applyPreset('dividend')}>Dividend Focus</button>
  </div>
  
  <!-- Reset -->
  <button onClick={resetToDefaults}>🔄 Réinitialiser</button>
</div>
```

### 1.5 Section détaillée du Score JSLAI dans IntelliStocks ⏳
**À ajouter après le badge du score** :

```html
<div className="Score JSLAI Détaillé">
  <h3>🎯 Analyse JSLAI™ - Décomposition du Score</h3>
  
  <div className="grid grid-cols-7 gap-2">
    <!-- Valuation -->
    <div className="card">
      <div className="icon">💰</div>
      <div className="label">Valuation</div>
      <div className="score">{jslaiScore.breakdown.valuation}/100</div>
      <div className="bar"><!-- Progress bar --></div>
      <div className="weight">{jslaiConfig.valuation}% du total</div>
    </div>
    
    <!-- Répéter pour les 7 composantes -->
  </div>
  
  <div className="Interprétation détaillée">
    <h4>{jslaiScore.interpretation}</h4>
    <p>{detailed interpretation based on scores}</p>
    
    <div className="Points forts & Points faibles">
      <div className="Strengths">
        ✅ {composantes avec score > 80}
      </div>
      <div className="Weaknesses">
        ⚠️ {composantes avec score < 50}
      </div>
    </div>
  </div>
</div>
```

### 1.6 Backtesting Module ⏳
**Dans Admin-JSLAI** :

```html
<div className="Backtesting Score JSLAI">
  <h3>📊 Backtesting & Optimisation</h3>
  
  <div className="Configuration">
    <label>Période de test:</label>
    <select>
      <option>1 mois</option>
      <option>3 mois</option>
      <option>6 mois</option>
      <option>1 an</option>
    </select>
    
    <label>Titres à tester:</label>
    <multiselect>AAPL, MSFT, GOOGL, ...</multiselect>
    
    <button>🚀 Lancer le backtest</button>
  </div>
  
  <div className="Résultats">
    <table>
      <thead>
        <tr>
          <th>Titre</th>
          <th>Score JSLAI (début)</th>
          <th>Performance réelle</th>
          <th>Corrélation</th>
          <th>Précision</th>
        </tr>
      </thead>
      <tbody>
        <!-- Résultats du backtest -->
      </tbody>
    </table>
    
    <div className="Recommandations">
      <h4>📈 Meilleurs indicateurs pour cette période:</h4>
      <ul>
        <li>Profitability: 85% de précision</li>
        <li>Momentum: 78% de précision</li>
        <li>Growth: 72% de précision</li>
      </ul>
      
      <button>✨ Appliquer les pondérations optimales</button>
    </div>
  </div>
</div>
```

---

## ✅ PHASE 2 : Calendrier des Résultats (NOUVEAU ONGLET)

### 2.1 Nouvel onglet "📅 Earnings Calendar" ⏳

**Dans la navigation** (ligne ~8738) :
```javascript
const tabs = [
  { id: 'ask-emma', label: '💬 Ask Emma' },
  { id: 'intellistocks', label: '📊 IntelliStocks' },
  { id: 'dans-watchlist', label: '⭐ Dan\'s Watchlist' },
  { id: 'seeking-alpha', label: '🔍 Seeking Alpha' },
  { id: 'earnings-calendar', label: '📅 Calendrier Résultats' }, // NOUVEAU
  { id: 'admin-jsla', label: '⚙️ Admin-JSLAI' }
];
```

### 2.2 API Endpoint pour Earnings ⏳
**Appel FMP API** :
```javascript
const fetchEarningsCalendar = async (symbols) => {
  const dates = [];
  for (const symbol of symbols) {
    const response = await fetch(`/api/fmp?endpoint=calendar-earnings&symbol=${symbol}`);
    const data = await response.json();
    dates.push(...data.data);
  }
  return dates.sort((a, b) => new Date(a.date) - new Date(b.date));
};
```

### 2.3 Composant EarningsCalendar ⏳
```jsx
const EarningsCalendarTab = () => {
  const [earningsData, setEarningsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterSource, setFilterSource] = useState('all'); // 'all', 'watchlist', 'intellistocks'
  
  useEffect(() => {
    const loadEarnings = async () => {
      setLoading(true);
      let symbols = [];
      
      if (filterSource === 'all' || filterSource === 'intellistocks') {
        symbols.push(...['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX', 'AMD', 'INTC']);
      }
      if (filterSource === 'all' || filterSource === 'watchlist') {
        symbols.push(...watchlistTickers);
      }
      
      // Dédupliquer
      symbols = [...new Set(symbols)];
      
      const data = await fetchEarningsCalendar(symbols);
      setEarningsData(data);
      setLoading(false);
    };
    
    loadEarnings();
  }, [filterSource]);
  
  return (
    <div className="earnings-calendar">
      <div className="header">
        <h2>📅 Calendrier des Résultats</h2>
        
        <div className="filters">
          <button 
            onClick={() => setFilterSource('all')}
            className={filterSource === 'all' ? 'active' : ''}
          >
            Tous les titres
          </button>
          <button 
            onClick={() => setFilterSource('intellistocks')}
            className={filterSource === 'intellistocks' ? 'active' : ''}
          >
            IntelliStocks uniquement
          </button>
          <button 
            onClick={() => setFilterSource('watchlist')}
            className={filterSource === 'watchlist' ? 'active' : ''}
          >
            Watchlist uniquement
          </button>
        </div>
      </div>
      
      <div className="calendar-view">
        {/* Vue calendrier ou timeline */}
        <div className="timeline">
          {earningsData.map((earning, i) => (
            <div key={i} className="earning-card">
              <div className="date">
                {new Date(earning.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
              <div className="symbol">{earning.symbol}</div>
              <div className="time">{earning.time || 'Before Market Open'}</div>
              <div className="estimates">
                <div>EPS estimé: ${earning.epsEstimated}</div>
                <div>Revenue estimé: ${earning.revenueEstimated}</div>
              </div>
              
              {/* Si résultat déjà publié */}
              {earning.epsActual && (
                <div className="actuals">
                  <div className={earning.epsActual > earning.epsEstimated ? 'beat' : 'miss'}>
                    EPS réel: ${earning.epsActual}
                    {earning.epsActual > earning.epsEstimated ? ' ✅' : ' ❌'}
                  </div>
                </div>
              )}
              
              <button onClick={() => {
                setActiveTab('intellistocks');
                setSelectedStock(earning.symbol);
              }}>
                Analyser →
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="statistics">
        <h3>📊 Statistiques</h3>
        <div>Total d'annonces à venir: {earningsData.filter(e => !e.epsActual).length}</div>
        <div>Cette semaine: {earningsData.filter(e => isThisWeek(e.date)).length}</div>
        <div>Ce mois: {earningsData.filter(e => isThisMonth(e.date)).length}</div>
      </div>
    </div>
  );
};
```

---

## 📝 TODO LIST

### Priorité Haute (À faire maintenant)
- [ ] Ajouter interface Admin pour config Score JSLAI
- [ ] Créer section détaillée du Score JSLAI dans IntelliStocks
- [ ] Créer nouvel onglet Earnings Calendar
- [ ] API endpoint pour earnings dates (FMP)
- [ ] Composant EarningsCalendarTab complet

### Priorité Moyenne
- [ ] Module de backtesting du Score JSLAI
- [ ] Presets pour le Score JSLAI (Value, Growth, etc.)
- [ ] Notifications pour earnings proches

### Priorité Basse
- [ ] Export des résultats de backtest
- [ ] Historique des configurations Score JSLAI
- [ ] Comparaison des performances par preset

---

## 🎨 Design Notes

### Couleurs du Score JSLAI
- 85-100: Emerald (Excellent)
- 75-84: Blue (Très Bon)
- 65-74: Yellow (Bon)
- 50-64: Orange (Moyen)
- 35-49: Red/Orange (Faible)
- 0-34: Red (Mauvais)

### Icônes des composantes
- 💰 Valuation
- 💎 Profitability
- 🚀 Growth
- 🏦 Financial Health
- 📈 Momentum
- 🏰 Moat
- 🎯 Sector Position

---

## 📊 Données nécessaires

### Pour le Score JSLAI
- ✅ Income statements (5 ans)
- ✅ Balance sheets (5 ans)
- ✅ Cash flows (5 ans)
- ✅ Historical prices (5 ans)
- ✅ RSI data
- ✅ P/E historique
- ✅ Price/FCF historique

### Pour Earnings Calendar
- ⏳ API FMP: `/api/fmp?endpoint=calendar-earnings`
- ⏳ Format: `{ symbol, date, time, epsEstimated, revenueEstimated, epsActual, revenueActual }`

---

**État actuel**: Phase 1 (Score JSLAI) à 60% terminée
**Prochaine étape**: Créer l'interface Admin et le composant Earnings Calendar
