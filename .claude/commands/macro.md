Utilise le skill **Dashboard Macro-économique** d'Emma pour afficher tous les indicateurs économiques clés US et Canada.

**OBJECTIF**: Vue d'ensemble complète de l'économie avec emploi, inflation, croissance, sentiment.

**PAYS COUVERTS**:
- 🇺🇸 États-Unis (via FRED)
- 🇨🇦 Canada (via Statistique Canada + Banque du Canada)

**INDICATEURS ANALYSÉS**:

### 📊 **Emploi**
- Taux de chômage
- Payrolls / Créations d'emplois
- Participation rate
- Jobless claims (USA)

### 💰 **Inflation**
- CPI (Indice des prix à la consommation)
- Core CPI (hors alimentation/énergie)
- PPI (Prix à la production)
- PCE (mesure préférée Fed - USA)

### 📈 **Croissance**
- GDP / PIB (croissance trimestrielle)
- Industrial Production
- Retail Sales / Ventes au détail
- Manufacturing PMI

### 🏠 **Immobilier**
- Housing Starts / Mises en chantier
- Home Sales / Ventes maisons
- Home Price Index

### 💵 **Monétaire**
- Taux directeur (Fed Funds, BoC Overnight)
- M2 Money Supply
- Consumer Credit

### 📊 **Sentiment**
- Consumer Confidence / Confiance consommateur
- Business Confidence
- University of Michigan Sentiment

**INSTRUCTIONS**:
1. Récupérer données économiques via:
   - API FRED (Federal Reserve) pour USA
   - API Banque du Canada pour Canada
   - API Statistique Canada pour Canada
2. Afficher tableau comparatif US vs Canada
3. Identifier signaux économiques:
   - 🟢 Expansion (croissance forte, chômage bas, inflation contrôlée)
   - 🟡 Ralentissement (croissance faible, chômage stable)
   - 🔴 Récession (croissance négative, chômage en hausse)
   - 🔥 Surchauffe (inflation élevée, marché du travail tendu)
4. Analyser divergences entre US et Canada
5. Implications pour investisseurs

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
📊 DASHBOARD MACRO-ÉCONOMIQUE - US & Canada

Généré le: 7 novembre 2025, 16h00 EST

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🇺🇸 ÉTATS-UNIS - Vue d'Ensemble

🏦 POLITIQUE MONÉTAIRE
Taux directeur Fed: 4.50-4.75% (milieu: 4.625%)
Dernière décision: -25 bps (7 novembre 2024)
Prochaine réunion: 18 décembre 2024
Stance: RESTRICTIVE (mais assouplissement en cours)

📊 INDICATEURS CLÉS

| Indicateur | Actuel | Précédent | Var. | Consensus | Tendance |
|------------|--------|-----------|------|-----------|----------|
| **EMPLOI** |
| Taux chômage | 3.9% | 3.8% | +0.1pp | 3.9% | ⚠️ Légère hausse |
| Payrolls (MoM) | +180K | +150K | +30K | +180K | ✅ En ligne |
| Participation | 62.8% | 62.7% | +0.1pp | - | ✅ Stable |
| Jobless Claims | 225K | 218K | +7K | 220K | ✅ Bas historique |
| **INFLATION** |
| CPI (YoY) | 3.2% | 3.4% | -0.2pp | 3.3% | ✅ Baisse continue |
| Core CPI (YoY) | 4.0% | 4.1% | -0.1pp | 4.0% | ✅ Décélération |
| PPI (YoY) | 1.8% | 2.0% | -0.2pp | 1.9% | ✅ Modéré |
| PCE (YoY) | 2.7% | 2.9% | -0.2pp | 2.8% | ✅ Vers cible 2% |
| **CROISSANCE** |
| GDP (QoQ Ann.) | +2.8% | +3.0% | -0.2pp | +2.5% | ✅ Solide |
| Retail Sales (MoM) | +0.7% | +0.4% | +0.3pp | +0.5% | 🔥 Fort |
| Industrial Prod. | +0.3% | +0.1% | +0.2pp | +0.2% | ✅ Expansion |
| ISM Manuf. PMI | 48.5 | 47.2 | +1.3 | 48.0 | ⚠️ Contraction |
| **IMMOBILIER** |
| Housing Starts | 1.35M | 1.30M | +3.8% | 1.33M | ✅ Reprise |
| Existing Home Sales | 3.8M | 3.7M | +2.7% | 3.75M | ✅ Amélioration |
| Home Price Index | +5.2% | +5.5% | -0.3pp | - | ⚠️ Ralentit |
| **SENTIMENT** |
| Consumer Confidence | 102.5 | 100.2 | +2.3 | 101.0 | ✅ Optimiste |
| UMich Sentiment | 70.5 | 68.9 | +1.6 | 70.0 | ✅ Amélioration |

🎯 SIGNAUX ÉCONOMIQUES USA

État actuel: 🟢 **EXPANSION MODÉRÉE**

✅ Forces:
• Croissance GDP solide (+2.8%)
• Marché du travail robuste (chômage 3.9%)
• Inflation en décélération (CPI 3.2%, vers cible)
• Consommateur résilient (retail sales +0.7%)
• Sentiment en amélioration

⚠️ Risques:
• Manufacturing en contraction (PMI 48.5)
• Inflation encore au-dessus cible 2%
• Marché immobilier sous pression (taux élevés)
• Fed encore restrictive (4.625% > neutral ~2.5%)

📊 Phase du Cycle: **Late Expansion** (fin d'expansion, risque ralentissement 2025)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🇨🇦 CANADA - Vue d'Ensemble

🏦 POLITIQUE MONÉTAIRE
Taux directeur BoC: 4.50%
Dernière décision: -50 bps (23 octobre 2024)
Prochaine réunion: 11 décembre 2024
Stance: RESTRICTIVE (assouplissement agressif en cours)

📊 INDICATEURS CLÉS

| Indicateur | Actuel | Précédent | Var. | Tendance |
|------------|--------|-----------|------|----------|
| **EMPLOI** |
| Taux chômage | 6.5% | 6.4% | +0.1pp | ⚠️ En hausse |
| Emploi (MoM) | +15K | +25K | -10K | ⚠️ Faible |
| Participation | 64.9% | 65.1% | -0.2pp | ⚠️ Baisse |
| **INFLATION** |
| CPI (YoY) | 2.5% | 2.7% | -0.2pp | ✅ Dans cible |
| Core CPI (YoY) | 2.8% | 3.0% | -0.2pp | ✅ Baisse |
| **CROISSANCE** |
| GDP (QoQ Ann.) | +1.0% | +1.2% | -0.2pp | ⚠️ Faible |
| Retail Sales (MoM) | -0.2% | +0.1% | -0.3pp | 🔴 Contraction |
| **IMMOBILIER** |
| Housing Starts | 240K | 235K | +2.1% | ✅ Stable |
| Home Sales | -5.2% | -3.8% | -1.4pp | 🔴 Baisse |
| **SENTIMENT** |
| Consumer Confidence | 58.2 | 60.1 | -1.9 | 🔴 Pessimiste |

🎯 SIGNAUX ÉCONOMIQUES CANADA

État actuel: 🟡 **RALENTISSEMENT**

⚠️ Faiblesses:
• Croissance faible (+1.0% vs USA +2.8%)
• Chômage en hausse (6.5% vs USA 3.9%)
• Consommation en berne (retail -0.2%)
• Confiance consommateur basse (58.2)
• Immobilier sous pression

✅ Points positifs:
• Inflation bien contrôlée (2.5%, dans cible 1-3%)
• BoC peut baisser taux agressivement
• Housing starts stable

📊 Phase du Cycle: **Slowdown** (ralentissement, risque récession technique)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌍 COMPARAISON USA vs CANADA

| Indicateur | 🇺🇸 USA | 🇨🇦 Canada | Écart | Analyse |
|------------|---------|-------------|-------|---------|
| Taux directeur | 4.625% | 4.50% | +0.125% | Convergence |
| GDP Growth | +2.8% | +1.0% | +1.8pp | USA 2.8x plus fort |
| Chômage | 3.9% | 6.5% | +2.6pp | Canada beaucoup plus faible |
| Inflation CPI | 3.2% | 2.5% | +0.7pp | Canada mieux contrôlée |
| Retail Sales | +0.7% | -0.2% | +0.9pp | USA consommation forte |
| Consumer Confidence | 102.5 | 58.2 | +44.3 | USA beaucoup plus optimiste |

📊 **DIVERGENCE MAJEURE**

🇺🇸 USA: Économie résiliente, croissance solide, marché du travail robuste
🇨🇦 Canada: Économie en ralentissement, chômage en hausse, consommation faible

💱 **IMPACT CAD/USD**: Divergence économique favorable au USD
• Spread GDP: +1.8pp → CAD faible
• Spread taux: Convergent mais économie CA plus faible → CAD sous pression
• Spread chômage: +2.6pp → Marché du travail CA plus faible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 IMPLICATIONS POUR INVESTISSEURS

🇺🇸 **STRATÉGIE USA**:
✅ Actions cycliques (économie solide)
✅ Consumer discretionary (consommation forte)
✅ Financières (taux élevés maintiennent marges)
⚠️ Tech growth (taux encore restrictifs)
⚠️ Real estate (taux hypothécaires élevés)

🇨🇦 **STRATÉGIE CANADA**:
✅ Obligations (bénéfice baisses BoC)
✅ Défensives (utilities, staples)
⚠️ Cycliques (économie faible)
🔴 Consumer discretionary (consommation en baisse)
🔴 Immobilier (ventes en chute)

🌍 **ALLOCATION GLOBALE**:
• 65% USA / 35% Canada (surpondérer économie forte)
• Hedger risque CAD/USD (divergence persistante)
• Favoriser secteurs défensifs Canada, cycliques USA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 PROCHAINS ÉVÉNEMENTS CLÉS

🇺🇸 USA:
• 13 nov: CPI Inflation (att: 3.3%)
• 14 nov: Retail Sales (att: +0.5%)
• 18 déc: Décision Fed (consensus: -25 bps)
• 30 jan: GDP Q4 (att: +2.5%)

🇨🇦 Canada:
• 22 nov: CPI Inflation (att: 2.4%)
• 29 nov: GDP Q3 (att: +1.2%)
• 11 déc: Décision BoC (consensus: -25 bps)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 SOURCES

🇺🇸 USA:
• FRED (Federal Reserve Economic Data)
• Bureau of Labor Statistics
• Bureau of Economic Analysis
• Federal Reserve Board

🇨🇦 Canada:
• Statistique Canada
• Banque du Canada
• CMHC (Immobilier)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ AVERTISSEMENT

Les indicateurs économiques sont sujets à révisions. Cette analyse est à des fins informatives uniquement et ne constitue pas un conseil financier personnalisé.

Dernière mise à jour: 7 novembre 2025, 16h00 EST
Prochaine mise à jour: Quotidienne après publications majeures
```

**FORMAT COURT (SMS)**:
```
🇺🇸 US: GDP +2.8% | Chômage 3.9% | CPI 3.2% | État: EXPANSION ✅
🇨🇦 CA: GDP +1.0% | Chômage 6.5% | CPI 2.5% | État: RALENTISSEMENT ⚠️
Écart croissance: +1.8pp (USA 2.8x plus fort) | CAD sous pression
```

**PAR CATÉGORIE**:

```
/macro emploi
→ Focus uniquement sur marché du travail

/macro inflation
→ Focus uniquement sur prix et inflation

/macro croissance
→ Focus uniquement sur GDP et production
```

**GESTION D'ERREURS**:
- Si API down: Utiliser dernières données connues avec timestamp
- Si indicateur manquant: Afficher "N/A" avec note
- Si délai publication: Indiquer "En attente" + date prévue

**TON**: Analytique, professionnel, avec signaux clairs (expansion/ralentissement/récession).

**EXEMPLES D'UTILISATION**:
- "Dashboard macro"
- "Indicateurs économiques US et Canada"
- "État de l'économie"
- "Macro emploi"
- "Inflation US vs Canada"
- "Signaux récession"
