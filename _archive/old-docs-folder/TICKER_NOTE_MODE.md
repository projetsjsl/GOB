# Mode TICKER_NOTE - Notes Professionnelles par Ticker

## 📋 Vue d'ensemble

Le mode `ticker_note` est un nouveau mode d'Emma Agent conçu pour générer des **notes professionnelles complètes** pour un ticker boursier spécifique. Ce mode est optimisé pour produire des analyses détaillées prêtes à l'export email, incluant graphiques, tableaux, cartes boursières et sources.

## 🎯 Cas d'usage

- Générer des rapports d'analyse professionnels pour des clients
- Créer des notes détaillées suite à des résultats trimestriels
- Produire des synthèses complètes pour des présentations
- Rédiger des analyses fondamentales avec comparaisons vs. consensus

## 🚀 Utilisation

### API Request

```javascript
// Endpoint: POST /api/emma-agent

const response = await fetch('/api/emma-agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Génère une note professionnelle complète pour AAPL",
    context: {
      output_mode: 'ticker_note',  // 🔑 Mode spécifique pour notes professionnelles
      ticker: 'AAPL',               // Ticker principal à analyser
      tickers: ['AAPL']             // Alternative: liste de tickers
    }
  })
});

const data = await response.json();
console.log(data.response); // Note professionnelle complète en Markdown
```

### Frontend Integration

```javascript
// Dans votre interface utilisateur
async function generateTickerNote(ticker) {
  try {
    const result = await fetch('/api/emma-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Génère une note professionnelle complète pour ${ticker}`,
        context: {
          output_mode: 'ticker_note',
          ticker: ticker
        }
      })
    });

    const data = await result.json();

    if (data.success) {
      // Afficher la note dans l'UI
      displayTickerNote(data.response);

      // Métadonnées disponibles
      console.log('Modèle utilisé:', data.model); // 'perplexity'
      console.log('Outils utilisés:', data.tools_used); // ['fmp-quote', 'fmp-fundamentals', ...]
      console.log('Confiance:', data.confidence); // 0.95
      console.log('Sources disponibles:', data.has_sources); // true
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Appel
generateTickerNote('AAPL');
```

## 📊 Structure de la note générée

La note professionnelle générée suit cette structure standardisée:

```markdown
## [AAPL] - Analyse Professionnelle
Date: vendredi 31 octobre 2025

### 📈 Synthèse Exécutive
- Point clé 1 sur la performance récente
- Point clé 2 sur les fondamentaux
- Point clé 3 sur les actualités/catalyseurs

### 📊 Comparaison avec Consensus Analystes
- Résultat net: [valeur] vs. [consensus] → Écart: [±X%]
- BPA: [valeur] vs. [consensus] → Écart: [±X%]
- Chiffre d'affaires: [valeur] vs. [consensus] → Écart: [±X%]

### 📋 Tableau Récapitulatif
[TABLE:RESULTATS_VS_CONSENSUS|Métrique,Résultat Actuel,Consensus,Écart,Source|...]

### 💼 Carte Boursière
[STOCKCARD:AAPL]

### 📈 Ratios Historiques (5 ans)
[RATIO_CHART:AAPL:PE]
[RATIO_CHART:AAPL:PROFIT_MARGIN]
[RATIO_CHART:AAPL:ROE]

### 📊 Graphique Technique
[CHART:FINVIZ:AAPL]

### 📰 Actualités Récentes
1. [Titre] - [Date] ([SOURCE:Bloomberg|URL])
2. [Titre] - [Date] ([SOURCE:Reuters|URL])

### 🔖 Signature et Sources
---
**📊 Analyse générée par Emma IA™**
Propulsée par JSL AI 🌱

**Sources consultées:**
- Données de marché: [FMP, Polygon]
- Actualités: [Bloomberg, Reuters]
- Date: [Date actuelle]
```

## 🎨 Tags multimédias supportés

Le mode `ticker_note` génère automatiquement ces tags pour l'affichage visuel:

| Tag | Description | Exemple |
|-----|-------------|---------|
| `[STOCKCARD:TICKER]` | Carte boursière complète (prix, métriques, mini-chart) | `[STOCKCARD:AAPL]` |
| `[RATIO_CHART:TICKER:METRIC]` | Graphique d'évolution historique (5 ans) d'un ratio | `[RATIO_CHART:AAPL:PE]` |
| `[CHART:FINVIZ:TICKER]` | Graphique technique Finviz | `[CHART:FINVIZ:AAPL]` |
| `[CHART:TRADINGVIEW:EXCHANGE:TICKER]` | Widget TradingView interactif | `[CHART:TRADINGVIEW:NASDAQ:AAPL]` |
| `[TABLE:NOM\|Cols\|Rows]` | Tableau structuré | `[TABLE:PERF\|Col1,Col2\|Val1,Val2]` |
| `[LOGO:TICKER]` | Logo de l'entreprise | `[LOGO:AAPL]` |
| `[SOURCE:NOM\|URL]` | Citation de source | `[SOURCE:Bloomberg\|https://...]` |

### Ratios disponibles pour RATIO_CHART

- `PE` - Price-to-Earnings Ratio
- `PB` - Price-to-Book Ratio
- `PS` - Price-to-Sales Ratio
- `PROFIT_MARGIN` - Marge bénéficiaire
- `ROE` - Return on Equity
- `ROA` - Return on Assets
- `DEBT_EQUITY` - Ratio dette/équité
- `CURRENT_RATIO` - Ratio de liquidité
- `REVENUE_GROWTH` - Croissance du chiffre d'affaires
- `EARNINGS_GROWTH` - Croissance des bénéfices

## 🔧 Configuration technique

### Modèle AI utilisé

- **Modèle:** Perplexity Sonar Pro
- **Raison:** Accès en temps réel aux données financières avec sources citées
- **Recency filter:** `day` (données du jour)
- **Max tokens:** 6000 (note détaillée complète)

### Outils appelés automatiquement

Le mode `ticker_note` appelle automatiquement ces outils (via le système de scoring):

1. `fmp-quote` - Prix et métriques en temps réel
2. `fmp-fundamentals` - Données fondamentales
3. `fmp-ratios` - Ratios financiers
4. `fmp-key-metrics` - Métriques clés
5. `fmp-ratings` - Ratings et recommandations
6. `fmp-ticker-news` - Actualités du ticker
7. `analyst-recommendations` - Consensus des analystes

### Validation des données

- ✅ **Fresh Data Guard:** Validation automatique de la présence de sources
- ✅ **Confidence score:** Score de confiance basé sur la qualité des sources
- ✅ **Source types:** Comptage des types de sources (URLs, médias, données marché)

## 📧 Export email-ready

Le format Markdown généré est compatible email:

```javascript
// Conversion automatique des tags en HTML
function renderTickerNote(markdownNote) {
  // Les tags [STOCKCARD:...], [CHART:...], [TABLE:...] sont automatiquement
  // convertis en composants HTML/visuels par le frontend

  return processMarkdownWithTags(markdownNote);
}
```

## 🔒 Règles de sécurité

Le mode `ticker_note` applique ces règles strictes:

### ✅ OBLIGATIONS
1. Utiliser UNIQUEMENT des données réelles récentes
2. Comparer TOUS les chiffres-clés avec le consensus analystes
3. Indiquer EXPLICITEMENT les sources pour chaque donnée
4. Inclure AU MINIMUM 2 graphiques
5. Format email-ready (Markdown propre)
6. Montants en format professionnel (ex: 2,45M$, 1,23B$)

### ❌ INTERDICTIONS
1. JAMAIS de données simulées ou inventées
2. JAMAIS de "données non disponibles" sans vérification
3. JAMAIS omettre les sources
4. JAMAIS de données anciennes (> 1 mois) sans mentionner leur date
5. JAMAIS de format incompatible email (JS externe, CSS inline complexe)

## 🧪 Exemple complet

```javascript
// Exemple: Générer une note professionnelle pour Microsoft

const response = await fetch('/api/emma-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Génère une note professionnelle complète pour Microsoft suite aux derniers résultats trimestriels",
    context: {
      output_mode: 'ticker_note',
      ticker: 'MSFT',
      briefing_type: 'earnings', // Optionnel: type de note
      importance_level: 8         // Optionnel: niveau d'importance (1-10)
    }
  })
});

const data = await response.json();

// Réponse structurée
{
  "success": true,
  "response": "## [MSFT] - Analyse Professionnelle\n\n...",
  "model": "perplexity",
  "model_reason": "Professional ticker note requires real-time data and sources",
  "tools_used": ["fmp-quote", "fmp-fundamentals", "fmp-ticker-news"],
  "confidence": 0.92,
  "has_sources": true,
  "source_types": 5,
  "execution_time_ms": 3240,
  "is_reliable": true
}
```

## 🎯 Bonnes pratiques

### 1. Toujours spécifier le ticker
```javascript
// ✅ BON
context: {
  output_mode: 'ticker_note',
  ticker: 'AAPL'
}

// ❌ MAUVAIS (ticker sera extrait du message, moins fiable)
context: {
  output_mode: 'ticker_note'
}
```

### 2. Contexte additionnel pour affiner
```javascript
context: {
  output_mode: 'ticker_note',
  ticker: 'TSLA',
  briefing_type: 'earnings',      // Type de rapport
  focus: 'fundamentals',          // Focus spécifique
  comparison_tickers: ['GM', 'F'] // Comparaisons optionnelles
}
```

### 3. Gérer les erreurs
```javascript
const data = await response.json();

if (!data.success) {
  console.error('Erreur:', data.error);
  // Gérer l'erreur (ticker invalide, API down, etc.)
}

if (data.confidence < 0.7) {
  console.warn('Confiance faible, données potentiellement incomplètes');
}

if (!data.has_sources) {
  console.warn('Aucune source citée, données potentiellement non vérifiables');
}
```

## 🔗 Intégrations

### Avec les briefings automatisés

```javascript
// Dans /api/briefing-cron.js
const tickerNotes = await Promise.all(
  tickers.map(ticker =>
    generateTickerNote(ticker, { output_mode: 'ticker_note' })
  )
);
```

### Avec la watchlist

```javascript
// Générer des notes pour tous les tickers de la watchlist
const watchlist = await getWatchlist();
const notes = await Promise.all(
  watchlist.map(item =>
    generateTickerNote(item.ticker, { output_mode: 'ticker_note' })
  )
);
```

## 📊 Métriques de performance

- **Temps d'exécution moyen:** 3-5 secondes
- **Longueur typique:** 1500-2500 mots
- **Nombre de graphiques:** 3-5 minimum
- **Nombre de sources:** 5-10 minimum
- **Confiance moyenne:** 0.85-0.95

## 🆘 Troubleshooting

### Problème: Note incomplète
```javascript
// Vérifier les outils utilisés
console.log(data.tools_used); // Devrait inclure fmp-quote, fmp-fundamentals, etc.

// Vérifier les outils qui ont échoué
console.log(data.failed_tools); // ['fmp-ratios', ...]
console.log(data.unavailable_sources); // Sources indisponibles
```

### Problème: Pas de sources
```javascript
// Vérifier le score de confiance et la validation
console.log(data.has_sources);     // false = problème
console.log(data.source_types);    // 0 = aucune source détectée
console.log(data.confidence);      // < 0.5 = faible confiance
```

### Problème: Données anciennes
```javascript
// Emma indique automatiquement si les données sont anciennes
// Vérifier le message dans data.response pour les avertissements de date
```

## 📚 Références

- **Documentation Emma Agent:** `/docs/api/EMMA_AGENT.md`
- **Configuration des outils:** `/config/tools_config.json`
- **Architecture système:** `/docs/technical/COMPLETE_IMPLEMENTATION_PLAN.md`
- **Tags multimédias:** `/docs/MULTIMEDIA_TAGS.md`

---

**Dernière mise à jour:** 31 octobre 2025
**Version:** 1.0.0
**Auteur:** JSL AI Team
