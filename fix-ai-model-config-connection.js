/**
 * Script pour s'assurer que "AI Model Config" est correctement connecté dans le flux
 * 
 * Le node doit être inséré après "Determine Time-Based Prompt" et avant "Prepare API Request"
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Vérification de la connexion de "AI Model Config"...\n');

// Trouver les nodes
const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');
const aiModelConfigNode = workflow.nodes.find(n => n.name === 'AI Model Config');
const prepareApiRequestNode = workflow.nodes.find(n => n.name === 'Prepare API Request');

if (!determinePromptNode || !aiModelConfigNode || !prepareApiRequestNode) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

// Vérifier la connexion Determine Time-Based Prompt → AI Model Config
if (workflow.connections['Determine Time-Based Prompt']) {
  const currentConnections = workflow.connections['Determine Time-Based Prompt'].main[0];
  const goesToAiModelConfig = currentConnections && currentConnections.find(c => c.node === 'AI Model Config');
  
  if (!goesToAiModelConfig) {
    // Remplacer la connexion directe vers Prepare API Request par AI Model Config
    workflow.connections['Determine Time-Based Prompt'] = {
      main: [
        [
          {
            node: 'AI Model Config',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Connexion: Determine Time-Based Prompt → AI Model Config');
  } else {
    console.log('✅ Connexion: Determine Time-Based Prompt → AI Model Config (déjà correcte)');
  }
} else {
  workflow.connections['Determine Time-Based Prompt'] = {
    main: [
      [
        {
          node: 'AI Model Config',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Connexion: Determine Time-Based Prompt → AI Model Config (créée)');
}

// Vérifier la connexion AI Model Config → Prepare API Request
if (workflow.connections['AI Model Config']) {
  const currentConnections = workflow.connections['AI Model Config'].main[0];
  const goesToPrepareApi = currentConnections && currentConnections.find(c => c.node === 'Prepare API Request');
  
  if (!goesToPrepareApi) {
    workflow.connections['AI Model Config'] = {
      main: [
        [
          {
            node: 'Prepare API Request',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Connexion: AI Model Config → Prepare API Request (corrigée)');
  } else {
    console.log('✅ Connexion: AI Model Config → Prepare API Request (déjà correcte)');
  }
} else {
  workflow.connections['AI Model Config'] = {
    main: [
      [
        {
          node: 'Prepare API Request',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Connexion: AI Model Config → Prepare API Request (créée)');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Flux vérifié et corrigé !');
console.log('\n📋 Flux final:');
console.log('   Determine Time-Based Prompt');
console.log('   → AI Model Config (choix: emma ou gemini)');
console.log('   → Prepare API Request');
console.log('   → Choose AI Model? (IF)');
console.log('      - TRUE → Call /api/chat (Emma) → Parse API Response');
console.log('      - FALSE → Call Gemini API → Parse Gemini Response → Parse API Response');

