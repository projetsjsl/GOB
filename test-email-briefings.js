// ============================================================================
// Test Email Briefings System
// Script de test pour valider le système de briefings email
// ============================================================================

import fetch from 'node-fetch';

const BASE_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

console.log('🧪 Test du système Email Briefings');
console.log('=====================================');
console.log(`URL de base: ${BASE_URL}`);
console.log('');

// Fonction utilitaire pour les tests
async function testEndpoint(name, url, options = {}) {
    console.log(`\n📡 Test: ${name}`);
    console.log(`URL: ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Succès (${response.status})`);
            console.log(`Réponse:`, JSON.stringify(data, null, 2));
            return { success: true, data };
        } else {
            console.log(`❌ Erreur (${response.status})`);
            console.log(`Erreur:`, data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.log(`💥 Exception: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Tests des endpoints
async function runTests() {
    console.log('🚀 Démarrage des tests...\n');
    
    // Test 1: Collecte de données briefing matin
    const dataResult = await testEndpoint(
        'Collecte données briefing matin',
        `${BASE_URL}/api/briefing-data?type=morning`
    );
    
    if (!dataResult.success) {
        console.log('❌ Test des données échoué, arrêt des tests');
        return;
    }
    
    // Test 2: Recherche Perplexity
    const newsResult = await testEndpoint(
        'Recherche Perplexity',
        `${BASE_URL}/api/perplexity-search`,
        {
            method: 'POST',
            body: JSON.stringify({
                prompt: 'Recherche les actualités financières récentes',
                recency: 'day'
            })
        }
    );
    
    // Test 3: Analyse OpenAI
    const analysisResult = await testEndpoint(
        'Analyse OpenAI',
        `${BASE_URL}/api/openai-analysis`,
        {
            method: 'POST',
            body: JSON.stringify({
                prompt: 'Analyse les données de marché suivantes',
                marketData: dataResult.data?.data || {},
                news: newsResult.data?.content || 'Aucune actualité'
            })
        }
    );
    
    // Test 4: Sauvegarde briefing
    const saveResult = await testEndpoint(
        'Sauvegarde briefing',
        `${BASE_URL}/api/supabase-briefings`,
        {
            method: 'POST',
            body: JSON.stringify({
                type: 'morning',
                subject: 'Test Briefing Matin',
                html_content: '<html><body><h1>Test Briefing</h1></body></html>',
                market_data: dataResult.data?.data || {},
                analysis: analysisResult.data?.content || 'Test analyse'
            })
        }
    );
    
    // Test 5: Récupération historique
    const historyResult = await testEndpoint(
        'Récupération historique',
        `${BASE_URL}/api/supabase-briefings?limit=5`
    );
    
    // Test 6: Envoi email (simulation)
    const emailResult = await testEndpoint(
        'Envoi email (simulation)',
        `${BASE_URL}/api/resend-email`,
        {
            method: 'POST',
            body: JSON.stringify({
                recipients: ['test@example.com'],
                subject: 'Test Email Briefing',
                html: '<html><body><h1>Test Email</h1></body></html>'
            })
        }
    );
    
    // Résumé des tests
    console.log('\n📊 Résumé des tests');
    console.log('===================');
    console.log(`✅ Collecte données: ${dataResult.success ? 'OK' : 'ÉCHEC'}`);
    console.log(`✅ Recherche Perplexity: ${newsResult.success ? 'OK' : 'ÉCHEC'}`);
    console.log(`✅ Analyse OpenAI: ${analysisResult.success ? 'OK' : 'ÉCHEC'}`);
    console.log(`✅ Sauvegarde briefing: ${saveResult.success ? 'OK' : 'ÉCHEC'}`);
    console.log(`✅ Récupération historique: ${historyResult.success ? 'OK' : 'ÉCHEC'}`);
    console.log(`✅ Envoi email: ${emailResult.success ? 'OK' : 'ÉCHEC'}`);
    
    const successCount = [dataResult, newsResult, analysisResult, saveResult, historyResult, emailResult]
        .filter(r => r.success).length;
    
    console.log(`\n🎯 Score: ${successCount}/6 tests réussis`);
    
    if (successCount === 6) {
        console.log('🎉 Tous les tests sont passés avec succès !');
    } else if (successCount >= 4) {
        console.log('⚠️ La plupart des tests sont passés, quelques ajustements nécessaires');
    } else {
        console.log('❌ Plusieurs tests ont échoué, vérifiez la configuration');
    }
}

// Test des différents types de briefing
async function testAllBriefingTypes() {
    console.log('\n🔄 Test des différents types de briefing');
    console.log('========================================');
    
    const types = ['morning', 'noon', 'evening'];
    
    for (const type of types) {
        console.log(`\n📊 Test briefing ${type}...`);
        const result = await testEndpoint(
            `Briefing ${type}`,
            `${BASE_URL}/api/briefing-data?type=${type}`
        );
        
        if (result.success) {
            console.log(`✅ Données ${type} récupérées avec succès`);
            console.log(`   - Type: ${result.data.type}`);
            console.log(`   - Données disponibles: ${Object.keys(result.data.data || {}).join(', ')}`);
        } else {
            console.log(`❌ Échec du briefing ${type}`);
        }
    }
}

// Fonction principale
async function main() {
    try {
        await runTests();
        await testAllBriefingTypes();
        
        console.log('\n🏁 Tests terminés');
        console.log('================');
        console.log('Pour tester l\'interface utilisateur:');
        console.log('1. Ouvrez le dashboard dans votre navigateur');
        console.log('2. Cliquez sur l\'onglet "📧 Briefings Email"');
        console.log('3. Testez la génération de briefings');
        console.log('4. Vérifiez la prévisualisation et la sauvegarde');
        
    } catch (error) {
        console.error('💥 Erreur lors des tests:', error);
        process.exit(1);
    }
}

// Exécuter les tests si ce script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { runTests, testAllBriefingTypes };
