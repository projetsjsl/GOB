# 📊 Finviz "Why Is It Moving?" - Documentation

## Vue d'ensemble

La fonctionnalité "Why Is It Moving?" de Finviz fournit des explications AI-driven instantanées pour les mouvements de prix des actions en analysant les news, réseaux sociaux, dépôts SEC, et discussions de forums.

## 🎯 Fonctionnalité

Cette fonctionnalité va **au-delà des news traditionnelles** pour donner aux traders des insights rapides et cachés sur le sentiment du marché et les catalyseurs pour les actions de grande ou petite capitalisation.

### Caractéristiques

- ✅ **Analyse AI-driven** : Explications automatiques des mouvements de prix
- ✅ **Sources multiples** : News, réseaux sociaux, SEC filings, forums
- ✅ **Insights cachés** : Détecte les actions qui "passent sous le radar médiatique"
- ✅ **Rapidité** : Comprendre les mouvements de marché en secondes
- ✅ **Catalyseurs identifiés** : Earnings, événements économiques, sentiment émergent

## 🔗 Endpoint API

### `/api/finviz-why-moving`

**Méthode**: `GET`

**Paramètres**:

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `ticker` | string | ✅ | Symbole boursier (ex: AAPL, MSFT) |

**Exemple**:

```bash
GET /api/finviz-why-moving?ticker=AAPL
```

**Réponse**:

```json
{
  "success": true,
  "ticker": "AAPL",
  "explanation": "Apple Reports Record Q4 Earnings, Beats Expectations",
  "explanation_enriched": "Apple a publié des résultats record pour le Q4, dépassant les attentes des analystes avec une croissance des revenus de 8%...",
  "date": "Jan 15, 10:30AM",
  "source": "Finviz AI",
  "type": "earnings",
  "timestamp": "2025-01-16T12:00:00.000Z"
}
```

## 📊 Types d'Explications

Le système identifie automatiquement le type d'explication:

- **`earnings`** : Résultats trimestriels, earnings reports
- **`guidance`** : Guidances, prévisions, outlook
- **`filing`** : Dépôts SEC, formulaires réglementaires
- **`analyst`** : Upgrades, downgrades, changements de ratings
- **`m&a`** : Acquisitions, fusions, deals
- **`news`** : Annonces générales, communiqués
- **`product`** : Lancements produits, releases
- **`regulatory`** : Approbations FDA, réglementaires
- **`general`** : Autres explications

## 🔧 Intégration dans le Dashboard

### Dans `beta-combined-dashboard.html`

La fonctionnalité est intégrée dans:

1. **`fetchLatestNewsForTickers()`** - Récupère les explications pour chaque ticker
2. **`extractMoveReason()`** - Utilise les explications en priorité pour afficher les raisons de mouvement
3. **Affichage dans les Top Movers** - Badge "AI" pour indiquer les explications Finviz

### Dans `financial-dashboard.html`

La fonctionnalité est intégrée dans:

1. **`fetchWhyMovingForTickers()`** - Récupère les explications pour tous les tickers
2. **Affichage dans les cartes de stocks** - Section dédiée "Pourquoi ça bouge?" avec badge AI

## 🎨 Affichage UI

### Badge AI

Les explications provenant de Finviz AI sont identifiées par un badge bleu "AI":

```
[AI] Apple Reports Record Q4 Earnings, Beats Expectations
```

### Format d'affichage

Dans les cartes de stocks (`financial-dashboard.html`):
- Section dédiée avec titre "Pourquoi ça bouge?"
- Explication enrichie par AI (si disponible)
- Date et source affichées
- Badge "AI" pour identification

Dans les Top Movers (`beta-combined-dashboard.html`):
- Explication affichée sous le ticker
- Badge "AI" si source = "Finviz AI"
- Format compact pour liste

## 🔄 Flux de Données

```
1. Dashboard charge les tickers
2. Pour chaque ticker:
   a. Appel à /api/finviz-why-moving?ticker={SYMBOL}
   b. Extraction de l'explication depuis Finviz
   c. Enrichissement optionnel avec Emma AI
   d. Stockage dans tickerMoveReasons[ticker]
3. Affichage dans l'UI avec badge AI
```

## 🚀 Enrichissement AI (Optionnel)

Si `GEMINI_API_KEY` est configuré, l'explication peut être enrichie via Emma AI pour:
- Contextualiser l'explication
- Ajouter des détails pertinents
- Améliorer la compréhension

L'explication enrichie est stockée dans `explanation_enriched` et utilisée en priorité dans l'affichage.

## 📝 Notes Techniques

### Extraction depuis Finviz

Le scraper cherche l'explication dans:
1. Section News principale (table ou div avec class "news")
2. Format avec date/heure: "Jan 15, 10:30AM - Explanation"
3. Premier lien de news avec texte explicatif
4. Fallback: première news disponible

### Patterns de Recherche

- `<div class="news-link-left">` avec date et lien
- Format date: "Jan 15" ou "Jan 15, 10:30AM"
- Extraction du texte du lien comme explication

### Gestion d'Erreurs

- Si Finviz retourne une erreur → Fallback vers Finnhub news
- Si aucune explication trouvée → Utilise la première news disponible
- Si toutes les sources échouent → Aucune explication affichée

## 🎯 Utilisation

### Pour les Développeurs

```javascript
// Récupérer l'explication pour un ticker
const response = await fetch('/api/finviz-why-moving?ticker=AAPL');
const data = await response.json();

if (data.success && data.explanation) {
    console.log(`Pourquoi ${data.ticker} bouge: ${data.explanation}`);
    console.log(`Type: ${data.type}`);
    console.log(`Date: ${data.date}`);
}
```

### Pour les Utilisateurs

Les explications s'affichent automatiquement:
- Dans les cartes de stocks (onglet Données Financières)
- Dans les Top Movers (onglet Titres & Nouvelles)
- Avec un badge "AI" pour les explications Finviz

## 🔍 Dépannage

### Aucune explication affichée

1. Vérifier que le ticker est valide
2. Vérifier les logs: `console.log` dans le navigateur
3. Tester l'endpoint directement: `/api/finviz-why-moving?ticker=AAPL`
4. Vérifier que Finviz est accessible (pas de blocage CORS)

### Explication incorrecte

- Le scraper utilise des patterns génériques
- Finviz peut changer son format HTML
- Ajuster les patterns dans `api/finviz-why-moving.js` si nécessaire

---

**Dernière mise à jour**: 2025-01-16  
**Version**: 1.0.0

