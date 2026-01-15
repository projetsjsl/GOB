# CurveWatch - Plateforme d'Analyse des Courbes de Rendement

Une plateforme professionnelle d'analyse des courbes de rendement obligataires avec donnees en temps reel du Tresor americain et de la Banque du Canada.

##  Caracteristiques Principales

- **Visualisation Interactive**: Graphiques Recharts avec zoom, pan et tooltips detailles
- **Donnees Temps Reel**: Integration FRED (Federal Reserve) et BOC (Bank of Canada)
- **Analyse Avancee**: Metriques de courbe, PCA, spreads papillon, taux forwards
- **Multi-Pays**: Comparaison simultanee US et Canada
- **Responsive Design**: Optimise pour mobile, tablette, desktop et grand ecran
- **Dark/Light Mode**: Support complet du theme avec transitions fluides
- **Accessibilite**: WCAG 2.1 AA compliant avec support clavier
- **Performance**: Caching intelligent, code-splitting, lazy loading

##  Architecture

```
 app/
    page.tsx          # Page principale
    layout.tsx        # Layout root
    globals.css       # Styles globaux
 components/
    curve-watch-compatible.tsx  # Composant JLab principal
    expandable-card.tsx         # Systeme d'expansion fullscreen
    yield-curve-chart.tsx       # Visualisation graphique
    ...                         # Autres composants
 lib/
    fred-api.ts       # Integration FRED API
    canadian-yields.ts # Integration BOC API
    performance.ts    # Monitoring performance
    logger.ts         # Logging structured
    config.ts         # Configuration centralisee
    ...               # Autres utilitaires
 hooks/
     use-yield-data.ts # Hook de gestion de donnees
```

##  Demarrage Rapide

### Installation

```bash
npm install
# ou
yarn install
```

### Environnement

Creer un fichier `.env.local`:

```env
# Optional: FRED API key from https://fred.stlouisfed.org/docs/api/api_key.html
FRED_API_KEY=your_api_key_here

# Optional: Financial Modeling Prep API key
FMP_API_KEY=your_fmp_key_here
```

### Developpement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

##  Fonctionnalites Detaillees

### Apercu
- Vue d'ensemble des taux actuels US et CA
- Taux directeur central
- Timestamps de mise a jour
- Bouton de rafraichissement

### Comparaison Historique
- Selecteur de dates multiples (jusqu'a 5)
- Graphiques de comparaison temporelle
- Statistiques d'ecarts US vs CA
- Controles de filtrage avances

### Analytique
- Taux forwards implicites
- Analyse PCA (Principal Component Analysis)
- Spreads papillon
- Metriques de courbe (pente, convexite)

### Historique
- Tendances de spreads
- Analyse temporelle
- Comparaison dates multiples

##  Configuration

Tous les parametres configurables sont dans `lib/config.ts`:

```typescript
import CONFIG from "@/lib/config"

// Acceder aux configurations
console.log(CONFIG.API.TIMEOUT_MS)
console.log(CONFIG.THEME.US_COLOR)
```

##  API Endpoints

- `GET /api/yield-curve/current` - Taux actuels
- `GET /api/yield-curve/historical?period=1m` - Donnees historiques
- `GET /api/yield-curve/compare?date=2024-01-01` - Comparaison date

##  Theme et Styling

Le projet utilise Tailwind CSS v4 avec un systeme de couleurs premium:

- **Bleu**: #3b82f6 (US)
- **Rouge**: #ef4444 (Canada)
- **Emeraude**: #10b981 (Forwards)
- **Ambre**: #f59e0b (Treasury)

##  Accessibilite

- WCAG 2.1 Level AA
- ARIA labels et roles
- Support clavier complet
- Contraste suffisant (4.5:1 minimum)
- Semantic HTML

##  Performance

- Cache intelligent avec TTL
- Debounce/throttle pour evenements
- Code-splitting et lazy loading
- Performance monitoring integre
- Memoization pour calculs couteux

##  Securite

- Variables d'environnement protegees
- Validation stricte des donnees
- Gestion d'erreurs centralisee
- Retry logic avec exponential backoff
- HTTPS recommende en production

##  Integration JLab

Pour l'integration avec JLab dashboard:

```jsx
{activeTab === 'jlab-curvewatch' && window.CurveWatchTab && (
  <window.CurveWatchTab isDarkMode={isDarkMode} />
)}
```

Le composant est expose globalement via `window.CurveWatchTab`.

##  Tests

```bash
npm run test
npm run test:watch
npm run test:coverage
```

##  Licence

MIT

##  Support

Pour les problemes ou suggestions: [support@curvewatch.app](mailto:support@curvewatch.app)

---

**Construit avec  pour les analystes financiers**
