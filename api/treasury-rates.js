/**
 * TREASURY RATES API
 * Récupère les taux obligataires US et Canada
 *
 * Sources:
 * - Canada: Banque du Canada API
 * - USA: FRED (Federal Reserve Economic Data)
 * - Fallback: FMP Treasury Rates
 *
 * Usage:
 * GET /api/treasury-rates?country=US
 * GET /api/treasury-rates?country=CA
 * GET /api/treasury-rates?country=both (défaut)
 */

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Méthode non autorisée',
            allowed: ['GET']
        });
    }

    try {
        const { country = 'both' } = req.query;

        // Validate country parameter
        const validCountries = ['US', 'CA', 'both'];
        if (!validCountries.includes(country.toUpperCase())) {
            return res.status(400).json({
                error: 'Pays invalide',
                valid_countries: validCountries,
                received: country
            });
        }

        console.log(`📊 [Treasury Rates] Fetching rates for: ${country}`);

        const results = {};

        // Fetch US rates
        if (country.toUpperCase() === 'US' || country.toLowerCase() === 'both') {
            results.us = await fetchUSTreasuryRates();
        }

        // Fetch Canada rates
        if (country.toUpperCase() === 'CA' || country.toLowerCase() === 'both') {
            results.canada = await fetchCanadaTreasuryRates();
        }

        // Calculate spreads if both countries
        if (country.toLowerCase() === 'both' && results.us && results.canada) {
            results.comparison = calculateSpreads(results.us, results.canada);
        }

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            country,
            data: results,
            tradingview_link: 'https://www.tradingview.com/x/YjJn9ihm/',
            sources: {
                us: 'FRED (Federal Reserve)',
                canada: 'Banque du Canada'
            }
        });

    } catch (error) {
        console.error('❌ [Treasury Rates] Error:', error);
        return res.status(500).json({
            error: 'Erreur serveur',
            message: error.message
        });
    }
}

/**
 * Fetch US Treasury Rates from FRED
 */
async function fetchUSTreasuryRates() {
    const FRED_API_KEY = process.env.FRED_API_KEY;

    // FRED series IDs for US Treasury rates
    const series = {
        '1M': 'DGS1MO',
        '3M': 'DGS3MO',
        '6M': 'DGS6MO',
        '1Y': 'DGS1',
        '2Y': 'DGS2',
        '3Y': 'DGS3',
        '5Y': 'DGS5',
        '7Y': 'DGS7',
        '10Y': 'DGS10',
        '20Y': 'DGS20',
        '30Y': 'DGS30'
    };

    const rates = {};

    try {
        if (FRED_API_KEY) {
            // Fetch from FRED
            const baseUrl = 'https://api.stlouisfed.org/fred/series/observations';

            for (const [maturity, seriesId] of Object.entries(series)) {
                try {
                    const url = `${baseUrl}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
                    const response = await fetch(url);

                    if (response.ok) {
                        const data = await response.json();
                        const observations = data.observations || [];

                        if (observations.length > 0) {
                            const latest = observations[0];
                            rates[maturity] = {
                                rate: parseFloat(latest.value),
                                date: latest.date
                            };
                        }
                    }

                    // Rate limiting (FRED: 120 requests/60 seconds)
                    await sleep(100);

                } catch (error) {
                    console.warn(`⚠️ [FRED] Error fetching ${maturity}:`, error.message);
                }
            }

            console.log(`✅ [FRED] Fetched ${Object.keys(rates).length}/11 US rates`);
        }

        // Fallback to FMP if FRED failed or incomplete
        if (Object.keys(rates).length < 8) {
            console.log('🔄 [FMP] Using fallback for US rates...');
            const fmpRates = await fetchFMPTreasuryRates('US');
            Object.assign(rates, fmpRates);
        }

        // Add policy rate (Fed Funds Rate)
        const fedRate = await fetchFedFundsRate();
        rates.policy_rate = fedRate;

        // Calculate spreads
        if (rates['10Y'] && rates['2Y']) {
            rates.spread_10Y_2Y = rates['10Y'].rate - rates['2Y'].rate;
        }

        if (rates['30Y'] && rates['10Y']) {
            rates.spread_30Y_10Y = rates['30Y'].rate - rates['10Y'].rate;
        }

        if (rates['10Y'] && rates.policy_rate) {
            rates.spread_10Y_policy = rates['10Y'].rate - rates.policy_rate.rate;
        }

        return rates;

    } catch (error) {
        console.error('❌ [US Treasury] Error:', error.message);
        return {};
    }
}

/**
 * Fetch Canada Treasury Rates from Bank of Canada
 */
async function fetchCanadaTreasuryRates() {
    const rates = {};

    try {
        // Bank of Canada API
        const bocUrl = 'https://www.bankofcanada.ca/valet/observations/group/bond_yields_canadian/json';

        const response = await fetch(bocUrl);

        if (response.ok) {
            const data = await response.json();
            const observations = data.observations || [];

            if (observations.length > 0) {
                const latest = observations[observations.length - 1];

                // Map BoC series to maturities
                const mapping = {
                    'V122531': '1M',
                    'V122532': '3M',
                    'V122533': '6M',
                    'V122541': '1Y',
                    'V122543': '2Y',
                    'V122544': '3Y',
                    'V122545': '5Y',
                    'V122546': '7Y',
                    'V122487': '10Y',
                    'V122552': '30Y'
                };

                for (const [seriesId, maturity] of Object.entries(mapping)) {
                    if (latest[seriesId]) {
                        const value = parseFloat(latest[seriesId].v);
                        if (!isNaN(value)) {
                            rates[maturity] = {
                                rate: value,
                                date: latest.d
                            };
                        }
                    }
                }

                console.log(`✅ [BoC] Fetched ${Object.keys(rates).length} Canada rates`);
            }
        }

        // Fallback to FMP if BoC failed or incomplete
        if (Object.keys(rates).length < 6) {
            console.log('🔄 [FMP] Using fallback for Canada rates...');
            const fmpRates = await fetchFMPTreasuryRates('CA');
            Object.assign(rates, fmpRates);
        }

        // Add policy rate (BoC Overnight Rate)
        const bocRate = await fetchBoCOvernightRate();
        rates.policy_rate = bocRate;

        // Calculate spreads
        if (rates['10Y'] && rates['2Y']) {
            rates.spread_10Y_2Y = rates['10Y'].rate - rates['2Y'].rate;
        }

        if (rates['30Y'] && rates['10Y']) {
            rates.spread_30Y_10Y = rates['30Y'].rate - rates['10Y'].rate;
        }

        if (rates['10Y'] && rates.policy_rate) {
            rates.spread_10Y_policy = rates['10Y'].rate - rates.policy_rate.rate;
        }

        return rates;

    } catch (error) {
        console.error('❌ [Canada Treasury] Error:', error.message);
        return {};
    }
}

/**
 * Fetch from FMP Treasury Rates (fallback)
 */
async function fetchFMPTreasuryRates(country) {
    const FMP_API_KEY = process.env.FMP_API_KEY;

    if (!FMP_API_KEY) {
        return {};
    }

    try {
        const url = `https://financialmodelingprep.com/api/v4/treasury?apikey=${FMP_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            return {};
        }

        const data = await response.json();

        // Filter by country and map to our format
        const rates = {};
        const countryFilter = country === 'US' ? 'United States' : 'Canada';

        data.forEach(item => {
            if (item.country === countryFilter) {
                const maturity = item.duration; // e.g., "1 Month", "10 Year"
                const key = maturity.replace(' Month', 'M').replace(' Year', 'Y').replace(' ', '');

                rates[key] = {
                    rate: parseFloat(item.yield),
                    date: item.date
                };
            }
        });

        console.log(`✅ [FMP] Fetched ${Object.keys(rates).length} ${country} rates`);
        return rates;

    } catch (error) {
        console.error('❌ [FMP Treasury] Error:', error.message);
        return {};
    }
}

/**
 * Fetch Fed Funds Rate
 */
async function fetchFedFundsRate() {
    const FRED_API_KEY = process.env.FRED_API_KEY;

    try {
        if (FRED_API_KEY) {
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                const observations = data.observations || [];

                if (observations.length > 0) {
                    const latest = observations[0];
                    return {
                        rate: parseFloat(latest.value),
                        date: latest.date,
                        source: 'FRED'
                    };
                }
            }
        }

        // Fallback: Use known current rate
        return {
            rate: 4.625, // Midpoint of 4.50-4.75%
            date: new Date().toISOString().split('T')[0],
            source: 'Fallback (4.50-4.75% range)'
        };

    } catch (error) {
        console.error('❌ [Fed Funds] Error:', error.message);
        return {
            rate: 4.625,
            date: new Date().toISOString().split('T')[0],
            source: 'Fallback'
        };
    }
}

/**
 * Fetch Bank of Canada Overnight Rate
 */
async function fetchBoCOvernightRate() {
    try {
        const url = 'https://www.bankofcanada.ca/valet/observations/V39062/json?recent=1';
        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();
            const observations = data.observations || [];

            if (observations.length > 0) {
                const latest = observations[0];
                return {
                    rate: parseFloat(latest.V39062.v),
                    date: latest.d,
                    source: 'Bank of Canada'
                };
            }
        }

        // Fallback: Use known current rate
        return {
            rate: 4.50,
            date: new Date().toISOString().split('T')[0],
            source: 'Fallback (current known rate)'
        };

    } catch (error) {
        console.error('❌ [BoC Rate] Error:', error.message);
        return {
            rate: 4.50,
            date: new Date().toISOString().split('T')[0],
            source: 'Fallback'
        };
    }
}

/**
 * Calculate spreads between US and Canada
 */
function calculateSpreads(us, canada) {
    const spreads = {};

    const maturities = ['2Y', '5Y', '10Y', '30Y'];

    maturities.forEach(maturity => {
        if (us[maturity] && canada[maturity]) {
            spreads[maturity] = {
                spread: (us[maturity].rate - canada[maturity].rate).toFixed(2),
                us_rate: us[maturity].rate,
                canada_rate: canada[maturity].rate
            };
        }
    });

    // Policy rate spread
    if (us.policy_rate && canada.policy_rate) {
        spreads.policy_rate = {
            spread: (us.policy_rate.rate - canada.policy_rate.rate).toFixed(2),
            us_rate: us.policy_rate.rate,
            canada_rate: canada.policy_rate.rate
        };
    }

    return spreads;
}

/**
 * Helper: Sleep function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
