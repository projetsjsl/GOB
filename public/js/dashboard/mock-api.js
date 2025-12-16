/**
 * Mock API Service for Local Development
 * Intercepts fetch calls to /api/ endpoints and returns dummy data.
 * Used when running locally without a backend to prevent console errors.
 */
(function() {
    // Only active if on localhost or if explicitly enabled
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal && !window.ENABLE_MOCK_API) return;

    console.log('🔶 Mock API Service Authenticated & Active');

    const originalFetch = window.fetch;

    window.fetch = async function(url, options) {
        const urlStr = url.toString();
        
        // Pass through non-API requests
        if (!urlStr.includes('/api/')) {
            return originalFetch(url, options);
        }

        console.log(`🔶 Mocking API call: ${urlStr}`);
        
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
                reply: "Je suis en mode simulation locale. Le backend n'est pas connecté.",
                usage: { total_tokens: 0 }
            };
        } else if (urlStr.includes('/api/supabase-watchlist')) {
            responseBody = { tickers: ['AAPL', 'MSFT'] };
        } else if (urlStr.includes('/api/yield-curve')) {
            responseBody = [];
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
