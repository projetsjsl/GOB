/**
 * Importe ou met à jour le workflow SMS dans n8n (chemins gob-sms-webhook / gob-sms-webhook-test)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || process.env.N8N_TOKEN || '';
const WORKFLOW_FILE = join(__dirname, 'n8n-workflows', 'sms-workflow.json');
const WORKFLOW_NAME = 'GOB Emma - SMS via Twilio';

if (!N8N_API_KEY) {
  console.error('❌ N8N_API_KEY manquant. Ajoutez-le dans .env ou exportez-le avant de lancer ce script.');
  process.exit(1);
}

async function callN8N(endpoint, options = {}) {
  const response = await fetch(`${N8N_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function upsertWorkflow() {
  console.log('📥 Chargement du workflow SMS local...');
  const payload = JSON.parse(readFileSync(WORKFLOW_FILE, 'utf-8'));
  console.log(`   → ${payload.name} (${payload.nodes.length} nodes)`);

  console.log('\n🔍 Recherche du workflow existant dans n8n...');
  const list = await callN8N('/api/v1/workflows');
  const existing = list.data?.find((wf) => wf.name === WORKFLOW_NAME);

  const body = {
    name: payload.name,
    nodes: payload.nodes,
    connections: payload.connections,
    settings: payload.settings || { executionOrder: 'v1' },
    staticData: payload.staticData || null
  };

  if (existing) {
    console.log(`   → Workflow existant trouvé (ID: ${existing.id})`);
    const result = await callN8N(`/api/v1/workflows/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    console.log('\n✅ Workflow SMS mis à jour.');
    console.log(`   URL: ${N8N_URL}/workflow/${result.id}`);
    return result;
  }

  console.log('   → Aucun workflow SMS trouvé, création en cours...');
  const created = await callN8N('/api/v1/workflows', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  console.log('\n✅ Workflow SMS créé.');
  console.log(`   URL: ${N8N_URL}/workflow/${created.id}`);
  return created;
}

upsertWorkflow().catch((error) => {
  console.error('\n❌ Impossible de synchroniser le workflow SMS:', error.message);
  process.exit(1);
});
