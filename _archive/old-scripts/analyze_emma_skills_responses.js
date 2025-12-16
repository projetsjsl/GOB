#!/usr/bin/env node

/**
 * Analyze Emma SKILLS Responses
 * 
 * Analyse complète des réponses Emma pour tous les SKILLS
 * Génère: 
 * - Tableau récapitulatif
 * - Graphiques par catégorie
 * - Recommandations par SKILL
 * - Points forts/faibles
 * 
 * Usage:
 *   node analyze_emma_skills_responses.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = './logs/emma_skills_test';

async function analyzeSkillsResponses() {
  console.log('📊 Emma SKILLS Response Analysis\n');
  console.log('═'.repeat(100));

  // Load summary
  const summaryPath = path.join(LOG_DIR, 'skills_summary.json');
  if (!fs.existsSync(summaryPath)) {
    console.error('❌ No summary found. Run test_emma_all_skills.js first');
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

  // Organize results by category
  const resultsByCategory = {};
  summary.results.forEach(result => {
    if (!resultsByCategory[result.category]) {
      resultsByCategory[result.category] = [];
    }
    resultsByCategory[result.category].push(result);
  });

  // Generate tables and analysis
  console.log('\n📋 TEST RESULTS BY CATEGORY\n');

  let overallScores = [];

  for (const [category, results] of Object.entries(resultsByCategory)) {
    console.log(`\n${'═'.repeat(100)}`);
    console.log(`📂 ${category}`);
    console.log('═'.repeat(100));

    // Table header
    console.log('\n┌──┬────────────────────┬──────┬────────┬────────┬───────────┬─────────┐');
    console.log('│# │ Keyword            │Score │Length  │Coherence│Relevance│ Grade   │');
    console.log('├──┼────────────────────┼──────┼────────┼────────┼───────────┼─────────┤');

    const categoryScores = [];

    results.forEach((result, idx) => {
      const eval = result.evaluation || {};
      const score = eval.total || 0;
      const grade = eval.grade || 'N/A';
      const length_s = eval.length_score || 0;
      const coherence_s = eval.coherence_score || 0;
      const relevance_s = eval.relevance_score || 0;

      categoryScores.push(score);
      overallScores.push(score);

      const keyword = result.keyword.substring(0, 18).padEnd(18);
      const scoreStr = score.toString().padEnd(4);
      const lengthStr = length_s.toString().padEnd(6);
      const coherenceStr = coherence_s.toString().padEnd(8);
      const relevanceStr = relevance_s.toString().padEnd(7);
      const gradeStr = grade.padEnd(7);

      const gradeIcon = grade === 'A' ? '✅' : grade === 'B' ? '👍' : grade === 'C' ? '⚠️' : '❌';

      console.log(`│${String(idx + 1).padStart(2)}│ ${keyword} │${scoreStr}│${lengthStr}│${coherenceStr}│${relevanceStr}│ ${gradeIcon} ${gradeStr}│`);
    });

    console.log('└──┴────────────────────┴──────┴────────┴────────┴───────────┴─────────┘');

    // Category stats
    const avgScore = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
    const maxScore = Math.max(...categoryScores);
    const minScore = Math.min(...categoryScores);
    const aCount = results.filter(r => r.evaluation?.grade === 'A').length;
    const bCount = results.filter(r => r.evaluation?.grade === 'B').length;
    const cCount = results.filter(r => r.evaluation?.grade === 'C').length;
    const dCount = results.filter(r => r.evaluation?.grade === 'D').length;

    console.log(`\n📊 Category Stats:`);
    console.log(`   Avg Score: ${avgScore.toFixed(1)}/30`);
    console.log(`   Max: ${maxScore}/30 | Min: ${minScore}/30`);
    console.log(`   Grades: A=${aCount} 👍 B=${bCount} ⚠️ C=${cCount} ❌ D=${dCount}`);
  }

  // OVERALL SUMMARY
  console.log(`\n${'═'.repeat(100)}`);
  console.log('📊 OVERALL SUMMARY');
  console.log('═'.repeat(100));

  const avgOverall = overallScores.reduce((a, b) => a + b, 0) / overallScores.length;
  const maxOverall = Math.max(...overallScores);
  const minOverall = Math.min(...overallScores);
  const aCountOverall = summary.results.filter(r => r.evaluation?.grade === 'A').length;
  const bCountOverall = summary.results.filter(r => r.evaluation?.grade === 'B').length;
  const cCountOverall = summary.results.filter(r => r.evaluation?.grade === 'C').length;
  const dCountOverall = summary.results.filter(r => r.evaluation?.grade === 'D').length;

  console.log(`\n✅ Tested: ${summary.total_skills} SKILLS`);
  console.log(`⏱️  Duration: ${summary.duration_seconds}s (avg ${(summary.duration_seconds / summary.total_skills).toFixed(1)}s per skill)\n`);

  console.log('📈 OVERALL SCORES:');
  console.log(`   Average: ${avgOverall.toFixed(1)}/30`);
  console.log(`   Best: ${maxOverall}/30`);
  console.log(`   Worst: ${minOverall}/30\n`);

  console.log('📊 GRADE DISTRIBUTION:');
  console.log(`   A (25-30): ${aCountOverall} SKILLS ✅ (${((aCountOverall / summary.total_skills) * 100).toFixed(1)}%)`);
  console.log(`   B (20-24): ${bCountOverall} SKILLS 👍 (${((bCountOverall / summary.total_skills) * 100).toFixed(1)}%)`);
  console.log(`   C (15-19): ${cCountOverall} SKILLS ⚠️ (${((cCountOverall / summary.total_skills) * 100).toFixed(1)}%)`);
  console.log(`   D (<15):   ${dCountOverall} SKILLS ❌ (${((dCountOverall / summary.total_skills) * 100).toFixed(1)}%)\n`);

  // TOP PERFORMERS
  console.log('🌟 TOP 5 BEST PERFORMING SKILLS:');
  const sortedByScore = [...summary.results]
    .filter(r => r.evaluation)
    .sort((a, b) => (b.evaluation.total || 0) - (a.evaluation.total || 0))
    .slice(0, 5);

  sortedByScore.forEach((result, idx) => {
    console.log(`   ${idx + 1}. ${result.keyword.padEnd(25)} → ${result.evaluation.total}/30 (${result.evaluation.grade})`);
  });

  // NEEDS IMPROVEMENT
  console.log('\n⚠️  NEEDS IMPROVEMENT (Bottom 5):');
  const sortedByScoreAsc = [...summary.results]
    .filter(r => r.evaluation)
    .sort((a, b) => (a.evaluation.total || 0) - (b.evaluation.total || 0))
    .slice(0, 5);

  sortedByScoreAsc.forEach((result, idx) => {
    const issues = [];
    if ((result.evaluation.length_score || 0) < 7) issues.push('Length');
    if ((result.evaluation.coherence_score || 0) < 8) issues.push('Coherence');
    if ((result.evaluation.relevance_score || 0) < 8) issues.push('Relevance');

    console.log(`   ${idx + 1}. ${result.keyword.padEnd(25)} → ${result.evaluation.total}/30 (${result.evaluation.grade}) - Issues: ${issues.join(', ')}`);
  });

  // RECOMMENDATIONS BY ISSUE
  console.log(`\n${'═'.repeat(100)}`);
  console.log('💡 OPTIMIZATION RECOMMENDATIONS');
  console.log('═'.repeat(100));

  const lowLength = summary.results.filter(r => (r.evaluation?.length_score || 0) < 7);
  const lowCoherence = summary.results.filter(r => (r.evaluation?.coherence_score || 0) < 8);
  const lowRelevance = summary.results.filter(r => (r.evaluation?.relevance_score || 0) < 8);

  if (lowLength.length > 0) {
    console.log('\n📏 LENGTH ISSUES (' + lowLength.length + ' SKILLS):');
    console.log('   Problem: Responses too short or lacking detail');
    console.log('   Solution:');
    console.log('   1. Increase max_tokens in api/emma-agent.js');
    console.log('   2. Force detailed prompts for analysis SKILLS');
    console.log('   3. Add section headers to structure responses');
    console.log('\n   Affected SKILLS:');
    lowLength.slice(0, 5).forEach(r => {
      console.log(`   - ${r.keyword} (${r.evaluation.length_score}/10)`);
    });
  }

  if (lowCoherence.length > 0) {
    console.log('\n🎯 COHERENCE ISSUES (' + lowCoherence.length + ' SKILLS):');
    console.log('   Problem: Inconsistent data or contradictions');
    console.log('   Solution:');
    console.log('   1. Use ytd-validator for consistency checks');
    console.log('   2. Force single data source (FMP > Perplexity)');
    console.log('   3. Add validation layer before passing to Emma');
    console.log('\n   Affected SKILLS:');
    lowCoherence.slice(0, 5).forEach(r => {
      console.log(`   - ${r.keyword} (${r.evaluation.coherence_score}/10)`);
    });
  }

  if (lowRelevance.length > 0) {
    console.log('\n✓ RELEVANCE ISSUES (' + lowRelevance.length + ' SKILLS):');
    console.log('   Problem: Responses not directly addressing the question');
    console.log('   Solution:');
    console.log('   1. Add explicit examples to prompts');
    console.log('   2. Force inclusion of keywords in response');
    console.log('   3. Verify prompt construction for this SKILL');
    console.log('\n   Affected SKILLS:');
    lowRelevance.slice(0, 5).forEach(r => {
      console.log(`   - ${r.keyword} (${r.evaluation.relevance_score}/10)`);
    });
  }

  // Generate detailed markdown report
  generateDetailedReport(summary, resultsByCategory);
}

function generateDetailedReport(summary, resultsByCategory) {
  console.log('\n📄 Generating detailed markdown report...');

  let markdown = `# 📊 Emma SKILLS Analysis Report

Generated: ${new Date().toISOString()}

## Executive Summary

- **Total SKILLS**: ${summary.total_skills}
- **Tests Passed**: ${summary.success}
- **Duration**: ${summary.duration_seconds}s
- **Avg Score**: ${(summary.results.filter(r => r.evaluation).map(r => r.evaluation.total).reduce((a,b) => a+b, 0) / summary.results.filter(r => r.evaluation).length).toFixed(1)}/30

## By Category

`;

  for (const [category, results] of Object.entries(resultsByCategory)) {
    const avgScore = results.filter(r => r.evaluation).map(r => r.evaluation.total).reduce((a,b) => a+b, 0) / results.filter(r => r.evaluation).length;
    const aCount = results.filter(r => r.evaluation?.grade === 'A').length;

    markdown += `### ${category}
- Tests: ${results.length}
- Avg Score: ${avgScore.toFixed(1)}/30
- Grade A: ${aCount}/${results.length}

`;

    for (const result of results) {
      if (result.evaluation) {
        markdown += `#### ${result.keyword}
- Score: ${result.evaluation.total}/30 (${result.evaluation.grade})
- Length: ${result.evaluation.length_score}/10
- Coherence: ${result.evaluation.coherence_score}/10
- Relevance: ${result.evaluation.relevance_score}/10
- Description: ${result.description}

`;
      }
    }
  }

  fs.writeFileSync(path.join(LOG_DIR, 'EMMA_SKILLS_DETAILED_ANALYSIS.md'), markdown);
  console.log(`✅ Report saved: ${path.join(LOG_DIR, 'EMMA_SKILLS_DETAILED_ANALYSIS.md')}`);
}

// Run
analyzeSkillsResponses().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

