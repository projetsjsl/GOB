# Logique de Décision: Perplexity vs APIs Complémentaires

## Vue d'ensemble

Emma utilise un système intelligent pour décider quand utiliser **Perplexity seul** vs **APIs complémentaires (FMP, Polygon, etc.)**.

## 🧠 Perplexity Seul (Suffisant)

Perplexity est utilisé seul pour les cas suivants :

### ✅ Questions sur Fonds/ETF
- **Exemples** : "quels sont les quartiles de performance 5 ans des fonds équilibrés canadiens"
- **Raison** : Perplexity a accès aux données Morningstar, Fundata, et autres sources officielles
- **Mots-clés** : `fonds`, `quartile`, `rendement`, `ETF`, `mutual fund`

### ✅ Questions Macro-Économiques Générales
- **Exemples** : "quels sont les taux d'intérêt actuels", "explique l'inflation"
- **Raison** : Perplexity a accès aux données récentes de banques centrales, statistiques officielles
- **Mots-clés** : `inflation`, `taux`, `fed`, `banque centrale`, `pib`, `chômage`
- **Exception** : Courbe des taux nécessite données structurées précises → API

### ✅ Questions Conceptuelles/Générales
- **Exemples** : "qu'est-ce qu'un P/E ratio", "comment fonctionne un ETF"
- **Raison** : Perplexity peut expliquer sans données précises
- **Mots-clés** : `qu'est-ce que`, `comment fonctionne`, `explique`, `définition`

### ✅ Actualités Générales (sans ticker)
- **Exemples** : "quelles sont les actualités du jour", "quoi de neuf en bourse"
- **Raison** : Perplexity a accès aux sources récentes
- **Mots-clés** : `actualités`, `nouvelles`, `news`

### ✅ Questions Générales Sans Ticker
- **Règle par défaut** : Si aucun ticker spécifique n'est détecté → Perplexity suffisant

## 📊 APIs Nécessaires

Les APIs complémentaires sont utilisées pour :

### ❌ Prix en Temps Réel Précis
- **Exemples** : "prix AAPL", "cours Microsoft"
- **Raison** : Nécessite données exactes (pas approximatives)
- **APIs** : FMP, Polygon, Yahoo Finance
- **Mots-clés** : `prix`, `cours`, `cotation`, `quote`

### ❌ Ratios Financiers Exactes
- **Exemples** : "P/E de AAPL", "ROE de Microsoft"
- **Raison** : Nécessite données structurées précises
- **APIs** : FMP Ratios, Alpha Vantage
- **Mots-clés** : `pe ratio`, `p/e`, `p/b`, `roe`, `roa`, `ratio`

### ❌ Indicateurs Techniques
- **Exemples** : "RSI de AAPL", "MACD de Tesla"
- **Raison** : Nécessite calculs précis
- **APIs** : Twelve Data, Polygon
- **Mots-clés** : `rsi`, `macd`, `sma`, `ema`, `moyennes mobiles`

### ❌ Calendriers (Earnings, Economic)
- **Exemples** : "prochains résultats AAPL", "calendrier économique"
- **Raison** : Nécessite données structurées
- **APIs** : FMP Earnings Calendar, Economic Calendar
- **Mots-clés** : `calendrier`, `résultats`, `earnings`

### ❌ Watchlist/Portfolio
- **Exemples** : "ma watchlist", "mon portefeuille"
- **Raison** : Nécessite données utilisateur
- **APIs** : Supabase
- **Mots-clés** : `watchlist`, `portefeuille`, `portfolio`

### ❌ Analyse Complète avec Ticker
- **Exemples** : "analyse complète AAPL"
- **Raison** : Nécessite toutes les métriques précises
- **APIs** : FMP (quote, fundamentals, ratios, metrics, news, ratings)
- **Mots-clés** : `analyse complète`, `comprehensive analysis`

### ❌ Données Fondamentales Précisées
- **Exemples** : "fondamentaux AAPL", "revenus Microsoft"
- **Raison** : Nécessite précision
- **APIs** : FMP Fundamentals, Key Metrics
- **Mots-clés** : `fondamentaux`, `fundamentals`, `revenus`, `bénéfices`, `eps`

## 🔄 Logique de Décision

```javascript
_shouldUsePerplexityOnly(userMessage, context, intentData) {
  // 1. Vérifier intents simples (greeting, help) → Perplexity seul
  // 2. Vérifier questions fonds (sans ticker) → Perplexity seul
  // 3. Vérifier questions macro (sans ticker) → Perplexity seul
  // 4. Vérifier questions conceptuelles (sans ticker) → Perplexity seul
  // 5. Vérifier actualités générales (sans ticker) → Perplexity seul
  // 6. Si ticker présent + demande précise → APIs nécessaires
  // 7. Par défaut sans ticker → Perplexity seul
  // 8. Par défaut avec ticker → APIs nécessaires
}
```

## 📝 Amélioration des Prompts

Quand Perplexity est utilisé seul, les prompts sont améliorés pour être explicites :

### Pour Questions sur Fonds
```
Fournis une analyse financière complète et structurée selon ce format:

1. RÉSUMÉ EN TÊTE: Commence par un résumé concis (2-3 phrases) qui répond directement à la question avec les chiffres clés.

2. SECTIONS DÉTAILLÉES avec exemples concrets:
- Pour chaque catégorie/quartile, donne des exemples de fonds spécifiques avec leurs codes/tickers
- Inclus les rendements exacts (1 an, 3 ans, 5 ans, 10 ans si disponibles)
- Mentionne le quartile Morningstar de chaque fonds
- Compare les performances entre différents fonds

3. TABLEAU COMPARATIF SYNTHÉTIQUE:
Crée un tableau clair avec colonnes: Fonds | Rendement 5 ans (%) | Quartile Morningstar | Notes

4. SOURCES COMPLÈTES:
Cite toutes tes sources avec liens vers documents officiels (Morningstar, Fundata, sites des manufacturiers)
```

## ⚠️ Limites de Perplexity

### Ce que Perplexity NE PEUT PAS faire
1. **Prix en temps réel précis** : Peut donner des approximations, pas des prix exacts
2. **Ratios financiers exacts** : Peut donner des estimations, pas des valeurs précises
3. **Calculs techniques** : Ne peut pas calculer RSI, MACD, etc. précisément
4. **Données utilisateur** : N'a pas accès à la watchlist/portfolio de l'utilisateur
5. **Calendriers structurés** : Peut donner des infos générales, pas des calendriers précis

### Ce que Perplexity FAIT BIEN
1. **Analyses qualitatives** : Excellent pour expliquer, comparer, analyser
2. **Sources récentes** : Accès à millions de sources web récentes
3. **Contexte** : Comprend le contexte et peut faire des liens
4. **Explications** : Excellent pour expliquer des concepts
5. **Résumés** : Peut synthétiser des informations complexes

## 🎯 Recommandations

1. **Utiliser Perplexity seul** pour :
   - Questions générales sans ticker spécifique
   - Analyses qualitatives
   - Explications de concepts
   - Questions sur fonds/économie

2. **Utiliser APIs** pour :
   - Données précises avec ticker spécifique
   - Calculs techniques
   - Données utilisateur (watchlist)
   - Calendriers structurés

3. **Combiner les deux** pour :
   - Analyses complètes (APIs pour données + Perplexity pour contexte)
   - Questions complexes nécessitant précision ET contexte

## 📊 Exemples de Décisions

| Question | Décision | Raison |
|----------|----------|--------|
| "quels sont les quartiles de performance 5 ans des fonds équilibrés canadiens" | Perplexity seul | Question sur fonds, pas de ticker |
| "prix AAPL" | APIs | Prix temps réel précis nécessaire |
| "P/E de Microsoft" | APIs | Ratio exact nécessaire |
| "qu'est-ce qu'un P/E ratio" | Perplexity seul | Question conceptuelle |
| "analyse complète AAPL" | APIs | Nécessite toutes les métriques précises |
| "actualités du jour" | Perplexity seul | Actualités générales |
| "actualités AAPL" | APIs | Actualités ticker spécifique |
| "ma watchlist" | APIs | Données utilisateur |
