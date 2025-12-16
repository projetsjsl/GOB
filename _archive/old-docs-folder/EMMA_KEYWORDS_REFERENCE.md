# 🔍 Emma IA - Référence des Mots-Clés et Intentions

## 📱 Commandes Bot (Réponse Instantanée)

Ces commandes sont détectées par **match exact** dans `api/chat.js` et retournent une réponse pré-programmée sans appel à l'IA.

| Commande | Mots-clés acceptés | Détection | Exemple |
|----------|-------------------|-----------|---------|
| **SKILLS** | `SKILLS` ou `SKILL` | Exact (case insensitive) | "skills" ou "SKILL" |
| **AIDE** | `AIDE` ou `HELP` | Exact (case insensitive) | "aide" ou "HELP" |
| **EXEMPLES** | `EXEMPLES` ou `EXAMPLES` | Exact (case insensitive) | "exemples" |
| **TOP 5 NEWS** | `TOP 5` ou `TOP5` OU (`ACTUALIT` + `AUJOURD`) | Contains | "Top 5 news" ou "actualités aujourd'hui" |

**⚡ Performance**: < 100ms (pas d'appel IA)

---

## 🤖 Intentions Emma IA (Analyse NLP)

Ces requêtes sont analysées par le **HybridIntentAnalyzer** (`lib/intent-analyzer.js`) qui détecte l'intention avec des mots-clés puis sélectionne les outils appropriés.

### **1. Salutations (Greeting)**
**Confiance**: 99%

**Mots-clés détectés**:
```
bonjour, salut, hello, hi, bonsoir, hey, coucou,
good morning, bonne journée, ça va
```

**Exemples**:
- "Bonjour Emma"
- "Salut, ça va ?"
- "Hello!"

---

### **2. Prix d'Actions (Stock Price)**
**Confiance**: 95%

**Mots-clés détectés**:
```
prix, cours, cotation, valeur, combien, coûte, coute,
quote, trading at, se négocie, cote, valorisation actuelle,
prix du marché, market price, current price
```

**Exemples**:
- "Prix AAPL"
- "Combien coûte Tesla ?"
- "À combien se négocie Microsoft ?"

**Outils utilisés**: fmp-quote, polygon-stock-price

---

### **3. Fondamentaux (Fundamentals)**
**Confiance**: 90%

**Mots-clés détectés**:
```
fondamentaux, pe ratio, p/e, revenus, bénéfices, marges,
eps, croissance, roe, roa, ratio, financials,
chiffre d'affaires, cash flow, flux de trésorerie, bilans,
santé financière, profitabilité, rentabilité, dette,
endettement, actifs, passifs, capitaux propres, ebitda,
bpa, dividendes, rendement
```

**Exemples**:
- "Fondamentaux Microsoft"
- "C'est quoi le P/E de Tesla ?"
- "ROE de Apple"
- "Marges bénéficiaires GOOGL"

**Outils utilisés**: fmp-fundamentals, fmp-ratios, fmp-key-metrics

---

### **4. Analyse Technique (Technical Analysis)**
**Confiance**: 90%

**Mots-clés détectés**:
```
technique, rsi, macd, support, résistance, resistance,
moyennes mobiles, sma, ema, tendance, trend, bollinger,
stochastic, fibonacci, volume, momentum, oscillateur,
graphique, chart, candlestick, chandeliers, breakout,
cassure, setup, pattern, triangle, tête et épaules
```

**Exemples**:
- "RSI NVDA"
- "MACD Tesla"
- "Moyennes mobiles AAPL"
- "TSLA est suracheté ?"

**Outils utilisés**: twelve-data-technical

---

### **5. Actualités (News)**
**Confiance**: 85%

**Mots-clés détectés**:
```
actualités, actualites, nouvelles, news,
qu'est-ce qui se passe, quoi de neuf, dernières infos,
événements, evenements, breaking, annonces, communiqué,
presse, médias, headlines, titres, flash info, update
```

**Exemples**:
- "Actualités Apple"
- "Quoi de neuf en bourse ?"
- "News tech cette semaine"
- "Pourquoi TSLA monte ?"

**Outils utilisés**: fmp-ticker-news, finnhub-news

---

### **6. Analyse Complète (Comprehensive Analysis)**
**Confiance**: 90%

**Mots-clés détectés**:
```
analyse complète, analyse complete, analyse, évaluation,
evaluation, rapport, due diligence, deep dive,
étude approfondie, assessment, overview, vue d'ensemble,
complet, détaillé, exhaustif, panorama
```

**Exemples**:
- "Analyse AAPL"
- "Analyse complète Microsoft"
- "Dis-moi tout sur NVDA"
- "Évaluation de Tesla"

**Outils utilisés**:
- fmp-quote
- fmp-fundamentals
- fmp-ratios
- fmp-key-metrics
- fmp-ratings
- fmp-ticker-news
- earnings-calendar
- twelve-data-technical (si configuré)

---

### **7. Comparaison (Comparative Analysis)**
**Confiance**: 85%

**Mots-clés détectés**:
```
vs, versus, comparer, comparaison, mieux, différence,
difference, ou, plutôt, meilleur, benchmark, face à,
par rapport à, comparativement, versus, contre
```

**Exemples**:
- "Comparer AAPL et MSFT"
- "NVDA vs AMD"
- "Tesla ou Rivian ?"
- "Microsoft mieux que Google ?"

**Outils utilisés**: Mêmes outils que comprehensive_analysis pour chaque ticker

---

### **8. Résultats Trimestriels (Earnings)**
**Confiance**: 90%

**Mots-clés détectés**:
```
résultats, resultats, earnings, trimestriels, annuels,
rapport financier, quarterly, q1, q2, q3, q4, publication,
release, guidance, prévisions, outlook, earning call,
conference, conférence résultats
```

**Exemples**:
- "Prochains résultats AAPL"
- "Résultats cette semaine"
- "Earnings calendar"
- "Quand Tesla publie ?"

**Outils utilisés**: earnings-calendar

---

### **9. Portefeuille/Watchlist (Portfolio)**
**Confiance**: 95%

**Mots-clés détectés**:
```
portefeuille, portfolio, watchlist, positions, titres,
mes tickers, mes titres, ma watchlist, ma liste, mes actions,
quels tickers, quels titres, liste de mes, show my,
liste mes, affiche mes, quelles actions, tickers que je suis,
mes valeurs, mes investissements, holdings, positions ouvertes,
allocation, diversification, exposition
```

**Exemples**:
- "Ma liste"
- "Affiche ma watchlist"
- "Quels sont mes tickers ?"
- "Mon portfolio"

**Actions spéciales**:
- "Ajouter NVDA" → Ajoute à la watchlist
- "Retirer TSLA" → Supprime de la watchlist
- "Watchlist de l'équipe" → Affiche les tickers partagés

**Outils utilisés**: supabase-watchlist, team-tickers

---

### **10. Vue Marché (Market Overview)**
**Confiance**: 75%

**Mots-clés détectés**:
```
marché, marche, indices, secteurs, vue globale, situation,
état du marché, market sentiment, sentiment, tendances macro,
bourses, wall street, dow jones, nasdaq, sp500, s&p 500, tsx,
cac40, secteur technologie, rotation sectorielle, market breadth
```

**Exemples**:
- "Comment vont les marchés ?"
- "Indices aujourd'hui"
- "Situation des bourses"

**Outils utilisés**: fmp-quote (indices majeurs), economic-calendar

---

### **11. Recommandation (Recommendation)**
**Confiance**: 80%

**Mots-clés détectés**:
```
recommandation, acheter, vendre, conserver, avis, suggestion,
conseil, buy, sell, hold, rating, opinion, dois-je acheter,
est-ce un bon moment, opportunité, attractive, fair value,
juste valeur, surévalué, sous-évalué, undervalued, overvalued
```

**Exemples**:
- "Devrais-je acheter Tesla ?"
- "Microsoft est-il cher ?"
- "Avis sur AAPL ?"
- "Tesla est suracheté ?"

**Outils utilisés**: fmp-ratings, fmp-fundamentals, fmp-ratios, twelve-data-technical

---

### **12. Analyse Économique (Economic Analysis)**
**Confiance**: 85%

**Mots-clés détectés**:
```
économie, economie, économique, pib, gdp, inflation,
taux directeur, fed, banque centrale, politique monétaire,
monetaire, taux d'intérêt, interet, chômage, chomage, emploi,
récession, recession, croissance économique, indicateurs macro,
cycle économique, expansion, contraction, stagflation, déficit,
dette publique, budget, fiscal, treasury, bonds, obligations,
yield curve, courbe des taux
```

**Exemples**:
- "Événements économiques"
- "Taux d'intérêt Fed"
- "Risque de récession ?"

**Outils utilisés**: economic-calendar

---

### **13. Stratégie d'Investissement (Investment Strategy)**
**Confiance**: 85%

**Mots-clés détectés**:
```
stratégie, strategie, investir, placement, allocation d'actifs,
asset allocation, long terme, court terme, value investing,
growth investing, dividend investing, revenus, momentum,
contrarian, arbitrage, hedging, couverture, protection,
risk management, gestion des risques, rebalancing,
rééquilibrage, reequilibrage, dollar cost averaging, lump sum
```

**Exemples**:
- "Meilleures actions IA ?"
- "Stratégie croissance ?"
- "Actions dividendes tech"

**Outils utilisés**: fmp-fundamentals, fmp-ratios, fmp-ratings

---

### **14. Risque/Volatilité (Risk/Volatility)**
**Confiance**: 85%

**Mots-clés détectés**:
```
risque, volatilité, volatilite, beta, alpha, sharpe ratio,
var, value at risk, drawdown, perte maximale, écart type,
standard deviation, corrélation, correlation, diversification,
exposition, concentration, hedge, protection contre,
safe haven, valeur refuge, defensive, cyclique
```

**Exemples**:
- "Risques Amazon ?"
- "Volatilité Tesla"
- "Actions défensives"

**Outils utilisés**: fmp-ratios, twelve-data-technical, fmp-key-metrics

---

## 🔄 Fonctionnement du Système d'Intention

### **Étape 1: Détection de commande bot (chat.js ligne 297-555)**
```javascript
const messageUpper = message.trim().toUpperCase();

if (messageUpper === 'SKILLS') {
  // Réponse instantanée pré-programmée
  return skillsResponse;
}
```

### **Étape 2: Si pas de commande bot → Analyse d'intention (intent-analyzer.js)**
```javascript
// 1. Extraction rapide locale (regex)
const extracted = this.extractLocalInfo(userMessage);

// 2. Détection intention par mots-clés
for (const [intentType, pattern] of Object.entries(this.intentPatterns)) {
  const keywords = pattern.keywords;
  const matchedKeywords = keywords.filter(kw =>
    msgLower.includes(kw.toLowerCase())
  );

  if (matchedKeywords.length > 0) {
    return {
      intent: intentType,
      confidence: pattern.confidence,
      tickers: extracted.tickers
    };
  }
}

// 3. Si ambiguïté (confiance < 50%) → Gemini LLM pour clarification
if (confidence < 0.5) {
  return await this._analyzeWithGemini(userMessage);
}
```

### **Étape 3: Sélection d'outils (emma-agent.js)**
```javascript
// Basé sur l'intention détectée, sélection des outils pertinents
const tools = this.selectTools(extracted, intentData, context);

// Exemples:
// comprehensive_analysis → 8 outils
// stock_price → 1 outil (fmp-quote)
// technical_analysis → 1 outil (twelve-data-technical)
// news → 2 outils (fmp-ticker-news + finnhub-news)
```

---

## 📊 Performance du Système

| Type de requête | Temps détection | Temps total |
|-----------------|-----------------|-------------|
| **Commande bot** (SKILLS, AIDE) | < 50ms | < 100ms |
| **Intention claire** (prix, news) | ~50ms (local) | ~10-13s (avec outils) |
| **Intention ambiguë** | ~800ms (Gemini) | ~11-14s (avec outils) |
| **Top 5 news** (news directe) | < 50ms | ~1-2s |

---

## 🎯 Comment Savoir Quels Mots-Clés Utiliser ?

### **Méthode 1: Commande EXEMPLES**
Tape `EXEMPLES` par SMS → Emma te montre tous les exemples qui fonctionnent

### **Méthode 2: Langage naturel**
Emma comprend le langage naturel ! Tu n'as PAS besoin de commandes strictes:

**✅ Marche**:
- "Qu'est-ce qui se passe avec Apple ?"
- "J'aimerais savoir le prix de Tesla"
- "Peux-tu me donner une analyse de Microsoft ?"

**✅ Aussi simple**:
- "Prix AAPL"
- "Analyse MSFT"
- "News TSLA"

### **Méthode 3: Ce document**
Référence ce fichier pour voir tous les mots-clés détectés par intention

---

## 🛠️ Fichiers Sources

| Fonctionnalité | Fichier | Lignes importantes |
|----------------|---------|-------------------|
| Commandes bot | `/api/chat.js` | 297-555 |
| Détection intention | `/lib/intent-analyzer.js` | 82-200 |
| Sélection outils | `/api/emma-agent.js` | 200-350 |
| Configuration outils | `/config/tools_config.json` | Tous |

---

## 💡 Tips d'Utilisation

### **Pour une réponse rapide (<2s):**
Utilise les commandes bot: `SKILLS`, `AIDE`, `EXEMPLES`, `Top 5 news`

### **Pour une analyse complète (~10-13s):**
- "Analyse AAPL"
- "Analyse complète Microsoft"

### **Pour un aspect spécifique (~8-10s):**
- "Prix TSLA"
- "RSI NVDA"
- "Actualités AAPL"

### **Pour watchlist (<100ms):**
- "Ajouter NVDA"
- "Ma liste"

---

**Version**: 1.0
**Date**: 5 novembre 2025
**Auteur**: Claude Code
**Dernière mise à jour**: Optimisation SKILLS commands
