/**
 * Script pour importer et tester le workflow n8n
 */

import { readFileSync } from 'fs';

const N8N_BASE_URL = 'https://projetsjsl.app.n8n.cloud';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';
const WORKFLOW_FILE = 'n8n-workflow-03lgcA4e9uRTtli1.json';

// Lire le workflow
const workflow = JSON.parse(readFileSync(WORKFLOW_FILE, 'utf-8'));

// Nettoyer le workflow pour l'API n8n - ne garder que les propriétés acceptées
const cleanWorkflow = {
  name: workflow.name,
  nodes: workflow.nodes.map(node => {
    // Nettoyer chaque node
    const cleanNode = {
      id: node.id,
      name: node.name,
      type: node.type,
      typeVersion: node.typeVersion,
      position: node.position,
      parameters: node.parameters
    };
    
    // Ajouter credentials si présent
    if (node.credentials) {
      cleanNode.credentials = node.credentials;
    }
    
    // Ajouter webhookId si présent
    if (node.webhookId) {
      cleanNode.webhookId = node.webhookId;
    }
    
    return cleanNode;
  }),
  connections: workflow.connections,
  settings: workflow.settings || { executionOrder: 'v1' },
  staticData: workflow.staticData || null
  // tags est en lecture seule, ne pas l'inclure
};

console.log('📦 Import du workflow dans n8n...\n');

// 1. Importer le workflow (créer une nouvelle version)
async function importWorkflow() {
  try {
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': process.env.N8N_API_KEY || ''
      },
      body: JSON.stringify(cleanWorkflow)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Import failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Workflow importé avec succès!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Nom: ${result.name}`);
    return result.id;
  } catch (error) {
    console.error('❌ Erreur import:', error.message);
    throw error;
  }
}

// 2. Activer le workflow
async function activateWorkflow(workflowId) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY || ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Activation failed: ${response.status} - ${errorText}`);
    }

    console.log('✅ Workflow activé!');
  } catch (error) {
    console.error('❌ Erreur activation:', error.message);
    throw error;
  }
}

// 3. Tester le workflow via webhook
async function testWorkflow(workflowId) {
  try {
    console.log('\n🧪 Test d\'exécution du workflow via webhook...\n');
    
    // Tester via le webhook du workflow
    const webhookPath = 'emma-newsletter/send';
    const response = await fetch(`${N8N_BASE_URL}/webhook/${webhookPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt_type: 'morning',
        test_mode: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`⚠️  Webhook test: ${response.status} - ${errorText}`);
      console.log('\n💡 Le workflow a été mis à jour avec succès.');
      console.log('   Vous pouvez le tester manuellement dans l\'interface n8n:');
      console.log(`   ${N8N_BASE_URL}/workflow/${workflowId}`);
      return;
    }

    const result = await response.text();
    console.log('✅ Webhook appelé avec succès!');
    console.log(`   Réponse: ${result.substring(0, 200)}...`);
    
    return result;
  } catch (error) {
    console.error('⚠️  Erreur test webhook:', error.message);
    console.log('\n💡 Le workflow a été mis à jour avec succès.');
    console.log('   Vous pouvez le tester manuellement dans l\'interface n8n:');
    console.log(`   ${N8N_BASE_URL}/workflow/${workflowId}`);
  }
}

// 4. Mettre à jour le workflow existant (au lieu de créer un nouveau)
async function updateWorkflow() {
  try {
    console.log('🔄 Mise à jour du workflow existant...\n');
    
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': process.env.N8N_API_KEY || ''
      },
      body: JSON.stringify(cleanWorkflow)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Workflow mis à jour avec succès!');
    console.log(`   ID: ${result.id}`);
    return result.id;
  } catch (error) {
    console.error('❌ Erreur mise à jour:', error.message);
    // Si la mise à jour échoue, essayer d'importer
    console.log('\n🔄 Tentative d\'import comme nouveau workflow...');
    return await importWorkflow();
  }
}

// Exécution principale
async function main() {
  try {
    if (!process.env.N8N_API_KEY) {
      console.error('❌ N8N_API_KEY non configurée dans les variables d\'environnement');
      console.log('   Utilisez: export N8N_API_KEY=votre_cle');
      process.exit(1);
    }

    // Essayer de mettre à jour le workflow existant
    const workflowId = await updateWorkflow();
    
    // Activer le workflow
    await activateWorkflow(workflowId);
    
    // Tester le workflow
    await testWorkflow(workflowId);
    
    console.log('\n✅ Tous les tests terminés!');
    console.log(`\n📋 URL du workflow: ${N8N_BASE_URL}/workflow/${workflowId}`);
    
  } catch (error) {
    console.error('\n❌ Erreur globale:', error.message);
    process.exit(1);
  }
}

main();

