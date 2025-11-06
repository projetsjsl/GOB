const fetch = require('node-fetch');

async function testEmmaMSFT() {
  console.log('🧪 Test Emma V3.0 - Analyse MSFT (Web Channel)');
  console.log('═══════════════════════════════════════════════\n');

  try {
    const response = await fetch('http://localhost:5173/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'analyse msft',
        channel: 'web',  // 🌐 FORCE WEB (pas SMS!)
        channel_identifier: 'test_web_user'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Réponse Emma reçue:\n');
      console.log(data.response);
      console.log('\n═══════════════════════════════════════════════');
      console.log(`📊 Longueur: ${data.response.length} caractères (~${Math.round(data.response.split(' ').length)} mots)`);
      console.log(`📏 Attendu V3.0: 10,000-20,000 caractères (3000-5000 mots)`);
      
      // Vérifications V3.0
      const checks = {
        'Longueur > 10000 chars': data.response.length > 10000,
        'Contexte macro (Fed/inflation)': /fed|inflation|taux|interest rate/i.test(data.response),
        'Ratios historiques (5 ans)': /5 ans|historique|moyenne.*ans/i.test(data.response),
        'Value investing (moat/DCF)': /moat|dcf|valeur intrinsèque|marge.*sécurité/i.test(data.response),
        'Comparaisons internationales': /usa.*canada|europe.*asie|vs.*pays/i.test(data.response),
        'Questions suggérées': /questions.*approfondir|voulez-vous|souhaitez-vous/i.test(data.response)
      };
      
      console.log('\n🔍 Vérifications V3.0:');
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${check}`);
      });
      
      const score = Object.values(checks).filter(Boolean).length;
      console.log(`\n🎯 Score V3.0: ${score}/6`);
      
      if (score < 4) {
        console.log('\n⚠️  PROBLÈME: Emma ne respecte pas les standards V3.0!');
        console.log('   → Vérifier que le serveur a redémarré après les changements');
      } else {
        console.log('\n✅ Emma V3.0 fonctionne correctement!');
      }
      
    } else {
      console.error('❌ Erreur:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
    console.log('\n💡 Assure-toi que le serveur est lancé: npm run dev');
  }
}

testEmmaMSFT();
