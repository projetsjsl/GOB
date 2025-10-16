/**
 * API Endpoint pour gérer les tickers d'équipe
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    try {
        switch (req.method) {
            case 'GET':
                return await handleGet(req, res, supabaseUrl, supabaseKey);
            case 'POST':
                return await handlePost(req, res, supabaseUrl, supabaseKey);
            case 'DELETE':
                return await handleDelete(req, res, supabaseUrl, supabaseKey);
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('❌ Team Tickers API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function handleGet(req, res, supabaseUrl, supabaseKey) {
    const response = await fetch(`${supabaseUrl}/rest/v1/team_tickers?select=*&order=priority.desc,ticker.asc`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json({
        success: true,
        tickers: data,
        count: data.length,
        timestamp: new Date().toISOString()
    });
}

async function handlePost(req, res, supabaseUrl, supabaseKey) {
    const { ticker, priority = 1, notes = '' } = req.body;

    if (!ticker) {
        return res.status(400).json({ error: 'Ticker is required' });
    }

    // Validation du ticker
    if (!/^[A-Z]{1,5}$/.test(ticker.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid ticker format' });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/team_tickers`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ticker: ticker.toUpperCase(),
            priority: parseInt(priority),
            notes: notes
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
            return res.status(409).json({ error: 'Ticker already exists' });
        }
        throw new Error(`Supabase error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    return res.status(201).json({
        success: true,
        ticker: data[0],
        message: 'Ticker added successfully'
    });
}

async function handleDelete(req, res, supabaseUrl, supabaseKey) {
    const { ticker } = req.query;

    if (!ticker) {
        return res.status(400).json({ error: 'Ticker is required' });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/team_tickers?ticker=eq.${ticker.toUpperCase()}`, {
        method: 'DELETE',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Supabase error: ${response.status}`);
    }

    return res.status(200).json({
        success: true,
        message: `Ticker ${ticker} deleted successfully`
    });
}
