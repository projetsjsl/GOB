/**
 * Configuration automatique complète : Récupère la clé API Gemini depuis Vercel
 * et configure le workflow n8n pour l'utiliser automatiquement
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Configuration automatique de la clé API Gemini...\n');

// URL de base Vercel (à adapter si nécessaire)
const VERCEL_BASE_URL = 'https://gob-projetsjsls-projects.vercel.app';

// Trouver le nœud "Get Gemini API Key"
const geminiKeyNode = workflow.nodes.find(n => n.name === 'Get Gemini API Key');

if (!geminiKeyNode) {
  console.error('❌ Nœud "Get Gemini API Key" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Get Gemini API Key" trouvé');

// Modifier le nœud pour qu'il appelle l'endpoint Vercel
// On va remplacer le nœud Code par un nœud HTTP Request + Code
// Mais pour simplifier, on va modifier le code pour qu'il fasse un appel HTTP

const newCode = `// ═══════════════════════════════════════════════════════════
// 🔑 RÉCUPÉRATION AUTOMATIQUE DE LA CLÉ API GEMINI
// ═══════════════════════════════════════════════════════════
//
// Ce nœud récupère automatiquement la clé API Gemini depuis
// l'endpoint Vercel /api/gemini-key
//
// ✅ Aucune configuration manuelle requise !
// ═══════════════════════════════════════════════════════════

const items = $input.all();
const data = items[0].json;

// URL de l'endpoint Vercel qui retourne la clé API
const VERCEL_BASE_URL = '${VERCEL_BASE_URL}';
const apiUrl = \`\${VERCEL_BASE_URL}/api/gemini-key?full=true\`;

let geminiApiKey = '';

try {
  // Appeler l'endpoint Vercel pour récupérer la clé API
  const response = await $http.get(apiUrl);
  
  if (response && response.apiKey) {
    geminiApiKey = response.apiKey;
    console.log('✅ Clé API Gemini récupérée depuis Vercel');
  } else {
    throw new Error('Réponse invalide de l\\'endpoint Vercel');
  }
} catch (error) {
  console.error('❌ Erreur lors de la récupération de la clé API:', error.message);
  
  // Fallback : essayer depuis les credentials n8n ou variable de workflow
  try {
    geminiApiKey = $workflow.getStaticData('global').geminiApiKey || '';
    
    if (!geminiApiKey) {
      throw new Error('Clé API non trouvée dans les credentials n8n');
    }
    
    console.log('⚠️  Utilisation de la clé depuis les credentials n8n (fallback)');
  } catch (fallbackError) {
    throw new Error(\`❌ Impossible de récupérer la clé API Gemini. Vérifiez que:\n1. L'endpoint \${apiUrl} est accessible\n2. La variable GEMINI_API_KEY est configurée dans Vercel\n3. Ou configurez les credentials n8n\`);
  }
}

if (!geminiApiKey) {
  throw new Error('Clé API Gemini vide');
}

return items.map(item => ({
  json: {
    ...item.json,
    gemini_api_key: geminiApiKey
  }
}));`;

geminiKeyNode.parameters.jsCode = newCode;
console.log('✅ Nœud "Get Gemini API Key" modifié pour récupérer automatiquement depuis Vercel');

// Alternative : Créer un nœud HTTP Request avant le nœud Code
// Mais pour simplifier, on va utiliser $http dans le code (si disponible dans n8n)
// Sinon, on va créer un nœud HTTP Request séparé

// Vérifier si on doit créer un nœud HTTP Request séparé
// Dans n8n, $http n'est pas toujours disponible dans les nœuds Code
// Donc on va créer un nœud HTTP Request qui précède le nœud Code

// Trouver la position du nœud "Get Gemini API Key"
const geminiKeyNodePosition = geminiKeyNode.position;

// Créer un nouveau nœud HTTP Request pour récupérer la clé
const httpRequestNode = {
  "parameters": {
    "method": "GET",
    "url": `=${VERCEL_BASE_URL}/api/gemini-key?full=true`,
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
  "id": "fetch-gemini-api-key-node",
  "name": "Fetch Gemini API Key from Vercel",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [
    geminiKeyNodePosition[0] - 320, // Position X (avant Get Gemini API Key)
    geminiKeyNodePosition[1]       // Position Y (même hauteur)
  ]
};

// Ajouter le nœud HTTP Request
workflow.nodes.push(httpRequestNode);
console.log('✅ Nœud "Fetch Gemini API Key from Vercel" créé');

// Modifier le nœud "Get Gemini API Key" pour utiliser la réponse HTTP
const updatedCode = `// ═══════════════════════════════════════════════════════════
// 🔑 EXTRACTION DE LA CLÉ API GEMINI DEPUIS LA RÉPONSE VERCEL
// ═══════════════════════════════════════════════════════════
//
// Ce nœud extrait la clé API Gemini depuis la réponse de l'endpoint Vercel
//
// ✅ Configuration automatique - Aucune action requise !
// ═══════════════════════════════════════════════════════════

const items = $input.all();
const data = items[0].json;

let geminiApiKey = '';

try {
  // La réponse de l'endpoint Vercel est dans $json
  // Format: { apiKey: "...", configured: true, ... }
  if (data.apiKey) {
    geminiApiKey = data.apiKey;
    console.log('✅ Clé API Gemini récupérée depuis Vercel');
  } else if (data.error) {
    throw new Error(\`Erreur Vercel: \${data.message || data.error}\`);
  } else {
    // Fallback : essayer depuis les credentials n8n
    geminiApiKey = $workflow.getStaticData('global').geminiApiKey || '';
    
    if (!geminiApiKey) {
      throw new Error('Clé API non trouvée. Vérifiez que GEMINI_API_KEY est configurée dans Vercel.');
    }
    
    console.log('⚠️  Utilisation de la clé depuis les credentials n8n (fallback)');
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
  throw new Error(\`❌ Impossible de récupérer la clé API Gemini: \${error.message}\`);
}

if (!geminiApiKey) {
  throw new Error('❌ Clé API Gemini vide');
}

return items.map(item => ({
  json: {
    ...item.json,
    gemini_api_key: geminiApiKey
  }
}));`;

geminiKeyNode.parameters.jsCode = updatedCode;
console.log('✅ Nœud "Get Gemini API Key" modifié pour extraire depuis la réponse HTTP');

// Modifier les connexions
// "Choose AI Model (IF)" -> "Fetch Gemini API Key from Vercel" -> "Get Gemini API Key" -> "Call Gemini API"

// Trouver le nœud "Choose AI Model (IF)"
const chooseModelNode = workflow.nodes.find(n => n.name === 'Choose AI Model (IF)');

if (chooseModelNode && workflow.connections[chooseModelNode.name]) {
  // Modifier la connexion pour pointer vers le nouveau nœud HTTP Request
  if (workflow.connections[chooseModelNode.name].main && 
      workflow.connections[chooseModelNode.name].main[1]) {
    
    workflow.connections[chooseModelNode.name].main[1] = [
      {
        "node": "Fetch Gemini API Key from Vercel",
        "type": "main",
        "index": 0
      }
    ];
    
    // Ajouter la connexion du nœud HTTP Request vers "Get Gemini API Key"
    workflow.connections["Fetch Gemini API Key from Vercel"] = {
      "main": [
        [
          {
            "node": "Get Gemini API Key",
            "type": "main",
            "index": 0
          }
        ]
      ]
    };
    
    console.log('✅ Connexions mises à jour');
  }
} else {
  console.warn('⚠️  Connexions non trouvées, vous devrez les configurer manuellement dans n8n');
}

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Configuration automatique terminée !');
console.log('\n📋 Résumé des modifications :');
console.log('1. ✅ Nouveau nœud "Fetch Gemini API Key from Vercel" créé');
console.log('2. ✅ Nœud "Get Gemini API Key" modifié pour extraire la clé depuis la réponse');
console.log('3. ✅ Connexions mises à jour automatiquement');
console.log('\n🎯 Le workflow récupère maintenant automatiquement la clé API Gemini depuis Vercel !');
console.log('\n⚠️  IMPORTANT : Assurez-vous que :');
console.log(`   - L'endpoint ${VERCEL_BASE_URL}/api/gemini-key est accessible`);
console.log('   - La variable GEMINI_API_KEY est configurée dans Vercel');
console.log('   - Le paramètre ?full=true est autorisé (modifiez api/gemini-key.js si nécessaire)');

