/**
 * Test des capacités Perplexity Labs pour données financières
 * Explore les modèles disponibles et les fonctionnalités avancées
 */

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

if (!PERPLEXITY_API_KEY) {
    console.error('❌ PERPLEXITY_API_KEY non configurée');
    process.exit(1);
}

// Modèles Perplexity disponibles (Jan 2025)
const MODELS = [
    'sonar',                    // Base model - recherche web temps réel
    'sonar-pro',                // Pro model - recherche approfondie + meilleure qualité
    'sonar-reasoning',          // Reasoning model - analyse complexe
];

// Test configurations pour données financières
const TEST_CONFIGS = [
    {
        name: 'Basic Financial Query',
        model: 'sonar',
        prompt: 'Quel est le prix actuel de Apple (AAPL) et sa variation sur la journée?',
        recency: 'day',
        temperature: 0.3
    },
    {
        name: 'Pro Financial Query with Charts',
        model: 'sonar-pro',
        prompt: `Analyse la performance d'Apple (AAPL) aujourd'hui.

IMPORTANT: Inclus dans ta réponse:
- [CHART:FINVIZ:AAPL] pour montrer le graphique technique
- [LOGO:AAPL] pour le logo
- Des données chiffrées précises (prix, variation, volume)
- Les actualités principales du jour`,
        recency: 'day',
        temperature: 0.5
    },
    {
        name: 'Multi-Stock Comparison',
        model: 'sonar-pro',
        prompt: `Compare AAPL, MSFT, et GOOGL aujourd'hui.

Pour chaque ticker, inclus:
- [CHART:FINVIZ:TICKER]
- Prix actuel et variation
- Volume de trading
- Actualités principales

Format markdown avec tableaux.`,
        recency: 'day',
        temperature: 0.5
    },
    {
        name: 'Sector Heatmap Analysis',
        model: 'sonar-pro',
        prompt: `Analyse les secteurs du marché aujourd'hui.

Inclus:
- [CHART:FINVIZ:SECTORS] pour la heatmap sectorielle
- Performance des principaux secteurs
- Tendances et catalyseurs

Format: analyse détaillée avec insights.`,
        recency: 'day',
        temperature: 0.5
    },
    {
        name: 'Structured Data Extraction',
        model: 'sonar',
        prompt: `Extrait les données suivantes pour AAPL en format JSON strict:
{
  "ticker": "AAPL",
  "price": number,
  "change": number,
  "changePercent": number,
  "volume": number,
  "marketCap": number,
  "pe": number,
  "dayHigh": number,
  "dayLow": number,
  "lastUpdate": "ISO date"
}

UNIQUEMENT le JSON, aucun texte avant ou après.`,
        recency: 'day',
        temperature: 0.1
    }
];

/**
 * Teste un modèle Perplexity avec une configuration
 */
async function testPerplexityModel(config) {
    console.log('\n' + '='.repeat(80));
    console.log(`🧪 TEST: ${config.name}`);
    console.log(`📦 Model: ${config.model}`);
    console.log(`🕐 Recency: ${config.recency}`);
    console.log(`🌡️  Temperature: ${config.temperature}`);
    console.log('='.repeat(80));
    console.log(`\n📝 Prompt:\n${config.prompt}\n`);

    try {
        const requestBody = {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'Tu es Emma, assistante financière experte. Fournis des données précises avec sources.'
                },
                {
                    role: 'user',
                    content: config.prompt
                }
            ],
            max_tokens: 2000,
            temperature: config.temperature,
            search_recency_filter: config.recency,
            return_citations: true,  // Perplexity Labs feature
            return_images: true      // Perplexity Labs feature (si disponible)
        };

        console.log('⏳ Envoi de la requête à Perplexity...');
        const startTime = Date.now();

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`❌ Erreur ${response.status}:`, errorData);
            return {
                success: false,
                error: errorData,
                responseTime
            };
        }

        const data = await response.json();
        console.log(`✅ Réponse reçue en ${responseTime}ms`);

        // Analyser la réponse
        const result = {
            success: true,
            responseTime,
            model: data.model,
            content: data.choices[0].message.content,
            citations: data.citations || [],
            images: data.images || [],
            usage: data.usage || {}
        };

        console.log('\n📊 RÉSULTAT:');
        console.log('-'.repeat(80));
        console.log(result.content);
        console.log('-'.repeat(80));

        console.log(`\n📈 Statistiques:`);
        console.log(`  - Temps de réponse: ${responseTime}ms`);
        console.log(`  - Tokens prompt: ${result.usage.prompt_tokens || 'N/A'}`);
        console.log(`  - Tokens completion: ${result.usage.completion_tokens || 'N/A'}`);
        console.log(`  - Citations: ${result.citations.length}`);
        console.log(`  - Images: ${result.images.length}`);

        if (result.citations.length > 0) {
            console.log('\n🔗 Citations:');
            result.citations.forEach((citation, idx) => {
                console.log(`  ${idx + 1}. ${citation}`);
            });
        }

        if (result.images.length > 0) {
            console.log('\n🖼️  Images:');
            result.images.forEach((image, idx) => {
                console.log(`  ${idx + 1}. ${image}`);
            });
        }

        // Détecter les tags d'images dans le contenu
        const imageTags = result.content.match(/\[(CHART|LOGO|SCREENSHOT):[^\]]+\]/g) || [];
        if (imageTags.length > 0) {
            console.log('\n🎨 Tags d\'images détectés:');
            imageTags.forEach((tag, idx) => {
                console.log(`  ${idx + 1}. ${tag}`);
            });
        }

        return result;

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Test de disponibilité des modèles
 */
async function testModelAvailability() {
    console.log('\n' + '🔍 TEST DE DISPONIBILITÉ DES MODÈLES '.padEnd(80, '='));

    for (const model of MODELS) {
        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: 'Test' }],
                    max_tokens: 10
                })
            });

            if (response.ok) {
                console.log(`✅ ${model.padEnd(20)} - Disponible`);
            } else {
                const error = await response.json().catch(() => ({}));
                console.log(`❌ ${model.padEnd(20)} - Non disponible: ${error.error?.message || response.statusText}`);
            }
        } catch (error) {
            console.log(`❌ ${model.padEnd(20)} - Erreur: ${error.message}`);
        }
    }
}

/**
 * Script principal
 */
async function main() {
    console.log('🚀 PERPLEXITY LABS - TEST DES CAPACITÉS FINANCIÈRES');
    console.log('=' .repeat(80));
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🔑 API Key: ${PERPLEXITY_API_KEY.substring(0, 10)}...`);
    console.log('='.repeat(80));

    // 1. Tester la disponibilité des modèles
    await testModelAvailability();

    // 2. Exécuter les tests de configuration
    const results = [];
    for (const config of TEST_CONFIGS) {
        const result = await testPerplexityModel(config);
        results.push({ config: config.name, result });

        // Pause entre les tests pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 3. Résumé des résultats
    console.log('\n\n' + '📊 RÉSUMÉ DES TESTS '.padEnd(80, '='));
    results.forEach(({ config, result }) => {
        const status = result.success ? '✅' : '❌';
        const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';
        console.log(`${status} ${config.padEnd(40)} - ${time}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✨ Tests terminés!');
}

// Exécution
main().catch(console.error);
