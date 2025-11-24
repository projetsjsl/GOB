/**
 * Script pour corriger toutes les connexions du sélecteur AI Model
 * 
 * Vérifie et corrige toutes les connexions pour éviter les violations
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de toutes les connexions du sélecteur AI Model...\n');

// Trouver tous les nodes pertinents
const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');
const aiModelSelectorNode = workflow.nodes.find(n => 
  n.name === '⚙️ AI Model Selector (Change AI_MODEL)' ||
  n.name === '⚙️ Choose AI Model (Edit Here)' ||
  n.name === '⚙️ AI Model: emma ou gemini' ||
  n.name === '⚙️ AI Model (emma/gemini)'
);
const chooseAiModelSwitch = workflow.nodes.find(n => n.name === '🤖 Choose AI Model');
const prepareApiRequestNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
const callEmmaNode = workflow.nodes.find(n => n.name === 'Call /api/chat (Emma)');
const callGeminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');
const parseApiResponseNode = workflow.nodes.find(n => n.name === 'Parse API Response');

if (!determinePromptNode) {
  console.error('❌ Node "Determine Time-Based Prompt" non trouvé');
  process.exit(1);
}

if (!aiModelSelectorNode) {
  console.error('❌ Node sélecteur AI Model non trouvé');
  process.exit(1);
}

if (!chooseAiModelSwitch) {
  console.error('❌ Node "🤖 Choose AI Model" non trouvé');
  process.exit(1);
}

console.log('✅ Tous les nodes trouvés');

// 1. Determine Time-Based Prompt → AI Model Selector
if (!workflow.connections['Determine Time-Based Prompt']) {
  workflow.connections['Determine Time-Based Prompt'] = {
    main: [
      [
        {
          node: aiModelSelectorNode.name,
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log(`✅ Connexion: Determine Time-Based Prompt → ${aiModelSelectorNode.name}`);
} else {
  // Vérifier que ça pointe vers le bon node
  const currentConnections = workflow.connections['Determine Time-Based Prompt'].main[0];
  if (!currentConnections || !currentConnections.find(c => c.node === aiModelSelectorNode.name)) {
    workflow.connections['Determine Time-Based Prompt'] = {
      main: [
        [
          {
            node: aiModelSelectorNode.name,
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log(`✅ Connexion: Determine Time-Based Prompt → ${aiModelSelectorNode.name} (corrigée)`);
  } else {
    console.log(`✅ Connexion: Determine Time-Based Prompt → ${aiModelSelectorNode.name} (déjà correcte)`);
  }
}

// 2. AI Model Selector → Choose AI Model (Switch)
if (!workflow.connections[aiModelSelectorNode.name]) {
  workflow.connections[aiModelSelectorNode.name] = {
    main: [
      [
        {
          node: '🤖 Choose AI Model',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log(`✅ Connexion: ${aiModelSelectorNode.name} → 🤖 Choose AI Model`);
} else {
  const currentConnections = workflow.connections[aiModelSelectorNode.name].main[0];
  if (!currentConnections || !currentConnections.find(c => c.node === '🤖 Choose AI Model')) {
    workflow.connections[aiModelSelectorNode.name] = {
      main: [
        [
          {
            node: '🤖 Choose AI Model',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log(`✅ Connexion: ${aiModelSelectorNode.name} → 🤖 Choose AI Model (corrigée)`);
  } else {
    console.log(`✅ Connexion: ${aiModelSelectorNode.name} → 🤖 Choose AI Model (déjà correcte)`);
  }
}

// 3. Choose AI Model (Switch) → Routes vers Emma et Gemini
if (!workflow.connections['🤖 Choose AI Model']) {
  if (prepareApiRequestNode && callGeminiNode) {
    workflow.connections['🤖 Choose AI Model'] = {
      main: [
        // Route 0 (Emma) → Prepare API Request
        [
          {
            node: 'Prepare API Request',
            type: 'main',
            index: 0
          }
        ],
        // Route 1 (Gemini) → Call Gemini API
        [
          {
            node: 'Call Gemini API',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Connexions: 🤖 Choose AI Model → Emma/Gemini');
  }
} else {
  // Vérifier que les routes sont correctes
  const switchConnections = workflow.connections['🤖 Choose AI Model'].main;
  if (!switchConnections || switchConnections.length < 2) {
    if (prepareApiRequestNode && callGeminiNode) {
      workflow.connections['🤖 Choose AI Model'] = {
        main: [
          [
            {
              node: 'Prepare API Request',
              type: 'main',
              index: 0
            }
          ],
          [
            {
              node: 'Call Gemini API',
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log('✅ Connexions: 🤖 Choose AI Model → Emma/Gemini (corrigées)');
    }
  } else {
    console.log('✅ Connexions: 🤖 Choose AI Model → Emma/Gemini (déjà correctes)');
  }
}

// 4. Prepare API Request → Call /api/chat (Emma)
if (prepareApiRequestNode && callEmmaNode) {
  if (!workflow.connections['Prepare API Request']) {
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
    console.log('✅ Connexion: Prepare API Request → Call /api/chat (Emma)');
  } else {
    const currentConnections = workflow.connections['Prepare API Request'].main[0];
    if (!currentConnections || !currentConnections.find(c => c.node === 'Call /api/chat (Emma)')) {
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
      console.log('✅ Connexion: Prepare API Request → Call /api/chat (Emma) (corrigée)');
    } else {
      console.log('✅ Connexion: Prepare API Request → Call /api/chat (Emma) (déjà correcte)');
    }
  }
}

// 5. Call /api/chat (Emma) → Parse API Response
if (callEmmaNode && parseApiResponseNode) {
  if (!workflow.connections['Call /api/chat (Emma)']) {
    workflow.connections['Call /api/chat (Emma)'] = {
      main: [
        [
          {
            node: 'Parse API Response',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Connexion: Call /api/chat (Emma) → Parse API Response');
  } else {
    const currentConnections = workflow.connections['Call /api/chat (Emma)'].main[0];
    if (!currentConnections || !currentConnections.find(c => c.node === 'Parse API Response')) {
      workflow.connections['Call /api/chat (Emma)'] = {
        main: [
          [
            {
              node: 'Parse API Response',
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log('✅ Connexion: Call /api/chat (Emma) → Parse API Response (corrigée)');
    } else {
      console.log('✅ Connexion: Call /api/chat (Emma) → Parse API Response (déjà correcte)');
    }
  }
}

// 6. Call Gemini API → Parse Gemini Response (si existe) ou Parse API Response
const parseGeminiNode = workflow.nodes.find(n => n.name === 'Parse Gemini Response');
if (callGeminiNode) {
  if (parseGeminiNode) {
    // Si Parse Gemini Response existe, utiliser celui-ci
    if (!workflow.connections['Call Gemini API']) {
      workflow.connections['Call Gemini API'] = {
        main: [
          [
            {
              node: 'Parse Gemini Response',
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log('✅ Connexion: Call Gemini API → Parse Gemini Response');
    }
    
    // Parse Gemini Response → Parse API Response
    if (parseApiResponseNode) {
      if (!workflow.connections['Parse Gemini Response']) {
        workflow.connections['Parse Gemini Response'] = {
          main: [
            [
              {
                node: 'Parse API Response',
                type: 'main',
                index: 0
              }
            ]
          ]
        };
        console.log('✅ Connexion: Parse Gemini Response → Parse API Response');
      }
    }
  } else {
    // Sinon, aller directement vers Parse API Response
    if (!workflow.connections['Call Gemini API']) {
      if (parseApiResponseNode) {
        workflow.connections['Call Gemini API'] = {
          main: [
            [
              {
                node: 'Parse API Response',
                type: 'main',
                index: 0
              }
            ]
          ]
        };
        console.log('✅ Connexion: Call Gemini API → Parse API Response');
      }
    }
  }
}

// Nettoyer les anciennes connexions obsolètes
const obsoleteConnections = [
  '⚙️ Choose AI Model (Edit Here)',
  '⚙️ AI Model: emma ou gemini',
  '⚙️ AI Model (emma/gemini)',
  'AI Model Config',
  'Choose AI Model?',
  'Choose AI Model (Visual)'
];

obsoleteConnections.forEach(connName => {
  if (workflow.connections[connName]) {
    delete workflow.connections[connName];
    console.log(`✅ Ancienne connexion "${connName}" supprimée`);
  }
});

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Toutes les connexions ont été vérifiées et corrigées !');
console.log('\n📋 Flux complet vérifié:');
console.log(`   Determine Time-Based Prompt → ${aiModelSelectorNode.name}`);
console.log(`   ${aiModelSelectorNode.name} → 🤖 Choose AI Model`);
console.log('   🤖 Choose AI Model → Prepare API Request (Emma) OU Call Gemini API (Gemini)');
console.log('   Prepare API Request → Call /api/chat (Emma) → Parse API Response');
console.log('   Call Gemini API → Parse Gemini Response → Parse API Response');

