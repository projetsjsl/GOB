/**
 * Finance Pro Snapshots API
 * CRUD operations for managing versioned snapshots of 3p1 analyses
 * 
 * Endpoints:
 * - GET    ?ticker=AAPL         - List all snapshots for ticker
 * - GET    ?id=uuid             - Get specific snapshot
 * - POST   { data }             - Create new snapshot
 * - PUT    { id, notes }        - Update snapshot metadata
 * - DELETE ?id=uuid             - Delete snapshot
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('Supabase config missing:', { 
            hasUrl: !!SUPABASE_URL, 
            hasKey: !!SUPABASE_KEY,
            envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
        });
        return res.status(500).json({ 
            error: 'Supabase configuration missing',
            debug: process.env.NODE_ENV === 'development' ? {
                hasUrl: !!SUPABASE_URL,
                hasKey: !!SUPABASE_KEY
            } : undefined
        });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        switch (req.method) {
            case 'GET':
                return await getSnapshots(req, res, supabase);
            case 'POST':
                return await createSnapshot(req, res, supabase);
            case 'PUT':
                return await updateSnapshot(req, res, supabase);
            case 'DELETE':
                return await deleteSnapshot(req, res, supabase);
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Finance snapshots API error:', error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * GET - List snapshots or get specific one
 */
async function getSnapshots(req, res, supabase) {
    const { ticker, id, limit = 50 } = req.query;

    if (id) {
        // Get specific snapshot
        const { data, error } = await supabase
            .from('finance_pro_snapshots')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Get snapshot error:', error);
            return res.status(404).json({ error: 'Snapshot not found' });
        }

        return res.status(200).json(data);
    }

    if (ticker) {
        // List snapshots for ticker
        const { data, error } = await supabase
            .from('finance_pro_snapshots')
            .select('*')
            .eq('ticker', ticker.toUpperCase())
            .order('snapshot_date', { ascending: false })
            .order('id', { ascending: false })
            .limit(parseInt(limit));

        if (error) {
            console.error('List snapshots error:', error);
            return res.status(500).json({ error: 'Failed to fetch snapshots' });
        }

        return res.status(200).json({
            count: data.length,
            ticker: ticker.toUpperCase(),
            snapshots: data
        });
    }

    // No ticker or id - error
    return res.status(400).json({ error: 'Ticker or ID required' });
}

/**
 * POST - Create new snapshot
 */
async function createSnapshot(req, res, supabase) {
    const {
        ticker,
        profile_id,
        annual_data,
        assumptions,
        company_info,
        notes,
        is_current = true,
        is_watchlist = false,
        auto_fetched = false,
        user_id = null,
        sync_metadata = null // Métadonnées de synchronisation
    } = req.body;

    // Validation
    if (!ticker || !annual_data || !assumptions || !company_info) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['ticker', 'annual_data', 'assumptions', 'company_info']
        });
    }

    const cleanTicker = ticker.toUpperCase();

    // If is_current=true, unmark other current snapshots for this ticker
    if (is_current) {
        await supabase
            .from('finance_pro_snapshots')
            .update({ is_current: false })
            .eq('ticker', cleanTicker);
    }

    // Create snapshot
    const { data, error } = await supabase
        .from('finance_pro_snapshots')
        .insert([{
            ticker: cleanTicker,
            profile_id: profile_id || cleanTicker,
            user_id,
            notes,
            is_current,
            is_watchlist,
            auto_fetched,
            annual_data,
            assumptions,
            company_info,
            sync_metadata // Ajouter les métadonnées de synchronisation
        }])
        .select()
        .single();

    if (error) {
        console.error('Create snapshot error:', error);
        return res.status(500).json({ 
            error: 'Failed to create snapshot',
            details: error.message,
            code: error.code,
            hint: error.hint
        });
    }

    console.log(`✅ Created snapshot for ${cleanTicker} (version ${data.version})`);
    return res.status(201).json(data);
}

/**
 * PUT - Update snapshot metadata (notes, is_current, etc.)
 */
async function updateSnapshot(req, res, supabase) {
    const { id, notes, is_current } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Snapshot ID required' });
    }

    const updates = {};
    if (notes !== undefined) updates.notes = notes;
    if (is_current !== undefined) {
        updates.is_current = is_current;

        // If marking as current, unmark others for same ticker
        if (is_current) {
            const { data: snapshot } = await supabase
                .from('finance_pro_snapshots')
                .select('ticker')
                .eq('id', id)
                .single();

            if (snapshot) {
                await supabase
                    .from('finance_pro_snapshots')
                    .update({ is_current: false })
                    .eq('ticker', snapshot.ticker)
                    .neq('id', id);
            }
        }
    }

    const { data, error } = await supabase
        .from('finance_pro_snapshots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Update snapshot error:', error);
        return res.status(500).json({ error: 'Failed to update snapshot' });
    }

    return res.status(200).json(data);
}

/**
 * DELETE - Delete snapshot
 */
async function deleteSnapshot(req, res, supabase) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Snapshot ID required' });
    }

    const { error } = await supabase
        .from('finance_pro_snapshots')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Delete snapshot error:', error);
        return res.status(500).json({ error: 'Failed to delete snapshot' });
    }

    return res.status(200).json({ success: true, message: 'Snapshot deleted' });
}
