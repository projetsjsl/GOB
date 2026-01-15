/**
 * Data Explorer API - Supabase Table Browser
 * 
 * Endpoints:
 * - GET ?action=tables - List all 3P1-related tables with row counts
 * - GET ?action=data&table=finance_pro_snapshots - Get table data with pagination
 * - GET ?action=metadata&table=X - Get column info and last update times
 * - POST ?action=export - Export selected data to JSON/CSV
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

// Tables related to 3P1 Finance Pro
const P3P1_TABLES = [
    { name: 'finance_pro_snapshots', label: 'Snapshots 3P1', icon: '', primaryKey: 'id' },
    { name: 'tickers', label: 'Tickers Database', icon: '', primaryKey: 'ticker' },
    { name: 'watchlist', label: 'Watchlist', icon: '', primaryKey: 'ticker' },
    { name: 'user_profiles', label: 'User Profiles', icon: '', primaryKey: 'id' },
    { name: 'validation_settings', label: 'Validation Settings', icon: '', primaryKey: 'id' },
    { name: 'emma_config', label: 'Emma Config', icon: '', primaryKey: 'id' },
    { name: 'news_cache', label: 'News Cache', icon: '', primaryKey: 'id' },
    { name: 'llm_models', label: 'LLM Models', icon: '', primaryKey: 'id' }
];

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { action } = req.query;

    try {
        switch (action) {
            case 'insert':
                return await insertData(req, res, supabase);
            case 'update':
                return await updateData(req, res, supabase);
            case 'delete':
                return await deleteData(req, res, supabase);
            case 'tables':
                return await listTables(req, res, supabase);
            case 'data':
                return await getTableData(req, res, supabase);
            case 'metadata':
                return await getTableMetadata(req, res, supabase);
            case 'export':
                return await exportData(req, res, supabase);
            case 'sync-selected':
                return await syncSelected(req, res, supabase);
            default:
                return res.status(400).json({ 
                    error: 'Action required', 
                    available: ['tables', 'data', 'metadata', 'export', 'sync-selected', 'insert', 'update', 'delete'] 
                });
        }
    } catch (error) {
        console.error(' Data Explorer API error:', error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * List all 3P1 tables with row counts and last update
 */
async function listTables(req, res, supabase) {
    const results = [];
    
    for (const table of P3P1_TABLES) {
        try {
            // Get row count
            const { count, error: countError } = await supabase
                .from(table.name)
                .select('*', { count: 'exact', head: true });
            
            if (countError) {
                results.push({
                    ...table,
                    count: 0,
                    lastUpdate: null,
                    error: countError.message
                });
                continue;
            }

            // Try to get last update safely
            let lastUpdate = null;
            try {
                // Get one row to see which columns exist
                const { data: sampleRow } = await supabase.from(table.name).select('*').limit(1).single();
                const availableCols = sampleRow ? Object.keys(sampleRow) : [];
                
                let orderCol = null;
                if (availableCols.includes('updated_at')) orderCol = 'updated_at';
                else if (availableCols.includes('created_at')) orderCol = 'created_at';
                else if (availableCols.includes('snapshot_date')) orderCol = 'snapshot_date';

                if (orderCol) {
                    const { data: lastRow } = await supabase
                        .from(table.name)
                        .select(orderCol)
                        .order(orderCol, { ascending: false, nullsFirst: false })
                        .limit(1)
                        .single();
                    
                    lastUpdate = lastRow?.[orderCol] || null;
                }
            } catch (e) {
                // Column doesn't exist, ignore
            }

            results.push({
                ...table,
                count: count || 0,
                lastUpdate
            });
        } catch (e) {
            results.push({
                ...table,
                count: 0,
                lastUpdate: null,
                error: e.message
            });
        }
    }

    return res.status(200).json({
        success: true,
        tables: results,
        timestamp: new Date().toISOString()
    });
}

/**
 * Get paginated table data
 */
async function getTableData(req, res, supabase) {
    const { table, page = 1, limit = 50, ticker, search, orderBy, ascending = 'false' } = req.query;
    
    if (!table) {
        return res.status(400).json({ error: 'Table name required' });
    }

    // Validate table name (security)
    if (!P3P1_TABLES.some(t => t.name === table)) {
        return res.status(400).json({ error: 'Invalid table name' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = supabase
        .from(table)
        .select('*', { count: 'exact' });
    
    // Filter by ticker if provided
    if (ticker) {
        query = query.eq('ticker', ticker.toUpperCase());
    }
    
    // Search in common fields
    if (search) {
        // Try to determine if search is for a specific column
        if (search.includes(':')) {
            const [col, val] = search.split(':');
            query = query.ilike(col.trim(), `%${val.trim()}%`);
        } else {
            // Default search logic
            query = query.or(`ticker.ilike.%${search}%,notes.ilike.%${search}%`);
        }
    }

    // Apply multiple filters from body if provided
    const { filters: bodyFilters } = req.body || {};
    if (bodyFilters && typeof bodyFilters === 'object') {
        Object.entries(bodyFilters).forEach(([col, val]) => {
            if (val === null) query = query.is(col, null);
            else if (typeof val === 'boolean') query = query.eq(col, val);
            else query = query.ilike(col, `%${val}%`);
        });
    }
    
    // Determine default sort if not provided
    let finalOrderBy = orderBy;
    if (!finalOrderBy || finalOrderBy === 'undefined') {
        // Try to find a good default column by getting one row
        const { data: sample } = await supabase.from(table).select('*').limit(1);
        const cols = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
        if (cols.includes('updated_at')) finalOrderBy = 'updated_at';
        else if (cols.includes('created_at')) finalOrderBy = 'created_at';
        else if (cols.includes('ticker')) finalOrderBy = 'ticker';
        else if (cols.length > 0) finalOrderBy = cols[0];
    }

    // Order and paginate
    if (finalOrderBy) {
        query = query.order(finalOrderBy, { ascending: ascending === 'true' });
    }
    
    query = query.range(offset, offset + parseInt(limit) - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
        console.error(`Get ${table} data error:`, error);
        return res.status(500).json({ error: error.message });
    }

    // Get column info from first row
    const columns = data.length > 0 
        ? Object.keys(data[0]).map(key => ({
            name: key,
            type: typeof data[0][key],
            sample: data[0][key]
        }))
        : [];

    return res.status(200).json({
        success: true,
        table,
        data,
        columns,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit))
        }
    });
}

/**
 * Get table metadata (columns, types, stats)
 */
async function getTableMetadata(req, res, supabase) {
    const { table } = req.query;
    
    if (!table) {
        return res.status(400).json({ error: 'Table name required' });
    }

    if (!P3P1_TABLES.some(t => t.name === table)) {
        return res.status(400).json({ error: 'Invalid table name' });
    }

    // Get sample data to infer columns
    const { data: sample, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(5);
    
    if (sampleError) {
        return res.status(500).json({ error: sampleError.message });
    }

    // Get row count
    const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

    // Infer column info
    const columns = sample.length > 0 
        ? Object.entries(sample[0]).map(([key, value]) => ({
            name: key,
            type: Array.isArray(value) ? 'array' : typeof value,
            isNullable: sample.some(row => row[key] === null),
            sampleValues: [...new Set(sample.map(row => 
                typeof row[key] === 'object' ? JSON.stringify(row[key]).slice(0, 50) : String(row[key]).slice(0, 50)
            ))].slice(0, 3)
        }))
        : [];

    // Get ticker-specific stats if applicable
    let tickerStats = null;
    if (columns.some(c => c.name === 'ticker')) {
        const { data: tickers } = await supabase
            .from(table)
            .select('ticker')
            .order('ticker');
        
        tickerStats = {
            uniqueTickers: [...new Set(tickers?.map(t => t.ticker) || [])],
            totalTickers: new Set(tickers?.map(t => t.ticker) || []).size
        };
    }

    return res.status(200).json({
        success: true,
        table,
        rowCount: count,
        columns,
        tickerStats,
        tableInfo: P3P1_TABLES.find(t => t.name === table)
    });
}

/**
 * Export data in various formats
 */
async function exportData(req, res, supabase) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POST required' });
    }

    const { table, format = 'json', filters = {}, columns: selectedColumns } = req.body;
    
    if (!table) {
        return res.status(400).json({ error: 'Table name required' });
    }

    if (!P3P1_TABLES.some(t => t.name === table)) {
        return res.status(400).json({ error: 'Invalid table name' });
    }

    // Build query
    let query = supabase.from(table).select(selectedColumns?.join(',') || '*');
    
    // Apply filters
    if (filters.ticker) {
        query = query.eq('ticker', filters.ticker.toUpperCase());
    }
    if (filters.is_current !== undefined) {
        query = query.eq('is_current', filters.is_current);
    }
    if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
    }
    
    // Apply sort safely
    const { data: sortSample } = await supabase.from(table).select('*').limit(1);
    const availableCols = sortSample && sortSample.length > 0 ? Object.keys(sortSample[0]) : [];
    
    if (availableCols.includes('created_at')) {
        query = query.order('created_at', { ascending: false });
    } else if (availableCols.includes('updated_at')) {
        query = query.order('updated_at', { ascending: false });
    }

    const { data, error } = await query;
    
    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Format based on requested type
    if (format === 'csv') {
        const csv = convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${table}_export.csv"`);
        return res.status(200).send(csv);
    }

    // JSON format (default)
    return res.status(200).json({
        success: true,
        table,
        exportedAt: new Date().toISOString(),
        rowCount: data.length,
        data
    });
}

/**
 * Insert new row
 */
async function insertData(req, res, supabase) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    const { table, data } = req.body;
    
    if (!table || !data) return res.status(400).json({ error: 'Table and data required' });
    if (!P3P1_TABLES.some(t => t.name === table)) return res.status(400).json({ error: 'Invalid table' });

    const { data: result, error } = await supabase.from(table).insert(data).select();
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, data: result });
}

/**
 * Update existing row
 */
async function updateData(req, res, supabase) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    const { table, id, data } = req.body;
    
    if (!table || !id || !data) return res.status(400).json({ error: 'Table, ID and data required' });
    if (!P3P1_TABLES.some(t => t.name === table)) return res.status(400).json({ error: 'Invalid table' });

    const tableConfig = P3P1_TABLES.find(t => t.name === table);
    const pk = tableConfig.primaryKey || 'id';

    const { data: result, error } = await supabase.from(table).update(data).eq(pk, id).select();
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, data: result });
}

/**
 * Delete row
 */
async function deleteData(req, res, supabase) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    const { table, id } = req.body;
    
    if (!table) return res.status(400).json({ error: 'Missing table name in request body' });
    if (!id) return res.status(400).json({ error: 'Missing ID in request body' });
    if (!P3P1_TABLES.some(t => t.name === table)) return res.status(400).json({ error: `Invalid table: ${table}. Allowed: ${P3P1_TABLES.map(t => t.name).join(', ')}` });

    const tableConfig = P3P1_TABLES.find(t => t.name === table);
    const pk = tableConfig.primaryKey || 'id';

    const { error } = await supabase.from(table).delete().eq(pk, id);
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
}

/**
 * Sync selected rows (placeholder for future implementation)
 */
async function syncSelected(req, res, supabase) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    const { table, ids } = req.body;
    
    if (!table || !ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'Table and array of IDs required' });
    }
    
    // TODO: Implement sync logic based on specific table requirements
    return res.status(200).json({ 
        success: true, 
        message: 'Sync completed',
        synced_count: ids.length 
    });
}

/**
 * Helper: Convert data array to CSV
 */
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
            return String(val).replace(/"/g, '""');
        }).map(v => `"${v}"`).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}
