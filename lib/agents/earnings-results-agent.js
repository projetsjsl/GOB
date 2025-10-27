/**
 * EARNINGS RESULTS AGENT
 *
 * Analyse automatique des résultats trimestriels dès publication.
 *
 * Fonctionnalités:
 * - Polling toutes les 15min pendant earnings season
 * - Analyse beat/miss vs consensus
 * - Extraction guidances (forward guidance)
 * - Analyse earnings call transcript (insights management)
 * - Génération verdict actionnable (BUY/HOLD/SELL signal)
 * - Alertes immédiates si surprise majeure (>10%)
 *
 * Intégration:
 * - FMP API : Actual earnings, transcripts
 * - Perplexity : Analyse contextuelle et sentiment
 * - Supabase : Table earnings_results
 * - n8n : Polling automatique + notifications
 */

export class EarningsResultsAgent {
    constructor() {
        this.name = 'EarningsResultsAgent';
        this.description = 'Analyse automatique des résultats financiers publiés';
        this.capabilities = [
            'poll_earnings_publications',
            'analyze_beat_miss',
            'extract_guidances',
            'analyze_earnings_call',
            'generate_verdict'
        ];
    }

    /**
     * Polling des publications (à appeler toutes les 15min)
     * Vérifie si des résultats ont été publiés depuis le dernier check
     */
    async pollEarningsPublications(tickersToWatch) {
        console.log(`🔍 Polling ${tickersToWatch.length} tickers pour nouveaux résultats...`);

        const results = {
            success: true,
            checked_at: new Date().toISOString(),
            tickers_checked: tickersToWatch.length,
            new_results: [],
            alerts: []
        };

        try {
            // Pour chaque ticker, vérifier si résultats publiés aujourd'hui
            for (const ticker of tickersToWatch) {
                const publication = await this._checkForNewResults(ticker);

                if (publication.hasNewResults) {
                    console.log(`🆕 Nouveaux résultats pour ${ticker} !`);

                    // Analyser immédiatement
                    const analysis = await this.analyzeEarningsResults(ticker, publication.data);

                    results.new_results.push({
                        ticker,
                        published_at: publication.publishedAt,
                        analysis
                    });

                    // Si surprise majeure (>10%), créer alerte
                    if (Math.abs(analysis.surprise_pct) > 10) {
                        results.alerts.push({
                            ticker,
                            type: analysis.surprise_pct > 0 ? 'MAJOR_BEAT' : 'MAJOR_MISS',
                            surprise_pct: analysis.surprise_pct,
                            urgency: 'HIGH'
                        });
                    }
                }
            }

            console.log(`✅ Polling terminé: ${results.new_results.length} nouveaux résultats, ${results.alerts.length} alertes`);
            return results;

        } catch (error) {
            console.error('❌ Erreur polling:', error);
            results.success = false;
            results.error = error.message;
            return results;
        }
    }

    /**
     * Analyse complète des résultats publiés
     */
    async analyzeEarningsResults(ticker, earningsData) {
        console.log(`📊 Analyse des résultats de ${ticker}...`);

        try {
            // 1. Récupérer données complètes
            const actual = earningsData.actual || await this._fetchActualResults(ticker);
            const consensus = earningsData.consensus || await this._fetchConsensus(ticker);
            const historical = await this._fetchHistoricalContext(ticker);

            // 2. Analyse Beat/Miss
            const beatMissAnalysis = this._analyzeBeatMiss(actual, consensus);

            // 3. Extraire guidances (si disponibles)
            const guidances = await this._extractGuidances(ticker, actual);

            // 4. Analyser sentiment earnings call (si transcript disponible)
            const callAnalysis = await this._analyzeEarningsCall(ticker, actual.date);

            // 5. Analyse contextuelle avec Perplexity
            const contextualInsights = await this._getContextualInsights(
                ticker,
                beatMissAnalysis,
                guidances,
                callAnalysis
            );

            // 6. Générer verdict actionnable
            const verdict = this._generateVerdict(
                ticker,
                beatMissAnalysis,
                guidances,
                callAnalysis,
                contextualInsights,
                historical
            );

            // 7. Construire analyse complète
            const fullAnalysis = {
                ticker,
                analysis_date: new Date().toISOString(),
                earnings_date: actual.date,
                fiscal_quarter: actual.fiscalQuarter,

                // Résultats actuels
                actual_eps: actual.eps,
                estimated_eps: consensus.eps,
                surprise_pct: beatMissAnalysis.eps_surprise_pct,
                actual_revenue: actual.revenue,
                estimated_revenue: consensus.revenue,
                revenue_surprise_pct: beatMissAnalysis.revenue_surprise_pct,

                // Beat/Miss
                eps_beat: beatMissAnalysis.eps_beat,
                revenue_beat: beatMissAnalysis.revenue_beat,
                overall_performance: beatMissAnalysis.overall,

                // Guidances
                has_guidance: guidances.found,
                guidance_summary: guidances.summary,
                guidance_sentiment: guidances.sentiment,

                // Earnings Call
                call_sentiment: callAnalysis.sentiment,
                key_topics: callAnalysis.keyTopics,
                management_tone: callAnalysis.tone,

                // Insights Perplexity
                market_reaction: contextualInsights.marketReaction,
                analyst_updates: contextualInsights.analystUpdates,
                competitive_context: contextualInsights.competitiveContext,

                // Verdict
                verdict: verdict.recommendation, // BUY/HOLD/SELL
                confidence: verdict.confidence,
                rationale: verdict.rationale,
                key_factors: verdict.keyFactors,
                risks: verdict.risks,

                // Historique
                beat_rate_history: historical.beatRate,
                avg_surprise_history: historical.avgSurprise
            };

            // 8. Sauvegarder dans Supabase
            await this._saveEarningsAnalysis(ticker, fullAnalysis);

            console.log(`✅ Analyse complète terminée pour ${ticker}: ${verdict.recommendation}`);
            return fullAnalysis;

        } catch (error) {
            console.error(`❌ Erreur analyse ${ticker}:`, error);
            throw error;
        }
    }

    /**
     * Vérifie si nouveaux résultats publiés
     */
    async _checkForNewResults(ticker) {
        const FMP_API_KEY = process.env.FMP_API_KEY;

        try {
            // Récupérer les earnings des dernières 24h
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const fromDate = yesterday.toISOString().split('T')[0];
            const toDate = today.toISOString().split('T')[0];

            const url = `https://financialmodelingprep.com/api/v3/historical/earning_calendar/${ticker}?from=${fromDate}&to=${toDate}&apikey=${FMP_API_KEY}`;

            const response = await fetch(url);

            if (!response.ok) {
                return { hasNewResults: false };
            }

            const data = await response.json();

            // Si résultats publiés dans les dernières 24h
            if (data && data.length > 0) {
                return {
                    hasNewResults: true,
                    publishedAt: data[0].date,
                    data: data[0]
                };
            }

            return { hasNewResults: false };

        } catch (error) {
            console.error(`❌ Check results error for ${ticker}:`, error);
            return { hasNewResults: false };
        }
    }

    /**
     * Récupère résultats actuels depuis FMP
     */
    async _fetchActualResults(ticker) {
        const FMP_API_KEY = process.env.FMP_API_KEY;

        try {
            const url = `https://financialmodelingprep.com/api/v3/historical/earning_calendar/${ticker}?limit=1&apikey=${FMP_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`FMP API error: ${response.status}`);
            }

            const data = await response.json();
            const latest = data[0];

            return {
                date: latest.date,
                eps: parseFloat(latest.eps),
                revenue: parseFloat(latest.revenue || 0),
                fiscalQuarter: latest.fiscalDateEnding
            };

        } catch (error) {
            console.error('❌ Fetch actual error:', error);
            throw error;
        }
    }

    /**
     * Récupère consensus
     */
    async _fetchConsensus(ticker) {
        const FMP_API_KEY = process.env.FMP_API_KEY;

        try {
            const url = `https://financialmodelingprep.com/api/v3/analyst-estimates/${ticker}?limit=1&apikey=${FMP_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                return { eps: null, revenue: null };
            }

            const data = await response.json();
            const latest = data[0];

            return {
                eps: latest?.estimatedEps || null,
                revenue: latest?.estimatedRevenue || null
            };

        } catch (error) {
            console.error('❌ Fetch consensus error:', error);
            return { eps: null, revenue: null };
        }
    }

    /**
     * Récupère contexte historique
     */
    async _fetchHistoricalContext(ticker) {
        const FMP_API_KEY = process.env.FMP_API_KEY;

        try {
            const url = `https://financialmodelingprep.com/api/v3/historical/earning_calendar/${ticker}?limit=8&apikey=${FMP_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                return { beatRate: 0, avgSurprise: 0 };
            }

            const data = await response.json();

            // Calculer beat rate
            const beats = data.filter(q => {
                const eps = parseFloat(q.eps || 0);
                const est = parseFloat(q.epsEstimated || 0);
                return eps > est;
            }).length;

            const beatRate = data.length > 0 ? (beats / data.length) * 100 : 0;

            // Calculer moyenne des surprises
            const surprises = data.map(q => {
                const eps = parseFloat(q.eps || 0);
                const est = parseFloat(q.epsEstimated || 0);
                return est !== 0 ? ((eps - est) / Math.abs(est)) * 100 : 0;
            });

            const avgSurprise = surprises.reduce((sum, s) => sum + s, 0) / surprises.length;

            return {
                beatRate: beatRate.toFixed(1),
                avgSurprise: avgSurprise.toFixed(2)
            };

        } catch (error) {
            console.error('❌ Fetch historical error:', error);
            return { beatRate: 0, avgSurprise: 0 };
        }
    }

    /**
     * Analyse beat/miss
     */
    _analyzeBeatMiss(actual, consensus) {
        const epsSurprise = actual.eps - (consensus.eps || 0);
        const epsSurprisePct = consensus.eps !== 0 && consensus.eps !== null
            ? (epsSurprise / Math.abs(consensus.eps)) * 100
            : 0;

        const revenueSurprise = actual.revenue - (consensus.revenue || 0);
        const revenueSurprisePct = consensus.revenue !== 0 && consensus.revenue !== null
            ? (revenueSurprise / Math.abs(consensus.revenue)) * 100
            : 0;

        const epsBeat = epsSurprise > 0;
        const revenueBeat = revenueSurprise > 0;

        // Overall: Beat sur les deux = BEAT, Miss sur les deux = MISS, Mixte = MIXED
        let overall = 'MIXED';
        if (epsBeat && revenueBeat) overall = 'BEAT';
        if (!epsBeat && !revenueBeat) overall = 'MISS';

        return {
            eps_surprise: epsSurprise.toFixed(2),
            eps_surprise_pct: epsSurprisePct.toFixed(2),
            eps_beat: epsBeat,
            revenue_surprise: revenueSurprise.toFixed(2),
            revenue_surprise_pct: revenueSurprisePct.toFixed(2),
            revenue_beat: revenueBeat,
            overall
        };
    }

    /**
     * Extrait guidances (forward guidance)
     */
    async _extractGuidances(ticker, actual) {
        // Dans une vraie implémentation, on parserait le earnings transcript
        // Pour l'instant, placeholder
        return {
            found: false,
            summary: null,
            sentiment: 'NEUTRAL'
        };
    }

    /**
     * Analyse earnings call
     */
    async _analyzeEarningsCall(ticker, earningsDate) {
        // Dans une vraie implémentation, on récupérerait le transcript et l'analyserait avec Perplexity
        // Pour l'instant, placeholder
        return {
            sentiment: 'NEUTRAL',
            keyTopics: [],
            tone: 'CAUTIOUS'
        };
    }

    /**
     * Obtient insights contextuels avec Perplexity
     */
    async _getContextualInsights(ticker, beatMiss, guidances, callAnalysis) {
        const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

        if (!PERPLEXITY_API_KEY) {
            return { marketReaction: null, analystUpdates: null, competitiveContext: null };
        }

        try {
            const prompt = `Analyse les résultats trimestriels récents de ${ticker}:
- EPS: ${beatMiss.overall} (surprise: ${beatMiss.eps_surprise_pct}%)
- Revenu: ${beatMiss.revenue_beat ? 'Beat' : 'Miss'} (surprise: ${beatMiss.revenue_surprise_pct}%)

Fournis en JSON:
{
  "marketReaction": "réaction du marché (prix, volume)",
  "analystUpdates": "mises à jour analystes (upgrades/downgrades)",
  "competitiveContext": "contexte sectoriel et compétitif"
}`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 800,
                    temperature: 0.3,
                    search_recency_filter: 'day' // Dernières 24h
                })
            });

            if (!response.ok) {
                return { marketReaction: null, analystUpdates: null, competitiveContext: null };
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Parser JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return { marketReaction: null, analystUpdates: null, competitiveContext: null };

        } catch (error) {
            console.error('❌ Contextual insights error:', error);
            return { marketReaction: null, analystUpdates: null, competitiveContext: null };
        }
    }

    /**
     * Génère verdict actionnable
     */
    _generateVerdict(ticker, beatMiss, guidances, callAnalysis, insights, historical) {
        let score = 50; // Base neutre

        // Facteur 1: Beat/Miss (poids 40%)
        if (beatMiss.overall === 'BEAT') {
            score += 20;
            if (parseFloat(beatMiss.eps_surprise_pct) > 10) score += 10; // Grosse surprise
        } else if (beatMiss.overall === 'MISS') {
            score -= 20;
            if (parseFloat(beatMiss.eps_surprise_pct) < -10) score -= 10; // Grosse déception
        }

        // Facteur 2: Guidances (poids 30%)
        if (guidances.found) {
            if (guidances.sentiment === 'POSITIVE') score += 15;
            if (guidances.sentiment === 'NEGATIVE') score -= 15;
        }

        // Facteur 3: Earnings call sentiment (poids 20%)
        if (callAnalysis.sentiment === 'POSITIVE') score += 10;
        if (callAnalysis.sentiment === 'NEGATIVE') score -= 10;

        // Facteur 4: Historique beat rate (poids 10%)
        const beatRate = parseFloat(historical.beatRate);
        if (beatRate > 75) score += 5;
        if (beatRate < 50) score -= 5;

        // Déterminer recommandation
        let recommendation = 'HOLD';
        let confidence = 'MEDIUM';

        if (score >= 70) {
            recommendation = 'BUY';
            confidence = score >= 80 ? 'HIGH' : 'MEDIUM';
        } else if (score <= 30) {
            recommendation = 'SELL';
            confidence = score <= 20 ? 'HIGH' : 'MEDIUM';
        }

        // Rationale
        const rationale = this._buildRationale(recommendation, beatMiss, guidances, historical);

        // Key factors
        const keyFactors = this._identifyKeyFactors(beatMiss, guidances, callAnalysis, historical);

        // Risks
        const risks = this._identifyRisks(beatMiss, guidances, historical);

        return {
            recommendation,
            confidence,
            score,
            rationale,
            keyFactors,
            risks
        };
    }

    _buildRationale(recommendation, beatMiss, guidances, historical) {
        const parts = [];

        if (recommendation === 'BUY') {
            parts.push('Résultats solides');
            if (beatMiss.overall === 'BEAT') parts.push('dépassant les attentes');
            if (guidances.sentiment === 'POSITIVE') parts.push('guidances positives');
        } else if (recommendation === 'SELL') {
            parts.push('Résultats décevants');
            if (beatMiss.overall === 'MISS') parts.push('en dessous du consensus');
            if (guidances.sentiment === 'NEGATIVE') parts.push('guidances négatives');
        } else {
            parts.push('Performance mitigée');
            if (beatMiss.overall === 'MIXED') parts.push('résultats mixtes');
        }

        return parts.join(', ') + '.';
    }

    _identifyKeyFactors(beatMiss, guidances, callAnalysis, historical) {
        const factors = [];

        if (beatMiss.overall === 'BEAT' || beatMiss.overall === 'MISS') {
            factors.push(`EPS: ${beatMiss.overall} (${beatMiss.eps_surprise_pct}%)`);
        }

        if (beatMiss.revenue_beat) {
            factors.push(`Revenus en hausse (+${beatMiss.revenue_surprise_pct}%)`);
        }

        if (guidances.found) {
            factors.push(`Guidances: ${guidances.sentiment}`);
        }

        if (parseFloat(historical.beatRate) > 75) {
            factors.push(`Historique solide (${historical.beatRate}% beat rate)`);
        }

        return factors;
    }

    _identifyRisks(beatMiss, guidances, historical) {
        const risks = [];

        if (beatMiss.overall === 'MISS') {
            risks.push('Résultats en-dessous des attentes peuvent peser sur le cours');
        }

        if (guidances.sentiment === 'NEGATIVE') {
            risks.push('Guidances négatives signalent des défis à venir');
        }

        if (parseFloat(historical.beatRate) < 50) {
            risks.push('Historique de performance incohérent');
        }

        return risks;
    }

    /**
     * Sauvegarde analyse dans Supabase
     */
    async _saveEarningsAnalysis(ticker, analysis) {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.warn('⚠️ Supabase not configured, skipping save');
            return;
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/earnings_results`, {
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
                console.error(`❌ Supabase save error: ${response.status} - ${errorText}`);
            } else {
                console.log(`💾 Analyse sauvegardée pour ${ticker}`);
            }

        } catch (error) {
            console.error('❌ Save analysis error:', error);
        }
    }
}

export default EarningsResultsAgent;
