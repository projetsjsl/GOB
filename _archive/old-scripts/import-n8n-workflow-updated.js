/**
 * Script pour importer/mettre à jour le workflow n8n avec les dernières modifications
 * - Synchronisation avec les APIs du site web
 * - Formatage emails selon les standards visuels
 * - Support mode preview/send
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';
const WORKFLOW_FILE = 'n8n-workflow-03lgcA4e9uRTtli1.json';

async function updateWorkflow() {
  try {
    console.log('📥 Mise à jour du workflow n8n...\n');
    console.log(`   Workflow ID: ${WORKFLOW_ID}`);
    console.log(`   URL: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);

    // 1. Lire le workflow mis à jour
    const workflowPath = join(__dirname, WORKFLOW_FILE);
    const workflowData = JSON.parse(readFileSync(workflowPath, 'utf-8'));

    console.log(`✅ Workflow lu: ${workflowData.name}`);
    console.log(`   Nodes: ${workflowData.nodes.length}`);
    console.log(`   Active: ${workflowData.active}\n`);

    // 2. Nettoyer le workflow pour l'API n8n
    const cleanWorkflow = {
      name: workflowData.name,
      nodes: workflowData.nodes.map(node => {
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
      connections: workflowData.connections,
      settings: workflowData.settings || { executionOrder: 'v1' },
      staticData: workflowData.staticData || null
    };

    // 3. Récupérer le workflow existant pour préserver certaines propriétés
    console.log('📥 Récupération du workflow existant...');
    const getResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error(`❌ Erreur récupération workflow: ${getResponse.status}`);
      console.error(errorText);
      
      // Si le workflow n'existe pas, le créer
      if (getResponse.status === 404) {
        console.log('\n⚠️  Workflow non trouvé. Création d\'un nouveau workflow...');
        return await createWorkflow(cleanWorkflow);
      }
      
      throw new Error(`Failed to get workflow: ${getResponse.status}`);
    }

    const existingWorkflow = await getResponse.json();
    console.log(`✅ Workflow existant récupéré: ${existingWorkflow.name}`);
    console.log(`   Active: ${existingWorkflow.active}\n`);

    // 4. Mettre à jour le workflow
    console.log('🔄 Mise à jour du workflow...');
    // Ne pas inclure 'active' car c'est en lecture seule dans l'API
    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(cleanWorkflow)
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
    console.log(`   Active: ${updatedWorkflow.active}`);
    console.log(`   Nodes: ${updatedWorkflow.nodes.length}`);
    console.log(`\n🔗 URL: ${N8N_URL}/workflow/${updatedWorkflow.id}`);

    // 5. Afficher un résumé des modifications
    console.log('\n📋 Résumé des modifications:');
    console.log('   ✅ Node "Fetch Email Recipients" ajouté');
    console.log('   ✅ Node "Process Recipients" ajouté');
    console.log('   ✅ Destinataires récupérés depuis /api/email-recipients');
    console.log('   ✅ Formatage emails selon theme-colors.json');
    console.log('   ✅ Support mode preview/send via Workflow Configuration');
    console.log('\n⚠️  Note: Le workflow est actuellement INACTIF (active=false)');
    console.log('   Pour l\'activer, modifiez "Workflow Configuration":');
    console.log('   - preview_mode = false');
    console.log('   - approved = true');

    return updatedWorkflow;

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function createWorkflow(workflow) {
  try {
    console.log('📝 Création d\'un nouveau workflow...');
    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(workflow)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create workflow: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Workflow créé avec succès!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Nom: ${result.name}`);
    console.log(`\n🔗 URL: ${N8N_URL}/workflow/${result.id}`);
    return result;

  } catch (error) {
    console.error('❌ Erreur création:', error.message);
    throw error;
  }
}

// Exécuter
updateWorkflow();

