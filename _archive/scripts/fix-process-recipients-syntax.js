/**
 * Corriger l'erreur de syntaxe JavaScript dans le nœud "Process Recipients"
 * Problème : guillemets mal échappés dans les console.warn
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction de l\'erreur de syntaxe dans "Process Recipients"...\n');

// Trouver le nœud "Process Recipients"
const processRecipientsNode = workflow.nodes.find(n => n.name === 'Process Recipients');

if (!processRecipientsNode) {
  console.error('❌ Nœud "Process Recipients" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Process Recipients" trouvé');

// Code corrigé avec les guillemets correctement échappés
const correctedCode = `const items = $input.all();
const data = items[0].json;

// Les données viennent de "Fetch Email Recipients" qui retourne { recipients: [...], success: true }
// On doit récupérer prompt_type et preview_mode depuis les données disponibles dans le flux

// Méthode 1 : Utiliser les données disponibles dans le flux actuel
let briefingType = data.prompt_type || data.briefing_type || 'custom';
let previewMode = data.preview_mode !== undefined ? data.preview_mode : false;

// Méthode 2 : Essayer d'accéder aux nœuds précédents dans le flux d'exécution
// Note: Dans n8n, $() permet d'accéder aux données des nœuds précédents
// mais seulement si ces nœuds sont dans le flux d'exécution actuel

// Essayer depuis "Generate HTML Newsletter" (juste avant "Fetch Email Recipients")
try {
  const generateHtmlData = $('Generate HTML Newsletter').item?.json;
  if (generateHtmlData) {
    briefingType = generateHtmlData.prompt_type || briefingType;
    previewMode = generateHtmlData.preview_mode !== undefined ? generateHtmlData.preview_mode : previewMode;
    console.log('✅ Données récupérées depuis Generate HTML Newsletter');
  }
} catch (e) {
  // Si "Generate HTML Newsletter" n'est pas accessible, essayer d'autres nœuds
  console.warn('⚠️  Generate HTML Newsletter non accessible, tentative d\\'autres nœuds...');
  
  try {
    // Essayer depuis "Parse API Response"
    const parseApiData = $('Parse API Response').item?.json;
    if (parseApiData) {
      briefingType = parseApiData.prompt_type || briefingType;
      previewMode = parseApiData.preview_mode !== undefined ? parseApiData.preview_mode : previewMode;
      console.log('✅ Données récupérées depuis Parse API Response');
    }
  } catch (e2) {
    console.warn('⚠️  Parse API Response non accessible, utilisation des valeurs par défaut');
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
  console.log('📧 Mode preview activé');
} else {
  // Mode envoi : utiliser les destinataires actifs du type
  emailList = recipientsData
    .filter(r => r.active && r[normalizedType])
    .map(r => r.email);
  
  console.log(\`📧 Mode envoi, type: \${normalizedType}, destinataires: \${emailList.length}\`);
  
  // Fallback si aucun destinataire trouvé
  if (emailList.length === 0) {
    emailList = [previewEmail];
    console.warn('⚠️  Aucun destinataire actif, utilisation de l\\'email de preview');
  }
}

return items.map(item => ({
  json: {
    ...item.json,
    recipients: emailList,
    recipient_count: emailList.length,
    briefing_type: normalizedType,
    preview_mode: previewMode,
    prompt_type: briefingType
  }
}));`;

processRecipientsNode.parameters.jsCode = correctedCode;
console.log('✅ Code corrigé (guillemets échappés correctement)');

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Corrections apportées :');
console.log('1. ✅ Suppression des guillemets doubles dans les console.warn');
console.log('2. ✅ Utilisation de guillemets simples ou échappement correct');
console.log('3. ✅ Code syntaxiquement correct pour n8n');

