/**
 * Script pour améliorer le trigger manuel dans n8n - Version 2
 * - Améliorer le nœud "Custom Prompt Input" pour une édition facile
 * - Ajouter un nœud Switch pour choisir entre prévisualisation et envoi
 * - Ajouter un nœud de prévisualisation qui affiche le contenu
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

// 1. Améliorer le nœud "Custom Prompt Input"
const customPromptNode = workflow.nodes.find(n => n.name === 'Custom Prompt Input');
if (customPromptNode) {
  customPromptNode.parameters.assignments.assignments = [
    {
      "id": "id-1",
      "name": "custom_prompt",
      "value": "=== PROMPT PERSONNALISÉ ===\n\nTu es Emma, l'assistante financière intelligente. Génère un briefing personnalisé selon les instructions ci-dessous.\n\n**Instructions personnalisées :**\n[Modifiez ce prompt selon vos besoins - ce texte sera remplacé par votre prompt personnalisé]\n\n**Structure suggérée :**\n1. **Ouverture** : Salutation et contexte\n2. **Analyse principale** : Points clés à couvrir\n3. **Focus spécifique** : Éléments particuliers à analyser\n4. **Recommandations** : Insights et conseils\n5. **Fermeture** : Synthèse et prochaines étapes\n\nUtilise les outils disponibles pour récupérer des données réelles et à jour. Sois précis, professionnel mais accessible.",
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
      "name": "preview_mode",
      "value": "true",
      "type": "boolean"
    },
    {
      "id": "id-4",
      "name": "approved",
      "value": "false",
      "type": "boolean"
    }
  ];
  console.log('✅ Nœud "Custom Prompt Input" amélioré');
}

// 2. Trouver les nœuds importants
const parseApiResponseNode = workflow.nodes.find(n => n.name === 'Parse API Response');
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!parseApiResponseNode || !generateHtmlNode) {
  console.error('❌ Nœuds requis non trouvés');
  process.exit(1);
}

// 3. Créer un nœud Switch pour choisir entre prévisualisation et envoi
const previewSwitchNode = {
  "parameters": {
    "mode": "rules",
    "rules": {
      "values": [
        {
          "conditions": {
            "boolean": [
              {
                "value1": "={{ $json.preview_mode === true && $json.approved !== true }}",
                "value2": true
              }
            ]
          },
          "renameOutput": true,
          "outputKey": "preview"
        },
        {
          "conditions": {
            "boolean": [
              {
                "value1": "={{ $json.approved === true || $json.preview_mode === false }}",
                "value2": true
              }
            ]
          },
          "renameOutput": true,
          "outputKey": "send"
        }
      ]
    },
    "options": {}
  },
  "id": "preview-or-send-switch",
  "name": "Preview or Send?",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3,
  "position": [
    parseApiResponseNode.position[0] + 320,
    parseApiResponseNode.position[1]
  ]
};

// 4. Créer un nœud de prévisualisation (affiche le contenu)
const previewDisplayNode = {
  "parameters": {
    "jsCode": "const items = $input.all();\nconst data = items[0].json;\n\n// Extraire le contenu\nconst content = data.newsletter_content || data.response || data.message || 'Aucun contenu reçu';\nconst metadata = {\n  trigger_type: data.trigger_type || 'Manuel',\n  emma_model: data.emma_model || 'perplexity',\n  emma_tools: Array.isArray(data.emma_tools) ? data.emma_tools.join(', ') : 'Aucun',\n  emma_execution_time: data.emma_execution_time || 0,\n  prompt_type: data.prompt_type || 'custom',\n  generated_at: data.generated_at || new Date().toISOString(),\n  content_length: content.length\n};\n\n// Créer un message de prévisualisation formaté\nconst previewMessage = `\n╔══════════════════════════════════════════════════════════════╗\n║  📋 PRÉVISUALISATION DU BRIEFING                            ║\n╚══════════════════════════════════════════════════════════════╝\n\n✅ Briefing généré avec succès !\n\n📊 MÉTADONNÉES :\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Type : ${metadata.prompt_type}\n• Modèle Emma : ${metadata.emma_model.toUpperCase()}\n• Outils utilisés : ${metadata.emma_tools}\n• Temps d'exécution : ${(metadata.emma_execution_time / 1000).toFixed(1)}s\n• Longueur : ${metadata.content_length} caractères\n• Généré le : ${new Date(metadata.generated_at).toLocaleString('fr-FR')}\n\n📝 APERÇU DU CONTENU (500 premiers caractères) :\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}\n\n⚠️  POUR APPROUVER ET ENVOYER :\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n1. Modifiez le nœud \"Custom Prompt Input\"\n2. Changez \"approved\" de false à true\n3. Réexécutez le workflow depuis \"Custom Prompt Input\"\n\n💡 ASTUCE : Vous pouvez aussi modifier le prompt dans \"Custom Prompt Input\"\net réexécuter pour tester différentes versions.\n`;\n\nreturn items.map(item => ({\n  json: {\n    ...item.json,\n    preview_message: previewMessage,\n    preview_content: content,\n    preview_metadata: metadata\n  }\n}));"
  },
  "id": "preview-display",
  "name": "Preview Display",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    previewSwitchNode.position[0] + 320,
    previewSwitchNode.position[1] - 100
  ]
};

// 5. Créer un nœud NoOp pour arrêter la prévisualisation
const previewStopNode = {
  "parameters": {
    "message": "=📋 PRÉVISUALISATION\n\n{{ $json.preview_message }}\n\n⚠️ Pour envoyer, modifiez \"approved\" à true dans \"Custom Prompt Input\" et réexécutez."
  },
  "id": "preview-stop",
  "name": "Preview Stop",
  "type": "n8n-nodes-base.noOp",
  "typeVersion": 1,
  "position": [
    previewDisplayNode.position[0] + 320,
    previewDisplayNode.position[1]
  ]
};

// 6. Ajouter les nouveaux nœuds
workflow.nodes.push(previewSwitchNode, previewDisplayNode, previewStopNode);

// 7. Mettre à jour les connexions
// Parse API Response -> Preview or Send?
if (!workflow.connections['Parse API Response']) {
  workflow.connections['Parse API Response'] = { main: [[]] };
}
workflow.connections['Parse API Response'].main[0] = [
  {
    "node": "Preview or Send?",
    "type": "main",
    "index": 0
  }
];

// Preview or Send? -> Preview Display (si preview_mode = true)
workflow.connections['Preview or Send?'] = {
  main: [
    [
      {
        "node": "Preview Display",
        "type": "main",
        "index": 0
      }
    ],
    [
      {
        "node": "Generate HTML Newsletter",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// Preview Display -> Preview Stop
workflow.connections['Preview Display'] = {
  main: [
    [
      {
        "node": "Preview Stop",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

console.log('✅ Nœuds de prévisualisation ajoutés');

// 8. Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
console.log(`✅ Workflow sauvegardé dans ${workflowPath}`);
console.log('\n📋 Instructions pour utiliser le trigger manuel :');
console.log('1. Cliquez sur "Manual Trigger (Custom Prompt)"');
console.log('2. Modifiez le prompt dans "Custom Prompt Input" selon vos besoins');
console.log('3. Laissez "preview_mode" à true et "approved" à false');
console.log('4. Exécutez le workflow - vous verrez la prévisualisation dans "Preview Stop"');
console.log('5. Si vous êtes satisfait, modifiez "approved" à true dans "Custom Prompt Input"');
console.log('6. Réexécutez depuis "Custom Prompt Input" pour envoyer');

