# Analyse des Sources de News - GOB Dashboard

## 📊 Vue d'ensemble

Ce document analyse l'état actuel des sources de news intégrées et évalue la faisabilité d'intégration de nouvelles sources demandées.

**Date d'analyse**: 2025-01-16  
**Version**: 1.0.0

---

## 🔍 État Actuel des Sources Intégrées

### Sources Actuellement Implémentées

#### 1. **Financial Modeling Prep (FMP)**
- **Fichiers**: `api/fmp.js`, `lib/tools/fmp-ticker-news-tool.js`, `lib/agents/news-monitoring-agent.js`
- **Endpoints**: 
  - `/api/fmp?endpoint=news` - News générales
  - `/api/fmp?endpoint=ticker-news&symbols={ticker}` - News par ticker
- **Méthode**: API officielle
- **Sources agrégées**: FMP agrège des news de multiples sources mais ne spécifie pas toujours la source originale dans la réponse
- **Champ disponible**: `site` (nom du site source)

#### 2. **Finnhub**
- **Fichiers**: `api/finnhub.js`, `lib/tools/finnhub-news-tool.js`, `lib/agents/news-monitoring-agent.js`
- **Endpoints**:
  - `/api/finnhub?endpoint=news` - News générales du marché
  - `/api/finnhub?endpoint=company-news&symbol={ticker}` - News par entreprise
- **Méthode**: API officielle
- **Sources agrégées**: Finnhub agrège des news de multiples sources
- **Champ disponible**: `source` (nom de la source)

#### 3. **Finviz**
- **Fichiers**: `api/finviz-news.js`
- **Méthode**: Web scraping (non-API)
- **Limitation actuelle**: Extrait seulement la dernière news importante, ne spécifie pas la source originale
- **Potentiel**: Finviz agrège Bloomberg, WSJ, MarketWatch, Reuters, CNBC, Fox Business, BBC, NYT, Yahoo Finance

---

## 📋 Analyse des Sources Demandées

### Sources Premium (Market News)

| Source | Intégrée via | Méthode Actuelle | Faisabilité Directe | Score Pertinence |
|--------|--------------|------------------|---------------------|------------------|
| **Bloomberg** | FMP/Finnhub/Finviz | Agrégée | ⚠️ API payante ($2000+/mois) | 10/10 |
| **WSJ** | FMP/Finnhub/Finviz | Agrégée | ⚠️ API payante, RSS limité | 10/10 |
| **MarketWatch** | FMP/Finnhub/Finviz | Agrégée | ✅ RSS disponible | 9/10 |
| **Reuters** | FMP/Finnhub/Finviz | Agrégée | ⚠️ API payante, RSS limité | 10/10 |
| **CNBC** | FMP/Finnhub/Finviz | Agrégée | ✅ RSS disponible | 9/10 |
| **Fox Business** | FMP/Finnhub/Finviz | Agrégée | ✅ RSS disponible | 8/10 |
| **BBC** | FMP/Finnhub/Finviz | Agrégée | ✅ RSS disponible | 8/10 |
| **NYT** | FMP/Finnhub/Finviz | Agrégée | ⚠️ API payante, RSS limité | 9/10 |
| **Yahoo Finance** | FMP/Finnhub/Finviz | Agrégée | ✅ API/RSS disponible | 8/10 |

**Conclusion**: Toutes ces sources sont déjà accessibles via nos agrégateurs (FMP/Finnhub), mais la source originale n'est pas toujours identifiée. Améliorer le scraper Finviz permettrait d'identifier la source originale.

### Blogs Financiers (Market Blogs)

| Source | Intégrée via | Méthode Actuelle | Faisabilité Directe | Score Pertinence |
|--------|--------------|------------------|---------------------|------------------|
| **Seeking Alpha** | ❌ Non | Non | ✅ RSS disponible | 8/10 |
| **Zero Hedge** | ❌ Non | Non | ✅ RSS disponible | 7/10 |
| **The Capital Spectator** | ❌ Non | Non | ✅ RSS disponible | 7/10 |
| **Trader Feed** | ❌ Non | Non | ✅ RSS disponible | 6/10 |
| **Fallond Stock Picks** | ❌ Non | Non | ✅ RSS disponible | 6/10 |
| **The Big Picture** | ❌ Non | Non | ✅ RSS disponible | 7/10 |
| **Howard Lindzon** | ❌ Non | Non | ✅ RSS disponible | 6/10 |
| **Calculated Risk** | ❌ Non | Non | ✅ RSS disponible | 7/10 |
| **Daily Reckoning** | ❌ Non | Non | ✅ RSS disponible | 6/10 |
| **Angry Bear** | ❌ Non | Non | ✅ RSS disponible | 6/10 |
| **Mish's Global Economic Trend Analysis** | ❌ Non | Non | ✅ RSS disponible | 6/10 |
| **Stratechery** | ❌ Non | Non | ⚠️ Payant (newsletter) | 7/10 |
| **Real Investment Advice** | ❌ Non | Non | ✅ RSS disponible | 7/10 |
| **Abnormal Returns** | ❌ Non | Non | ✅ RSS disponible | 7/10 |

**Conclusion**: Aucun de ces blogs n'est actuellement intégré. Tous sont accessibles via RSS (sauf Stratechery qui est payant). Intégration recommandée pour enrichir l'analyse.

### Sources Sociales

| Source | Intégrée via | Méthode Actuelle | Faisabilité Directe | Score Pertinence |
|--------|--------------|------------------|---------------------|------------------|
| **Stocktwits** | ❌ Non | Non | ⚠️ API payante ($99+/mois) | 6/10 |

**Conclusion**: Stocktwits nécessite un abonnement payant. Priorité basse pour l'instant.

### Sources Crypto

| Source | Intégrée via | Méthode Actuelle | Faisabilité Directe | Score Pertinence |
|--------|--------------|------------------|---------------------|------------------|
| **CoinDesk** | ❌ Non | Non | ✅ RSS/API disponible | 7/10 |
| **Cointelegraph** | ❌ Non | Non | ✅ RSS disponible | 7/10 |
| **CryptoSlate** | ❌ Non | Non | ✅ RSS disponible | 6/10 |

**Conclusion**: Sources crypto non intégrées. Accessibles via RSS. Intégration recommandée si besoin crypto.

### Sources Québécoises et Françaises Canadiennes

| Source | Intégrée via | Méthode Actuelle | Faisabilité Directe | Score Pertinence |
|--------|--------------|------------------|---------------------|------------------|
| **Les Affaires** | ✅ Oui | RSS | ✅ RSS disponible | 8.8/10 |
| **La Presse** | ✅ Oui | RSS | ✅ RSS disponible | 8.7/10 |
| **Le Devoir** | ✅ Oui | RSS | ✅ RSS disponible | 8.5/10 |
| **Radio-Canada Économie** | ✅ Oui | RSS | ✅ RSS disponible | 8.7/10 |
| **Le Journal de Montréal** | ✅ Oui | RSS | ✅ RSS disponible | 7.5/10 |
| **Le Soleil** | ✅ Oui | RSS | ✅ RSS disponible | 7.4/10 |
| **TVA Nouvelles** | ✅ Oui | RSS | ✅ RSS disponible | 7.6/10 |
| **BNN Bloomberg (FR)** | ✅ Oui | RSS | ✅ RSS disponible | 8.85/10 |

**Conclusion**: Toutes les sources québécoises principales sont maintenant intégrées via RSS. Excellente couverture pour le marché québécois et canadien francophone. Utiliser le contexte `quebec` ou `french_canada` dans l'API.

### Sources Stock News (Sélection des plus pertinentes)

| Source | Intégrée via | Méthode Actuelle | Faisabilité Directe | Score Pertinence |
|--------|--------------|------------------|---------------------|------------------|
| **Barron's** | FMP/Finnhub | Agrégée | ⚠️ API payante, RSS limité | 9/10 |
| **Forbes** | FMP/Finnhub | Agrégée | ✅ RSS disponible | 8/10 |
| **Fortune** | FMP/Finnhub | Agrégée | ✅ RSS disponible | 8/10 |
| **Investor's Business Daily** | FMP/Finnhub | Agrégée | ⚠️ API payante | 8/10 |
| **Motley Fool** | FMP/Finnhub | Agrégée | ✅ RSS disponible | 7/10 |
| **MarketWatch** | FMP/Finnhub/Finviz | Agrégée | ✅ RSS disponible | 9/10 |
| **Business Insider** | FMP/Finnhub | Agrégée | ✅ RSS disponible | 8/10 |
| **TechCrunch** | FMP/Finnhub | Agrégée | ✅ RSS disponible | 7/10 |
| **Benzinga** | FMP/Finnhub | Agrégée | ⚠️ API payante | 7/10 |
| **Zacks** | FMP/Finnhub | Agrégée | ⚠️ API payante | 7/10 |

**Note**: La liste complète contient 200+ sources. Nous avons listé les plus pertinentes. La plupart sont déjà agrégées via FMP/Finnhub.

---

## 🎯 Matrice de Faisabilité

### Priorité 1 (Haute) - À implémenter rapidement

1. **Améliorer scraper Finviz** pour identifier source originale
- **Faisabilité**: ✅ Élevée
- **Effort**: Moyen
- **Impact**: Élevé (accès à Bloomberg, WSJ, Reuters via Finviz)

2. **Intégrer RSS des blogs principaux**
- **Sources**: Seeking Alpha, Zero Hedge, The Big Picture, Calculated Risk
- **Faisabilité**: ✅ Élevée
- **Effort**: Faible-Moyen
- **Impact**: Moyen-Élevé

3. **Créer endpoint `/api/news.js` unifié**
- **Faisabilité**: ✅ Élevée
- **Effort**: Moyen
- **Impact**: Élevé (agrégation, déduplication, scoring)

### Priorité 2 (Moyenne) - À considérer

1. **Intégrer sources crypto** (si besoin)
- **Sources**: CoinDesk, Cointelegraph
- **Faisabilité**: ✅ Élevée
- **Effort**: Faible
- **Impact**: Faible (si pas de focus crypto)

2. **Intégrer sources québécoises** ✅ **COMPLÉTÉ**
- **Sources**: Les Affaires, La Presse, Le Devoir, Radio-Canada, BNN Bloomberg FR, etc.
- **Faisabilité**: ✅ Élevée
- **Effort**: Faible
- **Impact**: Élevé pour marché québécois

3. **Parser RSS sources premium** (si RSS disponible)
- **Sources**: MarketWatch, CNBC, Forbes, Fortune
- **Faisabilité**: ✅ Élevée
- **Effort**: Faible
- **Impact**: Moyen

### Priorité 3 (Basse) - À considérer plus tard

1. **Stocktwits** (si budget disponible)
- **Faisabilité**: ⚠️ API payante
- **Effort**: Moyen
- **Impact**: Faible-Moyen

2. **Sources spécialisées par secteur**
- **Faisabilité**: Variable
- **Effort**: Variable
- **Impact**: Variable selon besoins

---

## 📊 Recommandations

### Court Terme (1-2 semaines)

1. ✅ Améliorer `api/finviz-news.js` pour extraire la source originale
2. ✅ Créer système de scoring (`config/news-sources-scoring.json`)
3. ✅ Créer endpoint `/api/news.js` unifié
4. ✅ Intégrer 3-5 blogs principaux via RSS (Seeking Alpha, Zero Hedge, The Big Picture)

### Moyen Terme (1 mois)

1. ✅ Intégrer sources crypto si besoin
2. ✅ Parser RSS sources premium (MarketWatch, CNBC, Forbes)
3. ✅ Améliorer `lib/agents/news-monitoring-agent.js` avec nouvelles sources

### Long Terme (3+ mois)

1. ⚠️ Évaluer intégration Stocktwits (si budget)
2. ⚠️ Sources spécialisées par secteur selon besoins

---

## 🔧 Méthodes d'Intégration

### Méthode 1: Via Agrégateurs Existants (FMP/Finnhub)
- **Avantage**: Déjà intégré, pas de développement supplémentaire
- **Inconvénient**: Source originale pas toujours identifiée
- **Action**: Améliorer extraction de métadonnées

### Méthode 2: RSS Feeds
- **Avantage**: Gratuit, accessible, mise à jour régulière
- **Inconvénient**: Nécessite parser RSS, gestion des erreurs
- **Action**: Créer module RSS parser réutilisable

### Méthode 3: Web Scraping (Finviz)
- **Avantage**: Accès à sources premium agrégées
- **Inconvénient**: Fragile (changements HTML), rate limiting
- **Action**: Améliorer scraper avec extraction source

### Méthode 4: APIs Directes
- **Avantage**: Données structurées, fiables
- **Inconvénient**: Coûteux (Bloomberg $2000+/mois, WSJ payant)
- **Action**: Non recommandé pour l'instant (coût élevé)

---

## 📈 Métriques de Succès

- **Couverture**: Nombre de sources uniques intégrées
- **Qualité**: Score moyen de pertinence des sources
- **Fiabilité**: Taux de succès des appels API/RSS
- **Performance**: Temps de réponse moyen
- **Déduplication**: Taux de doublons éliminés

---

**Dernière mise à jour**: 2025-01-16  
**Prochaine révision**: Après implémentation Phase 1

