/**
 * Test script pour /api/briefing
 * 
 * Usage:
 * node test-briefing-endpoint.js [type]
 * 
 * Exemples:
 * node test-briefing-endpoint.js morning
 * node test-briefing-endpoint.js midday
 * node test-briefing-endpoint.js evening
 */

const type = process.argv[2] || 'morning';
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

console.log(`🧪 Test de /api/briefing avec type: ${type}`);
console.log(`📍 URL: ${baseUrl}/api/briefing?type=${type}\n`);

async function testBriefing() {
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${baseUrl}/api/briefing?type=${type}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur HTTP ${response.status}:`);
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();

    if (!data.success) {
      console.error(`❌ Erreur dans la réponse:`);
      console.error(data);
      process.exit(1);
    }

    console.log(`✅ Succès! (${duration}ms)\n`);
    console.log(`📊 Résultats:`);
    console.log(`   Type: ${data.type}`);
    console.log(`   Sujet: ${data.subject}`);
    console.log(`   Contenu: ${data.content.substring(0, 200)}...`);
    console.log(`   HTML: ${data.html_content ? `${data.html_content.length} chars` : 'N/A'}`);
    console.log(`   Tickers: ${data.metadata.tickers.length} (${data.metadata.tickers.slice(0, 5).join(', ')}...)`);
    console.log(`   Tools utilisés: ${data.metadata.tools_used.length}`);
    console.log(`   Temps d'exécution: ${data.metadata.execution_time_ms}ms`);
    console.log(`   Généré à: ${data.metadata.generated_at}\n`);

    // Vérifier que le HTML contient les éléments attendus
    if (data.html_content) {
      const htmlChecks = {
        'DOCTYPE html': data.html_content.includes('<!DOCTYPE html>'),
        'Type dans header': data.html_content.includes(data.type),
        'Contenu': data.html_content.includes(data.content.substring(0, 50)),
        'Tickers': data.metadata.tickers.length > 0 ? data.html_content.includes(data.metadata.tickers[0]) : true
      };

      console.log(`🔍 Vérifications HTML:`);
      Object.entries(htmlChecks).forEach(([check, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${check}`);
      });
    }

    console.log(`\n✅ Test réussi!`);

  } catch (error) {
    console.error(`❌ Erreur lors du test:`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testBriefing();

