/**
 * Test Emma REAL - teste le vrai emma-agent.js
 */

async function testEmmaReal() {
    console.log('🧪 Test Emma REAL - Appel direct du module\n');

    // Simuler l'environnement Vercel (clés nécessaires)
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key-placeholder';
    process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'test-key-placeholder';

    try {
        // Import du VRAI module
        const { default: handler } = await import('./api/emma-agent.js');

        // Simuler une requête HTTP
        const mockReq = {
            method: 'POST',
            body: {
                message: 'Bonjour Emma',
                context: {
                    output_mode: 'chat',
                    tickers: []
                }
            }
        };

        // Créer un mock de response
        let statusCode = null;
        let headers = {};
        let responseBody = null;

        const mockRes = {
            status: (code) => {
                statusCode = code;
                return mockRes;
            },
            setHeader: (key, value) => {
                headers[key] = value;
                return mockRes;
            },
            json: (data) => {
                responseBody = data;
                return mockRes;
            },
            end: () => mockRes
        };

        console.log('📤 Appel de emma-agent avec:', JSON.stringify(mockReq.body, null, 2));
        console.log('');

        // Appeler le handler
        await handler(mockReq, mockRes);

        console.log('📥 Réponse reçue:');
        console.log('Status:', statusCode);
        console.log('Response body:', JSON.stringify(responseBody, null, 2));
        console.log('');

        // Vérifications
        console.log('🔍 Vérifications:');

        if (!responseBody) {
            console.log('❌ PROBLÈME: Pas de réponse !');
            return;
        }

        if (responseBody.success === false) {
            console.log('❌ PROBLÈME: Échec de la requête');
            console.log('   Erreur:', responseBody.error);
            return;
        }

        console.log('✅ success:', responseBody.success);
        console.log('✅ response type:', typeof responseBody.response);

        if (typeof responseBody.response === 'string') {
            console.log('✅ response est une string');

            // Vérifier si c'est du JSON
            try {
                const parsed = JSON.parse(responseBody.response);
                console.log('❌ PROBLÈME: response est du JSON stringifié !');
                console.log('   Contenu parsé:', parsed);
            } catch (e) {
                console.log('✅ response est du texte conversationnel (pas du JSON)');
            }

            console.log('');
            console.log('📝 Contenu de la réponse:');
            console.log('----------------------------------------');
            console.log(responseBody.response);
            console.log('----------------------------------------');
        } else if (typeof responseBody.response === 'object') {
            console.log('❌ PROBLÈME: response est un OBJET, pas une string !');
            console.log('   Contenu:', JSON.stringify(responseBody.response, null, 2));
        } else {
            console.log('❌ PROBLÈME: response type inattendu:', typeof responseBody.response);
        }

        // Afficher autres champs
        console.log('');
        console.log('📊 Autres champs:');
        console.log('   intent:', responseBody.intent);
        console.log('   confidence:', responseBody.confidence);
        console.log('   output_mode:', responseBody.output_mode);
        console.log('   tools_used:', responseBody.tools_used);
        console.log('   execution_time_ms:', responseBody.execution_time_ms);

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error(error.stack);
    }
}

testEmmaReal();
