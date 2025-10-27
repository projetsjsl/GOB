/**
 * Test Emma simple - voir réponse exacte
 */

async function testEmmaSimple() {
    console.log('🧪 Test Emma - Question simple\n');

    // Simuler l'environnement Vercel (sans vraie clé pour le test)
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test';

    try {
        // Import du module
        const emmaModule = await import('./api/emma-agent.js');
        const SmartAgent = emmaModule.default.SmartAgent || emmaModule.SmartAgent;

        // Créer instance
        const agent = new (class SmartAgent {
            constructor() {
                this.toolsConfig = { tools: [], config: { max_concurrent_tools: 5, timeout_ms: 10000 } };
                this.usageStats = {};
                this.conversationHistory = [];
                this.intentAnalyzer = {
                    analyze: async () => ({
                        intent: 'stock_price',
                        confidence: 0.9,
                        tickers: [],
                        suggested_tools: [],
                        parameters: {},
                        needs_clarification: false,
                        clarification_questions: [],
                        user_intent_summary: 'Test'
                    })
                };
            }

            async processRequest(message, context) {
                console.log('📤 Message:', message);
                console.log('📋 Context:', JSON.stringify(context, null, 2));

                // Simuler une réponse simple
                const mockResponse = "Bonjour ! Je suis Emma, votre assistante financière. Comment puis-je vous aider aujourd'hui ?";

                return {
                    success: true,
                    response: mockResponse,
                    tools_used: [],
                    intent: 'greeting',
                    confidence: 0.9,
                    output_mode: context.output_mode || 'chat',
                    execution_time_ms: 100,
                    is_reliable: true
                };
            }
        })();

        // Tester
        const result = await agent.processRequest('Bonjour', { output_mode: 'chat' });

        console.log('\n📥 Result:');
        console.log('Success:', result.success);
        console.log('Response type:', typeof result.response);
        console.log('Response:');
        console.log('----------------------------------------');
        console.log(result.response);
        console.log('----------------------------------------');

        // Vérifier le format
        console.log('\n🔍 Vérifications:');
        if (typeof result.response === 'string') {
            console.log('✅ response est une string');

            // Vérifier si c'est du JSON
            try {
                JSON.parse(result.response);
                console.log('❌ PROBLÈME: response est du JSON, pas du texte conversationnel !');
            } catch (e) {
                console.log('✅ response est du texte conversationnel (pas du JSON)');
            }
        } else if (typeof result.response === 'object') {
            console.log('❌ PROBLÈME: response est un objet, pas une string !');
            console.log('   Contenu:', JSON.stringify(result.response, null, 2));
        } else {
            console.log('❌ PROBLÈME: response type inattendu:', typeof result.response);
        }

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error(error.stack);
    }
}

testEmmaSimple();
