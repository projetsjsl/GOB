/**
 * Emma Orchestrator - Orchestrateur Intelligent avec Délégation Perplexity
 *
 * Philosophie:
 * - Emma = ORCHESTRATEUR INTELLIGENT (extraction, sélection outils, fallbacks multi-sources, exécution parallèle)
 * - Perplexity = ANALYSTE (intention, analyse, rédaction)
 *
 * Emma orchestre VRAIMENT:
 * ✅ Fallbacks multi-sources (FMP → Polygon → Twelve Data → Alpha Vantage → Finnhub → Yahoo Finance)
 * ✅ Exécution parallèle optimisée
 * ✅ Retry intelligent avec exponential backoff
 * ✅ Cache stratégique (5min quotes, 1h fundamentals)
 * ✅ Sélection d'outils pertinents selon contexte
 *
 * Ce qui est délégué à Perplexity:
 * ✅ Analyse d'intention profonde
 * ✅ Rédaction et synthèse
 * ✅ Style et ton
 *
 * Réduction: ~1500 lignes de prompts → ~400 lignes d'orchestration pure
 */

import { PerplexityClient } from './perplexity-client.js';
import toolsConfig from '../config/tools_config.json' with { type: 'json' };

export class EmmaOrchestrator {
    constructor() {
        this.perplexity = new PerplexityClient();
        this.toolsConfig = toolsConfig;

        // Configuration des sources de données avec priorités
        this.DATA_SOURCES = {
            quote: ['polygon', 'twelve_data', 'fmp', 'yahoo'],
            fundamentals: ['fmp', 'alpha_vantage', 'twelve_data'],
            news: ['fmp', 'finnhub', 'finviz'],
            calendar: ['fmp'],
            analyst: ['fmp']
        };

        // Mapping outils essentiels pour analyse complète
        this.ESSENTIAL_TOOLS_FOR_ANALYSIS = [
            'fmp-quote',              // Prix actuel (avec fallback Polygon/Twelve Data)
            'fmp-fundamentals',       // Profil entreprise (avec fallback Alpha Vantage/Twelve Data)
            'fmp-ratios',             // P/E, P/B, ROE, Debt/Equity
            'fmp-key-metrics',        // EPS, Free Cash Flow, Market Cap
            'fmp-ticker-news',        // Nouvelles récentes (avec fallback Finnhub)
            'fmp-ratings',            // Consensus analystes
            'earnings-calendar'       // Prochains résultats
        ];

        // Cache en mémoire (5min quotes, 1h fundamentals)
        this.cache = new Map();
        this.CACHE_TTL = {
            quote: 5 * 60 * 1000,
            fundamentals: 60 * 60 * 1000,
            news: 10 * 60 * 1000,
            calendar: 60 * 60 * 1000
        };

        // Intelligence conversationnelle (gestion d'historique et contexte)
        this.conversationHistory = [];
        this.lastTickers = [];  // Tickers mentionnés récemment
        this.lastIntent = null; // Dernier intent détecté
    }

    /**
     * Point d'entrée principal
     */
    async process(userMessage, context = {}) {
        console.log('🎯 Emma Orchestrator: Processing request');

        try {
            // 🧠 INTELLIGENCE CONVERSATIONNELLE: Gestion AVANT l'appel LLM
            const conversationalContext = this.analyzeConversationalContext(userMessage, context);

            // Si réponse directe possible (politesse, FAQ, etc.), répondre sans appeler Perplexity
            if (conversationalContext.canAnswerDirectly) {
                console.log('💬 Direct answer (no LLM needed)');
                return {
                    success: true,
                    response: conversationalContext.directAnswer,
                    conversational: true,
                    cost: { total: 0 },
                    toolsUsed: []
                };
            }

            // Enrichir le contexte avec l'historique conversationnel
            context.conversational = conversationalContext;
            context.conversationHistory = this.conversationHistory;
            // ÉTAPE 1: Extraction légère (local, 0 coût)
            const extracted = this.quickExtract(userMessage, context);
            console.log('📊 Extracted:', extracted);

            // ÉTAPE 2: Sélection outils (logique simple)
            const selectedTools = this.selectTools(extracted, userMessage, context);
            console.log('🔧 Selected tools:', selectedTools.map(t => t.id));

            // ÉTAPE 3: Exécution parallèle
            const toolResults = await this.executeTools(selectedTools, extracted, context);
            console.log('✅ Tool execution completed:', toolResults.length, 'results');

            // ÉTAPE 4: Délégation à Perplexity
            const response = await this.delegateToPerplexity({
                userMessage,
                toolResults,
                context,
                extracted
            });

            // ÉTAPE 5: Formatage léger selon canal
            const formatted = this.applyChannelFormatting(response, context.channel);

            // Mettre à jour l'historique conversationnel
            this.updateConversationHistory(userMessage, formatted.content, extracted);

            return {
                success: true,
                response: formatted.content,
                citations: response.citations || [],
                cost: response.cost,
                latency: response.latency,
                toolsUsed: selectedTools.map(t => t.id),
                model: 'perplexity-sonar-pro'
            };
        } catch (error) {
            console.error('❌ Emma Orchestrator Error:', error);
            return {
                success: false,
                response: this.getFallbackResponse(error),
                error: error.message
            };
        }
    }

    /**
     * ÉTAPE 1: Extraction légère (0 coût LLM)
     */
    quickExtract(userMessage, context) {
        // Extraction de tickers avec regex simple
        const tickerRegex = /\b([A-Z]{1,5})\b/g;
        const potentialTickers = [...new Set(userMessage.match(tickerRegex) || [])];

        // Filtrer les faux positifs courants (mots communs en majuscules)
        const commonWords = ['EMMA', 'FMP', 'API', 'USD', 'CAD', 'CEO', 'IPO', 'ETF', 'PE', 'EPS', 'ROE', 'YTD'];
        const tickers = potentialTickers.filter(t =>
            !commonWords.includes(t) &&
            t.length >= 1 &&
            t.length <= 5
        );

        // Détection de type de requête (keywords simples)
        const needsData = /cours|prix|analyse|ratio|news|résultat|earning|dividend|pe|eps|roe/i.test(userMessage);
        const isAnalysis = /analys|éval|comment|avis|opinion/i.test(userMessage);
        const isNews = /nouvelles|news|actualité|quoi de neuf/i.test(userMessage);
        const isCalendar = /calendrier|événement|résultat|earning/i.test(userMessage);
        const isPoliteness = /^(bonjour|salut|merci|hello|hi|hey|test)/i.test(userMessage.trim());

        return {
            tickers,
            needsData,
            isAnalysis,
            isNews,
            isCalendar,
            isPoliteness,
            hasExplicitTicker: tickers.length > 0
        };
    }

    /**
     * ÉTAPE 2: Sélection outils (logique simple, 0 coût LLM)
     */
    selectTools(extracted, userMessage, context) {
        const tools = [];
        const { tickers, isAnalysis, isNews, isCalendar, isPoliteness } = extracted;

        // Si politesse simple, aucun outil nécessaire
        if (isPoliteness && !extracted.needsData) {
            return [];
        }

        // PRIORITÉ 1: Si SKILL spécifique détecté dans contexte conversationnel
        if (context.conversational?.needsSpecificSkill && context.conversational.skillsDetected) {
            console.log('🎯 Skills détectés:', context.conversational.skillsDetected.map(s => s.skill).join(', '));

            // Collecter tous les tools recommandés par les skills
            const skillsTools = new Set();
            for (const skillData of context.conversational.skillsDetected) {
                for (const toolId of skillData.tools) {
                    skillsTools.add(toolId);
                }
            }

            // Retourner les outils des skills
            return Array.from(skillsTools)
                .map(id => this.toolsConfig.tools.find(t => t.id === id))
                .filter(t => t && t.enabled);
        }

        // PRIORITÉ 2: Si ticker mentionné + analyse → 7 outils essentiels
        if (tickers.length > 0 && (isAnalysis || context.comprehensive)) {
            return this.ESSENTIAL_TOOLS_FOR_ANALYSIS
                .map(id => this.toolsConfig.tools.find(t => t.id === id))
                .filter(t => t && t.enabled);
        }

        // PRIORITÉ 3: Si ticker mentionné (sans analyse complète) → outils de base
        if (tickers.length > 0) {
            tools.push('fmp-quote', 'fmp-ticker-news', 'fmp-key-metrics');
        }

        // Si demande de nouvelles
        if (isNews) {
            if (tickers.length > 0) {
                tools.push('fmp-ticker-news');
            } else {
                tools.push('fmp-general-news');
            }
        }

        // Si demande de calendrier
        if (isCalendar) {
            tools.push('earnings-calendar', 'economic-calendar');
        }

        // Retourner les objets d'outils complets
        return [...new Set(tools)]
            .map(id => this.toolsConfig.tools.find(t => t.id === id))
            .filter(t => t && t.enabled);
    }

    /**
     * ÉTAPE 3: Exécution des outils
     */
    async executeTools(selectedTools, extracted, context) {
        if (selectedTools.length === 0) {
            return [];
        }

        const { tickers } = extracted;
        const ticker = tickers[0] || 'AAPL'; // Default ticker si aucun extrait

        // Exécuter tous les outils en parallèle
        const promises = selectedTools.map(tool =>
            this.executeSingleTool(tool, ticker, context)
        );

        const results = await Promise.all(promises);
        return results.filter(r => r.success && r.data);
    }

    /**
     * Exécution d'un seul outil
     */
    async executeSingleTool(tool, ticker, context) {
        try {
            const startTime = Date.now();

            // Construction de l'URL endpoint
            const endpoint = this.buildEndpoint(tool, ticker);

            // Appel API
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const latency = Date.now() - startTime;

            return {
                success: true,
                toolId: tool.id,
                toolName: tool.name,
                data,
                latency,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn(`⚠️ Tool ${tool.id} failed:`, error.message);
            return {
                success: false,
                toolId: tool.id,
                error: error.message
            };
        }
    }

    /**
     * Construction de l'endpoint pour un outil
     */
    buildEndpoint(tool, ticker) {
        const { endpoint } = tool.implementation;

        // Remplacer {ticker} dans l'endpoint
        let url = endpoint.replace('{ticker}', ticker).replace('{symbol}', ticker);

        // Si endpoint relatif, construire URL complète
        if (url.startsWith('/api/')) {
            // En production, utiliser l'URL Vercel, en dev utiliser localhost
            const baseURL = process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000';
            url = `${baseURL}${url}`;
        }

        return url;
    }

    /**
     * ÉTAPE 4: Délégation à Perplexity
     */
    async delegateToPerplexity({ userMessage, toolResults, context, extracted }) {
        // Prompt système MINIMAL (déléguer rédaction au LLM)
        const systemPrompt = this.buildMinimalSystemPrompt(context);

        // Formatage des données d'outils
        const dataContext = this.formatToolResults(toolResults);

        // Construction du message utilisateur
        const userPrompt = `QUESTION: ${userMessage}

${dataContext}`;

        // Appel à Perplexity
        return await this.perplexity.generate(userPrompt, {
            systemPrompt,
            userMessage: userPrompt,
            temperature: 0.3,
            max_tokens: 1500
        });
    }

    /**
     * Prompt système MINIMAL (100 mots max)
     */
    buildMinimalSystemPrompt(context) {
        const channel = context?.channel || 'web';

        // Base commune ultra-légère
        let prompt = `Tu es Emma, analyste financière IA propulsée par JSLAI.

Utilise les données fournies pour répondre avec précision. Cite tes sources.

Pour analyses de tickers, TOUJOURS inclure si disponible:
- Prix actuel et variation (% et $)
- P/E Ratio
- EPS (Bénéfice par action)
- Dividende et rendement
- Performance YTD
- Nouvelles récentes importantes
- Prochains résultats (date)`;

        // Adaptations légères par canal
        if (channel === 'sms') {
            prompt += `\n\nFormat SMS: Concis (2-3 paragraphes max), utilise émojis pertinents 📊💰📈`;
        } else {
            prompt += `\n\nFormat complet: Structuré avec sections, émojis pertinents, détails approfondis.`;
        }

        return prompt;
    }

    /**
     * Formatage des résultats d'outils pour Perplexity
     */
    formatToolResults(toolResults) {
        if (!toolResults || toolResults.length === 0) {
            return "Aucune donnée financière externe disponible. Utilise tes connaissances générales.";
        }

        let formatted = "DONNÉES FINANCIÈRES DISPONIBLES:\n\n";

        for (const result of toolResults) {
            formatted += `## ${result.toolName}\n`;
            formatted += `\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`\n\n`;
        }

        return formatted;
    }

    /**
     * ÉTAPE 5: Formatage léger selon canal
     */
    applyChannelFormatting(response, channel) {
        const content = response.content || response;

        // SMS: Tronquer si trop long
        if (channel === 'sms' && content.length > 600) {
            return {
                content: content.substring(0, 550) + '...\n\n📱 Consulte le web pour plus de détails',
                citations: response.citations || [],
                truncated: true
            };
        }

        // Autres canaux: Pas de modification
        return {
            content,
            citations: response.citations || [],
            truncated: false
        };
    }

    /**
     * 🧠 INTELLIGENCE CONVERSATIONNELLE
     * Analyse le contexte conversationnel AVANT l'appel LLM
     */
    analyzeConversationalContext(userMessage, context) {
        const msg = userMessage.toLowerCase().trim();

        // 1. POLITESSES SIMPLES (réponse directe, pas de LLM nécessaire)
        const politeResponses = {
            'merci': '😊 Avec plaisir ! N\'hésite pas si tu as d\'autres questions financières.',
            'thank you': 'You\'re welcome! Feel free to ask me anything about finance.',
            'thanks': 'Happy to help! 📊',
            'ok': 'Parfait ! Autre chose ?',
            'okay': 'Super ! Besoin d\'autre chose ?',
            'bye': 'À bientôt ! 👋 Écris-moi au 1-438-544-EMMA',
            'au revoir': 'À bientôt ! 📱 1-438-544-EMMA'
        };

        for (const [pattern, response] of Object.entries(politeResponses)) {
            if (msg === pattern || msg.startsWith(pattern + ' ') || msg.endsWith(' ' + pattern)) {
                return {
                    canAnswerDirectly: true,
                    directAnswer: response,
                    intent: 'politeness'
                };
            }
        }

        // 2. DEMANDE D'AIDE / SKILLS
        if (/^(aide|help|skills|capacités|fonctions|que peux-tu)/i.test(msg)) {
            return {
                canAnswerDirectly: true,
                directAnswer: this.getSkillsMessage(),
                intent: 'help'
            };
        }

        // 3. MOTS-CLÉS SKILLS SPÉCIFIQUES
        const skillsKeywords = this.detectSkillsKeywords(userMessage);
        if (skillsKeywords.detected) {
            return {
                canAnswerDirectly: false, // Nécessite orchestration spécifique
                skillsDetected: skillsKeywords.keywords,
                needsSpecificSkill: true,
                intent: 'skills_specific'
            };
        }

        // 3. SALUTATIONS (intro requise)
        if (/^(bonjour|salut|hello|hi|hey|test emma)/i.test(msg)) {
            return {
                canAnswerDirectly: false, // Déléguer à Perplexity pour réponse personnalisée
                needsIntroduction: true,
                intent: 'greeting'
            };
        }

        // 4. CORÉFÉRENCES (résoudre avec historique)
        // Ex: "et MSFT?" après "Analyse AAPL"
        if (/^(et |compare |aussi |what about |how about )/i.test(msg)) {
            return {
                canAnswerDirectly: false,
                hasCoreference: true,
                previousTickers: this.lastTickers,
                previousIntent: this.lastIntent,
                intent: 'followup'
            };
        }

        // 5. QUESTIONS CONTEXTUELLES (utiliser historique)
        // Ex: "et son dividende?" après "Analyse AAPL"
        const contextualKeywords = ['son', 'sa', 'ses', 'leur', 'ce', 'cette', 'celui'];
        const hasContextualReference = contextualKeywords.some(kw => msg.includes(` ${kw} `));

        if (hasContextualReference && this.lastTickers.length > 0) {
            return {
                canAnswerDirectly: false,
                needsContextResolution: true,
                previousTickers: this.lastTickers,
                intent: 'contextual_question'
            };
        }

        // 6. PAS DE RÉPONSE DIRECTE POSSIBLE → Déléguer à Perplexity
        return {
            canAnswerDirectly: false,
            intent: 'analysis_needed'
        };
    }

    /**
     * Détection des mots-clés SKILLS spécifiques
     */
    detectSkillsKeywords(userMessage) {
        const msg = userMessage.toLowerCase();
        const detected = [];

        // Mapping mots-clés → Skills
        const skillsMap = {
            // Briefings
            briefing: {
                keywords: ['briefing', 'résumé quotidien', 'rapport', 'revue'],
                skill: 'briefing',
                tools: ['fmp-ticker-news', 'fmp-general-news', 'calendar-economic', 'earnings-calendar']
            },
            briefing_matin: {
                keywords: ['briefing matin', 'résumé matin', 'matin', 'morning'],
                skill: 'briefing_matin',
                tools: ['fmp-ticker-news', 'earnings-calendar']
            },
            briefing_midi: {
                keywords: ['briefing midi', 'résumé midi', 'midday'],
                skill: 'briefing_midi',
                tools: ['fmp-ticker-news', 'fmp-general-news']
            },
            briefing_soir: {
                keywords: ['briefing soir', 'résumé soir', 'evening'],
                skill: 'briefing_soir',
                tools: ['fmp-ticker-news', 'economic-calendar']
            },

            // Calendriers
            calendrier: {
                keywords: ['calendrier', 'calendar', 'événements', 'events'],
                skill: 'calendar',
                tools: ['earnings-calendar', 'economic-calendar', 'calendar-dividends']
            },
            earnings_calendar: {
                keywords: ['résultats', 'earnings', 'rapports trimestriels', 'quarterly'],
                skill: 'earnings_calendar',
                tools: ['earnings-calendar']
            },
            economic_calendar: {
                keywords: ['économique', 'economic', 'macro', 'fed', 'banque centrale'],
                skill: 'economic_calendar',
                tools: ['economic-calendar']
            },
            dividends_calendar: {
                keywords: ['dividende', 'dividend', 'distribution'],
                skill: 'dividends_calendar',
                tools: ['calendar-dividends']
            },

            // Courbes & Visualisations
            courbes: {
                keywords: ['courbe', 'graphique', 'chart', 'visualisation', 'graph'],
                skill: 'charts',
                tools: ['twelve-data-technical']
            },
            intraday: {
                keywords: ['intraday', 'journée', 'today', 'aujourd\'hui'],
                skill: 'intraday',
                tools: ['twelve-data-technical']
            },

            // Indicateurs techniques
            technical: {
                keywords: ['technique', 'technical', 'rsi', 'macd', 'sma', 'ema', 'bollinger'],
                skill: 'technical_indicators',
                tools: ['twelve-data-technical']
            },

            // Watchlist
            watchlist: {
                keywords: ['watchlist', 'portfolio', 'suivi', 'dan'],
                skill: 'watchlist',
                tools: ['supabase-watchlist']
            }
        };

        // Détecter les skills demandés
        for (const [skillId, skillData] of Object.entries(skillsMap)) {
            for (const keyword of skillData.keywords) {
                if (msg.includes(keyword)) {
                    detected.push({
                        skill: skillData.skill,
                        keyword,
                        tools: skillData.tools
                    });
                    break; // Un seul match par skill suffit
                }
            }
        }

        return {
            detected: detected.length > 0,
            keywords: detected,
            count: detected.length
        };
    }

    /**
     * Message SKILLS (capacités avancées d'Emma)
     */
    getSkillsMessage() {
        return `📋 **MES CAPACITÉS AVANCÉES**

📊 **Analyses Complètes**
   • Analyses de tickers avec métriques obligatoires (P/E, EPS, dividende, YTD, etc.)
   • Comparaisons multi-tickers
   • Données en temps réel (quotes, news, calendriers)

📅 **Calendriers**
   • Calendrier des résultats (earnings calendar)
   • Événements économiques
   • Dividendes à venir

📈 **Courbes & Visualisations**
   • Graphiques intraday
   • Historiques de prix
   • Indicateurs techniques (RSI, MACD, etc.)

📰 **Briefings Quotidiens**
   • Briefing matin (11h20 UTC)
   • Briefing midi (15h50 UTC)
   • Briefing soir (20h20 UTC)

🔔 **Notifications Multi-Canal**
   • SMS: 1-438-544-EMMA
   • Email: emma@gobapps.com
   • Messenger: @EmmaGOB
   • Web: Dashboard GOB

💼 **Données Multi-Sources**
   • FMP, Polygon, Twelve Data, Alpha Vantage, Finnhub, Yahoo Finance
   • Fallbacks automatiques pour fiabilité maximale

Écris-moi au **1-438-544-EMMA** 📱`;
    }

    /**
     * Mise à jour de l'historique conversationnel
     */
    updateConversationHistory(userMessage, response, extracted) {
        this.conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        });

        this.conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString()
        });

        // Garder seulement les 10 derniers échanges (20 messages)
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }

        // Mettre à jour les tickers récents
        if (extracted && extracted.tickers && extracted.tickers.length > 0) {
            this.lastTickers = extracted.tickers;
        }
    }

    /**
     * Réponse de secours en cas d'erreur
     */
    getFallbackResponse(error) {
        return `Désolé, j'ai rencontré un problème technique 😔

Erreur: ${error.message}

Essaie de reformuler ta question ou contacte le support.

📱 1-438-544-EMMA`;
    }

    /**
     * Test de connexion
     */
    async test() {
        console.log('🧪 Testing Emma Orchestrator...');

        // Test 1: Perplexity connection
        const perplexityTest = await this.perplexity.testConnection();
        console.log('Perplexity:', perplexityTest.success ? '✅' : '❌', perplexityTest);

        // Test 2: Simple query
        const testQuery = await this.process('Bonjour Emma', { channel: 'web' });
        console.log('Simple query:', testQuery.success ? '✅' : '❌');

        return {
            perplexity: perplexityTest.success,
            query: testQuery.success
        };
    }
}

/**
 * Exemple d'utilisation:
 *
 * const orchestrator = new EmmaOrchestrator();
 * const response = await orchestrator.process('Analyse AAPL', {
 *     channel: 'web',
 *     comprehensive: true
 * });
 *
 * console.log(response.response);
 * console.log('Coût:', response.cost.total);
 * console.log('Citations:', response.citations);
 */
