/**
 * Script pour améliorer le trigger manuel dans n8n
 * - Améliorer le nœud "Custom Prompt Input" pour une édition facile
 * - Ajouter un nœud de prévisualisation/test après Parse API Response
 * - Ajouter un nœud de confirmation avant Send Email
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

// 1. Améliorer le nœud "Custom Prompt Input" pour permettre une édition facile
const customPromptNode = workflow.nodes.find(n => n.name === 'Custom Prompt Input');
if (customPromptNode) {
  // Améliorer les assignments pour rendre l'édition plus facile
  customPromptNode.parameters.assignments.assignments = [
    {
      "id": "id-1",
      "name": "custom_prompt",
      "value": "=== PROMPT PERSONNALISÉ ===\n\nTu es Emma, l'assistante financière intelligente. Génère un briefing personnalisé selon les instructions ci-dessous.\n\n**Instructions personnalisées :**\n[Modifiez ce prompt selon vos besoins]\n\n**Structure suggérée :**\n1. **Ouverture** : Salutation et contexte\n2. **Analyse principale** : Points clés à couvrir\n3. **Focus spécifique** : Éléments particuliers à analyser\n4. **Recommandations** : Insights et conseils\n5. **Fermeture** : Synthèse et prochaines étapes\n\nUtilise les outils disponibles pour récupérer des données réelles et à jour. Sois précis, professionnel mais accessible.",
      "type": "string"
    },
    {
      "id": "id-2",
      "name": "prompt_type",
      "value": "custom",
      "type": "string"
    },
    {
      "id": "id-3",
      "name": "test_mode",
      "value": "true",
      "type": "boolean"
    },
    {
      "id": "id-4",
      "name": "require_approval",
      "value": "true",
      "type": "boolean"
    }
  ];
  console.log('✅ Nœud "Custom Prompt Input" amélioré pour édition facile');
}

// 2. Trouver les nœuds importants
const parseApiResponseNode = workflow.nodes.find(n => n.name === 'Parse API Response');
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');
const sendEmailNode = workflow.nodes.find(n => n.name === 'Send Email via Resend');

if (!parseApiResponseNode || !generateHtmlNode || !sendEmailNode) {
  console.error('❌ Nœuds requis non trouvés');
  process.exit(1);
}

// 3. Créer un nœud de prévisualisation/test
const previewNode = {
  "parameters": {
    "jsCode": "const items = $input.all();\nconst data = items[0].json;\n\n// Extraire le contenu de la réponse\nconst content = data.newsletter_content || data.response || data.message || 'Aucun contenu reçu';\nconst metadata = {\n  trigger_type: data.trigger_type || 'Manuel',\n  emma_model: data.emma_model || 'perplexity',\n  emma_tools: data.emma_tools || [],\n  emma_execution_time: data.emma_execution_time || 0,\n  prompt_type: data.prompt_type || 'custom',\n  generated_at: data.generated_at || new Date().toISOString()\n};\n\n// Créer un résumé pour la prévisualisation\nconst preview = {\n  success: true,\n  preview_mode: true,\n  content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),\n  content_length: content.length,\n  metadata: metadata,\n  full_content: content,\n  ready_for_approval: true\n};\n\nreturn items.map(item => ({\n  json: {\n    ...item.json,\n    ...preview\n  }\n}));"
  },
  "id": "preview-briefing-content",
  "name": "Preview Briefing Content",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    parseApiResponseNode.position[0] + 320,
    parseApiResponseNode.position[1]
  ]
};

// 4. Créer un nœud de confirmation (IF pour vérifier si on doit envoyer)
const approvalNode = {
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.test_mode === false || $json.require_approval === false || $json.approved === true }}",
          "value2": true
        }
      ]
    }
  },
  "id": "approval-check",
  "name": "Check Approval",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [
    generateHtmlNode.position[0] - 320,
    generateHtmlNode.position[1]
  ]
};

// 5. Créer un nœud pour afficher le message de prévisualisation
const previewMessageNode = {
  "parameters": {
    "message": "=📋 PRÉVISUALISATION DU BRIEFING\n\n✅ Le briefing a été généré avec succès.\n\n📊 Métadonnées :\n- Type : {{ $json.prompt_type }}\n- Modèle : {{ $json.emma_model }}\n- Outils utilisés : {{ $json.emma_tools.join(', ') }}\n- Temps d'exécution : {{ ($json.emma_execution_time / 1000).toFixed(1) }}s\n- Longueur : {{ $json.content_length }} caractères\n\n📝 Aperçu (500 premiers caractères) :\n{{ $json.content }}\n\n⚠️ Pour approuver et envoyer, modifiez le nœud \"Preview Briefing Content\" et définissez \"approved\" à true, puis réexécutez.\n\n💡 Astuce : Vous pouvez aussi modifier le prompt dans \"Custom Prompt Input\" et réexécuter pour tester différentes versions."
  },
  "id": "preview-message",
  "name": "Preview Message",
  "type": "n8n-nodes-base.noOp",
  "typeVersion": 1,
  "position": [
    previewNode.position[0] + 320,
    previewNode.position[1]
  ]
};

// 6. Ajouter les nouveaux nœuds au workflow
workflow.nodes.push(previewNode, approvalNode, previewMessageNode);

// 7. Mettre à jour les connexions
// Parse API Response -> Preview Briefing Content -> Preview Message
if (!workflow.connections['Parse API Response']) {
  workflow.connections['Parse API Response'] = { main: [[]] };
}
workflow.connections['Parse API Response'].main[0] = [
  {
    "node": "Preview Briefing Content",
    "type": "main",
    "index": 0
  }
];

// Preview Briefing Content -> Preview Message
workflow.connections['Preview Briefing Content'] = {
  main: [
    [
      {
        "node": "Preview Message",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// Preview Message -> Check Approval
workflow.connections['Preview Message'] = {
  main: [
    [
      {
        "node": "Check Approval",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// Check Approval -> Generate HTML Newsletter (si approuvé) OU Preview Message (si non approuvé)
workflow.connections['Check Approval'] = {
  main: [
    [
      {
        "node": "Generate HTML Newsletter",
        "type": "main",
        "index": 0
      }
    ],
    [
      {
        "node": "Preview Message",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// 8. Mettre à jour la connexion Generate HTML Newsletter (elle reste connectée à Send Email)
// (Pas besoin de modifier, elle est déjà correcte)

console.log('✅ Nœuds de prévisualisation et confirmation ajoutés');

// 9. Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
console.log(`✅ Workflow sauvegardé dans ${workflowPath}`);
console.log('\n📋 Instructions pour utiliser le trigger manuel :');
console.log('1. Cliquez sur "Manual Trigger (Custom Prompt)"');
console.log('2. Modifiez le prompt dans "Custom Prompt Input" selon vos besoins');
console.log('3. Exécutez le workflow');
console.log('4. Vérifiez la prévisualisation dans "Preview Message"');
console.log('5. Si vous êtes satisfait, modifiez "Preview Briefing Content" et définissez "approved" à true');
console.log('6. Réexécutez à partir de "Preview Briefing Content" pour envoyer');

