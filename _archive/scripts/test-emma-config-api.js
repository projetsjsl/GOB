/**
 * Test des API Emma Config via HTTP
 * Ne nécessite pas de credentials Supabase locaux
 *
 * Usage: node test-emma-config-api.js
 */

const BASE_URL = 'https://gobapps.com';

async function testAPI(name, url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            console.log(`   ❌ ${name}: ${response.status} - ${data.error || JSON.stringify(data)}`);
            return { success: false, data };
        }

        console.log(`   ✅ ${name}: OK`);
        return { success: true, data };
    } catch (error) {
        console.log(`   ❌ ${name}: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🔍 Test des API Emma Config');
    console.log('='.repeat(70));

    const results = {};

    // Test 1: Admin Emma Config
    console.log('\n📝 Test 1/4: GET /api/admin/emma-config');
    results.adminConfig = await testAPI(
        'Admin Emma Config',
        `${BASE_URL}/api/admin/emma-config`
    );

    // Test 2: Email Design
    console.log('\n🎨 Test 2/4: GET /api/email-design');
    results.emailDesign = await testAPI(
        'Email Design',
        `${BASE_URL}/api/email-design`
    );

    // Test 3: Prompt Delivery Config (liste)
    console.log('\n📧 Test 3/4: GET /api/prompt-delivery-config');
    results.deliveryList = await testAPI(
        'Prompt Delivery Config (liste)',
        `${BASE_URL}/api/prompt-delivery-config`
    );

    // Test 4: Prompt Delivery Config (specifique)
    console.log('\n📧 Test 4/4: GET /api/prompt-delivery-config?prompt_id=briefing_morning');
    results.deliverySpecific = await testAPI(
        'Prompt Delivery Config (briefing_morning)',
        `${BASE_URL}/api/prompt-delivery-config?prompt_id=briefing_morning`
    );

    // Résumé
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(70));

    const tests = [
        ['Admin Emma Config', results.adminConfig.success],
        ['Email Design', results.emailDesign.success],
        ['Prompt Delivery List', results.deliveryList.success],
        ['Prompt Delivery Specific', results.deliverySpecific.success]
    ];

    let passedCount = 0;
    tests.forEach(([name, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${name}`);
        if (passed) passedCount++;
    });

    console.log('─'.repeat(70));
    console.log(`Score: ${passedCount}/${tests.length} tests réussis`);

    // Analyse détaillée
    console.log('\n📋 ANALYSE DÉTAILLÉE');
    console.log('='.repeat(70));

    if (results.adminConfig.success) {
        const config = results.adminConfig.data.config;
        if (config && config.prompts) {
            const promptCount = Object.keys(config.prompts).length;
            console.log(`✅ Admin Config: ${promptCount} prompts trouvés`);
        }
    }

    if (results.emailDesign.success) {
        const design = results.emailDesign.data;
        console.log(`✅ Email Design: ${design.branding?.companyName || 'GOB Apps'}`);
    }

    if (results.deliveryList.success) {
        const count = results.deliveryList.data.count || 0;
        console.log(`${count > 0 ? '✅' : '⚠️ '} Prompt Delivery: ${count} prompts actifs`);
        if (count === 0) {
            console.log('   ℹ️  Aucun prompt configuré pour delivery automatique');
        }
    } else {
        console.log('❌ Prompt Delivery List: API ne fonctionne pas');
    }

    if (!results.deliverySpecific.success) {
        console.log('❌ Prompt Delivery Specific: briefing_morning non trouvé');
        console.log('   💡 Cause probable: Table Supabase pas configurée');
        console.log('   📌 Action: Exécuter supabase-prompt-delivery-config-FIXED.sql');
    }

    // Recommandations
    console.log('\n🎯 RECOMMANDATIONS');
    console.log('='.repeat(70));

    if (passedCount === tests.length) {
        console.log('✅ Toutes les APIs fonctionnent!');
        console.log('   Vous pouvez utiliser https://gobapps.com/emma-config.html');
    } else if (!results.deliveryList.success || !results.deliverySpecific.success) {
        console.log('⚠️  Configuration Supabase manquante ou incomplète');
        console.log('\n📋 ÉTAPES À SUIVRE:');
        console.log('   1. Ouvrir https://supabase.com → Sélectionner votre projet');
        console.log('   2. Aller dans "SQL Editor" (menu gauche)');
        console.log('   3. Copier le contenu de: supabase-prompt-delivery-config-FIXED.sql');
        console.log('   4. Coller dans SQL Editor et cliquer "Run"');
        console.log('   5. Relancer ce test: node test-emma-config-api.js');
        console.log('   6. Déployer sur Vercel: git push origin main');
    } else {
        console.log('⚠️  Problème partiel détecté');
        console.log('   💡 Vérifiez le fichier DIAGNOSTIC-EMMA-CONFIG.md pour plus de détails');
    }

    console.log('\n');
    process.exit(passedCount >= 3 ? 0 : 1);
}

main();
