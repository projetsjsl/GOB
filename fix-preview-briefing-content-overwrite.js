/**
 * Script pour corriger le node "Preview Briefing Content" qui écrase preview_mode et approved
 * 
 * Problème identifié: Le node "Preview Briefing Content" définit preview_mode: true
 * ce qui écrase les valeurs des nodes de configuration (Schedule Config, etc.)
 * 
 * Solution: Préserver les valeurs preview_mode et approved depuis les nodes précédents
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction du node "Preview Briefing Content" pour préserver preview_mode et approved...\n');

// Trouver le node "Preview Briefing Content"
const previewNode = workflow.nodes.find(n => n.name === 'Preview Briefing Content');

if (!previewNode) {
  console.error('❌ Node "Preview Briefing Content" non trouvé');
  process.exit(1);
}

console.log('✅ Node "Preview Briefing Content" trouvé');

// Remplacer le code pour préserver preview_mode et approved
previewNode.parameters.jsCode = `const items = $input.all();
const data = items[0].json;

// ============================================
// PRÉSERVER preview_mode et approved depuis les nodes de configuration
// ============================================
// Ces valeurs viennent des nodes: Schedule Config, Webhook Config, Manual Config, Chat Config
const previewMode = data.preview_mode !== undefined ? data.preview_mode : true; // Fallback à true si non défini
const approved = data.approved !== undefined ? data.approved : false; // Fallback à false si non défini

console.log('📊 Preview Briefing Content - Valeurs préservées:');
console.log('   preview_mode:', previewMode, '(type:', typeof previewMode, ')');
console.log('   approved:', approved, '(type:', typeof approved, ')');

// Extraire le contenu de la réponse
const content = data.newsletter_content || data.response || data.message || 'Aucun contenu reçu';
const metadata = {
  trigger_type: data.trigger_type || 'Manuel',
  emma_model: data.emma_model || 'perplexity',
  emma_tools: data.emma_tools || [],
  emma_execution_time: data.emma_execution_time || 0,
  prompt_type: data.prompt_type || 'custom',
  generated_at: data.generated_at || new Date().toISOString()
};

// Créer un résumé pour la prévisualisation
// IMPORTANT: Préserver preview_mode et approved depuis les nodes de configuration
const preview = {
  success: true,
  preview_mode: previewMode, // PRÉSERVER depuis les nodes de configuration
  approved: approved, // PRÉSERVER depuis les nodes de configuration
  content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
  content_length: content.length,
  metadata: metadata,
  full_content: content,
  ready_for_approval: approved === true && previewMode === false
};

return items.map(item => ({
  json: {
    ...item.json,
    ...preview
  }
}));`;

console.log('✅ Code corrigé pour préserver preview_mode et approved');
console.log('   - preview_mode est maintenant préservé depuis les nodes de configuration');
console.log('   - approved est maintenant préservé depuis les nodes de configuration');
console.log('   - Fallback à preview_mode=true et approved=false si non défini');

// Vérifier aussi "Parse API Response" pour s'assurer qu'il préserve les valeurs
const parseNode = workflow.nodes.find(n => n.name === 'Parse API Response');

if (parseNode) {
  console.log('\n📋 Vérification de "Parse API Response"...');
  const parseCode = parseNode.parameters.jsCode || '';
  
  // Vérifier si le code préserve preview_mode et approved
  if (!parseCode.includes('preview_mode') || !parseCode.includes('approved')) {
    console.log('⚠️  "Parse API Response" ne préserve pas explicitement preview_mode et approved');
    console.log('   Ajout de la préservation...');
    
    // Ajouter la préservation à la fin du code
    const newParseCode = parseCode + `

// ============================================
// PRÉSERVER preview_mode et approved
// ============================================
const preservedPreviewMode = item.json.preview_mode !== undefined ? item.json.preview_mode : true;
const preservedApproved = item.json.approved !== undefined ? item.json.approved : false;

return items.map(item => ({
  json: {
    ...item.json,
    preview_mode: preservedPreviewMode,
    approved: preservedApproved
  }
}));`;
    
    parseNode.parameters.jsCode = newParseCode;
    console.log('✅ "Parse API Response" mis à jour pour préserver les valeurs');
  } else {
    console.log('✅ "Parse API Response" préserve déjà les valeurs');
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow corrigé !');
console.log('\n📋 Résumé:');
console.log('   - "Preview Briefing Content" préserve maintenant preview_mode et approved');
console.log('   - Les valeurs des nodes de configuration ne sont plus écrasées');
console.log('   - Le switch "Preview or Send?" devrait maintenant fonctionner correctement');

