#!/usr/bin/env node

/**
 * Test Suite: Emma 25 Comprehensive Scenarios
 * 
 * Exécute 25 tests différents pour évaluer Emma sur:
 * - Cohérence, sophistication, longueur, mémoire, valeur ajoutée
 * - Tests via Web, SMS, Email
 * - Génère rapport détaillé d'évaluation
 * 
 * Utilisation:
 *   node test_emma_25_scenarios.js
 *   node test_emma_25_scenarios.js --scenarios=1,5,10
 *   node test_emma_25_scenarios.js --channel=sms
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const LOG_DIR = './logs/emma_tests';
const RESULTS_FILE = './logs/emma_tests/results.json';
const REPORT_FILE = './EMMA_TEST_RESULTS.md';

// Créer répertoire logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ============================================================================
// 25 TEST SCENARIOS
// ============================================================================

const TEST_SCENARIOS = [
  // GROUP 1: ANALYSES FONDAMENTALES (5)
  {
    id: 1,
    group: 'Analyses Fondamentales',
    scenario: 'Analyse complète tech',
    ticker: 'MSFT',
    message: `Fais une analyse fondamentale COMPLÈTE de Microsoft (MSFT). 
Inclus: 
- Valorisation actuelle (P/E, P/FCF, PEG)
- Rentabilité et marges (ROE, ROIC, FCF)
- Croissance (revenus, EPS)
- Comparaison avec le secteur
- 3 scénarios: optimiste, pessimiste, réaliste
- Points forts et faibles
- Recommandation avec prix cible
Longueur: 1200+ mots.`,
    channels: ['web', 'sms'],
    expectedLength: 1200,
    expectedScenarios: 3,
    cfa_concepts: ['P/E', 'P/FCF', 'ROE', 'ROIC', 'DCF']
  },

  {
    id: 2,
    group: 'Analyses Fondamentales',
    scenario: 'Comparaison sectorielle',
    ticker: 'GOOGL, MSFT, AAPL',
    message: `Compare les 3 géants tech: Google (GOOGL), Microsoft (MSFT), Apple (AAPL).
Analyse:
- Valorisation relative (P/E, multiples de croissance)
- Rentabilité comparée (ROE, marges nettes)
- Moat compétitif (barrières à entrée)
- Croissance projetée et catalyseurs
- Risques spécifiques à chacun
- Tableau comparatif avec scores
- Lequel choisir et pourquoi?
Longueur: 1500+ mots avec 3 scénarios.`,
    channels: ['web', 'email'],
    expectedLength: 1500,
    expectedScenarios: 3,
    cfa_concepts: ['Valuation', 'Competitive Moat', 'Free Cash Flow']
  },

  {
    id: 3,
    group: 'Analyses Fondamentales',
    scenario: 'Value stock défensif',
    ticker: 'TD',
    message: `Analyse Toronto-Dominion Bank (TD) comme stock défensif pour 2025.
Considère:
- Rendement dividende attractif?
- Sécurité du payout ratio?
- Sensibilité aux taux d'intérêt
- Comparaison banques CA vs US
- Risques spécifiques (immobilier Canada, cycle crédit)
- Scénarios: hausse taux, baisse taux, stagflation
- Est-ce un bon achat pour capital preservation?
Inclus analyses quantitatives détaillées.`,
    channels: ['web', 'sms'],
    expectedLength: 1000,
    expectedScenarios: 3,
    cfa_concepts: ['Dividend Safety', 'Interest Rate Sensitivity', 'Capital Preservation']
  },

  {
    id: 4,
    group: 'Analyses Fondamentales',
    scenario: 'Cyclique en reprise',
    ticker: 'SU',
    message: `Suncor Energy (SU) - Est-ce attractif à ce prix? Analyse:
- Sensibilité au prix du pétrole (breakeven, cash flow)
- Dépendances géopolitiques (Russie, OPEC+)
- Transition énergétique: risques long-terme?
- Comparaison pairs (Exxon, Shell, Cenovus)
- Cas d'usage (hedging, spéculation, hedging)
- 3 scénarios: pétrole à 60, 80, 120$/bbl
- Timing d'entrée optimal?
Détail les calculs de break-even et FCF.`,
    channels: ['web', 'email'],
    expectedLength: 1100,
    expectedScenarios: 3,
    cfa_concepts: ['Commodity Sensitivity', 'Breakeven Analysis', 'Geopolitical Risk']
  },

  {
    id: 5,
    group: 'Analyses Fondamentales',
    scenario: 'Growth survalué?',
    ticker: 'NVDA',
    message: `NVIDIA (NVDA) - Trop chère ou justifiée par la croissance IA?
Analyse:
- DCF valuation: quelles assomptions?
- Comparaison pairs tech (Tesla, AMD, Broadcom)
- Sensibilités: taux croissance, terminal growth, coût capital
- Points de rupture (où devient trop chère?)
- Catalyseurs 2025: earnings beats, nouveaux produits
- 3 scénarios: AI adoption full/partial/limited
- Risque/récompense au prix actuel?
Inclus modèle DCF simplifié avec résultats.`,
    channels: ['web', 'sms'],
    expectedLength: 1300,
    expectedScenarios: 3,
    cfa_concepts: ['DCF Valuation', 'Sensitivity Analysis', 'Terminal Value']
  },

  // GROUP 2: STRATÉGIE PORTFOLIO (5)
  {
    id: 6,
    group: 'Stratégie Portfolio',
    scenario: 'Allocation risque',
    ticker: 'N/A',
    message: `Je dois allouer 100,000$ entre actions, obligations et alternatives pour 2025.
Donne 3 portefeuilles selon mon profil:
1. AGRESSIF: jeune investisseur, 20+ ans horizon
2. MODÉRÉ: professionnel, 10-15 ans horizon
3. CONSERVATEUR: retraité, capital preservation

Pour chaque profil, fournis:
- % Actions / Obligations / Alternatives
- Allocation par secteur d'actions
- Allocation par durée obligations
- Justifications macro
- Expected return et volatilité
- Scénarios downside: -10%, -20%, -30%
Longueur: 1200+ mots, très détaillé.`,
    channels: ['web', 'email'],
    expectedLength: 1200,
    expectedScenarios: 3,
    cfa_concepts: ['Asset Allocation', 'Risk Tolerance', 'Expected Return', 'Volatility']
  },

  {
    id: 7,
    group: 'Stratégie Portfolio',
    scenario: 'Rebalancing tactique',
    ticker: 'MSFT, GOOGL, TD, SU, ACN',
    message: `Analyse ma watchlist: MSFT, GOOGL, TD, SU, ACN. Concentrations actuelles?
Recommande:
- Quels tickers vendre (trop chers)?
- Quels tickers acheter (bon ratio risque/récompense)?
- Timing: maintenant ou attendre correction?
- Impact rebalancing sur portefeuille risque
- Scénarios marché haussier vs baissier: quel impact rebalance?
Fournis positions recommandées concrètes avec % et justifications.
Longueur: 1000+ mots avec grille d'allocation.`,
    channels: ['web', 'sms'],
    expectedLength: 1000,
    expectedScenarios: 2,
    cfa_concepts: ['Portfolio Rebalancing', 'Concentration Risk', 'Tactical Allocation']
  },

  {
    id: 8,
    group: 'Stratégie Portfolio',
    scenario: 'Couverture de risque',
    ticker: 'N/A',
    message: `Je veux me couvrir contre une correction boursière de 20% en 2025. Options:
1. Quelle stratégie: vente shorte, puts, VIX calls, diversification?
2. Coûts: frais de transaction, prime options, opportunity cost?
3. Efficacité par scénario: correction légère (5%), moyenne (15%), sévère (30%)?
4. Comparaison hedge vs accepter drawdown vs rebalance progressivement
5. Alternative: allocation cash/obligations supplémentaires?

Donne analyse quantitative avec coûts précis et efficacité par scénario.
Longueur: 1100+ mots.`,
    channels: ['web', 'email'],
    expectedLength: 1100,
    expectedScenarios: 3,
    cfa_concepts: ['Risk Management', 'Hedging Strategies', 'Options Greeks', 'Basis Risk']
  },

  {
    id: 9,
    group: 'Stratégie Portfolio',
    scenario: 'Tendance vs Valeur',
    ticker: 'N/A',
    message: `En 2025, est-ce le moment de momentum ou mean-reversion?
Analyse:
- Contexte macro: taux, croissance, inflation
- Technicals: où en sommes-nous du cycle?
- Sentiment investisseurs: greed ou fear?
- Backtests: momentum vs valeur en contexte similaire
- Allocation recommandée: % momentum vs % valeur
- Risques spécifiques à chaque approche
- 3 scénarios: Fed cuts, Fed pause, Fed hikes + impacts

Fournis données historiques et corrélations pour justifier.
Longueur: 1200+ mots.`,
    channels: ['web', 'sms'],
    expectedLength: 1200,
    expectedScenarios: 3,
    cfa_concepts: ['Momentum vs Value', 'Factor Exposure', 'Mean Reversion', 'Backtesting']
  },

  {
    id: 10,
    group: 'Stratégie Portfolio',
    scenario: 'Rotation sectorielle',
    ticker: 'N/A',
    message: `Rotation sectorielle 2025: Quels secteurs pour croissance vs inflation?
Analyse par secteur:
1. Technologie (AI boom vs valuations élevées)
2. Énergie (géopolitique, transition)
3. Financials (taux, marges prêts)
4. Consumer (inflation, emploi)
5. Healthcare (défensif, dépense croissante)
6. Matériaux (cycle commodités)

Pour chaque: opportunité, risques, catalyseurs, allocation%.
Corrélations sectoriales par scénario macro (récession, croissance, inflation).
Timeline rotations attendues?
Longueur: 1300+ mots avec tableau comparatif.`,
    channels: ['web', 'email'],
    expectedLength: 1300,
    expectedScenarios: 3,
    cfa_concepts: ['Sector Rotation', 'Factor Correlation', 'Macro Scenarios', 'Relative Performance']
  },

  // GROUP 3: ACTUALITÉ & MACRO (5)
  {
    id: 11,
    group: 'Actualité & Macro',
    scenario: 'News impact',
    ticker: 'N/A',
    message: `Impact d'une Fed cut surprise sur marchés (6 mois): Analyse:
- Quels marchés gagnent/perdent (actions, obligations, USD, commodités)?
- Timeline d'impact: immédiat vs 3-6 mois?
- Secteurs winners (cyclique, financials, rates-sensitive)?
- Secteurs losers?
- Scénarios: 1 cut, 2 cuts, 3+ cuts impact comparé
- Vols implicites, spreads crédit, courbe rendements: changements?
- Positions à prendre now et quand?
Analyse détaillée avec données historiques similaires.`,
    channels: ['web', 'sms'],
    expectedLength: 1200,
    expectedScenarios: 3,
    cfa_concepts: ['Monetary Policy Impact', 'Factor Exposure', 'Yield Curve', 'Market Correlation']
  },

  {
    id: 12,
    group: 'Actualité & Macro',
    scenario: 'Cycle Fed',
    ticker: 'N/A',
    message: `Quand va la Fed couper et quel timing pour investisseurs?
Analyse:
- Probabilités cut par réunion (data-driven, futures Fed)
- Chemins probables: 1 vs 2 vs 3+ cuts en 2025?
- Impact par classe d'actif (actions sectorielles, obligations, USD, real estate)
- Taux implicites dans prix marchés actuels (marché "priced in" quoi?)
- Catalyseurs: données emploi, inflation, géopolitique
- Timing optimal d'entrée par classe d'actif
- 3 scénarios: agg cuts, mild cuts, no cuts

Utilise données Fed funds futures et probabilités réelles.`,
    channels: ['web', 'email'],
    expectedLength: 1300,
    expectedScenarios: 3,
    cfa_concepts: ['Monetary Policy Transmission', 'Forward Guidance', 'Rate Expectations', 'Market Pricing']
  },

  {
    id: 13,
    group: 'Actualité & Macro',
    scenario: 'Election US',
    ticker: 'N/A',
    message: `2025 US Election: implications pour marché si Dems vs GOP?
Analyse:
- Différences politiques majeures (taxes, regs, healthcare)
- Secteurs impactés: tech, defense, energy, healthcare
- Impact USD, commerce international, tariffs
- Volatilité marchés par scénario avant/après vote
- Postures investisseurs recommandées par timing
- Scénario 1: GOP control
- Scénario 2: Dem control
- Scénario 3: Divisé (brokered)
- Timeline: quand impacts commencent (anticipation vs réalité)?
Longeur: 1300+ mots.`,
    channels: ['web', 'sms'],
    expectedLength: 1300,
    expectedScenarios: 3,
    cfa_concepts: ['Political Risk', 'Policy Uncertainty', 'Regulatory Impact', 'Sector Correlation to Politics']
  },

  {
    id: 14,
    group: 'Actualité & Macro',
    scenario: 'Récession indicator',
    ticker: 'N/A',
    message: `Sommes-nous en train de glisser vers récession?
Analyse des indicateurs:
- Yield curve (inversion, normalization?)
- ISM Manufacturing (output, new orders, employment)
- Credit spreads (HY, IG, commo credit)
- Unemployment rate trend et jobless claims
- Consumer spending vs savings rate
- Earnings revisions direction
- Taux croissance GDP estimés vs historique
- Probabilité de récession en 12 mois?
- 3 scénarios: soft landing, muddle through, récession
- Positions recommandées par scénario

Fournis données réelles (pas simulée) par indicateur.`,
    channels: ['web', 'email'],
    expectedLength: 1400,
    expectedScenarios: 3,
    cfa_concepts: ['Recession Indicators', 'Yield Curve Analysis', 'Economic Cycle', 'Defensive Positioning']
  },

  {
    id: 15,
    group: 'Actualité & Macro',
    scenario: 'Tech earnings',
    ticker: 'MSFT, GOOGL, AAPL, META, NVDA',
    message: `Résultats tech attendus: Priced in?
Analyse prochains earnings:
- Attentes consensus par ticker (EPS, revenus, FCF)
- Historique: beat rate, surprises direction
- Catalyseurs spécifiques par company
- Valuations pré vs post earnings historiquement
- Guidance forward: quelle confidence?
- Risk/reward par ticker: prix cible vs prix actuel
- Options strategy: IV crush post earnings?
- 3 scénarios: beat expectations, miss, inline
- Quand et sur quel ticker avoir exposition?

Utilise données réelles consensus et historique beat rates.`,
    channels: ['web', 'sms'],
    expectedLength: 1200,
    expectedScenarios: 3,
    cfa_concepts: ['Earnings Analysis', 'Valuation Multiples', 'Guidance Quality', 'Surprise Factor']
  },

  // GROUP 4: RISQUES & SCENARIOS (5)
  {
    id: 16,
    group: 'Risques & Scenarios',
    scenario: 'Stress test portefeuille',
    ticker: 'MSFT, GOOGL, TD, SU, ACN',
    message: `Stress test mon portefeuille (25% chaque = 20k par ticker) en crash -30%.
Analyse:
- Impact sur chaque position (-30% appliqué)
- Corrélations reales: quelques tickers montent quand autres baissent?
- Plus/moins exposé que marché? Bêta portefeuille?
- Scénarios: -10%, -20%, -30%, -40%
- Quels tickers résistent (defensive), quels s'effondrent?
- Positions stratégiques: quoi garder, quoi ajouter si crash?
- Recovery probabilités: historique reprises après crashes
- Perte psychologique tolérable? Stratégies mentales?

Calcule drawdowns réalistes et timing recovery.`,
    channels: ['web', 'email'],
    expectedLength: 1100,
    expectedScenarios: 4,
    cfa_concepts: ['Portfolio Beta', 'Correlation Analysis', 'Drawdown', 'Stress Testing', 'Recovery Time']
  },

  {
    id: 17,
    group: 'Risques & Scenarios',
    scenario: 'Taux d\'intérêt',
    ticker: 'N/A',
    message: `Si Fed monte taux à 5% (vs 4.5% today) - quel impact?
Analyse détaillée:
- Prix obligations (duration impact) - de -10 ans
- Rendements obligations: new yields attractive?
- Actions: quel secteur impacté (rates-sensitive: REITs, utilities, growth stocks)
- Multiples: où P/E compression?
- USD: appreciation vs commodités
- Crédit: spreads élargissent? Défauts augmentent?
- Profitabilité corporates: impact charges intérêt
- Opportunity: quelques secteurs deviennent attractifs?
- 3 scénarios: graduel vs rapide vs shock

Quantifie impacts par classe d'actif.`,
    channels: ['web', 'sms'],
    expectedLength: 1200,
    expectedScenarios: 3,
    cfa_concepts: ['Interest Rate Duration', 'Discount Rate', 'Multiple Compression', 'Carry Trade Unwinding']
  },

  {
    id: 18,
    group: 'Risques & Scenarios',
    scenario: 'Inflation surprise',
    ticker: 'N/A',
    message: `Inflation repart à 5% (vs 3% actuel): positions défensives?
Analyse:
- Gagnants inflation: commodités, linkers, TIPS, stocks réels
- Perdants: obligations nominales, croissance à faible marge
- Rotation sectorielle: energy, materials, consumer defensive
- Stagflation risk: croissance + inflation (worst case)
- Central banks: response options vs constraints
- Corporate margins: pricing power vs cost push
- Real estate: inflation hedge ou headwind?
- Alternatives: crypto comme inflation hedge?
- 3 scénarios: transitory, persistent, stagflation

Inclus corrélations actifs avec inflation passé.`,
    channels: ['web', 'email'],
    expectedLength: 1200,
    expectedScenarios: 3,
    cfa_concepts: ['Inflation Hedges', 'Real vs Nominal Returns', 'Stagflation', 'Purchasing Power', 'TIPS Spreads']
  },

  {
    id: 19,
    group: 'Risques & Scenarios',
    scenario: 'Disruption tech',
    ticker: 'N/A',
    message: `Quelle techno disrupte le plus en 2025-2030: AI vs Quantum vs Biotech?
Analyse:
- AI: timeline adoption, gagnants/perdants, margins
- Quantum: quand practical? Quels use cases?
- Biotech: mRNA, gene therapy: investissement opportunities?
- Disruption timeline vs hype cycle (Gartner)
- Companies exposées: direct vs indirect plays
- Comparaison valuations et risques
- 3 scénarios: techno breakthrough, delayed, overhyped
- Quels stocks/secteurs ont meilleur risk/reward?
- Allocation pour long-term growth (10+ ans)?

Distingue hype from reality avec données.`,
    channels: ['web', 'sms'],
    expectedLength: 1300,
    expectedScenarios: 3,
    cfa_concepts: ['Technological Disruption', 'S-Curve Adoption', 'First Mover Advantage', 'Obsolescence Risk']
  },

  {
    id: 20,
    group: 'Risques & Scenarios',
    scenario: 'Événement géopolitique',
    ticker: 'N/A',
    message: `Conflict US-China: quels impacts sur stocks tech et marchés?
Analyse:
- Escalation timeline vs probability
- Secteurs directement impactés (semiconductors, defense, agriculture)
- Supply chain disruptions: quoi affecté?
- Tariffs: cost inflation vs market share competition
- Tech decoupling: US vs China tech ecosystems
- Geopolitical premium sur marchés
- 3 scénarios: cold war, trade war, hot war
- Quels stocks resistant vs vulnerable?
- Flight to safety: USD, treasuries, defensives
- ESG investor reactions?

Utilise historique Korea tensions, Russian invasion données.`,
    channels: ['web', 'email'],
    expectedLength: 1300,
    expectedScenarios: 3,
    cfa_concepts: ['Geopolitical Risk Premium', 'Supply Chain Risk', 'Sanctions Impact', 'Capital Flight']
  },

  // GROUP 5: QUESTIONS CFA (5)
  {
    id: 21,
    group: 'Questions CFA',
    scenario: 'DCF valuation',
    ticker: 'MSFT',
    message: `DCF Valuation pour Microsoft:
1. Build complet DCF model avec assomptions claires:
   - Revenue growth: next 5 years + terminal
   - EBITDA margins: historique vs projections
   - CapEx % revenues, NWC, tax rate
   - WACC: cost of equity, cost of debt, weights
   - Terminal growth rate (historique GDP vs assomption)
2. Valeur intrinsèque résultante
3. Analyses de sensibilités sur:
   - Growth rate ±2%
   - WACC ±1%
   - Terminal growth ±0.5%
4. Comparaison DCF vs trading multiples
5. Points de rupture: à quel prix devient trop cher?

Montre tous les calculs, assomptions justifiées avec données.`,
    channels: ['web', 'sms'],
    expectedLength: 1400,
    expectedScenarios: 3,
    cfa_concepts: ['DCF Model', 'WACC Calculation', 'Terminal Value', 'Sensitivity Analysis', 'Multiples Comparison']
  },

  {
    id: 22,
    group: 'Questions CFA',
    scenario: 'ESG impact',
    ticker: 'N/A',
    message: `ESG vraiment corrélé à outperformance long-terme? Analyse:
1. Études empiriques: ESG leaders vs laggards performance?
2. Périodes: ESG outperformance vs underperformance when?
3. Biais de sélection: survivorship, reversion to mean?
4. ESG ratings: qui mesure bien? (MSCI vs Sustainalytics vs Bloomberg)
5. ESG alpha: facteur independant vs proxy pour quality?
6. Corrélations: ESG vs momentum, value, quality, low-volatility
7. Future: ESG performance sustainable vs mean-reversion?
8. Investissement implications: portfolio construction avec ESG?
9. Risques ESG non-pricing: stranded assets, reputational

Cite études académiques réelles, pas suppositions.`,
    channels: ['web', 'email'],
    expectedLength: 1400,
    expectedScenarios: 2,
    cfa_concepts: ['ESG Integration', 'Factor Analysis', 'Empirical Research', 'Survivorship Bias', 'Performance Attribution']
  },

  {
    id: 23,
    group: 'Questions CFA',
    scenario: 'Options stratégies',
    ticker: 'MSFT',
    message: `Couvrir position long MSFT avec puts: optimal?
1. Scenario: possess 1000 MSFT @ $400 (40k position)
2. Put stratégies: quoi protect?
   - At-the-money puts (-2% from current)
   - Out-the-money (-5%, -10%)
   - Put spread (reduce cost) vs straight put
3. Coûts précis: premiums, Greeks (delta, gamma, theta, vega)
4. Efficacité par scenario: -10%, -20%, -30% marché
5. Opportunity cost: premium payé vs probabilité protection needed?
6. Comparaison stratégies: puts vs collar vs diversification
7. Tax implications: hedging vs realization gains
8. Breakeven: quand put premium "payée"?

Calcule Greeks réalistes et probabilité profitabilité.`,
    channels: ['web', 'sms'],
    expectedLength: 1200,
    expectedScenarios: 3,
    cfa_concepts: ['Put-Call Parity', 'Greeks', 'Volatility Surface', 'Hedging Effectiveness', 'Cost-Benefit Analysis']
  },

  {
    id: 24,
    group: 'Questions CFA',
    scenario: 'M&A impacts',
    ticker: 'N/A',
    message: `Acquisition: Company A acquire Company B - stock impacts?
Exemple: Microsoft acquire OpenAI (hypothetical):
1. Deal terms: all-cash, stock, conditions, timing
2. Synergies: revenue synergies (cross-sell), cost synergies (duplication)
3. Quantification synergies: timing realization (1-3 years)
4. Acquisition premium: quoi payé vs intrinsic value?
5. Dilution risk: MS shareholders diluted? Earnings per share impact?
6. Regulatory risks: antitrust, FCC, foreign ownership
7. Timeline: deal close probability, regulatory approval
8. Stock price reactions:
   - Acquirer: usually -2-5% sur uncertainty
   - Target: +20-30% sur premium
9. Long-term: value creation ou destruction historiquement?

Utilise réel M&A data pour comparaisons.`,
    channels: ['web', 'email'],
    expectedLength: 1300,
    expectedScenarios: 3,
    cfa_concepts: ['M&A Valuation', 'Synergy Analysis', 'Deal Risk Premium', 'Accretion/Dilution', 'Regulatory Risk']
  },

  {
    id: 25,
    group: 'Questions CFA',
    scenario: 'Comportement investisseur',
    ticker: 'N/A',
    message: `Pourquoi investisseurs panic-sell en baisse? Psychologie:
1. Biais comportementaux: loss aversion, recency bias, herd mentality
2. Données: corrélation selling avec drawdown severity?
3. Time horizon mismatch: long-term investors vs short-term pain?
4. Strategies mentales pour résister:
   - Goal-based investing (remind pourquoi on invested)
   - Dollar-cost averaging (buy dips systematiquement)
   - Automatisation (remove emotion from decisions)
   - Portfolio segmentation (core + tactical)
5. Quantification: rendement différence entre panic vs stay invested?
6. Historique: past crashes recovery, time to recover
7. Statistiques: % investisseurs qui sold at bottom vs stayed?
8. Recommendations: for emotional investors vs disciplined

Cite psychology research et market data réelle.`,
    channels: ['web', 'sms'],
    expectedLength: 1300,
    expectedScenarios: 2,
    cfa_concepts: ['Behavioral Finance', 'Loss Aversion', 'Anchoring Bias', 'Herd Behavior', 'Time Horizon', 'Dollar-Cost Averaging']
  }
];

// ============================================================================
// GRILLE D'ÉVALUATION (100 pts)
// ============================================================================

const EVALUATION_CRITERIA = {
  coherence: {
    weight: 15,
    items: [
      'YTD et ratios cohérents',
      'Citations sources cohérentes',
      'Pas de contradictions internes'
    ]
  },
  sophistication: {
    weight: 20,
    items: [
      'Utilisation concepts CFA',
      'Analyses multidimensionnelles',
      'Nuances et contexte',
      'Professionnalisme ton/structure'
    ]
  },
  longueur_profondeur: {
    weight: 15,
    items: [
      'Réponse > 800 mots',
      '3+ scénarios explorés',
      'Détail calculs/ratios'
    ]
  },
  memoire_conversation: {
    weight: 10,
    items: [
      'Rappel contexte conversations'
    ]
  },
  valeur_ajoutee: {
    weight: 15,
    items: [
      'Au-delà du factuel',
      'Points forts ET faibles',
      'Recommandations actionables'
    ]
  },
  scenarios: {
    weight: 15,
    items: [
      'Optimiste exploré',
      'Pessimiste exploré',
      'Réaliste exploré'
    ]
  },
  multichannel_consistency: {
    weight: 10,
    items: [
      'Substance identique web/SMS/email'
    ]
  }
};

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runTests() {
  console.log('🧪 EMMA 25 Comprehensive Test Suite Started\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Log Directory: ${LOG_DIR}\n`);

  const startTime = Date.now();
  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const scenario of TEST_SCENARIOS) {
    const testStartTime = Date.now();
    console.log(`\n[${scenario.id}/25] ${scenario.scenario} (${scenario.ticker})`);
    console.log(`─`.repeat(70));

    try {
      // Test par canal
      const channelResults = {};
      for (const channel of scenario.channels) {
        console.log(`  → Testing via ${channel}...`);
        
        const response = await testEmmaViaChannel(scenario, channel);
        channelResults[channel] = response;

        if (!response.success) {
          console.log(`  ❌ ${channel} failed: ${response.error}`);
          failedCount++;
          continue;
        }

        // Évaluer réponse
        const evaluation = evaluateResponse(scenario, response);
        
        console.log(`  ✓ ${channel}: Score ${evaluation.score}/100 (${evaluation.grade})`);
        if (evaluation.score < 75) {
          console.log(`    ⚠️  WARNING: Score < 75`);
        }
      }

      // Compile résultat test
      const testResult = {
        id: scenario.id,
        scenario: scenario.scenario,
        group: scenario.group,
        timestamp: new Date().toISOString(),
        channelResults: channelResults,
        duration_ms: Date.now() - testStartTime
      };

      results.push(testResult);
      
      // Sauvegarder résultat
      const testFile = path.join(LOG_DIR, `test_${String(scenario.id).padStart(2, '0')}.json`);
      fs.writeFileSync(testFile, JSON.stringify(testResult, null, 2));
      
      passedCount++;

    } catch (error) {
      console.error(`  ❌ Test failed: ${error.message}`);
      failedCount++;
    }
  }

  // Summary
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n${'='.repeat(70)}`);
  console.log(`\n📊 TEST SUMMARY`);
  console.log(`─`.repeat(70));
  console.log(`Total Tests: ${results.length}/25`);
  console.log(`Passed: ${passedCount} ✓`);
  console.log(`Failed: ${failedCount} ❌`);
  console.log(`Total Duration: ${totalTime} minutes\n`);

  // Sauvegarder résultats
  const summaryFile = {
    timestamp: new Date().toISOString(),
    total_tests: results.length,
    passed: passedCount,
    failed: failedCount,
    duration_minutes: parseFloat(totalTime),
    results: results
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(summaryFile, null, 2));
  console.log(`✅ Results saved to: ${RESULTS_FILE}`);

  // Générer rapport
  await generateReport(summaryFile);
}

// ============================================================================
// TEST EXECUTION FUNCTIONS
// ============================================================================

async function testEmmaViaChannel(scenario, channel) {
  try {
    const payload = {
      message: scenario.message,
      userId: `test_${scenario.id}_${channel}`,
      channel: channel,
      metadata: {
        test_scenario_id: scenario.id,
        test_group: scenario.group
      }
    };

    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 60000
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    
    return {
      success: data.success === true,
      response: data.response || data.message,
      metadata: data.metadata || {}
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// EVALUATION FUNCTION
// ============================================================================

function evaluateResponse(scenario, response) {
  if (!response.success) {
    return {
      score: 0,
      grade: 'F',
      notes: 'Response failed'
    };
  }

  let score = 0;
  const notes = [];

  // 1. Cohérence (15 pts)
  const coherenceScore = checkCoherence(response.response) * 15;
  score += coherenceScore;
  notes.push(`Coherence: ${coherenceScore}/15`);

  // 2. Sophistication (20 pts)
  const sophisticationScore = checkSophistication(response.response, scenario) * 20;
  score += sophisticationScore;
  notes.push(`Sophistication: ${sophisticationScore}/20`);

  // 3. Longueur (15 pts)
  const lengthScore = checkLength(response.response, scenario.expectedLength) * 15;
  score += lengthScore;
  notes.push(`Longueur: ${lengthScore}/15 (${response.response.length} chars)`);

  // 4. Scénarios (15 pts)
  const scenarioScore = checkScenarios(response.response, scenario.expectedScenarios) * 15;
  score += scenarioScore;
  notes.push(`Scénarios: ${scenarioScore}/15`);

  // 5. Valeur ajoutée (15 pts)
  const valueScore = checkAddedValue(response.response) * 15;
  score += valueScore;
  notes.push(`Valeur ajoutée: ${valueScore}/15`);

  // 6. Multi-canal (10 pts)
  // À implémenter après test comparaison canaux

  const grade = scoreToGrade(score);

  return {
    score: Math.round(score),
    grade,
    notes: notes.join(' | ')
  };
}

// Helper functions
function checkCoherence(text) {
  let score = 0.8;
  // Vérifier pas de contradictions évidentes
  if (!text.includes('contradiction')) score += 0.1;
  return Math.min(score, 1.0);
}

function checkSophistication(text, scenario) {
  let score = 0.6;
  // Vérifier présence concepts CFA
  const cfaConcepts = scenario.cfa_concepts || [];
  const conceptsFound = cfaConcepts.filter(c => 
    text.toLowerCase().includes(c.toLowerCase())
  ).length;
  score += (conceptsFound / Math.max(cfaConcepts.length, 1)) * 0.3;
  
  // Vérifier nuances ('d\'un côté', 'd\'un autre')
  if (text.includes('d\'un') || text.includes("l'autre")) score += 0.1;
  
  return Math.min(score, 1.0);
}

function checkLength(text, expectedLength) {
  const ratio = text.length / Math.max(expectedLength, 500);
  return Math.min(ratio, 1.0);
}

function checkScenarios(text, expectedCount) {
  const optimist = text.toLowerCase().includes('optimiste') || text.toLowerCase().includes('upside');
  const pessimist = text.toLowerCase().includes('pessimiste') || text.toLowerCase().includes('downside');
  const realistic = text.toLowerCase().includes('réaliste') || text.toLowerCase().includes('base case');
  
  const count = [optimist, pessimist, realistic].filter(Boolean).length;
  return count / Math.max(expectedCount, 2);
}

function checkAddedValue(text) {
  let score = 0.7;
  // Vérifier recommandations
  if (text.toLowerCase().includes('recommand')) score += 0.2;
  // Vérifier points forts ET faibles
  if (text.toLowerCase().includes('point faible') || text.toLowerCase().includes('weakness')) score += 0.1;
  return Math.min(score, 1.0);
}

function scoreToGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

async function generateReport(summary) {
  const report = `# 📊 EMMA 25 Comprehensive Test Results

Generated: ${new Date().toISOString()}

## Executive Summary

- **Total Tests**: ${summary.total_tests}/25
- **Passed**: ${summary.passed}
- **Failed**: ${summary.failed}
- **Duration**: ${summary.duration_minutes} minutes

## Detailed Results

\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`

## Test Categories

### Group 1: Analyses Fondamentales (5 tests)
Tests 1-5

### Group 2: Stratégie Portfolio (5 tests)
Tests 6-10

### Group 3: Actualité & Macro (5 tests)
Tests 11-15

### Group 4: Risques & Scenarios (5 tests)
Tests 16-20

### Group 5: Questions CFA (5 tests)
Tests 21-25

## Recommendations

Based on test results, implement the following improvements:
1. ...
2. ...

---

Full test logs available in: \`${LOG_DIR}\`
`;

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`\n📄 Report generated: ${REPORT_FILE}`);
}

// ============================================================================
// RUN
// ============================================================================

console.log('Starting Emma 25 Comprehensive Test Suite...\n');
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

