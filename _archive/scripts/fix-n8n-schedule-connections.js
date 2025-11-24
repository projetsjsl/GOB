/**
 * Script pour corriger les connexions du Schedule Trigger dans le workflow n8n
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction des connexions du Schedule Trigger...\n');

// Vérifier que les nodes existent
const scheduleNode = workflow.nodes.find(n => n.name === 'Schedule Trigger (7h/12h/16h30 EST)');
const fetchPromptsNode = workflow.nodes.find(n => n.name === 'Fetch Prompts from API');
const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');
const getTickersNode = workflow.nodes.find(n => n.name === 'Get Active Tickers');

if (!scheduleNode) {
  console.error('❌ Schedule Trigger node non trouvé');
  process.exit(1);
}

console.log('✅ Nodes trouvés:');
console.log(`   - Schedule Trigger: ${scheduleNode ? '✅' : '❌'}`);
console.log(`   - Fetch Prompts from API: ${fetchPromptsNode ? '✅' : '❌'}`);
console.log(`   - Workflow Configuration: ${workflowConfigNode ? '✅' : '❌'}`);
console.log(`   - Get Active Tickers: ${getTickersNode ? '✅' : '❌'}\n`);

// Corriger les connexions
// Schedule Trigger → Fetch Prompts from API → Determine Time-Based Prompt
// OU Schedule Trigger → Workflow Configuration → Get Active Tickers → Determine Time-Based Prompt

// Option 1: Schedule → Fetch Prompts → Determine Time-Based Prompt (recommandé)
if (fetchPromptsNode) {
  workflow.connections['Schedule Trigger (7h/12h/16h30 EST)'] = {
    main: [
      [
        {
          node: 'Fetch Prompts from API',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Schedule Trigger connecté à "Fetch Prompts from API"');
} else if (workflowConfigNode) {
  // Option 2: Schedule → Workflow Configuration → Get Active Tickers
  workflow.connections['Schedule Trigger (7h/12h/16h30 EST)'] = {
    main: [
      [
        {
          node: 'Workflow Configuration',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Schedule Trigger connecté à "Workflow Configuration"');
} else {
  // Option 3: Schedule → Get Active Tickers directement
  if (getTickersNode) {
    workflow.connections['Schedule Trigger (7h/12h/16h30 EST)'] = {
      main: [
        [
          {
            node: 'Get Active Tickers',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Schedule Trigger connecté à "Get Active Tickers"');
  } else {
    console.error('❌ Aucun node de destination trouvé pour Schedule Trigger');
    process.exit(1);
  }
}

// Vérifier aussi que Webhook Trigger est connecté
const webhookNode = workflow.nodes.find(n => n.name === 'Webhook Trigger');
if (webhookNode) {
  if (!workflow.connections['Webhook Trigger'] || 
      !workflow.connections['Webhook Trigger'].main || 
      workflow.connections['Webhook Trigger'].main[0].length === 0) {
    // Connecter Webhook Trigger à Fetch Prompts ou Workflow Configuration
    if (fetchPromptsNode) {
      workflow.connections['Webhook Trigger'] = {
        main: [
          [
            {
              node: 'Fetch Prompts from API',
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log('✅ Webhook Trigger connecté à "Fetch Prompts from API"');
    } else if (workflowConfigNode) {
      workflow.connections['Webhook Trigger'] = {
        main: [
          [
            {
              node: 'Workflow Configuration',
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log('✅ Webhook Trigger connecté à "Workflow Configuration"');
    }
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Résumé des connexions:');
console.log('   Schedule Trigger → Fetch Prompts from API → Determine Time-Based Prompt → ...');
console.log('   Webhook Trigger → Fetch Prompts from API → Determine Time-Based Prompt → ...');
console.log('   Manual Trigger → Custom Prompt Input → Merge Triggers → ...');

