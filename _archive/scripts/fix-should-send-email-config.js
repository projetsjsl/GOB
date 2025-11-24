/**
 * Script pour vérifier et corriger la configuration du node IF
 * "Should Send Email?" doit avoir une condition pour router entre Send et Preview
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Vérification et correction du node "Should Send Email?"...\n');

// Trouver le node IF
const shouldSendEmailIf = workflow.nodes.find(n => n.name === 'Should Send Email?');

if (!shouldSendEmailIf) {
  console.error('❌ Node IF non trouvé');
  process.exit(1);
}

console.log(`✅ Node IF trouvé: ${shouldSendEmailIf.name}`);
console.log(`   Type: ${shouldSendEmailIf.type}`);
console.log(`   TypeVersion: ${shouldSendEmailIf.typeVersion}`);

// Vérifier la configuration actuelle
const currentParams = shouldSendEmailIf.parameters;
console.log('\n📋 Configuration actuelle:');
console.log(JSON.stringify(currentParams, null, 2));

// Configuration correcte pour le node IF
// Condition: preview_mode === false && approved === true → Send Email
// Sinon → Preview
shouldSendEmailIf.parameters = {
  conditions: {
    options: {
      caseSensitive: true,
      leftValue: '',
      typeValidation: 'strict'
    },
    boolean: [
      {
        value1: "={{ $json.preview_mode === false && $json.approved === true }}",
        value2: true
      }
    ]
  },
  options: {}
};

console.log('\n✅ Configuration corrigée:');
console.log('   Condition: preview_mode === false && approved === true');
console.log('   TRUE → Generate HTML Newsletter (Send Email)');
console.log('   FALSE → Preview Display (Preview Mode)');

// Alternative: Si le boolean ne fonctionne pas, utiliser string
// On peut aussi utiliser une condition string plus simple
const alternativeConfig = {
  conditions: {
    options: {
      caseSensitive: true,
      leftValue: '',
      typeValidation: 'strict'
    },
    string: [
      {
        value1: "={{ $json.preview_mode === false && $json.approved === true ? 'send' : 'preview' }}",
        operation: 'equals',
        value2: 'send'
      }
    ]
  },
  options: {}
};

// Utiliser la configuration alternative (plus simple et plus fiable)
shouldSendEmailIf.parameters = {
  conditions: {
    string: [
      {
        value1: "={{ $json.preview_mode === false && $json.approved === true ? 'send' : 'preview' }}",
        operation: 'equals',
        value2: 'send'
      }
    ]
  },
  options: {}
};

console.log('\n✅ Configuration alternative appliquée (plus fiable):');
console.log('   Condition: (preview_mode === false && approved === true) ? "send" : "preview" === "send"');
console.log('   TRUE → Generate HTML Newsletter (Send Email)');
console.log('   FALSE → Preview Display (Preview Mode)');

// Vérifier que le type est correct
shouldSendEmailIf.type = 'n8n-nodes-base.if';
shouldSendEmailIf.typeVersion = 2;

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Node IF corrigé !');
console.log('\n💡 Dans n8n, vous devriez maintenant voir:');
console.log('   Value 1: ={{ $json.preview_mode === false && $json.approved === true ? "send" : "preview" }}');
console.log('   Operation: equals');
console.log('   Value 2: send');

