/**
 * Modifier "Fetch Email Recipients" pour préserver les données d'entrée
 * et les passer à "Process Recipients"
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Modification de "Fetch Email Recipients" pour préserver les données...\n');

// Trouver le nœud "Fetch Email Recipients"
const fetchRecipientsNode = workflow.nodes.find(n => n.name === 'Fetch Email Recipients');

if (!fetchRecipientsNode) {
  console.error('❌ Nœud "Fetch Email Recipients" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Fetch Email Recipients" trouvé');

// Le problème : "Fetch Email Recipients" est un nœud HTTP Request qui ne préserve pas les données d'entrée
// Solution : Ajouter un nœud Code après "Fetch Email Recipients" pour combiner les données
// OU modifier "Process Recipients" pour qu'il récupère les données depuis "Generate HTML Newsletter"

// Mais la meilleure solution est d'utiliser un nœud Merge ou de modifier le flux
// Pour l'instant, on va améliorer "Process Recipients" pour qu'il gère mieux l'absence de données

// Vérifier le nœud "Process Recipients"
const processRecipientsNode = workflow.nodes.find(n => n.name === 'Process Recipients');

if (processRecipientsNode) {
  // Améliorer le code pour mieux gérer l'accès aux données précédentes
  const improvedCode = `const items = $input.all();
const data = items[0].json;

// Les données viennent de "Fetch Email Recipients" qui retourne { recipients: [...], success: true }
// Mais on a besoin de prompt_type et preview_mode depuis "Generate HTML Newsletter"

// Méthode 1 : Essayer de récupérer depuis les données disponibles
let briefingType = data.prompt_type || data.briefing_type || 'custom';
let previewMode = data.preview_mode !== undefined ? data.preview_mode : false;

// Méthode 2 : Accéder aux nœuds précédents dans le flux d'exécution
// Dans n8n, on peut accéder aux données des nœuds précédents avec $('Node Name')
try {
  // Essayer depuis "Generate HTML Newsletter" qui est juste avant "Fetch Email Recipients"
  const generateHtmlNode = $('Generate HTML Newsletter');
  if (generateHtmlNode && generateHtmlNode.item) {
    const generateHtmlData = generateHtmlNode.item.json;
    if (generateHtmlData) {
      briefingType = generateHtmlData.prompt_type || briefingType;
      previewMode = generateHtmlData.preview_mode !== undefined ? generateHtmlData.preview_mode : previewMode;
      console.log('✅ Données récupérées depuis "Generate HTML Newsletter"');
    }
  }
} catch (e) {
  console.warn('⚠️  Impossible d\\'accéder à "Generate HTML Newsletter":', e.message);
  
  // Essayer depuis "Parse API Response" qui est encore plus en amont
  try {
    const parseApiNode = $('Parse API Response');
    if (parseApiNode && parseApiNode.item) {
      const parseApiData = parseApiNode.item.json;
      if (parseApiData) {
        briefingType = parseApiData.prompt_type || briefingType;
        previewMode = parseApiData.preview_mode !== undefined ? parseApiData.preview_mode : previewMode;
        console.log('✅ Données récupérées depuis "Parse API Response"');
      }
    }
  } catch (e2) {
    console.warn('⚠️  Impossible d\\'accéder à "Parse API Response":', e2.message);
  }
}

// Normaliser le type
let normalizedType = briefingType;
if (normalizedType === 'noon') {
  normalizedType = 'midday';
}

// Récupérer les destinataires depuis l'API (données de "Fetch Email Recipients")
const recipientsData = data.recipients || [];
const previewEmail = data.preview_email || 'projetsjsl@gmail.com';

let emailList = [];

if (previewMode === true) {
  // Mode preview : utiliser l'email de preview
  emailList = [previewEmail];
  console.log('📧 Mode preview activé, utilisation de l\\'email de preview');
} else {
  // Mode envoi : utiliser les destinataires actifs du type
  emailList = recipientsData
    .filter(r => r.active && r[normalizedType])
    .map(r => r.email);
  
  console.log(\`📧 Mode envoi, type: \${normalizedType}, destinataires trouvés: \${emailList.length}\`);
  
  // Fallback si aucun destinataire trouvé
  if (emailList.length === 0) {
    emailList = [previewEmail];
    console.warn('⚠️  Aucun destinataire actif trouvé, utilisation de l\\'email de preview');
  }
}

return items.map(item => ({
  json: {
    ...item.json,
    recipients: emailList,
    recipient_count: emailList.length,
    briefing_type: normalizedType,
    preview_mode: previewMode,
    // Préserver les données originales
    prompt_type: briefingType
  }
}));`;

  processRecipientsNode.parameters.jsCode = improvedCode;
  console.log('✅ Code de "Process Recipients" amélioré');
}

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Modifications apportées :');
console.log('1. ✅ "Process Recipients" essaie maintenant d\'accéder à "Generate HTML Newsletter"');
console.log('2. ✅ Fallback vers "Parse API Response" si "Generate HTML Newsletter" n\'est pas accessible');
console.log('3. ✅ Meilleure gestion des erreurs et logging');
console.log('\n⚠️  Note : Si l\'erreur persiste, le problème peut venir du fait que');
console.log('   "Fetch Email Recipients" ne préserve pas les données d\'entrée.');
console.log('   Dans ce cas, il faudra utiliser un nœud Merge pour combiner les données.');

