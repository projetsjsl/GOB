// ========================================
// TEST GEMINI WITH FUNCTION CALLING
// Script de test pour valider l'API avec function calling
// ========================================

import https from 'https';

// Configuration
const API_BASE_URL = 'https://gob-jsla.vercel.app'; // Remplacez par votre URL Vercel
const TEST_QUESTIONS = [
    "Quel est le prix actuel de Tesla (TSLA) ?",
    "Donne-moi les dernières actualités sur Apple (AAPL)",
    "Compare Microsoft (MSFT) et Google (GOOGL) en termes de capitalisation boursière",
    "Analyse les données de marché de NVIDIA (NVDA)",
    "Quelles sont les actualités récentes sur les actions canadiennes comme TD Bank (TD) ?"
];

// Fonction pour tester l'API
async function testGeminiWithFunctions(question, temperature = 0.3) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: question,
            temperature: temperature
        });

        const options = {
            hostname: 'gob-jsla.vercel.app',
            port: 443,
            path: '/api/gemini-with-functions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        response: response,
                        question: question
                    });
                } catch (error) {
                    reject({
                        status: res.statusCode,
                        error: error.message,
                        rawData: data,
                        question: question
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject({
                error: error.message,
                question: question
            });
        });

        req.write(postData);
        req.end();
    });
}

// Fonction principale de test
async function runTests() {
    console.log('🧪 Test de Gemini avec Function Calling');
    console.log('=====================================\n');

    const results = [];
    
    for (let i = 0; i < TEST_QUESTIONS.length; i++) {
        const question = TEST_QUESTIONS[i];
        console.log(`\n📝 Test ${i + 1}/${TEST_QUESTIONS.length}: ${question}`);
        console.log('─'.repeat(80));
        
        try {
            const result = await testGeminiWithFunctions(question);
            results.push(result);
            
            if (result.status === 200) {
                console.log('✅ Succès');
                console.log(`📊 Réponse (${result.response.response?.length || 0} caractères):`);
                console.log(result.response.response?.substring(0, 200) + '...');
                console.log(`🌡️ Température utilisée: ${result.response.temperature}`);
                console.log(`🔧 Source: ${result.response.source}`);
            } else {
                console.log('❌ Erreur HTTP:', result.status);
                console.log('📄 Réponse:', result.response);
            }
        } catch (error) {
            console.log('❌ Erreur:', error.error || error.message);
            results.push({
                status: 'error',
                error: error.error || error.message,
                question: question
            });
        }
        
        // Pause entre les tests pour éviter les limites de taux
        if (i < TEST_QUESTIONS.length - 1) {
            console.log('\n⏳ Pause de 2 secondes...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Résumé des résultats
    console.log('\n📋 RÉSUMÉ DES TESTS');
    console.log('==================');
    
    const successful = results.filter(r => r.status === 200).length;
    const failed = results.filter(r => r.status !== 200).length;
    
    console.log(`✅ Tests réussis: ${successful}/${TEST_QUESTIONS.length}`);
    console.log(`❌ Tests échoués: ${failed}/${TEST_QUESTIONS.length}`);
    
    if (failed > 0) {
        console.log('\n🔍 DÉTAILS DES ÉCHECS:');
        results.filter(r => r.status !== 200).forEach((result, index) => {
            console.log(`${index + 1}. ${result.question}`);
            console.log(`   Erreur: ${result.error || result.response?.error || 'Inconnue'}`);
        });
    }
    
    console.log('\n🎯 RECOMMANDATIONS:');
    if (successful === TEST_QUESTIONS.length) {
        console.log('✅ Tous les tests sont passés ! L\'API Function Calling fonctionne parfaitement.');
        console.log('✅ Emma peut maintenant accéder aux données financières en temps réel.');
    } else if (successful > 0) {
        console.log('⚠️  Certains tests ont échoué. Vérifiez la configuration des APIs.');
        console.log('🔧 Assurez-vous que les variables d\'environnement sont correctement configurées.');
    } else {
        console.log('❌ Tous les tests ont échoué. Vérifiez la configuration complète.');
        console.log('🔧 Vérifiez: GEMINI_API_KEY, déploiement Vercel, et connectivité réseau.');
    }
}

// Exécuter les tests si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { testGeminiWithFunctions, runTests };
