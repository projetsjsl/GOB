# 📰 Comparaison des Formats de Nouvelles - Différentes Sources API

## Vue d'Ensemble des Sources

| Source | Points Forts | Sentiment | Catégories | Limite Gratuite |
|--------|-------------|-----------|------------|-----------------|
| **Marketaux** | Entités extraites, industrie, sentiment | ✅ Oui (score) | ✅ Oui | 100 req/jour |
| **FMP** | Focus financier, données boursières | ❌ Non | ⚠️ Basique | 250 req/jour |
| **Alpha Vantage** | Sentiment détaillé, topics, pertinence | ✅ Oui (avancé) | ✅ Oui | 25 req/jour |

---

## 1. Marketaux API - Exemple de Sortie

### Requête
```
GET https://api.marketaux.com/v1/news/all?symbols=AAPL&api_token=YOUR_KEY&limit=5
```

### Réponse JSON
```json
{
  "meta": {
    "found": 150,
    "returned": 5,
    "limit": 5,
    "page": 1
  },
  "data": [
    {
      "uuid": "f8c3d2a1-4b5e-6789-a012-3456789abcde",
      "title": "Apple Announces New iPhone 15 with Revolutionary AI Features",
      "description": "Apple Inc. unveiled its latest iPhone 15 series with advanced AI capabilities and improved camera technology during its annual fall event.",
      "keywords": "Apple, iPhone 15, AI, Technology",
      "snippet": "Apple Inc. unveiled its latest iPhone 15 series...",
      "url": "https://www.bloomberg.com/news/articles/2024-10-13/apple-iphone-15",
      "image_url": "https://assets.bwbx.io/images/users/iqjWHBFdfxIU/iphone15.jpg",
      "language": "en",
      "published_at": "2024-10-13T10:30:00.000Z",
      "source": "Bloomberg",
      "relevance_score": null,
      "entities": [
        {
          "symbol": "AAPL",
          "name": "Apple Inc.",
          "exchange": "NASDAQ",
          "exchange_long": "NASDAQ Stock Exchange",
          "country": "us",
          "type": "equity",
          "industry": "Technology",
          "match_score": 95.5,
          "sentiment_score": 0.85,
          "highlights": [
            {"highlight": "iPhone 15", "sentiment": 0.9},
            {"highlight": "AI features", "sentiment": 0.8}
          ]
        }
      ],
      "similar": []
    }
  ]
}
```

### Points Forts
- ✅ **Sentiment Score** : 0.85 (très positif)
- ✅ **Industrie** : Catégorisation automatique
- ✅ **Highlights** : Mots-clés importants avec sentiment
- ✅ **Match Score** : Pertinence de l'article pour le symbole

---

## 2. Financial Modeling Prep (FMP) - Exemple de Sortie

### Requête
```
GET https://financialmodelingprep.com/api/v3/stock_news?tickers=AAPL&limit=5&apikey=YOUR_KEY
```

### Réponse JSON
```json
[
  {
    "symbol": "AAPL",
    "publishedDate": "2024-10-13 10:30:00",
    "title": "Apple Stock Surges 3% on Strong iPhone Sales Forecast",
    "image": "https://cdn.financialmodelingprep.com/images/apple-stock.jpg",
    "site": "CNBC",
    "text": "Apple shares jumped 3% in morning trading after the company reported better-than-expected iPhone sales projections for the upcoming quarter. Analysts are bullish on the new AI-powered features driving consumer demand.",
    "url": "https://www.cnbc.com/2024/10/13/apple-stock-surges.html"
  },
  {
    "symbol": "AAPL",
    "publishedDate": "2024-10-13 09:15:00",
    "title": "Apple's Services Revenue Hits All-Time High",
    "image": "https://cdn.financialmodelingprep.com/images/apple-services.jpg",
    "site": "MarketWatch",
    "text": "Apple's services division, including Apple Music, iCloud, and App Store, generated record revenue in Q3, offsetting slower hardware sales growth.",
    "url": "https://www.marketwatch.com/story/apple-services-revenue-2024"
  }
]
```

### Points Forts
- ✅ **Focus Financier** : Accent sur l'impact boursier
- ✅ **Site Source** : Identification claire de la source
- ✅ **Image** : URL d'image pour chaque article
- ⚠️ **Pas de Sentiment** : Analyse manuelle nécessaire

---

## 3. Alpha Vantage News Sentiment - Exemple de Sortie

### Requête
```
GET https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=YOUR_KEY
```

### Réponse JSON
```json
{
  "items": "50",
  "sentiment_score_definition": "x <= -0.35: Bearish; -0.35 < x <= -0.15: Somewhat-Bearish; -0.15 < x < 0.15: Neutral; 0.15 <= x < 0.35: Somewhat_Bullish; x >= 0.35: Bullish",
  "relevance_score_definition": "0 - 1 (0 being not relevant, 1 being highly relevant)",
  "feed": [
    {
      "title": "Apple's AI Strategy Positions Company for Long-Term Growth",
      "url": "https://www.reuters.com/technology/apple-ai-strategy-2024-10-13",
      "time_published": "20241013T103000",
      "authors": ["John Smith", "Jane Doe"],
      "summary": "Apple's strategic integration of artificial intelligence across its product ecosystem signals a major shift in the company's approach to innovation, positioning it for sustained growth in the coming years.",
      "banner_image": "https://www.reuters.com/resizer/apple-ai.jpg",
      "source": "Reuters",
      "category_within_source": "Technology",
      "source_domain": "reuters.com",
      "topics": [
        {
          "topic": "Technology",
          "relevance_score": "0.9"
        },
        {
          "topic": "Earnings",
          "relevance_score": "0.7"
        },
        {
          "topic": "Manufacturing",
          "relevance_score": "0.3"
        }
      ],
      "overall_sentiment_score": 0.72,
      "overall_sentiment_label": "Bullish",
      "ticker_sentiment": [
        {
          "ticker": "AAPL",
          "relevance_score": "0.95",
          "ticker_sentiment_score": "0.68",
          "ticker_sentiment_label": "Bullish"
        },
        {
          "ticker": "MSFT",
          "relevance_score": "0.15",
          "ticker_sentiment_score": "0.25",
          "ticker_sentiment_label": "Somewhat-Bullish"
        }
      ]
    }
  ]
}
```

### Points Forts
- ✅ **Sentiment Détaillé** : Score global + par ticker
- ✅ **Relevance Score** : Pertinence de l'article pour chaque ticker
- ✅ **Topics** : Classification par thèmes avec scores
- ✅ **Multiple Tickers** : Analyse de tous les tickers mentionnés
- ✅ **Labels Clairs** : Bearish, Neutral, Bullish

---

## Format Unifié dans le Cache Supabase

### Structure de la Table `market_news_cache`
```sql
CREATE TABLE market_news_cache (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  source TEXT,                    -- 'Marketaux', 'FMP', 'Alpha Vantage'
  published_at TIMESTAMPTZ,
  category TEXT,                  -- 'Technology', 'Financial', etc.
  sentiment TEXT,                 -- Score de sentiment (0.0 à 1.0 ou null)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Exemple de Données Agrégées
```json
{
  "data": [
    {
      "id": 1,
      "title": "Apple Announces New iPhone 15 with Revolutionary AI Features",
      "description": "Apple Inc. unveiled its latest iPhone 15 series with advanced AI capabilities...",
      "url": "https://www.bloomberg.com/news/articles/2024-10-13/apple-iphone-15",
      "source": "Marketaux",
      "published_at": "2024-10-13T10:30:00.000Z",
      "category": "Technology",
      "sentiment": "0.85",
      "created_at": "2024-10-13T10:35:00.000Z",
      "updated_at": "2024-10-13T10:35:00.000Z"
    },
    {
      "id": 2,
      "title": "Apple Stock Surges 3% on Strong iPhone Sales Forecast",
      "description": "Apple shares jumped 3% in morning trading after better-than-expected projections...",
      "url": "https://www.cnbc.com/2024/10/13/apple-stock-surges.html",
      "source": "FMP",
      "published_at": "2024-10-13T10:30:00.000Z",
      "category": "financial",
      "sentiment": null,
      "created_at": "2024-10-13T10:35:00.000Z",
      "updated_at": "2024-10-13T10:35:00.000Z"
    },
    {
      "id": 3,
      "title": "Apple's AI Strategy Positions Company for Long-Term Growth",
      "description": "Apple's strategic integration of AI signals a major shift in innovation...",
      "url": "https://www.reuters.com/technology/apple-ai-strategy-2024-10-13",
      "source": "Alpha Vantage",
      "published_at": "2024-10-13T10:30:00.000Z",
      "category": "Technology",
      "sentiment": "0.72",
      "created_at": "2024-10-13T10:35:00.000Z",
      "updated_at": "2024-10-13T10:35:00.000Z"
    }
  ],
  "cached": true,
  "cacheAge": 30,
  "count": 3,
  "sources": ["Marketaux", "FMP", "Alpha Vantage"],
  "metadata": {
    "lastRefresh": "2024-10-13T10:35:00.000Z",
    "nextRefresh": "2024-10-13T11:05:00.000Z"
  }
}
```

---

## Options d'Affichage Frontend

### Option A - Vue Liste Compacte
```
┌─────────────────────────────────────────────────────────────────┐
│ 📰 Apple Announces New iPhone 15 | Marketaux | 🟢 Bullish (0.85)│
│ 📰 Apple Stock Surges 3% | FMP | ⚪ Neutral                      │
│ 📰 Apple's AI Strategy | Alpha Vantage | 🟢 Bullish (0.72)      │
└─────────────────────────────────────────────────────────────────┘
```

### Option B - Vue Cartes Détaillées
```
┌───────────────────────────────────────────────────────────┐
│ 📰 Marketaux • 2 min ago • Technology                     │
│                                                            │
│ Apple Announces New iPhone 15 with Revolutionary AI       │
│                                                            │
│ Apple Inc. unveiled its latest iPhone 15 series with      │
│ advanced AI capabilities and improved camera technology... │
│                                                            │
│ 🟢 Sentiment: Bullish (0.85)                              │
│ 🔗 Lire l'article →                                       │
└───────────────────────────────────────────────────────────┘
```

### Option C - Vue Timeline
```
10:30 AM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         │
         ├─ 📰 Apple Announces New iPhone 15 (Marketaux)
         │  └── 🟢 Bullish (0.85) • Technology
         │
10:30 AM ├─ 📰 Apple Stock Surges 3% (FMP)
         │  └── ⚪ Neutral • Financial
         │
10:30 AM ├─ 📰 Apple's AI Strategy (Alpha Vantage)
         │  └── 🟢 Bullish (0.72) • Technology
         │
09:15 AM └─ 📰 Apple Services Revenue Hits High (FMP)
            └── ⚪ Neutral • Financial
```

### Option D - Vue Groupée par Source
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Marketaux (15 articles) • Sentiment moyen: 🟢 0.78   │
├─────────────────────────────────────────────────────────┤
│  • Apple Announces New iPhone 15 🟢 0.85                │
│  • Tesla Expands Production Capacity 🟢 0.72            │
│  • Microsoft Cloud Revenue Grows 🟢 0.68                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📊 FMP (12 articles) • Focus: Financial                 │
├─────────────────────────────────────────────────────────┤
│  • Apple Stock Surges 3% ⚪                              │
│  • Microsoft Earnings Beat Estimates 🟢                 │
│  • Amazon Q3 Results Disappoint 🔴                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📊 Alpha Vantage (8 articles) • Sentiment moyen: 🟢 0.65│
├─────────────────────────────────────────────────────────┤
│  • Apple's AI Strategy 🟢 0.72                          │
│  • Tech Sector Outlook Positive 🟢 0.58                 │
└─────────────────────────────────────────────────────────┘
```

### Option E - Vue Heatmap de Sentiment
```
┌─────────────────────────────────────────────────────────┐
│ Sentiment des Nouvelles - Dernières 24h                 │
├─────────────────────────────────────────────────────────┤
│ AAPL  🟢🟢🟢🟢🟢🟢🟢🟢⚪⚪ (8 positives, 2 neutres)      │
│ MSFT  🟢🟢🟢🟢🟢⚪⚪⚪🔴 (5 positives, 3 neutres, 1 négatif)│
│ TSLA  🟢🟢🟢⚪⚪🔴🔴 (3 positives, 2 neutres, 2 négatifs) │
└─────────────────────────────────────────────────────────┘
```

---

## Recommandations

### Pour une Expérience Optimale

1. **Vue par Défaut** : Option B (Cartes Détaillées)
   - Plus visuel et engageant
   - Affiche le sentiment clairement
   - Facile à scanner

2. **Vue Alternative** : Option D (Groupée par Source)
   - Permet de voir la diversité des sources
   - Utile pour comparer les perspectives
   - Bon pour les utilisateurs avancés

3. **Filtres Recommandés** :
   - Par source (Marketaux, FMP, Alpha Vantage)
   - Par sentiment (Bullish, Neutral, Bearish)
   - Par catégorie (Technology, Financial, etc.)
   - Par date (Dernière heure, 24h, 7 jours)

4. **Fonctionnalités Bonus** :
   - Toggle pour afficher/masquer le sentiment
   - Indicateur de fraîcheur du cache
   - Bouton "Actualiser maintenant" (force refresh)
   - Export des nouvelles en CSV/JSON

---

## Implémentation dans le Frontend

```javascript
// Fonction pour afficher les nouvelles avec différentes vues
function displayNews(newsData, viewMode = 'cards') {
  const newsContainer = document.getElementById('news-container');
  
  switch(viewMode) {
    case 'compact':
      return renderCompactView(newsData);
    case 'cards':
      return renderCardsView(newsData);
    case 'timeline':
      return renderTimelineView(newsData);
    case 'grouped':
      return renderGroupedView(newsData);
    case 'heatmap':
      return renderHeatmapView(newsData);
    default:
      return renderCardsView(newsData);
  }
}

// Fonction pour obtenir l'emoji de sentiment
function getSentimentEmoji(sentiment) {
  if (!sentiment) return '⚪';
  const score = parseFloat(sentiment);
  if (score >= 0.35) return '🟢'; // Bullish
  if (score >= 0.15) return '🟡'; // Somewhat Bullish
  if (score >= -0.15) return '⚪'; // Neutral
  if (score >= -0.35) return '🟠'; // Somewhat Bearish
  return '🔴'; // Bearish
}

// Fonction pour obtenir le label de sentiment
function getSentimentLabel(sentiment) {
  if (!sentiment) return 'Neutral';
  const score = parseFloat(sentiment);
  if (score >= 0.35) return 'Bullish';
  if (score >= 0.15) return 'Somewhat Bullish';
  if (score >= -0.15) return 'Neutral';
  if (score >= -0.35) return 'Somewhat Bearish';
  return 'Bearish';
}
```

---

**Date de création** : 2024-10-13  
**Version** : 1.0  
**Auteur** : Système de Cache Intelligent GOB
