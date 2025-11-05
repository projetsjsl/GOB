/**
 * SMART ROUTER - Decision Layer pour Emma IA™
 *
 * Optimise les coûts LLM en décidant intelligemment entre:
 * - PATH A: 1 CALL (80% des cas) - Question claire
 * - PATH B: 2 CALLS (20% des cas) - Clarification nécessaire
 *
 * Objectif: Réduire coûts de 50% sans sacrifier qualité
 */

import { HybridIntentAnalyzer } from './intent-analyzer.js';

export class SmartRouter {
    constructor() {
        this.intentAnalyzer = new HybridIntentAnalyzer();
        this.geminiCallsToday = 0;
        this.FREE_TIER_LIMIT = 1500; // Gemini daily limit

        // Thresholds de clarté pour routing
        this.CLARITY_HIGH = 7;    // ≥7 → 1 call direct
        this.CLARITY_MEDIUM = 4;  // 4-6 → Clarification
        // <4 → Best effort 1 call
    }

    /**
     * Point d'entrée principal - Route vers 1-call ou 2-call path
     */
    async route(userMessage, context = {}) {
        console.log('🧭 Smart Router: Analyzing request...');

        try {
            // STEP 1: Quick Intent Analysis (Local + Gemini FREE si nécessaire)
            const intentCheck = await this._quickIntentAnalysis(userMessage, context);

            console.log(`📊 Intent Check: clarity=${intentCheck.clarity_score}/10, intent=${intentCheck.intent}`);

            // STEP 2: Decision - 1 call ou 2 calls ?
            const decision = this._makeRoutingDecision(intentCheck);

            console.log(`🎯 Routing Decision: ${decision.path} (reason: ${decision.reason})`);

            return {
                decision,
                intentCheck,
                recommendedPath: decision.path,
                estimatedCost: decision.estimatedCost,
                estimatedTime: decision.estimatedTime
            };

        } catch (error) {
            console.error('❌ Smart Router error:', error);

            // Fallback: 1-call path best effort
            return {
                decision: {
                    path: '1-call',
                    reason: 'Fallback to 1-call due to router error',
                    estimatedCost: 0.021,
                    estimatedTime: 2000
                },
                intentCheck: {
                    intent: 'unknown',
                    clarity_score: 5,
                    tickers: [],
                    needs_clarification: false
                },
                recommendedPath: '1-call',
                estimatedCost: 0.021,
                estimatedTime: 2000
            };
        }
    }

    /**
     * Quick Intent Analysis - Local d'abord, puis Gemini FREE si nécessaire
     */
    async _quickIntentAnalysis(userMessage, context) {
        // 1. Essayer analyse locale (0 coût, ~50ms)
        const localIntent = await this.intentAnalyzer.analyzeIntent(userMessage, context);

        // Si clarté très haute OU limite Gemini atteinte → Utiliser local
        if (localIntent.clarity >= 9 || this.geminiCallsToday >= this.FREE_TIER_LIMIT) {
            console.log(`✅ Using LOCAL intent analysis (clarity: ${localIntent.clarity}, gemini calls: ${this.geminiCallsToday}/${this.FREE_TIER_LIMIT})`);
            return this._formatIntentCheck(localIntent, 'local');
        }

        // 2. Si clarté moyenne/basse ET Gemini disponible → Utiliser Gemini FREE
        if (process.env.GEMINI_API_KEY && this.geminiCallsToday < this.FREE_TIER_LIMIT) {
            console.log(`🔄 Using GEMINI FREE for better intent analysis (local clarity was: ${localIntent.clarity})`);

            try {
                const geminiIntent = await this._geminiIntentCheck(userMessage, localIntent);
                this.geminiCallsToday++;
                return this._formatIntentCheck(geminiIntent, 'gemini');
            } catch (error) {
                console.warn('⚠️ Gemini intent check failed, falling back to local:', error.message);
                return this._formatIntentCheck(localIntent, 'local-fallback');
            }
        }

        // 3. Fallback: utiliser local même si clarté basse
        console.log(`⚠️ Using LOCAL intent (fallback) - Gemini unavailable`);
        return this._formatIntentCheck(localIntent, 'local-fallback');
    }

    /**
     * Appel Gemini FREE pour intent analysis améliorée
     */
    async _geminiIntentCheck(userMessage, localIntent) {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `Analyze this financial query and extract intent + clarity score.

User message: "${userMessage}"

Local analysis suggested:
- Intent: ${localIntent.intent}
- Tickers: ${localIntent.tickers?.join(', ') || 'none'}
- Clarity: ${localIntent.clarity}/10

Respond with JSON:
{
    "intent": "stock_price|fundamentals|news|comprehensive_analysis|...",
    "clarity_score": 0-10,
    "tickers": ["AAPL", ...],
    "needs_clarification": true/false,
    "clarification_reason": "why unclear" or null,
    "suggested_tools": ["fmp-quote", "fmp-ratios", ...],
    "intent_keywords": ["prix", "analyse", ...],
    "complexity": "simple|medium|high"
}

Clarity scoring:
- 10: Crystal clear (e.g., "Prix AAPL")
- 7-9: Clear with minor ambiguity
- 4-6: Ambiguous, needs clarification
- 1-3: Very unclear

Return ONLY valid JSON, no markdown.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Extract JSON from response (remove markdown if present)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in Gemini response');
        }

        const intentData = JSON.parse(jsonMatch[0]);

        // Enrich with local data
        return {
            ...localIntent,
            ...intentData,
            clarity: intentData.clarity_score,
            source: 'gemini'
        };
    }

    /**
     * Format intent check avec structure standardisée
     */
    _formatIntentCheck(intentData, source) {
        return {
            intent: intentData.intent || 'unknown',
            clarity_score: intentData.clarity || intentData.clarity_score || 5,
            tickers: intentData.tickers || [],
            needs_clarification: intentData.needs_clarification || false,
            clarification_reason: intentData.clarification_reason || null,
            suggested_tools: intentData.suggested_tools || [],
            intent_keywords: intentData.intent_keywords || [],
            complexity: intentData.complexity || 'medium',
            source,
            confidence: intentData.confidence || 0.5
        };
    }

    /**
     * Décision de routing - 1 call ou 2 calls ?
     */
    _makeRoutingDecision(intentCheck) {
        const clarity = intentCheck.clarity_score;
        const hasExplicitTicker = intentCheck.tickers.length > 0;
        const hasExplicitIntent = intentCheck.intent_keywords.length > 0 || intentCheck.intent !== 'unknown';

        // DECISION TREE

        // PATH A: 1 CALL - Question claire
        if (clarity >= this.CLARITY_HIGH || (hasExplicitTicker && hasExplicitIntent)) {
            return {
                path: '1-call',
                reason: `High clarity (${clarity}/10) or explicit ticker+intent`,
                estimatedCost: 0.021,  // 1x Perplexity
                estimatedTime: 1500,   // ~1.5s
                llmCalls: 1,
                useNativeFunctionCalling: true
            };
        }

        // PATH B: 2 CALLS - Clarification nécessaire
        if (clarity >= this.CLARITY_MEDIUM && clarity < this.CLARITY_HIGH && intentCheck.needs_clarification) {
            return {
                path: '2-call',
                reason: `Medium clarity (${clarity}/10), needs clarification: ${intentCheck.clarification_reason}`,
                estimatedCost: 0.021,  // Clarification FREE (Gemini) + 1x Perplexity
                estimatedTime: 3000,   // ~3s + user interaction
                llmCalls: 2,
                clarificationQuestion: this._generateClarificationQuestion(intentCheck),
                useNativeFunctionCalling: true
            };
        }

        // PATH C: 1 CALL Best Effort - Clarté basse mais on essaie quand même
        return {
            path: '1-call',
            reason: `Low clarity (${clarity}/10) but attempting best-effort 1-call`,
            estimatedCost: 0.021,
            estimatedTime: 2000,
            llmCalls: 1,
            useNativeFunctionCalling: true,
            bestEffort: true
        };
    }

    /**
     * Génère question de clarification intelligente
     */
    _generateClarificationQuestion(intentCheck) {
        const ticker = intentCheck.tickers[0];

        if (intentCheck.clarification_reason === 'ambiguous_intent') {
            return {
                type: 'multiple_choice',
                question: `Que voulez-vous savoir${ticker ? ` sur ${ticker}` : ''} ?`,
                options: [
                    { id: 'price', label: '📊 Prix actuel et performance' },
                    { id: 'news', label: '📰 Dernières nouvelles' },
                    { id: 'analysis', label: '💼 Analyse complète (fondamentaux + ratios)' },
                    { id: 'recommendation', label: '🎯 Recommandation achat/vente' }
                ]
            };
        }

        if (intentCheck.clarification_reason === 'missing_ticker') {
            return {
                type: 'open_text',
                question: 'Quel ticker voulez-vous analyser ? (ex: AAPL, MSFT, GOOGL)',
                hint: 'Vous pouvez aussi dire le nom de la compagnie (ex: Apple, Microsoft)'
            };
        }

        if (intentCheck.clarification_reason === 'multiple_tickers_unclear') {
            return {
                type: 'multiple_choice',
                question: `Plusieurs tickers détectés (${intentCheck.tickers.join(', ')}). Que voulez-vous faire ?`,
                options: [
                    { id: 'compare', label: '📊 Comparer ces tickers' },
                    { id: 'individual', label: '📈 Analyser individuellement' },
                    { id: 'select_one', label: '🎯 En analyser un seul (lequel ?)' }
                ]
            };
        }

        // Fallback
        return {
            type: 'open_text',
            question: `Je ne suis pas sûre de comprendre. Pouvez-vous préciser votre question sur ${ticker || 'le marché'} ?`,
            hint: 'Par exemple: "Prix AAPL", "Analyse MSFT", "Nouvelles Tesla"'
        };
    }

    /**
     * Handle clarification response et continue avec 1-call path
     */
    async handleClarificationResponse(originalMessage, clarificationAnswer, intentCheck) {
        console.log('💬 Handling clarification response...');

        // Enrichir le message original avec la clarification
        let enrichedMessage = originalMessage;

        if (typeof clarificationAnswer === 'object' && clarificationAnswer.option_id) {
            // Multiple choice response
            const optionMap = {
                'price': 'Prix actuel et performance',
                'news': 'Dernières nouvelles',
                'analysis': 'Analyse complète avec fondamentaux et ratios',
                'recommendation': 'Recommandation achat ou vente'
            };
            enrichedMessage = `${originalMessage} - L'utilisateur veut: ${optionMap[clarificationAnswer.option_id] || clarificationAnswer.option_id}`;
        } else {
            // Open text response
            enrichedMessage = `${originalMessage}\n\nClarification de l'utilisateur: ${clarificationAnswer}`;
        }

        // Update intent check avec nouvelle info
        const updatedIntentCheck = {
            ...intentCheck,
            clarity_score: 9, // Maintenant c'est clair
            needs_clarification: false,
            user_clarification: clarificationAnswer
        };

        return {
            enrichedMessage,
            intentCheck: updatedIntentCheck,
            path: '1-call',
            totalLlmCalls: 2 // 1 clarification + 1 synthesis
        };
    }

    /**
     * Statistiques du router
     */
    getStats() {
        return {
            geminiCallsToday: this.geminiCallsToday,
            geminiLimitRemaining: this.FREE_TIER_LIMIT - this.geminiCallsToday,
            thresholds: {
                clarityHigh: this.CLARITY_HIGH,
                clarityMedium: this.CLARITY_MEDIUM
            }
        };
    }

    /**
     * Reset daily counters (à appeler à minuit)
     */
    resetDailyCounters() {
        this.geminiCallsToday = 0;
        console.log('🔄 Smart Router: Daily counters reset');
    }
}
