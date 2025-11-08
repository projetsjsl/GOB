/**
 * Script pour corriger le problème du switch qui va toujours vers preview
 * 
 * Problème identifié: Les valeurs preview_mode et approved sont peut-être des strings
 * au lieu de booleans, ce qui fait que la comparaison === ne fonctionne pas correctement.
 * 
 * Solution: S'assurer que les valeurs sont bien des booleans ET corriger la logique
 * du switch pour gérer les deux cas (string et boolean).
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction du switch "Preview or Send?" pour gérer les valeurs correctement...\n');

// 1. Trouver tous les nodes de configuration
const configNodes = [
  'Schedule Config',
  'Webhook Config',
  'Manual Config',
  'Chat Config',
  'Workflow Configuration'
];

configNodes.forEach(configName => {
  const configNode = workflow.nodes.find(n => n.name === configName);
  if (configNode) {
    console.log(`📋 Vérification de "${configName}"...`);
    
    // Vérifier et corriger preview_mode
    const previewModeAssignment = configNode.parameters.assignments.assignments.find(
      a => a.name === 'preview_mode'
    );
    
    if (previewModeAssignment) {
      // Convertir en boolean si c'est une string
      if (previewModeAssignment.value === 'true' || previewModeAssignment.value === true) {
        previewModeAssignment.value = true;
        previewModeAssignment.type = 'boolean';
        console.log(`   ✅ preview_mode = true (boolean)`);
      } else if (previewModeAssignment.value === 'false' || previewModeAssignment.value === false) {
        previewModeAssignment.value = false;
        previewModeAssignment.type = 'boolean';
        console.log(`   ✅ preview_mode = false (boolean)`);
      }
    }
    
    // Vérifier et corriger approved
    const approvedAssignment = configNode.parameters.assignments.assignments.find(
      a => a.name === 'approved'
    );
    
    if (approvedAssignment) {
      // Convertir en boolean si c'est une string
      if (approvedAssignment.value === 'true' || approvedAssignment.value === true) {
        approvedAssignment.value = true;
        approvedAssignment.type = 'boolean';
        console.log(`   ✅ approved = true (boolean)`);
      } else if (approvedAssignment.value === 'false' || approvedAssignment.value === false) {
        approvedAssignment.value = false;
        approvedAssignment.type = 'boolean';
        console.log(`   ✅ approved = false (boolean)`);
      }
    }
  }
});

// 2. Corriger la logique du switch pour gérer les strings ET les booleans
const switchNode = workflow.nodes.find(n => n.name === 'Preview or Send?');

if (switchNode) {
  console.log('\n🔀 Correction de la logique du switch "Preview or Send?"...');
  
  // La logique doit être plus robuste pour gérer les strings et booleans
  // Preview: preview_mode est true (string ou boolean) OU approved n'est pas true
  // Send: preview_mode est false (string ou boolean) ET approved est true
  
  switchNode.parameters.rules.values = [
    {
      conditions: {
        boolean: [
          {
            // Preview si: preview_mode === true (string ou boolean) OU approved !== true
            // Utiliser une conversion pour gérer les deux cas
            value1: "={{ ($json.preview_mode === true || $json.preview_mode === 'true') || ($json.approved !== true && $json.approved !== 'true') }}",
            value2: true
          }
        ]
      },
      renameOutput: true,
      outputKey: "preview"
    },
    {
      conditions: {
        boolean: [
          {
            // Send si: preview_mode === false (string ou boolean) ET approved === true
            // Utiliser une conversion pour gérer les deux cas
            value1: "={{ ($json.preview_mode === false || $json.preview_mode === 'false') && ($json.approved === true || $json.approved === 'true') }}",
            value2: true
          }
        ]
      },
    renameOutput: true,
      outputKey: "send"
    }
  ];
  
  console.log('✅ Logique du switch corrigée pour gérer strings et booleans');
  console.log('   Preview: preview_mode=true OU approved!=true');
  console.log('   Send: preview_mode=false ET approved=true');
}

// 3. Vérifier que "Generate HTML Newsletter" a bien la vérification de sécurité
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (generateHtmlNode) {
  const code = generateHtmlNode.parameters.jsCode;
  
  // Vérifier si la vérification de sécurité existe
  if (!code.includes('VÉRIFICATION SÉCURITÉ')) {
    console.log('\n⚠️  Vérification de sécurité manquante dans "Generate HTML Newsletter"');
    console.log('   (Le code devrait déjà avoir cette vérification)');
  } else {
    console.log('\n✅ Vérification de sécurité présente dans "Generate HTML Newsletter"');
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow corrigé !');
console.log('\n📋 Résumé:');
console.log('   - Toutes les valeurs preview_mode et approved sont maintenant des booleans');
console.log('   - Le switch gère maintenant les strings ET les booleans');
console.log('   - La logique est plus robuste pour éviter les erreurs de type');

