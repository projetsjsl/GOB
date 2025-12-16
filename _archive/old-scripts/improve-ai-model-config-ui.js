/**
 * Script pour améliorer l'interface du node "AI Model Config"
 * 
 * Ajouter un menu déroulant (dropdown) pour choisir facilement entre Emma et Gemini
 * Utiliser un node "Set" avec un paramètre "options" pour un meilleur UX
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Amélioration de l\'interface du node "AI Model Config"...\n');

// Trouver le node "AI Model Config"
const aiModelConfigNode = workflow.nodes.find(n => n.name === 'AI Model Config');

if (!aiModelConfigNode) {
  console.error('❌ Node "AI Model Config" non trouvé');
  process.exit(1);
}

// Améliorer le node avec un meilleur nom et description
// Utiliser un node "Set" avec un paramètre "options" pour un dropdown
aiModelConfigNode.parameters = {
  assignments: {
    assignments: [
      {
        id: 'ai-model-choice',
        name: 'ai_model',
        value: 'emma', // Valeur par défaut
        type: 'string'
      }
    ]
  },
  includeOtherFields: true,
  options: {
    // Ajouter des options pour faciliter la sélection
    // Note: n8n n'a pas de dropdown natif dans Set, mais on peut améliorer avec des descriptions
  }
};

// Ajouter une note dans le nom ou créer un node plus descriptif
// En fait, on peut utiliser un node "Code" avec un menu, ou mieux: utiliser un node "Switch" avec des routes nommées

// Alternative: Créer un node "Switch" avec des routes nommées pour un choix visuel
// Mais cela complique le flux...

// Meilleure solution: Améliorer le node Set avec des valeurs claires et ajouter un node "Set" avec description
// Ou utiliser un node "IF" avec des routes nommées

// Solution finale: Créer un node "Switch" simple avec deux routes nommées
// Route 1: "Emma (Perplexity)" 
// Route 2: "Gemini Direct"

// Mais cela change la structure... 

// Solution la plus simple: Améliorer le node Set avec une valeur par défaut claire
// et ajouter un commentaire dans le workflow

// En fait, la meilleure solution pour n8n est d'utiliser un node "Set" avec un paramètre "options"
// mais n8n ne supporte pas les dropdowns dans Set...

// Solution pratique: Utiliser un node "Switch" avec des conditions nommées
// Cela donne un choix visuel dans l'interface n8n

console.log('✅ Node "AI Model Config" trouvé');

// Créer un node Switch avec des routes nommées pour un choix visuel
const aiModelSwitchNode = {
  parameters: {
    mode: 'rules',
    rules: {
      values: [
        {
          conditions: {
            string: [
              {
                value1: "={{ $json.ai_model || 'emma' }}",
                operation: 'equals',
                value2: 'emma'
              }
            ]
          },
          renameOutput: true,
          outputKey: 'emma'
        },
        {
          conditions: {
            string: [
              {
                value1: "={{ $json.ai_model || 'emma' }}",
                operation: 'equals',
                value2: 'gemini'
              }
            ]
          },
          renameOutput: true,
          outputKey: 'gemini'
        }
      ]
    },
    options: {}
  },
  id: 'ai-model-switch-node',
  name: 'Choose AI Model (Visual)',
  type: 'n8n-nodes-base.switch',
  typeVersion: 3,
  position: [
    aiModelConfigNode.position[0] + 160,
    aiModelConfigNode.position[1]
  ]
};

// Vérifier si le node existe déjà
const existingSwitch = workflow.nodes.find(n => n.name === 'Choose AI Model (Visual)');
if (!existingSwitch) {
  workflow.nodes.push(aiModelSwitchNode);
  console.log('✅ Node "Choose AI Model (Visual)" créé avec routes nommées');
} else {
  console.log('✅ Node "Choose AI Model (Visual)" existe déjà');
}

// Mettre à jour les connexions
// AI Model Config → Choose AI Model (Visual)
if (!workflow.connections['AI Model Config']) {
  workflow.connections['AI Model Config'] = {
    main: [
      [
        {
          node: 'Choose AI Model (Visual)',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
} else {
  // Remplacer la connexion vers Prepare API Request par Choose AI Model (Visual)
  workflow.connections['AI Model Config'] = {
    main: [
      [
        {
          node: 'Choose AI Model (Visual)',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
}

// Choose AI Model (Visual) → routes vers Prepare API Request (pour les deux branches)
// Mais en fait, on veut que les deux branches aillent vers des nodes différents
// Route "emma" → Prepare API Request → Choose AI Model? (IF) → Call /api/chat (Emma)
// Route "gemini" → Call Gemini API

// En fait, on peut simplifier: utiliser directement le Switch pour router
// Route "emma" → Prepare API Request → Call /api/chat (Emma)
// Route "gemini" → Call Gemini API

const prepareApiRequestNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
const callGeminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');

if (prepareApiRequestNode && callGeminiNode) {
  workflow.connections['Choose AI Model (Visual)'] = {
    main: [
      // Route "emma" (index 0)
      [
        {
          node: 'Prepare API Request',
          type: 'main',
          index: 0
        }
      ],
      // Route "gemini" (index 1)
      [
        {
          node: 'Call Gemini API',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Connexions: Choose AI Model (Visual) → Emma/Gemini');
}

// Maintenant, on doit modifier Prepare API Request pour qu'il aille directement vers Call /api/chat (Emma)
// au lieu de passer par Choose AI Model? (IF)
const callEmmaNode = workflow.nodes.find(n => n.name === 'Call /api/chat (Emma)');

if (prepareApiRequestNode && callEmmaNode) {
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
}

// On peut maintenant supprimer ou garder le node "Choose AI Model?" (IF) pour compatibilité
// Mais comme on utilise maintenant le Switch, on peut le garder pour l'instant

// Améliorer le node "AI Model Config" avec une description plus claire
// Ajouter un commentaire dans le code pour expliquer les valeurs possibles
const updatedAiModelConfigCode = `// ============================================
// CONFIGURATION DU MODÈLE IA
// ============================================
// Choisissez le modèle à utiliser:
// - "emma" : Utilise Emma (Perplexity) via /api/chat
// - "gemini" : Utilise Gemini directement
// ============================================

const items = $input.all();
return items.map(item => ({
  json: {
    ...item.json,
    ai_model: item.json.ai_model || 'emma' // Par défaut: Emma
  }
}));`;

// En fait, le node Set n'utilise pas de jsCode, donc on garde la structure Set
// Mais on peut améliorer en ajoutant une description dans le nom ou en créant un node Code

// Solution finale: Garder le node Set mais améliorer les valeurs avec des descriptions
// Ajouter un node Code juste après pour valider et documenter

console.log('✅ Structure améliorée avec Switch visuel');

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Interface améliorée !');
console.log('\n📋 Nouvelle structure:');
console.log('   AI Model Config (Set: ai_model = "emma" ou "gemini")');
console.log('   → Choose AI Model (Visual) (Switch avec routes nommées)');
console.log('      - Route "emma" → Prepare API Request → Call /api/chat (Emma)');
console.log('      - Route "gemini" → Call Gemini API');
console.log('\n💡 Dans n8n:');
console.log('   1. Ouvrez "AI Model Config"');
console.log('   2. Modifiez "ai_model" à "emma" ou "gemini"');
console.log('   3. Le Switch "Choose AI Model (Visual)" route automatiquement');
console.log('   4. Vous verrez clairement quelle route est prise dans l\'interface');

