# Enrichissement des Cas de Détection - Emma IA

## 📋 Résumé

Amélioration majeure du système de détection d'Emma pour couvrir un éventail beaucoup plus large de domaines financiers et de types de demandes. Cette mise à jour permet à Emma de mieux identifier les questions qui nécessitent uniquement Perplexity (connaissances générales) versus celles nécessitant des APIs complémentaires (données temps réel).

## 🎯 Objectif

Élargir la couverture de détection pour inclure :
- Plus de domaines financiers spécialisés
- Plus de types de questions (calculs, simulations, méthodologies)
- Plus de produits financiers (warrants, convertibles, produits structurés)
- Plus de contextes (réglementation, ESG, gestion de risque avancée)
- Plus de stratégies (arbitrage, pairs trading, quantitative)

## ✅ Domaines Ajoutés

### 1. **Forex/Devises** (Nouveau)
- Taux de change, paires de devises
- Carry trade, couverture de change
- Risque de change, exposition aux devises
- Volatilité et corrélation des devises

**Keywords**: `forex`, `fx`, `devise`, `taux de change`, `currency pair`, `usd`, `eur`, `gbp`, `carry trade`, `currency hedging`, etc.

### 2. **Obligations/Bonds** (Enrichi)
- Obligations corporatives, gouvernementales, municipales
- High yield, investment grade
- Duration, convexity, credit spread
- Yield to maturity, courbe des taux
- Fixed income, revenu fixe

**Keywords**: `bonds`, `obligations`, `corporate bonds`, `treasury bonds`, `yield`, `duration`, `convexity`, `ytm`, `fixed income`, etc.

### 3. **Immobilier/Real Estate** (Nouveau)
- REITs, fiducies immobilières
- Immobilier commercial et résidentiel
- Cap rate, NOI (Net Operating Income)
- Valorisation immobilière, cycle immobilier

**Keywords**: `immobilier`, `real estate`, `reit`, `reits`, `cap rate`, `noi`, `real estate investment`, etc.

### 4. **Private Equity/Venture Capital** (Nouveau)
- Capital-investissement, venture capital
- Startups, unicornes, séries de financement
- LBO, MBO, leveraged buyout
- Valorisation de startups, exits

**Keywords**: `private equity`, `venture capital`, `vc`, `startup`, `unicorn`, `series a`, `lbo`, `leveraged buyout`, etc.

### 5. **Warrants/Convertibles** (Nouveau)
- Warrants d'achat/vente, certificats
- Obligations convertibles
- Ratio de conversion, prime de conversion
- Effet de levier des warrants

**Keywords**: `warrant`, `warrants`, `certificat`, `convertible`, `convertible bond`, `conversion ratio`, `conversion premium`, etc.

### 6. **Calculs/Simulations** (Nouveau)
- DCF, VAN, TRI, WACC
- Valeur terminale, perpétuité
- Analyse de sensibilité, scénarios
- Monte Carlo, backtesting
- Stress testing

**Keywords**: `calculer`, `dcf`, `discounted cash flow`, `van`, `npv`, `irr`, `wacc`, `monte carlo`, `backtesting`, `stress test`, etc.

### 7. **Réglementation/Compliance** (Nouveau)
- SEC, AMF, régulateurs
- Insider trading, manipulation de marché
- Disclosure, divulgation
- GAAP, IFRS, normes comptables
- Audit, vérification

**Keywords**: `réglementation`, `compliance`, `sec`, `amf`, `insider trading`, `market manipulation`, `gaap`, `ifrs`, etc.

### 8. **ESG/Durabilité** (Nouveau)
- Environmental, Social, Governance
- Responsabilité sociale d'entreprise (RSE)
- Obligations vertes, investissement durable
- Risque climatique, transition énergétique
- ESG rating, notation ESG

**Keywords**: `esg`, `sustainability`, `csr`, `rse`, `green bonds`, `sustainable investing`, `climate risk`, `esg rating`, etc.

### 9. **Arbitrage/Stratégies Avancées** (Nouveau)
- Arbitrage statistique, pairs trading
- Market neutral, long/short
- Relative value, spread trading
- Mean reversion, momentum
- Trading quantitatif, algorithmique
- High frequency trading (HFT)

**Keywords**: `arbitrage`, `pairs trading`, `statistical arbitrage`, `market neutral`, `quantitative strategy`, `algorithmic trading`, `hft`, etc.

### 10. **Méthodologies d'Analyse** (Nouveau)
- DCF, multiples de valorisation
- Entreprises comparables, peer group
- Transactions précédentes
- Sum of parts, SOTP
- Modèles LBO, acquisition
- Financial modeling, pro forma
- Tableaux de sensibilité

**Keywords**: `méthodologie`, `dcf`, `multiples`, `comparable companies`, `comps`, `financial modeling`, `pro forma`, `sensitivity table`, etc.

### 11. **M&A/Fusions-Acquisitions** (Nouveau)
- Fusions, acquisitions, takeovers
- OPA, OPE, offre publique
- Merger arbitrage
- Due diligence, synergies
- Prime d'acquisition, multiples de transaction

**Keywords**: `fusion`, `acquisition`, `m&a`, `merger`, `takeover`, `opa`, `due diligence`, `synergy`, `acquisition premium`, etc.

### 12. **IPO/Introduction en Bourse** (Nouveau)
- Introduction en bourse, going public
- IPO pricing, valorisation IPO
- Underpricing, performance IPO
- Lock-up period, roadshow
- Book building, allocation IPO

**Keywords**: `ipo`, `introduction en bourse`, `going public`, `ipo pricing`, `ipo valuation`, `lock up period`, `roadshow`, etc.

### 13. **Gestion de Risque Avancée** (Nouveau)
- VaR, CVaR, Value at Risk
- Stress testing, analyse de scénarios
- Métriques de risque (Sharpe, Sortino, Calmar)
- Max drawdown, tracking error
- Risque systématique, idiosyncratique
- Tail risk, black swan

**Keywords**: `risk management`, `var`, `value at risk`, `cvar`, `stress testing`, `sharpe ratio`, `max drawdown`, `tail risk`, etc.

### 14. **Behavioral Finance** (Nouveau)
- Finance comportementale
- Psychologie des marchés
- Biais cognitifs (confirmation, ancrage)
- FOMO, sentiment de marché
- Comportement grégaire, surconfiance

**Keywords**: `behavioral finance`, `finance comportementale`, `psychologie des marchés`, `cognitive bias`, `fomo`, `market sentiment`, etc.

### 15. **Produits Structurés** (Nouveau)
- Structured products, notes structurées
- Capital protégé, principal protected
- Autocallable, barrier options
- Knock in, knock out
- Produits liés au marché (equity, commodity, currency)

**Keywords**: `structured products`, `produits structurés`, `structured note`, `capital protégé`, `autocallable`, `barrier option`, etc.

### 16. **Commodities** (Enrichi)
- Ajout de plus de matières premières spécifiques
- Indices de commodities (GCI)
- Contango, backwardation

**Keywords**: `crude oil`, `wti`, `brent`, `gold`, `silver`, `platinum`, `commodity index`, etc.

## 📊 Impact sur le Système

### Fichiers Modifiés

1. **`/api/emma-agent.js`**
   - Méthode `_shouldUsePerplexityOnly()` enrichie avec 16 nouveaux domaines
   - Plus de 500 nouveaux keywords ajoutés
   - Logique de routage améliorée pour chaque domaine

2. **`/lib/utils/ticker-extractor.js`**
   - Méthode `isNonTickerQuestion()` enrichie
   - Ajout des mêmes domaines pour éviter les faux positifs de tickers
   - Protection contre l'extraction erronée de tickers dans ces contextes

3. **`/lib/intent-analyzer.js`**
   - 16 nouveaux intents ajoutés
   - Mapping keywords → intent pour meilleure classification
   - Confidences ajustées selon la spécificité de chaque domaine

## 🔄 Logique de Routage

### Perplexity Seul (Connaissances Générales)
Ces domaines utilisent **uniquement Perplexity** car :
- Questions conceptuelles ou explicatives
- Données historiques ou générales disponibles via Perplexity
- Pas besoin de données temps réel précises
- Analyses qualitatives plutôt que quantitatives

**Exemples** :
- "Comment fonctionne un warrant ?"
- "Qu'est-ce que l'arbitrage statistique ?"
- "Explique-moi la méthodologie DCF"
- "Quels sont les principes ESG ?"

### APIs Nécessaires (Données Temps Réel)
Ces cas nécessitent des **APIs complémentaires** :
- Prix en temps réel précis
- Ratios financiers exacts
- Indicateurs techniques spécifiques
- Données utilisateur (watchlist, historique)
- Courbes de taux structurées

**Exemples** :
- "Prix actuel de AAPL"
- "P/E ratio de MSFT vs GOOGL"
- "RSI de TSLA sur 14 jours"
- "Ma watchlist aujourd'hui"

## 🎯 Bénéfices

1. **Précision Améliorée**
   - Moins de faux positifs de tickers
   - Meilleure identification du type de question
   - Routage optimal vers la bonne source de données

2. **Couverture Élargie**
   - 16 nouveaux domaines financiers couverts
   - Plus de 500 nouveaux keywords
   - Support pour questions avancées et spécialisées

3. **Performance Optimisée**
   - Évite les appels API inutiles pour questions conceptuelles
   - Utilise Perplexity efficacement pour connaissances générales
   - Réserve les APIs pour données temps réel précises

4. **Expérience Utilisateur**
   - Réponses plus pertinentes et complètes
   - Moins d'erreurs d'interprétation
   - Support pour un éventail beaucoup plus large de questions

## 📝 Exemples de Questions Maintenant Supportées

### Forex
- "Quel est le taux de change USD/CAD actuel ?"
- "Explique-moi le carry trade"
- "Quels sont les risques de change pour les entreprises exportatrices ?"

### Obligations
- "Quelle est la différence entre high yield et investment grade ?"
- "Comment calculer le yield to maturity ?"
- "Qu'est-ce que la duration d'une obligation ?"

### Private Equity
- "Comment fonctionne un LBO ?"
- "Qu'est-ce qu'une série A de financement ?"
- "Explique-moi la valorisation d'une startup"

### Calculs Financiers
- "Comment calculer la VAN d'un projet ?"
- "Explique-moi la méthodologie DCF"
- "Qu'est-ce que le WACC et comment le calculer ?"

### ESG
- "Qu'est-ce que l'investissement ESG ?"
- "Comment évaluer le risque climatique d'une entreprise ?"
- "Explique-moi les obligations vertes"

### Arbitrage
- "Qu'est-ce que l'arbitrage statistique ?"
- "Comment fonctionne le pairs trading ?"
- "Explique-moi les stratégies market neutral"

## 🔮 Prochaines Étapes Possibles

1. **Tests de Validation**
   - Tester chaque nouveau domaine avec des questions réelles
   - Vérifier la précision de la détection
   - Valider le routage Perplexity vs APIs

2. **Affinements**
   - Ajuster les keywords selon les retours utilisateurs
   - Optimiser les confidences des intents
   - Améliorer les exceptions (ex: courbe des taux)

3. **Documentation Utilisateur**
   - Créer un guide des types de questions supportées
   - Exemples par domaine
   - Best practices pour poser des questions à Emma

## ✅ Statut

**Terminé** - Tous les domaines ont été ajoutés et intégrés dans le système de détection.

---

*Dernière mise à jour : Novembre 2025*
