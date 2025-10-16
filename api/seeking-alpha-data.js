/**
 * API Endpoint pour gérer les données Seeking Alpha
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('❌ Seeking Alpha Data API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function handleGet(req, res, supabaseUrl, supabaseKey) {
    const { ticker, limit = 10 } = req.query;

    let url = `${supabaseUrl}/rest/v1/seeking_alpha_data?select=*&order=timestamp.desc`;
    
    if (ticker) {
        url += `&ticker=eq.${ticker.toUpperCase()}`;
    }
    
    if (limit) {
        url += `&limit=${parseInt(limit)}`;
    }

    const response = await fetch(url, {
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
        data: data,
        count: data.length,
        ticker: ticker || 'all',
        timestamp: new Date().toISOString()
    });
}

async function handlePost(req, res, supabaseUrl, supabaseKey) {
    const { ticker, raw_text, url } = req.body;

    if (!ticker || !raw_text) {
        return res.status(400).json({ error: 'Ticker and raw_text are required' });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/seeking_alpha_data`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ticker: ticker.toUpperCase(),
            raw_text: raw_text,
            url: url || null,
            timestamp: new Date().toISOString()
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Supabase error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    return res.status(201).json({
        success: true,
        data: data[0],
        message: 'Seeking Alpha data saved successfully'
    });
}
