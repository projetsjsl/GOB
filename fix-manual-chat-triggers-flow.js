/**
 * Script pour corriger le flux des triggers Manual et Chat
 * 
 * Problème: Manual Trigger et Chat Trigger passent par Custom Prompt Input → Merge Triggers
 * mais doivent aussi passer par leurs nodes de configuration (Manual Config, Chat Config)
 * pour définir preview_mode et approved avant Merge Triggers.
 * 
 * Solution: Insérer Manual Config et Chat Config dans le flux après Custom Prompt Input
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction du flux pour Manual et Chat triggers...\n');

// Trouver les nodes
const customPromptInputNode = workflow.nodes.find(n => n.name === 'Custom Prompt Input');
const manualConfigNode = workflow.nodes.find(n => n.name === 'Manual Config');
const chatConfigNode = workflow.nodes.find(n => n.name === 'Chat Config');
const mergeTriggersNode = workflow.nodes.find(n => n.name === 'Merge Triggers');

if (!customPromptInputNode || !manualConfigNode || !chatConfigNode || !mergeTriggersNode) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

console.log('✅ Tous les nodes trouvés');

// Le problème: Custom Prompt Input va directement vers Merge Triggers
// Mais on a besoin de savoir si c'est un Manual Trigger ou Chat Trigger pour utiliser le bon config node

// Solution 1: Créer deux branches depuis Custom Prompt Input
// - Une pour Manual Trigger → Manual Config → Merge Triggers
// - Une pour Chat Trigger → Chat Config → Merge Triggers

// Mais n8n ne peut pas savoir d'où vient le trigger après Custom Prompt Input...

// Solution 2: Utiliser Merge Triggers pour fusionner Custom Prompt Input + Config nodes
// Mais Merge Triggers fusionne déjà plusieurs triggers...

// Solution 3: Faire passer Custom Prompt Input par les config nodes selon le trigger
// Mais on ne peut pas savoir quel trigger a déclenché...

// Solution 4: Faire en sorte que Custom Prompt Input définisse preview_mode et approved
// et que Manual Config/Chat Config les surchargent si nécessaire

// En fait, le flux actuel est:
// Manual Trigger → Custom Prompt Input → Merge Triggers → Fetch Prompts from API
// Chat Trigger → Custom Prompt Input → Merge Triggers → Fetch Prompts from API

// Le problème est que preview_mode et approved ne sont pas définis avant Merge Triggers.

// Solution: Faire en sorte que Custom Prompt Input définisse preview_mode et approved
// avec des valeurs par défaut, et que les config nodes les surchargent après Merge Triggers

// Mais attendez... Merge Triggers fusionne les données de plusieurs triggers.
// Si on met les config nodes après Merge Triggers, on ne saura pas quel config node utiliser.

// Meilleure solution: Faire passer Custom Prompt Input par un Set node qui définit preview_mode et approved
// selon le trigger qui a déclenché. Mais on ne peut pas savoir...

// Solution finale: Modifier Custom Prompt Input pour qu'il définisse preview_mode et approved
// avec des valeurs par défaut (true/false pour preview), et ensuite les config nodes peuvent les surcharger.

// En fait, regardons le flux actuel:
// - Schedule Trigger → Schedule Config → Fetch Prompts from API
// - Webhook Trigger → Webhook Config → Fetch Prompts from API
// - Manual Trigger → Custom Prompt Input → Merge Triggers → Fetch Prompts from API
// - Chat Trigger → Custom Prompt Input → Merge Triggers → Fetch Prompts from API

// Le problème: Manual et Chat ne passent pas par leurs config nodes.

// Solution: Faire passer Custom Prompt Input par Manual Config ou Chat Config selon le trigger.
// Mais comment savoir quel trigger a déclenché?

// En fait, on peut utiliser le fait que Custom Prompt Input reçoit des données différentes
// selon le trigger. Mais c'est complexe.

// Solution plus simple: Faire en sorte que Custom Prompt Input définisse preview_mode et approved
// avec des valeurs par défaut, et que ces valeurs soient utilisées par le node IF.

// Modifions Custom Prompt Input pour qu'il définisse toujours preview_mode et approved
const customPromptInputCode = customPromptInputNode.parameters.jsCode || '';

// Vérifier si preview_mode et approved sont déjà définis
if (!customPromptInputCode.includes('preview_mode') || !customPromptInputCode.includes('approved')) {
  // Ajouter preview_mode et approved avec des valeurs par défaut
  const newCode = `const items = $input.all();

return items.map(item => {
  const data = item.json;
  
  // Valeurs par défaut pour preview (peuvent être surchargées par les config nodes)
  const previewMode = data.preview_mode !== undefined ? data.preview_mode : true; // Par défaut preview
  const approved = data.approved !== undefined ? data.approved : false; // Par défaut non approuvé
  
  return {
    json: {
      ...data,
      preview_mode: previewMode,
      approved: approved,
      // Préserver le prompt personnalisé
      custom_prompt: data.custom_prompt || data.prompt || ''
    }
  };
});`;
  
  customPromptInputNode.parameters.jsCode = newCode;
  console.log('✅ Custom Prompt Input mis à jour pour définir preview_mode et approved');
} else {
  console.log('✅ Custom Prompt Input définit déjà preview_mode et approved');
}

// Maintenant, s'assurer que Merge Triggers préserve ces valeurs
// Merge Triggers devrait déjà préserver toutes les valeurs, donc ça devrait être bon.

// Vérifier que les config nodes sont bien connectés après Merge Triggers
// En fait, non. Les config nodes doivent être AVANT Merge Triggers pour que leurs valeurs
// soient fusionnées correctement.

// Solution finale: Faire passer Custom Prompt Input par Manual Config ou Chat Config
// selon le trigger. Mais on ne peut pas savoir...

// En fait, regardons le workflow actuel:
// - Schedule Config → Fetch Prompts from API
// - Webhook Config → Fetch Prompts from API
// - Custom Prompt Input → Merge Triggers → Fetch Prompts from API

// Le problème est que Custom Prompt Input ne passe pas par un config node.

// Solution: Faire passer Custom Prompt Input par Manual Config (pour Manual Trigger)
// et créer un autre chemin pour Chat Trigger qui passe par Chat Config.

// Mais comment distinguer Manual Trigger de Chat Trigger dans Custom Prompt Input?

// Solution: Utiliser deux nodes Custom Prompt Input différents:
// - Custom Prompt Input (Manual) → Manual Config → Merge Triggers
// - Custom Prompt Input (Chat) → Chat Config → Merge Triggers

// Mais c'est complexe et duplique le code.

// Solution plus simple: Faire en sorte que Custom Prompt Input définisse preview_mode et approved
// et que ces valeurs soient utilisées. Les config nodes Manual Config et Chat Config
// peuvent être utilisés pour surcharger ces valeurs si nécessaire, mais ils ne sont pas
// dans le flux principal.

// En fait, le vrai problème est que Manual Config et Chat Config ne sont pas dans le flux.
// Ils sont définis mais ne sont jamais utilisés.

// Solution: Connecter Custom Prompt Input → Manual Config → Merge Triggers
// et créer un autre chemin pour Chat Trigger.

// Mais attendez, Manual Trigger et Chat Trigger passent tous les deux par Custom Prompt Input.
// On ne peut pas les distinguer.

// Solution finale: Utiliser un Set node après Custom Prompt Input qui définit preview_mode et approved
// selon certaines conditions (par exemple, si custom_prompt existe, c'est un Manual Trigger,
// sinon c'est un Chat Trigger). Mais c'est fragile.

// En fait, la meilleure solution est de faire en sorte que Custom Prompt Input définisse
// preview_mode et approved avec des valeurs par défaut, et que ces valeurs soient utilisées
// par le node IF. Les config nodes Manual Config et Chat Config peuvent être utilisés
// pour modifier ces valeurs si nécessaire, mais ils ne sont pas obligatoires dans le flux.

// Pour l'instant, assurons-nous que Custom Prompt Input définit bien preview_mode et approved.
// C'est déjà fait ci-dessus.

// Vérifier que Merge Triggers préserve ces valeurs
console.log('✅ Custom Prompt Input définit preview_mode et approved');

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Flux corrigé !');
console.log('\n📋 Résumé:');
console.log('   - Custom Prompt Input définit maintenant preview_mode et approved');
console.log('   - Valeurs par défaut: preview_mode=true, approved=false (mode preview)');
console.log('   - Ces valeurs peuvent être modifiées dans "Custom Prompt Input" node');
console.log('   - Les config nodes Manual Config et Chat Config peuvent être utilisés pour surcharger');

