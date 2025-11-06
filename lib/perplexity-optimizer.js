/**
 * PERPLEXITY OPTIMIZER - Phase 2
 *
 * Maximise la qualité et profondeur des réponses Perplexity en:
 * 1. Enrichissant les prompts avec TOUTES les données structurées
 * 2. Spécifiant clairement les métriques obligatoires
 * 3. Validant post-response pour s'assurer rien n'est manqué
 * 4. Optimisant pour temps réel (recency filters)
 *
 * Objectif: Ne rien laisser sur la table côté qualité/profondeur
 */

export class PerplexityOptimizer {
    constructor() {
        this.apiKey = process.env.PERPLEXITY_API_KEY;

        // Métriques obligatoires par mode
        // OPTIMISÉ: 25 métriques pour comprehensive_analysis (niveau CFA)
        this.REQUIRED_METRICS = {
            chat: [
                'Prix actuel ($)',
                'Variation (%)',
                'P/E Ratio',
                'EPS',
                'ROE',
                'YTD %',
                'Consensus analystes',
                'Dividende'
            ],

            comprehensive_analysis: [
                // === VALORISATION (8 métriques) ===
                'Prix actuel ($)',
                'Variation jour ($, %)',
                'Market Cap (B$)',
                'P/E Ratio (+ comparaison secteur)',
                'P/B Ratio',
                'P/FCF Ratio',
                'EV/EBITDA',
                'PEG Ratio',

                // === RENTABILITÉ (6 métriques) ===
                'EPS (TTM)',
                'ROE (%)',
                'ROA (%)',
                'Marge nette (%)',
                'Marge opérationnelle (%)',
                'Marge brute (%)',

                // === PERFORMANCE (4 métriques) ===
                'YTD (%)',
                '52 semaines high',
                '52 semaines low',
                'Distance 52w high (%)',
                'Rendement dividende (%)',

                // === SANTÉ FINANCIÈRE (4 métriques) ===
                'Debt/Equity Ratio',
                'Current Ratio',
                'Quick Ratio',
                'Free Cash Flow (B$)',

                // === CONSENSUS & CATALYSEURS (3 métriques) ===
                'Consensus analystes (Buy/Hold/Sell)',
                'Prix cible moyen ($)',
                'Prochains résultats (date + attentes EPS)'
            ],

            briefing: [
                'Prix actuel',
                'P/E Ratio',
                'EPS',
                'ROE',
                'YTD %',
                'Market Cap',
                'Consensus',
                'Nouvelles importantes',
                'Catalyseurs'
            ]
        };
    }

    /**
     * Appel Perplexity optimisé avec validation
     */
    async synthesize({
        userMessage,
        intentData,
        toolResults,
        outputMode = 'chat',
        conversationHistory = []
    }) {
        console.log('🔮 Perplexity Optimizer: Synthesizing response...');

        try {
            // 1. Construire prompt ULTRA-ENRICHI
            const enrichedPrompt = this._buildEnrichedPrompt({
                userMessage,
                intentData,
                toolResults,
                outputMode,
                conversationHistory
            });

            // 2. Déterminer paramètres optimaux
            const params = this._getOptimalParams(intentData, outputMode);

            // 3. Appel Perplexity
            const response = await this._callPerplexity(enrichedPrompt, params);

            // 4. Validation post-response
            const validation = this._validateResponse(response, outputMode, intentData);

            // 5. Si métriques manquantes → Appel de correction (rare)
            if (validation.missing.length > 0 && toolResults.length > 0) {
                console.warn(`⚠️ Missing metrics detected: ${validation.missing.join(', ')}`);
                const correctedResponse = await this._correctMissingMetrics(
                    response,
                    validation.missing,
                    toolResults
                );
                return {
                    response: correctedResponse,
                    validation: { ...validation, corrected: true },
                    model: 'perplexity-sonar-pro',
                    cost: 0.042 // 2 calls
                };
            }

            return {
                response: response.content,
                citations: response.citations || [],
                validation,
                model: 'perplexity-sonar-pro',
                cost: 0.021 // 1 call
            };

        } catch (error) {
            console.error('❌ Perplexity Optimizer error:', error);
            throw error;
        }
    }

    /**
     * Construit prompt enrichi avec TOUTES les données
     */
    _buildEnrichedPrompt({
        userMessage,
        intentData,
        toolResults,
        outputMode,
        conversationHistory
    }) {
        const currentDate = new Date().toLocaleDateString('fr-CA');
        const currentDateTime = new Date().toISOString();

        // Organiser les tool results par catégorie
        const organizedData = this._organizeToolResults(toolResults);

        // Mode-specific system instructions
        const systemInstructions = this._getSystemInstructions(outputMode);

        // Required metrics for this mode
        const requiredMetrics = this._getRequiredMetricsList(outputMode, intentData);

        // Build the mega-prompt
        return `${systemInstructions}

📅 DATE ACTUELLE: ${currentDate} (${currentDateTime})
⚠️ CRITIQUE: Utilise UNIQUEMENT les données les plus récentes. Si une donnée est datée, mentionne clairement la date.

QUESTION DE L'UTILISATEUR:
"${userMessage}"

CONTEXTE D'INTENTION:
- Type de requête: ${intentData.intent}
- Complexité: ${intentData.complexity}
- Tickers concernés: ${intentData.tickers?.join(', ') || 'N/A'}
- Mode de sortie: ${outputMode}

${conversationHistory.length > 0 ? `HISTORIQUE DE CONVERSATION (contexte):
${conversationHistory.slice(-5).map(msg => `${msg.role}: ${msg.content.substring(0, 200)}...`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════
DONNÉES FINANCIÈRES STRUCTURÉES (à analyser et synthétiser)
═══════════════════════════════════════════════════════════════

${this._formatOrganizedData(organizedData)}

═══════════════════════════════════════════════════════════════
MÉTRIQUES OBLIGATOIRES À INCLURE DANS TA RÉPONSE
═══════════════════════════════════════════════════════════════

Tu DOIS absolument mentionner les métriques suivantes (si disponibles dans les données):

${requiredMetrics.map(m => `✓ ${m}`).join('\n')}

❌ SI UNE MÉTRIQUE N'EST PAS DISPONIBLE dans les données fournies:
   - NE PAS inventer de chiffres
   - Mentionner clairement "Donnée non disponible" ou "N/A"
   - Suggérer d'autres sources si pertinent

═══════════════════════════════════════════════════════════════
🎯 EXIGENCES QUANTITATIVES STRICTES
═══════════════════════════════════════════════════════════════

${outputMode === 'comprehensive_analysis' ? `
Tu DOIS inclure AU MINIMUM:
✓ 20 CHIFFRES/RATIOS différents dans ton analyse
✓ 5 COMPARAISONS chiffrées (vs secteur, historique, pairs)
✓ 3 TENDANCES quantifiées (croissance %, évolution)
✓ 2 PROJECTIONS chiffrées (consensus, objectifs)

EXEMPLE DE DENSITÉ ATTENDUE:
"Microsoft se négocie à 380,50$ (-1,2%, -4,56$), avec une market cap
de 2,83T$. Le P/E de 32,5x dépasse le secteur (28,0x) de +16%, tandis
que le P/B de 11,2x et P/FCF de 28,9x reflètent une valorisation premium.
La rentabilité est solide: ROE 42,3%, ROA 18,7%, marge nette 34,2%.
L'EPS de 11,75$ génère un dividende de 3,00$ (rendement 0,79%,
payout 25,5%). Performance YTD: +28,4% vs secteur +18,2% (+10,2pp)..."

👆 Compte: 22 chiffres en 1 paragraphe. C'est le NIVEAU attendu.
` : ''}

═══════════════════════════════════════════════════════════════
📏 EXIGENCES DE LONGUEUR
═══════════════════════════════════════════════════════════════

Longueur MINIMALE selon mode:
• comprehensive_analysis: 1500-2000 mots (6-8 paragraphes denses)
• chat: 400-600 mots (2-3 paragraphes)
• briefing: 1800-2500 mots (format rapport professionnel)

${outputMode === 'comprehensive_analysis' ? `
⚠️ Si ta réponse fait < 1500 mots, tu n'as PAS assez approfondi. Ajoute:
  - Plus de comparaisons sectorielles
  - Plus de contexte historique
  - Plus d'analyse des tendances
  - Plus de justifications chiffrées
` : ''}

═══════════════════════════════════════════════════════════════
🎓 NIVEAU RÉDACTIONNEL: CFA / MBA INSTITUTIONNEL
═══════════════════════════════════════════════════════════════

${outputMode === 'comprehensive_analysis' || outputMode === 'briefing' ? `
Ton analyse doit être de niveau:
✓ CFA Level II (analyse quantitative rigoureuse)
✓ MBA Finance (insights stratégiques)
✓ Analyste sell-side professionnel (recommandations actionnables)

STYLE ATTENDU:
• Terminologie précise (EBITDA, TTM, payout ratio, FCF yield, etc.)
• Justifications chiffrées ("premium de +16% justifié par...")
• Comparaisons multi-dimensionnelles (temps, secteur, pairs)
• Contexte macro intégré (Fed, taux, cycle économique)
• Catalyseurs identifiés avec timeline
• Risques quantifiés avec probabilités

EXEMPLE BON vs MAUVAIS:
❌ MAUVAIS: "Microsoft performe bien avec un bon P/E"
✅ BON: "Microsoft affiche un P/E de 32,5x, soit une prime de +16%
au secteur Tech (28,0x). Cette valorisation premium se justifie par
un ROE supérieur de 42,3% vs 28,5% secteur (+48% relatif), reflétant
l'avantage concurrentiel d'Azure (croissance 30% YoY)."
` : ''}

═══════════════════════════════════════════════════════════════
📋 STRUCTURE OBLIGATOIRE (comprehensive_analysis)
═══════════════════════════════════════════════════════════════

${outputMode === 'comprehensive_analysis' ? `
Ta réponse DOIT suivre cette structure EXACTE:

## 📊 SNAPSHOT
[Prix actuel, variation, market cap, résumé 1 phrase]

## 💰 VALORISATION
[P/E, P/B, P/FCF, EV/EBITDA + comparaisons secteur]

## 💼 RENTABILITÉ & FONDAMENTAUX
[ROE, marges, EPS, FCF + tendances]

## 📈 PERFORMANCE & MOMENTUM
[YTD, 52w range, volumes, tendance]

## 🎯 CONSENSUS & CATALYSEURS
[Analystes, prix cible, prochains events]

## 📰 ACTUALITÉS CRITIQUES
[Top 3 news récentes avec impact]

## ⚖️ CONCLUSION & RECOMMANDATION
[Synthèse, opportunités, risques, verdict]

**IMPORTANT:** Chaque section = 200-300 mots minimum
` : ''}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS CRITIQUES
═══════════════════════════════════════════════════════════════

1. ❌ NE JAMAIS copier du JSON brut dans ta réponse
   ✅ Transformer toutes les données en texte conversationnel français

2. ✅ TU ES UNE ANALYSTE FINANCIÈRE EXPERTE
   - INTERPRÈTE les chiffres, ne les affiche pas juste
   - EXPLIQUE ce que signifient les données
   - DONNE des insights et du contexte
   - COMPARE avec moyennes sectorielles quand pertinent

3. ✅ SOURCES ET CITATIONS
   - Cite naturellement tes sources (ex: "Selon les données FMP...")
   - Pour news: mentionne la date et source
   - Pour métriques: précise si c'est temps réel ou historique

4. ✅ PROFONDEUR D'ANALYSE
   ${outputMode === 'chat' ? '- Réponse concise mais complète (2-3 paragraphes)' : ''}
   ${outputMode === 'comprehensive_analysis' ? '- Analyse approfondie détaillée (6-8 paragraphes minimum)' : ''}
   ${outputMode === 'briefing' ? '- Briefing professionnel structuré (1500-2000 mots)' : ''}
   - Inclure TOUTES les métriques obligatoires listées ci-dessus
   - Donner du contexte historique/sectoriel
   - Identifier les tendances et patterns

5. ✅ TON ET STYLE
   ${outputMode === 'chat' ? '- Professionnel mais accessible' : ''}
   ${outputMode === 'comprehensive_analysis' ? '- Professionnel institutionnel' : ''}
   ${outputMode === 'briefing' ? '- Très professionnel, style rapport d\'analyste' : ''}
   - En français
   - Utiliser des paragraphes structurés
   - Bullet points pour listes

6. ✅ TEMPS RÉEL ET ACTUALITÉ
   - Prioriser les données les plus récentes
   - Si actualités importantes récentes, les mentionner en contexte
   - Signaler si données sont anciennes (>1 mois)

${outputMode === 'chat' ? `
EXEMPLE DE BONNE RÉPONSE (mode chat):

"Apple (AAPL) se négocie actuellement à 245,67$, en hausse de 2,36% (+5,67$) sur la journée. Le titre affiche une solide performance depuis le début de l'année avec un gain de +28,4% YTD.

**Valorisation**: Avec un P/E de 32,4x, Apple se traite à prime par rapport à la moyenne du secteur technologique (22,3x), reflétant la qualité de l'entreprise et son positionnement de marque premium. Le P/FCF de 28,1x confirme cette valorisation élevée.

**Fondamentaux solides**: L'EPS s'établit à 6,15$ avec un dividende trimestriel de 0,25$ (rendement 0,41%). Le ROE impressionnant de 147% témoigne de l'efficacité du capital, tandis que le ratio Debt/Equity conservateur de 1,73 assure une santé financière robuste.

Le consensus des analystes est positif avec 24 Buy, 8 Hold et 2 Sell. L'objectif de prix moyen des analystes se situe à 260$, impliquant un potentiel haussier de +5,8%."
` : ''}

RÉPONSE:`;
    }

    /**
     * Organise les tool results par catégorie
     */
    _organizeToolResults(toolResults) {
        const organized = {
            prices: [],
            fundamentals: [],
            ratios: [],
            keyMetrics: [],
            news: [],
            ratings: [],
            earnings: [],
            other: []
        };

        toolResults.forEach(result => {
            if (!result.success || !result.data) return;

            const toolId = result.tool_id;

            if (toolId.includes('quote') || toolId.includes('price')) {
                organized.prices.push({ tool: toolId, data: result.data });
            } else if (toolId.includes('fundamental')) {
                organized.fundamentals.push({ tool: toolId, data: result.data });
            } else if (toolId.includes('ratio')) {
                organized.ratios.push({ tool: toolId, data: result.data });
            } else if (toolId.includes('key-metric')) {
                organized.keyMetrics.push({ tool: toolId, data: result.data });
            } else if (toolId.includes('news')) {
                organized.news.push({ tool: toolId, data: result.data });
            } else if (toolId.includes('rating') || toolId.includes('analyst')) {
                organized.ratings.push({ tool: toolId, data: result.data });
            } else if (toolId.includes('earning')) {
                organized.earnings.push({ tool: toolId, data: result.data });
            } else {
                organized.other.push({ tool: toolId, data: result.data });
            }
        });

        return organized;
    }

    /**
     * Formate les données organisées de manière lisible
     */
    _formatOrganizedData(organized) {
        let formatted = '';

        if (organized.prices.length > 0) {
            formatted += '📊 PRIX ET COTATIONS:\n';
            formatted += JSON.stringify(organized.prices, null, 2) + '\n\n';
        }

        if (organized.fundamentals.length > 0) {
            formatted += '🏢 DONNÉES FONDAMENTALES:\n';
            formatted += JSON.stringify(organized.fundamentals, null, 2) + '\n\n';
        }

        if (organized.ratios.length > 0) {
            formatted += '📈 RATIOS FINANCIERS:\n';
            formatted += JSON.stringify(organized.ratios, null, 2) + '\n\n';
        }

        if (organized.keyMetrics.length > 0) {
            formatted += '💼 MÉTRIQUES CLÉS:\n';
            formatted += JSON.stringify(organized.keyMetrics, null, 2) + '\n\n';
        }

        if (organized.news.length > 0) {
            formatted += '📰 ACTUALITÉS:\n';
            formatted += JSON.stringify(organized.news, null, 2) + '\n\n';
        }

        if (organized.ratings.length > 0) {
            formatted += '⭐ CONSENSUS ANALYSTES:\n';
            formatted += JSON.stringify(organized.ratings, null, 2) + '\n\n';
        }

        if (organized.earnings.length > 0) {
            formatted += '💰 RÉSULTATS ET CALENDRIER:\n';
            formatted += JSON.stringify(organized.earnings, null, 2) + '\n\n';
        }

        if (organized.other.length > 0) {
            formatted += '🔧 AUTRES DONNÉES:\n';
            formatted += JSON.stringify(organized.other, null, 2) + '\n\n';
        }

        return formatted || 'Aucune donnée financière disponible.';
    }

    /**
     * Instructions système selon le mode
     */
    _getSystemInstructions(outputMode) {
        if (outputMode === 'briefing') {
            return 'Tu es Emma, analyste financière senior. Rédige un briefing professionnel institutionnel de haute qualité.';
        } else if (outputMode === 'comprehensive_analysis') {
            return 'Tu es Emma, analyste financière experte. Fournis une analyse détaillée et approfondie de niveau professionnel.';
        } else {
            return 'Tu es Emma, assistante financière intelligente. Réponds de manière professionnelle et accessible.';
        }
    }

    /**
     * Liste des métriques requises selon mode et intent
     */
    _getRequiredMetricsList(outputMode, intentData) {
        if (intentData.intent === 'comprehensive_analysis' || outputMode === 'comprehensive_analysis') {
            return this.REQUIRED_METRICS.comprehensive_analysis;
        } else if (outputMode === 'briefing') {
            return this.REQUIRED_METRICS.briefing;
        } else {
            return this.REQUIRED_METRICS.chat;
        }
    }

    /**
     * Paramètres optimaux pour Perplexity
     *
     * OPTIMISÉ POUR QUALITÉ MAXIMALE (CFA niveau)
     * - max_tokens élevés pour analyses riches (6000-8000)
     * - Température équilibrée selon type d'analyse
     * - Recency 'day' par défaut pour données temps réel
     */
    _getOptimalParams(intentData, outputMode) {
        const complexity = intentData.complexity || 'medium';
        const intent = intentData.intent;

        // ⚡ OPTIMISATION QUALITÉ: max_tokens élevés par défaut
        let maxTokens = 6000; // DEFAULT ÉLEVÉ pour analyses riches

        if (outputMode === 'briefing') maxTokens = 8000; // Maximum
        else if (outputMode === 'comprehensive_analysis') maxTokens = 8000; // Maximum
        else if (outputMode === 'ticker_note') maxTokens = 7000;
        else if (complexity === 'high') maxTokens = 7000;
        else if (complexity === 'low') maxTokens = 4000; // Minimum raisonnable

        // Exception: politesses et aides (économiser tokens)
        if (intent === 'greeting' || intent === 'help' || intent === 'capabilities') {
            maxTokens = 1000;
        }

        // ⚡ OPTIMISATION QUALITÉ: Temperature équilibrée
        const temperature = this._getOptimalTemperature(intentData, outputMode);

        // ⚡ OPTIMISATION TEMPS RÉEL: Recency 'day' par défaut
        let recencyFilter = 'day'; // DEFAULT temps réel

        if (intent === 'news' || intent === 'breaking_news') recencyFilter = 'day';
        else if (intent === 'earnings' || intent === 'events') recencyFilter = 'day';
        else if (intent === 'comprehensive_analysis') recencyFilter = 'day'; // TEMPS RÉEL
        else if (intent === 'stock_price') recencyFilter = 'day';
        // Exception: analyses historiques
        else if (intent === 'historical_analysis') recencyFilter = 'month';

        console.log(`🎯 Perplexity params: tokens=${maxTokens}, temp=${temperature}, recency=${recencyFilter}`);

        return {
            model: 'sonar-pro',
            maxTokens,
            temperature,
            recencyFilter,
            returnCitations: true,
            returnRelatedQuestions: false // Économiser tokens
        };
    }

    /**
     * Détermine la température optimale selon le type d'analyse
     */
    _getOptimalTemperature(intentData, outputMode) {
        // Analyses financières: température modérée pour précision + créativité
        if (outputMode === 'briefing') return 0.6;
        if (outputMode === 'comprehensive_analysis') return 0.5;
        if (outputMode === 'ticker_note') return 0.5;

        // Analyses techniques: plus de précision
        if (intentData?.intent === 'technical_analysis') return 0.4;

        // Questions conceptuelles: plus de créativité
        if (intentData?.intent === 'education') return 0.7;

        return 0.5; // Default équilibré
    }

    /**
     * Appel API Perplexity
     */
    async _callPerplexity(prompt, params) {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: params.model,
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: params.maxTokens,
                temperature: params.temperature,
                search_recency_filter: params.recencyFilter,
                return_citations: params.returnCitations,
                return_related_questions: params.returnRelatedQuestions
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Perplexity API error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        return {
            content: data.choices[0].message.content,
            citations: data.citations || [],
            usage: data.usage
        };
    }

    /**
     * Valide que la réponse contient toutes les métriques requises
     */
    _validateResponse(response, outputMode, intentData) {
        const requiredMetrics = this._getRequiredMetricsList(outputMode, intentData);
        const missing = [];

        // Check each required metric
        requiredMetrics.forEach(metric => {
            // Simplify metric name for searching
            const searchTerms = this._getSearchTermsForMetric(metric);
            const found = searchTerms.some(term =>
                response.content.toLowerCase().includes(term.toLowerCase())
            );

            if (!found) {
                missing.push(metric);
            }
        });

        return {
            complete: missing.length === 0,
            missing,
            coverage: ((requiredMetrics.length - missing.length) / requiredMetrics.length) * 100
        };
    }

    /**
     * Search terms pour chaque métrique
     */
    _getSearchTermsForMetric(metric) {
        const termMap = {
            'Prix actuel': ['prix', 'price', 'se négocie', 'cote'],
            'Variation %': ['%', 'variation', 'hausse', 'baisse', 'change'],
            'P/E Ratio': ['p/e', 'price to earnings', 'ratio cours'],
            'EPS': ['eps', 'bénéfice par action', 'earnings per share'],
            'Dividende': ['dividende', 'dividend'],
            'YTD %': ['ytd', 'year-to-date', 'depuis début d\'année'],
            '52w high/low': ['52 semaines', '52w', '52-week'],
            'Market Cap': ['market cap', 'capitalisation'],
            'ROE': ['roe', 'return on equity', 'rendement capitaux'],
            'Consensus': ['consensus', 'analystes', 'buy', 'hold', 'sell'],
            'Price target': ['price target', 'objectif de prix', 'cible']
        };

        return termMap[metric] || [metric.toLowerCase()];
    }

    /**
     * Correction si métriques manquantes (rare)
     */
    async _correctMissingMetrics(originalResponse, missingMetrics, toolResults) {
        console.warn(`🔧 Correcting response - adding missing metrics: ${missingMetrics.join(', ')}`);

        const correctionPrompt = `Ta réponse précédente manquait ces métriques importantes:
${missingMetrics.map(m => `- ${m}`).join('\n')}

Données disponibles:
${JSON.stringify(toolResults, null, 2)}

Complète ta réponse en ajoutant UNIQUEMENT les métriques manquantes ci-dessus.
Format: court et concis, intègre naturellement dans le style existant.`;

        const correction = await this._callPerplexity(correctionPrompt, {
            model: 'sonar-pro',
            maxTokens: 1000,
            temperature: 0.7,
            recencyFilter: 'month',
            returnCitations: false,
            returnRelatedQuestions: false
        });

        return `${originalResponse.content}\n\n${correction.content}`;
    }
}
