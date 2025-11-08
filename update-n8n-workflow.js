/**
 * Script pour mettre à jour le workflow n8n existant
 * ID: 03lgcA4e9uRTtli1
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function updateWorkflow() {
  try {
    console.log('📥 Mise à jour du workflow n8n existant...\n');
    console.log(`   Workflow ID: ${WORKFLOW_ID}`);
    console.log(`   URL: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);

    // 1. Lire le workflow simplifié
    const workflowPath = join(__dirname, 'n8n-workflow-simplified.json');
    const newWorkflowData = JSON.parse(readFileSync(workflowPath, 'utf-8'));

    console.log(`✅ Workflow simplifié lu: ${newWorkflowData.name}`);

    // 2. Récupérer le workflow existant pour préserver certaines propriétés
    const getResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`Failed to get existing workflow: ${getResponse.status} - ${errorText}`);
    }

    const existingWorkflow = await getResponse.json();
    console.log(`✅ Workflow existant récupéré: ${existingWorkflow.name}`);

    // 3. Mettre à jour avec les nouveaux nodes et connections
    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify({
        name: newWorkflowData.name,
        nodes: newWorkflowData.nodes,
        connections: newWorkflowData.connections,
        settings: existingWorkflow.settings || {
          executionOrder: 'v1'
        }
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`❌ Erreur HTTP ${updateResponse.status}:`);
      console.error(errorText);
      throw new Error(`Failed to update workflow: ${updateResponse.status}`);
    }

    const result = await updateResponse.json();
    console.log(`\n✅ Workflow mis à jour avec succès!`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Nom: ${result.name}`);
    console.log(`   URL: ${N8N_URL}/workflow/${result.id}`);
    console.log(`   Status: ${result.active ? 'Actif' : 'Inactif'}\n`);

    console.log('📋 Changements appliqués:');
    console.log('   ✅ Nodes simplifiés (6 nodes au lieu de 22)');
    console.log('   ✅ Appelle /api/briefing au lieu des APIs directes');
    console.log('   ✅ Prompts dans config/briefing-prompts.json (versionnés)');
    console.log('   ✅ Templates HTML différents par type');
    console.log('   ✅ Confirmation email automatique\n');

    console.log('📋 Prochaines étapes:');
    console.log('   1. Aller sur n8n et vérifier le workflow');
    console.log('   2. Configurer les variables d\'environnement (RESEND_API_KEY, ADMIN_EMAIL, etc.)');
    console.log('   3. Tester avec le Manual Trigger');
    console.log('   4. Activer le Schedule Trigger une fois testé\n');

    return result;

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécuter
updateWorkflow();

