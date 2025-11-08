/**
 * Tester l'endpoint /api/emma-n8n?action=briefing
 */

const BASE_URL = 'https://gob.vercel.app';
const N8N_API_KEY = process.env.N8N_API_KEY || 'test';

async function testEmmaN8nBriefing() {
  try {
    console.log('🧪 Test de /api/emma-n8n?action=briefing...\n');

    const response = await fetch(`${BASE_URL}/api/emma-n8n?action=briefing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_API_KEY}`
      },
      body: JSON.stringify({
        type: 'morning',
        tickers: []
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.status === 404) {
      console.log('❌ 404 - Endpoint non trouvé');
      return;
    }

    if (response.status === 401 || response.status === 403) {
      console.log('⚠️  Authentification requise (normal si N8N_API_KEY n\'est pas configuré)');
      const text = await response.text();
      console.log(`Réponse: ${text.substring(0, 200)}`);
      return;
    }

    if (!response.ok) {
      const text = await response.text();
      console.log(`❌ Erreur ${response.status}: ${text.substring(0, 200)}`);
      return;
    }

    const data = await response.json();
    console.log('✅ Endpoint fonctionne!');
    console.log(`Type: ${data.type}`);
    console.log(`Briefing: ${data.briefing ? data.briefing.substring(0, 100) + '...' : 'N/A'}`);
    console.log(`Tools utilisés: ${data.tools_used?.length || 0}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testEmmaN8nBriefing();

