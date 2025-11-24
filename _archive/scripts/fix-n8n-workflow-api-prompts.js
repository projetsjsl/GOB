/**
 * Script pour corriger le workflow n8n
 * - Ajouter un nœud HTTP Request pour récupérer les prompts depuis /api/briefing-prompts
 * - Modifier "Determine Time-Based Prompt" pour utiliser les données récupérées
 * - Supprimer le nœud "Prompts Configuration" obsolète
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

// 1. Trouver les nœuds importants
const mergeTriggersNode = workflow.nodes.find(n => n.name === 'Merge Triggers');
const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');
const promptsConfigNode = workflow.nodes.find(n => n.name === 'Prompts Configuration');

if (!mergeTriggersNode || !determinePromptNode) {
  console.error('❌ Nœuds requis non trouvés');
  process.exit(1);
}

// 2. Créer un nouveau nœud HTTP Request pour récupérer les prompts
const fetchPromptsNode = {
  "parameters": {
    "method": "GET",
    "url": "=https://gob-projetsjsls-projects.vercel.app/api/briefing-prompts",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "options": {
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  },
  "id": "fetch-prompts-from-api",
  "name": "Fetch Prompts from API",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [
    mergeTriggersNode.position[0] + 320,
    mergeTriggersNode.position[1]
  ]
};

// 3. Modifier le nœud "Determine Time-Based Prompt" pour utiliser les données de l'API
determinePromptNode.parameters.jsCode = `// Get all input items
const inputItems = $input.all();
const data = inputItems[0].json;

// Récupérer les prompts depuis l'API (passés depuis le nœud précédent)
// La réponse de l'API est dans $json.prompts ou $json
let promptsConfig = {};

// Chercher les prompts dans les données d'entrée
// L'API retourne { success: true, prompts: { morning: {...}, midday: {...}, evening: {...} } }
if (data.prompts) {
  promptsConfig = data.prompts;
} else if (data.success && data.prompts) {
  promptsConfig = data.prompts;
} else {
  // Fallback si les prompts ne sont pas trouvés
  console.warn('⚠️ Prompts non trouvés dans les données, utilisation du fallback');
  promptsConfig = {
    morning: {
      prompt: "Tu es Emma, l'assistante financière intelligente. Génère un briefing matinal concis et informatif pour les investisseurs. Structure ton email comme suit :\\n\\n1. **Ouverture** (2-3 phrases) : Salutation énergique et contexte du marché\\n2. **Marché en bref** : Indices principaux, tendances overnight\\n3. **Actualités clés** (3-4 points) : Nouvelles importantes qui impactent les marchés\\n4. **Focus tickers d'équipe** : Mise en avant de 2-3 actions de notre liste avec prix et variations\\n5. **Événements du jour** : Calendrier économique et résultats d'entreprises importants\\n6. **Conseil Emma** : Insight ou recommandation basée sur l'analyse\\n7. **Fermeture** : Ton optimiste et rappel de la disponibilité\\n\\nUtilise les outils disponibles pour récupérer des données réelles et à jour. Sois précis, professionnel mais accessible. Longueur : 200-300 mots.",
      name: "Emma En Direct - Matin"
    },
    midday: {
      prompt: "Tu es Emma, l'assistante financière intelligente. Génère un briefing de mi-journée qui fait le point sur la session du matin. Structure ton email comme suit :\\n\\n1. **Ouverture** (2 phrases) : Salutation et résumé de la matinée\\n2. **Performance matinale** : Indices, secteurs en hausse/baisse, volumes\\n3. **Mouvements notables** : Actions qui bougent significativement avec explications\\n4. **Actualités midi** : Développements récents et réactions du marché\\n5. **Focus technique** : Analyse rapide des tendances et niveaux clés\\n6. **Perspective après-midi** : Ce à quoi s'attendre pour la suite\\n7. **Fermeture** : Message encourageant et rappel du briefing du soir\\n\\nUtilise les données techniques et fondamentales disponibles. Sois analytique mais accessible. Longueur : 250-350 mots.",
      name: "Emma En Direct - Midi"
    },
    evening: {
      prompt: "Tu es Emma, l'assistante financière intelligente. Génère un briefing de clôture qui synthétise la journée de trading. Structure ton email comme suit :\\n\\n1. **Ouverture** (2 phrases) : Salutation et résumé de la journée\\n2. **Clôture des marchés** : Indices finaux, variations, volumes de trading\\n3. **Secteurs performants** : Top 3 secteurs en hausse/baisse avec explications\\n4. **Tickers d'équipe - Bilan** : Performance de nos actions avec analyse\\n5. **Événements marquants** : Nouvelles qui ont impacté les marchés\\n6. **Perspective demain** : Événements à surveiller et attentes\\n7. **Conseil Emma** : Recommandation ou insight pour la suite\\n8. **Fermeture** : Message de fin de journée et rendez-vous demain\\n\\nUtilise toutes les données disponibles pour une analyse complète. Sois synthétique mais complet. Longueur : 300-400 mots.",
      name: "Emma En Direct - Soir"
    }
  };
}

// Check if custom prompt exists
if (data.custom_prompt) {
  // Use custom prompt
  for (const item of inputItems) {
    item.json.selected_prompt = data.custom_prompt;
    item.json.prompt_type = 'custom';
    item.json.processing_status = "OK";
  }
} else {
  // Determine time-based prompt (utilise les prompts depuis l'API)
  const now = new Date();
  const hour = now.getHours();
  
  let promptType;
  let selectedPrompt;
  
  if (hour >= 5 && hour < 11) {
    // Morning prompt (5am - 11am)
    promptType = 'morning';
    selectedPrompt = promptsConfig.morning?.prompt || '';
  } else if (hour >= 11 && hour < 16) {
    // Midday prompt (11am - 4pm)
    promptType = 'noon';
    selectedPrompt = promptsConfig.midday?.prompt || '';
  } else {
    // Evening prompt (4pm onwards and before 5am)
    promptType = 'evening';
    selectedPrompt = promptsConfig.evening?.prompt || '';
  }
  
  if (!selectedPrompt) {
    throw new Error(\`Prompt non trouvé pour le type: \${promptType}\`);
  }
  
  for (const item of inputItems) {
    item.json.selected_prompt = selectedPrompt;
    item.json.prompt_type = promptType;
    item.json.processing_status = "OK";
  }
}

return inputItems;`;

// 4. Ajouter le nœud HTTP Request au workflow
workflow.nodes.push(fetchPromptsNode);

// 5. Mettre à jour les connexions
// Merge Triggers -> Fetch Prompts from API -> Determine Time-Based Prompt
if (!workflow.connections['Merge Triggers']) {
  workflow.connections['Merge Triggers'] = { main: [[]] };
}
workflow.connections['Merge Triggers'].main[0] = [
  {
    "node": "Fetch Prompts from API",
    "type": "main",
    "index": 0
  }
];

workflow.connections['Fetch Prompts from API'] = {
  main: [
    [
      {
        "node": "Determine Time-Based Prompt",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// 6. Supprimer le nœud "Prompts Configuration" s'il existe
if (promptsConfigNode) {
  const promptsConfigIndex = workflow.nodes.findIndex(n => n.id === promptsConfigNode.id);
  if (promptsConfigIndex !== -1) {
    workflow.nodes.splice(promptsConfigIndex, 1);
    console.log('✅ Nœud "Prompts Configuration" supprimé');
    
    // Supprimer les connexions vers ce nœud
    if (workflow.connections[promptsConfigNode.name]) {
      delete workflow.connections[promptsConfigNode.name];
    }
  }
}

// 7. Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
console.log('✅ Workflow mis à jour avec succès');
console.log('✅ Nœud "Fetch Prompts from API" ajouté');
console.log('✅ Nœud "Determine Time-Based Prompt" modifié pour utiliser les prompts de l\'API');

