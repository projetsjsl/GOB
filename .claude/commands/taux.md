Utilise le skill **Courbe des Taux** d'Emma pour afficher les taux obligataires US et Canada avec analyse de la courbe.

**OBJECTIF**: Afficher courbe des taux (yield curve) avec taux obligataires, spreads clés et signaux de récession.

**PAYS COUVERTS**:
- 🇺🇸 États-Unis (US Treasury Bonds)
- 🇨🇦 Canada (Obligations gouvernementales)

**MATURITÉS ANALYSÉES**:
- Court terme: 1M, 3M, 6M, 1Y
- Moyen terme: 2Y, 3Y, 5Y, 7Y
- Long terme: 10Y, 20Y, 30Y

**TAUX DIRECTEURS**:
- 🇨🇦 Banque du Canada - Overnight Rate
- 🇺🇸 Federal Reserve - Fed Funds Rate

**MÉTRIQUES CLÉS**:
- **Spread 10Y-2Y**: Indicateur de récession (inversion = récession à venir)
- **Spread 30Y-10Y**: Prime de terme long
- **Spread 10Y - Fed Rate**: Écart politique monétaire
- **Pente globale**: 30Y - 1M

**INSTRUCTIONS**:
1. Récupérer données de taux obligataires via:
   - API Banque du Canada (Canada)
   - API FRED - Federal Reserve (États-Unis)
   - Fallback: FMP Treasury Rates
2. Récupérer taux directeurs actuels
3. Calculer tous les spreads automatiquement
4. Analyser:
   - Inversion de courbe (récession indicator)
   - Position vs taux directeur
   - Comparaison US vs Canada
   - Implications pour investisseurs
5. Intégrer graphique TradingView pour visualisation
6. Présenter avec tableau structuré et interprétations

**GRAPHIQUE TRADINGVIEW**:
- Lien permanent: https://www.tradingview.com/x/YjJn9ihm/
- Widget interactif si disponible
- Afficher courbes US et Canada superposées

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
📊 COURBE DES TAUX - Canada & États-Unis

Généré le: 7 novembre 2025, 15h45 EST
Source: Banque du Canada, Federal Reserve (FRED)

📈 GRAPHIQUE INTERACTIF
🔗 TradingView: https://www.tradingview.com/x/YjJn9ihm/
[Afficher courbes US et Canada en temps réel]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🇨🇦 CANADA - Obligations Gouvernementales

🏦 TAUX DIRECTEUR BANQUE DU CANADA
Taux cible: 4.50%
Dernière modification: 23 octobre 2024 (-50 bps)
Prochaine réunion: 11 décembre 2024

📊 COURBE DE TAUX

| Maturité | Taux    | Var. 1J  | Var. 1M  | Var. 1A  |
|----------|---------|----------|----------|----------|
| 1 Mois   | 4.25%   | -0.02%   | -0.15%   | -0.85%   |
| 3 Mois   | 4.35%   | -0.01%   | -0.12%   | -0.75%   |
| 6 Mois   | 4.10%   | +0.03%   | -0.20%   | -0.95%   |
| 1 An     | 3.85%   | +0.05%   | -0.25%   | -1.15%   |
| 2 Ans    | 3.45%   | +0.08%   | -0.18%   | -1.25%   |
| 3 Ans    | 3.25%   | +0.06%   | -0.15%   | -1.10%   |
| 5 Ans    | 3.15%   | +0.04%   | -0.12%   | -0.95%   |
| 7 Ans    | 3.30%   | +0.02%   | -0.08%   | -0.75%   |
| 10 Ans   | 3.50%   | +0.01%   | -0.05%   | -0.60%   |
| 30 Ans   | 3.85%   | 0.00%    | -0.03%   | -0.45%   |

🎯 MÉTRIQUES CLÉS

| Indicateur                    | Valeur        | Signal |
|-------------------------------|---------------|--------|
| Spread 10Y-2Y                 | +0.05% (5 bps)  | ✅ Courbe légèrement normale |
| Spread 30Y-10Y                | +0.35% (35 bps) | ⚠️ Prime de terme modérée |
| Spread 10Y - Taux Directeur   | -1.00% (-100 bps) | 🔴 Inversion court terme |
| Pente globale (30Y-1M)        | -0.40%        | 🔴 Inversion significative |

📊 ANALYSE CANADA:

🔴 INVERSION COURT TERME
Le taux directeur (4.50%) est supérieur au 10 ans (3.50%), signalant politique monétaire restrictive.

✅ NORMALISATION EN COURS
Le spread 10Y-2Y est redevenu légèrement positif (+5 bps) après inversion prolongée. Signal de sortie de zone de récession.

⚠️ ATTENTES DE BAISSE
Les taux courts (1-2 ans) anticipent des baisses continues du taux directeur BoC dans les prochains mois.

📉 TENDANCE GÉNÉRALE
Baisse généralisée des taux vs 1 an, reflétant anticipations de ralentissement économique canadien.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🇺🇸 ÉTATS-UNIS - Treasury Bonds

🏦 TAUX DIRECTEUR FEDERAL RESERVE
Fourchette cible: 4.50-4.75% (milieu: 4.625%)
Dernière modification: 7 novembre 2024 (-25 bps)
Prochaine réunion FOMC: 18 décembre 2024

📊 COURBE DE TAUX

| Maturité | Taux    | Var. 1J  | Var. 1M  | Var. 1A  |
|----------|---------|----------|----------|----------|
| 1 Mois   | 4.55%   | -0.03%   | -0.10%   | -0.70%   |
| 3 Mois   | 4.62%   | -0.02%   | -0.08%   | -0.65%   |
| 6 Mois   | 4.45%   | +0.01%   | -0.15%   | -0.85%   |
| 1 An     | 4.25%   | +0.04%   | -0.20%   | -1.05%   |
| 2 Ans    | 4.05%   | +0.08%   | -0.12%   | -1.15%   |
| 3 Ans    | 3.95%   | +0.07%   | -0.10%   | -1.00%   |
| 5 Ans    | 4.10%   | +0.05%   | -0.05%   | -0.75%   |
| 7 Ans    | 4.25%   | +0.03%   | -0.02%   | -0.55%   |
| 10 Ans   | 4.45%   | +0.02%   | +0.05%   | -0.30%   |
| 20 Ans   | 4.80%   | +0.01%   | +0.10%   | -0.10%   |
| 30 Ans   | 4.65%   | 0.00%    | +0.08%   | -0.05%   |

🎯 MÉTRIQUES CLÉS

| Indicateur                    | Valeur        | Signal |
|-------------------------------|---------------|--------|
| Spread 10Y-2Y                 | +0.40% (40 bps) | ✅ Courbe normale (sortie d'inversion) |
| Spread 30Y-10Y                | +0.20% (20 bps) | ⚠️ Prime de terme faible |
| Spread 10Y - Fed Funds        | -0.18% (-18 bps) | ⚠️ Légère inversion court terme |
| Pente globale (30Y-1M)        | +0.10%        | ✅ Légèrement positive |

📊 ANALYSE ÉTATS-UNIS:

✅ NORMALISATION POST-INVERSION
Le spread 10Y-2Y est redevenu positif (+40 bps), signalant sortie de zone de récession. Historiquement, cela précède reprise économique dans 6-12 mois.

🔴 TAUX LONGS ÉLEVÉS
Le 10 ans à 4.45% et le 30 ans à 4.65% restent élevés, reflétant inquiétudes sur inflation persistante et déficit public croissant.

⚠️ FED RESTRICTIVE
Le taux directeur (4.625% milieu de fourchette) reste supérieur au 10 ans (4.45%), indiquant politique monétaire encore restrictive malgré baisse récente.

📈 TAUX LONGS EN HAUSSE
Hausse du 10Y/30Y sur 1 mois (+5 bps, +8 bps) malgré baisse Fed. Marché anticipe inflation durable et déficit élevé sous nouvelle administration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌍 COMPARAISON USA vs CANADA

| Maturité       | 🇨🇦 Canada | 🇺🇸 USA  | Spread (US-CA) |
|----------------|------------|----------|----------------|
| Taux Directeur | 4.50%      | 4.625%*  | +0.125%        |
| 2 Ans          | 3.45%      | 4.05%    | +0.60%         |
| 5 Ans          | 3.15%      | 4.10%    | +0.95%         |
| 10 Ans         | 3.50%      | 4.45%    | +0.95%         |
| 30 Ans         | 3.85%      | 4.65%    | +0.80%         |

*Milieu de fourchette 4.50-4.75%

📊 ANALYSE COMPARATIVE:

💰 SPREAD ÉLEVÉ 10Y
+95 bps en faveur des US (vs moyenne historique +50 bps). Obligations américaines offrent rendement significativement supérieur.

🇨🇦 CANADA PLUS ACCOMMODANT
Taux plus bas reflètent:
• Économie plus faible (croissance GDP inférieure)
• Inflation mieux contrôlée (2.5% vs 3.2% US)
• BoC plus agressive sur baisses de taux

🇺🇸 USA PLUS RESTRICTIF
Taux plus hauts reflètent:
• Économie plus robuste
• Inflation persistante
• Inquiétudes déficit public ($2T/an)
• Safe-haven demand (USD reserve currency)

💱 IMPACT CAD/USD
Spread de +95 bps favorable au USD crée pression baissière sur CAD. Opportunité arbitrage pour investisseurs canadiens (hedger risque de change).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 VISUALISATION ASCII

🇨🇦 CANADA (Courbe inversée court terme)
5.0% |
4.5% | ●●
4.0% |   ●●
3.5% |     ●●
3.0% |       ●●●●●
2.5% |
     +─────────────────────
     1M 3M 6M 1Y 2Y 3Y 5Y 7Y 10Y 30Y

🇺🇸 USA (Courbe normalisée)
5.0% |
4.5% | ●●●              ●●●●●
4.0% |    ●●●●●●●●
3.5% |
3.0% |
2.5% |
     +─────────────────────────
     1M 3M 6M 1Y 2Y 3Y 5Y 7Y 10Y 20Y 30Y

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 IMPLICATIONS POUR INVESTISSEURS

🇨🇦 STRATÉGIE CANADA:

✅ OBLIGATIONS 2-5 ANS
Sweet spot actuel. Rendement 3.15-3.45%, protection contre volatilité, bénéfice des baisses BoC à venir.

⚠️ OBLIGATIONS COURTES (< 2 ANS)
Éviter. Taux vont baisser avec BoC, capital gain limité.

⚠️ OBLIGATIONS LONGUES (> 10 ANS)
Rendements modestes (3.50-3.85%), risque de hausse si inflation remonte. Pas attractif.

💡 RECOMMENDATION: Duration 3-5 ans pour équilibrer rendement et risque.

🇺🇸 STRATÉGIE ÉTATS-UNIS:

✅ OBLIGATIONS 10-30 ANS
Rendements attractifs (4.45-4.65%), verrouiller avant nouvelles baisses Fed. Risque: déficit public.

⚠️ OBLIGATIONS COURTES (< 5 ANS)
Moins attractif, taux directeur va baisser. Capital gain limité.

⚠️ TIPS (INFLATION-PROTECTED)
Considérer si inflation remonte (tarifs, déficit). Protection downside.

💡 RECOMMENDATION: Duration 7-10 ans pour capter rendement élevé.

🌍 ALLOCATION MULTI-PAYS:

Portefeuille suggéré:
• 60% US Treasuries (10-30 ans) → Rendement supérieur
• 40% Canada (3-5 ans) → Diversification, bénéfice baisses BoC
• Hedger 50% du risque CAD/USD si investisseur canadien

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔔 SIGNAUX DE RÉCESSION

🇨🇦 CANADA:
⚠️ MIXED SIGNALS
• Spread 10Y-2Y: +5 bps (légèrement positif, bon signe)
• Inversion court terme (10Y < Fed Rate): Restrictif
• Verdict: Ralentissement mais pas récession imminente

🇺🇸 ÉTATS-UNIS:
✅ SORTIE DE ZONE DANGER
• Spread 10Y-2Y: +40 bps (normalisé)
• Historique: Récession survient 6-18 mois APRÈS fin inversion
• Verdict: Risque récession diminué, expansion possible 2025

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 RESSOURCES

🇨🇦 Canada:
• Banque du Canada: https://www.bankofcanada.ca/rates/
• Courbe de rendement: https://www.bankofcanada.ca/rates/interest-rates/canadian-bonds/

🇺🇸 États-Unis:
• Federal Reserve: https://www.federalreserve.gov/monetarypolicy/
• US Treasury: https://home.treasury.gov/resource-center/data-chart-center/interest-rates
• FRED: https://fred.stlouisfed.org/categories/115

📊 Visualisation:
• TradingView: https://www.tradingview.com/x/YjJn9ihm/
• Bloomberg: https://www.bloomberg.com/markets/rates-bonds
• Investing.com: https://www.investing.com/rates-bonds/government-bonds

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ AVERTISSEMENT

Les taux obligataires changent quotidiennement. Cette analyse est basée sur données du 7 novembre 2025 et ne constitue pas un conseil financier personnalisé. Consultez un conseiller financier pour décisions d'investissement.

Dernière mise à jour: 7 novembre 2025, 15h45 EST
Prochaine mise à jour: 8 novembre 2025, 09h00 EST
```

**FORMAT COURT (SMS)**:
```
🇨🇦 CA: 2Y 3.45% | 10Y 3.50% | Spread +5bps ✅
🇺🇸 US: 2Y 4.05% | 10Y 4.45% | Spread +40bps ✅
Spread US-CA: +95bps | Fed 4.625% | BoC 4.50%
📈 TradingView: https://www.tradingview.com/x/YjJn9ihm/
```

**INTERPRÉTATIONS CLÉS**:

**Spread 10Y-2Y**:
- Positif (> 0): Courbe normale, expansion économique
- Négatif (< 0): Courbe inversée, récession dans 12-18 mois
- Zéro: Courbe plate, incertitude

**Inversion de Courbe**:
- Signal de récession le plus fiable (8/8 dernières récessions US)
- Délai typique: 6-18 mois après début inversion
- Sortie d'inversion = reprise possible dans 6-12 mois

**GESTION D'ERREURS**:
- Si API down: Utiliser dernières données connues avec timestamp
- Si taux manquant: Afficher "N/A" avec note
- Si graphique TradingView inaccessible: Lien vers alternatives (Bloomberg, Investing.com)

**TON**: Analytique, professionnel, avec recommandations actionnables mais prudentes.

**EXEMPLES D'UTILISATION**:
- "Courbe des taux"
- "Taux obligataires US et Canada"
- "Spread 10Y-2Y"
- "Inversion courbe de taux"
- "Rendements obligations US"
- "Taux directeur Fed et BoC"
