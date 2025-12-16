/**
 * Récupérer le workflow actuel depuis n8n et corriger uniquement le nœud "Process Recipients"
 * en préservant toutes les autres modifications
 */

import { readFileSync, writeFileSync } from 'fs';

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';
const WORKFLOW_FILE = 'n8n-workflow-03lgcA4e9uRTtli1.json';

async function fetchAndFixWorkflow() {
  try {
    console.log('📥 Récupération du workflow actuel depuis n8n...\n');
    console.log(`   Workflow ID: ${WORKFLOW_ID}`);
    console.log(`   URL: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);

    // 1. Récupérer le workflow actuel depuis n8n
    const response = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur récupération workflow: ${response.status}`);
      console.error(errorText);
      throw new Error(`Failed to fetch workflow: ${response.status}`);
    }

    const workflow = await response.json();
    console.log(`✅ Workflow récupéré: ${workflow.name}`);
    console.log(`   Nodes: ${workflow.nodes.length}`);
    console.log(`   Active: ${workflow.active}\n`);

    // 2. Sauvegarder le workflow actuel
    writeFileSync(WORKFLOW_FILE, JSON.stringify(workflow, null, 2));
    console.log(`✅ Workflow sauvegardé dans ${WORKFLOW_FILE}\n`);

    // 3. Trouver et corriger uniquement le nœud "Process Recipients"
    const processRecipientsNode = workflow.nodes.find(n => n.name === 'Process Recipients');

    if (!processRecipientsNode) {
      console.warn('⚠️  Nœud "Process Recipients" non trouvé dans le workflow');
      console.log('✅ Workflow sauvegardé tel quel (aucune correction nécessaire)');
      return workflow;
    } else {
      console.log('🔧 Correction du nœud "Process Recipients"...');
      
      // Code corrigé qui utilise les données disponibles dans le flux
      // IMPORTANT : Préserve html_content et subject pour "Send Email via Resend"
      // CORRECTION: Guillemets échappés correctement pour éviter les erreurs de syntaxe
      const correctedCode = `const items = $input.all();
const data = items[0].json;

// Les données viennent de "Fetch Email Recipients" qui retourne { recipients: [...], success: true }
// On doit récupérer html_content, subject, prompt_type et preview_mode depuis "Generate HTML Newsletter"

// Méthode 1 : Utiliser les données disponibles dans le flux actuel
let briefingType = data.prompt_type || data.briefing_type || 'custom';
let previewMode = data.preview_mode !== undefined ? data.preview_mode : false;
let htmlContent = data.html_content || '';
let subject = data.subject || '';

// Méthode 2 : Essayer d'accéder aux nœuds précédents dans le flux d'exécution
// Note: Dans n8n, $() permet d'accéder aux données des nœuds précédents
// mais seulement si ces nœuds sont dans le flux d'exécution actuel

// Essayer depuis "Generate HTML Newsletter" (juste avant "Fetch Email Recipients")
try {
  const generateHtmlData = $('Generate HTML Newsletter').item?.json;
  if (generateHtmlData) {
    // IMPORTANT : Préserver html_content et subject depuis "Generate HTML Newsletter"
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

      // Remplacer uniquement le code du nœud "Process Recipients"
      processRecipientsNode.parameters.jsCode = correctedCode;
      console.log('✅ Code du nœud "Process Recipients" corrigé\n');
    }

    // 4. Sauvegarder le workflow corrigé
    writeFileSync(WORKFLOW_FILE, JSON.stringify(workflow, null, 2));
    console.log(`✅ Workflow corrigé sauvegardé dans ${WORKFLOW_FILE}\n`);

    // 5. Réimporter le workflow corrigé dans n8n
    console.log('🔄 Réimportation du workflow corrigé dans n8n...');
    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify({
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings || { executionOrder: 'v1' },
        staticData: workflow.staticData || null
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`❌ Erreur mise à jour: ${updateResponse.status}`);
      console.error(errorText);
      throw new Error(`Failed to update workflow: ${updateResponse.status}`);
    }

    const updatedWorkflow = await updateResponse.json();
    console.log('✅ Workflow mis à jour avec succès!');
    console.log(`   ID: ${updatedWorkflow.id}`);
    console.log(`   Nom: ${updatedWorkflow.name}`);
    console.log(`   Nodes: ${updatedWorkflow.nodes.length}`);
    console.log(`\n🔗 URL: ${N8N_URL}/workflow/${updatedWorkflow.id}`);

    console.log('\n📋 Résumé des modifications :');
    console.log('   ✅ Workflow actuel récupéré depuis n8n');
    console.log('   ✅ Toutes vos modifications préservées');
    console.log('   ✅ Uniquement le nœud "Process Recipients" corrigé');
    console.log('   ✅ Workflow réimporté dans n8n');

    return updatedWorkflow;

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécuter
fetchAndFixWorkflow();

