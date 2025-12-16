/**
 * Script pour importer automatiquement le workflow n8n corrigé avec la configuration Gemini
 * - Correction de l'erreur "access to env vars denied"
 * - Ajout du nœud "Fetch Gemini API Key from Vercel"
 * - Configuration automatique de la clé API Gemini
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

async function importWorkflow() {
  try {
    console.log('🚀 Importation automatique du workflow n8n corrigé...\n');
    console.log(`   Workflow ID: ${WORKFLOW_ID}`);
    console.log(`   URL n8n: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);

    // 1. Lire le workflow corrigé
    const workflowPath = join(__dirname, WORKFLOW_FILE);
    const workflowData = JSON.parse(readFileSync(workflowPath, 'utf-8'));

    console.log(`✅ Workflow lu: ${workflowData.name}`);
    console.log(`   Nodes: ${workflowData.nodes.length}`);
    console.log(`   Active: ${workflowData.active}\n`);

    // Vérifier que le workflow contient les corrections Gemini
    const hasGeminiFix = workflowData.nodes.some(n => n.name === 'Fetch Gemini API Key from Vercel');
    if (!hasGeminiFix) {
      console.warn('⚠️  Attention: Le workflow ne contient pas le nœud "Fetch Gemini API Key from Vercel"');
      console.warn('   Assurez-vous que le workflow a été corrigé avec fix-gemini-auto-config.js\n');
    } else {
      console.log('✅ Corrections Gemini détectées dans le workflow\n');
    }

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
    console.log('🔄 Mise à jour du workflow avec les corrections Gemini...');
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
      
      // Afficher plus de détails sur l'erreur
      try {
        const errorJson = JSON.parse(errorText);
        console.error('   Détails:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('   Réponse brute:', errorText.substring(0, 500));
      }
      
      throw new Error(`Failed to update workflow: ${updateResponse.status}`);
    }

    const updatedWorkflow = await updateResponse.json();
    console.log('\n✅ Workflow mis à jour avec succès!');
    console.log(`   ID: ${updatedWorkflow.id}`);
    console.log(`   Nom: ${updatedWorkflow.name}`);
    console.log(`   Active: ${updatedWorkflow.active}`);
    console.log(`   Nodes: ${updatedWorkflow.nodes.length}`);
    console.log(`\n🔗 URL: ${N8N_URL}/workflow/${updatedWorkflow.id}`);

    // 5. Afficher un résumé des modifications
    console.log('\n📋 Résumé des modifications Gemini:');
    console.log('   ✅ Nœud "Fetch Gemini API Key from Vercel" ajouté');
    console.log('   ✅ Nœud "Get Gemini API Key" modifié pour extraire depuis Vercel');
    console.log('   ✅ Nœud "Call Gemini API" utilise maintenant $json.gemini_api_key');
    console.log('   ✅ Connexions mises à jour automatiquement');
    console.log('\n🎯 Configuration automatique:');
    console.log('   ✅ La clé API Gemini est récupérée automatiquement depuis Vercel');
    console.log('   ✅ Aucune configuration manuelle requise dans n8n');
    console.log('   ✅ Si vous changez GEMINI_API_KEY dans Vercel, n8n l\'utilisera automatiquement');
    console.log('\n⚠️  Prérequis:');
    console.log(`   - L'endpoint ${process.env.VERCEL_URL || 'https://gob-projetsjsls-projects.vercel.app'}/api/gemini-key doit être accessible`);
    console.log('   - La variable GEMINI_API_KEY doit être configurée dans Vercel');

    return updatedWorkflow;

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    console.error('\n💡 Solutions possibles:');
    console.error('   1. Vérifiez que N8N_API_KEY est correcte dans les variables d\'environnement');
    console.error('   2. Vérifiez que vous avez accès au workflow dans n8n');
    console.error('   3. Vérifiez que le workflow JSON est valide');
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
importWorkflow();

