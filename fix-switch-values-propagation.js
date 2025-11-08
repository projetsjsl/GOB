/**
 * Script pour corriger définitivement la propagation des valeurs preview_mode et approved
 * 
 * Problème: Les valeurs ne sont pas correctement propagées jusqu'au switch
 * Solution: Ajouter un node de debug ET s'assurer que Parse API Response préserve bien les valeurs
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction définitive de la propagation des valeurs...\n');

// 1. Trouver Parse API Response
const parseNode = workflow.nodes.find(n => n.name === 'Parse API Response');
const switchNode = workflow.nodes.find(n => n.name === 'Preview or Send?');

if (!parseNode || !switchNode) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

console.log('✅ Nodes trouvés');

// 2. Remplacer complètement le code de Parse API Response pour préserver les valeurs
parseNode.parameters.jsCode = `const items = $input.all();

return items.map(item => {
  const data = item.json;
  
  // ============================================
  // PRÉSERVER preview_mode et approved depuis les nodes de configuration
  // ============================================
  // Chercher dans les nodes précédents (Schedule Config, Webhook Config, Manual Config, Chat Config)
  let previewMode = data.preview_mode;
  let approved = data.approved;
  
  // Si les valeurs ne sont pas dans data, chercher dans les nodes précédents
  if (previewMode === undefined || approved === undefined) {
    try {
      // Essayer de récupérer depuis les nodes de configuration
      const configNodes = ['Schedule Config', 'Webhook Config', 'Manual Config', 'Chat Config', 'Workflow Configuration'];
      for (const nodeName of configNodes) {
        try {
          const nodeData = $(nodeName).item?.json;
          if (nodeData) {
            if (previewMode === undefined && nodeData.preview_mode !== undefined) {
              previewMode = nodeData.preview_mode;
            }
            if (approved === undefined && nodeData.approved !== undefined) {
              approved = nodeData.approved;
            }
            if (previewMode !== undefined && approved !== undefined) break;
          }
        } catch (e) {
          // Node n'existe pas ou n'est pas accessible, continuer
        }
      }
    } catch (e) {
      console.log('⚠️  Impossible de récupérer depuis les nodes précédents:', e.message);
    }
  }
  
  // Fallback si toujours undefined
  if (previewMode === undefined) previewMode = true; // Par défaut, preview
  if (approved === undefined) approved = false; // Par défaut, non approuvé
  
  // Convertir en boolean si c'est une string
  if (previewMode === 'true' || previewMode === true) previewMode = true;
  else if (previewMode === 'false' || previewMode === false) previewMode = false;
  
  if (approved === 'true' || approved === true) approved = true;
  else if (approved === 'false' || approved === false) approved = false;
  
  // Extraire les métadonnées de la réponse API
  const newsletterContent = data.newsletter_content || data.response || data.message || data.analysis || '';
  const triggerType = data.trigger_type || 'Manuel';
  const emmaModel = data.emma_model || data.model || 'perplexity';
  const emmaTools = Array.isArray(data.emma_tools) ? data.emma_tools : (data.tools_used || []);
  const emmaExecutionTime = data.emma_execution_time || data.execution_time_ms || 0;
  const promptType = data.prompt_type || 'custom';
  const generatedAt = data.generated_at || new Date().toISOString();
  
  // Logging pour débogage
  console.log('📊 Parse API Response - Valeurs finales:');
  console.log('   preview_mode:', previewMode, '(type:', typeof previewMode, ')');
  console.log('   approved:', approved, '(type:', typeof approved, ')');
  console.log('   trigger_type:', triggerType);
  console.log('   prompt_type:', promptType);
  
  return {
    json: {
      ...data,
      // PRÉSERVER les valeurs preview_mode et approved
      preview_mode: previewMode,
      approved: approved,
      // Métadonnées extraites
      newsletter_content: newsletterContent,
      trigger_type: triggerType,
      emma_model: emmaModel,
      emma_tools: emmaTools,
      emma_execution_time: emmaExecutionTime,
      prompt_type: promptType,
      generated_at: generatedAt,
      content_length: newsletterContent.length,
      // Debug
      _debug_preview_mode: previewMode,
      _debug_approved: approved,
      _debug_preview_mode_type: typeof previewMode,
      _debug_approved_type: typeof approved
    }
  };
});`;

console.log('✅ "Parse API Response" mis à jour pour préserver preview_mode et approved');

// 3. Créer un node de debug juste avant le switch (optionnel mais utile)
const debugNodeExists = workflow.nodes.find(n => n.name === 'Debug Before Switch');
if (!debugNodeExists) {
  const debugNode = {
    parameters: {
      jsCode: `const items = $input.all();
const data = items[0].json;

console.log('🔍 DEBUG AVANT SWITCH:');
console.log('   preview_mode:', data.preview_mode, '(type:', typeof data.preview_mode, ')');
console.log('   approved:', data.approved, '(type:', typeof data.approved, ')');
console.log('   Condition Preview:', data.preview_mode === true || data.approved !== true);
console.log('   Condition Send:', data.preview_mode === false && data.approved === true);

return items;`
    },
    id: 'debug-before-switch-node',
    name: 'Debug Before Switch',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [
      switchNode.position[0] - 160,
      switchNode.position[1]
    ]
  };
  
  workflow.nodes.push(debugNode);
  
  // Insérer dans le flux: Parse API Response → Debug Before Switch → Preview or Send?
  workflow.connections['Parse API Response'] = {
    main: [
      [
        {
          node: 'Debug Before Switch',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  
  workflow.connections['Debug Before Switch'] = {
    main: [
      [
        {
          node: 'Preview or Send?',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  
  console.log('✅ Node "Debug Before Switch" ajouté');
}

// 4. Simplifier et corriger la logique du switch
switchNode.parameters.rules.values = [
  {
    conditions: {
      boolean: [
        {
          // Preview: preview_mode est true (string ou boolean) OU approved n'est pas true
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
          // Send: preview_mode est false (string ou boolean) ET approved est true
          value1: "={{ ($json.preview_mode === false || $json.preview_mode === 'false') && ($json.approved === true || $json.approved === 'true') }}",
          value2: true
        }
      ]
    },
    renameOutput: true,
    outputKey: "send"
  }
];

console.log('✅ Logique du switch simplifiée et corrigée');

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow corrigé !');
console.log('\n📋 Modifications:');
console.log('   - "Parse API Response" préserve maintenant preview_mode et approved');
console.log('   - Node "Debug Before Switch" ajouté pour voir les valeurs avant le switch');
console.log('   - Logique du switch améliorée pour gérer strings et booleans');
console.log('\n💡 Pour déboguer:');
console.log('   1. Exécutez le workflow');
console.log('   2. Vérifiez les logs dans "Parse API Response"');
console.log('   3. Vérifiez les logs dans "Debug Before Switch"');
console.log('   4. Vérifiez quelle branche est prise dans "Preview or Send?"');

