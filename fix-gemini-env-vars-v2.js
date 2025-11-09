/**
 * Correction complète de l'erreur "access to env vars denied" pour Gemini API
 * Solution : Ajouter un nœud Code qui récupère la clé API depuis les credentials n8n
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction complète de l\'accès aux variables d\'environnement pour Gemini API...\n');

// Trouver le nœud "Call Gemini API"
const geminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');
const chooseModelNode = workflow.nodes.find(n => n.name === 'Choose AI Model (IF)');

if (!geminiNode) {
  console.error('❌ Nœud "Call Gemini API" non trouvé');
  process.exit(1);
}

if (!chooseModelNode) {
  console.error('❌ Nœud "Choose AI Model (IF)" non trouvé');
  process.exit(1);
}

console.log('✅ Nœuds trouvés');

// Créer un nouveau nœud Code qui récupère la clé API Gemini
const geminiApiKeyNode = {
  "parameters": {
    "jsCode": "// ═══════════════════════════════════════════════════════════\n// 🔑 RÉCUPÉRATION DE LA CLÉ API GEMINI\n// ═══════════════════════════════════════════════════════════\n//\n// Ce nœud récupère la clé API Gemini depuis les credentials n8n\n// ou depuis une variable de workflow.\n//\n// 📋 CONFIGURATION REQUISE :\n// 1. Créez des credentials \"HTTP Header Auth\" dans n8n\n// 2. Nommez-les \"Google Gemini API\"\n// 3. Ajoutez votre clé API Gemini dans le champ \"Value\"\n//\n// OU\n//\n// 1. Configurez une variable de workflow dans staticData global\n// 2. Nommez-la \"geminiApiKey\"\n//\n// ═══════════════════════════════════════════════════════════\n\nconst items = $input.all();\n\nreturn items.map(item => {\n  const data = item.json;\n  \n  // Méthode 1: Récupérer depuis les credentials HTTP Header Auth\n  let geminiApiKey = '';\n  \n  try {\n    // Essayer de récupérer depuis les credentials\n    // Vous devez créer des credentials \"HTTP Header Auth\" nommés \"Google Gemini API\"\n    // et ajouter la clé dans le champ \"Value\"\n    \n    // Note: Dans n8n, les credentials sont accessibles via $credentials\n    // mais la syntaxe exacte dépend de votre configuration\n    \n    // Alternative: Utiliser une variable de workflow\n    geminiApiKey = $workflow.getStaticData('global').geminiApiKey || '';\n    \n    // Si toujours vide, essayer depuis les credentials (si configurés)\n    if (!geminiApiKey) {\n      // Vous pouvez aussi hardcoder temporairement pour tester:\n      // geminiApiKey = 'VOTRE_CLE_API_ICI';\n      console.warn('⚠️  Clé API Gemini non trouvée. Configurez les credentials n8n.');\n    }\n  } catch (e) {\n    console.error('❌ Erreur lors de la récupération de la clé API:', e.message);\n  }\n  \n  if (!geminiApiKey) {\n    throw new Error('❌ Clé API Gemini manquante. Veuillez configurer les credentials n8n ou la variable de workflow geminiApiKey.');\n  }\n  \n  return {\n    json: {\n      ...data,\n      gemini_api_key: geminiApiKey\n    }\n  };\n});"
  },
  "id": "gemini-api-key-node",
  "name": "Get Gemini API Key",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    19328,  // Position X (entre Choose AI Model et Call Gemini API)
    4736   // Position Y (aligné avec Call Gemini API)
  ]
};

// Ajouter le nouveau nœud au workflow
workflow.nodes.push(geminiApiKeyNode);
console.log('✅ Nœud "Get Gemini API Key" créé');

// Modifier le nœud "Call Gemini API" pour utiliser la clé depuis les données
const queryParams = geminiNode.parameters.queryParameters.parameters;
const keyParam = queryParams.find(p => p.name === 'key');

if (keyParam) {
  keyParam.value = "={{ $json.gemini_api_key }}";
  console.log('✅ Paramètre "key" modifié pour utiliser $json.gemini_api_key');
} else {
  console.warn('⚠️  Paramètre "key" non trouvé');
}

// Modifier les connexions pour insérer le nouveau nœud entre "Choose AI Model (IF)" et "Call Gemini API"
// La connexion actuelle est: "Choose AI Model (IF)" -> "Call Gemini API" (index 1)
// Nouvelle connexion: "Choose AI Model (IF)" -> "Get Gemini API Key" -> "Call Gemini API"

if (workflow.connections[chooseModelNode.name] && 
    workflow.connections[chooseModelNode.name].main &&
    workflow.connections[chooseModelNode.name].main[1]) {
  
  // Remplacer la connexion directe par une connexion via le nouveau nœud
  workflow.connections[chooseModelNode.name].main[1] = [
    {
      "node": "Get Gemini API Key",
      "type": "main",
      "index": 0
    }
  ];
  
  // Ajouter la connexion du nouveau nœud vers "Call Gemini API"
  workflow.connections["Get Gemini API Key"] = {
    "main": [
      [
        {
          "node": "Call Gemini API",
          "type": "main",
          "index": 0
        }
      ]
    ]
  };
  
  console.log('✅ Connexions mises à jour');
} else {
  console.warn('⚠️  Connexions non trouvées, vous devrez les configurer manuellement dans n8n');
}

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Instructions pour finaliser la configuration :');
console.log('\n🔧 MÉTHODE 1 : Utiliser les credentials n8n (Recommandé)');
console.log('1. Dans n8n, allez dans "Credentials"');
console.log('2. Créez de nouveaux credentials de type "HTTP Header Auth"');
console.log('3. Nommez-les "Google Gemini API"');
console.log('4. Dans le champ "Name", mettez "Authorization"');
console.log('5. Dans le champ "Value", mettez votre clé API Gemini');
console.log('6. Modifiez le nœud "Get Gemini API Key" pour utiliser ces credentials');
console.log('\n🔧 MÉTHODE 2 : Variable de workflow (Alternative)');
console.log('1. Dans n8n, modifiez le nœud "Get Gemini API Key"');
console.log('2. Remplacez la ligne geminiApiKey = ... par :');
console.log('   geminiApiKey = "VOTRE_CLE_API_GEMINI_ICI";');
console.log('3. OU configurez une variable de workflow dans staticData global');
console.log('\n⚠️  IMPORTANT : Ne commitez jamais votre clé API dans le code !');
console.log('   Utilisez toujours les credentials n8n pour la sécurité.');

