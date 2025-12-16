#!/usr/bin/env node

/**
 * Script de diagnostic SMS Emma
 * 
 * Teste pourquoi Emma ne répond pas complètement via SMS
 */

console.log('🔍 DIAGNOSTIC SMS EMMA\n');
console.log('='.repeat(60));

// Vérifier les variables d'environnement critiques
console.log('\n📋 VARIABLES D\'ENVIRONNEMENT:');
console.log('  PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? '✅ Configurée' : '❌ MANQUANTE');
console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Configurée' : '❌ MANQUANTE');
console.log('  TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configurée' : '❌ MANQUANTE');
console.log('  TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configurée' : '❌ MANQUANTE');
console.log('  TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || '❌ MANQUANTE');

// Tester l'API chat avec un message simple
console.log('\n🧪 TEST API CHAT (simulation SMS):');
console.log('  Message: "Analyse MSFT"');
console.log('  Canal: sms');
console.log('  User: +14183185826\n');

async function testChatAPI() {
    try {
        // Import du module chat
        const chatModule = await import('./api/chat.js');

        const chatRequest = {
            method: 'POST',
            body: {
                message: 'Analyse MSFT',
                userId: '+14183185826',
                channel: 'sms',
                metadata: {
                    test: true
                }
            }
        };

        let chatResponseData = null;
        const chatRes = {
            status: (code) => ({
                json: (data) => {
                    chatResponseData = data;
                    return chatResponseData;
                }
            }),
            setHeader: () => { }
        };

        console.log('⏳ Appel de /api/chat en cours...\n');
        const startTime = Date.now();

        await chatModule.default(chatRequest, chatRes);

        const duration = Date.now() - startTime;

        console.log('='.repeat(60));
        console.log('📊 RÉSULTAT DU TEST:');
        console.log('='.repeat(60));

        if (!chatResponseData) {
            console.log('❌ Aucune réponse reçue');
            return;
        }

        if (chatResponseData.success) {
            console.log('✅ Succès!');
            console.log(`⏱️  Durée: ${duration}ms`);
            console.log(`📝 Réponse (${chatResponseData.response?.length || 0} chars):`);
            console.log('─'.repeat(60));
            console.log(chatResponseData.response?.substring(0, 500));
            if (chatResponseData.response?.length > 500) {
                console.log(`\n... (${chatResponseData.response.length - 500} chars de plus)`);
            }
            console.log('─'.repeat(60));

            if (chatResponseData.metadata) {
                console.log('\n📊 Métadonnées:');
                console.log(`  - Modèle: ${chatResponseData.metadata.model || 'Unknown'}`);
                console.log(`  - Intent: ${chatResponseData.metadata.intent?.intent || 'Unknown'}`);
                console.log(`  - Tools: ${chatResponseData.metadata.tools_used?.length || 0} outils`);
                if (chatResponseData.metadata.tools_used?.length > 0) {
                    console.log(`    → ${chatResponseData.metadata.tools_used.join(', ')}`);
                }
            }

        } else {
            console.log('❌ Échec!');
            console.log(`  Erreur: ${chatResponseData.error}`);
            console.log(`  Détails: ${chatResponseData.details || 'N/A'}`);
            if (chatResponseData.technical) {
                console.log(`  Technique: ${chatResponseData.technical}`);
            }
        }

    } catch (error) {
        console.log('❌ ERREUR:', error.message);
        console.log('\nStack trace:');
        console.log(error.stack);
    }
}

// Exécuter le test
testChatAPI().then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test terminé');
    console.log('='.repeat(60));
}).catch(err => {
    console.error('\n❌ Erreur fatale:', err);
    process.exit(1);
});
