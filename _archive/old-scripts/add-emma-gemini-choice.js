/**
 * Script pour ajouter un choix entre Emma (Perplexity) et Gemini dans le workflow n8n
 * 
 * Structure:
 * 1. Ajouter un node "AI Model Config" pour choisir le modèle
 * 2. Ajouter un node IF "Choose AI Model?" après "Prepare API Request"
 * 3. Créer un node "Call Gemini API" pour appeler directement Gemini
 * 4. Les deux branches (Emma et Gemini) convergent vers "Parse API Response"
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Ajout du choix entre Emma (Perplexity) et Gemini...\n');

// Trouver les nodes existants
const prepareApiRequestNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
const callEmmaNode = workflow.nodes.find(n => n.name === 'Call /api/chat (Emma)');
const parseApiResponseNode = workflow.nodes.find(n => n.name === 'Parse API Response');

if (!prepareApiRequestNode || !callEmmaNode || !parseApiResponseNode) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

console.log('✅ Nodes existants trouvés');

// 1. Créer un node "AI Model Config" pour choisir le modèle
const aiModelConfigNode = {
  parameters: {
    assignments: {
      assignments: [
        {
          id: 'ai-model-choice',
          name: 'ai_model',
          value: 'emma', // 'emma' ou 'gemini'
          type: 'string'
        }
      ]
    },
    includeOtherFields: true,
    options: {}
  },
  id: 'ai-model-config-node',
  name: 'AI Model Config',
  type: 'n8n-nodes-base.set',
  typeVersion: 3.4,
  position: [
    prepareApiRequestNode.position[0] - 160,
    prepareApiRequestNode.position[1]
  ]
};

// Vérifier si le node existe déjà
const existingAiModelConfig = workflow.nodes.find(n => n.name === 'AI Model Config');
if (!existingAiModelConfig) {
  workflow.nodes.push(aiModelConfigNode);
  console.log('✅ Node "AI Model Config" créé');
} else {
  console.log('✅ Node "AI Model Config" existe déjà');
}

// 2. Créer un node IF "Choose AI Model?"
const chooseAiModelNode = {
  parameters: {
    conditions: {
      boolean: [
        {
          value1: "={{ $json.ai_model === 'emma' || $json.ai_model === undefined }}",
          value2: true
        }
      ]
    },
    options: {}
  },
  id: 'choose-ai-model-if',
  name: 'Choose AI Model?',
  type: 'n8n-nodes-base.if',
  typeVersion: 2,
  position: [
    prepareApiRequestNode.position[0] + 160,
    prepareApiRequestNode.position[1]
  ]
};

// Vérifier si le node existe déjà
const existingChooseAiModel = workflow.nodes.find(n => n.name === 'Choose AI Model?');
if (!existingChooseAiModel) {
  workflow.nodes.push(chooseAiModelNode);
  console.log('✅ Node "Choose AI Model?" créé');
} else {
  console.log('✅ Node "Choose AI Model?" existe déjà');
}

// 3. Créer un node "Call Gemini API" pour appeler directement Gemini
const callGeminiNode = {
  parameters: {
    method: 'POST',
    url: '=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: 'Content-Type',
          value: 'application/json'
        }
      ]
    },
    sendQuery: true,
    queryParameters: {
      parameters: [
        {
          name: 'key',
          value: '={{ $env.GEMINI_API_KEY }}'
        }
      ]
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: `={{ {
  "contents": [{
    "parts": [{
      "text": $json.message || $json.selected_prompt || "Génère un briefing financier matinal."
    }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 2048
  }
} }}`,
    options: {
      response: {
        response: {
          responseFormat: 'json'
        }
      }
    }
  },
  id: 'call-gemini-api-node',
  name: 'Call Gemini API',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: [
    callEmmaNode.position[0],
    callEmmaNode.position[1] + 200
  ]
};

// Vérifier si le node existe déjà
const existingCallGemini = workflow.nodes.find(n => n.name === 'Call Gemini API');
if (!existingCallGemini) {
  workflow.nodes.push(callGeminiNode);
  console.log('✅ Node "Call Gemini API" créé');
} else {
  console.log('✅ Node "Call Gemini API" existe déjà');
}

// 4. Créer un node "Parse Gemini Response" pour adapter la réponse Gemini au format attendu
const parseGeminiResponseNode = {
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
  position: [
    parseApiResponseNode.position[0],
    parseApiResponseNode.position[1] + 200
  ]
};

// Vérifier si le node existe déjà
const existingParseGemini = workflow.nodes.find(n => n.name === 'Parse Gemini Response');
if (!existingParseGemini) {
  workflow.nodes.push(parseGeminiResponseNode);
  console.log('✅ Node "Parse Gemini Response" créé');
} else {
  console.log('✅ Node "Parse Gemini Response" existe déjà');
}

// 5. Mettre à jour les connexions
// AI Model Config → Prepare API Request
if (!workflow.connections['AI Model Config']) {
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
  console.log('✅ Connexion: AI Model Config → Prepare API Request');
}

// Prepare API Request → Choose AI Model?
if (workflow.connections['Prepare API Request']) {
  // Remplacer la connexion directe vers Call /api/chat (Emma)
  workflow.connections['Prepare API Request'] = {
    main: [
      [
        {
          node: 'Choose AI Model?',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Connexion: Prepare API Request → Choose AI Model?');
} else {
  workflow.connections['Prepare API Request'] = {
    main: [
      [
        {
          node: 'Choose AI Model?',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Connexion: Prepare API Request → Choose AI Model? (créée)');
}

// Choose AI Model? → Call /api/chat (Emma) (TRUE = Emma)
if (!workflow.connections['Choose AI Model?']) {
  workflow.connections['Choose AI Model?'] = {
    main: [
      // TRUE (index 0) → Emma
      [
        {
          node: 'Call /api/chat (Emma)',
          type: 'main',
          index: 0
        }
      ],
      // FALSE (index 1) → Gemini
      [
        {
          node: 'Call Gemini API',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Connexion: Choose AI Model? → Emma (TRUE) et Gemini (FALSE)');
} else {
  // Mettre à jour les connexions existantes
  workflow.connections['Choose AI Model?'].main = [
    // TRUE → Emma
    [
      {
        node: 'Call /api/chat (Emma)',
        type: 'main',
        index: 0
      }
    ],
    // FALSE → Gemini
    [
      {
        node: 'Call Gemini API',
        type: 'main',
        index: 0
      }
    ]
  ];
  console.log('✅ Connexions mises à jour: Choose AI Model? → Emma/Gemini');
}

// Call Gemini API → Parse Gemini Response
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

// Parse Gemini Response → Parse API Response (convergence)
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

// Call /api/chat (Emma) → Parse API Response (connexion existante, vérifier)
if (workflow.connections['Call /api/chat (Emma)']) {
  const emmaConnections = workflow.connections['Call /api/chat (Emma)'].main[0];
  if (!emmaConnections || !emmaConnections.find(c => c.node === 'Parse API Response')) {
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
    console.log('✅ Connexion: Call /api/chat (Emma) → Parse API Response (vérifiée)');
  }
} else {
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
  console.log('✅ Connexion: Call /api/chat (Emma) → Parse API Response (créée)');
}

// 6. Mettre à jour "Prepare API Request" pour préserver ai_model
const prepareApiRequestCode = prepareApiRequestNode.parameters.jsCode || '';
if (!prepareApiRequestCode.includes('ai_model')) {
  const updatedCode = `const items = $input.all();
const data = items[0].json;

// Extract ticker symbols from input 1 (tickers data)
const tickers = items.filter(item => item.json.ticker).map(item => item.json.ticker);
const tickerList = tickers.join(', ');

// Normaliser le type de briefing
let briefingType = data.prompt_type;
if (briefingType === 'noon') {
  briefingType = 'midday';
}

// Construire le message pour /api/chat (qui utilise emma-agent) ou Gemini
const fullPrompt = \`\${data.selected_prompt}\\n\\nFocus sur ces tickers: \${tickerList}\`;

return [{
  json: {
    ...data,
    tickers: tickerList,
    briefing_type: briefingType,
    message: fullPrompt,
    channel: 'web',
    userId: 'n8n-automation',
    // Préserver ai_model depuis AI Model Config
    ai_model: data.ai_model || 'emma'
  }
}];`;
  
  prepareApiRequestNode.parameters.jsCode = updatedCode;
  console.log('✅ "Prepare API Request" mis à jour pour préserver ai_model');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow mis à jour avec succès !');
console.log('\n📋 Structure du nouveau flux:');
console.log('   1. AI Model Config (choix: emma ou gemini)');
console.log('   2. Prepare API Request');
console.log('   3. Choose AI Model? (IF)');
console.log('      - TRUE → Call /api/chat (Emma) → Parse API Response');
console.log('      - FALSE → Call Gemini API → Parse Gemini Response → Parse API Response');
console.log('   4. Parse API Response (convergence)');
console.log('   5. ... (reste du workflow)');
console.log('\n💡 Pour changer de modèle:');
console.log('   Modifiez "ai_model" dans le node "AI Model Config"');
console.log('   - "emma" → Utilise Emma (Perplexity) via /api/chat');
console.log('   - "gemini" → Utilise Gemini directement');

