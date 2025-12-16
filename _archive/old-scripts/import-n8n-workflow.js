/**
 * Script pour importer le workflow n8n simplifié
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';

async function importWorkflow() {
  try {
    console.log('📥 Importation du workflow n8n simplifié...\n');

    // 1. Lire le workflow JSON
    const workflowPath = join(__dirname, 'n8n-workflow-simplified.json');
    const workflowData = JSON.parse(readFileSync(workflowPath, 'utf-8'));

    console.log(`✅ Workflow lu: ${workflowData.name}`);

    // 2. Créer le workflow via l'API n8n
    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify({
        name: workflowData.name,
        nodes: workflowData.nodes,
        connections: workflowData.connections,
        settings: {
          executionOrder: 'v1'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur HTTP ${response.status}:`);
      console.error(errorText);
      
      // Si le workflow existe déjà, essayer de le mettre à jour
      if (response.status === 409 || errorText.includes('already exists')) {
        console.log('\n⚠️  Le workflow existe déjà. Tentative de mise à jour...');
        return await updateExistingWorkflow(workflowData);
      }
      
      throw new Error(`Failed to create workflow: ${response.status}`);
    }

    const result = await response.json();
    console.log(`\n✅ Workflow créé avec succès!`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Nom: ${result.name}`);
    console.log(`   URL: ${N8N_URL}/workflow/${result.id}`);
    console.log(`   Status: ${result.active ? 'Actif' : 'Inactif'}\n`);

    console.log('📋 Prochaines étapes:');
    console.log('   1. Aller sur n8n et vérifier le workflow');
    console.log('   2. Configurer les variables d\'environnement (RESEND_API_KEY, ADMIN_EMAIL, etc.)');
    console.log('   3. Tester avec le Manual Trigger');
    console.log('   4. Activer le Schedule Trigger une fois testé\n');

    return result;

  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function updateExistingWorkflow(workflowData) {
  try {
    // 1. Lister les workflows existants pour trouver celui avec le même nom
    const listResponse = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list workflows: ${listResponse.status}`);
    }

    const workflows = await listResponse.json();
    const existingWorkflow = workflows.data?.find(w => w.name === workflowData.name);

    if (!existingWorkflow) {
      throw new Error('Workflow not found for update');
    }

    console.log(`   Trouvé workflow existant: ${existingWorkflow.id}`);

    // 2. Mettre à jour le workflow
    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${existingWorkflow.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify({
        ...existingWorkflow,
        nodes: workflowData.nodes,
        connections: workflowData.connections,
        name: workflowData.name
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
    }

    const result = await updateResponse.json();
    console.log(`\n✅ Workflow mis à jour avec succès!`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Nom: ${result.name}`);
    console.log(`   URL: ${N8N_URL}/workflow/${result.id}\n`);

    return result;

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
    throw error;
  }
}

// Exécuter
importWorkflow();

