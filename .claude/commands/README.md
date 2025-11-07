# 🎯 Emma IA - Slash Commands

Guide complet des slash commands disponibles pour utiliser rapidement les skills d'Emma.

## 📋 Liste des Commands

### 🔍 Screening & Recherche

#### `/rsi` - RSI Screener
Identifie les opportunités RSI extrêmes (survente/surachat) sur marchés internationaux.

**Exemples d'utilisation:**
```
/rsi
/rsi marchés US et Canada
/rsi survente uniquement large cap
```

**Critères:**
- Survente: RSI(14) ≤ 20 ET RSI(5) ≤ 5
- Surachat: RSI(14) ≥ 80 ET RSI(5) ≥ 95
- Marchés: US, CA, UK, FR, DE, EU

---

#### `/screener` - Stock Screener
Recherche d'actions selon critères spécifiques (valeur, croissance, dividendes).

**Exemples d'utilisation:**
```
/screener large cap sous-évaluées
/screener actions à dividendes élevés
/screener tech growth small cap
```

**Critères populaires:**
- Valorisation (P/E, P/B)
- Dividendes (yield)
- Croissance (revenue, earnings)
- Secteur (tech, healthcare, etc.)

---

### 📊 Analyse & Données

#### `/quote` - Prix en Temps Réel
Affiche prix actuel, variation, volume et données intraday.

**Exemples d'utilisation:**
```
/quote AAPL
/quote TSLA NVDA MSFT
/quote prix de Apple
```

**Données retournées:**
- Prix actuel et variation
- High/Low du jour
- Volume
- Market cap

---

#### `/fundamentals` - Analyse Fondamentale
Analyse complète des fondamentaux d'une entreprise.

**Exemples d'utilisation:**
```
/fundamentals AAPL
/fundamentals analyse Apple
/fundamentals compare AAPL vs secteur
```

**Données retournées:**
- Profil entreprise
- Métriques financières (revenue, EPS, cash flow)
- Ratios (P/E, ROE, debt/equity)
- Score de santé financière

---

#### `/technical` - Analyse Technique
Analyse des indicateurs techniques (RSI, MACD, moyennes mobiles).

**Exemples d'utilisation:**
```
/technical AAPL
/technical RSI de TSLA
/technical NVDA est suracheté?
```

**Indicateurs analysés:**
- RSI(14)
- MACD
- SMA (20, 50, 200)
- EMA (20)
- Volume
- Support/Résistance

---

#### `/news` - Actualités
Actualités récentes d'un ticker ou du marché en général.

**Exemples d'utilisation:**
```
/news AAPL
/news dernières nouvelles marché
/news quoi de neuf TSLA
```

**Données retournées:**
- Actualités récentes (24-48h)
- Source et date
- Sentiment (positif/négatif/neutre)
- Impact potentiel sur cours

---

### 📅 Calendriers

#### `/calendar` - Calendrier Économique
Événements économiques importants (emploi, inflation, Fed).

**Exemples d'utilisation:**
```
/calendar
/calendar cette semaine
/calendar quand prochain CPI
```

**Événements couverts:**
- Emploi (Payrolls, chômage)
- Inflation (CPI, PPI, PCE)
- Croissance (GDP)
- Banques centrales (Fed, BCE, BoC)

---

#### `/earnings` - Résultats d'Entreprises
Calendrier des résultats trimestriels avec consensus et surprises.

**Exemples d'utilisation:**
```
/earnings
/earnings AAPL
/earnings cette semaine
/earnings quand NVDA
```

**Données retournées:**
- EPS attendu vs actuel
- Revenue attendu vs actuel
- Surprise (beat/miss)
- Réaction du cours
- Guidance

---

#### `/taux` - Courbe des Taux Obligataires
Affiche courbe des taux US et Canada avec spreads et signaux de récession.

**Exemples d'utilisation:**
```
/taux
/taux US uniquement
/taux spread 10Y-2Y
/taux inversion courbe
```

**Données retournées:**
- Taux obligataires (1M à 30Y)
- Taux directeurs (Fed, BoC)
- Spreads clés (10Y-2Y, 30Y-10Y)
- Signaux de récession
- Graphique TradingView
- Comparaison US vs Canada

---

### 💼 Portfolio & Watchlist

#### `/watchlist` - Gestion Watchlist
Affiche et analyse la watchlist personnelle.

**Exemples d'utilisation:**
```
/watchlist
/watchlist performance
/watchlist opportunités
/watchlist résumé
```

**Données retournées:**
- Liste complète des tickers
- Prix actuels et variations
- Performance YTD
- Top/Bottom performers
- Opportunités détectées

---

## 🚀 Utilisation Rapide

### Format de Base
```
/[command] [paramètres optionnels]
```

### Exemples Combinés
```
# Analyse rapide d'un ticker
/quote AAPL
/fundamentals AAPL
/technical AAPL
/news AAPL

# Planning de trading
/calendar aujourd'hui
/earnings cette semaine
/rsi marchés US et Canada

# Gestion portfolio
/watchlist opportunités
/screener large cap sous-évaluées
```

---

## 📖 Guide par Cas d'Usage

### 🎯 Recherche d'Opportunités

**Actions en survente (rebond technique):**
```
/rsi survente US large cap
/technical [TICKER trouvé] (confirmer RSI)
/fundamentals [TICKER] (vérifier santé)
```

**Actions sous-évaluées (value investing):**
```
/screener large cap sous-évaluées
/fundamentals [TICKER trouvé]
/news [TICKER] (vérifier pas de problème)
```

**Prochains catalystes:**
```
/earnings cette semaine
/calendar événements importants
```

---

### 📊 Analyse Complète d'un Ticker

**Processus recommandé:**
```
1. /quote AAPL (prix actuel)
2. /fundamentals AAPL (santé financière)
3. /technical AAPL (timing d'entrée)
4. /news AAPL (sentiment récent)
5. /earnings AAPL (prochains résultats)
```

---

### 💼 Gestion de Portfolio

**Revue quotidienne:**
```
/watchlist résumé
/calendar aujourd'hui
/news marché général
```

**Revue hebdomadaire:**
```
/watchlist performance
/earnings cette semaine
/calendar semaine
/rsi opportunités marchés multiples
```

---

## ⚙️ Configuration

### Variables d'Environnement Requises

Les slash commands utilisent les APIs d'Emma. Assurez-vous que ces variables sont configurées:

```bash
# Requis
FMP_API_KEY=xxx              # Financial Modeling Prep
GEMINI_API_KEY=xxx           # Google Gemini (Emma primary)

# Recommandé
TWELVE_DATA_API_KEY=xxx      # Indicateurs techniques
PERPLEXITY_API_KEY=xxx       # Screening avancé

# Optionnel
FINNHUB_API_KEY=xxx          # Fallback market data
ALPHA_VANTAGE_API_KEY=xxx    # Fallback ratios
```

---

## 🎓 Astuces & Best Practices

### ✅ DO's

- **Combiner plusieurs commands** pour analyse complète
- **Utiliser paramètres spécifiques** (tickers, dates, marchés)
- **Vérifier calendrier** avant positions importantes
- **Analyser fondamentaux ET techniques** ensemble

### ❌ DON'Ts

- Ne pas se fier uniquement à un indicateur
- Ne pas ignorer actualités récentes
- Ne pas trader sans vérifier calendrier économique
- Ne pas négliger analyse de secteur

---

## 🔧 Troubleshooting

### Command ne répond pas
- Vérifiez que le ticker est valide (format US: AAPL, MSFT)
- Essayez sans paramètres d'abord
- Vérifiez les logs si en développement

### Données manquantes
- Certains tickers n'ont pas toutes les données (ex: ETF)
- Vérifiez que le marché est ouvert pour prix real-time
- Essayez un ticker alternatif pour tester

### API Errors
- Vérifiez variables d'environnement
- Consultez quotas API (FMP: 300 calls/min)
- Essayez plus tard si rate limited

---

## 📚 Documentation Complète

### Skills Emma (détails)
- `docs/skills/RSI_SCREENER.md` - RSI Screener complet
- `docs/api/DOCUMENTATION_APIs.md` - Documentation APIs

### Fichiers Sources
- `.claude/commands/` - Définitions des slash commands
- `config/tools_config.json` - Configuration des tools Emma
- `api/` - Endpoints API

---

## 🆘 Support

Pour toute question ou problème:

1. **Consultez la documentation** dans `/docs`
2. **Testez avec un ticker simple** (AAPL, MSFT)
3. **Vérifiez les logs Vercel** si en production
4. **Créez une issue GitHub** si bug persistant

---

## 📅 Dernière Mise à Jour

**Date**: 7 novembre 2025
**Version**: 1.0.0
**Auteur**: Équipe GOB - JSL AI

---

## 🎉 Quick Start

Pour commencer immédiatement:

```bash
# 1. Analyse rapide d'Apple
/quote AAPL

# 2. Trouver opportunités RSI
/rsi US large cap

# 3. Voir ta watchlist
/watchlist résumé

# 4. Calendrier aujourd'hui
/calendar
```

**Bon trading! 📈**
