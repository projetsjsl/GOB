# 📰 Documentation API News Sources - GOB Dashboard

## Vue d'ensemble

Le système de news de GOB agrège les actualités financières depuis **multiples sources** avec **déduplication automatique** et **scoring de pertinence contextuel**.

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────┐
│              /api/news.js (Endpoint Unifié)             │
│  Agrège, déduplique, score et trie les actualités      │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┬──────────────┬─────────────┐
       │                │              │             │
   ┌───▼───┐      ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
   │  FMP  │      │  Finnhub  │  │ Finviz  │  │   RSS    │
   │  News │      │   News    │  │ Scraper │  │  Feeds   │
   └───────┘      └───────────┘  └─────────┘  └──────────┘
```

## 📡 Sources Intégrées

### 1. **Financial Modeling Prep (FMP)**
- **Endpoint**: `/api/fmp?endpoint=news` ou `/api/fmp?endpoint=ticker-news`
- **Type**: API officielle
- **Sources agrégées**: Bloomberg, WSJ, Reuters, CNBC, MarketWatch, Yahoo Finance, Forbes, Fortune, etc.
- **Avantage**: Source fiable, nombreuses sources premium
- **Limitation**: Source originale pas toujours identifiée

### 2. **Finnhub**
- **Endpoint**: `/api/finnhub?endpoint=news` ou `/api/finnhub?endpoint=company-news`
- **Type**: API officielle
- **Sources agrégées**: Bloomberg, WSJ, Reuters, CNBC, MarketWatch, etc.
- **Avantage**: API gratuite, données structurées
- **Limitation**: Rate limit (60 calls/min)

### 3. **Finviz** (Amélioré)
- **Endpoint**: `/api/finviz-news?ticker={SYMBOL}&limit={N}`
- **Type**: Web scraping
- **Sources identifiées**: Bloomberg, WSJ, MarketWatch, Reuters, CNBC, Fox Business, BBC, NYT, Yahoo Finance
- **Avantage**: Accès à sources premium via agrégateur
- **Nouveauté**: Identification automatique de la source originale

### 4. **RSS Feeds** (Nouveau)
- **Module**: `lib/rss-parser.js`
- **Sources intégrées**:
  - **Blogs**: Seeking Alpha, Zero Hedge, The Big Picture, Calculated Risk, The Capital Spectator, Abnormal Returns
  - **Crypto**: CoinDesk, Cointelegraph, CryptoSlate
  - **Premium**: MarketWatch, CNBC, Forbes, Fortune, Business Insider, TechCrunch, Motley Fool
- **Avantage**: Gratuit, mise à jour régulière
- **Méthode**: Parser RSS natif (pas de dépendance externe)

## 🔗 Endpoint Unifié

### `/api/news`

**Méthode**: `GET`

**Paramètres**:

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `q` | string | Non* | Requête de recherche (texte libre) |
| `ticker` | string | Non* | Symbole boursier (ex: AAPL) |
| `symbol` | string | Non* | Alias de `ticker` |
| `limit` | number | Non | Nombre max de résultats (défaut: 20) |
| `context` | string | Non | Contexte: `general`, `crypto`, `analysis`, `sectorial` (défaut: `general`) |
| `strict` | boolean | Non | Si `true`, retourne erreur si aucun paramètre (défaut: `false`) |

\* Au moins un de `q`, `ticker` ou `symbol` requis si `strict=true`

**Exemples**:

```bash
# News générales du marché
GET /api/news?q=market OR economy&limit=20

# News pour un ticker spécifique
GET /api/news?ticker=AAPL&limit=10

# News crypto
GET /api/news?q=bitcoin&context=crypto&limit=15

# News d'analyse
GET /api/news?q=earnings&context=analysis&limit=10

# News québécoises
GET /api/news?q=quebec OR montreal&context=quebec&limit=20

# News en français canadien
GET /api/news?q=canada&context=french_canada&limit=15
```

**Réponse**:

```json
{
  "success": true,
  "articles": [
    {
      "title": "Apple Reports Record Q4 Earnings",
      "headline": "Apple Reports Record Q4 Earnings",
      "summary": "Apple Inc. reported record-breaking Q4 earnings...",
      "url": "https://example.com/article",
      "published_at": "2025-01-15T10:30:00.000Z",
      "datetime": "2025-01-15T10:30:00.000Z",
      "source": "Bloomberg",
      "source_provider": "FMP",
      "source_original": "Bloomberg",
      "source_key": "bloomberg",
      "relevance_score": 8.5,
      "image": "https://example.com/image.jpg",
      "symbol": "AAPL"
    }
  ],
  "count": 20,
  "sources": ["FMP", "Finnhub", "Finviz", "RSS"],
  "source": "FMP, Finnhub, Finviz, RSS",
  "message": "Actualités récupérées depuis FMP, Finnhub, Finviz, RSS",
  "timestamp": "2025-01-16T12:00:00.000Z"
}
```

## 🎯 Système de Scoring

### Critères de Scoring

Le système de scoring évalue chaque source selon 6 critères (pondération):

1. **Fiabilité** (30%): Réputation, fact-checking
2. **Pertinence Financière** (25%): Focus finance/marchés
3. **Fréquence** (15%): Mise à jour régulière
4. **Accessibilité** (15%): API/RSS disponible
5. **Couverture** (10%): Diversité des sujets
6. **Coût** (5%): Gratuit vs payant

### Configuration

Le scoring est configuré dans `config/news-sources-scoring.json`:

```json
{
  "criteria_weights": {
    "reliability": 0.30,
    "financial_relevance": 0.25,
    "frequency": 0.15,
    "accessibility": 0.15,
    "coverage": 0.10,
    "cost": 0.05
  },
  "sources": {
    "bloomberg": {
      "scores": {
        "reliability": 10,
        "financial_relevance": 10,
        ...
      },
      "calculated_score": 8.15
    }
  }
}
```

### Contextes

Le scoring s'adapte selon le contexte:

- **`general`**: Sources générales du marché (Bloomberg, WSJ, MarketWatch, CNBC, Forbes)
- **`crypto`**: Sources cryptomonnaies (CoinDesk, Cointelegraph, CryptoSlate)
- **`analysis`**: Blogs d'analyse (Seeking Alpha, The Big Picture, Calculated Risk)
- **`sectorial`**: News sectorielles (Seeking Alpha, Zero Hedge)
- **`quebec`**: Actualités financières québécoises (Les Affaires, La Presse, Le Devoir, Radio-Canada, BNN Bloomberg FR)
- **`french_canada`**: Actualités en français canadien (toutes sources québécoises + régionales)

## 🔄 Déduplication

Le système déduplique automatiquement les articles par:

1. **URL normalisée** (sans paramètres de tracking)
2. **Titre similaire** (si URL manquante)

Les doublons sont éliminés avant le scoring et le tri.

## 📊 Tri et Filtrage

Les articles sont triés par:

1. **Score de pertinence** (décroissant)
2. **Date de publication** (plus récent en premier)

Bonus de score:
- **+1.0** pour news < 24h
- **+0.5** pour news < 48h

## 🔧 Intégration dans le Code

### Utilisation dans News Monitoring Agent

Le `NewsMonitoringAgent` utilise maintenant l'endpoint unifié:

```javascript
// lib/agents/news-monitoring-agent.js
async _fetchRecentNews(ticker, since) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/news?ticker=${ticker}&limit=50&context=general`);
  const data = await response.json();
  
  // Filtrer par date et utiliser les scores de pertinence
  return data.articles.filter(article => {
    const articleDate = new Date(article.published_at);
    return articleDate >= since;
  });
}
```

### Utilisation Directe

```javascript
// Frontend ou autre endpoint
const response = await fetch('/api/news?ticker=AAPL&limit=10');
const { articles, sources, count } = await response.json();

articles.forEach(article => {
  console.log(`${article.title} (${article.source}, score: ${article.relevance_score})`);
});
```

## 📝 RSS Feeds Disponibles

### Blogs Financiers

- **Seeking Alpha**: `https://seekingalpha.com/feed.xml`
- **Zero Hedge**: `https://www.zerohedge.com/fullrss2.xml`
- **The Big Picture**: `https://www.ritholtz.com/blog/feed/`
- **Calculated Risk**: `https://www.calculatedriskblog.com/feeds/posts/default`
- **The Capital Spectator**: `https://www.capitalspectator.com/feed/`
- **Abnormal Returns**: `https://abnormalreturns.com/feed/`

### Sources Crypto

- **CoinDesk**: `https://www.coindesk.com/arc/outboundfeeds/rss/`
- **Cointelegraph**: `https://cointelegraph.com/rss`
- **CryptoSlate**: `https://cryptoslate.com/feed/`

### Sources Premium (RSS)

- **MarketWatch**: `https://www.marketwatch.com/rss/topstories`
- **CNBC**: `https://www.cnbc.com/id/100003114/device/rss/rss.html`
- **Forbes**: `https://www.forbes.com/real-time/feed2/`
- **Fortune**: `https://fortune.com/feed/`
- **Business Insider**: `https://www.businessinsider.com/rss`
- **TechCrunch**: `https://techcrunch.com/feed/`
- **Motley Fool**: `https://www.fool.com/feeds/index.aspx`

### Sources Québécoises et Françaises Canadiennes (RSS)

- **Les Affaires**: `https://www.lesaffaires.com/rss` - Source financière québécoise de référence
- **La Presse**: `https://www.lapresse.ca/rss/affaires.xml` - Source québécoise majeure
- **Le Devoir**: `https://www.ledevoir.com/rss/economie.xml` - Source québécoise indépendante
- **Radio-Canada Économie**: `https://ici.radio-canada.ca/rss/economie.xml` - Source publique québécoise
- **Le Journal de Montréal**: `https://www.journaldemontreal.com/rss/affaires.xml` - Source québécoise populaire
- **Le Soleil**: `https://www.lesoleil.com/rss/affaires.xml` - Source régionale québécoise
- **TVA Nouvelles Économie**: `https://www.tvanouvelles.ca/rss/economie.xml` - Source québécoise TV
- **BNN Bloomberg (FR)**: `https://www.bnnbloomberg.ca/fr/rss` - Source financière canadienne en français

## 🚀 Améliorations Futures

### Priorité 1
- [ ] Cache des résultats RSS (éviter appels répétés)
- [ ] Rate limiting intelligent par source
- [ ] Webhooks pour alertes news importantes

### Priorité 2
- [ ] Intégration Stocktwits (si budget disponible)
- [ ] Sources spécialisées par secteur
- [ ] Analyse de sentiment améliorée

### Priorité 3
- [ ] APIs directes sources premium (Bloomberg, WSJ) si budget
- [ ] Machine learning pour scoring personnalisé
- [ ] Recommandations de sources selon préférences utilisateur

## 🔍 Dépannage

### Aucune news retournée

1. Vérifier que les clés API sont configurées:
   ```bash
   echo $FMP_API_KEY
   echo $FINNHUB_API_KEY
   ```

2. Vérifier les logs:
   ```bash
   # Vercel
   vercel logs
   ```

3. Tester chaque source individuellement:
   ```bash
   curl "https://your-app.vercel.app/api/fmp?endpoint=news&limit=5"
   curl "https://your-app.vercel.app/api/finnhub?endpoint=news&category=general"
   ```

### Erreurs RSS

- Vérifier que les URLs RSS sont toujours valides
- Certains flux peuvent avoir des restrictions CORS
- Utiliser User-Agent approprié

### Performance

- Limiter le nombre de sources simultanées si timeout
- Utiliser cache pour RSS feeds (mise à jour toutes les 15min)
- Optimiser les appels parallèles avec `Promise.allSettled`

## 📚 Références

- [Documentation FMP News API](https://financialmodelingprep.com/developer/docs/)
- [Documentation Finnhub News API](https://finnhub.io/docs/api/company-news)
- [Analyse des Sources](docs/news-sources-analysis.md)
- [Configuration Scoring](config/news-sources-scoring.json)

---

**Dernière mise à jour**: 2025-01-16  
**Version**: 1.0.0

