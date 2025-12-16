/**
 * Restaurer le workflow depuis le fichier JSON original
 * EN PRÉSERVANT les connexions actuelles de n8n
 * ET en appliquant uniquement la correction du subject
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function restoreWorkflow() {
  try {
    console.log('🔄 Restauration du workflow...\n');

    // 1. Récupérer le workflow actuel depuis n8n (pour préserver les connexions)
    console.log('📥 Récupération du workflow actuel depuis n8n...');
    const getResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get workflow: ${getResponse.status}`);
    }

    const currentWorkflow = await getResponse.json();
    console.log(`✅ Workflow actuel récupéré: ${currentWorkflow.name}`);
    console.log(`   Connexions: ${Object.keys(currentWorkflow.connections || {}).length} sources\n`);

    // 2. Lire le fichier JSON original (avec les corrections du subject)
    console.log('📖 Lecture du fichier JSON original...');
    const workflowPath = join(__dirname, 'n8n-workflow-03lgcA4e9uRTtli1.json');
    const originalWorkflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));
    console.log(`✅ Fichier JSON lu: ${originalWorkflow.name}`);
    console.log(`   Nodes: ${originalWorkflow.nodes.length}\n`);

    // 3. Créer un mapping des nœuds par ID pour faciliter la comparaison
    const originalNodesById = {};
    originalWorkflow.nodes.forEach(node => {
      originalNodesById[node.id] = node;
    });

    const currentNodesById = {};
    currentWorkflow.nodes.forEach(node => {
      currentNodesById[node.id] = node;
    });

    // 4. Mettre à jour les nœuds du workflow actuel avec ceux du fichier original
    // MAIS préserver les connexions actuelles
    console.log('🔧 Mise à jour des nœuds...');
    const updatedNodes = currentWorkflow.nodes.map(currentNode => {
      const originalNode = originalNodesById[currentNode.id];
      
      if (originalNode) {
        // Utiliser le nœud original (qui a les corrections du subject)
        // Mais préserver les credentials et webhookId du nœud actuel
        return {
          ...originalNode,
          credentials: currentNode.credentials || originalNode.credentials,
          webhookId: currentNode.webhookId || originalNode.webhookId
        };
      } else {
        // Si le nœud n'existe pas dans l'original, le garder tel quel
        console.log(`   ⚠️  Nœud "${currentNode.name}" (${currentNode.id}) non trouvé dans l'original, conservé tel quel`);
        return currentNode;
      }
    });

    // 5. Ajouter les nœuds de l'original qui n'existent pas dans le workflow actuel
    originalWorkflow.nodes.forEach(originalNode => {
      if (!currentNodesById[originalNode.id]) {
        console.log(`   ➕ Ajout du nœud "${originalNode.name}" (${originalNode.id})`);
        updatedNodes.push(originalNode);
      }
    });

    // 6. Préserver TOUTES les connexions actuelles
    console.log('\n🔗 Préservation des connexions actuelles...');
    const preservedConnections = currentWorkflow.connections;

    // 7. Préserver aussi les autres propriétés importantes
    // Note: 'active' est en lecture seule dans l'API, ne pas l'inclure
    const restoredWorkflow = {
      name: originalWorkflow.name,
      nodes: updatedNodes,
      connections: preservedConnections, // ⚠️ IMPORTANT: Préserver les connexions actuelles
      settings: currentWorkflow.settings || originalWorkflow.settings,
      staticData: currentWorkflow.staticData || originalWorkflow.staticData
      // active est en lecture seule, ne pas l'inclure
    };

    // 8. Mettre à jour le workflow dans n8n
    console.log('🔄 Mise à jour du workflow dans n8n...');
    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(restoredWorkflow)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`❌ Erreur mise à jour: ${updateResponse.status}`);
      console.error(errorText);
      throw new Error(`Failed to update workflow: ${updateResponse.status}`);
    }

    const result = await updateResponse.json();
    console.log('\n✅ Workflow restauré avec succès!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Nom: ${result.name}`);
    console.log(`   Nodes: ${result.nodes.length}`);
    console.log(`   Connexions: ${Object.keys(result.connections || {}).length} sources`);
    console.log(`   Active: ${result.active}`);
    console.log(`\n🔗 URL: ${N8N_URL}/workflow/${result.id}`);

    console.log('\n📋 Résumé:');
    console.log('   ✅ Nœuds restaurés depuis le fichier JSON original');
    console.log('   ✅ Connexions préservées depuis n8n');
    console.log('   ✅ Corrections du subject appliquées');
    console.log('   ✅ Credentials et webhookId préservés');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécuter
restoreWorkflow();

