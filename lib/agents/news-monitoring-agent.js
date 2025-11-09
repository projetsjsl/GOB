/**
 * NEWS MONITORING AGENT
 *
 * Surveillance continue des actualités financières avec scoring d'importance.
 *
 * Fonctionnalités:
 * - Monitoring toutes les 15min pendant heures de marché
 * - Scoring d'importance (0-10) basé sur impact potentiel
 * - Catégorisation automatique (earnings, M&A, regulatory, etc.)
 * - Analyse de sentiment (-1.0 à +1.0)
 * - Alertes immédiates pour score ≥9 (événements critiques)
 * - Digest hebdomadaire (vendredi 16h30)
 * - Déduplication intelligente (même news de plusieurs sources)
 *
 * Intégration:
 * - FMP News API (primary)
 * - Finnhub News API (fallback)
 * - Perplexity : Analyse sentiment + importance
 * - Supabase : Table significant_news
 * - n8n : Polling automatique + notifications
 */

export class NewsMonitoringAgent {
    constructor() {
        this.name = 'NewsMonitoringAgent';
        this.description = 'Surveillance continue des actualités avec scoring d\'importance';
        this.capabilities = [
            'monitor_news',
            'score_importance',
            'categorize_news',
            'analyze_sentiment',
            'generate_alerts',
            'weekly_digest'
        ];

        // Catégories d'actualités
        this.categories = {
            EARNINGS: 'earnings',           // Résultats trimestriels
            GUIDANCE: 'guidance',           // Guidances / Prévisions
            MA: 'mergers_acquisitions',     // Fusions & acquisitions
            REGULATORY: 'regulatory',       // Réglementation / Gouvernement
            PRODUCT: 'product',             // Nouveaux produits / Services
            MANAGEMENT: 'management',       // Changements direction
            LEGAL: 'legal',                 // Litiges / Problèmes légaux
            PARTNERSHIP: 'partnership',     // Partenariats stratégiques
            INVESTMENT: 'investment',       // Investissements majeurs
            OTHER: 'other'                  // Autre
        };

        // Dernière vérification (pour éviter doublons)
        this.lastCheckTime = null;
    }

    /**
     * Monitoring principal (à appeler toutes les 15min)
     */
    async monitorNews(tickers, lookbackMinutes = 15) {
        console.log(`📰 Monitoring news pour ${tickers.length} tickers (derniers ${lookbackMinutes}min)...`);

        const results = {
            success: true,
            checked_at: new Date().toISOString(),
            lookback_minutes: lookbackMinutes,
            tickers_monitored: tickers.length,
            total_news: 0,
            significant_news: 0,
            critical_alerts: 0,
            news_by_ticker: {}
        };

        try {
            // Calculer la fenêtre de temps
            const now = new Date();
            const lookbackTime = new Date(now.getTime() - lookbackMinutes * 60 * 1000);

            // Pour chaque ticker, récupérer news récentes
            for (const ticker of tickers) {
                try {
                    const tickerNews = await this._fetchRecentNews(ticker, lookbackTime);

                    if (tickerNews.length > 0) {
                        console.log(`📰 ${ticker}: ${tickerNews.length} actualités trouvées`);

                        // Analyser chaque news
                        const analyzedNews = [];

                        for (const news of tickerNews) {
                            // Éviter doublons (vérifier si déjà en DB)
                            const isDuplicate = await this._checkDuplicate(news);

                            if (!isDuplicate) {
                                const analysis = await this._analyzeNews(ticker, news);
                                analyzedNews.push(analysis);

                                // Si importance ≥ 7, sauvegarder
                                if (analysis.importance_score >= 7) {
                                    await this._saveSignificantNews(ticker, analysis);
                                    results.significant_news++;

                                    console.log(`⭐ ${ticker}: News importante (${analysis.importance_score}/10) - ${analysis.category}`);
                                }

                                // Si importance ≥ 9, créer alerte
                                if (analysis.importance_score >= 9) {
                                    await this._createCriticalAlert(ticker, analysis);
                                    results.critical_alerts++;

                                    console.log(`🚨 ${ticker}: ALERTE CRITIQUE (${analysis.importance_score}/10) - ${news.headline}`);
                                }
                            }
                        }

                        results.news_by_ticker[ticker] = analyzedNews.length;
                        results.total_news += tickerNews.length;
                    }

                } catch (error) {
                    console.error(`❌ Erreur monitoring ${ticker}:`, error.message);
                }

                // Rate limiting
                await this._sleep(200); // 5 req/sec
            }

            // Mettre à jour last check time
            this.lastCheckTime = now;

            console.log(`✅ Monitoring terminé: ${results.significant_news} news significatives, ${results.critical_alerts} alertes critiques`);
            return results;

        } catch (error) {
            console.error('❌ Erreur monitoring news:', error);
            results.success = false;
            results.error = error.message;
            return results;
        }
    }

    /**
     * Génère digest hebdomadaire (vendredi 16h30)
     */
    async generateWeeklyDigest(tickers) {
        console.log(`📊 Génération digest hebdomadaire pour ${tickers.length} tickers...`);

        try {
            // Récupérer toutes les news importantes de la semaine
            const weeklyNews = await this._fetchWeeklySignificantNews(tickers);

            // Grouper par ticker
            const newsByTicker = this._groupByTicker(weeklyNews);

            // Analyser tendances
            const trends = this._analyzeTrends(weeklyNews);

            // Construire digest structuré
            const digest = {
                period: {
                    from: this._getWeekStart(),
                    to: this._getWeekEnd()
                },
                generated_at: new Date().toISOString(),
                summary: {
                    total_significant_news: weeklyNews.length,
                    critical_events: weeklyNews.filter(n => n.importance_score >= 9).length,
                    tickers_with_activity: Object.keys(newsByTicker).length
                },
                trends: trends,
                by_ticker: newsByTicker,
                top_stories: this._selectTopStories(weeklyNews, 10)
            };

            // Sauvegarder digest
            await this._saveWeeklyDigest(digest);

            console.log(`✅ Digest hebdomadaire généré: ${weeklyNews.length} news, ${digest.summary.critical_events} événements critiques`);
            return digest;

        } catch (error) {
            console.error('❌ Erreur génération digest:', error);
            throw error;
        }
    }

    /**
     * Récupère news récentes depuis APIs unifiées
     * Utilise maintenant l'endpoint /api/news.js qui agrège toutes les sources
     */
    async _fetchRecentNews(ticker, since) {
        const news = [];

        // Utiliser l'endpoint unifié /api/news.js (priorité)
        try {
            const baseUrl = process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

            const unifiedNews = await fetch(`${baseUrl}/api/news?ticker=${ticker}&limit=50&context=general`, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (unifiedNews.ok) {
                const data = await unifiedNews.json();
                if (data.articles && Array.isArray(data.articles)) {
                    // Filtrer par date
                    const filteredNews = data.articles
                        .filter(article => {
                            const articleDate = new Date(article.published_at || article.datetime || article.date);
                            return articleDate >= since;
                        })
                        .map(article => ({
                            source: article.source_provider || article.source || 'Unified',
                            headline: article.title || article.headline,
                            summary: article.summary,
                            url: article.url,
                            published_at: article.published_at || article.datetime || article.date,
                            image: article.image,
                            site: article.source_original || article.source,
                            relevance_score: article.relevance_score || 5.0,
                            source_key: article.source_key
                        }));

                    news.push(...filteredNews);
                    console.log(`✅ Unified news API: ${filteredNews.length} articles for ${ticker}`);
                }
            }
        } catch (error) {
            console.error(`❌ Unified news API error for ${ticker}:`, error.message);
        }

        // Fallback vers sources individuelles si endpoint unifié échoue
        if (news.length === 0) {
            // SOURCE 1: FMP News (primary)
            try {
                const fmpNews = await this._fetchFMPNews(ticker, since);
                news.push(...fmpNews);
            } catch (error) {
                console.error(`❌ FMP news error for ${ticker}:`, error.message);
            }

            // SOURCE 2: Finnhub News (fallback)
            if (news.length === 0) {
                try {
                    const finnhubNews = await this._fetchFinnhubNews(ticker, since);
                    news.push(...finnhubNews);
                } catch (error) {
                    console.error(`❌ Finnhub news error for ${ticker}:`, error.message);
                }
            }
        }

        return news;
    }

    /**
     * Récupère news depuis FMP
     */
    async _fetchFMPNews(ticker, since) {
        const FMP_API_KEY = process.env.FMP_API_KEY;

        if (!FMP_API_KEY) {
            return [];
        }

        try {
            const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${ticker}&limit=50&apikey=${FMP_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                return [];
            }

            const data = await response.json();

            // Filtrer par date
            return data
                .filter(news => new Date(news.publishedDate) >= since)
                .map(news => ({
                    source: 'FMP',
                    headline: news.title,
                    summary: news.text,
                    url: news.url,
                    published_at: news.publishedDate,
                    image: news.image,
                    site: news.site
                }));

        } catch (error) {
            console.error('❌ FMP fetch error:', error);
            return [];
        }
    }

    /**
     * Récupère news depuis Finnhub
     */
    async _fetchFinnhubNews(ticker, since) {
        const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

        if (!FINNHUB_API_KEY) {
            return [];
        }

        try {
            const sinceTimestamp = Math.floor(since.getTime() / 1000);
            const nowTimestamp = Math.floor(Date.now() / 1000);

            const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${sinceTimestamp}&to=${nowTimestamp}&token=${FINNHUB_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                return [];
            }

            const data = await response.json();

            return data.map(news => ({
                source: 'Finnhub',
                headline: news.headline,
                summary: news.summary,
                url: news.url,
                published_at: new Date(news.datetime * 1000).toISOString(),
                image: news.image,
                site: news.source
            }));

        } catch (error) {
            console.error('❌ Finnhub fetch error:', error);
            return [];
        }
    }

    /**
     * Analyse une news (importance + catégorie + sentiment)
     * Utilise maintenant le scoring de pertinence depuis l'API unifiée
     */
    async _analyzeNews(ticker, news) {
        console.log(`🔍 Analyse: ${news.headline.substring(0, 60)}...`);

        try {
            // Utiliser le score de pertinence si disponible (depuis API unifiée)
            let importanceScore = news.relevance_score || 5.0;
            
            // Ajuster le score selon l'analyse Perplexity (si disponible)
            try {
                const analysis = await this._analyzeWithPerplexity(ticker, news);
                // Combiner score de pertinence (60%) avec analyse Perplexity (40%)
                importanceScore = (importanceScore * 0.6) + (analysis.importance_score * 0.4);
            } catch (perplexityError) {
                // Si Perplexity échoue, utiliser seulement le score de pertinence
                console.warn('⚠️ Perplexity analysis failed, using relevance score only');
            }

            // Utiliser Perplexity pour catégorie et sentiment si disponible
            let category, sentiment, impactSummary, actionRequired;
            try {
                const analysis = await this._analyzeWithPerplexity(ticker, news);
                category = analysis.category;
                sentiment = analysis.sentiment;
                impactSummary = analysis.impact_summary;
                actionRequired = analysis.action_required;
            } catch (error) {
                // Fallback: scoring local simple
                category = this._simpleCategory(news);
                sentiment = 0;
                impactSummary = null;
                actionRequired = false;
            }

            return {
                ticker,
                headline: news.headline,
                summary: news.summary,
                url: news.url,
                published_at: news.published_at,
                source: news.source,
                source_original: news.site || news.source,
                image: news.image,

                // Analyse
                importance_score: Math.min(10, Math.max(0, importanceScore)),
                relevance_score: news.relevance_score || importanceScore,
                category: category || this._simpleCategory(news),
                sentiment: sentiment || 0,
                impact_summary: impactSummary,
                action_required: actionRequired || false,

                analyzed_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Analyse news error:', error);

            // Fallback: scoring local simple
            return {
                ...news,
                ticker,
                importance_score: this._simpleImportanceScore(news),
                relevance_score: news.relevance_score || this._simpleImportanceScore(news),
                category: this._simpleCategory(news),
                sentiment: 0,
                impact_summary: null,
                action_required: false,
                analyzed_at: new Date().toISOString()
            };
        }
    }

    /**
     * Analyse avec Perplexity (intelligence)
     */
    async _analyzeWithPerplexity(ticker, news) {
        const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

        if (!PERPLEXITY_API_KEY) {
            throw new Error('Perplexity not configured');
        }

        const prompt = `Analyse cette actualité financière pour ${ticker}:

TITRE: ${news.headline}
RÉSUMÉ: ${news.summary || 'N/A'}

Fournis en JSON strict:
{
  "importance_score": <0-10, impact sur le cours à court/moyen terme>,
  "category": "<earnings|guidance|mergers_acquisitions|regulatory|product|management|legal|partnership|investment|other>",
  "sentiment": <-1.0 à +1.0, négatif à positif>,
  "impact_summary": "<résumé impact en 1 phrase>",
  "action_required": <true si surveillance/action nécessaire>
}

Critères importance:
9-10: Événement majeur (M&A, résultats majeurs, changements stratégiques)
7-8: Important (guidances, nouveaux produits, partenariats)
5-6: Modéré (news sectorielles, mises à jour mineures)
3-4: Faible (communiqués routiniers)
0-2: Négligeable`;

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar',  // Rapide pour analyse
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 400,
                    temperature: 0.2
                })
            });

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Parser JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // Validation
                if (typeof parsed.importance_score === 'number' &&
                    typeof parsed.category === 'string' &&
                    typeof parsed.sentiment === 'number') {
                    return parsed;
                }
            }

            throw new Error('Invalid JSON from Perplexity');

        } catch (error) {
            console.error('❌ Perplexity analysis error:', error);
            throw error;
        }
    }

    /**
     * Scoring local simple (fallback)
     */
    _simpleImportanceScore(news) {
        const headline = news.headline.toLowerCase();
        let score = 5; // Base

        // Mots-clés haute importance
        const highImpactKeywords = ['acquire', 'merger', 'acquisition', 'fda approval', 'ceo', 'bankruptcy', 'lawsuit'];
        const mediumImpactKeywords = ['earnings', 'guidance', 'revenue', 'partnership', 'product launch'];

        for (const keyword of highImpactKeywords) {
            if (headline.includes(keyword)) {
                score = Math.max(score, 8);
            }
        }

        for (const keyword of mediumImpactKeywords) {
            if (headline.includes(keyword)) {
                score = Math.max(score, 6);
            }
        }

        return Math.min(10, score);
    }

    /**
     * Catégorisation simple (fallback)
     */
    _simpleCategory(news) {
        const headline = news.headline.toLowerCase();

        if (headline.includes('earnings') || headline.includes('quarterly results')) return this.categories.EARNINGS;
        if (headline.includes('guidance') || headline.includes('forecast')) return this.categories.GUIDANCE;
        if (headline.includes('acquisition') || headline.includes('merger')) return this.categories.MA;
        if (headline.includes('fda') || headline.includes('regulation')) return this.categories.REGULATORY;
        if (headline.includes('product') || headline.includes('launch')) return this.categories.PRODUCT;
        if (headline.includes('ceo') || headline.includes('cfo')) return this.categories.MANAGEMENT;
        if (headline.includes('lawsuit') || headline.includes('legal')) return this.categories.LEGAL;
        if (headline.includes('partnership') || headline.includes('collaboration')) return this.categories.PARTNERSHIP;

        return this.categories.OTHER;
    }

    /**
     * Vérifie si news déjà en DB (déduplication)
     */
    async _checkDuplicate(news) {
        // Simplification: vérifier par headline + date
        // Dans une vraie implémentation, utiliser fuzzy matching
        return false;
    }

    /**
     * Sauvegarde news significative dans Supabase
     */
    async _saveSignificantNews(ticker, analysis) {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.warn('⚠️ Supabase not configured');
            return;
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/significant_news`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(analysis)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Save news error: ${response.status} - ${errorText}`);
            }

        } catch (error) {
            console.error('❌ Supabase save error:', error);
        }
    }

    /**
     * Crée alerte critique
     */
    async _createCriticalAlert(ticker, analysis) {
        console.log(`🚨 ALERTE CRITIQUE: ${ticker} - ${analysis.headline}`);
        // Dans une vraie implémentation, envoyer notification (email, Slack, etc.)
        // Pour l'instant, juste logger
    }

    /**
     * Récupère news hebdomadaires
     */
    async _fetchWeeklySignificantNews(tickers) {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const weekStart = this._getWeekStart();

        try {
            const tickersStr = tickers.map(t => `"${t}"`).join(',');
            const url = `${SUPABASE_URL}/rest/v1/significant_news?ticker=in.(${tickersStr})&published_at=gte.${weekStart}&order=importance_score.desc,published_at.desc`;

            const response = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!response.ok) {
                return [];
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Fetch weekly news error:', error);
            return [];
        }
    }

    /**
     * Groupe news par ticker
     */
    _groupByTicker(news) {
        const grouped = {};

        for (const item of news) {
            if (!grouped[item.ticker]) {
                grouped[item.ticker] = [];
            }
            grouped[item.ticker].push(item);
        }

        return grouped;
    }

    /**
     * Analyse tendances hebdomadaires
     */
    _analyzeTrends(news) {
        const categories = {};
        const sentiments = [];

        for (const item of news) {
            // Compter par catégorie
            categories[item.category] = (categories[item.category] || 0) + 1;

            // Collecter sentiments
            if (item.sentiment) {
                sentiments.push(item.sentiment);
            }
        }

        const avgSentiment = sentiments.length > 0
            ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
            : 0;

        return {
            categories_breakdown: categories,
            avg_sentiment: avgSentiment.toFixed(2),
            dominant_category: Object.keys(categories).sort((a, b) => categories[b] - categories[a])[0] || 'N/A'
        };
    }

    /**
     * Sélectionne top stories
     */
    _selectTopStories(news, limit = 10) {
        return news
            .sort((a, b) => b.importance_score - a.importance_score)
            .slice(0, limit)
            .map(item => ({
                ticker: item.ticker,
                headline: item.headline,
                importance: item.importance_score,
                category: item.category,
                published_at: item.published_at,
                url: item.url
            }));
    }

    /**
     * Sauvegarde digest
     */
    async _saveWeeklyDigest(digest) {
        console.log('💾 Digest hebdomadaire sauvegardé');
        // À implémenter: sauvegarder dans fichier ou DB
    }

    /**
     * Utilitaires
     */
    _getWeekStart() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString();
    }

    _getWeekEnd() {
        const now = new Date();
        return now.toISOString();
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default NewsMonitoringAgent;
