/**
 * Script pour corriger les connexions multiples qui créent des branches séparées
 * 
 * Problème: "Fetch Prompts from API" et "Custom Workflow Configuration" 
 * se connectent à plusieurs nodes en parallèle, créant 2 workflows séparés
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction des branches multiples...\n');

// 1. Corriger "Fetch Prompts from API" → doit aller uniquement à "Get Active Tickers"
const fetchPromptsNode = workflow.nodes.find(n => n.name === 'Fetch Prompts from API');
const getActiveTickersNode = workflow.nodes.find(n => n.name === 'Get Active Tickers');
const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');

if (fetchPromptsNode && getActiveTickersNode) {
  if (!workflow.connections) {
    workflow.connections = {};
  }
  
  // Remplacer les connexions multiples par une seule connexion
  workflow.connections['Fetch Prompts from API'] = {
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
  console.log('✅ Fetch Prompts from API → Get Active Tickers (connexion unique)');
}

// 2. Corriger "Custom Workflow Configuration" → doit aller uniquement à "Get Active Tickers"
const customWorkflowConfigNode = workflow.nodes.find(n => n.name === 'Custom Workflow Configuration');

if (customWorkflowConfigNode && getActiveTickersNode) {
  workflow.connections['Custom Workflow Configuration'] = {
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
  console.log('✅ Custom Workflow Configuration → Get Active Tickers (connexion unique)');
}

// 3. Vérifier que "Get Active Tickers" → "Determine Time-Based Prompt" (déjà correct)
if (getActiveTickersNode && determinePromptNode) {
  if (!workflow.connections['Get Active Tickers']) {
    workflow.connections['Get Active Tickers'] = {
      main: [
        [
          {
            node: 'Determine Time-Based Prompt',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Get Active Tickers → Determine Time-Based Prompt (vérifié)');
  }
}

// 4. Vérifier "Workflow Configuration" → doit aller uniquement à "Fetch Prompts from API"
const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');

if (workflowConfigNode && fetchPromptsNode) {
  workflow.connections['Workflow Configuration'] = {
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
  console.log('✅ Workflow Configuration → Fetch Prompts from API (connexion unique)');
}

// 5. Corriger "Prepare API Request" qui a aussi des connexions multiples
const prepareApiRequestNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
const callEmmaApiNode = workflow.nodes.find(n => n.name === 'Call /api/chat (Emma)');

if (prepareApiRequestNode && callEmmaApiNode) {
  workflow.connections['Prepare API Request'] = {
    main: [
      [
        {
          node: 'Call /api/chat (Emma)',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Prepare API Request → Call /api/chat (Emma) (connexion unique)');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Toutes les branches multiples corrigées !');
console.log('\n📋 Flux unifié:');
console.log('   Workflow Configuration → Fetch Prompts from API');
console.log('   → Get Active Tickers');
console.log('   → Determine Time-Based Prompt');
console.log('   → ⚙️ AI Model Selector → ...');

