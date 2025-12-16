/**
 * Script pour remplacer le switch "Preview or Send?" par un node IF plus simple
 * 
 * Le switch peut avoir des problèmes avec la logique complexe.
 * Un node IF simple avec une condition claire peut être plus fiable.
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Remplacement du switch par un node IF...\n');

// Trouver le switch
const switchNode = workflow.nodes.find(n => n.name === 'Preview or Send?');
const debugNode = workflow.nodes.find(n => n.name === 'Debug Before Switch');

if (!switchNode) {
  console.error('❌ Node "Preview or Send?" non trouvé');
  process.exit(1);
}

// Remplacer le switch par un node IF
switchNode.name = 'Should Send Email?';
switchNode.type = 'n8n-nodes-base.if';
switchNode.typeVersion = 2;

// Configuration du node IF
switchNode.parameters = {
  conditions: {
    boolean: [
      {
        // Condition: preview_mode === false ET approved === true
        value1: "={{ ($json.preview_mode === false || $json.preview_mode === 'false') && ($json.approved === true || $json.approved === 'true') }}",
        value2: true
      }
    ]
  },
  options: {}
};

console.log('✅ Switch remplacé par un node IF');
console.log('   Condition: preview_mode === false && approved === true');
console.log('   TRUE → Send (Generate HTML Newsletter)');
console.log('   FALSE → Preview (Preview Display)');

// Mettre à jour les connexions
// Le node IF a deux sorties: true (main[0]) et false (main[1])
const currentConnections = workflow.connections['Preview or Send?'];

if (currentConnections && currentConnections.main) {
  // main[0] = preview (FALSE dans IF)
  // main[1] = send (TRUE dans IF)
  
  // Inverser car dans IF: true = send, false = preview
  workflow.connections['Should Send Email?'] = {
    main: [
      // TRUE (index 0) → Send
      currentConnections.main[1] || [
        {
          node: 'Generate HTML Newsletter',
          type: 'main',
          index: 0
        }
      ],
      // FALSE (index 1) → Preview
      currentConnections.main[0] || [
        {
          node: 'Preview Display',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  
  // Supprimer l'ancienne connexion
  delete workflow.connections['Preview or Send?'];
  
  console.log('✅ Connexions mises à jour');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow mis à jour !');
console.log('\n📋 Le node "Preview or Send?" a été remplacé par "Should Send Email?" (IF)');
console.log('   - TRUE → Send (Generate HTML Newsletter)');
console.log('   - FALSE → Preview (Preview Display)');
console.log('\n💡 Cette approche est plus simple et plus fiable qu\'un switch avec plusieurs règles');

