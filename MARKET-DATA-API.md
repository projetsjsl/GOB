# 📊 API Market Data Unifiée

## 🎯 Vue d'ensemble

L'API Market Data unifie **Finnhub**, **Alpha Vantage** et **Yahoo Finance** en une seule interface pour récupérer les données financières.

## 🔗 Endpoint

```
GET /api/marketdata?endpoint={type}&symbol={ticker}&source={provider}
```

## 📋 Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `endpoint` | string | ✅ | Type de données (`quote`, `profile`, `news`, etc.) |
| `symbol` | string | ✅ | Symbole du titre (ex: `AAPL`, `MSFT`) |
| `source` | string | ❌ | Source spécifique (`yahoo`, `alpha`, `finnhub`, `auto`) |
| `limit` | number | ❌ | Limite de résultats (défaut: 10) |

## 🏢 Sources Disponibles

### 1. **Yahoo Finance** (`yahoo`)
- ✅ **Gratuit** et fiable
- ✅ Données en temps réel
- ✅ Excellent pour les prix
- ❌ Profils d'entreprise limités

### 2. **Alpha Vantage** (`alpha`)
- ✅ Profils d'entreprise détaillés
- ✅ Données fondamentales
- ⚠️ Limite de 5 requêtes/minute (gratuit)
- ⚠️ Nécessite une clé API

### 3. **Finnhub** (`finnhub`)
- ✅ Endpoints avancés (news, recommandations, etc.)
- ✅ Données complètes
- ⚠️ Nécessite une clé API
- ⚠️ Limites selon le plan

### 4. **Auto** (`auto`)
- 🤖 Sélection automatique de la meilleure source
- 🔄 Fallback automatique en cas d'échec
- ⚡ Optimisé par type de données

## 📊 Endpoints Supportés

### `quote` - Prix des Actions
```bash
GET /api/marketdata?endpoint=quote&symbol=AAPL&source=yahoo
```

**Réponse :**
```json
{
  "c": 175.43,
  "d": 0.87,
  "dp": 0.50,
  "h": 176.20,
  "l": 174.89,
  "o": 175.10,
  "pc": 174.56,
  "t": 1699123456789,
  "symbol": "AAPL",
  "endpoint": "quote",
  "source": "yahoo",
  "timestamp": "2025-01-08T10:30:00.000Z"
}
```

### `profile` - Profil d'Entreprise
```bash
GET /api/marketdata?endpoint=profile&symbol=MSFT&source=alpha
```

**Réponse :**
```json
{
  "name": "Microsoft Corporation",
  "country": "US",
  "industry": "Software",
  "weburl": "https://www.microsoft.com",
  "logo": "https://logo.clearbit.com/microsoft.com",
  "marketCapitalization": 2800000000000,
  "shareOutstanding": 7400000000,
  "ticker": "MSFT",
  "symbol": "MSFT",
  "endpoint": "profile",
  "source": "alpha",
  "timestamp": "2025-01-08T10:30:00.000Z"
}
```

### `news` - Actualités (Finnhub uniquement)
```bash
GET /api/marketdata?endpoint=news&symbol=CVS&source=finnhub
```

### Autres Endpoints Finnhub
- `recommendation` - Recommandations d'analystes
- `peers` - Sociétés comparables
- `earnings` - Calendrier des résultats
- `insider-transactions` - Transactions d'initiés
- `financials` - États financiers
- `candles` - Données historiques
- `search` - Recherche de titres

## 🔧 Configuration

### Variables d'Environnement

```bash
# Alpha Vantage
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# Finnhub
FINNHUB_API_KEY=your_finnhub_key
```

### Yahoo Finance
Aucune clé API requise ! 🎉

## 🚀 Exemples d'Utilisation

### 1. Prix avec Auto-Sélection
```javascript
const response = await fetch('/api/marketdata?endpoint=quote&symbol=AAPL&source=auto');
const data = await response.json();
console.log(`Prix AAPL: $${data.c} (${data.source})`);
```

### 2. Profil avec Alpha Vantage
```javascript
const response = await fetch('/api/marketdata?endpoint=profile&symbol=MSFT&source=alpha');
const data = await response.json();
console.log(`Entreprise: ${data.name} (${data.industry})`);
```

### 3. Actualités avec Finnhub
```javascript
const response = await fetch('/api/marketdata?endpoint=news&symbol=CVS&source=finnhub');
const data = await response.json();
console.log(`Actualités: ${data.length} articles`);
```

## 🔄 Stratégie de Fallback

1. **Source demandée** → Essai de la source spécifique
2. **Échec** → Fallback automatique vers les autres sources
3. **Toutes sources échouent** → Données de démonstration

## 📈 Avantages

- ✅ **Multi-sources** : Redondance et fiabilité
- ✅ **Gratuit** : Yahoo Finance sans clé API
- ✅ **Auto-optimisation** : Sélection intelligente
- ✅ **Fallback robuste** : Toujours des données
- ✅ **Compatibilité** : API Finnhub legacy maintenue

## 🔗 Migration depuis Finnhub

### Avant
```javascript
fetch('/api/finnhub?endpoint=quote&symbol=AAPL')
```

### Après
```javascript
fetch('/api/marketdata?endpoint=quote&symbol=AAPL&source=auto')
```

## 🧪 Tests

```bash
# Test Yahoo Finance
curl "http://localhost:3000/api/marketdata?endpoint=quote&symbol=AAPL&source=yahoo"

# Test Auto-Sélection
curl "http://localhost:3000/api/marketdata?endpoint=quote&symbol=MSFT&source=auto"

# Test Alpha Vantage
curl "http://localhost:3000/api/marketdata?endpoint=profile&symbol=CVS&source=alpha"
```

## 📊 Comparaison des Sources

| Fonctionnalité | Yahoo | Alpha Vantage | Finnhub |
|----------------|-------|---------------|---------|
| Prix temps réel | ✅ | ✅ | ✅ |
| Profils détaillés | ❌ | ✅ | ✅ |
| Actualités | ❌ | ❌ | ✅ |
| Recommandations | ❌ | ❌ | ✅ |
| Données historiques | ❌ | ✅ | ✅ |
| Gratuit | ✅ | ⚠️ | ⚠️ |
| Limites | ❌ | ⚠️ | ⚠️ |

## 🎯 Recommandations

- **Prix quotidiens** : Utilisez `source=yahoo` (gratuit)
- **Profils d'entreprise** : Utilisez `source=alpha`
- **Actualités** : Utilisez `source=finnhub`
- **Usage général** : Utilisez `source=auto` (recommandé)
