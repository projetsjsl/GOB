/**
 * Script pour supprimer les Production Overrides dans Vercel via l'API
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'prj_PwihMyEs0B8Kf3Pa4Dm9sPR0Of2p'; // GOB project ID

async function removeProductionOverrides() {
  try {
    if (!VERCEL_TOKEN) {
      console.log('⚠️  VERCEL_TOKEN non configuré');
      console.log('   Pour obtenir le token: https://vercel.com/account/tokens');
      console.log('   Puis: export VERCEL_TOKEN=your_token');
      return;
    }

    console.log('🔧 Suppression des Production Overrides dans Vercel...\n');

    // 1. Récupérer la configuration actuelle du projet
    const getResponse = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`Failed to get project: ${getResponse.status} - ${errorText}`);
    }

    const project = await getResponse.json();
    console.log(`✅ Projet récupéré: ${project.name}`);
    console.log(`   Root Directory: ${project.rootDirectory || '(vide)'}`);
    console.log(`   Framework: ${project.framework || 'N/A'}`);

    // 2. Mettre à jour le projet pour supprimer les overrides
    // Les Production Overrides ne sont pas directement modifiables via l'API
    // Mais on peut s'assurer que rootDirectory est correct
    const updateData = {
      rootDirectory: null, // Supprimer rootDirectory si défini
      framework: 'vite' // S'assurer que le framework est Vite
    };

    const updateResponse = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.log(`⚠️  Impossible de mettre à jour via API: ${updateResponse.status}`);
      console.log(`   ${errorText}`);
      console.log('\n💡 Les Production Overrides doivent être supprimés manuellement dans le dashboard Vercel.');
      return;
    }

    const updated = await updateResponse.json();
    console.log('✅ Projet mis à jour!');
    console.log(`   Root Directory: ${updated.rootDirectory || '(vide)'}`);
    console.log(`   Framework: ${updated.framework || 'N/A'}`);

    // 3. Forcer un redéploiement
    console.log('\n🚀 Déclenchement d\'un nouveau déploiement...');
    
    // Créer un commit vide pour déclencher un déploiement
    const { execSync } = await import('child_process');
    try {
      execSync('git commit --allow-empty -m "chore: Force redeploy after removing production overrides"', { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('\n✅ Commit vide créé et poussé - Vercel va redéployer automatiquement');
    } catch (error) {
      console.log('\n⚠️  Impossible de créer un commit automatiquement');
      console.log('   Créez un commit vide manuellement:');
      console.log('   git commit --allow-empty -m "chore: Force redeploy"');
      console.log('   git push origin main');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Solution manuelle:');
    console.log('   1. Allez sur https://vercel.com/dashboard');
    console.log('   2. Sélectionnez le projet GOB');
    console.log('   3. Settings → General');
    console.log('   4. Supprimez les Production Overrides');
    console.log('   5. Vérifiez que Root Directory est vide');
    console.log('   6. Redéployez le projet');
  }
}

removeProductionOverrides();

