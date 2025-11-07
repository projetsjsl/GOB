# 📊 RSI Screener - Emma IA Skill

## Vue d'ensemble

Le **RSI Screener** est un skill avancé d'Emma IA qui identifie automatiquement les opportunités de trading basées sur des niveaux RSI extrêmes à travers les marchés internationaux.

### 🎯 Objectifs

1. **Détecter les zones de survente extrême** (potentiels rebonds)
   - RSI(14) ≤ 20
   - RSI(5) ≤ 5

2. **Détecter les zones de surachat extrême** (potentielles corrections)
   - RSI(14) ≥ 80
   - RSI(5) ≥ 95

3. **Scanner plusieurs marchés** (US, Canada, Europe, UK, etc.)

4. **Filtrer par capitalisation** (Large Cap, Mid Cap, All)

---

## 🚀 Utilisation avec Emma

### Exemples de questions pour activer le skill:

```
"Emma, trouve-moi les actions en survente extrême sur le marché US"

"Quelles sont les actions avec RSI très bas au Canada?"

"Montre-moi les opportunités RSI sur les marchés US et européens"

"Liste les actions en surachat extrême (RSI élevé)"

"Quels titres ont un RSI(14) inférieur à 20 et RSI(5) inférieur à 5?"

"Identifie les large caps en zone de survente"
```

---

## 📡 API Endpoint

### Endpoint direct

```
GET /api/rsi-screener
```

### Paramètres

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `type` | string | `"both"` | Type de recherche: `"oversold"`, `"overbought"`, `"both"` |
| `markets` | string | `"US"` | Marchés séparés par virgules: `"US"`, `"CA"`, `"UK"`, `"FR"`, `"DE"`, `"EU"` |
| `limit` | number | `20` | Nombre max de résultats par catégorie (1-100) |
| `market_cap` | string | `"large"` | Capitalisation: `"large"` (>$10B), `"mid"` (>$2B), `"all"` |

### Exemples d'appels

```bash
# Survente + Surachat sur marché US
curl "https://gobapps.com/api/rsi-screener?type=both&markets=US&limit=10"

# Survente uniquement sur Canada
curl "https://gobapps.com/api/rsi-screener?type=oversold&markets=CA&limit=5"

# Multi-marchés (US, Canada, UK)
curl "https://gobapps.com/api/rsi-screener?type=both&markets=US,CA,UK&limit=20"

# Mid-caps US en survente
curl "https://gobapps.com/api/rsi-screener?type=oversold&markets=US&limit=10&market_cap=mid"
```

---

## 📊 Format de réponse

```json
{
  "success": true,
  "type": "both",
  "markets": ["US"],
  "total_analyzed": 100,
  "total_with_data": 85,
  "oversold": {
    "count": 5,
    "criteria": "RSI(14) ≤ 20 ET RSI(5) ≤ 5",
    "stocks": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "market": "US",
        "exchange": "NASDAQ",
        "price": 178.50,
        "market_cap": 2800000000000,
        "sector": "Technology",
        "rsi14": "18.50",
        "rsi5": "3.20",
        "signal": "SURVENTE EXTRÊME",
        "interpretation": "RSI(14)=18.5 RSI(5)=3.2 - Potentiel rebond technique"
      }
    ]
  },
  "overbought": {
    "count": 3,
    "criteria": "RSI(14) ≥ 80 ET RSI(5) ≥ 95",
    "stocks": [
      {
        "symbol": "NVDA",
        "name": "NVIDIA Corporation",
        "market": "US",
        "exchange": "NASDAQ",
        "price": 485.20,
        "market_cap": 1200000000000,
        "sector": "Technology",
        "rsi14": "82.30",
        "rsi5": "96.50",
        "signal": "SURACHAT EXTRÊME",
        "interpretation": "RSI(14)=82.3 RSI(5)=96.5 - Potentiel correction"
      }
    ]
  },
  "timestamp": "2025-11-07T12:00:00.000Z"
}
```

---

## 🔧 Configuration technique

### Fichiers créés

1. **`api/tools/rsi-screener.js`** - Logique de screening
2. **`api/rsi-screener.js`** - Endpoint API serverless
3. **`config/tools_config.json`** - Configuration du skill (ID: `rsi-screener`)
4. **`test-rsi-screener.js`** - Script de test

### Variables d'environnement requises

```bash
# Requis
FMP_API_KEY=your_fmp_api_key

# Optionnel (améliore les performances)
TWELVE_DATA_API_KEY=your_twelve_data_key
```

### Configuration Vercel

Le endpoint est configuré dans `vercel.json`:

```json
{
  "api/rsi-screener.js": {
    "maxDuration": 300,
    "memory": 1024
  }
}
```

- **Timeout**: 300 secondes (5 minutes)
- **Mémoire**: 1024 MB
- Nécessaire car l'analyse peut prendre du temps sur plusieurs marchés

---

## 🧪 Tests

### Test local

```bash
node test-rsi-screener.js
```

### Scénarios de test inclus

1. **US Market - Both** (Survente + Surachat)
2. **Canada Market - Survente uniquement**
3. **Multi-markets** (US + CA + UK) - Surachat uniquement
4. **US Mid-cap - Both**

---

## 🎓 Comprendre les critères RSI

### RSI (Relative Strength Index)

Le RSI mesure la force relative d'un titre sur une période donnée (14 jours ou 5 jours).

#### Zones traditionnelles:
- **RSI > 70**: Surachat (potentiel de correction)
- **RSI < 30**: Survente (potentiel de rebond)

#### Zones EXTRÊMES (ce skill):
- **Survente extrême**: RSI(14) ≤ 20 ET RSI(5) ≤ 5
  - Signal de survente à court et moyen terme
  - Potentiel rebond technique fort
  - ⚠️ Attention: peut indiquer un problème fondamental

- **Surachat extrême**: RSI(14) ≥ 80 ET RSI(5) ≥ 95
  - Signal de surachat à court et moyen terme
  - Potentiel correction imminente
  - ⚠️ Attention: peut indiquer un momentum haussier fort

---

## 💡 Stratégies de trading suggérées

### Pour la SURVENTE (RSI bas)

1. **Rebond technique**
   - Attendre confirmation (volume, pattern)
   - Considérer position longue à court terme
   - Stop-loss serré

2. **Vérifications recommandées**
   - Analyser les fondamentaux (raison de la chute)
   - Vérifier le volume de trading
   - Regarder les news récentes

### Pour le SURACHAT (RSI élevé)

1. **Correction potentielle**
   - Attendre signal de retournement
   - Considérer prise de profits
   - Position courte prudente

2. **Vérifications recommandées**
   - Vérifier s'il y a un catalyseur (earnings, news)
   - Analyser le momentum général du marché
   - Regarder les résistances techniques

---

## 📈 Marchés supportés

| Code | Marché | Exchanges |
|------|--------|-----------|
| `US` | États-Unis | NYSE, NASDAQ |
| `CA` | Canada | TSX, TSXV |
| `UK` | Royaume-Uni | LSE |
| `FR` | France | EURONEXT |
| `DE` | Allemagne | XETRA |
| `EU` | Europe | EURONEXT, XETRA |

---

## ⚠️ Limitations et notes

1. **Rate Limiting**
   - FMP: 300 calls/minute
   - Twelve Data: Selon votre plan
   - Le script intègre des pauses automatiques

2. **Données en temps réel**
   - Les RSI sont calculés sur données journalières (1day)
   - Mise à jour quotidienne après clôture des marchés

3. **Performance**
   - Analyse de 100 tickers par marché
   - Temps d'exécution: 30 secondes à 3 minutes selon marchés
   - Utilise fallback FMP si Twelve Data indisponible

4. **Critères stricts**
   - Les critères RSI(14)≤20 ET RSI(5)≤5 sont très stricts
   - Peut retourner peu de résultats (c'est normal!)
   - Les opportunités extrêmes sont rares

---

## 🔄 Mises à jour futures

### Améliorations prévues

- [ ] Support crypto-monnaies
- [ ] RSI sur timeframes multiples (4h, 1h, 15m)
- [ ] Intégration volume + RSI
- [ ] Alertes push/SMS quand nouveaux résultats
- [ ] Historique des signaux RSI

---

## 📞 Support

Pour toute question sur le RSI Screener:

1. Consultez `test-rsi-screener.js` pour des exemples
2. Vérifiez les logs Vercel: `vercel logs`
3. Testez l'endpoint directement: `/api/rsi-screener?type=both&markets=US&limit=5`

---

## 🎉 Félicitations!

Le skill RSI Screener est maintenant opérationnel. Emma peut maintenant identifier automatiquement les opportunités de trading basées sur RSI extrêmes à travers les marchés internationaux.

**Date de création**: 2025-11-07
**Version**: 1.0.0
**Statut**: ✅ Production Ready
