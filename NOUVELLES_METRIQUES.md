# Nouvelles Métriques Avancées - IntelliStocks

## ✅ Modifications apportées

### 1. Nouveaux appels API FMP
- `income-statement` (5 ans)
- `balance-sheet-statement` (5 ans)
- `cash-flow-statement` (5 ans)
- `historical-price-full` (5 ans - 1825 jours)
- `technical_indicator` (RSI)

### 2. Nouvelles métriques calculées

#### A. RSI Indicators
- **RSI(14)** : Indicateur de momentum sur 14 périodes
- **RSI(2)** : Indicateur de momentum court terme sur 2 périodes
- Interprétation : <30 survendu, >70 suracheté

#### B. Financial Strength Score (0-100)
Basé sur 4 piliers égaux (25 pts chacun) :
1. **Debt to Equity** : <0.3 = 25pts, <0.7 = 20pts, <1.5 = 15pts
2. **Current Ratio** : >2.5 = 25pts, >2 = 20pts, >1.5 = 15pts
3. **ROE** : >20% = 25pts, >15% = 20pts, >10% = 15pts
4. **Net Profit Margin** : >20% = 25pts, >15% = 20pts, >10% = 15pts

**Interprétation** :
- 90-100 : Excellent (Forteresse financière)
- 75-89 : Très bon (Solide)
- 60-74 : Bon (Sain)
- 40-59 : Moyen (Attention)
- 0-39 : Faible (Risque élevé)

#### C. Earning Predictability Score (0-100)
Basé sur le coefficient de variation (CV) des bénéfices sur 5 ans :
- CV < 10% : Score 100 (Très prévisible)
- CV < 20% : Score 85 (Prévisible)
- CV < 30% : Score 70 (Assez prévisible)
- CV < 50% : Score 50 (Modéré)
- CV < 75% : Score 30 (Volatile)
- CV > 75% : Score 15 (Très volatile)

#### D. P/E vs Historique
- **P/E actuel** : Prix actuel / EPS actuel
- **P/E moyen 5 ans** : Moyenne des 8 derniers trimestres
- **Écart** : % de différence
- **Interprétation** :
  - < -20% : Sous-évalué
  - -20% à +20% : Juste valorisé
  - > +20% : Sur-évalué

#### E. Price/FCF vs Historique
- **Price/FCF actuel** : Market Cap / Free Cash Flow actuel
- **Price/FCF moyen 5 ans** : Moyenne historique
- **Écart** : % de différence
- **Interprétation** :
  - < -15% : Potentiel de hausse
  - -15% à +15% : Valorisation équilibrée
  - > +15% : Prix élevé

#### F. Performance depuis le plus bas 5 ans
- **Plus bas 5 ans** : Prix le plus bas sur les 5 dernières années
- **Prix actuel** : Prix en temps réel
- **Performance** : % de gain depuis le bottom
- **Interprétation** :
  - < 50% : Toujours proche du bottom
  - 50-100% : Récupération modérée
  - 100-200% : Bonne récupération
  - > 200% : Forte progression

### 3. Nouveaux filtres du screener

Ajout de 5 nouveaux filtres :
1. **Dividende Min (%)** : Filtre par rendement de dividende minimum
2. **Financial Strength Min** : Score de solidité financière minimum (0-100)
3. **RSI Max** : RSI maximum pour trouver les survendus
4. **RSI Min** : RSI minimum pour éviter les surachetés
5. **Marge Nette Min (%)** : Rentabilité minimum

Total : **10 filtres** disponibles (5 existants + 5 nouveaux)

### 4. Sections UI à ajouter

#### Section "Financial Highlights" (Derniers résultats)
- Revenu Q4 vs Q3 vs Y-1
- Bénéfice net Q4 vs Q3 vs Y-1
- Free Cash Flow Q4 vs Q3 vs Y-1
- EPS Q4 vs Q3 vs Y-1
- Tendances avec flèches et couleurs

#### Section "Analyse Comparative 5 ans"
- Graphiques de croissance revenue/EPS/FCF
- CAGR (Compound Annual Growth Rate)
- Tendances et stabilité

#### Section "Scores de Qualité"
- Financial Strength Score avec jauge
- Earning Predictability Score avec jauge
- Interprétations textuelles

#### Section "Valuation Multiples"
- P/E actuel vs historique (graphique)
- Price/FCF actuel vs historique (graphique)
- Indicateurs de sur/sous-évaluation

#### Section "Performance & Momentum"
- Plus bas 5 ans vs aujourd'hui
- Performance depuis le bottom
- RSI(14) et RSI(2) avec zones de surachat/survente

## Prochaines étapes

1. Créer les sections UI dans IntelliStocks
2. Ajouter les nouveaux filtres au screener
3. Afficher les graphiques comparatifs 5 ans
4. Tester avec des données réelles

## Notes techniques

- Les calculs sont faits côté client pour éviter la surcharge serveur
- Fallback sur des estimations si les données API sont manquantes
- Toutes les métriques sont mises à jour en temps réel lors du refresh
