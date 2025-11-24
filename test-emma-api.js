#!/usr/bin/env node

/**
 * Test rapide de l'API Emma pour vérifier la compatibilité n8n
 */

const testEmmaAPI = async () => {
    console.log('🧪 Test de l\'API Emma...\n');

    const apiUrl = 'https://gobapps.com/api/emma-n8n';

    const testPayload = {
        message: "Quel est le prix actuel d'Apple?",
        user_id: "test_n8n_verification",
        channel: "web"
    };

    console.log('📤 Envoi de la requête:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('\n⏳ En attente de la réponse...\n');

    try {
        const startTime = Date.now();

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`⏱️  Temps de réponse: ${duration}s`);
        console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur API:');
            console.error(errorText);
            process.exit(1);
        }

        const data = await response.json();

        console.log('✅ Réponse reçue avec succès!\n');
        console.log('📋 Structure de la réponse:');
        console.log('  - response:', data.response ? '✓' : '✗');
        console.log('  - intent:', data.intent || 'N/A');
        console.log('  - model:', data.model || 'N/A');
        console.log('  - citations:', data.citations?.length || 0);

        console.log('\n📝 Extrait de la réponse (100 premiers caractères):');
        const excerpt = data.response?.substring(0, 100) || 'N/A';
        console.log(`"${excerpt}..."`);

        console.log('\n✅ API Emma fonctionne correctement!');
        console.log('✅ Compatible avec les workflows n8n existants');

    } catch (error) {
        console.error('\n❌ Erreur lors du test:');
        console.error(error.message);
        process.exit(1);
    }
};

testEmmaAPI();
