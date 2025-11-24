/**
 * Script pour vérifier que le Switch lit correctement ai_model
 * 
 * Vérifie:
 * 1. Que le sélecteur génère bien ai_model
 * 2. Que le Switch lit correctement ai_model
 * 3. Que les conditions sont correctes
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔍 Vérification que le Switch lit correctement ai_model...\n');

// 1. Vérifier le node sélecteur
const aiModelSelector = workflow.nodes.find(n => n.name === '⚙️ AI Model Selector (Change AI_MODEL)');

if (!aiModelSelector) {
  console.error('❌ Node sélecteur non trouvé');
  process.exit(1);
}

console.log('✅ Node sélecteur trouvé');

// Vérifier que le code génère bien ai_model
const selectorCode = aiModelSelector.parameters.jsCode || '';
if (selectorCode.includes('ai_model: AI_MODEL')) {
  console.log('✅ Le sélecteur génère bien ai_model');
} else {
  console.log('❌ Le sélecteur ne génère pas ai_model correctement');
  console.log('   Code actuel:', selectorCode.substring(0, 200));
}

// 2. Vérifier le node Switch
const chooseAiModelSwitch = workflow.nodes.find(n => n.name === '🤖 Choose AI Model');

if (!chooseAiModelSwitch) {
  console.error('❌ Node Switch non trouvé');
  process.exit(1);
}

console.log('✅ Node Switch trouvé');

// Vérifier la configuration du Switch
const switchParams = chooseAiModelSwitch.parameters || {};
const rules = switchParams.rules || {};
const values = rules.values || [];

console.log('\n📋 Configuration actuelle du Switch:');
console.log('   Mode:', switchParams.mode || 'non défini');
console.log('   Nombre de routes:', values.length);

values.forEach((rule, index) => {
  console.log(`\n   Route ${index + 1}:`);
  console.log('     Output Key:', rule.outputKey || 'non défini');
  
  const conditions = rule.conditions || {};
  const stringConditions = conditions.string || [];
  
  stringConditions.forEach((condition, condIndex) => {
    console.log(`     Condition ${condIndex + 1}:`);
    console.log('       value1:', condition.value1 || 'non défini');
    console.log('       operation:', condition.operation || 'non défini');
    console.log('       value2:', condition.value2 || 'non défini');
    
    // Vérifier que value1 lit bien ai_model
    if (condition.value1 && condition.value1.includes('ai_model')) {
      console.log('       ✅ Lit bien ai_model');
    } else {
      console.log('       ❌ Ne lit pas ai_model');
      console.log('          value1 devrait être: ={{ $json.ai_model }}');
    }
  });
});

// 3. Corriger si nécessaire
let needsFix = false;

if (values.length < 2) {
  console.log('\n⚠️  Le Switch n\'a pas 2 routes, correction nécessaire...');
  needsFix = true;
} else {
  // Vérifier que les conditions sont correctes
  const route1 = values[0];
  const route2 = values[1];
  
  const route1Condition = route1.conditions?.string?.[0];
  const route2Condition = route2.conditions?.string?.[0];
  
  if (!route1Condition || !route1Condition.value1?.includes('ai_model')) {
    console.log('\n⚠️  Route 1 ne lit pas ai_model correctement');
    needsFix = true;
  }
  
  if (!route2Condition || !route2Condition.value1?.includes('ai_model')) {
    console.log('\n⚠️  Route 2 ne lit pas ai_model correctement');
    needsFix = true;
  }
  
  if (route1Condition?.value2 !== 'emma') {
    console.log('\n⚠️  Route 1 ne compare pas à "emma"');
    needsFix = true;
  }
  
  if (route2Condition?.value2 !== 'gemini') {
    console.log('\n⚠️  Route 2 ne compare pas à "gemini"');
    needsFix = true;
  }
}

if (needsFix) {
  console.log('\n🔧 Correction de la configuration du Switch...');
  
  chooseAiModelSwitch.parameters = {
    mode: 'rules',
    rules: {
      values: [
        {
          conditions: {
            string: [
              {
                value1: "={{ $json.ai_model }}",
                operation: 'equals',
                value2: 'emma'
              }
            ]
          },
          renameOutput: true,
          outputKey: '🤖 Emma (Perplexity)'
        },
        {
          conditions: {
            string: [
              {
                value1: "={{ $json.ai_model }}",
                operation: 'equals',
                value2: 'gemini'
              }
            ]
          },
          renameOutput: true,
          outputKey: '✨ Gemini Direct'
        }
      ]
    },
    options: {}
  };
  
  console.log('✅ Configuration corrigée');
  console.log('   Route 1: $json.ai_model === "emma" → 🤖 Emma (Perplexity)');
  console.log('   Route 2: $json.ai_model === "gemini" → ✨ Gemini Direct');
  
  // Sauvegarder
  writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
} else {
  console.log('\n✅ La configuration est correcte !');
}

// 4. Test de logique
console.log('\n🧪 Test de logique:');
console.log('   Si ai_model = "emma" → Route 1 devrait être prise');
console.log('   Si ai_model = "gemini" → Route 2 devrait être prise');
console.log('   Si ai_model = undefined → Aucune route ne devrait être prise');

// 5. Vérifier les connexions
if (workflow.connections['🤖 Choose AI Model']) {
  const switchConnections = workflow.connections['🤖 Choose AI Model'].main;
  console.log('\n📡 Connexions du Switch:');
  if (switchConnections && switchConnections.length >= 2) {
    console.log('   Route 0 (Emma):', switchConnections[0]?.[0]?.node || 'Non connectée');
    console.log('   Route 1 (Gemini):', switchConnections[1]?.[0]?.node || 'Non connectée');
  } else {
    console.log('   ⚠️  Le Switch n\'a pas 2 routes connectées');
  }
}

console.log('\n✅ Vérification terminée !');

