# CurveWatch - Plateforme d'Analyse des Courbes de Rendement

Une plateforme professionnelle d'analyse des courbes de rendement obligataires avec données en temps réel du Trésor américain et de la Banque du Canada.

## 🎯 Caractéristiques Principales

- **Visualisation Interactive**: Graphiques Recharts avec zoom, pan et tooltips détaillés
- **Données Temps Réel**: Integration FRED (Federal Reserve) et BOC (Bank of Canada)
- **Analyse Avancée**: Métriques de courbe, PCA, spreads papillon, taux forwards
- **Multi-Pays**: Comparaison simultanée US et Canada
- **Responsive Design**: Optimisé pour mobile, tablette, desktop et grand écran
- **Dark/Light Mode**: Support complet du thème avec transitions fluides
- **Accessibilité**: WCAG 2.1 AA compliant avec support clavier
- **Performance**: Caching intelligent, code-splitting, lazy loading

## 📋 Architecture

```
├── app/
│   ├── page.tsx          # Page principale
│   ├── layout.tsx        # Layout root
│   └── globals.css       # Styles globaux
├── components/
│   ├── curve-watch-compatible.tsx  # Composant JLab principal
│   ├── expandable-card.tsx         # Système d'expansion fullscreen
│   ├── yield-curve-chart.tsx       # Visualisation graphique
│   └── ...                         # Autres composants
├── lib/
│   ├── fred-api.ts       # Integration FRED API
│   ├── canadian-yields.ts # Integration BOC API
│   ├── performance.ts    # Monitoring performance
│   ├── logger.ts         # Logging structured
│   ├── config.ts         # Configuration centralisee
│   └── ...               # Autres utilitaires
└── hooks/
    └── use-yield-data.ts # Hook de gestion de donnees
```

## 🚀 Démarrage Rapide

### Installation

```bash
npm install
# ou
yarn install
```

### Environnement

Créer un fichier `.env.local`:

```env
# Optional: FRED API key from https://fred.stlouisfed.org/docs/api/api_key.html
FRED_API_KEY=your_api_key_here

# Optional: Financial Modeling Prep API key
FMP_API_KEY=your_fmp_key_here
```

### Développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## 📊 Fonctionnalités Détaillées

### Aperçu
- Vue d'ensemble des taux actuels US et CA
- Taux directeur central
- Timestamps de mise à jour
- Bouton de rafraîchissement

### Comparaison Historique
- Sélecteur de dates multiples (jusqu'à 5)
- Graphiques de comparaison temporelle
- Statistiques d'écarts US vs CA
- Contrôles de filtrage avancés

### Analytique
- Taux forwards implicites
- Analyse PCA (Principal Component Analysis)
- Spreads papillon
- Métriques de courbe (pente, convexité)

### Historique
- Tendances de spreads
- Analyse temporelle
- Comparaison dates multiples

## 🔧 Configuration

Tous les paramètres configurables sont dans `lib/config.ts`:

```typescript
import CONFIG from "@/lib/config"

// Accéder aux configurations
console.log(CONFIG.API.TIMEOUT_MS)
console.log(CONFIG.THEME.US_COLOR)
```

## 📈 API Endpoints

- `GET /api/yield-curve/current` - Taux actuels
- `GET /api/yield-curve/historical?period=1m` - Données historiques
- `GET /api/yield-curve/compare?date=2024-01-01` - Comparaison date

## 🎨 Thème et Styling

Le projet utilise Tailwind CSS v4 avec un système de couleurs premium:

- **Bleu**: #3b82f6 (US)
- **Rouge**: #ef4444 (Canada)
- **Emeraude**: #10b981 (Forwards)
- **Ambre**: #f59e0b (Treasury)

## ♿ Accessibilité

- WCAG 2.1 Level AA
- ARIA labels et roles
- Support clavier complet
- Contraste suffisant (4.5:1 minimum)
- Semantic HTML

## 🔍 Performance

- Cache intelligent avec TTL
- Debounce/throttle pour événements
- Code-splitting et lazy loading
- Performance monitoring intégré
- Memoization pour calculs coûteux

## 🔐 Sécurité

- Variables d'environnement protégées
- Validation stricte des données
- Gestion d'erreurs centralisée
- Retry logic avec exponential backoff
- HTTPS recommendé en production

## 📚 Intégration JLab

Pour l'intégration avec JLab dashboard:

```jsx
{activeTab === 'jlab-curvewatch' && window.CurveWatchTab && (
  <window.CurveWatchTab isDarkMode={isDarkMode} />
)}
```

Le composant est exposé globalement via `window.CurveWatchTab`.

## 🧪 Tests

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## 📄 Licence

MIT

## 👥 Support

Pour les problèmes ou suggestions: [support@curvewatch.app](mailto:support@curvewatch.app)

---

**Construit avec ❤️ pour les analystes financiers**
