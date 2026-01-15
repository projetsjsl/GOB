/**
 * Mock API Service for Local Development
 * Intercepts fetch calls to /api/ endpoints and returns dummy data.
 * Used when running locally without a backend to prevent console errors.
 */
(function() {
    // Only active if on localhost or if explicitly enabled
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal && !window.ENABLE_MOCK_API) return;

    console.log(' Mock API Service Authenticated & Active');

    const originalFetch = window.fetch;

    window.fetch = async function(url, options) {
        const urlStr = url.toString();
        
        // Pass through non-API requests
        if (!urlStr.includes('/api/')) {
            return originalFetch(url, options);
        }

        console.log(` Mocking API call: ${urlStr}`);
        
        // Simulate network delay
        await new Promise(r => setTimeout(r, 200));

        let responseBody = { success: true };

        // Define mock responses
        if (urlStr.includes('/api/config/tickers')) {
            responseBody = {
                success: true,
                team_tickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
                watchlist_tickers: ['NVDA', 'AMD', 'INTC']
            };
        } else if (urlStr.includes('/api/marketdata')) {
            responseBody = {
                symbol: 'MOCK',
                price: 150.25,
                change: 1.5,
                changePercent: 1.0,
                volume: 1000000,
                timestamp: Date.now()
            };
        } else if (urlStr.includes('/api/emma-agent') || urlStr.includes('/api/ai-services')) {
            responseBody = {
                reply: "Je suis en mode simulation locale. Le backend n'est pas connecte.",
                usage: { total_tokens: 0 }
            };
        } else if (urlStr.includes('/api/supabase-watchlist')) {
            responseBody = { tickers: ['AAPL', 'MSFT'] };
        } else if (urlStr.includes('/api/yield-curve')) {
            responseBody = {
                timestamp: new Date().toISOString(),
                data: {
                    us: {
                        country: "US",
                        currency: "USD",
                        date: new Date().toISOString().split('T')[0],
                        source: "Treasury.gov (Mock)",
                        rates: [
                            { maturity: "1M", rate: 5.35, months: 1, change1M: 0.05 },
                            { maturity: "2M", rate: 5.30, months: 2, change1M: 0.03 },
                            { maturity: "3M", rate: 5.28, months: 3, change1M: 0.02 },
                            { maturity: "6M", rate: 5.15, months: 6, change1M: -0.02 },
                            { maturity: "1Y", rate: 4.95, months: 12, change1M: -0.05 },
                            { maturity: "2Y", rate: 4.65, months: 24, change1M: -0.10 },
                            { maturity: "3Y", rate: 4.45, months: 36, change1M: -0.12 },
                            { maturity: "5Y", rate: 4.25, months: 60, change1M: -0.15 },
                            { maturity: "7Y", rate: 4.30, months: 84, change1M: -0.12 },
                            { maturity: "10Y", rate: 4.35, months: 120, change1M: -0.10 },
                            { maturity: "20Y", rate: 4.45, months: 240, change1M: -0.08 },
                            { maturity: "30Y", rate: 4.40, months: 360, change1M: -0.07 }
                        ]
                    },
                    canada: {
                        country: "Canada",
                        currency: "CAD",
                        date: new Date().toISOString().split('T')[0],
                        source: "Bank of Canada (Mock)",
                        rates: [
                            { maturity: "1M", rate: 4.85, months: 1, change1M: 0.02 },
                            { maturity: "2M", rate: 4.80, months: 2, change1M: 0.01 },
                            { maturity: "3M", rate: 4.78, months: 3, change1M: 0.00 },
                            { maturity: "6M", rate: 4.65, months: 6, change1M: -0.03 },
                            { maturity: "1Y", rate: 4.45, months: 12, change1M: -0.06 },
                            { maturity: "2Y", rate: 4.15, months: 24, change1M: -0.11 },
                            { maturity: "3Y", rate: 3.95, months: 36, change1M: -0.13 },
                            { maturity: "5Y", rate: 3.75, months: 60, change1M: -0.16 },
                            { maturity: "7Y", rate: 3.80, months: 84, change1M: -0.13 },
                            { maturity: "10Y", rate: 3.85, months: 120, change1M: -0.11 },
                            { maturity: "20Y", rate: 3.95, months: 240, change1M: -0.09 },
                            { maturity: "30Y", rate: 3.90, months: 360, change1M: -0.08 }
                        ]
                    }
                }
            };
        } else if (urlStr.includes('/api/news') || urlStr.includes('/api/fmp?endpoint=news')) {
            responseBody = [
                {
                    symbol: 'MOCK',
                    title: 'Simulation: Market Up',
                    image: 'https://via.placeholder.com/150',
                    site: 'MockNews',
                    text: 'This is a mock news item for local testing.',
                    url: '#',
                    publishedDate: new Date().toISOString()
                }
            ];
        }

        // Return a Response object
        return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    };

})();
