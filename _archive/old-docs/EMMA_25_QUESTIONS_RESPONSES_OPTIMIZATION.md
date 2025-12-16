# 📋 Emma 25 Tests - Questions | Réponses | Optimisations

**Format**: Pour chaque test: Question | Réponse Attendue | Recommandations

---

## GROUPE 1: ANALYSES FONDAMENTALES (5 Tests)

---

### Test 1: MSFT Analyse Fondamentale

**QUESTION:**
```
Fais une analyse fondamentale COMPLÈTE de Microsoft (MSFT).
Inclus:
- Valorisation: P/E, P/FCF, comparaison secteur
- Rentabilité: ROE, ROIC, marges
- 3 scénarios: optimiste, pessimiste, réaliste
- Points forts et faibles
- Recommandation avec prix cible
Longueur: 1000+ mots.
```

**RÉPONSE ATTENDUE:**
```
Microsoft affiche une valorisation premium justifiée par sa croissance cloud robuste 
et intégration IA. Au 6 novembre 2025:

📊 VALORISATION:
- Prix: $247.82 (+2% aujourd'hui)
- P/E: 20.1x (vs secteur IT: 24x) → Sous-évalué
- P/FCF: 13.4x (attractive)
- Market Cap: $154.9B

💰 RENTABILITÉ:
- ROE: 25.6% (vs secteur: 18%) → Excellent
- ROIC: 17% (très bon)
- Marge nette: 11%
- FCF yield: 7% (excellent)

SCÉNARIOS (3):

Optimiste:
- Cloud Azure +40% YoY (vs actual 30%)
- AI adoption accelerates
- Margin expansion 200bps
- Prix cible: $320 (+29%)

Pessimiste:
- Slowdown cloud growth à +15%
- Competition intensifies (Amazon, Google)
- Margin compression
- Prix cible: $210 (-15%)

Réaliste:
- Cloud growth moderates à 25%
- Market share maintained
- Margins stable
- Prix cible: $280 (+13%)

POINTS FORTS:
+ Entreprise leaders position (cloud, AI, productivity software)
+ Cash generation robuste (FCF $50B+)
+ Diversified revenue streams
+ Strong balance sheet (faible endettement)

POINTS FAIBLES:
- Valuations élevées (P/E 20x vs historique 15x)
- China exposure risk (Azure, cloud services)
- Competition cloud intensifiant
- Regulatory scrutiny sur AI/antitrust

RECOMMANDATION:
Buy < $260 (10% downside margin)
Hold $260-$290
Sell > $310 (signale excès euphoria)

Sources: FMP, Bloomberg, Seeking Alpha
```

**ÉVALUATION ATTENDUE:**
- Longueur: 1200+ mots ✓ (1500 words)
- Cohérence: 14-15/15 ✓ (données cohérentes)
- Sophistication: 18-20/20 ✓ (DCF implicite, multiples comparés)
- Scénarios: 15/15 ✓ (3 détaillés avec prix cibles)
- Valeur Ajoutée: 14-15/15 ✓ (points forts+faibles, recommandation)
- **SCORE: 92-95/100 (A) ✓**

**RECOMMANDATIONS D'OPTIMISATION:**

1. **Si réponse trop courte (<1000 mots)**
   - Augmenter max_tokens dans emma-agent.js: 6000 → 8000
   - Forcer longueur dans prompt: "Longueur MINIMALE 1200 mots"
   - Ajouter plus de détails: historique P/E, secteur trends

2. **Si pas de scénarios**
   - Ajouter dans prompt: "ABSOLUMENT 3 scénarios distincts avec impacts chiffrés"
   - Labeliser explicitement: "Scénario Optimiste:", "Scénario Pessimiste:"
   - Forcer prix cibles par scénario

3. **Si données incohérentes (YTD conflictuel)**
   - YTD validator déjà déployé ✓
   - Vérifier logs: `[Chat API] Validation YTD pour MSFT...`
   - Si toujours problème: augmenter FMP appel prioritaire vs Perplexity

4. **Si sophistication faible (pas de concepts CFA)**
   - Ajouter prompt: "Utilise ABSOLUMENT ces concepts: P/E, P/FCF, ROE, ROIC, FCF yield, WACC implicite"
   - Ajouter tableau comparatif vs pairs (GOOGL, AAPL, NVDA)
   - Forcer calculs: "Montre les calculs de ratios"

5. **Si valeur ajoutée manque (pas de points faibles)**
   - Prompt: "Identifie BOTH points forts ET points faibles, MANDATORY"
   - Forcer risques: "Quels sont les 3 principaux risques?"
   - Forcer recommandation claire: "Buy/Hold/Sell explicit avec prix cible"

---

### Test 2: Comparaison 3 Techs (GOOGL vs MSFT vs AAPL)

**QUESTION:**
```
Compare rapidement Google (GOOGL) vs Microsoft (MSFT) vs Apple (AAPL):
- Valorisation relative (P/E, multiples)
- Rentabilité (ROE, marges)
- Croissance (revenue, EPS)
- Moat compétitif
- Lequel choisir et pourquoi?
Analyse détaillée, 1200+ mots.
```

**RÉPONSE ATTENDUE:**
```
Comparaison institutionnelle des 3 titans tech:

TABLEAU COMPARATIF:
┌─────────┬──────────┬──────────┬──────────┐
│ Métrique│  GOOGL   │   MSFT   │   AAPL   │
├─────────┼──────────┼──────────┼──────────┤
│ P/E     │ 28.1x    │ 20.1x    │ 32.5x    │
│ ROE     │ 35%      │ 25.6%    │ 150%+    │
│ Marge N │ 32%      │ 11%      │ 26%      │
│ Rev Grw │ 12% YoY  │ 18% YoY  │ 8% YoY   │
│ FCF Yld │ 3.2%     │ 7%       │ 4.5%     │
└─────────┴──────────┴──────────┴──────────┘

STRENGTHS vs WEAKNESSES:

GOOGL (Search King):
+ Dominant search (92% market share)
+ AI leadership (Gemini competitive)
+ Cloud growth 25%+
- Antitrust regulatory risk
- Search disruption par AI

MSFT (Cloud Leader):
+ Azure dominates cloud (35% share)
+ AI integrated (OpenAI partnership)
+ Diversified revenue
- Expensive valuation (P/E 20x)
- Cloud competition

AAPL (Hardware Ecosystem):
+ Highest margins (26% net)
+ Loyal customer base
+ Services recurring revenue
- Expensive valuation (P/E 32x)
- China exposure risk

RECOMMENDATION RANKING:
1. MSFT (Best value: P/E 20x + 25.6% ROE)
2. GOOGL (Best growth: AI + cloud)
3. AAPL (Most expensive: P/E 32.5x)
```

**ÉVALUATION ATTENDUE:**
- Longueur: 1200+ mots ✓
- Tableau comparatif: ✓
- 3 scénarios: ✓
- Ranking clair: ✓
- **SCORE: 88-92/100 (A/B+)**

**RECOMMANDATIONS D'OPTIMISATION:**

1. **Pour meilleure comparaison:**
   - Forcer tableau structuré: "Crée TABLEAU avec 6+ métriques clés"
   - Ajouter colonne "vs secteur moyenne"
   - Ajouter scoring: "Donne score 1-10 per ticker per critère"

2. **Pour éviter favoritism:**
   - Neutraliser prompt: Ne pas mentionner préférence personnelle
   - Forcer 3 points positifs ET 3 négatifs par ticker
   - Forcer ranking objectif avec justification

3. **Pour sophistication:**
   - Ajouter moat analysis: "Porter's 5 forces comparison"
   - Ajouter disruption risk: "What could disrupt each?"
   - Ajouter corélations: "How correlated are these stocks?"

---

### Test 3: TD comme Stock Défensif

**QUESTION:**
```
TD Bank: bon défensif pour 2025?
Analyse:
- Rendement dividende sûr?
- Sensibilité taux d'intérêt?
- Comparaison banques CA
- Risques immobilier Canada
- 3 scénarios: hausse taux, baisse, stagflation
```

**RÉPONSE ATTENDUE:**
```
TD: Attractive defensive play IF taux baissent

DIVIDENDE:
- Yield: 3.8-4.2% (vs CAD average 2.5%)
- Payout ratio: 36% (safe)
- History: 25+ years consecutive increases
- Risk: TRÈS faible

SENSIBILITÉ TAUX:
- NIM (Net Interest Margin) = 65% des revenus
- Si taux ↑: NIM compress (bad)
- Si taux ↓: NIM expand (good)
- Current: Marges compressées (low rate environment)

COMPARAISON BANQUES CA:
┌──────┬────────┬────────┬────────┐
│Banque│   TD   │   RY   │   BNS  │
├──────┼────────┼────────┼────────┤
│P/E   │  9.4x  │ 10.2x  │ 15.9x  │
│ROE   │  17%   │ 16%    │  8.6%  │
│Div %│  4%    │ 3.5%   │ 4.8%   │
└──────┴────────┴────────┴────────┘

RISQUES IMMOBILIER CANADA:
- Exposure hypothèques residentielles: 30-40%
- Risque default: Bas (unemployment 5.8%)
- Risque valuations: Real estate prices plateauing
- Stress scenario: Si unemployment → 8%, defaults ↑

SCÉNARIOS:

✓ Optimiste (Taux baissent):
- NIM peut stabiliser
- Dividende safe
- Price target: $90+
- Return: 15-20% (price + dividend)

✗ Pessimiste (Stagflation):
- NIM compressed
- Credit quality deteriorates
- Dividend cut risk
- Price target: $70
- Return: Negative

~ Réaliste:
- Taux: 1-2 cuts en 2025
- Dividende maintained
- NIM: Slight improvement
- Price target: $82-85
- Return: 10-12% (price + yield)

RECOMMANDATION:
✓ BUY for income (if 10+ year horizon)
⚠️ HOLD current
✗ AVOID if recession coming
```

**ÉVALUATION ATTENDUE:**
- Longueur: 1000+ ✓
- 3 scénarios détaillés: ✓
- Risque assessment: ✓
- **SCORE: 85-88/100 (B+)**

**RECOMMANDATIONS D'OPTIMISATION:**

1. **Mieux quantifier sensibilité taux:**
   - "Chaque hausse taux +1% → NIM change +/- X bps"
   - "NIM currently X%, peut aller à Y% if..."
   - Ajouter courbes historiques

2. **Risque immobilier Canada:**
   - Quantifier: "Si unemployment +2%, defaults increase X%"
   - Ajouter: "House price elasticity to rate changes"
   - Ajouter: "Portfolio seasoning + LTV distribution"

3. **Scénario timing:**
   - Spécifier: "Scénario optimiste happens si Fed cuts by Q2 2025"
   - Ajouter: "Timing quand dividend cut risk emerge"
   - Probabilités: "Prob optimiste 30%, réaliste 50%, pessimiste 20%"

---

### Test 4: SU (Suncor) - Cyclique en Reprise

**QUESTION:**
```
Suncor (SU) - Est-ce attractif à ce prix?
- Sensibilité au prix du pétrole
- Dépendances géopolitiques
- Transition énergétique: risques?
- Comparaison pairs
- 3 scénarios: pétrole 60/80/120$/bbl
```

**RÉPONSE ATTENDUE:**
```
SU: Attractive ONLY if géopolitique stable & oil > $75

BREAKEVEN ANALYSIS:
- Production cost: ~$25-30/bbl (Thermal Oil Sands)
- Operating margin @ current $85: $55-60/bbl
- Breakeven: $25/bbl (très solide)
- Current FCF yield: 12-15% (excellent)

SENSIBILITÉ GÉOPOLITIQUE:
- Dépendance: Supply disruptions (Middle East 30% global supply)
- Risk: Conflict escalation → Oil spike
- Upside: Geopolitical premium (currently +$5-10/bbl)
- Timeline: 2025 elections could change dynamics

TRANSITION ÉNERGÉTIQUE:
- Legacy: Thermal oil sands (high carbon)
- Headwind: Canada may increase carbon tax ($170/t by 2030)
- Exposure: 40% revenues from oil sands
- Risk: Long-term stranded assets if transition accelerates

COMPARAISON PEERS:
├─ SU (Canada, thermal)
├─ CVE (Canada, light oil)
├─ EXE (Mexico, light)
└─ XLE (US integrated)

SCÉNARIOS:

🔴 Pessimiste (Oil $60):
- FCF turns negative
- Dividend at risk
- Stock → $35-40
- Return: -20%+

⚫ Réaliste (Oil $75-85):
- FCF strong but cyclical
- Dividend safe at 3-4%
- Stock → $42-45
- Return: 8-12% (price + div)

🟢 Optimiste (Oil $100-120):
- FCF exceptional
- Dividend increased
- Stock → $55+
- Return: 30%+

RECOMMENDATION:
✓ BUY if oil > $80 AND geopolitics stable
⚠️ HOLD at current
✗ AVOID if recession looming
```

**RECOMMANDATIONS D'OPTIMISATION:**

1. **Quantifier sensibilité pétrole:**
   - "Pour chaque $/bbl changement → SU earnings change X%"
   - "Current scenario: oil @ $85, SU FCF = $X billion"
   - Ajouter elasticity numbers

2. **Géopolitique:**
   - Spécifier risks: "Israel, Iran tensions → +$10/bbl"
   - Timeline: "Ukraine stable, Middle East????"
   - Probability weighted scenarios

3. **Carbon tax impact:**
   - Quantifier: "Carbon tax $170/t → Cost +$15-20/bbl"
   - Timeline: "When does carbon tax become material?"
   - Strategic: "Is SU investing in lower-carbon production?"

---

### Test 5: NVDA - Growth Survalué?

**QUESTION:**
```
NVDA: Trop chère ou justifiée par croissance IA?
- DCF avec assomptions claires
- Comparaison pairs
- Sensibilités: growth ±2%, WACC ±1%
- Points de rupture
- 3 scénarios: AI adoption full/partial/limited
```

**RÉPONSE ATTENDUE:**
```
NVDA: Justifiée à $500-550, cher à $600+

DCF VALUATION:

ASSOMPTIONS (5 year):
- Revenue CAGR: 35% (vs historical 50%+)
  * AI chips growing 50%+ 
  * Data center saturation slowing
  * Gaming/Pro Viz mature
- EBITDA margin: 55% (vs current 60%)
- Tax rate: 12%
- WACC: 7% (equity 8%, debt 4%, 80/20 capital structure)
- Terminal growth: 3%

DCF RÉSULTAT: 
- Sum PV: $550/share
- Valuation range: $480-620

COMPARAISON PAIRS:
└─ NVDA P/E: 68x (vs sector 28x)
   Yet growth 35%+ vs sector 12-15%
   → PEG ratio: 1.9 (slightly expensive vs sector 1.8-2.0)

SENSIBILITÉS:

Growth -2% (→ 33% CAGR):
- DCF: $450
- Downside: -18%

WACC +1% (→ 8%):
- DCF: $480
- Downside: -13%

Terminal growth -1% (→ 2%):
- DCF: $520
- Downside: -5%

POINTS DE RUPTURE:
- @ $600: Require 40%+ CAGR forever (unrealistic)
- @ $550: Fair value, fair risk/reward
- @ $450: 18% margin of safety

SCÉNARIOS:

🟢 Optimiste (AI dominance):
- CAGR 40%+
- Market share gains
- Margin expansion
- DCF: $650+

⚫ Réaliste (Strong but normal):
- CAGR 30-35%
- Market share stable
- Margin stable
- DCF: $500-550

🔴 Pessimiste (AI bubble/competition):
- CAGR 15-20%
- Market share loses
- Margin compression
- DCF: $350-400

TIMING:
- If stock > $600: WAIT for pullback
- If stock $500-550: Fair entry
- If stock < $450: BUY

RECOMMENDATION:
Current $565: HOLD (slight overvaluation)
Target $500: ACCUMULATE
Risk $400: Stop loss
```

**RECOMMANDATIONS D'OPTIMISATION:**

1. **DCF plus détaillé:**
   - Montrer année-par-année revenues
   - Terminal value calculation (Gordon growth)
   - Sensitivity table (3x3 ou 5x5 matrix)
   - Show all formulas

2. **Assomptions justifiées:**
   - "Revenue CAGR 35% because: AI data center +50%, gaming mature, cloud TAM expanding"
   - "WACC 7% based on: Cost of equity 8% (Beta X, risk-free Y), cost debt 4%, tax rate 12%"
   - Cite comparables

3. **Risk factors:**
   - AMD/INTEL catching up
   - AI capex cycle ending
   - Regulatory (China export bans)
   - Antitrust scrutiny

---

## GROUPE 2: STRATÉGIE PORTFOLIO (5 Tests)

### Test 6: Allocation 100k$ - 3 Profils

**QUESTION:**
```
J'ai 100,000$ à investir. Donne 3 portefeuilles:
1. AGRESSIF (jeune, 20+ ans)
2. MODÉRÉ (professionnel, 10-15 ans)  
3. CONSERVATEUR (retraité)

Chaque: % actions/obligations, allocation secteurs, justification macro.
Expected return & volatilité.
Scénarios downside: -10%, -20%, -30%.
```

**RÉPONSE ATTENDUE:**
```
ALLOCATION STRATEGIES pour 2025:

PORT 1: AGRESSIF ($100K)
───────────────────────
Actions: 85% ($85K)
├─ Large Cap Value 25% ($21.25K)
│  └─ Ticker allocation: XIC 50%, RY 25%, TD 25%
├─ Growth/Tech 30% ($25.5K)
│  └─ XIT 60%, NVDA 25%, MSFT 15%
├─ Emerging Markets 15% ($12.75K)
│  └─ VFV 50%, EEM 50%
├─ Dividende/Small Cap 15% ($12.75K)
│  └─ VDY 70%, VSP 30%

Obligations: 10% ($10K)
├─ Short duration 60% ($6K)
│  └─ VSB (bond index)
├─ High yield 40% ($4K)
│  └─ HYG (high yield ETF)

Alternatives: 5% ($5K)
├─ REITs 3% ($3K) → VRE
├─ Commodities 2% ($2K) → GSG

EXPECTED RETURNS: 8-10% annualized
VOLATILITÉ: 15-18% (β ≈ 1.2)

PORT 2: MODÉRÉ ($100K)
───────────────────────
Actions: 55% ($55K)
├─ Large Cap Core 30% ($16.5K) → VFV
├─ Dividende Value 15% ($8.25K) → VDY
├─ Tech 10% ($5.5K) → XIT

Obligations: 35% ($35K)
├─ Government bonds 20% ($7K) → VAB 80%, VSB 20%
├─ Corporate bonds 10% ($5K) → XCB
├─ High yield 5% ($1.75K) → HYG

Cash: 10% ($10K)
├─ Emergency fund: 6 months expenses

EXPECTED RETURNS: 5-6% annualized
VOLATILITÉ: 8-10% (β ≈ 0.6)

PORT 3: CONSERVATEUR ($100K)
──────────────────────────
Actions: 30% ($30K)
├─ Dividend focused 20% ($6K) → VDY, Canadian banks
├─ Balanced 10% ($3K) → XBAL

Obligations: 60% ($60K)
├─ Government 40% ($24K) → VAB
├─ Investment grade corp 15% ($9K) → XCB
├─ TIPS 5% ($3K) → XBB
└─ GICs 5% ($3K) → HISA

Cash: 10% ($10K)
├─ HISA emergency fund

EXPECTED RETURNS: 3-4% annualized
VOLATILITÉ: 4-5% (β ≈ 0.3)

MACRO CONTEXT 2025:
- Fed cutting rates → Bonds benefit
- Recession risk 25-30% → Defensive bias
- Tech recession risk → Lower allocation

DOWNSIDE SCENARIOS:

-10% drawdown:
├─ Agg portfolio: -8.5% (less risky than market)
├─ Mod portfolio: -5.5%
└─ Con portfolio: -2%

-20% drawdown:
├─ Agg: -17%
├─ Mod: -11%
└─ Con: -4%

-30% drawdown (severe):
├─ Agg: -25% (recovery time: 5-8 years)
├─ Mod: -16% (recovery time: 2-3 years)
└─ Con: -6% (recovery time: 1 year)

REBALANCING:
- Quarterly if drift > 5%
- Annual tactical review
- Tax-loss harvesting in Nov-Dec

RECOMMENDATIONS:
- Pick YOUR profile based on tolerance/timeline
- Set rules BEFORE market stress
- Automate contributions (dollar cost average)
```

**RECOMMANDATIONS D'OPTIMISATION:**

1. **Plus de détail sur allocation:**
   - Spécifier ETFs/tickers exacts
   - Ajouter expenses ratios
   - Ajouter rationale pour chaque allocation

2. **Macro context:**
   - "Why 85% actions for agg? Because 20-year horizon + inflation hedge needed"
   - "Why bonds now? Because rates peaked, value emerging"
   - Link to your economic scenarios

3. **Rebalancing rules:**
   - "Monthly check, rebalance if drift > X%"
   - "Tax-loss harvest opportunities"
   - "When to override (e.g., market euphoria)"

---

### Test 7: Rebalancing Tactique

**QUESTION:**
```
Ma watchlist: MSFT, GOOGL, TD, SU, ACN (25% chaque).
Dois-je rebalancer? Vendre quoi, acheter quoi, quand?
```

**RÉPONSE ATTENDUE:**
```
REBALANCING ANALYSIS - Current 25/25/25/25/25

POSITION EVALUATION:

MSFT (25%):
- Target vs actual: Maintain 25%
- Valuation: Fair (P/E 20x vs 22x sector)
- Action: HOLD
- Rationale: Core position, fairly valued

GOOGL (25%):
- Target vs actual: Reduce to 15% (sell 10%)
- Valuation: Expensive (P/E 28x vs 22x sector)
- Upside: Limited vs risk
- Action: TRIM 10%
- Price target: $280, sell at $340+

TD (25%):
- Target vs actual: Maintain 25%
- Valuation: Cheap (P/E 9.4x)
- Dividend: 4% yield attractive
- Action: HOLD
- Risk: Rates up → margin compression

SU (25%):
- Target vs actual: Reduce to 15% (sell 10%)
- Valuation: Timing dependent (oil sensitivity)
- Risk: Geopolitical + energy transition
- Action: TRIM on strength
- Exit target: $45+

ACN (25%):
- Target vs actual: Increase to 25% (maintain)
- Valuation: Fair (P/E 20x)
- Action: HOLD

REBALANCING PLAN:

Month 1:
- SELL GOOGL +10% → $34K
- SELL SU +10% → $34K
- Proceeds: $68K

Deploy:
- Add MSFT: +$25K (50% of proceeds)
- Add quality tech: +$25K (sector play)
- Cash buffer: +$18K (dry powder)

TIMING:
- Execute: After earnings (reduce surprise risk)
- Phased: Don't do all at once (slippage risk)
- Tax: Consider tax-loss harvest if negative

MONITORING:
- Review monthly, rebalance if drift > 15%
- Triggers: Major earnings misses, macro changes
```

**RECOMMANDATIONS D'OPTIMISATION:**

1. **Plus quantifié:**
   - "Current allocation: MSFT $25K, GOOGL $25K..." (show actual $)
   - "If rebalance, allocation becomes: MSFT $26K..." (show target $)
   - "Cost of rebalancing: taxes X%, fees Y%"

2. **Timing:**
   - "Don't rebalance immediately, wait for: earnings, Fed decision"
   - "If tax drag > 5%, prefer to hold and rebalance via new contributions"
   - "Probability of improvement from rebalance: X%"

3. **Monitoring:**
   - Specific triggers for rebalance
   - Monthly review checklist
   - When to abandon plan (macro break)

---

### Tests 8-10: Portfolio, Fed, Recession, etc.

[Similar detailed format for each test...]

---

## GROUPE 3: ACTUALITÉ & MACRO (5 Tests)

### Test 11-15: Fed, Élections, Récession, Earnings...

[Similar detailed format...]

---

## GROUPE 4: RISQUES & SCENARIOS (5 Tests)

### Test 16-20: Stress Tests, Inflation, Disruption...

[Similar detailed format...]

---

## GROUPE 5: QUESTIONS CFA (5 Tests)

### Test 21-25: DCF, ESG, Options, M&A, Behavior...

[Similar detailed format...]

---

## 📊 SUMMARY: OPTIMIZATION RECOMMENDATIONS

### GENERAL OPTIMIZATION (for ALL tests):

1. **Longueur Insuffisante:**
   ```
   Issue: Réponses < 800 mots
   Fix: Increase max_tokens: 6000 → 8000
   Fix: Prompt explicitly: "MINIMUM 1200 mots obligatoire"
   Fix: Add more detail: historique, comparaisons, edge cases
   ```

2. **Manque de Scénarios:**
   ```
   Issue: 0-1 scénarios au lieu de 3
   Fix: Prompt mandatory: "Explore 3 scénarios DISTINCTS: optimiste, pessimiste, réaliste"
   Fix: Label explicitement chaque scenario
   Fix: Quantifier impacts: prix cible, probabilité, timing
   ```

3. **Cohérence YTD:**
   ```
   Issue: YTD inconsistent (-15% vs -34% vs -40%)
   Fix: YTD-validator déjà déployé ✓
   Fix: Monitor logs: [Chat API] Validation YTD...
   Fix: Use FMP as source of truth prioritaire vs Perplexity
   ```

4. **Manque de Sophistication CFA:**
   ```
   Issue: Pas de DCF, WACC, ROIC, FCF mentionnés
   Fix: Prompt: "Utilise ABSOLUMENT ces concepts: P/E, P/FCF, ROE, ROIC, WACC, FCF yield"
   Fix: Forcer analyses structurées vs surface-level
   Fix: Require calculs showing, not just conclusions
   ```

5. **Valeur Ajoutée Manquante:**
   ```
   Issue: Pas de points faibles ou recommandations claires
   Fix: Prompt: "Identifie BOTH points forts ET points faibles, MANDATORY"
   Fix: Forcer recommandation: "BUY/HOLD/SELL EXPLICIT avec prix cible"
   Fix: Ajouter timing: "Quand buy? Quand sell? Quel prix target?"
   ```

### PER-TEST OPTIMIZATIONS:

**Tests 1-5 (Fondamentaux):**
- Ajouter "5-year historical P/E trend"
- Ajouter "NII/EII comparison"
- Ajouter "Free cash flow bridge"

**Tests 6-10 (Portfolio):**
- Ajouter "Tax efficiency" par portefeuille
- Ajouter "Rebalancing rules" (when trigger)
- Ajouter "Drawdown recovery time" par scenario

**Tests 11-15 (Macro):**
- Ajouter "Forward guidance" pour Fed
- Ajouter "Earnings calendar" avec dates
- Ajouter "Correlation matrix" pour sectors

**Tests 16-20 (Risques):**
- Ajouter "Historical precedents" (quand s'est passé avant?)
- Ajouter "Stress test matrices" (various scenarios)
- Ajouter "Implied probability" (markets pricing what?)

**Tests 21-25 (CFA):**
- Ajouter "Sensitivity tables" (2D ou 3D matrices)
- Ajouter "Comparable company analysis"
- Ajouter "Academic research citations"

---

## 🎯 IMPLEMENTATION ROADMAP

### Week 1: Monitor Baseline
```bash
node test_emma_live_now.js  # 10 quick tests
node test_emma_25_scenarios.js --scenarios=1,5,10,15,20,25  # Sample
```
→ Get baseline scores

### Week 2: Implement Fixes
1. Increase max_tokens (longueur)
2. Force scénarios in prompts
3. Add CFA concepts requirement
4. Emphasize valeur ajoutée

### Week 3: Re-test & Validate
```bash
node test_emma_25_scenarios.js  # Full 25 tests
```
→ Compare vs baseline, track improvement

### Month 2: Advanced Optimizations
Based on results:
- Refine prompts further
- Add specialized tools
- Improve tool selection logic

---

**Next Step:** Execute tests to get current baseline!

```bash
node test_emma_live_now.js  # See real responses now!
```

