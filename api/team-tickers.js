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
    // Récupérer depuis la table unifiée tickers avec source='team' ou 'both'
    const response = await fetch(
        `${supabaseUrl}/rest/v1/tickers?select=*&is_active=eq.true&or=(category.eq.team,category.eq.both)&order=priority.desc,ticker.asc`,
        {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        }
    );

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
    const { ticker, priority = 1, notes = '', company_name = '' } = req.body;

    if (!ticker) {
        return res.status(400).json({ error: 'Ticker is required' });
    }

    // Validation du ticker
    if (!/^[A-Z]{1,5}$/.test(ticker.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid ticker format' });
    }

    const tickerUpper = ticker.toUpperCase();
    
    // Vérifier si le ticker existe déjà
    const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/tickers?ticker=eq.${tickerUpper}&select=ticker,source`,
        {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (checkResponse.ok) {
        const existing = await checkResponse.json();
        if (existing.length > 0) {
            // Si existe déjà, mettre à jour le source si nécessaire
            const existingTicker = existing[0];
            let newCategory = 'team';
            let newCategories = ['team'];
            
            if (existingTicker.category === 'watchlist' || (existingTicker.categories && existingTicker.categories.includes('watchlist'))) {
                newCategory = 'both';
                newCategories = ['team', 'watchlist'];
            } else if (existingTicker.category === 'both' || (existingTicker.categories && existingTicker.categories.includes('team') && existingTicker.categories.includes('watchlist'))) {
                newCategory = 'both';
                newCategories = ['team', 'watchlist'];
            }

            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/tickers?ticker=eq.${tickerUpper}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        category: newCategory,
                        categories: newCategories,
                        priority: parseInt(priority),
                        notes: notes || existingTicker.notes,
                        company_name: company_name || existingTicker.company_name,
                        is_active: true,
                        updated_at: new Date().toISOString()
                    })
                }
            );

            if (updateResponse.ok) {
                const updated = await updateResponse.json();
                return res.status(200).json({
                    success: true,
                    ticker: updated[0],
                    message: 'Ticker updated successfully'
                });
            }
        }
    }

    // Insérer nouveau ticker
    const response = await fetch(`${supabaseUrl}/rest/v1/tickers`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            ticker: tickerUpper,
            category: 'team',
            categories: ['team'],
            priority: parseInt(priority),
            notes: notes,
            company_name: company_name,
            is_active: true
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

    const tickerUpper = ticker.toUpperCase();

    // Vérifier si le ticker existe et son source
    const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/tickers?ticker=eq.${tickerUpper}&select=ticker,source`,
        {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!checkResponse.ok) {
        throw new Error(`Supabase error: ${checkResponse.status}`);
    }

    const existing = await checkResponse.json();
    
    if (existing.length === 0) {
        return res.status(404).json({ error: 'Ticker not found' });
    }

    const existingTicker = existing[0];

    // Si category est 'both', mettre à jour vers 'watchlist' au lieu de supprimer
    if (existingTicker.category === 'both' || (existingTicker.categories && existingTicker.categories.includes('team') && existingTicker.categories.includes('watchlist'))) {
        const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/tickers?ticker=eq.${tickerUpper}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    category: 'watchlist',
                    categories: ['watchlist'],
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (!updateResponse.ok) {
            throw new Error(`Supabase error: ${updateResponse.status}`);
        }

        return res.status(200).json({
            success: true,
            message: `Ticker ${ticker} removed from team (now watchlist only)`
        });
    }

    // Si source est 'team', supprimer
    const response = await fetch(
        `${supabaseUrl}/rest/v1/tickers?ticker=eq.${tickerUpper}&source=eq.team`,
        {
            method: 'DELETE',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Supabase error: ${response.status}`);
    }

    return res.status(200).json({
        success: true,
        message: `Ticker ${ticker} deleted successfully`
    });
}
