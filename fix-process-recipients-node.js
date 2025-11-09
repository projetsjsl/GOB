/**
 * Corriger le nœud "Process Recipients" pour utiliser les données disponibles dans le flux
 * au lieu d'essayer d'accéder à des nœuds non disponibles
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction du nœud "Process Recipients"...\n');

// Trouver le nœud "Process Recipients"
const processRecipientsNode = workflow.nodes.find(n => n.name === 'Process Recipients');

if (!processRecipientsNode) {
  console.error('❌ Nœud "Process Recipients" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Process Recipients" trouvé');

// Le problème : le nœud essaie d'accéder à des données depuis des nœuds non disponibles
// Solution : utiliser les données qui sont passées dans le flux depuis "Generate HTML Newsletter"
// qui contient déjà prompt_type et preview_mode

const correctedCode = `const items = $input.all();
const data = items[0].json;

// Les données viennent de "Fetch Email Recipients" qui reçoit depuis "Generate HTML Newsletter"
// "Generate HTML Newsletter" a déjà prompt_type et preview_mode dans ses données
// Mais "Fetch Email Recipients" ne les passe pas, donc on doit les récupérer différemment

// Méthode 1 : Essayer de récupérer depuis les données disponibles dans le flux
// Si les données ont été passées depuis "Generate HTML Newsletter"
let briefingType = data.prompt_type || data.briefing_type || 'custom';
let previewMode = data.preview_mode !== undefined ? data.preview_mode : false;

// Méthode 2 : Si les données ne sont pas disponibles, essayer de les récupérer depuis les nœuds précédents
// Mais seulement si ces nœuds sont accessibles dans le flux
try {
  // Essayer d'accéder aux nœuds précédents dans le flux
  // Note: Dans n8n, on peut accéder aux données des nœuds précédents avec $()
  // mais seulement si ces nœuds sont dans le flux d'exécution
  
  // Essayer depuis "Generate HTML Newsletter" qui est juste avant "Fetch Email Recipients"
  const generateHtmlData = $('Generate HTML Newsletter').item?.json;
  if (generateHtmlData) {
    briefingType = generateHtmlData.prompt_type || briefingType;
    previewMode = generateHtmlData.preview_mode !== undefined ? generateHtmlData.preview_mode : previewMode;
  }
  
  // Si toujours pas trouvé, essayer depuis "Parse API Response"
  if (!briefingType || previewMode === undefined) {
    const parseApiData = $('Parse API Response').item?.json;
    if (parseApiData) {
      briefingType = parseApiData.prompt_type || briefingType;
      previewMode = parseApiData.preview_mode !== undefined ? parseApiData.preview_mode : previewMode;
    }
  }
} catch (e) {
  // Si les nœuds ne sont pas accessibles, utiliser les valeurs par défaut
  console.warn('⚠️  Impossible d\\'accéder aux nœuds précédents, utilisation des valeurs par défaut');
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
} else {
  // Mode envoi : utiliser les destinataires actifs du type
  emailList = recipientsData
    .filter(r => r.active && r[normalizedType])
    .map(r => r.email);
  
  // Fallback si aucun destinataire trouvé
  if (emailList.length === 0) {
    emailList = [previewEmail];
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

processRecipientsNode.parameters.jsCode = correctedCode;
console.log('✅ Code du nœud "Process Recipients" corrigé');

// Vérifier aussi que "Generate HTML Newsletter" passe bien les données nécessaires
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (generateHtmlNode) {
  console.log('✅ Nœud "Generate HTML Newsletter" trouvé');
  
  // Vérifier que le code de "Generate HTML Newsletter" préserve prompt_type et preview_mode
  const generateHtmlCode = generateHtmlNode.parameters.jsCode || '';
  
  if (!generateHtmlCode.includes('prompt_type') || !generateHtmlCode.includes('preview_mode')) {
    console.warn('⚠️  Le nœud "Generate HTML Newsletter" ne préserve peut-être pas prompt_type et preview_mode');
    console.warn('   Vérifiez que ces valeurs sont incluses dans le retour JSON');
  } else {
    console.log('✅ "Generate HTML Newsletter" préserve prompt_type et preview_mode');
  }
}

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Modifications apportées :');
console.log('1. ✅ Le nœud "Process Recipients" utilise maintenant les données disponibles dans le flux');
console.log('2. ✅ Tentative d\'accès aux nœuds précédents avec gestion d\'erreur');
console.log('3. ✅ Valeurs par défaut si les données ne sont pas disponibles');
console.log('\n⚠️  Note : Si l\'erreur persiste, assurez-vous que "Generate HTML Newsletter"');
console.log('   passe bien prompt_type et preview_mode dans ses données de sortie');

