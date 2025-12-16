# 100 Exemples de Questions/Réponses - Emma IA
## Scénarios de Test pour Analyste Financier de Haut Niveau

**Basé sur**: Architecture Emma (emma-agent.js, intent-analyzer.js, context-memory.js)
**Date**: 2025-11-13

---

## 📊 CATÉGORIE 1: PRIX ET COTATIONS (10 exemples)

### 1. Prix Simple
**Q**: "Prix Apple"
**Intent**: stock_price
**Réponse attendue**: Prix actuel AAPL avec variation du jour, volume, contexte marché

### 2. Prix Multiple Tickers
**Q**: "Prix AAPL, MSFT, GOOGL"
**Intent**: stock_price
**Réponse attendue**: Tableau comparatif des 3 prix avec variations

### 3. Prix avec Référence Contextuelle
**Q1**: "Analyse Tesla"
**Q2**: "et le prix?"
**Intent**: stock_price (ticker TSLA inféré)
**Réponse attendue**: Prix TSLA actuel avec contexte

### 4. Variation de Prix
**Q**: "Combien a gagné NVDA aujourd'hui?"
**Intent**: stock_price
**Réponse attendue**: Variation % et $ du jour pour NVDA

### 5. Prix Historique
**Q**: "Quel était le prix de Tesla la semaine dernière?"
**Intent**: stock_price
**Réponse attendue**: Prix TSLA avec données historiques 1 semaine

### 6. All-Time High
**Q**: "AAPL est proche de son ATH?"
**Intent**: stock_price
**Réponse attendue**: Prix actuel vs ATH, distance en %

### 7. Prix après Clôture
**Q**: "Prix GOOGL après clôture"
**Intent**: stock_price
**Réponse attendue**: Prix after-hours si disponible, sinon dernier prix clôture

### 8. Prix Comparatif Secteur
**Q**: "Comment se compare le prix de MSFT vs ses pairs?"
**Intent**: comparative_analysis + stock_price
**Réponse attendue**: Prix MSFT + comparaison GOOGL, AAPL

### 9. Prix avec Devise
**Q**: "Prix Royal Bank en CAD"
**Intent**: stock_price
**Réponse attendue**: Prix RY.TO en dollars canadiens

### 10. Prix Pronom
**Q1**: "Analyse Microsoft"
**Q2**: "c'est à combien?"
**Intent**: stock_price (MSFT inféré)
**Réponse attendue**: Prix MSFT actuel

---

## 📈 CATÉGORIE 2: FONDAMENTAUX (15 exemples)

### 11. P/E Ratio Simple
**Q**: "P/E de Tesla"
**Intent**: fundamentals
**Réponse attendue**: P/E actuel TSLA + comparaison sectorielle + historique

### 12. ROE
**Q**: "ROE de Apple"
**Intent**: fundamentals
**Réponse attendue**: ROE AAPL avec explication et benchmark

### 13. Marges
**Q**: "Quelles sont les marges de Microsoft?"
**Intent**: fundamentals
**Réponse attendue**: Gross margin, operating margin, net margin MSFT

### 14. Dette
**Q**: "Quelle est la dette de Tesla?"
**Intent**: fundamentals
**Réponse attendue**: Total debt, debt/equity ratio, analyse santé financière

### 15. Croissance Revenus
**Q**: "Croissance des revenus NVDA"
**Intent**: fundamentals
**Réponse attendue**: Revenue growth YoY, QoQ, tendance

### 16. EPS
**Q**: "EPS de GOOGL"
**Intent**: fundamentals
**Réponse attendue**: Earnings per share actuel + historique + guidance

### 17. Free Cash Flow
**Q**: "Free cash flow Apple"
**Intent**: fundamentals
**Réponse attendue**: FCF avec analyse de génération de cash

### 18. Dividendes
**Q**: "MSFT paie des dividendes?"
**Intent**: fundamentals
**Réponse attendue**: Dividend yield, payout ratio, historique dividendes

### 19. Market Cap
**Q**: "Capitalisation boursière Tesla"
**Intent**: fundamentals
**Réponse attendue**: Market cap actuel + comparaison secteur

### 20. Book Value
**Q**: "P/B ratio de JPM"
**Intent**: fundamentals
**Réponse attendue**: Price-to-book avec analyse valorisation

### 21. Multiples Ratios
**Q**: "Tous les ratios financiers de AAPL"
**Intent**: fundamentals
**Réponse attendue**: P/E, P/B, ROE, ROA, marges, debt ratios complets

### 22. Comparaison Fondamentaux
**Q**: "Compare fondamentaux AAPL vs MSFT"
**Intent**: comparative_analysis
**Réponse attendue**: Tableau comparatif des ratios clés

### 23. Fondamentaux avec Pronom
**Q1**: "Analyse NVDA"
**Q2**: "c'est quoi son ROE?"
**Intent**: fundamentals (NVDA inféré)
**Réponse attendue**: ROE de NVDA

### 24. Santé Financière
**Q**: "Tesla est en bonne santé financière?"
**Intent**: fundamentals
**Réponse attendue**: Analyse dette, liquidité, profitabilité

### 25. Croissance vs Profitabilité
**Q**: "AMZN privilégie croissance ou profitabilité?"
**Intent**: fundamentals
**Réponse attendue**: Analyse trade-off croissance/marges

---

## 📉 CATÉGORIE 3: ANALYSE TECHNIQUE (10 exemples)

### 26. RSI Simple
**Q**: "RSI de Tesla"
**Intent**: technical_analysis
**Réponse attendue**: RSI actuel avec interprétation (suracheté/survendu)

### 27. MACD
**Q**: "MACD AAPL"
**Intent**: technical_analysis
**Réponse attendue**: MACD signal + histogram + interprétation

### 28. Moyennes Mobiles
**Q**: "Moyennes mobiles MSFT"
**Intent**: technical_analysis
**Réponse attendue**: SMA 50, 200 + golden/death cross si applicable

### 29. Support/Résistance
**Q**: "Niveaux support résistance NVDA"
**Intent**: technical_analysis
**Réponse attendue**: Niveaux clés identifiés avec prix

### 30. Tendance
**Q**: "GOOGL est en tendance haussière?"
**Intent**: technical_analysis
**Réponse attendue**: Analyse tendance avec indicateurs

### 31. Bollinger Bands
**Q**: "Bollinger bands Tesla"
**Intent**: technical_analysis
**Réponse attendue**: Bandes supérieure/inférieure + position actuelle

### 32. Volume
**Q**: "Analyse de volume AAPL"
**Intent**: technical_analysis
**Réponse attendue**: Volume actuel vs moyenne + signification

### 33. Fibonacci
**Q**: "Retracements Fibonacci MSFT"
**Intent**: technical_analysis
**Réponse attendue**: Niveaux Fib clés (38.2%, 50%, 61.8%)

### 34. Pattern Graphique
**Q**: "Y a-t-il un pattern sur NVDA?"
**Intent**: technical_analysis
**Réponse attendue**: Identification patterns (triangle, tête-épaules, etc.)

### 35. Momentum
**Q**: "Momentum de Tesla"
**Intent**: technical_analysis
**Réponse attendue**: Analyse momentum multi-indicateurs

---

## 📰 CATÉGORIE 4: ACTUALITÉS (10 exemples)

### 36. News Simple
**Q**: "Actualités Apple"
**Intent**: news
**Réponse attendue**: Top 5 news récentes AAPL avec sources

### 37. News du Jour
**Q**: "Top 5 news du jour"
**Intent**: news
**Réponse attendue**: 5 actualités financières majeures avec sources

### 38. News Secteur
**Q**: "Actualités secteur tech"
**Intent**: news + sector_industry
**Réponse attendue**: News tech majeures affectant FAANG

### 39. News Spécifique
**Q**: "Tesla a annoncé quoi récemment?"
**Intent**: news
**Réponse attendue**: Dernières annonces TSLA (earnings, produits, etc.)

### 40. News avec Référence
**Q1**: "Analyse MSFT"
**Q2**: "quelles sont les news?"
**Intent**: news (MSFT inféré)
**Réponse attendue**: News récentes Microsoft

### 41. Breaking News
**Q**: "Breaking news marché"
**Intent**: news
**Réponse attendue**: Actualités urgentes affectant marchés

### 42. News Impact
**Q**: "Pourquoi NVDA monte aujourd'hui?"
**Intent**: news
**Réponse attendue**: News récentes expliquant hausse + contexte

### 43. News Comparaison
**Q**: "Compare les actualités AAPL vs MSFT"
**Intent**: comparative_analysis + news
**Réponse attendue**: News récentes des 2 avec comparaison

### 44. News M&A
**Q**: "Acquisitions récentes dans la tech"
**Intent**: news + sector_industry
**Réponse attendue**: M&A tech récents avec impact

### 45. News Réglementation
**Q**: "Nouvelles régulations affectant Meta?"
**Intent**: news + political_analysis
**Réponse attendue**: Actualités réglementaires META

---

## 🎯 CATÉGORIE 5: ANALYSES COMPLÈTES (10 exemples)

### 46. Analyse Complète Simple
**Q**: "Analyse AAPL"
**Intent**: comprehensive_analysis
**Réponse attendue**: 8 sections (Valorisation, Performance, Fondamentaux, Moat, Valeur, Risques, Recommandation, Questions) min 1500 mots

### 47. Analyse Complète avec Mode
**Q**: "ANALYSE NVDA"
**Intent**: comprehensive_analysis (forced intent via keyword)
**Réponse attendue**: Analyse structurée complète NVDA

### 48. Analyse Secteur
**Q**: "Analyse secteur semi-conducteurs"
**Intent**: sector_industry + comprehensive_analysis
**Réponse attendue**: Analyse macro semi-conducteurs + principaux acteurs

### 49. Analyse Référence Contextuelle
**Q1**: "Analyse Tesla"
**Q2**: "et Microsoft?"
**Intent**: comprehensive_analysis (MSFT)
**Réponse attendue**: Analyse complète MSFT (même structure que Tesla)

### 50. Analyse Small Cap
**Q**: "Analyse détaillée de PLTR"
**Intent**: comprehensive_analysis
**Réponse attendue**: Analyse Palantir avec focus croissance

### 51. Analyse Value Stock
**Q**: "Analyse value pour BAC"
**Intent**: comprehensive_analysis + valuation
**Réponse attendue**: Analyse Bank of America focus valorisation

### 52. Analyse Growth Stock
**Q**: "Analyse growth TSLA"
**Intent**: comprehensive_analysis
**Réponse attendue**: Analyse Tesla focus potentiel croissance

### 53. Analyse Dividend Stock
**Q**: "Analyse pour dividendes JNJ"
**Intent**: comprehensive_analysis
**Réponse attendue**: Analyse J&J focus dividendes sustainability

### 54. Analyse Post-Earnings
**Q**: "Analyse AAPL après les résultats"
**Intent**: comprehensive_analysis + earnings
**Réponse attendue**: Analyse incluant réaction post-earnings

### 55. Analyse Contrarian
**Q**: "Analyse contrarian de BABA"
**Intent**: comprehensive_analysis
**Réponse attendue**: Analyse risques/opportunités Alibaba

---

## ⚖️ CATÉGORIE 6: COMPARAISONS (8 exemples)

### 56. Comparaison Simple
**Q**: "Compare AAPL et MSFT"
**Intent**: comparative_analysis
**Réponse attendue**: Tableau comparatif fondamentaux, valorisation, performance

### 57. Comparaison Keyword
**Q**: "COMPARER GOOGL MSFT"
**Intent**: comparative_analysis (forced)
**Réponse attendue**: Comparaison structurée des 2

### 58. Comparaison Secteur
**Q**: "Compare les banques JPM, BAC, WFC"
**Intent**: comparative_analysis
**Réponse attendue**: Comparaison 3 banques US majeures

### 59. Comparaison vs Benchmark
**Q**: "NVDA vs S&P500"
**Intent**: comparative_analysis
**Réponse attendue**: Performance NVDA vs indice

### 60. Comparaison Internationale
**Q**: "Compare AAPL (US) vs Samsung (Corée)"
**Intent**: comparative_analysis
**Réponse attendue**: Comparaison cross-border avec nuances

### 61. Comparaison Valorisation
**Q**: "Qui est moins cher: AAPL ou MSFT?"
**Intent**: comparative_analysis + valuation
**Réponse attendue**: Comparaison multiples valorisation

### 62. Comparaison Growth
**Q**: "Qui croît le plus vite: NVDA ou AMD?"
**Intent**: comparative_analysis
**Réponse attendue**: Comparaison croissance revenus/earnings

### 63. Comparaison Pronom
**Q1**: "Compare AAPL et MSFT"
**Q2**: "lequel est mieux?"
**Intent**: recommendation (contexte AAPL vs MSFT)
**Réponse attendue**: Synthèse nuancée avec disclaimer

---

## 📅 CATÉGORIE 7: RÉSULTATS FINANCIERS (7 exemples)

### 64. Earnings Prochains
**Q**: "Prochains résultats AAPL"
**Intent**: earnings
**Réponse attendue**: Date earnings call + attentes analystes

### 65. Earnings Aujourd'hui
**Q**: "Résultats aujourd'hui"
**Intent**: earnings
**Réponse attendue**: Calendrier earnings du jour

### 66. Earnings Calendar
**Q**: "Calendrier résultats cette semaine"
**Intent**: earnings
**Réponse attendue**: Liste companies avec earnings cette semaine

### 67. Earnings Beat/Miss
**Q**: "Tesla a battu les attentes?"
**Intent**: earnings
**Réponse attendue**: Analyse beat/miss vs consensus

### 68. Earnings Keyword
**Q**: "RESULTATS MSFT"
**Intent**: earnings (forced)
**Réponse attendue**: Derniers résultats Microsoft

### 69. Guidance
**Q**: "Quelle est la guidance de NVDA?"
**Intent**: earnings
**Réponse attendue**: Forward guidance management + analystes

### 70. Earnings Call Highlights
**Q**: "Faits saillants earnings call AAPL"
**Intent**: earnings + news
**Réponse attendue**: Points clés conférence résultats

---

## 📊 CATÉGORIE 8: PORTEFEUILLE & WATCHLIST (5 exemples)

### 71. Voir Watchlist
**Q**: "Ma watchlist"
**Intent**: portfolio
**Réponse attendue**: Liste tickers watchlist + team tickers

### 72. Watchlist Keyword
**Q**: "LISTE"
**Intent**: portfolio (forced)
**Réponse attendue**: Affichage complet watchlist

### 73. Performance Watchlist
**Q**: "Performance de ma watchlist"
**Intent**: portfolio + stock_price
**Réponse attendue**: Tableau performance tous tickers watchlist

### 74. Ajouter Ticker
**Q**: "AJOUTER NVDA"
**Intent**: portfolio (action: add)
**Réponse attendue**: Confirmation ajout NVDA à watchlist

### 75. Supprimer Ticker
**Q**: "RETIRER TSLA"
**Intent**: portfolio (action: remove)
**Réponse attendue**: Confirmation suppression TSLA

---

## 🌍 CATÉGORIE 9: VUE MARCHÉ & ÉCONOMIE (10 exemples)

### 76. État du Marché
**Q**: "Comment va le marché?"
**Intent**: market_overview
**Réponse attendue**: Indices principaux + sentiment + secteurs

### 77. Indices
**Q**: "INDICES"
**Intent**: market_overview (forced)
**Réponse attendue**: Dow, S&P500, Nasdaq avec variations

### 78. Secteurs Performants
**Q**: "Quels secteurs performent bien?"
**Intent**: market_overview + sector_industry
**Réponse attendue**: Rotation sectorielle + top/bottom secteurs

### 79. Sentiment Marché
**Q**: "Quel est le sentiment du marché?"
**Intent**: market_overview
**Réponse attendue**: Fear/Greed index + VIX + flow analysis

### 80. Taux d'Intérêt
**Q**: "TAUX"
**Intent**: economic_analysis (forced)
**Réponse attendue**: Taux Fed actuels + tendance + impact marchés

### 81. Inflation
**Q**: "INFLATION"
**Intent**: economic_analysis (forced)
**Réponse attendue**: Données inflation récentes + analyse

### 82. Fed
**Q**: "Que fait la FED?"
**Intent**: economic_analysis
**Réponse attendue**: Politique monétaire Fed + prochaines décisions

### 83. Calendrier Économique
**Q**: "CALENDRIER ECONOMIQUE"
**Intent**: economic_analysis (forced)
**Réponse attendue**: Événements macro à venir

### 84. Récession
**Q**: "Y a-t-il un risque de récession?"
**Intent**: economic_analysis
**Réponse attendue**: Analyse indicateurs avancés + probabilité

### 85. Marchés Internationaux
**Q**: "Comment vont les marchés européens?"
**Intent**: market_overview
**Réponse attendue**: CAC40, DAX, FTSE + analyse

---

## 💡 CATÉGORIE 10: RECOMMANDATIONS & STRATÉGIE (8 exemples)

### 86. Recommandation Simple
**Q**: "Devrais-je acheter Apple?"
**Intent**: recommendation
**Réponse attendue**: Analyse objective + facteurs décision + DISCLAIMER

### 87. Recommandation Keyword
**Q**: "ACHETER TSLA"
**Intent**: recommendation (forced, bias: buy)
**Réponse attendue**: Analyse + nuances + disclaimer

### 88. Avis Vente
**Q**: "VENDRE NVDA"
**Intent**: recommendation (forced, bias: sell)
**Réponse attendue**: Analyse risks + alternatives + disclaimer

### 89. Fair Value
**Q**: "Quelle est la juste valeur de MSFT?"
**Intent**: valuation
**Réponse attendue**: DCF + multiples + fair value estimate

### 90. Opportunité
**Q**: "AAPL est une opportunité?"
**Intent**: recommendation + valuation
**Réponse attendue**: Analyse risk/reward + valorisation

### 91. Stratégie Long Terme
**Q**: "Stratégie long terme tech"
**Intent**: investment_strategy
**Réponse attendue**: Allocation sectorielle + stock picking

### 92. Diversification
**Q**: "Comment diversifier mon portfolio?"
**Intent**: investment_strategy
**Réponse attendue**: Principes diversification + exemples

### 93. Risk/Reward
**Q**: "Quel est le risk/reward de TSLA?"
**Intent**: risk_volatility + recommendation
**Réponse attendue**: Analyse risques vs upside potentiel

---

## 🤖 CATÉGORIE 11: INTERACTIONS & AIDE (8 exemples)

### 94. Salutation
**Q**: "Bonjour"
**Intent**: greeting
**Réponse attendue**: Présentation Emma + capacités + exemples

### 95. Aide
**Q**: "AIDE"
**Intent**: help (forced)
**Réponse attendue**: Guide complet fonctionnalités + exemples

### 96. Skills
**Q**: "SKILLS"
**Intent**: help (forced command)
**Réponse attendue**: Liste 30+ mots-clés + capacités structurée

### 97. Exemples
**Q**: "EXEMPLES"
**Intent**: help (forced command)
**Réponse attendue**: 20+ exemples concrets de questions

### 98. Capacités
**Q**: "Que peux-tu faire?"
**Intent**: help
**Réponse attendue**: Liste capacités + limitations

### 99. Expression Émotionnelle
**Q**: "WOW"
**Intent**: general_conversation (skip_financial_analysis: true)
**Réponse attendue**: Réponse conversationnelle appropriée

### 100. Test Emma
**Q**: "Test Emma"
**Intent**: greeting (forced)
**Réponse attendue**: Présentation complète + démonstration

---

## 🎯 PATTERNS CONTEXTUELS AVANCÉS

### Bonus 1: Chaîne Contextuelle
```
Q1: "Analyse AAPL"
R1: [Analyse complète Apple]

Q2: "et le prix?"
R2: [Prix AAPL - ticker inféré]

Q3: "pourquoi il monte?"
R3: [News AAPL - ticker maintenu]

Q4: "compare avec MSFT"
R4: [Comparaison AAPL vs MSFT]

Q5: "lequel est mieux?"
R5: [Recommandation nuancée avec disclaimer]
```

### Bonus 2: Multi-Références
```
Q1: "Compare GOOGL et MSFT"
R1: [Comparaison détaillée]

Q2: "et leurs P/E?"
R2: [P/E GOOGL vs MSFT - 2 tickers maintenus]
```

### Bonus 3: Changement de Sujet
```
Q1: "Analyse Tesla"
R1: [Analyse TSLA]

Q2: "Actualités Apple"
R2: [News AAPL - nouveau sujet détecté, reset contexte]
```

---

## 📊 MÉTRIQUES DE QUALITÉ ATTENDUES

### Pour Analyses Complètes (comprehensive_analysis)
- **Longueur**: Minimum 1500 mots
- **Structure**: 8 sections obligatoires
- **Sources**: Citations pour chaque affirmation factuelle
- **Données**: Métriques récentes (< 1 mois)
- **Disclaimer**: Obligatoire si recommandation

### Pour Analyses Factuelles (stock_price, fundamentals, news)
- **Sources**: Mentions obligatoires (FMP, Polygon, Finnhub)
- **Dates**: Timestamps pour données
- **Contexte**: Comparaison sectorielle/historique
- **Validation**: FreshDataGuard score > 0.7

### Pour Analyses Techniques
- **Indicateurs**: Minimum 3 indicateurs par analyse
- **Timeframe**: Spécifié (1D, 1W, 1M)
- **Interprétation**: Explication claire signaux

### Pour Recommandations
- **Disclaimer**: Obligatoire ("ceci n'est pas un conseil financier")
- **Nuances**: Jamais directive ("vous devriez")
- **Facteurs**: Liste facteurs à considérer
- **Référence**: Suggérer conseiller financier agréé

---

## 🧪 TESTS DE NON-RÉGRESSION

### Mode Analyse DOIT Fonctionner
```
✅ "Analyse AAPL" → 8 sections complètes
✅ "ANALYSE MSFT" → Forced intent keyword
✅ Structure préservée
✅ Qualité maintenue
```

### Multi-Canal DOIT Fonctionner
```
✅ Web: Markdown complet
✅ SMS: Ultra-concis (< 1600 chars)
✅ Email: Format professionnel
✅ Messenger: Conversationnel
```

### Function Calling DOIT Fonctionner
```
✅ polygon-stock-price appelé pour prix
✅ fmp-fundamentals appelé pour ratios
✅ finnhub-news appelé pour actualités
✅ Fallback chain opérationnel
```

---

**Note**: Ces 100 exemples couvrent TOUS les types d'intentions d'Emma et démontrent la compréhension contextuelle avancée (références, pronoms, messages incomplets) introduite par les améliorations.

**Usage**: Utiliser comme base pour tests automatisés ou validation manuelle du comportement d'Emma.
