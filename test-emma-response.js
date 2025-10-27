/**
 * Test Emma Agent Response
 * Vérifie que Emma génère des réponses conversationnelles et non du JSON
 */

async function testEmmaAgent() {
    console.log('🧪 Test Emma Agent - Réponse conversationnelle\n');

    try {
        const testMessage = "Bonjour Emma, comment vas-tu ?";

        console.log(`📤 Message test: "${testMessage}"\n`);

        // Import de l'agent
        const { default: handler } = await import('./api/emma-agent.js');

        // Simuler une requête
        const mockReq = {
            method: 'POST',
            body: {
                message: testMessage,
                context: {
                    output_mode: 'chat',
                    tickers: []
                }
            }
        };

        const mockRes = {
            status: (code) => {
                console.log(`📊 Status: ${code}`);
                return mockRes;
            },
            json: (data) => {
                console.log('\n✅ Response reçue:\n');
                console.log('Success:', data.success);
                console.log('Intent:', data.intent);
                console.log('Confidence:', data.confidence);
                console.log('Tools used:', data.tools_used);
                console.log('Is reliable:', data.is_reliable);
                console.log('\n📝 Response content:');
                console.log('----------------------------------------');
                console.log(data.response);
                console.log('----------------------------------------');

                // Vérifications
                console.log('\n🔍 Vérifications:');

                if (typeof data.response === 'string') {
                    console.log('✅ Response est une string');
                } else {
                    console.log('❌ Response n\'est PAS une string:', typeof data.response);
                }

                if (data.response && data.response.length > 50) {
                    console.log('✅ Response a une longueur raisonnable:', data.response.length, 'caractères');
                } else {
                    console.log('⚠️ Response très courte:', data.response?.length || 0, 'caractères');
                }

                // Vérifier si c'est du JSON
                try {
                    JSON.parse(data.response);
                    console.log('⚠️ Response ressemble à du JSON brut (non conversationnel)');
                } catch (e) {
                    console.log('✅ Response est du texte conversationnel (pas du JSON)');
                }

                return mockRes;
            },
            setHeader: () => mockRes,
            end: () => mockRes
        };

        await handler(mockReq, mockRes);

    } catch (error) {
        console.error('\n❌ Erreur test:', error.message);
        console.error(error.stack);
    }
}

testEmmaAgent();
