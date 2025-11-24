/**
 * Script pour mettre à jour le workflow n8n pour utiliser les mêmes APIs que le site web
 * 
 * Modifications:
 * 1. Ajouter un node "Fetch Email Recipients" qui récupère les destinataires depuis /api/email-recipients
 * 2. Modifier "Send Email via Resend" pour utiliser les destinataires depuis l'API
 * 3. S'assurer que tous les nodes utilisent les mêmes sources de données
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Mise à jour du workflow n8n pour utiliser les mêmes APIs que le site web...\n');

// Trouver les nodes existants
const parseResponseNode = workflow.nodes.find(n => n.name === 'Parse API Response');
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');
const sendEmailNode = workflow.nodes.find(n => n.name === 'Send Email via Resend');
const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');

if (!parseResponseNode || !generateHtmlNode || !sendEmailNode) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

// 1. Créer un nouveau node "Fetch Email Recipients" qui récupère depuis /api/email-recipients
const fetchRecipientsNode = {
  parameters: {
    method: 'GET',
    url: '=https://gob-projetsjsls-projects.vercel.app/api/email-recipients',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: 'Content-Type',
          value: 'application/json'
        }
      ]
    },
    options: {
      response: {
        response: {
          responseFormat: 'json'
        }
      }
    }
  },
  id: 'fetch-email-recipients-node',
  name: 'Fetch Email Recipients',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: [
    generateHtmlNode.position[0] + 160,
    generateHtmlNode.position[1]
  ]
};

// 2. Créer un node "Process Recipients" qui filtre selon le type de briefing
const processRecipientsNode = {
  parameters: {
    jsCode: `const items = $input.all();
const data = items[0].json;

// Récupérer le type de briefing depuis les données précédentes
const briefingType = $('Determine Time-Based Prompt').item.json.prompt_type || 'custom';
const previewMode = $('Custom Prompt Input').item.json.preview_mode || false;

// Normaliser le type
let normalizedType = briefingType;
if (normalizedType === 'noon') {
  normalizedType = 'midday';
}

// Récupérer les destinataires depuis l'API
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
    preview_mode: previewMode
  }
}));`
  },
  id: 'process-recipients-node',
  name: 'Process Recipients',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [
    fetchRecipientsNode.position[0] + 160,
    fetchRecipientsNode.position[1]
  ]
};

// 3. Vérifier si les nodes existent déjà
const existingFetchRecipients = workflow.nodes.find(n => n.name === 'Fetch Email Recipients');
const existingProcessRecipients = workflow.nodes.find(n => n.name === 'Process Recipients');

if (!existingFetchRecipients) {
  workflow.nodes.push(fetchRecipientsNode);
  console.log('✅ Node "Fetch Email Recipients" ajouté');
} else {
  console.log('ℹ️  Node "Fetch Email Recipients" existe déjà');
}

if (!existingProcessRecipients) {
  workflow.nodes.push(processRecipientsNode);
  console.log('✅ Node "Process Recipients" ajouté');
} else {
  console.log('ℹ️  Node "Process Recipients" existe déjà');
}

// 4. Modifier le node "Send Email via Resend" pour utiliser les destinataires depuis l'API
if (sendEmailNode) {
  // Remplacer le hardcoded recipients par la variable depuis Process Recipients
  sendEmailNode.parameters.jsonBody = '={{ { "from": "Emma Newsletter <onboarding@resend.dev>", "to": $json.recipients || ["projetsjsl@gmail.com"], "subject": $json.subject, "html": $json.html_content } }}';
  console.log('✅ Node "Send Email via Resend" mis à jour pour utiliser les destinataires depuis l\'API');
}

// 5. Mettre à jour les connexions
// Generate HTML Newsletter → Fetch Email Recipients → Process Recipients → Send Email via Resend

// Trouver les positions pour bien placer les nodes
const generateHtmlPosition = generateHtmlNode.position;
const sendEmailPosition = sendEmailNode.position;

// Positionner Fetch Email Recipients entre Generate HTML et Send Email
fetchRecipientsNode.position = [
  generateHtmlPosition[0] + 160,
  generateHtmlPosition[1]
];

processRecipientsNode.position = [
  fetchRecipientsNode.position[0] + 160,
  fetchRecipientsNode.position[1]
];

// Mettre à jour les connexions
if (!workflow.connections['Generate HTML Newsletter']) {
  workflow.connections['Generate HTML Newsletter'] = { main: [[]] };
}

// Generate HTML Newsletter → Fetch Email Recipients (en parallèle avec Send Email)
workflow.connections['Generate HTML Newsletter'].main[0] = [
  {
    node: 'Fetch Email Recipients',
    type: 'main',
    index: 0
  }
];

// Fetch Email Recipients → Process Recipients
workflow.connections['Fetch Email Recipients'] = {
  main: [
    [
      {
        node: 'Process Recipients',
        type: 'main',
        index: 0
      }
    ]
  ]
};

// Process Recipients → Send Email via Resend
workflow.connections['Process Recipients'] = {
  main: [
    [
      {
        node: 'Send Email via Resend',
        type: 'main',
        index: 0
      }
    ]
  ]
};

// Modifier la connexion Send Email pour qu'elle attende Process Recipients
// (au lieu de Generate HTML directement)
if (workflow.connections['Generate HTML Newsletter'].main[0]) {
  // Garder aussi la connexion directe pour les previews
  const existingConnection = workflow.connections['Generate HTML Newsletter'].main[0];
  if (!existingConnection.find(c => c.node === 'Generate HTML Preview')) {
    // Ajouter la connexion vers Generate HTML Preview si elle existe
    const previewNode = workflow.nodes.find(n => n.name === 'Generate HTML Preview');
    if (previewNode) {
      workflow.connections['Generate HTML Newsletter'].main[0].push({
        node: 'Generate HTML Preview',
        type: 'main',
        index: 0
      });
    }
  }
}

console.log('\n✅ Connexions mises à jour:');
console.log('   Generate HTML Newsletter → Fetch Email Recipients → Process Recipients → Send Email via Resend');

// 6. Mettre à jour Workflow Configuration pour ne plus hardcoder les recipients
const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');
if (workflowConfigNode) {
  // Retirer le champ recipients hardcodé
  const recipientsAssignment = workflowConfigNode.parameters.assignments.assignments.find(
    a => a.name === 'recipients'
  );
  if (recipientsAssignment) {
    workflowConfigNode.parameters.assignments.assignments = workflowConfigNode.parameters.assignments.assignments.filter(
      a => a.name !== 'recipients'
    );
    console.log('✅ Champ "recipients" retiré de Workflow Configuration (maintenant depuis API)');
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow n8n mis à jour !');
console.log('\n📋 Résumé des modifications:');
console.log('   ✅ Node "Fetch Email Recipients" ajouté (récupère depuis /api/email-recipients)');
console.log('   ✅ Node "Process Recipients" ajouté (filtre selon le type de briefing)');
console.log('   ✅ Node "Send Email via Resend" utilise maintenant les destinataires depuis l\'API');
console.log('   ✅ Workflow Configuration ne hardcode plus les recipients');
console.log('\n⚠️  Note: Vous devez importer ce workflow dans n8n pour appliquer les changements.');

