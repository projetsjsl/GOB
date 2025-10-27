/**
 * Test Emma - Greeting et question analytique
 */

async function testEmmaGreeting() {
    console.log('🧪 Test Emma - Greeting et Analyse\n');

    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key-placeholder';
    process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'test-key-placeholder';

    try {
        const { default: handler } = await import('./api/emma-agent.js');

        // Test 1: Greeting
        console.log('═══════════════════════════════════════');
        console.log('TEST 1: Greeting simple');
        console.log('═══════════════════════════════════════\n');

        await testMessage(handler, {
            message: 'Bonjour, qui es-tu ?',
            context: { output_mode: 'chat' }
        });

        console.log('\n');

        // Test 2: Question analytique avec ticker
        console.log('═══════════════════════════════════════');
        console.log('TEST 2: Question analytique avec ticker');
        console.log('═══════════════════════════════════════\n');

        await testMessage(handler, {
            message: 'Analyse la performance d\'Apple cette semaine',
            context: {
                output_mode: 'chat',
                tickers: ['AAPL']
            }
        });

        console.log('\n');

        // Test 3: Question conceptuelle
        console.log('═══════════════════════════════════════');
        console.log('TEST 3: Question conceptuelle');
        console.log('═══════════════════════════════════════\n');

        await testMessage(handler, {
            message: 'Explique-moi ce qu\'est le P/E ratio',
            context: { output_mode: 'chat' }
        });

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error(error.stack);
    }
}

async function testMessage(handler, body) {
    let responseBody = null;

    const mockRes = {
        status: (code) => mockRes,
        setHeader: (key, value) => mockRes,
        json: (data) => {
            responseBody = data;
            return mockRes;
        },
        end: () => mockRes
    };

    console.log('📤 Message:', body.message);
    if (body.context.tickers?.length) {
        console.log('📊 Tickers:', body.context.tickers.join(', '));
    }
    console.log('');

    await handler({ method: 'POST', body }, mockRes);

    console.log('📥 Réponse:');
    console.log('   Type:', typeof responseBody.response);

    if (typeof responseBody.response === 'string') {
        // Vérifier si JSON
        let isJSON = false;
        try {
            JSON.parse(responseBody.response);
            isJSON = true;
        } catch (e) {
            isJSON = false;
        }

        console.log('   Format:', isJSON ? '❌ JSON' : '✅ Texte conversationnel');
        console.log('   Longueur:', responseBody.response.length, 'caractères');
    } else if (typeof responseBody.response === 'object') {
        console.log('   Format: ❌ OBJET (devrait être string!)');
    }

    console.log('');
    console.log('📝 Contenu:');
    console.log('─────────────────────────────────────');
    if (typeof responseBody.response === 'string') {
        // Afficher premiers 500 caractères
        const preview = responseBody.response.substring(0, 500);
        console.log(preview);
        if (responseBody.response.length > 500) {
            console.log('\n[... truncated, ' + (responseBody.response.length - 500) + ' more chars]');
        }
    } else {
        console.log(JSON.stringify(responseBody.response, null, 2));
    }
    console.log('─────────────────────────────────────');

    console.log('');
    console.log('📊 Métadata:');
    console.log('   Success:', responseBody.success);
    console.log('   Intent:', responseBody.intent);
    console.log('   Confidence:', responseBody.confidence);
    console.log('   Tools used:', responseBody.tools_used?.length || 0);
    console.log('   Needs clarification:', responseBody.needs_clarification || false);
}

testEmmaGreeting();
