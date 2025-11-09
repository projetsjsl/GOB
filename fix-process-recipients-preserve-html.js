/**
 * Corriger "Process Recipients" pour préserver html_content et subject
 * nécessaires pour "Send Email via Resend"
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction de "Process Recipients" pour préserver html_content et subject...\n');

// Trouver le nœud "Process Recipients"
const processRecipientsNode = workflow.nodes.find(n => n.name === 'Process Recipients');

if (!processRecipientsNode) {
  console.error('❌ Nœud "Process Recipients" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Process Recipients" trouvé');

// Code corrigé qui préserve html_content et subject depuis "Generate HTML Newsletter"
const correctedCode = `const items = $input.all();
const data = items[0].json;

// Les données viennent de "Fetch Email Recipients" qui retourne { recipients: [...], success: true }
// Mais on a besoin de html_content et subject depuis "Generate HTML Newsletter"
// ainsi que prompt_type et preview_mode

// Méthode 1 : Utiliser les données disponibles dans le flux actuel
let briefingType = data.prompt_type || data.briefing_type || 'custom';
let previewMode = data.preview_mode !== undefined ? data.preview_mode : false;
let htmlContent = data.html_content || '';
let subject = data.subject || '';

// Méthode 2 : Essayer d'accéder aux nœuds précédents pour récupérer html_content et subject
try {
  const generateHtmlData = $('Generate HTML Newsletter').item?.json;
  if (generateHtmlData) {
    // Préserver html_content et subject depuis "Generate HTML Newsletter"
    htmlContent = generateHtmlData.html_content || htmlContent;
    subject = generateHtmlData.subject || subject;
    
    // Préserver aussi prompt_type et preview_mode
    briefingType = generateHtmlData.prompt_type || briefingType;
    previewMode = generateHtmlData.preview_mode !== undefined ? generateHtmlData.preview_mode : previewMode;
    
    console.log('✅ Données récupérées depuis Generate HTML Newsletter');
  }
} catch (e) {
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

// Vérifier que html_content et subject sont présents
if (!htmlContent) {
  console.warn('⚠️  html_content manquant, le nœud Send Email via Resend pourrait échouer');
}
if (!subject) {
  console.warn('⚠️  subject manquant, utilisation d\\'un sujet par défaut');
  subject = subject || \`Newsletter Emma - Mise à jour du \${normalizedType}\`;
}

return items.map(item => ({
  json: {
    ...item.json,
    // Données de destinataires
    recipients: emailList,
    recipient_count: emailList.length,
    briefing_type: normalizedType,
    preview_mode: previewMode,
    prompt_type: briefingType,
    // IMPORTANT : Préserver html_content et subject pour "Send Email via Resend"
    html_content: htmlContent,
    subject: subject
  }
}));`;

processRecipientsNode.parameters.jsCode = correctedCode;
console.log('✅ Code de "Process Recipients" corrigé pour préserver html_content et subject');

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Corrections apportées :');
console.log('1. ✅ "Process Recipients" récupère maintenant html_content depuis "Generate HTML Newsletter"');
console.log('2. ✅ "Process Recipients" récupère maintenant subject depuis "Generate HTML Newsletter"');
console.log('3. ✅ Ces champs sont préservés dans la sortie pour "Send Email via Resend"');
console.log('4. ✅ Gestion d\'erreur si les données ne sont pas disponibles');

