/**
 * Script pour créer des nodes de configuration séparés pour chaque trigger
 * 
 * Chaque trigger aura son propre node de configuration:
 * - Schedule Config (pour les briefings automatiques)
 * - Webhook Config (pour les webhooks externes)
 * - Manual Config (pour les triggers manuels)
 * - Chat Config (pour les previews)
 * 
 * Cela permet de contrôler indépendamment preview_mode et approved pour chaque type
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Création de nodes de configuration séparés pour chaque trigger...\n');

// Trouver le node Workflow Configuration existant comme template
const existingConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');
if (!existingConfigNode) {
  console.error('❌ Node "Workflow Configuration" non trouvé');
  process.exit(1);
}

// Créer les nodes de configuration pour chaque trigger
const configNodes = [
  {
    name: 'Schedule Config',
    description: 'Configuration pour les briefings automatiques (Schedule Trigger)',
    preview_mode: 'false',  // Les briefings automatiques envoient directement
    approved: 'true',
    position: [existingConfigNode.position[0], existingConfigNode.position[1] - 200]
  },
  {
    name: 'Webhook Config',
    description: 'Configuration pour les webhooks externes',
    preview_mode: 'false',  // Par défaut, envoi direct
    approved: 'true',
    position: [existingConfigNode.position[0], existingConfigNode.position[1] - 100]
  },
  {
    name: 'Manual Config',
    description: 'Configuration pour les triggers manuels (Custom Prompt)',
    preview_mode: 'true',  // Par défaut, preview pour les tests manuels
    approved: 'false',
    position: [existingConfigNode.position[0], existingConfigNode.position[1] + 100]
  },
  {
    name: 'Chat Config',
    description: 'Configuration pour les previews (Chat Trigger)',
    preview_mode: 'true',  // Toujours en preview pour les previews
    approved: 'false',
    position: [existingConfigNode.position[0], existingConfigNode.position[1] + 200]
  }
];

// Créer chaque node de configuration
configNodes.forEach(config => {
  // Vérifier si le node existe déjà
  const existingNode = workflow.nodes.find(n => n.name === config.name);
  
  if (existingNode) {
    console.log(`ℹ️  Node "${config.name}" existe déjà, mise à jour...`);
    // Mettre à jour les valeurs
    const previewModeAssignment = existingNode.parameters.assignments.assignments.find(
      a => a.name === 'preview_mode'
    );
    const approvedAssignment = existingNode.parameters.assignments.assignments.find(
      a => a.name === 'approved'
    );
    
    if (previewModeAssignment) {
      previewModeAssignment.value = config.preview_mode;
    } else {
      existingNode.parameters.assignments.assignments.push({
        id: `id-preview-mode-${Date.now()}`,
        name: 'preview_mode',
        value: config.preview_mode,
        type: 'boolean'
      });
    }
    
    if (approvedAssignment) {
      approvedAssignment.value = config.approved;
    } else {
      existingNode.parameters.assignments.assignments.push({
        id: `id-approved-${Date.now()}`,
        name: 'approved',
        value: config.approved,
        type: 'boolean'
      });
    }
  } else {
    // Créer un nouveau node basé sur Workflow Configuration
    const newConfigNode = {
      ...existingConfigNode,
      id: `config-${config.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: config.name,
      position: config.position,
      parameters: {
        ...existingConfigNode.parameters,
        assignments: {
          assignments: existingConfigNode.parameters.assignments.assignments.map(assignment => {
            if (assignment.name === 'preview_mode') {
              return { ...assignment, value: config.preview_mode };
            }
            if (assignment.name === 'approved') {
              return { ...assignment, value: config.approved };
            }
            return assignment;
          })
        }
      }
    };
    
    workflow.nodes.push(newConfigNode);
    console.log(`✅ Node "${config.name}" créé`);
    console.log(`   preview_mode: ${config.preview_mode}`);
    console.log(`   approved: ${config.approved}`);
  }
});

// Mettre à jour les connexions pour utiliser les bons nodes de configuration
console.log('\n🔗 Mise à jour des connexions...');

// Schedule Trigger → Schedule Config
if (workflow.connections['Schedule Trigger (7h/12h/16h30 EST)']) {
  workflow.connections['Schedule Trigger (7h/12h/16h30 EST)'] = {
    main: [
      [
        {
          node: 'Schedule Config',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Schedule Trigger → Schedule Config');
}

// Webhook Trigger → Webhook Config
if (workflow.connections['Webhook Trigger']) {
  workflow.connections['Webhook Trigger'] = {
    main: [
      [
        {
          node: 'Webhook Config',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Webhook Trigger → Webhook Config');
}

// Merge Triggers → Manual Config (pour Manual et Chat triggers)
if (workflow.connections['Merge Triggers']) {
  const currentConnection = workflow.connections['Merge Triggers'].main[0][0];
  if (currentConnection.node === 'Workflow Configuration') {
    workflow.connections['Merge Triggers'] = {
      main: [
        [
          {
            node: 'Manual Config',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Merge Triggers → Manual Config');
  }
}

// Connecter Manual Config vers le node suivant (Fetch Prompts from API)
const fetchPromptsNode = workflow.nodes.find(n => n.name === 'Fetch Prompts from API');
if (fetchPromptsNode) {
  // Schedule Config → Fetch Prompts
  workflow.connections['Schedule Config'] = {
    main: [
      [
        {
          node: 'Fetch Prompts from API',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  
  // Webhook Config → Fetch Prompts
  workflow.connections['Webhook Config'] = {
    main: [
      [
        {
          node: 'Fetch Prompts from API',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  
  // Manual Config → Fetch Prompts
  workflow.connections['Manual Config'] = {
    main: [
      [
        {
          node: 'Fetch Prompts from API',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  
  // Chat Config → Fetch Prompts (si utilisé directement)
  workflow.connections['Chat Config'] = {
    main: [
      [
        {
          node: 'Fetch Prompts from API',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  
  console.log('✅ Tous les Config nodes → Fetch Prompts from API');
}

// Optionnel: Garder Workflow Configuration comme fallback ou le supprimer
// Pour l'instant, on le garde mais on ne l'utilise plus

console.log('\n✅ Nodes de configuration séparés créés !');
console.log('\n📋 Résumé:');
console.log('   Schedule Config: preview_mode=false, approved=true (envoi automatique)');
console.log('   Webhook Config: preview_mode=false, approved=true (envoi direct)');
console.log('   Manual Config: preview_mode=true, approved=false (preview par défaut)');
console.log('   Chat Config: preview_mode=true, approved=false (toujours preview)');
console.log('\n💡 Vous pouvez maintenant modifier indépendamment chaque node de configuration');
console.log('   pour activer/désactiver l\'envoi pour chaque type de trigger.');

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow sauvegardé !');

