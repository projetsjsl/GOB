/**
 * Vérifier le déploiement de /api/briefing
 */

const BASE_URL = 'https://gob.vercel.app';

async function checkDeployment() {
  console.log('🔍 Vérification du déploiement /api/briefing...\n');

  // Test 1: Endpoint briefing
  console.log('1. Test /api/briefing?type=morning');
  try {
    const response = await fetch(`${BASE_URL}/api/briefing?type=morning`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 404) {
      console.log('   ❌ 404 - Endpoint non trouvé');
      console.log('   ⚠️  Le fichier n\'est peut-être pas encore déployé');
    } else if (response.status === 200) {
      const data = await response.json();
      console.log('   ✅ Endpoint fonctionne!');
      console.log(`   Type: ${data.type}`);
      console.log(`   Sujet: ${data.subject}`);
    } else {
      const text = await response.text();
      console.log(`   ⚠️  Status ${response.status}: ${text.substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }

  // Test 2: Endpoint existant pour comparaison
  console.log('\n2. Test /api/chat (pour comparaison)');
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' })
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.status !== 404) {
      console.log('   ✅ /api/chat fonctionne (endpoint de référence)');
    }
  } catch (error) {
    console.log(`   ⚠️  Erreur: ${error.message}`);
  }

  // Test 3: Vérifier si le fichier existe dans le repo
  console.log('\n3. Vérification locale');
  const fs = await import('fs');
  const path = await import('path');
  const briefingPath = path.join(process.cwd(), 'api', 'briefing.js');
  
  if (fs.existsSync(briefingPath)) {
    const stats = fs.statSync(briefingPath);
    console.log(`   ✅ Fichier existe: api/briefing.js`);
    console.log(`   Taille: ${stats.size} bytes`);
    console.log(`   Modifié: ${stats.mtime.toISOString()}`);
  } else {
    console.log('   ❌ Fichier non trouvé localement');
  }

  console.log('\n📋 Recommandations:');
  console.log('   1. Vérifier sur Vercel: https://vercel.com/projetsjsl/gob/deployments');
  console.log('   2. Vérifier que le dernier déploiement est "Ready"');
  console.log('   3. Vérifier dans "Functions" que api/briefing.js apparaît');
  console.log('   4. Si absent, vérifier les logs de build');
}

checkDeployment();

