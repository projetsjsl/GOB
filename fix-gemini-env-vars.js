/**
 * Corriger l'erreur "access to env vars denied" dans le nœud "Call Gemini API"
 * Solution : Utiliser les credentials n8n ou passer la clé via un nœud Code
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction de l\'accès aux variables d\'environnement pour Gemini API...\n');

// Trouver le nœud "Call Gemini API"
const geminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');

if (!geminiNode) {
  console.error('❌ Nœud "Call Gemini API" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Call Gemini API" trouvé');

// Trouver le nœud "Prepare API Request" qui précède "Call Gemini API"
const prepareApiNode = workflow.nodes.find(n => n.name === 'Prepare API Request');

if (!prepareApiNode) {
  console.error('❌ Nœud "Prepare API Request" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Prepare API Request" trouvé');

// Solution 1: Modifier "Prepare API Request" pour ajouter la clé API Gemini
// La clé sera récupérée depuis les credentials n8n ou depuis une variable de workflow
const originalCode = prepareApiNode.parameters.jsCode;

// Ajouter la récupération de la clé API Gemini
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

// Récupérer la clé API Gemini depuis les credentials n8n
// Si les credentials ne sont pas disponibles, utiliser une variable de workflow
let geminiApiKey = '';
try {
  // Essayer de récupérer depuis les credentials HTTP Header Auth
  // Note: Vous devez créer des credentials "Google Gemini API" dans n8n
  // avec le nom "GEMINI_API_KEY" dans les credentials
  geminiApiKey = $credentials?.geminiApi?.apiKey || 
                 $workflow.getStaticData('global').geminiApiKey || 
                 '';
  
  if (!geminiApiKey) {
    console.warn('⚠️  Clé API Gemini non trouvée dans les credentials. Utilisez les credentials n8n.');
  }
} catch (e) {
  console.warn('⚠️  Erreur lors de la récupération de la clé API:', e.message);
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
    ai_model: data.ai_model || 'emma',
    // Ajouter la clé API Gemini pour le nœud suivant
    gemini_api_key: geminiApiKey
  }
}];`;

prepareApiNode.parameters.jsCode = updatedCode;
console.log('✅ Nœud "Prepare API Request" modifié pour inclure gemini_api_key');

// Solution 2: Modifier "Call Gemini API" pour utiliser la clé depuis les données
// au lieu de $env.GEMINI_API_KEY
const queryParams = geminiNode.parameters.queryParameters.parameters;
const keyParam = queryParams.find(p => p.name === 'key');

if (keyParam) {
  // Remplacer $env.GEMINI_API_KEY par $json.gemini_api_key
  keyParam.value = "={{ $json.gemini_api_key }}";
  console.log('✅ Paramètre "key" modifié pour utiliser $json.gemini_api_key');
} else {
  console.warn('⚠️  Paramètre "key" non trouvé dans queryParameters');
}

// Solution 3: Alternative - Utiliser les credentials HTTP Header Auth de n8n
// Ajouter une note dans les commentaires du nœud
// Pour cela, on peut aussi créer un nœud Code juste avant "Call Gemini API"
// qui récupère la clé depuis les credentials

// Trouver le nœud "Choose AI Model (IF)" qui précède "Call Gemini API"
const chooseModelNode = workflow.nodes.find(n => n.name === 'Choose AI Model (IF)');

if (chooseModelNode) {
  console.log('✅ Nœud "Choose AI Model (IF)" trouvé');
  
  // Vérifier les connexions pour voir si on peut ajouter un nœud Code intermédiaire
  // Pour l'instant, on va utiliser la solution 2 qui est plus simple
}

// Sauvegarder le workflow corrigé
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Instructions pour finaliser la configuration :');
console.log('1. Dans n8n, créez des credentials "HTTP Header Auth" nommés "Google Gemini API"');
console.log('2. Ajoutez la clé API Gemini dans ces credentials');
console.log('3. OU configurez une variable de workflow "geminiApiKey" dans le staticData global');
console.log('4. OU modifiez le nœud "Prepare API Request" pour utiliser directement votre clé API');
console.log('\n💡 Alternative rapide : Modifiez manuellement le nœud "Prepare API Request"');
console.log('   et remplacez geminiApiKey par votre clé API directement dans le code (non recommandé pour la sécurité)');

