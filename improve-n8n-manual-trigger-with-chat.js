/**
 * Script pour améliorer le trigger manuel avec :
 * 1. Un node "AI Agent" dédié pour appeler Emma
 * 2. Un node "Chat Trigger" pour faciliter la visualisation et confirmation
 * 3. Une meilleure prévisualisation HTML de l'email
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workflowPath = join(__dirname, 'n8n-workflow-03lgcA4e9uRTtli1.json');
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

// Trouver les nodes existants
const manualTriggerNode = workflow.nodes.find(n => n.name === 'Manual Trigger (Custom Prompt)');
const customPromptInputNode = workflow.nodes.find(n => n.name === 'Custom Prompt Input');
const parseApiResponseNode = workflow.nodes.find(n => n.name === 'Parse API Response');
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!manualTriggerNode || !customPromptInputNode || !parseApiResponseNode || !generateHtmlNode) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

// 1. Créer un node "AI Agent" dédié (remplace l'appel direct à /api/chat)
const aiAgentNode = {
  "parameters": {
    "method": "POST",
    "url": "https://gob-projetsjsls-projects.vercel.app/api/chat",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        },
        {
          "name": "Authorization",
          "value": "Bearer re_XeAhe3ju_PAnnuMx3kmhgPKnDff8PatR6"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ { \"message\": $json.selected_prompt || $json.custom_prompt, \"userId\": \"n8n-manual-trigger\", \"channel\": \"web\", \"context\": { \"output_mode\": \"briefing\", \"briefing_type\": $json.prompt_type || \"custom\", \"tickers\": $json.tickers || [] } } }}",
    "options": {
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  },
  "id": "ai-agent-emma",
  "name": "AI Agent (Emma)",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [
    parseApiResponseNode.position[0] - 320,
    parseApiResponseNode.position[1]
  ]
};

// 2. Créer un node "Chat Trigger" pour interaction
const chatTriggerNode = {
  "parameters": {
    "httpMethod": "POST",
    "path": "emma-newsletter/preview",
    "responseMode": "lastNode",
    "options": {}
  },
  "id": "chat-trigger-preview",
  "name": "Chat Trigger (Preview)",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2.1,
  "position": [
    manualTriggerNode.position[0],
    manualTriggerNode.position[1] - 200
  ],
  "webhookId": "emma-preview-webhook"
};

// 3. Créer un node pour générer une prévisualisation HTML complète
const htmlPreviewNode = {
  "parameters": {
    "jsCode": `const items = $input.all();
const data = items[0].json;

// Récupérer le contenu HTML généré
const htmlContent = data.html_content || '';
const subject = data.subject || 'Newsletter Emma';
const content = data.newsletter_content || data.response || '';

// Créer une prévisualisation HTML interactive
const previewHtml = \`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prévisualisation - \${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 20px;
    }
    .preview-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .preview-header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .preview-header h1 {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .preview-header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .preview-actions {
      padding: 20px;
      background: #f8fafc;
      border-bottom: 2px solid #e5e7eb;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .preview-btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      font-size: 14px;
      transition: all 0.2s;
    }
    .preview-btn.approve {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }
    .preview-btn.approve:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .preview-btn.reject {
      background: #ef4444;
      color: white;
    }
    .preview-btn.reject:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    .preview-content {
      padding: 0;
    }
    .preview-content iframe {
      width: 100%;
      height: 800px;
      border: none;
    }
    .preview-metadata {
      padding: 20px;
      background: #f1f5f9;
      border-top: 2px solid #e5e7eb;
    }
    .preview-metadata table {
      width: 100%;
      border-collapse: collapse;
    }
    .preview-metadata td {
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .preview-metadata td:first-child {
      font-weight: 700;
      color: #4f46e5;
      width: 150px;
    }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <h1>📋 Prévisualisation de l'Email</h1>
      <p>Vérifiez le contenu avant d'approuver l'envoi</p>
    </div>
    
    <div class="preview-actions">
      <button class="preview-btn approve" onclick="approveEmail()">
        ✅ Approuver et Envoyer
      </button>
      <button class="preview-btn reject" onclick="rejectEmail()">
        ❌ Rejeter
      </button>
    </div>
    
    <div class="preview-content">
      <iframe srcdoc="\${htmlContent.replace(/"/g, '&quot;')}"></iframe>
    </div>
    
    <div class="preview-metadata">
      <table>
        <tr>
          <td>Sujet:</td>
          <td>\${subject}</td>
        </tr>
        <tr>
          <td>Type:</td>
          <td>\${data.prompt_type || 'custom'}</td>
        </tr>
        <tr>
          <td>Modèle Emma:</td>
          <td>\${data.emma_model || 'perplexity'}</td>
        </tr>
        <tr>
          <td>Longueur:</td>
          <td>\${content.length} caractères</td>
        </tr>
        <tr>
          <td>Généré le:</td>
          <td>\${new Date().toLocaleString('fr-FR')}</td>
        </tr>
      </table>
    </div>
  </div>
  
  <script>
    function approveEmail() {
      alert('✅ Pour approuver:\\n\\n1. Retournez dans n8n\\n2. Modifiez le nœud "Custom Prompt Input"\\n3. Changez "approved" à true\\n4. Réexécutez le workflow');
    }
    function rejectEmail() {
      alert('❌ Email rejeté. Modifiez le prompt dans "Custom Prompt Input" et réexécutez.');
    }
  </script>
</body>
</html>
\`;

return [{
  json: {
    ...data,
    preview_html: previewHtml,
    preview_url: \`data:text/html;charset=utf-8,\${encodeURIComponent(previewHtml)}\`
  }
}];`
  },
  "id": "html-preview-generator",
  "name": "Generate HTML Preview",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    generateHtmlNode.position[0] + 320,
    generateHtmlNode.position[1]
  ]
};

// 4. Créer un node pour servir la prévisualisation HTML
const servePreviewNode = {
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ { \"success\": true, \"preview_html\": $json.preview_html, \"preview_url\": $json.preview_url, \"subject\": $json.subject, \"metadata\": { \"type\": $json.prompt_type, \"model\": $json.emma_model, \"length\": ($json.newsletter_content || $json.response || '').length } } }}",
    "options": {}
  },
  "id": "serve-preview",
  "name": "Serve Preview",
  "type": "n8n-nodes-base.respondToWebhook",
  "typeVersion": 1.1,
  "position": [
    htmlPreviewNode.position[0] + 320,
    htmlPreviewNode.position[1]
  ]
};

// 5. Modifier le node "Preview Display" pour inclure un lien vers la prévisualisation HTML
const previewDisplayNode = workflow.nodes.find(n => n.name === 'Preview Display');
if (previewDisplayNode) {
  previewDisplayNode.parameters.jsCode = `const items = $input.all();
const data = items[0].json;

// Extraire le contenu
const content = data.newsletter_content || data.response || data.message || 'Aucun contenu reçu';
const metadata = {
  trigger_type: data.trigger_type || 'Manuel',
  emma_model: data.emma_model || 'perplexity',
  emma_tools: Array.isArray(data.emma_tools) ? data.emma_tools.join(', ') : 'Aucun',
  emma_execution_time: data.emma_execution_time || 0,
  prompt_type: data.prompt_type || 'custom',
  generated_at: data.generated_at || new Date().toISOString(),
  content_length: content.length
};

// Créer un message de prévisualisation formaté avec lien HTML
const previewMessage = \`
╔══════════════════════════════════════════════════════════════╗
║  📋 PRÉVISUALISATION DU BRIEFING                            ║
╚══════════════════════════════════════════════════════════════╝

✅ Briefing généré avec succès !

📊 MÉTADONNÉES :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Type : \${metadata.prompt_type}
• Modèle Emma : \${metadata.emma_model.toUpperCase()}
• Outils utilisés : \${metadata.emma_tools}
• Temps d'exécution : \${(metadata.emma_execution_time / 1000).toFixed(1)}s
• Longueur : \${metadata.content_length} caractères
• Généré le : \${new Date(metadata.generated_at).toLocaleString('fr-FR')}

📝 APERÇU DU CONTENU (500 premiers caractères) :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\${content.substring(0, 500)}\${content.length > 500 ? '...' : ''}

🌐 PRÉVISUALISATION HTML :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Pour voir la prévisualisation HTML complète de l'email :
   1. Utilisez le "Chat Trigger (Preview)" pour obtenir une URL
   2. Ou consultez le nœud "Generate HTML Preview" pour le HTML

⚠️  POUR APPROUVER ET ENVOYER :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Modifiez le nœud "Custom Prompt Input"
2. Changez "approved" de false à true
3. Réexécutez le workflow depuis "Custom Prompt Input"

💡 ASTUCE : Vous pouvez aussi modifier le prompt dans "Custom Prompt Input"
et réexécuter pour tester différentes versions.
\`;

return items.map(item => ({
  json: {
    ...item.json,
    preview_message: previewMessage,
    preview_content: content,
    preview_metadata: metadata
  }
}));`;
}

// 6. Ajouter les nouveaux nodes au workflow
workflow.nodes.push(aiAgentNode, chatTriggerNode, htmlPreviewNode, servePreviewNode);

// 7. Mettre à jour les connexions
// Chat Trigger -> Custom Prompt Input
if (!workflow.connections['Chat Trigger (Preview)']) {
  workflow.connections['Chat Trigger (Preview)'] = { main: [[]] };
}
workflow.connections['Chat Trigger (Preview)'].main[0] = [
  {
    "node": "Custom Prompt Input",
    "type": "main",
    "index": 0
  }
];

// Parse API Response -> AI Agent (optionnel, pour clarifier le flux)
// On garde la connexion existante mais on peut ajouter AI Agent comme alternative

// Generate HTML Newsletter -> Generate HTML Preview
if (!workflow.connections['Generate HTML Newsletter']) {
  workflow.connections['Generate HTML Newsletter'] = { main: [[]] };
}
// Ajouter une connexion vers Generate HTML Preview
workflow.connections['Generate HTML Newsletter'].main.push([
  {
    "node": "Generate HTML Preview",
    "type": "main",
    "index": 0
  }
]);

// Generate HTML Preview -> Serve Preview (pour Chat Trigger)
if (!workflow.connections['Generate HTML Preview']) {
  workflow.connections['Generate HTML Preview'] = { main: [[]] };
}
workflow.connections['Generate HTML Preview'].main[0] = [
  {
    "node": "Serve Preview",
    "type": "main",
    "index": 0
  }
];

// Generate HTML Preview -> Preview Display (pour Manual Trigger)
workflow.connections['Generate HTML Preview'].main.push([
  {
    "node": "Preview Display",
    "type": "main",
    "index": 0
  }
]);

console.log('✅ Nodes améliorés ajoutés :');
console.log('   - AI Agent (Emma) : Node dédié pour appeler Emma');
console.log('   - Chat Trigger (Preview) : Webhook pour prévisualisation interactive');
console.log('   - Generate HTML Preview : Génère une prévisualisation HTML complète');
console.log('   - Serve Preview : Sert la prévisualisation via webhook');

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
console.log('✅ Workflow mis à jour avec succès');

