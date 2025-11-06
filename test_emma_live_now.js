#!/usr/bin/env node

/**
 * Test Live Emma - Faire des appels RÉELS maintenant
 * 
 * Exécute 10 appels immédiats à Emma et affiche les réponses en direct
 * Teste: cohérence YTD, sophistication, longueur, scénarios
 * 
 * Utilisation:
 *   node test_emma_live_now.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const LOG_DIR = './logs/emma_live_tests';

// Créer répertoire logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ============================================================================
// 10 TESTS RAPIDES (Sample of 25)
// ============================================================================

const QUICK_TESTS = [
  {
    id: 1,
    name: 'MSFT Analyse Fondamentale',
    channel: 'web',
    message: `Fais une analyse fondamentale COMPLÈTE de Microsoft (MSFT).
Inclus:
- Valorisation: P/E, P/FCF, comparaison secteur
- Rentabilité: ROE, ROIC, marges
- 3 scénarios: optimiste, pessimiste, réaliste
- Points forts et faibles
- Recommandation avec prix cible
Longueur: 1000+ mots.`
  },

  {
    id: 2,
    name: 'Comparaison 3 Techs',
    channel: 'web',
    message: `Compare rapidement Google (GOOGL) vs Microsoft (MSFT) vs Apple (AAPL):
- Valorisation relative (P/E multiples)
- Rentabilité (ROE, marges)
- Croissance (revenue, EPS)
- Moat compétitif
- Lequel choisir et pourquoi?
Analyse détaillée, 1200+ mots.`
  },

  {
    id: 3,
    name: 'TD Comme Défensif',
    channel: 'sms',
    message: `TD Bank: bon défensif pour 2025?
Analyse rapide:
- Rendement dividende sûr?
- Sensibilité taux d'intérêt?
- Comparaison banques CA
- Risques immobilier Canada
- 3 scénarios: hausse taux, baisse, stagflation
Concis mais détaillé.`
  },

  {
    id: 4,
    name: 'Allocation 100k',
    channel: 'web',
    message: `J'ai 100,000$ à investir. Donne 3 portefeuilles:
1. AGRESSIF (jeune, 20+ ans)
2. MODÉRÉ (professionnel, 10-15 ans)
3. CONSERVATEUR (retraité)

Chaque: % actions/obligations, allocation secteurs, justification macro.
Expected return et volatilité estimés.
Scénarios downside: -10%, -20%, -30%.
Très détaillé, 1200+ mots.`
  },

  {
    id: 5,
    name: 'Fed Cut Impact',
    channel: 'web',
    message: `Fed cut surprise: impact sur marchés 6 mois?
- Quels marchés gagnent/perdent?
- Timeline d'effets (immédiat vs 3-6 mois)?
- Secteurs winners vs losers?
- Scénarios: 1 cut vs 2 cuts vs 3+ cuts
- Quelles positions prendre?
- Volatilité implicite, spreads crédit impacts?
Analyse détaillée avec données historiques.`
  },

  {
    id: 6,
    name: 'Récession Indicators',
    channel: 'sms',
    message: `Sommes-nous proche d'une récession? Checklist:
- Yield curve status?
- ISM Manufacturing trends?
- Credit spreads movement?
- Unemployment/jobless claims?
- Consumer spending trends?
- Earnings revisions direction?
- Probabilité récession 12 mois?
- 3 scénarios: soft landing, muddle, récession
Données réelles, pas simulation.`
  },

  {
    id: 7,
    name: 'DCF Valuation MSFT',
    channel: 'web',
    message: `DCF Valuation complète pour MSFT:
1. Build modèle avec assomptions claires:
   - Revenue growth 5 ans + terminal
   - EBITDA margins projections
   - CapEx, NWC, tax rate
   - WACC calculation (cost of equity + debt)
   - Terminal growth rate justifié
2. Valeur intrinsèque résultante
3. Analyses sensibilité: growth ±2%, WACC ±1%
4. Comparaison vs trading multiples
5. Points de rupture: trop cher quand?
Montre tous les calculs, assomptions justifiées.`
  },

  {
    id: 8,
    name: 'ESG Impact Real',
    channel: 'web',
    message: `ESG vraiment corrélé à outperformance? Honnêtement:
1. Études empiriques: ESG leaders vs laggards performance?
2. Périodes: quand ESG gagne vs perd?
3. Survivorship bias? Reversion to mean?
4. ESG ratings: qui mesure bien? (MSCI vs autres)
5. ESG alpha: facteur indépendant vs proxy pour quality?
6. Future: ESG performance sustainable?
7. Corrélations: ESG vs momentum, value, quality
Cite études académiques réelles, pas suppositions.`
  },

  {
    id: 9,
    name: 'Options Hedging',
    channel: 'web',
    message: `Couvrir position long MSFT 1000 shares @ $400 avec puts?
1. Stratégies:
   - At-the-money puts (-2% from current)
   - Out-the-money (-5%, -10%)
   - Put spread (reduce cost)
2. Coûts précis: premiums, Greeks (delta, gamma, theta, vega)
3. Efficacité par scenario: -10%, -20%, -30% marché
4. Coût vs probabilité protection needed
5. Comparaison: puts vs collar vs diversification vs bonds
6. Breakeven analysis: quand put premium "payée"?
Calcule Greeks réalistes.`
  },

  {
    id: 10,
    name: 'Tech Disruption',
    channel: 'web',
    message: `Quelle techno disrupte le plus 2025-2030: AI vs Quantum?
1. AI: timeline adoption, gagnants/perdants, margins impactées
2. Quantum: quand practical? Quels use cases premiers?
3. Timeline vs hype cycle: breakthrough vs delayed vs overhyped?
4. Companies exposées: direct plays vs indirect?
5. Valuations comparées et risques
6. 3 scénarios: acceleration, delayed, limited adoption
7. Allocation portfolio pour long-term growth (10+ ans)?
Distingue hype from reality avec données réelles.`
  }
];

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runLiveTests() {
  console.log('🚀 EMMA LIVE TEST - 10 Appels Immédiats\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Log Directory: ${LOG_DIR}\n`);
  console.log('═'.repeat(80));

  const startTime = Date.now();
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const test of QUICK_TESTS) {
    console.log(`\n[${test.id}/10] ${test.name} (${test.channel})`);
    console.log('─'.repeat(80));

    try {
      console.log(`📤 Envoi à Emma...`);
      
      const response = await callEmmaAPI(test);
      
      if (!response.success) {
        console.log(`❌ Erreur: ${response.error}`);
        console.log(`   Details: ${response.details}\n`);
        failureCount++;
        results.push({
          ...test,
          success: false,
          error: response.error,
          timestamp: new Date().toISOString()
        });
        continue;
      }

      successCount++;

      // Afficher réponse Emma
      console.log(`\n✅ Réponse reçue (${response.response.length} chars, ${Math.round(response.response.split(' ').length)} words)`);
      console.log('─'.repeat(80));
      
      // Truncate pour afficher (max 500 chars)
      const preview = response.response.length > 500 
        ? response.response.substring(0, 500) + '\n...[tronqué]'
        : response.response;
      
      console.log(preview);
      console.log('─'.repeat(80));

      // Évaluation rapide
      const evaluation = evaluateResponse(test, response);
      console.log(`\n📊 Évaluation:`);
      console.log(`   Longueur: ${evaluation.length_score}/15 (${response.response.length} chars vs ${test.message.includes('800+') ? '800+' : '600+'} attendus)`);
      console.log(`   Cohérence: ${evaluation.coherence_score}/15`);
      console.log(`   Sophistication: ${evaluation.sophistication_score}/20`);
      console.log(`   Scénarios: ${evaluation.scenarios_score}/15`);
      console.log(`   Valeur Ajoutée: ${evaluation.value_score}/15`);
      console.log(`   📈 SCORE: ${evaluation.total}/100 (${evaluation.grade})\n`);

      // Sauvegarder résultat
      const testResult = {
        id: test.id,
        name: test.name,
        channel: test.channel,
        timestamp: new Date().toISOString(),
        response_length: response.response.length,
        response_preview: response.response.substring(0, 1000),
        full_response: response.response,
        metadata: response.metadata,
        evaluation: evaluation
      };

      results.push(testResult);

      // Sauvegarder fichier
      const fileName = `live_test_${String(test.id).padStart(2, '0')}.json`;
      fs.writeFileSync(path.join(LOG_DIR, fileName), JSON.stringify(testResult, null, 2));

    } catch (error) {
      console.error(`\n❌ Erreur lors du test: ${error.message}\n`);
      failureCount++;
      results.push({
        ...test,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`\n📊 SUMMARY`);
  console.log('─'.repeat(80));
  console.log(`Succès: ${successCount}/10 ✓`);
  console.log(`Erreurs: ${failureCount}/10 ❌`);
  console.log(`Durée: ${totalTime}s\n`);

  // Calcul scores moyens
  const successResults = results.filter(r => r.evaluation);
  if (successResults.length > 0) {
    const avgScore = (successResults.reduce((sum, r) => sum + r.evaluation.total, 0) / successResults.length).toFixed(1);
    console.log(`Score Moyen: ${avgScore}/100`);
    
    const avgLength = (successResults.reduce((sum, r) => sum + r.response_length, 0) / successResults.length).toFixed(0);
    console.log(`Longueur Moyenne: ${avgLength} chars (${Math.round(avgLength / 5)} words)`);
  }

  // Sauvegarder résumé
  const summary = {
    timestamp: new Date().toISOString(),
    total_tests: QUICK_TESTS.length,
    success: successCount,
    failed: failureCount,
    duration_seconds: parseFloat(totalTime),
    results: results
  };

  fs.writeFileSync(path.join(LOG_DIR, 'live_results_summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\n✅ Résultats sauvegardés dans: ${LOG_DIR}`);

  // Générer rapport markdown
  await generateLiveReport(summary);
}

// ============================================================================
// API CALLING
// ============================================================================

async function callEmmaAPI(test) {
  try {
    const payload = {
      message: test.message,
      userId: `live_test_${test.id}`,
      channel: test.channel,
      metadata: {
        test_name: test.name,
        test_id: test.id
      }
    };

    console.log(`   → URL: ${API_BASE}/api/chat`);
    console.log(`   → Channel: ${test.channel}`);
    console.log(`   → Message length: ${test.message.length} chars`);

    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 120000  // 2 min timeout
    });

    console.log(`   → Response Status: ${response.status}`);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        details: await response.text()
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Unknown error',
        details: data.message
      };
    }

    return {
      success: true,
      response: data.response,
      metadata: data.metadata
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.stack
    };
  }
}

// ============================================================================
// EVALUATION
// ============================================================================

function evaluateResponse(test, response) {
  let total = 0;

  // 1. Longueur (15 pts)
  const expectedLength = test.message.includes('1200+') ? 1200 : 
                        test.message.includes('1000+') ? 1000 : 800;
  const lengthRatio = response.response.length / expectedLength;
  const length_score = Math.min(lengthRatio * 15, 15);

  // 2. Cohérence (15 pts)
  const hasContradictions = response.response.toLowerCase().includes('contradictory');
  const coherence_score = hasContradictions ? 10 : 14;

  // 3. Sophistication (20 pts) - Vérifier concepts CFA
  const cfaConcepts = ['dcf', 'wacc', 'roic', 'fcf', 'pe', 'multiples', 'roi', 'margin', 'equity', 'leverage'];
  const conceptsFound = cfaConcepts.filter(c => response.response.toLowerCase().includes(c)).length;
  const sophistication_score = 10 + (conceptsFound / cfaConcepts.length) * 10;

  // 4. Scénarios (15 pts)
  const hasOptimistic = response.response.toLowerCase().includes('optimiste') || response.response.toLowerCase().includes('upside');
  const hasPessimistic = response.response.toLowerCase().includes('pessimiste') || response.response.toLowerCase().includes('downside');
  const hasRealistic = response.response.toLowerCase().includes('réaliste') || response.response.toLowerCase().includes('base case');
  
  const scenarioCount = [hasOptimistic, hasPessimistic, hasRealistic].filter(Boolean).length;
  const scenarios_score = (scenarioCount / 3) * 15;

  // 5. Valeur Ajoutée (15 pts)
  const hasRecommendation = response.response.toLowerCase().includes('recommand') || response.response.toLowerCase().includes('buy') || response.response.toLowerCase().includes('sell');
  const hasWeaknesses = response.response.toLowerCase().includes('weakness') || response.response.toLowerCase().includes('risque') || response.response.toLowerCase().includes('faible');
  
  let value_score = 8;
  if (hasRecommendation) value_score += 4;
  if (hasWeaknesses) value_score += 3;

  total = length_score + coherence_score + sophistication_score + scenarios_score + value_score;
  
  const grade = total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : 'F';

  return {
    total: Math.round(total),
    grade,
    length_score: Math.round(length_score),
    coherence_score,
    sophistication_score: Math.round(sophistication_score),
    scenarios_score: Math.round(scenarios_score),
    value_score: Math.round(value_score),
    concepts_found: conceptsFound
  };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

async function generateLiveReport(summary) {
  const report = `# 📊 Emma Live Test Results

Generated: ${new Date().toISOString()}

## Summary
- Total Tests: ${summary.total_tests}
- Successful: ${summary.success} ✓
- Failed: ${summary.failed} ❌
- Duration: ${summary.duration_seconds}s

## Results by Test

${summary.results.map((r, i) => {
  if (!r.evaluation) {
    return `### Test ${r.id}: ${r.name}
- **Status**: ❌ Failed - ${r.error}
`;
  }
  
  return `### Test ${r.id}: ${r.name} (${r.channel})
- **Score**: ${r.evaluation.total}/100 (${r.evaluation.grade})
- **Length**: ${r.response_length} chars (${r.evaluation.length_score}/15)
- **Coherence**: ${r.evaluation.coherence_score}/15
- **Sophistication**: ${r.evaluation.sophistication_score}/20 (concepts: ${r.evaluation.concepts_found})
- **Scenarios**: ${r.evaluation.scenarios_score}/15
- **Value Added**: ${r.evaluation.value_score}/15

**Preview**:
\`\`\`
${r.response_preview}
\`\`\`

---
`;
}).join('\n')}

## Overall Assessment

Average Score: ${summary.results.filter(r => r.evaluation).length > 0 ? (summary.results.filter(r => r.evaluation).reduce((sum, r) => sum + r.evaluation.total, 0) / summary.results.filter(r => r.evaluation).length).toFixed(1) : 'N/A'}/100

### Strengths
- [À compléter basé sur les résultats]

### Areas for Improvement
- [À compléter basé sur les résultats]

---

Full logs available in: \`${LOG_DIR}\`
`;

  fs.writeFileSync(path.join(LOG_DIR, 'EMMA_LIVE_TEST_REPORT.md'), report);
  console.log(`📄 Rapport généré: ${path.join(LOG_DIR, 'EMMA_LIVE_TEST_REPORT.md')}`);
}

// ============================================================================
// RUN
// ============================================================================

console.log('🚀 Starting Emma Live Test Suite...\n');
runLiveTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

