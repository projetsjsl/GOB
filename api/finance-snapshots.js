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

    // Nettoyer annual_data : supprimer les champs non standard et valider les valeurs numériques
    const cleanedAnnualData = Array.isArray(annual_data) 
        ? annual_data.map(row => {
            // Fonction helper pour nettoyer les valeurs numériques
            const cleanNumber = (val) => {
                if (val === null || val === undefined || isNaN(val) || !isFinite(val)) return 0;
                return Number(val);
            };
            
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
            // Note: dataSource est conservé car c'est un champ valide dans AnnualData
            if (row.dataSource && ['fmp-verified', 'fmp-adjusted', 'manual', 'calculated'].includes(row.dataSource)) {
                cleaned.dataSource = row.dataSource;
            }
            return cleaned;
        })
        : (Array.isArray(annual_data) ? [] : annual_data);

    // S'assurer que assumptions et company_info sont des objets valides
    const cleanedAssumptions = assumptions && typeof assumptions === 'object' ? assumptions : {};
    const cleanedCompanyInfo = company_info && typeof company_info === 'object' ? company_info : {};

    // Create snapshot - Construire l'objet d'insertion de manière conditionnelle
    const insertData = {
        ticker: cleanTicker,
        profile_id: profile_id || cleanTicker,
        user_id: user_id || null,
        notes: notes || null,
        snapshot_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD pour DATE
        is_current: is_current !== undefined ? Boolean(is_current) : true,
        is_watchlist: is_watchlist !== undefined ? Boolean(is_watchlist) : false,
        auto_fetched: auto_fetched !== undefined ? Boolean(auto_fetched) : false,
        annual_data: cleanedAnnualData, // Utiliser les données nettoyées
        assumptions: cleanedAssumptions,
        company_info: cleanedCompanyInfo
    };
    
    // Ajouter sync_metadata seulement si fourni (colonne peut ne pas exister si migration non appliquée)
    if (sync_metadata !== null && sync_metadata !== undefined) {
        insertData.sync_metadata = sync_metadata;
    }

    // Create snapshot
    const { data, error } = await supabase
        .from('finance_pro_snapshots')
        .insert([insertData])
        .select()
        .single();

    if (error) {
        console.error(`❌ Create snapshot error for ${cleanTicker}:`, error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
        });
        
        // Si l'erreur est liée à sync_metadata (colonne inexistante), réessayer sans
        if (error.code === '42703' || (error.message && error.message.includes('sync_metadata'))) {
            console.warn('⚠️ sync_metadata column not found, retrying without it...');
            delete insertData.sync_metadata;
            
            const { data: retryData, error: retryError } = await supabase
                .from('finance_pro_snapshots')
                .insert([insertData])
                .select()
                .single();
            
            if (retryError) {
                console.error('Retry create snapshot error:', retryError);
                return res.status(500).json({ 
                    error: 'Failed to create snapshot',
                    details: retryError.message,
                    code: retryError.code,
                    hint: retryError.hint
                });
            }
            
            console.log(`✅ Created snapshot for ${cleanTicker} (version ${retryData.version}) - without sync_metadata`);
            return res.status(201).json(retryData);
        }
        
        // Si erreur 400, c'est probablement un problème de validation JSON
        // Essayer de nettoyer encore plus les données
        if (error.code === '23502' || error.code === '23514' || (error.message && error.message.includes('constraint'))) {
            console.warn(`⚠️ Validation error for ${cleanTicker}, trying with minimal data...`);
            
            // Essayer avec des données minimales pour identifier le problème
            const minimalData = {
                ticker: cleanTicker,
                profile_id: profile_id || cleanTicker,
                is_current,
                is_watchlist,
                auto_fetched,
                annual_data: cleanedAnnualData.length > 0 ? cleanedAnnualData.slice(0, 1) : cleanedAnnualData, // Un seul élément pour test
                assumptions: assumptions || {},
                company_info: company_info || {}
            };
            
            const { data: minimalRetryData, error: minimalRetryError } = await supabase
                .from('finance_pro_snapshots')
                .insert([minimalData])
                .select()
                .single();
            
            if (minimalRetryError) {
                console.error('Minimal retry also failed:', minimalRetryError);
                return res.status(500).json({ 
                    error: 'Failed to create snapshot (validation error)',
                    details: error.message,
                    code: error.code,
                    hint: error.hint,
                    ticker: cleanTicker
                });
            }
            
            console.log(`✅ Created snapshot for ${cleanTicker} with minimal data`);
            return res.status(201).json(minimalRetryData);
        }
        
        return res.status(500).json({ 
            error: 'Failed to create snapshot',
            details: error.message,
            code: error.code,
            hint: error.hint,
            ticker: cleanTicker
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
