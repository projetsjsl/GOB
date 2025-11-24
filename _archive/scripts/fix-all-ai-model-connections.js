/**
 * Script pour corriger toutes les connexions du flux AI Model
 * 
 * Flux attendu:
 * Determine Time-Based Prompt → ⚙️ AI Model Selector → 🔍 Debug Before Switch → Choose AI Model (IF) → (Emma ou Gemini)
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de toutes les connexions du flux AI Model...\n');

// Trouver tous les nodes nécessaires
const determinePromptNode = workflow.nodes.find(n => 
  n.name === 'Determine Time-Based Prompt' || 
  n.name.includes('Determine') && n.name.includes('Prompt')
);

const aiModelSelectorNode = workflow.nodes.find(n => 
  n.name === '⚙️ AI Model Selector (Change AI_MODEL)' ||
  n.name.includes('AI Model Selector')
);

const debugBeforeSwitchNode = workflow.nodes.find(n => 
  n.name === '🔍 Debug Before Switch' ||
  n.name.includes('Debug Before Switch')
);

const chooseAiModelIfNode = workflow.nodes.find(n => 
  n.name === 'Choose AI Model (IF)' ||
  n.name.includes('Choose AI Model')
);

const prepareApiRequestNode = workflow.nodes.find(n => 
  n.name === 'Prepare API Request'
);

const callGeminiNode = workflow.nodes.find(n => 
  n.name === 'Call Gemini API'
);

const parseApiResponseNode = workflow.nodes.find(n => 
  n.name === 'Parse API Response' ||
  n.name.includes('Parse API')
);

const parseGeminiResponseNode = workflow.nodes.find(n => 
  n.name === 'Parse Gemini Response' ||
  n.name.includes('Parse Gemini')
);

// Vérifier que tous les nodes existent
const missingNodes = [];
if (!determinePromptNode) missingNodes.push('Determine Time-Based Prompt');
if (!aiModelSelectorNode) missingNodes.push('⚙️ AI Model Selector');
if (!debugBeforeSwitchNode) missingNodes.push('🔍 Debug Before Switch');
if (!chooseAiModelIfNode) missingNodes.push('Choose AI Model (IF)');
if (!prepareApiRequestNode) missingNodes.push('Prepare API Request');
if (!callGeminiNode) missingNodes.push('Call Gemini API');
if (!parseApiResponseNode) missingNodes.push('Parse API Response');
if (!parseGeminiResponseNode) missingNodes.push('Parse Gemini Response');

if (missingNodes.length > 0) {
  console.error('❌ Nodes manquants:', missingNodes.join(', '));
  process.exit(1);
}

console.log('✅ Tous les nodes trouvés');

// Initialiser les connexions si elles n'existent pas
if (!workflow.connections) {
  workflow.connections = {};
}

// 1. Determine Time-Based Prompt → ⚙️ AI Model Selector
if (!workflow.connections[determinePromptNode.name]) {
  workflow.connections[determinePromptNode.name] = {};
}
if (!workflow.connections[determinePromptNode.name].main) {
  workflow.connections[determinePromptNode.name].main = [];
}
if (!workflow.connections[determinePromptNode.name].main[0]) {
  workflow.connections[determinePromptNode.name].main[0] = [];
}
workflow.connections[determinePromptNode.name].main[0] = [
  {
    node: aiModelSelectorNode.name,
    type: 'main',
    index: 0
  }
];

console.log(`✅ ${determinePromptNode.name} → ${aiModelSelectorNode.name}`);

// 2. ⚙️ AI Model Selector → 🔍 Debug Before Switch
if (!workflow.connections[aiModelSelectorNode.name]) {
  workflow.connections[aiModelSelectorNode.name] = {};
}
if (!workflow.connections[aiModelSelectorNode.name].main) {
  workflow.connections[aiModelSelectorNode.name].main = [];
}
if (!workflow.connections[aiModelSelectorNode.name].main[0]) {
  workflow.connections[aiModelSelectorNode.name].main[0] = [];
}
workflow.connections[aiModelSelectorNode.name].main[0] = [
  {
    node: debugBeforeSwitchNode.name,
    type: 'main',
    index: 0
  }
];

console.log(`✅ ${aiModelSelectorNode.name} → ${debugBeforeSwitchNode.name}`);

// 3. 🔍 Debug Before Switch → Choose AI Model (IF)
if (!workflow.connections[debugBeforeSwitchNode.name]) {
  workflow.connections[debugBeforeSwitchNode.name] = {};
}
if (!workflow.connections[debugBeforeSwitchNode.name].main) {
  workflow.connections[debugBeforeSwitchNode.name].main = [];
}
if (!workflow.connections[debugBeforeSwitchNode.name].main[0]) {
  workflow.connections[debugBeforeSwitchNode.name].main[0] = [];
}
workflow.connections[debugBeforeSwitchNode.name].main[0] = [
  {
    node: chooseAiModelIfNode.name,
    type: 'main',
    index: 0
  }
];

console.log(`✅ ${debugBeforeSwitchNode.name} → ${chooseAiModelIfNode.name}`);

// 4. Choose AI Model (IF) → TRUE (Emma) → Prepare API Request
//    Choose AI Model (IF) → FALSE (Gemini) → Call Gemini API
if (!workflow.connections[chooseAiModelIfNode.name]) {
  workflow.connections[chooseAiModelIfNode.name] = {};
}
if (!workflow.connections[chooseAiModelIfNode.name].main) {
  workflow.connections[chooseAiModelIfNode.name].main = [];
}

// TRUE (index 0) → Emma
if (!workflow.connections[chooseAiModelIfNode.name].main[0]) {
  workflow.connections[chooseAiModelIfNode.name].main[0] = [];
}
workflow.connections[chooseAiModelIfNode.name].main[0] = [
  {
    node: prepareApiRequestNode.name,
    type: 'main',
    index: 0
  }
];

// FALSE (index 1) → Gemini
if (!workflow.connections[chooseAiModelIfNode.name].main[1]) {
  workflow.connections[chooseAiModelIfNode.name].main[1] = [];
}
workflow.connections[chooseAiModelIfNode.name].main[1] = [
  {
    node: callGeminiNode.name,
    type: 'main',
    index: 0
  }
];

console.log(`✅ ${chooseAiModelIfNode.name} → TRUE: ${prepareApiRequestNode.name}`);
console.log(`✅ ${chooseAiModelIfNode.name} → FALSE: ${callGeminiNode.name}`);

// 5. Prepare API Request → Parse API Response (vérifier si cette connexion existe déjà)
if (!workflow.connections[prepareApiRequestNode.name]) {
  workflow.connections[prepareApiRequestNode.name] = {};
}
if (!workflow.connections[prepareApiRequestNode.name].main) {
  workflow.connections[prepareApiRequestNode.name].main = [];
}
if (!workflow.connections[prepareApiRequestNode.name].main[0]) {
  workflow.connections[prepareApiRequestNode.name].main[0] = [];
}

// Vérifier si Parse API Response est déjà connecté
const existingConnection = workflow.connections[prepareApiRequestNode.name].main[0].find(
  c => c.node === parseApiResponseNode.name
);

if (!existingConnection) {
  workflow.connections[prepareApiRequestNode.name].main[0].push({
    node: parseApiResponseNode.name,
    type: 'main',
    index: 0
  });
  console.log(`✅ ${prepareApiRequestNode.name} → ${parseApiResponseNode.name}`);
}

// 6. Call Gemini API → Parse Gemini Response
if (!workflow.connections[callGeminiNode.name]) {
  workflow.connections[callGeminiNode.name] = {};
}
if (!workflow.connections[callGeminiNode.name].main) {
  workflow.connections[callGeminiNode.name].main = [];
}
if (!workflow.connections[callGeminiNode.name].main[0]) {
  workflow.connections[callGeminiNode.name].main[0] = [];
}
workflow.connections[callGeminiNode.name].main[0] = [
  {
    node: parseGeminiResponseNode.name,
    type: 'main',
    index: 0
  }
];

console.log(`✅ ${callGeminiNode.name} → ${parseGeminiResponseNode.name}`);

// 7. Parse Gemini Response → Parse API Response (pour unifier le flux)
// Vérifier si cette connexion existe déjà
if (!workflow.connections[parseGeminiResponseNode.name]) {
  workflow.connections[parseGeminiResponseNode.name] = {};
}
if (!workflow.connections[parseGeminiResponseNode.name].main) {
  workflow.connections[parseGeminiResponseNode.name].main = [];
}
if (!workflow.connections[parseGeminiResponseNode.name].main[0]) {
  workflow.connections[parseGeminiResponseNode.name].main[0] = [];
}

const existingGeminiToParse = workflow.connections[parseGeminiResponseNode.name].main[0].find(
  c => c.node === parseApiResponseNode.name
);

if (!existingGeminiToParse) {
  workflow.connections[parseGeminiResponseNode.name].main[0].push({
    node: parseApiResponseNode.name,
    type: 'main',
    index: 0
  });
  console.log(`✅ ${parseGeminiResponseNode.name} → ${parseApiResponseNode.name}`);
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Toutes les connexions corrigées !');
console.log('\n📋 Flux complet:');
console.log(`   1. ${determinePromptNode.name}`);
console.log(`   2. → ${aiModelSelectorNode.name}`);
console.log(`   3. → ${debugBeforeSwitchNode.name}`);
console.log(`   4. → ${chooseAiModelIfNode.name}`);
console.log(`      ├─ TRUE (emma) → ${prepareApiRequestNode.name} → ${parseApiResponseNode.name}`);
console.log(`      └─ FALSE (gemini) → ${callGeminiNode.name} → ${parseGeminiResponseNode.name} → ${parseApiResponseNode.name}`);

