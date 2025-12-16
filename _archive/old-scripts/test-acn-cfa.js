#!/usr/bin/env node

/**
 * Test API Emma - Analyse CFA+++ d'Accenture
 */

const testACN = async () => {
    console.log('🎯 Test Analyse CFA+++ - Accenture (ACN)\n');

    // Utiliser l'endpoint local pour tester (plus rapide)
    const apiUrl = 'http://localhost:3000/api/emma-agent';

    const payload = {
        message: "Analyse comprehensive d'Accenture (ACN) incluant: DCF avec marge de sécurité, moat analysis détaillée, contexte macro, qualité du management, comparaison vs secteur, et recommandation value investing selon les principes de Buffett et Graham",
        context: {
            output_mode: 'chat',
            user_channel: 'web'
        }
    };

    console.log('📤 Requête envoyée...\n');
    console.log('⏳ Analyse en cours (peut prendre 30-60s pour une analyse comprehensive)...\n');

    try {
        const startTime = Date.now();

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erreur ${response.status}:`, errorText);
            return;
        }

        const data = await response.json();

        console.log('═'.repeat(80));
        console.log('✅ ANALYSE REÇUE');
        console.log('═'.repeat(80));
        console.log(`⏱️  Temps: ${duration}s`);
        console.log(`🎯 Intent: ${data.intent || 'N/A'}`);
        console.log(`🤖 Model: ${data.model || 'N/A'}`);
        console.log(`📰 Citations: ${data.citations?.length || 0}`);
        console.log(`📏 Longueur: ${data.response?.length || 0} caractères (~${Math.round((data.response?.length || 0) / 5)} mots)`);
        console.log('═'.repeat(80));
        console.log('\n📊 RÉPONSE EMMA (CFA+++):\n');
        console.log(data.response);
        console.log('\n' + '═'.repeat(80));

        if (data.citations && data.citations.length > 0) {
            console.log('\n📰 SOURCES:');
            data.citations.forEach((citation, i) => {
                console.log(`[${i + 1}] ${citation}`);
            });
        }

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
    }
};

testACN();
