/**
 * Script de correction complète du workflow
 * Vérifie et corrige TOUTES les connexions critiques
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction complète du workflow...\n');

// 1. Trouver tous les nodes critiques
const nodes = {
  determinePrompt: workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt'),
  aiModelSelector: workflow.nodes.find(n => n.name === '⚙️ AI Model Selector (Change AI_MODEL)'),
  debugBeforeSwitch: workflow.nodes.find(n => n.name === '🔍 Debug Before Switch' || n.name.includes('Debug Before Switch')),
  chooseAiModelIf: workflow.nodes.find(n => n.name === 'Choose AI Model (IF)'),
  prepareApiRequest: workflow.nodes.find(n => n.name === 'Prepare API Request'),
  callEmmaApi: workflow.nodes.find(n => n.name === 'Call /api/chat (Emma)' || n.name.includes('Call /api/chat')),
  callGeminiApi: workflow.nodes.find(n => n.name === 'Call Gemini API'),
  parseGeminiResponse: workflow.nodes.find(n => n.name === 'Parse Gemini Response'),
  parseApiResponse: workflow.nodes.find(n => n.name === 'Parse API Response'),
  fetchPrompts: workflow.nodes.find(n => n.name === 'Fetch Prompts from API'),
  getActiveTickers: workflow.nodes.find(n => n.name === 'Get Active Tickers'),
  mergeTriggers: workflow.nodes.find(n => n.name === 'Merge Triggers'),
};

console.log('📋 Nodes critiques trouvés:');
Object.entries(nodes).forEach(([key, node]) => {
  console.log(`   ${key}: ${node ? '✅' : '❌'} ${node?.name || 'MANQUANT'}`);
});

// 2. Initialiser les connexions
if (!workflow.connections) {
  workflow.connections = {};
}

// 3. Corriger le flux principal: Fetch Prompts → Get Active Tickers → Determine Time-Based Prompt
if (nodes.fetchPrompts && nodes.getActiveTickers) {
  if (!workflow.connections[nodes.fetchPrompts.name]) {
    workflow.connections[nodes.fetchPrompts.name] = {};
  }
  if (!workflow.connections[nodes.fetchPrompts.name].main) {
    workflow.connections[nodes.fetchPrompts.name].main = [];
  }
  if (!workflow.connections[nodes.fetchPrompts.name].main[0]) {
    workflow.connections[nodes.fetchPrompts.name].main[0] = [];
  }
  
  const existing = workflow.connections[nodes.fetchPrompts.name].main[0].find(
    c => c.node === nodes.getActiveTickers.name
  );
  
  if (!existing) {
    workflow.connections[nodes.fetchPrompts.name].main[0].push({
      node: nodes.getActiveTickers.name,
      type: 'main',
      index: 0
    });
    console.log(`✅ Connexion ajoutée: ${nodes.fetchPrompts.name} → ${nodes.getActiveTickers.name}`);
  }
}

if (nodes.getActiveTickers && nodes.determinePrompt) {
  if (!workflow.connections[nodes.getActiveTickers.name]) {
    workflow.connections[nodes.getActiveTickers.name] = {};
  }
  if (!workflow.connections[nodes.getActiveTickers.name].main) {
    workflow.connections[nodes.getActiveTickers.name].main = [];
  }
  if (!workflow.connections[nodes.getActiveTickers.name].main[0]) {
    workflow.connections[nodes.getActiveTickers.name].main[0] = [];
  }
  
  const existing = workflow.connections[nodes.getActiveTickers.name].main[0].find(
    c => c.node === nodes.determinePrompt.name
  );
  
  if (!existing) {
    workflow.connections[nodes.getActiveTickers.name].main[0].push({
      node: nodes.determinePrompt.name,
      type: 'main',
      index: 0
    });
    console.log(`✅ Connexion ajoutée: ${nodes.getActiveTickers.name} → ${nodes.determinePrompt.name}`);
  }
}

// 4. Corriger le flux AI Model: Determine → AI Selector → Debug → IF
if (nodes.determinePrompt && nodes.aiModelSelector) {
  if (!workflow.connections[nodes.determinePrompt.name]) {
    workflow.connections[nodes.determinePrompt.name] = {};
  }
  if (!workflow.connections[nodes.determinePrompt.name].main) {
    workflow.connections[nodes.determinePrompt.name].main = [];
  }
  if (!workflow.connections[nodes.determinePrompt.name].main[0]) {
    workflow.connections[nodes.determinePrompt.name].main[0] = [];
  }
  
  // Remplacer toutes les connexions existantes par la bonne
  workflow.connections[nodes.determinePrompt.name].main[0] = [{
    node: nodes.aiModelSelector.name,
    type: 'main',
    index: 0
  }];
  console.log(`✅ Connexion corrigée: ${nodes.determinePrompt.name} → ${nodes.aiModelSelector.name}`);
}

if (nodes.aiModelSelector && nodes.debugBeforeSwitch) {
  if (!workflow.connections[nodes.aiModelSelector.name]) {
    workflow.connections[nodes.aiModelSelector.name] = {};
  }
  workflow.connections[nodes.aiModelSelector.name].main = [[{
    node: nodes.debugBeforeSwitch.name,
    type: 'main',
    index: 0
  }]];
  console.log(`✅ Connexion corrigée: ${nodes.aiModelSelector.name} → ${nodes.debugBeforeSwitch.name}`);
}

if (nodes.debugBeforeSwitch && nodes.chooseAiModelIf) {
  if (!workflow.connections[nodes.debugBeforeSwitch.name]) {
    workflow.connections[nodes.debugBeforeSwitch.name] = {};
  }
  workflow.connections[nodes.debugBeforeSwitch.name].main = [[{
    node: nodes.chooseAiModelIf.name,
    type: 'main',
    index: 0
  }]];
  console.log(`✅ Connexion corrigée: ${nodes.debugBeforeSwitch.name} → ${nodes.chooseAiModelIf.name}`);
}

// 5. Corriger les branches du IF: TRUE → Emma, FALSE → Gemini
if (nodes.chooseAiModelIf) {
  if (!workflow.connections[nodes.chooseAiModelIf.name]) {
    workflow.connections[nodes.chooseAiModelIf.name] = {};
  }
  
  // TRUE branch (Emma)
  const trueBranch = [];
  if (nodes.prepareApiRequest) {
    trueBranch.push({
      node: nodes.prepareApiRequest.name,
      type: 'main',
      index: 0
    });
  }
  
  // FALSE branch (Gemini)
  const falseBranch = [];
  if (nodes.callGeminiApi) {
    falseBranch.push({
      node: nodes.callGeminiApi.name,
      type: 'main',
      index: 0
    });
  }
  
  workflow.connections[nodes.chooseAiModelIf.name].main = [trueBranch, falseBranch];
  console.log(`✅ Connexions IF corrigées:`);
  console.log(`   TRUE: ${nodes.chooseAiModelIf.name} → ${nodes.prepareApiRequest?.name || 'MANQUANT'}`);
  console.log(`   FALSE: ${nodes.chooseAiModelIf.name} → ${nodes.callGeminiApi?.name || 'MANQUANT'}`);
}

// 6. Corriger Prepare API Request → Call /api/chat (Emma) → Parse API Response
if (nodes.prepareApiRequest && nodes.callEmmaApi) {
  if (!workflow.connections[nodes.prepareApiRequest.name]) {
    workflow.connections[nodes.prepareApiRequest.name] = {};
  }
  if (!workflow.connections[nodes.prepareApiRequest.name].main) {
    workflow.connections[nodes.prepareApiRequest.name].main = [];
  }
  if (!workflow.connections[nodes.prepareApiRequest.name].main[0]) {
    workflow.connections[nodes.prepareApiRequest.name].main[0] = [];
  }
  
  const existing = workflow.connections[nodes.prepareApiRequest.name].main[0].find(
    c => c.node === nodes.callEmmaApi.name
  );
  
  if (!existing) {
    workflow.connections[nodes.prepareApiRequest.name].main[0].push({
      node: nodes.callEmmaApi.name,
      type: 'main',
      index: 0
    });
    console.log(`✅ Connexion ajoutée: ${nodes.prepareApiRequest.name} → ${nodes.callEmmaApi.name}`);
  }
}

if (nodes.callEmmaApi && nodes.parseApiResponse) {
  if (!workflow.connections[nodes.callEmmaApi.name]) {
    workflow.connections[nodes.callEmmaApi.name] = {};
  }
  workflow.connections[nodes.callEmmaApi.name].main = [[{
    node: nodes.parseApiResponse.name,
    type: 'main',
    index: 0
  }]];
  console.log(`✅ Connexion corrigée: ${nodes.callEmmaApi.name} → ${nodes.parseApiResponse.name}`);
}

// 7. Corriger Call Gemini API → Parse Gemini Response → Parse API Response
if (nodes.callGeminiApi && nodes.parseGeminiResponse) {
  if (!workflow.connections[nodes.callGeminiApi.name]) {
    workflow.connections[nodes.callGeminiApi.name] = {};
  }
  workflow.connections[nodes.callGeminiApi.name].main = [[{
    node: nodes.parseGeminiResponse.name,
    type: 'main',
    index: 0
  }]];
  console.log(`✅ Connexion corrigée: ${nodes.callGeminiApi.name} → ${nodes.parseGeminiResponse.name}`);
}

if (nodes.parseGeminiResponse && nodes.parseApiResponse) {
  if (!workflow.connections[nodes.parseGeminiResponse.name]) {
    workflow.connections[nodes.parseGeminiResponse.name] = {};
  }
  workflow.connections[nodes.parseGeminiResponse.name].main = [[{
    node: nodes.parseApiResponse.name,
    type: 'main',
    index: 0
  }]];
  console.log(`✅ Connexion corrigée: ${nodes.parseGeminiResponse.name} → ${nodes.parseApiResponse.name}`);
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Correction complète terminée !');
console.log('\n📋 Flux corrigé:');
console.log('   Fetch Prompts → Get Active Tickers → Determine Time-Based Prompt');
console.log('   → ⚙️ AI Model Selector → 🔍 Debug Before Switch → Choose AI Model (IF)');
console.log('      ├─ TRUE → Prepare API Request → Call /api/chat (Emma) → Parse API Response');
console.log('      └─ FALSE → Call Gemini API → Parse Gemini Response → Parse API Response');

