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
const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log('[finance-snapshots] Request received', {
        method: req.method,
        query: req.query,
        timestamp: new Date().toISOString()
    });

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
        console.error(' Finance snapshots API error:', error);
        console.error('Error stack:', error.stack);
        console.error('Request method:', req.method);
        console.error('Request body keys:', req.body ? Object.keys(req.body) : 'no body');
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
}

/**
 * GET - List snapshots or get specific one
 */
async function getSnapshots(req, res, supabase) {
    const { ticker, id, limit = 50, all, current, approved_only, distinct_tickers } = req.query;

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

        return res.status(200).json({ success: true, data: [data] });
    }

    // BULK QUERY: Get distinct approved tickers (for KPI performance optimization)
    if (approved_only === 'true' && distinct_tickers === 'true') {
        try {
            // Query distinct tickers that have at least one is_current=true snapshot
            // This is the optimized path for KPI loading
            const { data, error } = await supabase
                .from('finance_pro_snapshots')
                .select('ticker')
                .eq('is_current', true);

            if (error) {
                console.error('Bulk approved tickers query error:', error);
                return res.status(500).json({ error: 'Failed to fetch approved tickers' });
            }

            // Extract unique tickers
            const tickerSet = new Set(data.map(row => row.ticker));
            const tickers = Array.from(tickerSet);

            console.log(` KPI Bulk Query: ${tickers.length} approved tickers returned`);
            return res.status(200).json({
                success: true,
                count: tickers.length,
                tickers: tickers
            });
        } catch (bulkError) {
            console.error('Bulk query unexpected error:', bulkError);
            return res.status(500).json({ error: 'Bulk query failed' });
        }
    }

    if (ticker) {
        // List snapshots for ticker
        let query = supabase
            .from('finance_pro_snapshots')
            .select('*')
            .eq('ticker', ticker.toUpperCase());

        // Filter by current if specified
        if (current === 'true') {
            query = query.eq('is_current', true);
        }

        query = query
            .order('snapshot_date', { ascending: false })
            .order('id', { ascending: false })
            .limit(parseInt(limit));

        const { data, error } = await query;

        if (error) {
            console.error('List snapshots error:', error);
            return res.status(500).json({ error: 'Failed to fetch snapshots' });
        }

        return res.status(200).json({
            success: true,
            count: data.length,
            ticker: ticker.toUpperCase(),
            data: data
        });
    }

    // Get all snapshots (for Finance Pro dashboard)
    if (all === 'true') {
        let query = supabase
            .from('finance_pro_snapshots')
            .select('*');

        // Filter by current if specified
        if (current === 'true') {
            query = query.eq('is_current', true);
        }

        query = query
            .order('ticker', { ascending: true })
            .limit(parseInt(limit) || 2000);

        const { data, error } = await query;

        if (error) {
            console.error('List all snapshots error:', error);
            return res.status(500).json({ error: 'Failed to fetch snapshots' });
        }

        return res.status(200).json({
            success: true,
            count: data.length,
            data: data
        });
    }

    // No ticker or id - error
    return res.status(400).json({ error: 'Ticker, ID, or all=true required' });
}

async function createCurrentSnapshotWithRpc(supabase, payload) {
    return await supabase
        .rpc('create_current_snapshot', payload)
        .single();
}

/**
 * POST - Create new snapshot
 */
async function createSnapshot(req, res, supabase) {
    try {
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
        sync_metadata = null // Metadonnees de synchronisation
    } = req.body;

    // Validation
    if (!ticker || !annual_data || !assumptions || !company_info) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['ticker', 'annual_data', 'assumptions', 'company_info'],
            received: {
                hasTicker: !!ticker,
                hasAnnualData: !!annual_data,
                hasAssumptions: !!assumptions,
                hasCompanyInfo: !!company_info
            }
        });
    }

    // Verifier la taille des donnees (limite approximative de 1MB pour JSONB)
    try {
        const dataSize = JSON.stringify({ annual_data, assumptions, company_info }).length;
        if (dataSize > 1000000) { // 1MB
            console.warn(` Large payload for ${ticker}: ${(dataSize / 1024).toFixed(2)}KB`);
        }
    } catch (sizeError) {
        console.warn('Could not calculate payload size:', sizeError);
    }

    const cleanTicker = ticker.toUpperCase();
    const isCurrentValue = is_current !== undefined ? Boolean(is_current) : true;
    const snapshotDate = new Date().toISOString().split('T')[0];

    // Nettoyer annual_data : supprimer les champs non standard et valider les valeurs numeriques
    let cleanedAnnualData = [];
    try {
        if (Array.isArray(annual_data) && annual_data.length > 0) {
            // Fonction helper pour nettoyer les valeurs numeriques
            const cleanNumber = (val) => {
                if (val === null || val === undefined) return 0;
                const num = Number(val);
                if (isNaN(num) || !isFinite(num)) return 0;
                return num;
            };
            
            cleanedAnnualData = annual_data.map(row => {
                if (!row || typeof row !== 'object') {
                    // Si la ligne n'est pas un objet valide, retourner un objet minimal
                    return {
                        year: new Date().getFullYear(),
                        priceHigh: 0,
                        priceLow: 0,
                        cashFlowPerShare: 0,
                        dividendPerShare: 0,
                        bookValuePerShare: 0,
                        earningsPerShare: 0
                    };
                }
                
                // Garder seulement les champs standard de AnnualData avec validation
                const cleaned = {
                    year: Number(row.year) || new Date().getFullYear(),
                    priceHigh: cleanNumber(row.priceHigh),
                    priceLow: cleanNumber(row.priceLow),
                    cashFlowPerShare: cleanNumber(row.cashFlowPerShare),
                    dividendPerShare: cleanNumber(row.dividendPerShare),
                    bookValuePerShare: cleanNumber(row.bookValuePerShare),
                    earningsPerShare: cleanNumber(row.earningsPerShare)
                };
                // Ajouter les champs optionnels seulement s'ils existent
                if (row.isEstimate !== undefined) cleaned.isEstimate = Boolean(row.isEstimate);
                if (row.autoFetched !== undefined) cleaned.autoFetched = Boolean(row.autoFetched);
                // Note: dataSource est conserve car c'est un champ valide dans AnnualData
                if (row.dataSource && ['fmp-verified', 'fmp-adjusted', 'manual', 'calculated'].includes(row.dataSource)) {
                    cleaned.dataSource = row.dataSource;
                }
                return cleaned;
            });
        } else if (Array.isArray(annual_data)) {
            // Array vide
            cleanedAnnualData = [];
        } else {
            // Si ce n'est pas un array, essayer de le convertir ou utiliser un array vide
            console.warn(` annual_data is not an array for ${cleanTicker}, using empty array`);
            cleanedAnnualData = [];
        }
    } catch (cleanError) {
        console.error(` Error cleaning annual_data for ${cleanTicker}:`, cleanError);
        cleanedAnnualData = [];
    }

    // S'assurer que assumptions et company_info sont des objets valides
    let cleanedAssumptions = {};
    let cleanedCompanyInfo = {};
    try {
        cleanedAssumptions = (assumptions && typeof assumptions === 'object' && !Array.isArray(assumptions)) 
            ? assumptions 
            : {};
        cleanedCompanyInfo = (company_info && typeof company_info === 'object' && !Array.isArray(company_info)) 
            ? company_info 
            : {};
    } catch (cleanError) {
        console.error(` Error cleaning assumptions/company_info for ${cleanTicker}:`, cleanError);
        cleanedAssumptions = {};
        cleanedCompanyInfo = {};
    }

    // Create snapshot - Construire l'objet d'insertion de maniere conditionnelle
    const insertData = {
        ticker: cleanTicker,
        profile_id: profile_id || cleanTicker,
        user_id: user_id || null,
        notes: notes || null,
        snapshot_date: snapshotDate, // Format YYYY-MM-DD pour DATE
        is_current: isCurrentValue,
        is_watchlist: is_watchlist !== undefined ? Boolean(is_watchlist) : false,
        auto_fetched: auto_fetched !== undefined ? Boolean(auto_fetched) : false,
        annual_data: cleanedAnnualData, // Utiliser les donnees nettoyees
        assumptions: cleanedAssumptions,
        company_info: cleanedCompanyInfo
    };
    
    // Ajouter sync_metadata seulement si fourni (colonne peut ne pas exister si migration non appliquee)
    if (sync_metadata !== null && sync_metadata !== undefined) {
        insertData.sync_metadata = sync_metadata;
    }

    // Log pour debug (seulement en developpement)
    if (process.env.NODE_ENV === 'development') {
        console.log(` Attempting to create snapshot for ${cleanTicker}:`, {
            ticker: insertData.ticker,
            annual_data_length: cleanedAnnualData.length,
            has_assumptions: Object.keys(cleanedAssumptions).length > 0,
            has_company_info: Object.keys(cleanedCompanyInfo).length > 0,
            has_sync_metadata: !!insertData.sync_metadata
        });
    }

    if (isCurrentValue) {
        const { data, error } = await createCurrentSnapshotWithRpc(supabase, {
            p_ticker: cleanTicker,
            p_profile_id: insertData.profile_id,
            p_user_id: insertData.user_id,
            p_notes: insertData.notes,
            p_snapshot_date: snapshotDate,
            p_is_watchlist: insertData.is_watchlist,
            p_auto_fetched: insertData.auto_fetched,
            p_annual_data: insertData.annual_data,
            p_assumptions: insertData.assumptions,
            p_company_info: insertData.company_info,
            p_sync_metadata: insertData.sync_metadata ?? null
        });

        if (error) {
            console.error(` Create snapshot error for ${cleanTicker}:`, error);
            return res.status(500).json({ 
                error: 'Failed to create snapshot',
                details: error.message,
                code: error.code,
                hint: error.hint,
                ticker: cleanTicker
            });
        }

        console.log(` Created snapshot for ${cleanTicker} (version ${data.version})`);
        return res.status(201).json(data);
    }

    const { data, error } = await supabase
        .from('finance_pro_snapshots')
        .insert([insertData])
        .select()
        .single();

    if (error) {
        console.error(` Create snapshot error for ${cleanTicker}:`, error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
        });
        
        return res.status(500).json({ 
            error: 'Failed to create snapshot',
            details: error.message,
            code: error.code,
            hint: error.hint,
            ticker: cleanTicker
        });
    }

    console.log(` Created snapshot for ${cleanTicker} (version ${data.version})`);
    return res.status(201).json(data);
    } catch (snapshotError) {
        console.error(` Unexpected error in createSnapshot for ${req.body?.ticker || 'unknown'}:`, snapshotError);
        console.error('Error stack:', snapshotError.stack);
        return res.status(500).json({ 
            error: 'Failed to create snapshot',
            message: snapshotError.message,
            ...(process.env.NODE_ENV === 'development' && { stack: snapshotError.stack })
        });
    }
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
