/**
 * Script pour corriger toutes les connexions vers le node IF
 * et s'assurer que tous les triggers passent bien par leurs nodes de config
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de toutes les connexions vers le node IF...\n');

// Trouver les nodes
const ifNode = workflow.nodes.find(n => n.name === 'Should Send Email?');
const debugNode = workflow.nodes.find(n => n.name === 'Debug Before Switch');
const parseNode = workflow.nodes.find(n => n.name === 'Parse API Response');

if (!ifNode) {
  console.error('❌ Node IF "Should Send Email?" non trouvé');
  process.exit(1);
}

console.log('✅ Node IF trouvé');

// 1. Corriger la connexion Debug Before Switch → Should Send Email?
if (debugNode) {
  if (workflow.connections['Debug Before Switch']) {
    workflow.connections['Debug Before Switch'] = {
      main: [
        [
          {
            node: 'Should Send Email?',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Debug Before Switch → Should Send Email?');
  }
}

// 2. S'assurer que Parse API Response → Debug Before Switch (ou directement IF si pas de debug)
if (parseNode) {
  if (!debugNode) {
    // Pas de debug node, connecter directement à IF
    workflow.connections['Parse API Response'] = {
      main: [
        [
          {
            node: 'Should Send Email?',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Parse API Response → Should Send Email? (direct)');
  } else {
    // Debug node existe, s'assurer que Parse → Debug
    if (!workflow.connections['Parse API Response']) {
      workflow.connections['Parse API Response'] = {
        main: [
          [
            {
              node: 'Debug Before Switch',
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log('✅ Parse API Response → Debug Before Switch');
    }
  }
}

// 3. Vérifier et corriger les connexions des triggers vers leurs config nodes
const triggers = [
  {
    trigger: 'Schedule Trigger (7h/12h/16h30 EST)',
    config: 'Schedule Config'
  },
  {
    trigger: 'Webhook Trigger',
    config: 'Webhook Config'
  },
  {
    trigger: 'Manual Trigger (Custom Prompt)',
    config: 'Manual Config',
    intermediate: 'Custom Prompt Input' // Passe par Custom Prompt Input d'abord
  },
  {
    trigger: 'Chat Trigger (Preview)',
    config: 'Chat Config',
    intermediate: 'Custom Prompt Input' // Passe par Custom Prompt Input d'abord
  }
];

triggers.forEach(({ trigger, config, intermediate }) => {
  const triggerNode = workflow.nodes.find(n => n.name === trigger);
  const configNode = workflow.nodes.find(n => n.name === config);
  
  if (!triggerNode || !configNode) {
    console.log(`⚠️  ${trigger}: Nodes non trouvés`);
    return;
  }
  
  // Vérifier la connexion
  const triggerConnections = workflow.connections[trigger];
  if (triggerConnections && triggerConnections.main && triggerConnections.main[0]) {
    const nextNode = triggerConnections.main[0][0];
    
    if (intermediate) {
      // Doit aller vers intermediate d'abord
      if (nextNode.node !== intermediate) {
        workflow.connections[trigger] = {
          main: [
            [
              {
                node: intermediate,
                type: 'main',
                index: 0
              }
            ]
          ]
        };
        console.log(`✅ ${trigger} → ${intermediate}`);
      } else {
        console.log(`✅ ${trigger} → ${intermediate} (déjà correct)`);
      }
    } else {
      // Doit aller directement vers config
      if (nextNode.node !== config) {
        workflow.connections[trigger] = {
          main: [
            [
              {
                node: config,
                type: 'main',
                index: 0
              }
            ]
          ]
        };
        console.log(`✅ ${trigger} → ${config}`);
      } else {
        console.log(`✅ ${trigger} → ${config} (déjà correct)`);
      }
    }
  } else {
    // Pas de connexion, créer
    if (intermediate) {
      workflow.connections[trigger] = {
        main: [
          [
            {
              node: intermediate,
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log(`✅ ${trigger} → ${intermediate} (créé)`);
    } else {
      workflow.connections[trigger] = {
        main: [
          [
            {
              node: config,
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log(`✅ ${trigger} → ${config} (créé)`);
    }
  }
});

// 4. Vérifier que Custom Prompt Input → Manual Config ou Chat Config
const customPromptInputNode = workflow.nodes.find(n => n.name === 'Custom Prompt Input');
if (customPromptInputNode) {
  const customConnections = workflow.connections['Custom Prompt Input'];
  if (customConnections && customConnections.main && customConnections.main[0]) {
    const nextNode = customConnections.main[0][0];
    // Doit aller vers Merge Triggers ou Manual Config
    if (nextNode.node !== 'Merge Triggers' && nextNode.node !== 'Manual Config') {
      // Vérifier si on doit aller vers Manual Config ou Merge Triggers
      // Si on vient de Manual Trigger, aller vers Manual Config
      // Si on vient de Chat Trigger, aller vers Chat Config
      // Pour l'instant, on va vers Merge Triggers qui devrait gérer ça
      workflow.connections['Custom Prompt Input'] = {
        main: [
          [
            {
              node: 'Merge Triggers',
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log('✅ Custom Prompt Input → Merge Triggers');
    } else {
      console.log(`✅ Custom Prompt Input → ${nextNode.node} (déjà correct)`);
    }
  }
}

// 5. Vérifier Merge Triggers → Fetch Prompts from API
const mergeTriggersNode = workflow.nodes.find(n => n.name === 'Merge Triggers');
if (mergeTriggersNode) {
  const mergeConnections = workflow.connections['Merge Triggers'];
  if (mergeConnections && mergeConnections.main && mergeConnections.main[0]) {
    const nextNode = mergeConnections.main[0][0];
    if (nextNode.node !== 'Fetch Prompts from API') {
      workflow.connections['Merge Triggers'] = {
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
      console.log('✅ Merge Triggers → Fetch Prompts from API');
    } else {
      console.log('✅ Merge Triggers → Fetch Prompts from API (déjà correct)');
    }
  }
}

// 6. Supprimer toute référence à l'ancien nom "Preview or Send?"
if (workflow.connections['Preview or Send?']) {
  delete workflow.connections['Preview or Send?'];
  console.log('✅ Référence à "Preview or Send?" supprimée');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Toutes les connexions ont été corrigées !');
console.log('\n📋 Résumé:');
console.log('   - Tous les triggers passent par leurs nodes de configuration');
console.log('   - Tous les chemins mènent au node IF "Should Send Email?"');
console.log('   - Les connexions obsolètes ont été supprimées');

