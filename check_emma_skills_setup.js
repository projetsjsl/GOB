#!/usr/bin/env node

/**
 * Check Emma SKILLS Test Setup
 * 
 * Vérifie que tout est prêt avant de lancer les tests
 * - API endpoint accessible?
 * - Chat API fonctionne?
 * - SKILLS command détecté?
 * - Réponses cohérentes?
 * 
 * Usage:
 *   node check_emma_skills_setup.js
 */

import fetch from 'node-fetch';
import fs from 'fs';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function checkSetup() {
  console.log('🔍 Emma SKILLS Test Setup Checker\n');
  console.log('═'.repeat(80));

  let checksPassed = 0;
  let checksFailed = 0;

  // CHECK 1: API accessible
  console.log('\n✓ Check 1: API Endpoint Accessibility');
  console.log('─'.repeat(80));
  try {
    const response = await fetch(`${API_BASE}/api/status`, {
      timeout: 5000
    });

    if (response.ok) {
      console.log(`✅ API accessible at ${API_BASE}`);
      checksPassed++;
    } else {
      console.log(`⚠️  API returned ${response.status}`);
      checksFailed++;
    }
  } catch (error) {
    console.log(`❌ Cannot reach API: ${error.message}`);
    console.log(`   Make sure to run: npm run dev`);
    checksFailed++;
  }

  // CHECK 2: Chat endpoint works
  console.log('\n✓ Check 2: Chat API Endpoint');
  console.log('─'.repeat(80));
  try {
    console.log('   Sending test message...');
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'SKILLS',
        userId: 'setup_check',
        channel: 'web'
      }),
      timeout: 30000
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Chat API working`);
      console.log(`   Response length: ${data.response?.length || 0} chars`);
      console.log(`   Contains "EMMA": ${data.response?.includes('EMMA') ? 'Yes' : 'No'}`);
      console.log(`   Contains "SKILLS": ${data.response?.includes('SKILLS') ? 'Yes' : 'No'}`);
      checksPassed++;
    } else {
      console.log(`⚠️  Chat API returned error: ${data.error}`);
      checksFailed++;
    }
  } catch (error) {
    console.log(`❌ Chat API error: ${error.message}`);
    checksFailed++;
  }

  // CHECK 3: Test SKILLS detection
  console.log('\n✓ Check 3: SKILLS Command Detection');
  console.log('─'.repeat(80));
  try {
    const skillsTest = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'SKILLS',
        userId: 'setup_check_skills',
        channel: 'web'
      }),
      timeout: 30000
    });

    const skillsData = await skillsTest.json();

    if (skillsData.response?.includes('📊 ANALYSES')) {
      console.log(`✅ SKILLS command detected and formatted`);
      console.log(`   Response includes analysis categories`);
      checksPassed++;
    } else {
      console.log(`⚠️  SKILLS response not formatted correctly`);
      console.log(`   Response preview: ${skillsData.response?.substring(0, 100)}`);
      checksFailed++;
    }
  } catch (error) {
    console.log(`❌ SKILLS test error: ${error.message}`);
    checksFailed++;
  }

  // CHECK 4: Test specific SKILL
  console.log('\n✓ Check 4: Sample SKILL Test (ANALYSE MSFT)');
  console.log('─'.repeat(80));
  try {
    const analyseTest = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'ANALYSE MSFT',
        userId: 'setup_check_analyse',
        channel: 'web',
        metadata: { tickers: ['MSFT'] }
      }),
      timeout: 60000
    });

    const analyseData = await analyseTest.json();

    if (analyseData.success && analyseData.response?.length > 100) {
      console.log(`✅ Sample SKILL (ANALYSE MSFT) works`);
      console.log(`   Response length: ${analyseData.response.length} chars`);
      console.log(`   Contains "MSFT": ${analyseData.response?.includes('MSFT') ? 'Yes' : 'No'}`);
      checksPassed++;
    } else {
      console.log(`⚠️  Sample SKILL response too short or error`);
      console.log(`   Length: ${analyseData.response?.length || 0}`);
      checksFailed++;
    }
  } catch (error) {
    console.log(`❌ Sample SKILL error: ${error.message}`);
    checksFailed++;
  }

  // CHECK 5: Log directory
  console.log('\n✓ Check 5: Log Directory');
  console.log('─'.repeat(80));
  try {
    if (!fs.existsSync('./logs/emma_skills_test')) {
      fs.mkdirSync('./logs/emma_skills_test', { recursive: true });
      console.log(`✅ Log directory created: ./logs/emma_skills_test`);
    } else {
      console.log(`✅ Log directory exists: ./logs/emma_skills_test`);
    }
    checksPassed++;
  } catch (error) {
    console.log(`❌ Cannot create log directory: ${error.message}`);
    checksFailed++;
  }

  // CHECK 6: Test files exist
  console.log('\n✓ Check 6: Test Script Files');
  console.log('─'.repeat(80));
  const files = [
    'test_emma_all_skills.js',
    'analyze_emma_skills_responses.js',
    'EMMA_SKILLS_TEST_GUIDE.md'
  ];

  for (const file of files) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
      checksFailed++;
    }
  }
  checksPassed += files.filter(f => fs.existsSync(f)).length;

  // SUMMARY
  console.log(`\n${'═'.repeat(80)}`);
  console.log('📊 SUMMARY\n');

  console.log(`Checks Passed: ${checksPassed} ✅`);
  console.log(`Checks Failed: ${checksFailed} ❌\n`);

  if (checksFailed === 0) {
    console.log('✅ ALL CHECKS PASSED - Ready to run tests!\n');
    console.log('🚀 Next command:\n');
    console.log('   node test_emma_all_skills.js\n');
    console.log('Or read guide:\n');
    console.log('   cat EMMA_SKILLS_TEST_GUIDE.md');
    process.exit(0);
  } else {
    console.log('⚠️  SOME CHECKS FAILED - Please fix before running tests\n');
    console.log('Common fixes:\n');
    console.log('1. API not running?');
    console.log('   → Run: npm run dev\n');
    console.log('2. Environment variables missing?');
    console.log('   → Check: GEMINI_API_KEY, API_BASE\n');
    console.log('3. Timeout errors?');
    console.log('   → May need longer timeout (first request can be slow)\n');
    process.exit(1);
  }
}

checkSetup().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

