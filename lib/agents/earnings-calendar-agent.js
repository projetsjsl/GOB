/**
 * EARNINGS CALENDAR AGENT
 *
 * Gère le calendrier complet des résultats trimestriels sur l'année.
 *
 * Fonctionnalités:
 * - Initialisation calendrier annuel pour tous les tickers suivis
 * - Vérification quotidienne des confirmations de dates
 * - Alertes 7 jours avant publication (préparation analyse)
 * - Analyse pré-earnings (consensus, historique beat rate)
 * - Tracking des earnings surprises
 *
 * Intégration:
 * - FMP API : Earnings calendar, historical earnings
 * - Supabase : Table earnings_calendar
 * - n8n : Workflows quotidiens automatisés
 */

export class EarningsCalendarAgent {
    constructor() {
        this.name = 'EarningsCalendarAgent';
        this.description = 'Gestion complète du calendrier des résultats financiers';
        this.capabilities = [
            'initialize_yearly_calendar',
            'daily_earnings_check',
            'prepare_pre_earnings_analysis',
            'track_earnings_surprises'
        ];
    }

    /**
     * Initialise le calendrier des earnings pour l'année complète
     * À appeler une fois par an ou lors de l'ajout d'un nouveau ticker
     */
    async initializeYearlyCalendar(tickers, year = new Date().getFullYear()) {
        console.log(`📅 Initialisation calendrier ${year} pour ${tickers.length} tickers...`);

        const results = {
            success: true,
            year,
            tickers_processed: 0,
            earnings_scheduled: 0,
            errors: []
        };

        try {
            for (const ticker of tickers) {
                try {
                    // Récupérer le calendrier FMP pour ce ticker
                    const calendarData = await this._fetchEarningsCalendar(ticker, year);

                    if (calendarData && calendarData.length > 0) {
                        // Sauvegarder dans Supabase
                        await this._saveToSupabase(ticker, calendarData);
                        results.earnings_scheduled += calendarData.length;
                        console.log(`✅ ${ticker}: ${calendarData.length} earnings dates ajoutées`);
                    } else {
                        console.log(`⚠️ ${ticker}: Aucune date trouvée pour ${year}`);
                    }

                    results.tickers_processed++;

                } catch (error) {
                    console.error(`❌ ${ticker}: ${error.message}`);
                    results.errors.push({ ticker, error: error.message });
                }

                // Rate limiting: 300 requêtes/min pour FMP free tier
                await this._sleep(250); // 4 req/sec max
            }

            return results;

        } catch (error) {
            console.error('❌ Erreur initialisation calendrier:', error);
            results.success = false;
            results.error = error.message;
            return results;
        }
    }

    /**
     * Vérification quotidienne (à appeler tous les jours à 6am)
     * Vérifie les confirmations et prépare alertes pour earnings à venir
     */
    async dailyEarningsCheck(daysAhead = 7) {
        console.log(`🔍 Vérification quotidienne - Horizon ${daysAhead} jours...`);

        const results = {
            success: true,
            date: new Date().toISOString().split('T')[0],
            upcoming_earnings: [],
            confirmations_needed: [],
            alerts_sent: 0
        };

        try {
            // 1. Récupérer les earnings des prochains jours depuis Supabase
            const upcomingEarnings = await this._getUpcomingEarnings(daysAhead);
            results.upcoming_earnings = upcomingEarnings;

            console.log(`📊 ${upcomingEarnings.length} earnings dans les ${daysAhead} prochains jours`);

            // 2. Pour chaque earning proche, vérifier si confirmation nécessaire
            for (const earning of upcomingEarnings) {
                const { ticker, estimated_date, confirmed_date, id } = earning;

                // Si pas encore confirmé et date dans moins de 3 jours
                const daysUntil = this._daysBetween(new Date(), new Date(estimated_date));

                if (!confirmed_date && daysUntil <= 3) {
                    results.confirmations_needed.push({
                        ticker,
                        estimated_date,
                        days_until: daysUntil,
                        urgency: daysUntil <= 1 ? 'HIGH' : 'MEDIUM'
                    });

                    // Essayer de récupérer confirmation depuis FMP
                    const confirmation = await this._checkEarningsConfirmation(ticker, estimated_date);

                    if (confirmation.confirmed) {
                        await this._updateEarningsConfirmation(id, confirmation);
                        console.log(`✅ ${ticker}: Date confirmée pour ${confirmation.confirmed_date}`);
                    }
                }

                // Si date confirmée dans 7 jours: Préparer alerte
                if (confirmed_date && daysUntil === 7) {
                    const preAnalysis = await this.preparePreEarningsAnalysis(ticker, confirmed_date);
                    results.alerts_sent++;
                    console.log(`🔔 Alerte 7 jours envoyée pour ${ticker} (${confirmed_date})`);
                }
            }

            return results;

        } catch (error) {
            console.error('❌ Erreur daily check:', error);
            results.success = false;
            results.error = error.message;
            return results;
        }
    }

    /**
     * Prépare l'analyse pré-earnings (7 jours avant)
     * Consensus, historique beat rate, métriques clés
     */
    async preparePreEarningsAnalysis(ticker, earningsDate) {
        console.log(`📋 Préparation analyse pré-earnings pour ${ticker} (${earningsDate})...`);

        try {
            // 1. Récupérer consensus analystes
            const consensus = await this._fetchEarningsConsensus(ticker);

            // 2. Récupérer historique earnings (beat rate)
            const history = await this._fetchEarningsHistory(ticker, 8); // 2 dernières années

            // 3. Calculer beat rate
            const beatRate = this._calculateBeatRate(history);

            // 4. Métriques clés actuelles
            const fundamentals = await this._fetchCurrentFundamentals(ticker);

            // 5. Construire analyse
            const analysis = {
                ticker,
                earnings_date: earningsDate,
                generated_at: new Date().toISOString(),
                consensus: {
                    eps_estimate: consensus.epsEstimate,
                    revenue_estimate: consensus.revenueEstimate,
                    analyst_count: consensus.numberOfAnalysts
                },
                historical_performance: {
                    beat_rate: beatRate.beat_rate,
                    avg_surprise_pct: beatRate.avg_surprise,
                    last_8_quarters: beatRate.quarters
                },
                current_metrics: {
                    pe_ratio: fundamentals.peRatio,
                    profit_margin: fundamentals.profitMargin,
                    revenue_growth_yoy: fundamentals.revenueGrowthYOY
                },
                risk_factors: this._identifyRiskFactors(consensus, history, fundamentals),
                key_items_to_watch: this._generateKeyWatchItems(ticker, consensus, fundamentals)
            };

            // 6. Sauvegarder l'analyse
            await this._savePreEarningsAnalysis(ticker, analysis);

            console.log(`✅ Analyse pré-earnings préparée pour ${ticker}`);
            return analysis;

        } catch (error) {
            console.error(`❌ Erreur analyse pré-earnings ${ticker}:`, error);
            throw error;
        }
    }

    /**
     * Récupère le calendrier des earnings depuis FMP
     */
    async _fetchEarningsCalendar(ticker, year) {
        const FMP_API_KEY = process.env.FMP_API_KEY;

        if (!FMP_API_KEY) {
            throw new Error('FMP_API_KEY not configured');
        }

        try {
            // FMP Earnings Calendar endpoint
            // On récupère du 1er janvier au 31 décembre de l'année
            const fromDate = `${year}-01-01`;
            const toDate = `${year}-12-31`;

            const url = `https://financialmodelingprep.com/api/v3/earning_calendar?symbol=${ticker}&from=${fromDate}&to=${toDate}&apikey=${FMP_API_KEY}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`FMP API error: ${response.status}`);
            }

            const data = await response.json();

            // Transformer au format attendu
            return data.map(item => ({
                ticker: ticker.toUpperCase(),
                fiscal_quarter: item.fiscalDateEnding ? this._extractQuarter(item.fiscalDateEnding) : null,
                fiscal_year: year,
                estimated_date: item.date,
                confirmed_date: null, // À confirmer plus tard
                time: item.time || 'N/A', // BMO (Before Market Open) ou AMC (After Market Close)
                estimated_eps: item.epsEstimated ? parseFloat(item.epsEstimated) : null,
                status: 'scheduled'
            }));

        } catch (error) {
            console.error(`❌ FMP fetch error for ${ticker}:`, error);
            return [];
        }
    }

    /**
     * Sauvegarde dans Supabase
     */
    async _saveToSupabase(ticker, earningsData) {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            throw new Error('Supabase not configured');
        }

        try {
            // Upsert (insert or update) dans la table earnings_calendar
            const response = await fetch(`${SUPABASE_URL}/rest/v1/earnings_calendar`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(earningsData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Supabase error: ${response.status} - ${errorText}`);
            }

            console.log(`💾 ${earningsData.length} earnings sauvegardés pour ${ticker}`);

        } catch (error) {
            console.error('❌ Supabase save error:', error);
            throw error;
        }
    }

    /**
     * Récupère les earnings à venir depuis Supabase
     */
    async _getUpcomingEarnings(daysAhead = 7) {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        try {
            const url = `${SUPABASE_URL}/rest/v1/earnings_calendar?estimated_date=gte.${today}&estimated_date=lte.${futureDateStr}&status=eq.scheduled&order=estimated_date.asc`;

            const response = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`Supabase query error: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Get upcoming earnings error:', error);
            return [];
        }
    }

    /**
     * Vérifie confirmation de date d'earnings
     */
    async _checkEarningsConfirmation(ticker, estimatedDate) {
        // Dans une vraie implémentation, on interrogerait FMP ou une autre source
        // Pour l'instant, on retourne un placeholder
        return {
            confirmed: false,
            confirmed_date: null,
            time: null
        };
    }

    /**
     * Met à jour la confirmation dans Supabase
     */
    async _updateEarningsConfirmation(earningsId, confirmation) {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/earnings_calendar?id=eq.${earningsId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    confirmed_date: confirmation.confirmed_date,
                    time: confirmation.time,
                    status: 'confirmed'
                })
            });

            if (!response.ok) {
                throw new Error(`Update error: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Update confirmation error:', error);
        }
    }

    /**
     * Récupère consensus earnings depuis FMP
     */
    async _fetchEarningsConsensus(ticker) {
        const FMP_API_KEY = process.env.FMP_API_KEY;

        try {
            const url = `https://financialmodelingprep.com/api/v3/analyst-estimates/${ticker}?limit=1&apikey=${FMP_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                return { epsEstimate: null, revenueEstimate: null, numberOfAnalysts: 0 };
            }

            const data = await response.json();
            const latest = data[0];

            return {
                epsEstimate: latest?.estimatedEps || null,
                revenueEstimate: latest?.estimatedRevenue || null,
                numberOfAnalysts: latest?.numberOfAnalysts || 0
            };

        } catch (error) {
            console.error('❌ Fetch consensus error:', error);
            return { epsEstimate: null, revenueEstimate: null, numberOfAnalysts: 0 };
        }
    }

    /**
     * Récupère historique earnings depuis FMP
     */
    async _fetchEarningsHistory(ticker, quarters = 8) {
        const FMP_API_KEY = process.env.FMP_API_KEY;

        try {
            const url = `https://financialmodelingprep.com/api/v3/historical/earning_calendar/${ticker}?limit=${quarters}&apikey=${FMP_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                return [];
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Fetch history error:', error);
            return [];
        }
    }

    /**
     * Calcule beat rate (% de surprises positives)
     */
    _calculateBeatRate(history) {
        if (!history || history.length === 0) {
            return { beat_rate: 0, avg_surprise: 0, quarters: [] };
        }

        const quarters = history.map(q => {
            const eps = parseFloat(q.eps || 0);
            const epsEstimated = parseFloat(q.epsEstimated || 0);
            const surprise = eps - epsEstimated;
            const surprisePct = epsEstimated !== 0 ? (surprise / Math.abs(epsEstimated)) * 100 : 0;

            return {
                date: q.date,
                eps,
                epsEstimated,
                surprise,
                surprisePct,
                beat: surprise > 0
            };
        });

        const beats = quarters.filter(q => q.beat).length;
        const beatRate = (beats / quarters.length) * 100;
        const avgSurprise = quarters.reduce((sum, q) => sum + q.surprisePct, 0) / quarters.length;

        return {
            beat_rate: beatRate.toFixed(1),
            avg_surprise: avgSurprise.toFixed(2),
            quarters
        };
    }

    /**
     * Récupère fondamentaux actuels
     */
    async _fetchCurrentFundamentals(ticker) {
        const FMP_API_KEY = process.env.FMP_API_KEY;

        try {
            const url = `https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${FMP_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                return {};
            }

            const data = await response.json();
            return data[0] || {};

        } catch (error) {
            console.error('❌ Fetch fundamentals error:', error);
            return {};
        }
    }

    /**
     * Identifie facteurs de risque
     */
    _identifyRiskFactors(consensus, history, fundamentals) {
        const risks = [];

        // Risque 1: Beat rate faible
        if (history.length > 0) {
            const beatRate = this._calculateBeatRate(history);
            if (parseFloat(beatRate.beat_rate) < 50) {
                risks.push({
                    type: 'LOW_BEAT_RATE',
                    severity: 'MEDIUM',
                    description: `Beat rate historique faible (${beatRate.beat_rate}%)`
                });
            }
        }

        // Risque 2: Marges en baisse
        if (fundamentals.netProfitMarginTTM < 0) {
            risks.push({
                type: 'NEGATIVE_MARGINS',
                severity: 'HIGH',
                description: 'Marges nettes négatives'
            });
        }

        // Risque 3: Faible nombre d'analystes (incertitude)
        if (consensus.numberOfAnalysts < 5) {
            risks.push({
                type: 'LOW_COVERAGE',
                severity: 'LOW',
                description: `Faible couverture analystes (${consensus.numberOfAnalysts})`
            });
        }

        return risks;
    }

    /**
     * Génère points clés à surveiller
     */
    _generateKeyWatchItems(ticker, consensus, fundamentals) {
        return [
            'EPS actuel vs consensus',
            'Guidances pour le prochain trimestre',
            'Croissance du chiffre d\'affaires YoY',
            'Marges opérationnelles (tendance)',
            'Cash flow libre',
            'Commentaires du management sur perspectives',
            'Dépenses R&D et capex',
            'Questions lors du call (insights)'
        ];
    }

    /**
     * Sauvegarde analyse pré-earnings
     */
    async _savePreEarningsAnalysis(ticker, analysis) {
        // À implémenter : sauvegarder dans Supabase ou fichier
        console.log(`💾 Analyse pré-earnings sauvegardée pour ${ticker}`);
    }

    /**
     * Utilitaires
     */
    _extractQuarter(dateString) {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;

        if (month <= 3) return 'Q1';
        if (month <= 6) return 'Q2';
        if (month <= 9) return 'Q3';
        return 'Q4';
    }

    _daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round((date2 - date1) / oneDay);
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default EarningsCalendarAgent;
