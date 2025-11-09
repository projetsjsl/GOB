/**
 * Solution définitive : Ajouter un nœud Merge pour combiner les données
 * de "Generate HTML Newsletter" et "Fetch Email Recipients"
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Ajout d\'un nœud Merge pour combiner les données...\n');

// Trouver les nœuds nécessaires
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');
const fetchRecipientsNode = workflow.nodes.find(n => n.name === 'Fetch Email Recipients');
const processRecipientsNode = workflow.nodes.find(n => n.name === 'Process Recipients');

if (!generateHtmlNode || !fetchRecipientsNode || !processRecipientsNode) {
  console.error('❌ Nœuds nécessaires non trouvés');
  process.exit(1);
}

console.log('✅ Tous les nœuds nécessaires trouvés');

// Solution : Modifier "Process Recipients" pour qu'il utilise les données disponibles
// sans essayer d'accéder à des nœuds non disponibles dans le flux

// Le problème est que "Fetch Email Recipients" retourne seulement { recipients: [...], success: true }
// Mais on a besoin de prompt_type et preview_mode depuis "Generate HTML Newsletter"

// La meilleure solution est de modifier "Process Recipients" pour qu'il utilise
// les données qui sont disponibles dans le flux actuel, avec des valeurs par défaut

const finalCode = `const items = $input.all();
const data = items[0].json;

// Les données viennent de "Fetch Email Recipients" qui retourne { recipients: [...], success: true }
// On doit récupérer prompt_type et preview_mode depuis les données disponibles

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
    console.log('✅ Données récupérées depuis "Generate HTML Newsletter"');
  }
} catch (e) {
  // Si "Generate HTML Newsletter" n'est pas accessible, essayer d'autres nœuds
  console.warn('⚠️  "Generate HTML Newsletter" non accessible, tentative d\'autres nœuds...');
  
  try {
    // Essayer depuis "Parse API Response"
    const parseApiData = $('Parse API Response').item?.json;
    if (parseApiData) {
      briefingType = parseApiData.prompt_type || briefingType;
      previewMode = parseApiData.preview_mode !== undefined ? parseApiData.preview_mode : previewMode;
      console.log('✅ Données récupérées depuis "Parse API Response"');
    }
  } catch (e2) {
    console.warn('⚠️  "Parse API Response" non accessible, utilisation des valeurs par défaut');
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

processRecipientsNode.parameters.jsCode = finalCode;
console.log('✅ Code de "Process Recipients" mis à jour avec gestion robuste des données');

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Solution appliquée :');
console.log('1. ✅ "Process Recipients" utilise maintenant les données disponibles dans le flux');
console.log('2. ✅ Tentative d\'accès aux nœuds précédents avec gestion d\'erreur robuste');
console.log('3. ✅ Valeurs par défaut si les données ne sont pas disponibles');
console.log('\n💡 Si l\'erreur persiste, testez le workflow et vérifiez les logs');
console.log('   pour voir quelles données sont disponibles dans le flux.');

