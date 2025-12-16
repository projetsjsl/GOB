#!/usr/bin/env node

/**
 * Test Emma All SKILLS - Test complet de tous les mots-clés
 * 
 * Pose à Emma des questions utilisant TOUS ses SKILLS (mots-clés)
 * et analyse les réponses pour cohérence, qualité, profondeur
 * 
 * SKILLS testés:
 * - Analyses: ANALYSE, FONDAMENTAUX, TECHNIQUE, COMPARER, PRIX, RATIOS, CROISSANCE
 * - Techniques: RSI, MACD, MOYENNES
 * - Actualités: TOP 5 NEWS, NEWS, ACTUALITES
 * - Calendriers: RESULTATS, CALENDRIER ECONOMIQUE
 * - Watchlist: LISTE, AJOUTER, RETIRER
 * - Marché: INDICES, MARCHE, SECTEUR
 * - Investissement: ACHETER, VENDRE
 * - Économie: INFLATION, FED, TAUX
 * - Aide: AIDE, EXEMPLES, SKILLS
 * 
 * Usage:
 *   node test_emma_all_skills.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const LOG_DIR = './logs/emma_skills_test';

// Créer répertoire logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ============================================================================
// TOUS LES SKILLS À TESTER
// ============================================================================

const EMMA_SKILLS = [
  // Analyses
  {
    category: 'Analyses Complètes',
    keyword: 'ANALYSE',
    question: 'ANALYSE MSFT',
    description: 'Analyse complète d\'un ticker'
  },
  {
    category: 'Analyses Complètes',
    keyword: 'FONDAMENTAUX',
    question: 'FONDAMENTAUX MSFT',
    description: 'Ratios financiers détaillés'
  },
  {
    category: 'Analyses Complètes',
    keyword: 'TECHNIQUE',
    question: 'TECHNIQUE MSFT',
    description: 'Analyse technique avec supports/résistances'
  },
  {
    category: 'Analyses Complètes',
    keyword: 'COMPARER',
    question: 'COMPARER MSFT GOOGL AAPL',
    description: 'Comparaison entre plusieurs tickers'
  },
  {
    category: 'Analyses Complètes',
    keyword: 'PRIX',
    question: 'PRIX MSFT',
    description: 'Prix temps réel et variation'
  },
  {
    category: 'Analyses Complètes',
    keyword: 'RATIOS',
    question: 'RATIOS MSFT',
    description: 'P/E, P/B, P/S, et autres ratios'
  },
  {
    category: 'Analyses Complètes',
    keyword: 'CROISSANCE',
    question: 'CROISSANCE MSFT',
    description: 'Analyse de croissance des revenus/EPS'
  },

  // Indicateurs Techniques
  {
    category: 'Indicateurs Techniques',
    keyword: 'RSI',
    question: 'RSI MSFT',
    description: 'Force relative (RSI) et niveaux'
  },
  {
    category: 'Indicateurs Techniques',
    keyword: 'MACD',
    question: 'MACD MSFT',
    description: 'Momentum MACD'
  },
  {
    category: 'Indicateurs Techniques',
    keyword: 'MOYENNES',
    question: 'MOYENNES MSFT',
    description: 'Moyennes mobiles 50/200'
  },

  // Actualités
  {
    category: 'Actualités',
    keyword: 'TOP 5 NEWS',
    question: 'TOP 5 NEWS',
    description: 'Top 5 actualités du jour'
  },
  {
    category: 'Actualités',
    keyword: 'NEWS',
    question: 'NEWS MSFT',
    description: 'Actualités spécifiques ticker'
  },
  {
    category: 'Actualités',
    keyword: 'ACTUALITES',
    question: 'ACTUALITES MSFT',
    description: 'Actualités alternatives'
  },

  // Calendriers
  {
    category: 'Calendriers',
    keyword: 'RESULTATS',
    question: 'RESULTATS',
    description: 'Earnings calendar complet'
  },
  {
    category: 'Calendriers',
    keyword: 'RESULTATS [TICKER]',
    question: 'RESULTATS MSFT',
    description: 'Earnings spécifique ticker'
  },
  {
    category: 'Calendriers',
    keyword: 'CALENDRIER ECONOMIQUE',
    question: 'CALENDRIER ECONOMIQUE',
    description: 'Événements macro économiques'
  },

  // Watchlist
  {
    category: 'Watchlist',
    keyword: 'LISTE',
    question: 'LISTE',
    description: 'Voir ta watchlist'
  },
  {
    category: 'Watchlist',
    keyword: 'AJOUTER',
    question: 'AJOUTER MSFT',
    description: 'Ajouter ticker à watchlist'
  },
  {
    category: 'Watchlist',
    keyword: 'RETIRER',
    question: 'RETIRER MSFT',
    description: 'Retirer ticker de watchlist'
  },

  // Marché
  {
    category: 'Vue Marché',
    keyword: 'INDICES',
    question: 'INDICES',
    description: 'Dow, S&P, Nasdaq'
  },
  {
    category: 'Vue Marché',
    keyword: 'MARCHE',
    question: 'MARCHE',
    description: 'Vue globale des marchés'
  },
  {
    category: 'Vue Marché',
    keyword: 'SECTEUR',
    question: 'SECTEUR TECHNOLOGIE',
    description: 'Analyse secteur'
  },

  // Investissement
  {
    category: 'Recommandations',
    keyword: 'ACHETER',
    question: 'ACHETER MSFT',
    description: 'Avis d\'achat avec justification'
  },
  {
    category: 'Recommandations',
    keyword: 'VENDRE',
    question: 'VENDRE MSFT',
    description: 'Avis de vente avec justification'
  },

  // Économie
  {
    category: 'Macro-Économie',
    keyword: 'INFLATION',
    question: 'INFLATION',
    description: 'Données inflation actuelles'
  },
  {
    category: 'Macro-Économie',
    keyword: 'FED',
    question: 'FED',
    description: 'Infos Fed et taux directeurs'
  },
  {
    category: 'Macro-Économie',
    keyword: 'TAUX',
    question: 'TAUX',
    description: 'Taux d\'intérêt directeurs'
  },

  // Aide
  {
    category: 'Aide',
    keyword: 'AIDE',
    question: 'AIDE',
    description: 'Guide complet d\'Emma'
  },
  {
    category: 'Aide',
    keyword: 'EXEMPLES',
    question: 'EXEMPLES',
    description: 'Exemples de questions'
  },
  {
    category: 'Aide',
    keyword: 'SKILLS',
    question: 'SKILLS',
    description: 'Liste de tous les SKILLS'
  }
];

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runSkillsTests() {
  console.log('🤖 EMMA SKILLS TEST - Test complet de tous les mots-clés\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Total SKILLS à tester: ${EMMA_SKILLS.length}\n`);
  console.log('═'.repeat(80));

  const startTime = Date.now();
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  const byCategory = {};

  for (let i = 0; i < EMMA_SKILLS.length; i++) {
    const skill = EMMA_SKILLS[i];
    const skillNum = i + 1;

    console.log(`\n[${skillNum}/${EMMA_SKILLS.length}] ${skill.keyword}`);
    console.log(`Category: ${skill.category}`);
    console.log(`Question: "${skill.question}"`);
    console.log(`Description: ${skill.description}`);
    console.log('─'.repeat(80));

    try {
      console.log('📤 Sending to Emma...');

      const response = await callEmmaAPI(skill.question);

      if (!response.success) {
        console.log(`❌ Error: ${response.error}`);
        failureCount++;
        results.push({
          ...skill,
          success: false,
          error: response.error,
          timestamp: new Date().toISOString()
        });
        continue;
      }

      successCount++;

      // Afficher preview
      const preview = response.response.length > 300
        ? response.response.substring(0, 300) + '\n...[tronqué]'
        : response.response;

      console.log(`\n✅ Response received (${response.response.length} chars)`);
      console.log(preview);

      // Évaluation rapide
      const evaluation = evaluateResponse(skill, response);
      console.log(`\n📊 Quick Evaluation:`);
      console.log(`   Length: ${evaluation.length_score}/10`);
      console.log(`   Coherence: ${evaluation.coherence_score}/10`);
      console.log(`   Relevance: ${evaluation.relevance_score}/10`);
      console.log(`   🎯 SCORE: ${evaluation.total}/30 (${evaluation.grade})\n`);

      // Track by category
      if (!byCategory[skill.category]) {
        byCategory[skill.category] = { total: 0, scores: [] };
      }
      byCategory[skill.category].total++;
      byCategory[skill.category].scores.push(evaluation.total);

      // Save detailed result
      const testResult = {
        skillNum,
        keyword: skill.keyword,
        category: skill.category,
        question: skill.question,
        description: skill.description,
        timestamp: new Date().toISOString(),
        response_length: response.response.length,
        response: response.response,
        metadata: response.metadata,
        evaluation: evaluation
      };

      results.push(testResult);

      // Save file
      const fileName = `skill_${String(skillNum).padStart(2, '0')}_${skill.keyword.replace(/\s+/g, '_')}.json`;
      fs.writeFileSync(path.join(LOG_DIR, fileName), JSON.stringify(testResult, null, 2));

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}\n`);
      failureCount++;
      results.push({
        ...skill,
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
  console.log(`Success: ${successCount}/${EMMA_SKILLS.length} ✓`);
  console.log(`Failures: ${failureCount}/${EMMA_SKILLS.length} ❌`);
  console.log(`Duration: ${totalTime}s\n`);

  // By Category Summary
  console.log('📂 By Category:');
  for (const [category, data] of Object.entries(byCategory)) {
    const avgScore = data.scores.length > 0 ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1) : 0;
    console.log(`   ${category}: ${data.total} tests, avg score ${avgScore}/30`);
  }

  // Save summary
  const summary = {
    timestamp: new Date().toISOString(),
    total_skills: EMMA_SKILLS.length,
    success: successCount,
    failed: failureCount,
    duration_seconds: parseFloat(totalTime),
    by_category: byCategory,
    results: results
  };

  fs.writeFileSync(path.join(LOG_DIR, 'skills_summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\n✅ Results saved to: ${LOG_DIR}`);

  // Generate report
  await generateSkillsReport(summary);
}

// ============================================================================
// API CALLING
// ============================================================================

async function callEmmaAPI(question) {
  try {
    const payload = {
      message: question,
      userId: `emma_skills_test_${Date.now()}`,
      channel: 'web',
      metadata: {
        test_type: 'skills_test'
      }
    };

    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 120000
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Unknown error'
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
      error: error.message
    };
  }
}

// ============================================================================
// EVALUATION
// ============================================================================

function evaluateResponse(skill, response) {
  let total = 0;

  // 1. Length (10 pts)
  const minLength = skill.category === 'Aide' ? 500 : 300;
  const lengthRatio = response.response.length / minLength;
  const length_score = Math.min(lengthRatio * 10, 10);

  // 2. Coherence (10 pts)
  const hasContradictions = response.response.toLowerCase().includes('error') && response.response.toLowerCase().includes('failed');
  const coherence_score = hasContradictions ? 5 : 9;

  // 3. Relevance (10 pts)
  const keywords = skill.keyword.split(' ');
  const keywordsFound = keywords.filter(kw => response.response.toLowerCase().includes(kw.toLowerCase())).length;
  const relevance_score = (keywordsFound / keywords.length) * 10;

  total = length_score + coherence_score + relevance_score;

  const grade = total >= 25 ? 'A' : total >= 20 ? 'B' : total >= 15 ? 'C' : 'D';

  return {
    total: Math.round(total),
    grade,
    length_score: Math.round(length_score),
    coherence_score,
    relevance_score: Math.round(relevance_score)
  };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

async function generateSkillsReport(summary) {
  const report = `# 📊 Emma SKILLS Test Report

Generated: ${new Date().toISOString()}

## Executive Summary

- **Total SKILLS Tested**: ${summary.total_skills}
- **Successful**: ${summary.success} ✓
- **Failed**: ${summary.failed} ❌
- **Duration**: ${summary.duration_seconds}s

## By Category

${Object.entries(summary.by_category).map(([category, data]) => {
  const avgScore = data.scores.length > 0 ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1) : 0;
  return `### ${category}
- Tests: ${data.total}
- Avg Score: ${avgScore}/30
`;
}).join('\n')}

## Detailed Results

${summary.results.map((r, i) => `
### ${i + 1}. ${r.keyword}

**Category**: ${r.category}

**Question**: \`${r.question}\`

**Description**: ${r.description}

**Status**: ${r.success ? '✓ Success' : '✗ Failed'}

${r.evaluation ? `**Score**: ${r.evaluation.total}/30 (${r.evaluation.grade})
- Length: ${r.evaluation.length_score}/10
- Coherence: ${r.evaluation.coherence_score}/10
- Relevance: ${r.evaluation.relevance_score}/10` : ''}

${r.response ? `**Response**:
\`\`\`
${r.response.substring(0, 500)}${r.response.length > 500 ? '\n...[tronqué]' : ''}
\`\`\`` : `**Error**: ${r.error}`}

---
`).join('\n')}

## Key Findings

1. **Most Effective SKILLS**: [Top performers]
2. **Needs Improvement**: [Low scores]
3. **Response Time**: Average ${(summary.duration_seconds / summary.total_skills).toFixed(1)}s per skill
4. **Consistency**: [Pattern analysis]

---

Full test logs available in: \`${LOG_DIR}\`
`;

  fs.writeFileSync(path.join(LOG_DIR, 'EMMA_SKILLS_REPORT.md'), report);
  console.log(`📄 Report generated: ${path.join(LOG_DIR, 'EMMA_SKILLS_REPORT.md')}`);
}

// ============================================================================
// RUN
// ============================================================================

console.log('🚀 Starting Emma SKILLS Test Suite...\n');
runSkillsTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

