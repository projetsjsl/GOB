/**
 * Script pour supprimer la référence orpheline à "🔍 Debug Before Switch"
 * qui n'existe plus comme node mais qui a encore des connexions
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Suppression des références orphelines à "🔍 Debug Before Switch"...\n');

// Vérifier si le node existe
const debugNodeWithEmoji = workflow.nodes.find(n => n.name === '🔍 Debug Before Switch');
const debugNodeWithoutEmoji = workflow.nodes.find(n => n.name === 'Debug Before Switch');

console.log(`📋 Nodes Debug trouvés:`);
console.log(`   - "🔍 Debug Before Switch": ${debugNodeWithEmoji ? '✅ Existe' : '❌ N\'existe pas'}`);
console.log(`   - "Debug Before Switch": ${debugNodeWithoutEmoji ? '✅ Existe' : '❌ N\'existe pas'}`);

// Si "🔍 Debug Before Switch" n'existe pas mais qu'il y a des connexions vers lui, les corriger
if (!debugNodeWithEmoji && debugNodeWithoutEmoji) {
  console.log('\n🔧 Correction des connexions orphelines...');
  
  // Trouver "⚙️ AI Model Selector" qui devrait se connecter au Debug
  const aiModelSelector = workflow.nodes.find(n => n.name === '⚙️ AI Model Selector (Change AI_MODEL)');
  const chooseAiModelIf = workflow.nodes.find(n => n.name === 'Choose AI Model (IF)');
  
  if (aiModelSelector && chooseAiModelIf) {
    // "⚙️ AI Model Selector" doit se connecter directement à "Choose AI Model (IF)"
    // ou passer par "Debug Before Switch" (sans emoji) si on veut garder le debug
    
    // Option 1: Connecter directement (plus simple)
    workflow.connections['⚙️ AI Model Selector (Change AI_MODEL)'] = {
      main: [
        [
          {
            node: 'Choose AI Model (IF)',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ ⚙️ AI Model Selector → Choose AI Model (IF) (connexion directe)');
    
    // Supprimer la connexion orpheline vers "🔍 Debug Before Switch"
    if (workflow.connections['🔍 Debug Before Switch']) {
      delete workflow.connections['🔍 Debug Before Switch'];
      console.log('✅ Connexions orphelines supprimées');
    }
  }
}

// Supprimer toutes les références à "🔍 Debug Before Switch" dans les connexions
Object.keys(workflow.connections || {}).forEach(sourceNode => {
  workflow.connections[sourceNode].main?.forEach((outputs, outputIndex) => {
    outputs?.forEach((conn, connIndex) => {
      if (conn.node === '🔍 Debug Before Switch') {
        console.log(`⚠️  Connexion orpheline trouvée: ${sourceNode} → 🔍 Debug Before Switch`);
        
        // Si c'est "⚙️ AI Model Selector", connecter directement au IF
        if (sourceNode === '⚙️ AI Model Selector (Change AI_MODEL)') {
          workflow.connections[sourceNode].main[outputIndex][connIndex].node = 'Choose AI Model (IF)';
          console.log(`   ✅ Corrigé: ${sourceNode} → Choose AI Model (IF)`);
        } else {
          // Sinon, supprimer la connexion
          workflow.connections[sourceNode].main[outputIndex].splice(connIndex, 1);
          console.log(`   ✅ Connexion supprimée`);
        }
      }
    });
  });
});

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Toutes les références orphelines supprimées !');

