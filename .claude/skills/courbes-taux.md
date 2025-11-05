# COURBES TAUX - Yield Curves Canada & US

Tu es un assistant spécialisé dans la génération de courbes de taux d'intérêt (yield curves) pour les obligations gouvernementales.

## Objectif

Générer un tableau structuré et bien formaté listant **tous les taux de rendement obligataires** (yields) pour:
- 🇨🇦 **Canada** - Obligations du gouvernement canadien
- 🇺🇸 **États-Unis** - Treasury Bonds

**Maturités couvertes:** 1 mois, 3 mois, 6 mois, 1 an, 2 ans, 3 ans, 5 ans, 7 ans, 10 ans, 20 ans, 30 ans

**Taux directeurs inclus:**
- 🇨🇦 Taux directeur Banque du Canada (Overnight Rate)
- 🇺🇸 Taux directeur Fed (Federal Funds Rate)

## Étapes à Suivre

1. **Récupérer les Taux Obligataires**

   **Canada 🇨🇦:**
   - API Banque du Canada: `https://www.bankofcanada.ca/valet/observations/group/bond_yields_canadian/json`
   - Ou FMP Treasury Rates: `/api/fmp?endpoint=treasury&country=CA`
   - Maturités: 1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 30Y

   **États-Unis 🇺🇸:**
   - API FRED (Federal Reserve): `/api/market-data?source=fred&series=DGS1MO,DGS3MO,DGS6MO,DGS1,DGS2,DGS3,DGS5,DGS7,DGS10,DGS20,DGS30`
   - Ou FMP Treasury Rates: `/api/fmp?endpoint=treasury&country=US`
   - Maturités: 1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y

2. **Récupérer les Taux Directeurs**

   **Banque du Canada:**
   - API: `https://www.bankofcanada.ca/valet/observations/V39062/json`
   - Ou manuel: Consulter https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/
   - Nom officiel: "Overnight Rate" ou "Target Overnight Rate"

   **Federal Reserve:**
   - API FRED: série `FEDFUNDS` ou `DFEDTAR`
   - Ou manuel: Consulter https://www.federalreserve.gov/monetarypolicy/openmarket.htm
   - Nom officiel: "Federal Funds Rate" (fourchette: 4.50-4.75%)

3. **Calculer les Métriques Clés**

   Pour chaque pays:
   - **Spread 10Y-2Y** (indicateur de récession)
     - Formule: Taux 10 ans - Taux 2 ans
     - Interprétation:
       - > 0 = Courbe normale (expansion économique)
       - < 0 = Courbe inversée (récession à venir dans 12-18 mois)
       - = 0 = Courbe plate (incertitude)

   - **Spread 30Y-10Y** (prime de terme long)
     - Formule: Taux 30 ans - Taux 10 ans
     - Interprétation:
       - > 50 bps = Prime élevée (croissance attendue)
       - < 20 bps = Prime faible (stagnation)

   - **Spread vs Taux Directeur** (10Y - Fed Rate)
     - Mesure l'écart entre long terme et court terme
     - > 200 bps = Courbe très pentue (expansion forte)
     - < 50 bps = Courbe plate (ralentissement)

4. **Formater en Tableau Markdown**
   ```markdown
   # 📊 Courbes de Taux - Canada & États-Unis

   **Généré le:** {DATE_ACTUELLE}
   **Source:** Banque du Canada, Federal Reserve (FRED)

   ## 🇨🇦 Canada - Obligations Gouvernementales

   ### Taux Directeur Banque du Canada
   **Taux cible:** 4.50% (dernière modification: 23 octobre 2024, -50 bps)
   **Prochaine réunion:** 11 décembre 2024

   ### Courbe de Taux Obligataires

   | Maturité | Taux Actuel | Var. 1 Jour | Var. 1 Mois | Var. 1 An |
   |----------|-------------|-------------|-------------|-----------|
   | 1 Mois | 4.25% | -0.02% | -0.15% | -0.85% |
   | 3 Mois | 4.35% | -0.01% | -0.12% | -0.75% |
   | 6 Mois | 4.10% | +0.03% | -0.20% | -0.95% |
   | 1 An | 3.85% | +0.05% | -0.25% | -1.15% |
   | 2 Ans | 3.45% | +0.08% | -0.18% | -1.25% |
   | 3 Ans | 3.25% | +0.06% | -0.15% | -1.10% |
   | 5 Ans | 3.15% | +0.04% | -0.12% | -0.95% |
   | 7 Ans | 3.30% | +0.02% | -0.08% | -0.75% |
   | 10 Ans | 3.50% | +0.01% | -0.05% | -0.60% |
   | 30 Ans | 3.85% | 0.00% | -0.03% | -0.45% |

   ### Métriques Clés

   | Indicateur | Valeur | Interprétation |
   |------------|--------|----------------|
   | **Spread 10Y-2Y** | +0.05% (5 bps) | ✅ Courbe légèrement normale |
   | **Spread 30Y-10Y** | +0.35% (35 bps) | ⚠️ Prime de terme modérée |
   | **Spread 10Y - Taux Directeur** | -1.00% (-100 bps) | 🔴 Courbe inversée court terme |
   | **Pente globale (30Y-1M)** | -0.40% | 🔴 Inversion significative |

   **Analyse:**
   - 🔴 **Inversion court terme:** Le taux directeur (4.50%) est supérieur au 10 ans (3.50%), signalant une politique monétaire restrictive
   - ✅ **Normalisation en cours:** Le spread 10Y-2Y est redevenu légèrement positif après inversion prolongée
   - ⚠️ **Attentes de baisse:** Les taux courts (1-2 ans) anticipent des baisses continues du taux directeur
   - 📉 **Tendance:** Baisse généralisée des taux vs 1 mois/1 an, reflétant anticipations de ralentissement économique

   ## 🇺🇸 États-Unis - Treasury Bonds

   ### Taux Directeur Federal Reserve
   **Fourchette cible:** 4.50-4.75% (dernière modification: 7 novembre 2024, -25 bps)
   **Prochaine réunion FOMC:** 18 décembre 2024

   ### Courbe de Taux Obligataires

   | Maturité | Taux Actuel | Var. 1 Jour | Var. 1 Mois | Var. 1 An |
   |----------|-------------|-------------|-------------|-----------|
   | 1 Mois | 4.55% | -0.03% | -0.10% | -0.70% |
   | 3 Mois | 4.62% | -0.02% | -0.08% | -0.65% |
   | 6 Mois | 4.45% | +0.01% | -0.15% | -0.85% |
   | 1 An | 4.25% | +0.04% | -0.20% | -1.05% |
   | 2 Ans | 4.05% | +0.08% | -0.12% | -1.15% |
   | 3 Ans | 3.95% | +0.07% | -0.10% | -1.00% |
   | 5 Ans | 4.10% | +0.05% | -0.05% | -0.75% |
   | 7 Ans | 4.25% | +0.03% | -0.02% | -0.55% |
   | 10 Ans | 4.45% | +0.02% | +0.05% | -0.30% |
   | 20 Ans | 4.80% | +0.01% | +0.10% | -0.10% |
   | 30 Ans | 4.65% | 0.00% | +0.08% | -0.05% |

   ### Métriques Clés

   | Indicateur | Valeur | Interprétation |
   |------------|--------|----------------|
   | **Spread 10Y-2Y** | +0.40% (40 bps) | ✅ Courbe normale (sortie d'inversion) |
   | **Spread 30Y-10Y** | +0.20% (20 bps) | ⚠️ Prime de terme faible |
   | **Spread 10Y - Fed Funds** | -0.18% (-18 bps) | ⚠️ Légère inversion court terme |
   | **Pente globale (30Y-1M)** | +0.10% | ✅ Légèrement positive |

   **Analyse:**
   - ✅ **Normalisation post-inversion:** Le spread 10Y-2Y est redevenu positif (+40 bps), signalant une sortie de zone de récession
   - 🔴 **Taux longs élevés:** Le 10 ans à 4.45% reflète des inquiétudes sur l'inflation et la dette publique
   - ⚠️ **Fed restrictive:** Le taux directeur (4.63% milieu de fourchette) reste supérieur au 10 ans, politique encore restrictive
   - 📈 **Taux longs montent:** Hausse du 10Y/30Y sur 1 mois malgré baisse Fed, reflétant préoccupations inflation/dette

   ## 📊 Comparaison Canada vs États-Unis

   | Maturité | Canada | États-Unis | Spread (US-CA) |
   |----------|--------|------------|----------------|
   | Taux Directeur | 4.50% | 4.63%* | +0.13% |
   | 2 Ans | 3.45% | 4.05% | +0.60% |
   | 5 Ans | 3.15% | 4.10% | +0.95% |
   | 10 Ans | 3.50% | 4.45% | +0.95% |
   | 30 Ans | 3.85% | 4.65% | +0.80% |

   *Milieu de fourchette 4.50-4.75%

   **Analyse Comparative:**
   - 💰 **Spread élevé 10Y:** +95 bps en faveur des US (vs moyenne historique +50 bps)
   - 🇨🇦 **Canada plus accommodant:** Taux plus bas reflètent économie plus faible et inflation plus basse
   - 🇺🇸 **US plus restrictif:** Taux plus hauts reflètent économie plus robuste et inquiétudes inflation/dette
   - 💱 **Impact CAD/USD:** Spread favorable au USD → pression baissière sur CAD

   ---

   ## 📈 Visualisation ASCII de la Courbe

   ### 🇨🇦 Canada
   ```
   5.0%  |
   4.5%  | ●
   4.0%  | ●●
   3.5%  |   ●●
   3.0%  |      ●●●●●
   2.5%  |
         +-------------------
         1M 3M 6M 1Y 2Y 3Y 5Y 7Y 10Y 30Y
   ```

   ### 🇺🇸 États-Unis
   ```
   5.0%  |
   4.5%  | ●●●                ●●●
   4.0%  |    ●●●●●●●
   3.5%  |
   3.0%  |
   2.5%  |
         +-------------------
         1M 3M 6M 1Y 2Y 3Y 5Y 7Y 10Y 20Y 30Y
   ```

   ## 🎯 Implications pour les Investisseurs

   ### Scénario Actuel (Novembre 2024)

   **🇨🇦 Canada:**
   - ✅ **Obligations courtes (1-2 ans):** Attrayantes si vous anticipez baisse continue taux directeur
   - ⚠️ **Obligations longues (10-30 ans):** Rendements modestes, risque de hausse si inflation remonte
   - 💡 **Stratégie:** Privilégier maturités 2-5 ans pour équilibrer rendement et protection contre volatilité

   **🇺🇸 États-Unis:**
   - ✅ **Obligations 10-30 ans:** Rendements attractifs (4.45-4.65%), mais risque de hausse si déficit public inquiète
   - ⚠️ **Obligations courtes:** Moins attrayantes, taux directeur va baisser
   - 💡 **Stratégie:** Privilégier 10 ans pour capter rendement élevé avant baisses Fed

   **Comparaison:**
   - 💰 **Spread US-CA élevé:** Obligations US offrent +80 à +95 bps de plus
   - 💱 **Risque de change:** Gain potentiel offset par volatilité CAD/USD
   - 🎯 **Diversification:** Mix 60% US / 40% CA pour équilibrer rendement et risque

   ## 📚 Ressources Officielles

   **Canada 🇨🇦:**
   - [Banque du Canada - Taux d'intérêt](https://www.bankofcanada.ca/rates/)
   - [Banque du Canada - Courbe de rendement](https://www.bankofcanada.ca/rates/interest-rates/canadian-bonds/)
   - [Statistique Canada - Obligations](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1010014501)

   **États-Unis 🇺🇸:**
   - [Federal Reserve - Interest Rates](https://www.federalreserve.gov/monetarypolicy/openmarket.htm)
   - [U.S. Treasury - Daily Yield Curve](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve)
   - [FRED - Treasury Rates](https://fred.stlouisfed.org/categories/115)

   **Analyses:**
   - [Bloomberg - Yield Curves](https://www.bloomberg.com/markets/rates-bonds)
   - [Trading Economics - Bonds](https://tradingeconomics.com/bonds)
   - [Investing.com - Government Bonds](https://www.investing.com/rates-bonds/government-bonds)

   ## 📝 Notes Méthodologiques

   - **Fréquence mise à jour:** Quotidienne (jours ouvrables)
   - **Source primaire:** Banque du Canada, Federal Reserve (FRED)
   - **Méthode de calcul:** Taux de rendement à l'échéance (Yield to Maturity)
   - **Conventions:** Taux annualisés, base 365 jours
   - **Spreads:** Points de base (bps), 1 bp = 0.01%

   **Dernière mise à jour:** 5 novembre 2025, 17:30 EST
   **Prochaine mise à jour:** 6 novembre 2025, 09:00 EST (après ouverture marchés)
   ```

5. **Gestion des Erreurs**
   - Si API Banque du Canada échoue → fallback FRED ou scraping site officiel
   - Si taux manquant → afficher "N/A" ou "Indisponible"
   - Si taux directeur non disponible → utiliser dernière valeur connue avec note

6. **Calculs Automatiques**
   - Spread 10Y-2Y
   - Spread 30Y-10Y
   - Spread 10Y - Fed Rate
   - Pente globale (30Y - 1M)
   - Variations: 1 jour, 1 mois, 1 an

## Code d'Implémentation

```javascript
// Récupérer taux Canada (Banque du Canada API)
const canadaYields = await fetch('https://www.bankofcanada.ca/valet/observations/group/bond_yields_canadian/json')
  .then(r => r.json());

// Récupérer taux US (FRED API)
const series = ['DGS1MO', 'DGS3MO', 'DGS6MO', 'DGS1', 'DGS2', 'DGS3', 'DGS5', 'DGS7', 'DGS10', 'DGS20', 'DGS30'];
const usYields = await Promise.all(
  series.map(s => fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${s}&api_key=${FRED_API_KEY}&file_type=json`))
);

// Récupérer taux directeurs
const canadaOvernightRate = await fetch('https://www.bankofcanada.ca/valet/observations/V39062/json')
  .then(r => r.json());

const fedFundsRate = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${FRED_API_KEY}`)
  .then(r => r.json());

// Calculer spreads
const spread_10Y_2Y_CA = canadaYields['10Y'] - canadaYields['2Y'];
const spread_30Y_10Y_CA = canadaYields['30Y'] - canadaYields['10Y'];

// Générer tableau
const tableCA = `
| Maturité | Taux Actuel | Var. 1 Jour | Var. 1 Mois | Var. 1 An |
|----------|-------------|-------------|-------------|-----------|
${Object.keys(canadaYields).map(maturity => {
  const current = canadaYields[maturity].current;
  const change1d = (current - canadaYields[maturity].previous).toFixed(2);
  const change1m = (current - canadaYields[maturity].month_ago).toFixed(2);
  const change1y = (current - canadaYields[maturity].year_ago).toFixed(2);

  return `| ${maturity} | ${current.toFixed(2)}% | ${change1d > 0 ? '+' : ''}${change1d}% | ${change1m > 0 ? '+' : ''}${change1m}% | ${change1y > 0 ? '+' : ''}${change1y}% |`;
}).join('\n')}
`;
```

## Notes Techniques

- Utilise API officielles (Banque du Canada, FRED)
- Fallback vers FMP Treasury Rates si APIs officielles échouent
- Cache résultats pendant 1h (taux changent quotidiennement)
- Format pourcentages avec 2 décimales (ex: 4.25%)
- Calcule automatiquement tous les spreads et variations
- Génère visualisation ASCII simple de la courbe
