Utilise le skill **FMP Fundamentals** d'Emma pour obtenir l'analyse fondamentale complète d'une entreprise.

**OBJECTIF**: Analyser la santé financière et les fondamentaux d'une entreprise (profil, métriques, ratios).

**PARAMÈTRES**:
- **ticker** (requis): Symbole de l'action

**DONNÉES RETOURNÉES**:
- **Profil entreprise**: Nom, secteur, industrie, description
- **Métriques clés**: Revenue, Net Income, EPS, Free Cash Flow, Market Cap
- **Ratios financiers**: P/E, P/B, P/S, ROE, ROA, Debt/Equity, Current Ratio
- **Dividendes**: Yield, payout ratio, historique
- **Santé financière**: Scoring (Strong, Good, Fair, Weak)

**INSTRUCTIONS**:
1. Demande à Emma d'utiliser les tools:
   - `fmp-fundamentals` (profil entreprise)
   - `fmp-key-metrics` (métriques financières)
   - `fmp-ratios` (ratios financiers)
2. Synthétise les données en analyse cohérente
3. Compare aux moyennes du secteur si disponible
4. Identifie forces et faiblesses
5. Donne score de santé financière (0-100)

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
📊 ANALYSE FONDAMENTALE: AAPL (Apple Inc.)

🏢 PROFIL ENTREPRISE
Secteur: Technology
Industrie: Consumer Electronics
CEO: Tim Cook
Employés: 164,000
Fondée: 1976

📈 MÉTRIQUES CLÉS (TTM)
Revenue: $383.3B (+2.1% YoY)
Net Income: $97.0B (+5.8% YoY)
EPS: $6.13
Free Cash Flow: $99.6B
Market Cap: $2.78T

📊 RATIOS FINANCIERS
Valorisation:
• P/E: 29.1 (vs secteur: 26.5) ⚠️ Légèrement élevé
• P/B: 47.8 (vs secteur: 8.2) ⚠️ Premium significatif
• P/S: 7.25

Profitabilité:
• Marge nette: 25.3% ✅ Excellent
• ROE: 147.4% ✅ Exceptionnel
• ROA: 27.8% ✅ Très bon

Santé financière:
• Debt/Equity: 1.96 ⚠️ Endettement modéré
• Current Ratio: 0.98 ⚠️ Liquidité juste
• Quick Ratio: 0.86

💰 DIVIDENDES
Yield: 0.52%
Payout Ratio: 15.1% ✅ Soutenable
Historique: 11 ans consécutifs d'augmentation

🎯 SYNTHÈSE FONDAMENTALE

Forces:
✅ Marges exceptionnelles (25%+)
✅ ROE exceptionnel (147%)
✅ Cash flow solide ($99.6B)
✅ Leadership de marché
✅ Écosystème fermé très rentable

Faiblesses:
⚠️ Valorisation élevée (P/E 29x)
⚠️ Croissance modérée (2% revenue)
⚠️ Liquidité courte (Current Ratio <1)
⚠️ Dépendance iPhone (60% revenue)

📊 SCORE DE SANTÉ FINANCIÈRE: 82/100

Catégorie: STRONG (Entreprise financièrement solide)

💡 AVIS:
Apple reste un géant technologique avec fondamentaux solides et profitabilité exceptionnelle. La valorisation élevée reflète la qualité, mais limite le potentiel upside à court terme. Adapté aux investisseurs cherchant stabilité et dividendes croissants.

⚠️ AVERTISSEMENT:
Cette analyse est basée sur données publiques. Consulte un conseiller financier pour décisions d'investissement personnalisées.
```

**FORMAT COURT (SMS)**:
```
AAPL Fundamentals: P/E 29.1 | ROE 147% | Revenue $383B (+2%) | Div 0.52% | Score: 82/100 (STRONG) ✅
```

**COMPARAISON SECTORIELLE** (si demandée):
```
📊 AAPL vs Secteur Technology

                AAPL    Secteur    Delta
P/E             29.1    26.5       +9.8%
Marge nette     25.3%   18.2%      +39%
ROE             147%    42%        +250%
Croissance rev  2.1%    8.5%       -75%

Position: PREMIUM (valorisation élevée, qualité supérieure)
```

**GESTION D'ERREURS**:
- Si ticker invalide: "❌ Ticker non reconnu"
- Si données incomplètes: Indiquer sections manquantes
- Si entreprise privée: "ℹ️ Données non disponibles (entreprise privée)"

**TON**: Analytique, objectif, équilibré (forces ET faiblesses).

**EXEMPLES D'UTILISATION**:
- "Analyse fondamentale AAPL"
- "Fundamentals TSLA"
- "Santé financière de MSFT"
- "Compare AAPL vs secteur"
