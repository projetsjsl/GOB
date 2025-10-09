// Script de test pour diagnostiquer les problèmes avec l'API Gemini
import https from 'https';

// Fonction pour tester l'API Gemini avec une clé de test
async function testGeminiAPI(apiKey) {
    console.log('🧪 Test de l\'API Gemini...');
    console.log(`🔑 Clé API: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NON FOURNIE'}`);
    
    if (!apiKey) {
        console.log('❌ Aucune clé API fournie');
        return;
    }
    
    const testPrompt = "Répondez simplement 'Test réussi' si vous recevez ce message.";
    
    const requestData = JSON.stringify({
        contents: [{
            parts: [{
                text: testPrompt
            }]
        }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50,
        }
    });
    
    const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            console.log(`📡 Status: ${res.statusCode}`);
            console.log(`📋 Headers:`, res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('📊 Réponse complète:', JSON.stringify(response, null, 2));
                    
                    if (res.statusCode === 200) {
                        console.log('✅ Succès !');
                        
                        // Analyser la structure de la réponse
                        if (response.candidates && response.candidates[0]) {
                            const candidate = response.candidates[0];
                            console.log('🔍 Structure candidates[0]:', JSON.stringify(candidate, null, 2));
                            
                            if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                                console.log('✅ Structure standard trouvée');
                                console.log('📝 Texte:', candidate.content.parts[0].text);
                            } else if (candidate.text) {
                                console.log('✅ Structure alternative trouvée (candidate.text)');
                                console.log('📝 Texte:', candidate.text);
                            } else {
                                console.log('❌ Structure inattendue dans candidate');
                            }
                        } else {
                            console.log('❌ Pas de candidates dans la réponse');
                        }
                        
                        resolve(response);
                    } else {
                        console.log('❌ Erreur API:', response);
                        reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(response)}`));
                    }
                } catch (error) {
                    console.log('❌ Erreur parsing JSON:', error);
                    console.log('📄 Données brutes:', data);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Erreur requête:', error);
            reject(error);
        });
        
        req.write(requestData);
        req.end();
    });
}

// Test avec différentes clés API
async function runTests() {
    console.log('🚀 Démarrage des tests de diagnostic Gemini\n');
    
    // Test 1: Clé invalide
    console.log('=== TEST 1: Clé invalide ===');
    try {
        await testGeminiAPI('invalid_key_test');
    } catch (error) {
        console.log('✅ Erreur attendue avec clé invalide:', error.message);
    }
    
    console.log('\n=== TEST 2: Clé vide ===');
    try {
        await testGeminiAPI('');
    } catch (error) {
        console.log('✅ Erreur attendue avec clé vide:', error.message);
    }
    
    console.log('\n=== TEST 3: Clé depuis variable d\'environnement ===');
    const envApiKey = process.env.GEMINI_API_KEY;
    if (envApiKey) {
        try {
            await testGeminiAPI(envApiKey);
        } catch (error) {
            console.log('❌ Erreur avec clé d\'environnement:', error.message);
        }
    } else {
        console.log('⚠️ Variable GEMINI_API_KEY non définie');
    }
    
    console.log('\n🎉 Tests terminés !');
}

// Exécuter les tests
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { testGeminiAPI };
