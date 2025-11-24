/**
 * Script de diagnostic pour tester l'API Perplexity
 * Identifie pourquoi Perplexity ne fonctionne pas
 */

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

console.log('🔍 Diagnostic Perplexity API\n');
console.log('='.repeat(60));

// 1. Vérifier la clé API
console.log('\n1️⃣ Vérification de la clé API:');
if (!PERPLEXITY_API_KEY) {
    console.error('❌ PERPLEXITY_API_KEY n\'est pas définie dans les variables d\'environnement');
    console.log('   → Vérifiez que la variable est configurée dans Vercel');
    process.exit(1);
} else {
    console.log('✅ Clé API trouvée');
    console.log(`   Format: ${PERPLEXITY_API_KEY.substring(0, 8)}...${PERPLEXITY_API_KEY.slice(-4)}`);
    console.log(`   Longueur: ${PERPLEXITY_API_KEY.length} caractères`);
    
    // Vérifier le format
    if (!PERPLEXITY_API_KEY.startsWith('pplx-')) {
        console.warn('⚠️  La clé ne commence pas par "pplx-", format peut être incorrect');
    }
}

// 2. Test simple de l'API
console.log('\n2️⃣ Test de connexion à l\'API Perplexity:');

async function testPerplexity() {
    try {
        const testPrompt = 'Quel est le prix actuel de Apple (AAPL)?';
        
        const requestBody = {
            model: 'sonar-pro',
            messages: [
                {
                    role: 'system',
                    content: 'Tu es Emma, analyste financière. Réponds brièvement en français.'
                },
                {
                    role: 'user',
                    content: testPrompt
                }
            ],
            max_tokens: 500,
            temperature: 0.2
        };

        console.log('   Envoi de la requête...');
        const startTime = Date.now();

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const duration = Date.now() - startTime;
        console.log(`   Temps de réponse: ${duration}ms`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`\n❌ Erreur API (${response.status}):`);
            console.error('   Status:', response.status, response.statusText);
            console.error('   Détails:', JSON.stringify(errorData, null, 2));
            
            // Analyser le type d'erreur
            if (response.status === 401) {
                console.error('\n🔑 Problème d\'authentification:');
                console.error('   → La clé API est invalide ou expirée');
                console.error('   → Vérifiez la clé dans votre compte Perplexity');
            } else if (response.status === 429) {
                console.error('\n⏱️  Limite de taux dépassée:');
                console.error('   → Trop de requêtes envoyées');
                console.error('   → Attendez quelques minutes ou vérifiez votre plan');
            } else if (response.status === 400) {
                console.error('\n📝 Erreur de requête:');
                console.error('   → Le format de la requête est incorrect');
                console.error('   → Vérifiez le modèle utilisé (sonar-pro)');
            } else if (response.status === 503) {
                console.error('\n🔧 Service indisponible:');
                console.error('   → L\'API Perplexity est temporairement indisponible');
                console.error('   → Réessayez dans quelques instants');
            }
            
            process.exit(1);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const tokensUsed = data.usage?.total_tokens || 'unknown';
        const citations = data.citations || [];

        console.log('\n✅ Réponse reçue avec succès!');
        console.log(`   Tokens utilisés: ${tokensUsed}`);
        console.log(`   Citations: ${citations.length}`);
        console.log(`   Longueur réponse: ${content.length} caractères`);
        console.log(`\n📝 Réponse (premiers 200 caractères):`);
        console.log(`   "${content.substring(0, 200)}..."`);

        // 3. Test avec le modèle utilisé dans le code
        console.log('\n3️⃣ Vérification du modèle "sonar-pro":');
        console.log('   ✅ Modèle sonar-pro fonctionne correctement');

        // 4. Test avec timeout
        console.log('\n4️⃣ Test avec timeout (30s):');
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => {
            timeoutController.abort();
        }, 30000);

        try {
            const timeoutResponse = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: 'Test timeout' }],
                    max_tokens: 100
                }),
                signal: timeoutController.signal
            });
            clearTimeout(timeoutId);
            console.log('   ✅ Pas de timeout (réponse reçue avant 30s)');
        } catch (timeoutError) {
            clearTimeout(timeoutId);
            if (timeoutError.name === 'AbortError') {
                console.error('   ❌ Timeout après 30s');
                console.error('   → L\'API Perplexity est trop lente');
                console.error('   → Augmentez le timeout dans le code');
            } else {
                throw timeoutError;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Tous les tests sont passés!');
        console.log('   Perplexity fonctionne correctement.');
        console.log('\n💡 Si Perplexity ne fonctionne toujours pas dans Emma:');
        console.log('   1. Vérifiez les logs Vercel pour voir les erreurs exactes');
        console.log('   2. Vérifiez que PERPLEXITY_API_KEY est configurée dans Vercel');
        console.log('   3. Vérifiez les quotas/limites de votre compte Perplexity');
        console.log('   4. Vérifiez que le timeout est suffisant (60-90s)');

    } catch (error) {
        console.error('\n❌ Erreur lors du test:');
        console.error('   Type:', error.name);
        console.error('   Message:', error.message);
        
        if (error.name === 'AbortError') {
            console.error('\n⏱️  Timeout détecté:');
            console.error('   → L\'API Perplexity prend trop de temps à répondre');
            console.error('   → Augmentez le timeout dans _call_perplexity()');
        } else if (error.message.includes('fetch')) {
            console.error('\n🌐 Erreur de connexion:');
            console.error('   → Problème de réseau ou DNS');
            console.error('   → Vérifiez votre connexion internet');
        } else {
            console.error('\n   Stack:', error.stack);
        }
        
        process.exit(1);
    }
}

testPerplexity();
