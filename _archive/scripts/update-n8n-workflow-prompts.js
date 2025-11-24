/**
 * Script pour mettre à jour le workflow n8n
 * - Remplacer les prompts hardcodés par un appel à /api/briefing-prompts
 * - Supprimer le nœud "Prompts Configuration" obsolète
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

// 1. Trouver et modifier le nœud "Determine Time-Based Prompt"
const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');
if (determinePromptNode) {
  // Nouveau code qui appelle l'API
  determinePromptNode.parameters.jsCode = `// Get all input items
const inputItems = $input.all();
const data = inputItems[0].json;

// URL de l'API pour récupérer les prompts depuis GitHub
const API_BASE_URL = 'https://gob-projetsjsls-projects.vercel.app';
let promptsConfig = {};

// Fonction pour récupérer les prompts depuis l'API
async function fetchPromptsFromAPI() {
  try {
    const response = await fetch(\`\${API_BASE_URL}/api/briefing-prompts\`);
    if (!response.ok) {
      throw new Error(\`API error: \${response.status}\`);
    }
    const result = await response.json();
    if (result.success && result.prompts) {
      return result.prompts;
    }
    throw new Error('Invalid API response format');
  } catch (error) {
    console.error('Erreur récupération prompts depuis API:', error);
    // Fallback vers prompts par défaut si l'API échoue
    return {
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
}

// Récupérer les prompts depuis l'API (avec fallback)
promptsConfig = await fetchPromptsFromAPI();

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
    selectedPrompt = promptsConfig.morning?.prompt || promptsConfig.morning?.prompt;
  } else if (hour >= 11 && hour < 16) {
    // Midday prompt (11am - 4pm)
    promptType = 'noon';
    selectedPrompt = promptsConfig.midday?.prompt || promptsConfig.midday?.prompt;
  } else {
    // Evening prompt (4pm onwards and before 5am)
    promptType = 'evening';
    selectedPrompt = promptsConfig.evening?.prompt || promptsConfig.evening?.prompt;
  }
  
  for (const item of inputItems) {
    item.json.selected_prompt = selectedPrompt;
    item.json.prompt_type = promptType;
    item.json.processing_status = "OK";
  }
}

return inputItems;`;
  
  console.log('✅ Nœud "Determine Time-Based Prompt" mis à jour pour utiliser l\'API');
}

// 2. Supprimer le nœud "Prompts Configuration" obsolète
const promptsConfigNodeIndex = workflow.nodes.findIndex(n => n.name === 'Prompts Configuration');
if (promptsConfigNodeIndex !== -1) {
  const promptsConfigNode = workflow.nodes[promptsConfigNodeIndex];
  
  // Supprimer le nœud
  workflow.nodes.splice(promptsConfigNodeIndex, 1);
  console.log('✅ Nœud "Prompts Configuration" supprimé');
  
  // Supprimer les connexions vers ce nœud
  if (workflow.connections[promptsConfigNode.name]) {
    delete workflow.connections[promptsConfigNode.name];
  }
  
  // Trouver et supprimer les connexions depuis ce nœud
  Object.keys(workflow.connections).forEach(nodeName => {
    const connections = workflow.connections[nodeName];
    if (connections && connections.main) {
      connections.main.forEach((connectionArray, index) => {
        if (connectionArray) {
          workflow.connections[nodeName].main[index] = connectionArray.filter(
            conn => conn.node !== 'Prompts Configuration'
          );
        }
      });
    }
  });
  
  // Rediriger les connexions qui allaient vers "Prompts Configuration" vers "Determine Time-Based Prompt"
  // (si nécessaire, selon la structure du workflow)
  const mergeTriggersNode = workflow.nodes.find(n => n.name === 'Merge Triggers');
  if (mergeTriggersNode && workflow.connections['Merge Triggers']) {
    // Vérifier si Merge Triggers était connecté à Prompts Configuration
    const mergeConnections = workflow.connections['Merge Triggers'];
    if (mergeConnections && mergeConnections.main) {
      mergeConnections.main.forEach((connectionArray, index) => {
        if (connectionArray) {
          const updatedConnections = connectionArray.map(conn => {
            if (conn.node === 'Prompts Configuration') {
              return {
                ...conn,
                node: 'Determine Time-Based Prompt'
              };
            }
            return conn;
          });
          workflow.connections['Merge Triggers'].main[index] = updatedConnections;
        }
      });
    }
  }
  
  console.log('✅ Connexions mises à jour');
}

// 3. Sauvegarder le workflow modifié
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
console.log(`✅ Workflow sauvegardé dans ${workflowPath}`);

