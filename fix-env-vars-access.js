/**
 * Corriger l'accès aux variables d'environnement dans n8n Cloud
 * Utiliser un nœud Code pour construire le header Authorization
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction de l\'accès aux variables d\'environnement...\n');

// Trouver le nœud "Call /api/emma-n8n (Briefing)"
const emmaN8nNode = workflow.nodes.find(n => n.name === 'Call /api/emma-n8n (Briefing)');

if (!emmaN8nNode) {
  console.error('❌ Nœud "Call /api/emma-n8n (Briefing)" introuvable');
  process.exit(1);
}

console.log('✅ Nœud trouvé:', emmaN8nNode.name);

// Option 1: Utiliser un nœud Code pour construire le header
// Trouver le nœud "Prepare API Request" qui précède
const prepareApiNode = workflow.nodes.find(n => n.name === 'Prepare API Request');

if (prepareApiNode) {
  // Modifier "Prepare API Request" pour ajouter le header Authorization
  prepareApiNode.parameters.jsCode = `const items = $input.all();
const data = items[0].json;

// Extract ticker symbols from input 1 (tickers data)
const tickers = items.filter(item => item.json.ticker).map(item => item.json.ticker);
const tickerList = tickers.join(', ');

// Normaliser le type de briefing
let briefingType = data.prompt_type;
if (briefingType === 'noon') {
  briefingType = 'midday';
}

// Construire le header Authorization
// NOTE: La clé API doit être configurée dans les credentials n8n ou dans les variables du workflow
// Pour l'instant, on va utiliser une variable de workflow ou credentials
const apiKey = $workflow.getStaticData('global').n8nApiKey || 'YOUR_N8N_API_KEY_HERE';

return [{
  json: {
    ...data,
    tickers: tickerList,
    briefing_type: briefingType,
    authorization_header: \`Bearer \${apiKey}\`
  }
}];`;

  console.log('✅ Nœud "Prepare API Request" modifié pour inclure le header Authorization');
}

// Option 2: Modifier le nœud HTTP Request pour utiliser le header depuis les données
// Au lieu d'utiliser {{ $env.N8N_API_KEY }}, utiliser {{ $json.authorization_header }}
emmaN8nNode.parameters.headerParameters.parameters = emmaN8nNode.parameters.headerParameters.parameters.map(param => {
  if (param.name === 'Authorization') {
    return {
      name: 'Authorization',
      value: '={{ $json.authorization_header }}'
    };
  }
  return param;
});

console.log('✅ Header Authorization modifié pour utiliser $json.authorization_header');

// Option 3: Alternative - Utiliser les credentials HTTP Header Auth de n8n
// Mais pour l'instant, on va utiliser l'option 2 qui est plus simple

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé!');
console.log('\n📋 Instructions:');
console.log('   1. Dans n8n, allez dans Settings → Variables');
console.log('   2. Créez une variable "N8N_API_KEY" avec votre clé API');
console.log('   3. OU modifiez le nœud "Prepare API Request" pour utiliser les credentials n8n');
console.log('   4. OU remplacez "YOUR_N8N_API_KEY_HERE" par votre clé API directement');

