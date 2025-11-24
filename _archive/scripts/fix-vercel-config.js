/**
 * Script pour vérifier et corriger la configuration Vercel
 * Utilise l'API Vercel pour vérifier les settings
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'prj_PwihMyEs0B8Kf3Pa4Dm9sPR0Of2p'; // GOB project ID

async function fixVercelConfig() {
  try {
    if (!VERCEL_TOKEN) {
      console.log('⚠️  VERCEL_TOKEN non configuré');
      console.log('   Pour obtenir le token: https://vercel.com/account/tokens');
      console.log('   Puis: export VERCEL_TOKEN=your_token');
      return;
    }

    console.log('🔧 Vérification de la configuration Vercel...\n');

    // 1. Vérifier les settings du projet
    const settingsResponse = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });

    if (!settingsResponse.ok) {
      throw new Error(`Failed to get project settings: ${settingsResponse.status}`);
    }

    const project = await settingsResponse.json();
    console.log('✅ Projet récupéré:', project.name);
    console.log(`   Root Directory: ${project.rootDirectory || './'}`);
    console.log(`   Framework: ${project.framework || 'N/A'}`);

    // 2. Vérifier si rootDirectory est correct
    if (project.rootDirectory && project.rootDirectory !== './' && project.rootDirectory !== '') {
      console.log('\n⚠️  Root Directory incorrect:', project.rootDirectory);
      console.log('   Correction nécessaire dans Vercel Dashboard');
    } else {
      console.log('   ✅ Root Directory correct');
    }

    // 3. Vérifier les déploiements
    const deploymentsResponse = await fetch(`https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&limit=1`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });

    if (deploymentsResponse.ok) {
      const deployments = await deploymentsResponse.json();
      if (deployments.deployments && deployments.deployments.length > 0) {
        const latest = deployments.deployments[0];
        console.log(`\n📦 Dernier déploiement: ${latest.uid}`);
        console.log(`   Status: ${latest.readyState}`);
        console.log(`   URL: ${latest.url}`);
      }
    }

    console.log('\n📋 Actions recommandées:');
    console.log('   1. Vérifier Root Directory dans Vercel Dashboard');
    console.log('   2. Forcer un redéploiement complet');
    console.log('   3. Vérifier les Functions dans le déploiement');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixVercelConfig();

