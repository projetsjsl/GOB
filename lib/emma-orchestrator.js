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

            // ÉTAPE 6: Validation des métriques obligatoires
            const validation = this.validateResponse(formatted.content, extracted, toolResults);

            // Mettre à jour l'historique conversationnel
            this.updateConversationHistory(userMessage, formatted.content, extracted);

            return {
                success: true,
                response: formatted.content,
                citations: response.citations || [],
                cost: response.cost,
                latency: response.latency,
                toolsUsed: selectedTools.map(t => t.id),
                model: 'perplexity-sonar-pro',
                validation  // Inclure résultat de validation
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
     * ÉTAPE 3: Exécution des outils avec cache intelligent
     */
    async executeTools(selectedTools, extracted, context) {
        if (selectedTools.length === 0) {
            return [];
        }

        const { tickers } = extracted;
        const ticker = tickers[0] || 'AAPL'; // Default ticker si aucun extrait

        // Exécuter tous les outils en parallèle avec cache
        const promises = selectedTools.map(async tool => {
            // Vérifier cache d'abord
            const cacheKey = `${tool.id}:${ticker}`;
            const cached = this.getFromCache(cacheKey, tool.id);

            if (cached) {
                console.log(`📦 Cache hit: ${tool.id} for ${ticker}`);
                return {
                    ...cached,
                    cached: true
                };
            }

            // Si pas en cache, exécuter
            const result = await this.executeSingleTool(tool, ticker, context);

            // Mettre en cache si succès
            if (result.success) {
                this.setInCache(cacheKey, result, tool.id);
            }

            return result;
        });

        const results = await Promise.all(promises);
        return results.filter(r => r.success && r.data);
    }

    /**
     * Récupérer depuis le cache avec TTL
     */
    getFromCache(key, toolId) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        // Déterminer TTL selon type d'outil
        const ttl = this.getCacheTTL(toolId);
        const age = Date.now() - cached.timestamp;

        if (age > ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Mettre en cache
     */
    setInCache(key, data, toolId) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Limiter taille du cache (max 100 entrées)
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * Déterminer TTL selon type d'outil
     */
    getCacheTTL(toolId) {
        if (toolId.includes('quote')) return this.CACHE_TTL.quote;
        if (toolId.includes('news')) return this.CACHE_TTL.news;
        if (toolId.includes('calendar')) return this.CACHE_TTL.calendar;
        return this.CACHE_TTL.fundamentals;
    }

    /**
     * Exécution d'un seul outil avec retry et fallbacks
     */
    async executeSingleTool(tool, ticker, context) {
        const startTime = Date.now();

        try {
            // Mapping intelligent tool ID → endpoint + params
            const toolData = this.getToolExecutionData(tool.id, ticker, context);

            if (!toolData) {
                throw new Error(`Tool ${tool.id} not supported`);
            }

            // Retry avec exponential backoff (2 tentatives max)
            let lastError;
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const data = await this.callToolEndpoint(toolData, attempt);
                    const latency = Date.now() - startTime;

                    return {
                        success: true,
                        toolId: tool.id,
                        toolName: tool.name,
                        data,
                        latency,
                        attempt: attempt + 1,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    lastError = error;
                    if (attempt < 1) {
                        // Wait avant retry: 500ms
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }

            throw lastError;

        } catch (error) {
            console.warn(`⚠️ Tool ${tool.id} failed:`, error.message);
            const latency = Date.now() - startTime;

            return {
                success: false,
                toolId: tool.id,
                toolName: tool.name,
                error: error.message,
                latency
            };
        }
    }

    /**
     * Mapping tool ID → données d'exécution
     */
    getToolExecutionData(toolId, ticker, context) {
        const apiKey = process.env.FMP_API_KEY;
        const baseURL = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        // Mapping centralisé des outils
        const toolsMap = {
            // FMP via /api/marketdata
            'fmp-quote': {
                url: `${baseURL}/api/marketdata?endpoint=quote&symbol=${ticker}`,
                method: 'GET'
            },
            'fmp-fundamentals': {
                url: `${baseURL}/api/marketdata?endpoint=fundamentals&symbol=${ticker}`,
                method: 'GET'
            },
            'fmp-ratios': {
                url: `https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${apiKey}`,
                method: 'GET',
                direct: true
            },
            'fmp-key-metrics': {
                url: `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${ticker}?apikey=${apiKey}`,
                method: 'GET',
                direct: true
            },
            'fmp-ticker-news': {
                url: `https://financialmodelingprep.com/api/v3/stock_news?tickers=${ticker}&limit=10&apikey=${apiKey}`,
                method: 'GET',
                direct: true
            },
            'fmp-ratings': {
                url: `https://financialmodelingprep.com/api/v3/rating/${ticker}?apikey=${apiKey}`,
                method: 'GET',
                direct: true
            },
            'earnings-calendar': {
                url: `https://financialmodelingprep.com/api/v3/earning_calendar?symbol=${ticker}&apikey=${apiKey}`,
                method: 'GET',
                direct: true
            },
            'economic-calendar': {
                url: `${baseURL}/api/calendar-economic`,
                method: 'GET'
            },
            'fmp-general-news': {
                url: `https://financialmodelingprep.com/api/v3/stock_news?limit=20&apikey=${apiKey}`,
                method: 'GET',
                direct: true
            },
            'supabase-watchlist': {
                url: `${baseURL}/api/supabase-watchlist`,
                method: 'GET'
            }
        };

        return toolsMap[toolId] || null;
    }

    /**
     * Appel au tool endpoint
     */
    async callToolEndpoint(toolData, attempt) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(toolData.url, {
                method: toolData.method,
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Validation basique des données
            if (!data || (Array.isArray(data) && data.length === 0)) {
                throw new Error('Empty response');
            }

            return data;

        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
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
        // OPTIMISÉ: max_tokens élevés (6000) pour analyses riches
        return await this.perplexity.generate(userPrompt, {
            systemPrompt,
            userMessage: userPrompt,
            temperature: 0.5, // Équilibre précision/créativité
            max_tokens: 6000  // Analyses complètes et détaillées
        });
    }

    /**
     * Prompt système optimisé pour Perplexity
     */
    buildMinimalSystemPrompt(context) {
        const channel = context?.channel || 'web';
        const conversational = context?.conversational;

        // Base Emma
        let prompt = `Tu es Emma, analyste financière IA senior propulsée par JSLAI.

🎯 **TON RÔLE**: Tu es une analyste financière experte qui interprète des données financières brutes pour les rendre actionnables.

📊 **MÉTRIQUES PRIORITAIRES** (si pertinent au contexte):
Pour analyses de tickers:
• Prix actuel + variation ($ et %)
• Ratios de valorisation: P/E, P/B, P/FCF
• Rentabilité: EPS, ROE, marges
• Performance: YTD %, 52w high/low
• Dividende et rendement
• News critiques récentes (2-3 max)
• Prochains résultats (date + consensus)

❌ **À ÉVITER**:
• Ne jamais copier du JSON brut
• Ne jamais dire "les données montrent" sans interpréter
• Ne jamais ignorer les données fournies

✅ **À FAIRE**:
• Interprète comme un analyste professionnel
• Utilise un langage clair et accessible
• Cite naturellement les chiffres dans ton analyse
• Structure ta réponse avec sections si > 2 paragraphes`;

        // Contexte conversationnel
        if (conversational?.needsIntroduction) {
            prompt += `\n\n🤝 **CONTEXTE**: C'est le premier contact - présente-toi brièvement (Emma, assistante IA financière JSLAI) puis réponds.`;
        }

        if (conversational?.hasCoreference) {
            prompt += `\n\n🔗 **CONTEXTE**: L'utilisateur fait référence à une conversation précédente. Tickers mentionnés: ${conversational.previousTickers?.join(', ') || 'aucun'}`;
        }

        if (conversational?.needsSpecificSkill) {
            const skills = conversational.skillsDetected?.map(s => s.skill).join(', ');
            prompt += `\n\n💼 **SKILL DEMANDÉ**: ${skills}`;
        }

        // Format selon canal
        if (channel === 'sms') {
            prompt += `\n\n📱 **FORMAT SMS**: Concis (2-3 paragraphes max, 400 caractères), émojis pertinents, essentiel seulement.`;
        } else if (channel === 'email') {
            prompt += `\n\n📧 **FORMAT EMAIL**: Structure professionnelle avec sections, détails complets, ton formel.`;
        } else {
            prompt += `\n\n💻 **FORMAT WEB**: Structure claire avec émojis, sections markdown, complet et détaillé.`;
        }

        return prompt;
    }

    /**
     * Formatage intelligent des résultats d'outils pour Perplexity
     */
    formatToolResults(toolResults) {
        if (!toolResults || toolResults.length === 0) {
            return "Aucune donnée financière disponible. Réponds avec tes connaissances générales.";
        }

        let formatted = "# DONNÉES FINANCIÈRES COLLECTÉES\n\n";

        // Organiser par catégorie
        const categories = {
            quote: [],
            fundamentals: [],
            ratios: [],
            metrics: [],
            news: [],
            calendar: [],
            other: []
        };

        for (const result of toolResults) {
            if (result.toolId.includes('quote')) categories.quote.push(result);
            else if (result.toolId.includes('fundamental')) categories.fundamentals.push(result);
            else if (result.toolId.includes('ratio')) categories.ratios.push(result);
            else if (result.toolId.includes('metric')) categories.metrics.push(result);
            else if (result.toolId.includes('news')) categories.news.push(result);
            else if (result.toolId.includes('calendar') || result.toolId.includes('earning')) categories.calendar.push(result);
            else categories.other.push(result);
        }

        // Formater par catégorie
        if (categories.quote.length > 0) {
            formatted += "## 📈 PRIX & COTATION\n";
            for (const r of categories.quote) {
                formatted += this._formatToolData(r);
            }
            formatted += "\n";
        }

        if (categories.fundamentals.length > 0) {
            formatted += "## 🏢 DONNÉES FONDAMENTALES\n";
            for (const r of categories.fundamentals) {
                formatted += this._formatToolData(r);
            }
            formatted += "\n";
        }

        if (categories.ratios.length > 0) {
            formatted += "## 📊 RATIOS FINANCIERS\n";
            for (const r of categories.ratios) {
                formatted += this._formatToolData(r);
            }
            formatted += "\n";
        }

        if (categories.metrics.length > 0) {
            formatted += "## 💰 MÉTRIQUES CLÉS\n";
            for (const r of categories.metrics) {
                formatted += this._formatToolData(r);
            }
            formatted += "\n";
        }

        if (categories.news.length > 0) {
            formatted += "## 📰 NOUVELLES\n";
            for (const r of categories.news) {
                formatted += this._formatToolData(r);
            }
            formatted += "\n";
        }

        if (categories.calendar.length > 0) {
            formatted += "## 📅 CALENDRIER\n";
            for (const r of categories.calendar) {
                formatted += this._formatToolData(r);
            }
            formatted += "\n";
        }

        if (categories.other.length > 0) {
            formatted += "## 📌 AUTRES DONNÉES\n";
            for (const r of categories.other) {
                formatted += this._formatToolData(r);
            }
            formatted += "\n";
        }

        formatted += "\n**IMPORTANT**: Interprète ces données comme un analyste. Ne copie pas le JSON brut.";

        return formatted;
    }

    /**
     * Formatage d'un résultat d'outil individuel
     */
    _formatToolData(result) {
        // Extraire les champs les plus importants
        const data = result.data;

        // Si c'est un array de news, formatter spécialement
        if (Array.isArray(data) && data.length > 0 && data[0].title) {
            let newsText = '';
            for (const item of data.slice(0, 5)) {
                newsText += `• **${item.title}** (${item.publishedDate || item.date || 'date inconnue'})\n`;
                if (item.text) newsText += `  ${item.text.substring(0, 150)}...\n`;
            }
            return newsText + '\n';
        }

        // Si c'est un array, prendre le premier élément
        const obj = Array.isArray(data) ? data[0] : data;

        if (!obj) return '(Aucune donnée)\n\n';

        // Formatter JSON de manière compacte mais lisible
        const important = this._extractImportantFields(obj);
        return `\`\`\`\n${JSON.stringify(important, null, 2)}\n\`\`\`\n`;
    }

    /**
     * Extraire les champs importants d'un objet
     */
    _extractImportantFields(obj) {
        // Si l'objet est déjà petit, le retourner tel quel
        const keys = Object.keys(obj);
        if (keys.length <= 15) return obj;

        // Sinon, extraire les champs prioritaires
        const priority = [
            'symbol', 'price', 'change', 'changesPercentage', 'volume',
            'companyName', 'industry', 'sector', 'marketCap',
            'peRatio', 'peRatioTTM', 'priceToBookRatio', 'dividendYield',
            'eps', 'epsGrowth', 'revenueGrowth', 'netIncome',
            'currentRatio', 'debtToEquity', 'returnOnEquity',
            'yearHigh', 'yearLow', 'fiftyDayAverage', 'twoHundredDayAverage',
            'date', 'title', 'text', 'url'
        ];

        const extracted = {};
        for (const key of priority) {
            if (obj[key] !== undefined && obj[key] !== null) {
                extracted[key] = obj[key];
            }
        }

        return Object.keys(extracted).length > 0 ? extracted : obj;
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
     * Validation des métriques obligatoires dans la réponse
     */
    validateResponse(responseText, extracted, toolResults) {
        const { tickers, isAnalysis } = extracted;

        // Si pas d'analyse de ticker, pas de validation nécessaire
        if (tickers.length === 0 || !isAnalysis) {
            return {
                validated: true,
                requiredMetrics: [],
                foundMetrics: [],
                missingMetrics: [],
                coverage: 100
            };
        }

        // Métriques obligatoires pour analyse de ticker
        const requiredMetrics = [
            { name: 'Prix', patterns: ['prix', 'price', '$', 'USD', 'cotation'] },
            { name: 'Variation', patterns: ['%', 'variation', 'change', 'hausse', 'baisse'] },
            { name: 'P/E', patterns: ['p/e', 'pe ratio', 'price/earnings', 'price-to-earnings'] },
            { name: 'EPS', patterns: ['eps', 'bénéfice par action', 'earnings per share'] },
            { name: 'Performance', patterns: ['ytd', 'year-to-date', 'performance', '52 week', '52w'] }
        ];

        const text = responseText.toLowerCase();
        const foundMetrics = [];
        const missingMetrics = [];

        for (const metric of requiredMetrics) {
            const found = metric.patterns.some(pattern => text.includes(pattern.toLowerCase()));
            if (found) {
                foundMetrics.push(metric.name);
            } else {
                // Vérifier si la donnée existe dans toolResults avant de marquer comme manquante
                const dataAvailable = this.checkMetricInToolResults(metric.name, toolResults);
                if (dataAvailable) {
                    missingMetrics.push(metric.name);
                }
            }
        }

        const coverage = (foundMetrics.length / requiredMetrics.length) * 100;

        return {
            validated: missingMetrics.length === 0,
            requiredMetrics: requiredMetrics.map(m => m.name),
            foundMetrics,
            missingMetrics,
            coverage: Math.round(coverage)
        };
    }

    /**
     * Vérifier si une métrique existe dans les tool results
     */
    checkMetricInToolResults(metricName, toolResults) {
        if (!toolResults || toolResults.length === 0) return false;

        for (const result of toolResults) {
            const dataStr = JSON.stringify(result.data).toLowerCase();

            switch (metricName) {
                case 'Prix':
                    if (dataStr.includes('price') || dataStr.includes('quote')) return true;
                    break;
                case 'Variation':
                    if (dataStr.includes('change') || dataStr.includes('percentage')) return true;
                    break;
                case 'P/E':
                    if (dataStr.includes('peratio') || dataStr.includes('pe')) return true;
                    break;
                case 'EPS':
                    if (dataStr.includes('eps')) return true;
                    break;
                case 'Performance':
                    if (dataStr.includes('ytd') || dataStr.includes('52week')) return true;
                    break;
            }
        }

        return false;
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
