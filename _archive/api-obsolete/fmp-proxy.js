// FMP API Proxy - Universal endpoint for all FMP calls
// Handles API key management and CORS

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { endpoint, params } = req.query;

    if (!endpoint) {
        return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    const FMP_API_KEY = process.env.FMP_API_KEY || 'demo';

    try {
        // Build URL
        const baseUrl = 'https://financialmodelingprep.com/api/v3';
        let url = `${baseUrl}/${endpoint}?apikey=${FMP_API_KEY}`;

        // Add additional params if provided
        if (params) {
            url += `&${params}`;
        }

        console.log(`📡 FMP Proxy: ${endpoint}`);

        // Fetch from FMP
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`❌ FMP Error: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({
                error: 'FMP API error',
                status: response.status
            });
        }

        const data = await response.json();

        // Return data
        return res.status(200).json(data);

    } catch (error) {
        console.error('❌ FMP Proxy Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
