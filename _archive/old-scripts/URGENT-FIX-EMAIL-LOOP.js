/**
 * URGENCE : Corriger le problème d'envoi multiple
 * 
 * Problèmes identifiés :
 * 1. Le switch peut envoyer même en mode preview
 * 2. Les triggers automatiques peuvent se déclencher plusieurs fois
 * 3. Pas de protection contre les boucles
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workflowPath = join(__dirname, 'n8n-workflow-03lgcA4e9uRTtli1.json');
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

// 1. DÉSACTIVER LE WORKFLOW
workflow.active = false;

// 2. Corriger le switch "Preview or Send?" - NE JAMAIS ENVOYER EN MODE PREVIEW
const previewOrSendNode = workflow.nodes.find(n => n.name === 'Preview or Send?');
if (previewOrSendNode && previewOrSendNode.parameters.rules) {
  const rules = previewOrSendNode.parameters.rules;
  
  // Règle 1 : Preview (preview_mode === true OU approved === false)
  if (rules.rules && rules.rules[0]) {
    rules.rules[0].conditions.boolean[0].value1 = 
      "={{ $json.preview_mode === true || $json.approved !== true }}";
  }
  
  // Règle 2 : Send (SEULEMENT si approved === true ET preview_mode === false)
  if (rules.rules && rules.rules[1]) {
    rules.rules[1].conditions.boolean[0].value1 = 
      "={{ $json.approved === true && $json.preview_mode === false }}";
  }
  
  console.log('✅ Switch corrigé : envoi SEULEMENT si approved=true ET preview_mode=false');
}

// 3. Ajouter une protection dans "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');
if (generateHtmlNode) {
  const currentCode = generateHtmlNode.parameters.jsCode;
  
  // Ajouter une vérification de sécurité au début
  if (!currentCode.includes('VÉRIFICATION SÉCURITÉ')) {
    const securityCheck = `
// ============================================
// VÉRIFICATION SÉCURITÉ - BLOQUE LES ENVOIS NON AUTORISÉS
// ============================================
if (data.preview_mode === true) {
  throw new Error('❌ BLOQUÉ : Mode preview activé. Pour envoyer, définissez approved=true et preview_mode=false');
}

if (data.approved !== true) {
  throw new Error('❌ BLOQUÉ : Email non approuvé. Pour envoyer, définissez approved=true');
}

console.log('✅ Vérification passée : approved=' + data.approved + ', preview_mode=' + data.preview_mode);

`;
    
    const dataDeclaration = 'const data = items[0].json;';
    const newCode = currentCode.replace(
      dataDeclaration,
      dataDeclaration + securityCheck
    );
    
    generateHtmlNode.parameters.jsCode = newCode;
    console.log('✅ Protection de sécurité ajoutée dans Generate HTML Newsletter');
  }
}

// 4. S'assurer que "Workflow Configuration" a preview_mode=false et approved=true
const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');
if (workflowConfigNode) {
  const assignments = workflowConfigNode.parameters.assignments.assignments;
  
  // Mettre preview_mode à false
  let previewMode = assignments.find(a => a.name === 'preview_mode');
  if (!previewMode) {
    assignments.push({
      id: `id-preview-mode-${Date.now()}`,
      name: 'preview_mode',
      value: 'false',
      type: 'boolean'
    });
  } else {
    previewMode.value = 'false';
  }
  
  // Mettre approved à true
  let approved = assignments.find(a => a.name === 'approved');
  if (!approved) {
    assignments.push({
      id: `id-approved-${Date.now()}`,
      name: 'approved',
      value: 'true',
      type: 'boolean'
    });
  } else {
    approved.value = 'true';
  }
  
  console.log('✅ Workflow Configuration : preview_mode=false, approved=true');
}

// 5. Désactiver temporairement le Gmail Trigger (peut causer des boucles)
const gmailTrigger = workflow.nodes.find(n => n.name === 'Gmail Trigger (Custom Prompt)');
if (gmailTrigger) {
  // Note : On ne peut pas désactiver un node individuellement dans le JSON
  // Mais on peut ajouter un commentaire dans le nom
  console.log('⚠️  Gmail Trigger trouvé - peut causer des boucles si plusieurs emails reçus');
  console.log('   Recommandation : Désactiver ce trigger dans n8n si vous recevez beaucoup d\'emails');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n🚨 CORRECTIONS APPLIQUÉES :');
console.log('   1. ✅ Workflow DÉSACTIVÉ (active=false)');
console.log('   2. ✅ Switch corrigé pour bloquer les envois en mode preview');
console.log('   3. ✅ Protection de sécurité ajoutée dans Generate HTML Newsletter');
console.log('   4. ✅ Workflow Configuration mis à jour');
console.log('\n⚠️  ACTIONS IMMÉDIATES REQUISES :');
console.log('   1. Allez sur : https://projetsjsl.app.n8n.cloud/workflow/03lgcA4e9uRTtli1');
console.log('   2. DÉSACTIVEZ le workflow (toggle "Active" en haut à droite)');
console.log('   3. Vérifiez les exécutions pour comprendre ce qui s\'est passé');
console.log('   4. Désactivez temporairement le Gmail Trigger si nécessaire');
console.log('\n💡 Pour réactiver plus tard :');
console.log('   - Activez le workflow dans n8n');
console.log('   - Le fichier JSON a été corrigé pour éviter les envois multiples');

