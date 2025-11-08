/**
 * Script pour corriger l'erreur "Cannot read properties of undefined (reading 'disabled')"
 * dans le workflow n8n en remplaçant le Switch par un appel direct à /api/emma-n8n
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

// 1. Trouver les IDs des nœuds à supprimer
const routeByApiNode = workflow.nodes.find(n => n.name === 'Route by API');
const perplexityNode = workflow.nodes.find(n => n.name === 'Call Perplexity API');
const geminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');
const prepareApiRequestNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
const parseApiResponseNode = workflow.nodes.find(n => n.name === 'Parse API Response');

if (!routeByApiNode || !perplexityNode || !geminiNode) {
  console.error('❌ Nœuds introuvables dans le workflow');
  process.exit(1);
}

console.log('✅ Nœuds trouvés:');
console.log(`   - Route by API: ${routeByApiNode.id}`);
console.log(`   - Call Perplexity API: ${perplexityNode.id}`);
console.log(`   - Call Gemini API: ${geminiNode.id}`);

// 2. Créer le nouveau nœud "Call /api/emma-n8n (Briefing)"
const newEmmaN8nNode = {
  "parameters": {
    "method": "POST",
    "url": "=https://gob.vercel.app/api/emma-n8n?action=briefing",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        },
        {
          "name": "Authorization",
          "value": "=Bearer {{ $env.N8N_API_KEY }}"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ {\n  \"type\": $json.prompt_type === 'noon' ? 'midday' : $json.prompt_type,\n  \"tickers\": $json.tickers ? $json.tickers.split(', ').filter(t => t) : []\n} }}",
    "options": {
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  },
  "id": "emma-n8n-briefing-node-id",
  "name": "Call /api/emma-n8n (Briefing)",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [
    prepareApiRequestNode.position[0] + 224,
    prepareApiRequestNode.position[1]
  ]
};

// 3. Mettre à jour le nœud "Prepare API Request" pour préparer les données pour emma-n8n
const updatedPrepareApiRequest = {
  ...prepareApiRequestNode,
  "parameters": {
    "jsCode": "const items = $input.all();\nconst data = items[0].json;\n\n// Extract ticker symbols from input 1 (tickers data)\nconst tickers = items.filter(item => item.json.ticker).map(item => item.json.ticker);\nconst tickerList = tickers.join(', ');\n\n// Normaliser le type de briefing\nlet briefingType = data.prompt_type;\nif (briefingType === 'noon') {\n  briefingType = 'midday';\n}\n\nreturn [{\n  json: {\n    ...data,\n    tickers: tickerList,\n    briefing_type: briefingType\n  }\n}];"
  }
};

// 4. Mettre à jour le nœud "Parse API Response" pour gérer la réponse de emma-n8n
const updatedParseApiResponse = {
  ...parseApiResponseNode,
  "parameters": {
    "jsCode": "const items = $input.all();\nconst data = items[0].json;\n\n// La réponse de /api/emma-n8n?action=briefing contient:\n// { briefing, tools_used, execution_time_ms, type, prompt_config }\nconst content = data.briefing || data.response || 'No content received';\n\nreturn [{\n  json: {\n    ...data,\n    newsletter_content: content,\n    api_type: 'emma-agent', // Pour compatibilité avec le reste du workflow\n    generated_at: new Date().toISOString()\n  }\n}];"
  }
};

// 5. Supprimer les anciens nœuds
workflow.nodes = workflow.nodes.filter(n => 
  n.id !== routeByApiNode.id && 
  n.id !== perplexityNode.id && 
  n.id !== geminiNode.id
);

// 6. Remplacer les nœuds modifiés
workflow.nodes = workflow.nodes.map(n => {
  if (n.id === prepareApiRequestNode.id) {
    return updatedPrepareApiRequest;
  }
  if (n.id === parseApiResponseNode.id) {
    return updatedParseApiResponse;
  }
  return n;
});

// 7. Ajouter le nouveau nœud
workflow.nodes.push(newEmmaN8nNode);

// 8. Mettre à jour les connexions
// Supprimer les connexions vers Route by API, Perplexity, Gemini
workflow.connections = Object.fromEntries(
  Object.entries(workflow.connections).filter(([nodeName]) => 
    nodeName !== 'Route by API' && 
    nodeName !== 'Call Perplexity API' && 
    nodeName !== 'Call Gemini API'
  )
);

// Mettre à jour la connexion de "Prepare API Request" vers le nouveau nœud
if (workflow.connections['Prepare API Request']) {
  workflow.connections['Prepare API Request'] = {
    "main": [
      [
        {
          "node": "Call /api/emma-n8n (Briefing)",
          "type": "main",
          "index": 0
        }
      ]
    ]
  };
}

// Ajouter la connexion du nouveau nœud vers "Parse API Response"
workflow.connections['Call /api/emma-n8n (Briefing)'] = {
  "main": [
    [
      {
        "node": "Parse API Response",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// 9. Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));
console.log('\n✅ Workflow corrigé et sauvegardé!');
console.log('   - Switch "Route by API" supprimé');
console.log('   - Nœuds Perplexity/Gemini supprimés');
console.log('   - Nouveau nœud "Call /api/emma-n8n (Briefing)" ajouté');
console.log('   - Connexions mises à jour');

