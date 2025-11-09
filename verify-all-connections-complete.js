/**
 * Script pour vérifier que TOUTES les connexions sont correctes
 * et créer les nodes manquants si nécessaire
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔍 Vérification complète de toutes les connexions...\n');

// Vérifier que Parse Gemini Response existe
let parseGeminiNode = workflow.nodes.find(n => n.name === 'Parse Gemini Response');

if (!parseGeminiNode) {
  console.log('⚠️  Node "Parse Gemini Response" non trouvé, création...');
  
  const parseApiResponseNode = workflow.nodes.find(n => n.name === 'Parse API Response');
  
  parseGeminiNode = {
    parameters: {
      jsCode: `const items = $input.all();
const data = items[0].json;

// La réponse de Gemini a une structure différente
// Structure Gemini: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
let content = '';
if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
  content = data.candidates[0].content.parts.map(part => part.text).join('\\n');
} else if (data.response) {
  content = data.response;
} else if (typeof data === 'string') {
  content = data;
}

// Adapter au format attendu par Parse API Response
return items.map(item => ({
  json: {
    ...item.json,
    newsletter_content: content,
    response: content,
    message: content,
    emma_model: 'gemini',
    emma_tools: [],
    emma_execution_time: 0,
    trigger_type: item.json.trigger_type || 'Manuel',
    prompt_type: item.json.prompt_type || 'custom',
    generated_at: new Date().toISOString(),
    // Préserver preview_mode et approved
    preview_mode: item.json.preview_mode,
    approved: item.json.approved
  }
}));`
    },
    id: 'parse-gemini-response',
    name: 'Parse Gemini Response',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: parseApiResponseNode ? [
      parseApiResponseNode.position[0],
      parseApiResponseNode.position[1] + 200
    ] : [20000, 4736]
  };
  
  workflow.nodes.push(parseGeminiNode);
  console.log('✅ Node "Parse Gemini Response" créé');
} else {
  console.log('✅ Node "Parse Gemini Response" existe');
}

// Vérifier toutes les connexions critiques
const criticalConnections = [
  {
    from: 'Determine Time-Based Prompt',
    to: '⚙️ AI Model Selector (Change AI_MODEL)',
    required: true
  },
  {
    from: '⚙️ AI Model Selector (Change AI_MODEL)',
    to: '🤖 Choose AI Model',
    required: true
  },
  {
    from: '🤖 Choose AI Model',
    to: 'Prepare API Request',
    route: 0,
    required: true
  },
  {
    from: '🤖 Choose AI Model',
    to: 'Call Gemini API',
    route: 1,
    required: true
  },
  {
    from: 'Prepare API Request',
    to: 'Call /api/chat (Emma)',
    required: true
  },
  {
    from: 'Call /api/chat (Emma)',
    to: 'Parse API Response',
    required: true
  },
  {
    from: 'Call Gemini API',
    to: 'Parse Gemini Response',
    required: true
  },
  {
    from: 'Parse Gemini Response',
    to: 'Parse API Response',
    required: true
  }
];

let allOk = true;

criticalConnections.forEach(({ from, to, route, required }) => {
  if (!workflow.connections[from]) {
    if (required) {
      console.log(`❌ Connexion manquante: ${from} → ${to}`);
      allOk = false;
    }
    return;
  }
  
  const connections = workflow.connections[from].main;
  if (route !== undefined) {
    // C'est une route du Switch
    if (!connections || !connections[route] || !connections[route].find(c => c.node === to)) {
      console.log(`❌ Route ${route} manquante: ${from} → ${to}`);
      allOk = false;
    } else {
      console.log(`✅ Route ${route}: ${from} → ${to}`);
    }
  } else {
    // Connexion normale
    if (!connections || !connections[0] || !connections[0].find(c => c.node === to)) {
      console.log(`❌ Connexion manquante: ${from} → ${to}`);
      allOk = false;
    } else {
      console.log(`✅ Connexion: ${from} → ${to}`);
    }
  }
});

// Corriger les connexions manquantes
if (!allOk) {
  console.log('\n🔧 Correction des connexions manquantes...');
  
  // Call Gemini API → Parse Gemini Response
  if (!workflow.connections['Call Gemini API'] || 
      !workflow.connections['Call Gemini API'].main[0]?.find(c => c.node === 'Parse Gemini Response')) {
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
    console.log('✅ Connexion: Call Gemini API → Parse Gemini Response (créée)');
  }
  
  // Parse Gemini Response → Parse API Response
  if (!workflow.connections['Parse Gemini Response'] || 
      !workflow.connections['Parse Gemini Response'].main[0]?.find(c => c.node === 'Parse API Response')) {
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
    console.log('✅ Connexion: Parse Gemini Response → Parse API Response (créée)');
  }
  
  // Vérifier le Switch a bien 2 routes
  if (workflow.connections['🤖 Choose AI Model']) {
    const switchConnections = workflow.connections['🤖 Choose AI Model'].main;
    if (!switchConnections || switchConnections.length < 2) {
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
      console.log('✅ Switch "🤖 Choose AI Model" a maintenant 2 routes');
    }
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Vérification terminée !');
console.log('\n📋 Résumé du flux:');
console.log('   Determine Time-Based Prompt');
console.log('   → ⚙️ AI Model Selector (Change AI_MODEL)');
console.log('   → 🤖 Choose AI Model (Switch)');
console.log('      Route 0: → Prepare API Request → Call /api/chat (Emma) → Parse API Response');
console.log('      Route 1: → Call Gemini API → Parse Gemini Response → Parse API Response');

