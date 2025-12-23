/**
 * SUPABASE AGENT - Database Operations Agent
 * 
 * Handles all Supabase database operations:
 * - List/query tables
 * - Execute queries (read-only for safety)
 * - Export data
 * - Manage snapshots
 * - Sync operations
 */

import { BaseAgent } from './base-agent.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

// Known 3P1 tables
const KNOWN_TABLES = [
    'finance_pro_snapshots',
    'tickers',
    'watchlist',
    'user_profiles',
    'validation_settings',
    'emma_config',
    'news_cache',
    'llm_models'
];

export class SupabaseAgent extends BaseAgent {
    constructor() {
        super({
            id: 'supabase',
            name: 'Supabase Database Agent',
            description: 'Manages Supabase database operations, queries, and data sync for 3P1',
            capabilities: [
                'list_tables',
                'query_table',
                'get_table_stats',
                'get_snapshots',
                'create_snapshot',
                'export_data',
                'sync_status'
            ]
        });

        this.supabase = null;
        this.initClient();
    }

    initClient() {
        if (SUPABASE_URL && SUPABASE_KEY) {
            this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('✅ [Supabase Agent] Connected to Supabase');
        } else {
            console.warn('⚠️ [Supabase Agent] Missing Supabase credentials');
        }
    }

    async execute(params, context) {
        const { action, ...args } = params;

        if (!this.supabase) {
            return this.error('Supabase client not initialized');
        }

        try {
            switch (action) {
                case 'list_tables':
                    return await this.listTables();
                
                case 'query_table':
                    return await this.queryTable(args);
                
                case 'get_table_stats':
                    return await this.getTableStats(args);
                
                case 'get_snapshots':
                    return await this.getSnapshots(args);
                
                case 'create_snapshot':
                    return await this.createSnapshot(args);
                
                case 'export_data':
                    return await this.exportData(args);
                
                case 'sync_status':
                    return await this.getSyncStatus(args);
                
                case 'execute_query':
                    return await this.executeQuery(args);

                default:
                    return this.error(`Unknown action: ${action}`);
            }
        } catch (error) {
            console.error(`[Supabase Agent] Error in ${action}:`, error);
            return this.error(error.message);
        }
    }

    /**
     * List all known tables with row counts
     */
    async listTables() {
        const results = [];

        for (const tableName of KNOWN_TABLES) {
            try {
                const { count, error } = await this.supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (!error) {
                    // Try to get last update
                    let lastUpdate = null;
                    try {
                        const { data: lastRow } = await this.supabase
                            .from(tableName)
                            .select('updated_at, created_at')
                            .order('updated_at', { ascending: false, nullsFirst: false })
                            .limit(1)
                            .single();
                        lastUpdate = lastRow?.updated_at || lastRow?.created_at;
                    } catch (e) {
                        // Ignore
                    }

                    results.push({
                        name: tableName,
                        rowCount: count || 0,
                        lastUpdate,
                        accessible: true
                    });
                } else {
                    results.push({
                        name: tableName,
                        rowCount: 0,
                        accessible: false,
                        error: error.message
                    });
                }
            } catch (e) {
                results.push({
                    name: tableName,
                    rowCount: 0,
                    accessible: false,
                    error: e.message
                });
            }
        }

        return this.success({
            tables: results,
            totalTables: results.length,
            accessibleTables: results.filter(t => t.accessible).length
        });
    }

    /**
     * Query a specific table
     */
    async queryTable({ table, columns = '*', filters = {}, orderBy = 'created_at', ascending = false, limit = 50, offset = 0 }) {
        if (!table) {
            return this.error('Table name required');
        }

        if (!KNOWN_TABLES.includes(table)) {
            return this.error(`Unknown table: ${table}. Known tables: ${KNOWN_TABLES.join(', ')}`);
        }

        let query = this.supabase
            .from(table)
            .select(columns, { count: 'exact' });

        // Apply filters
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null) {
                if (typeof value === 'string' && value.includes('%')) {
                    query = query.ilike(key, value);
                } else {
                    query = query.eq(key, value);
                }
            }
        }

        // Apply ordering
        query = query.order(orderBy, { ascending });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            return this.error(`Query failed: ${error.message}`);
        }

        return this.success({
            table,
            data,
            rowCount: data.length,
            totalCount: count,
            pagination: {
                offset,
                limit,
                hasMore: offset + limit < count
            }
        });
    }

    /**
     * Get table statistics
     */
    async getTableStats({ table }) {
        if (!table) {
            return this.error('Table name required');
        }

        const { count, error } = await this.supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            return this.error(error.message);
        }

        // Get sample for column info
        const { data: sample } = await this.supabase
            .from(table)
            .select('*')
            .limit(3);

        const columns = sample && sample.length > 0
            ? Object.keys(sample[0]).map(key => ({
                name: key,
                type: typeof sample[0][key],
                sample: sample[0][key]
            }))
            : [];

        return this.success({
            table,
            rowCount: count,
            columns,
            sampleData: sample
        });
    }

    /**
     * Get finance pro snapshots
     */
    async getSnapshots({ ticker, limit = 10, currentOnly = false }) {
        let query = this.supabase
            .from('finance_pro_snapshots')
            .select('id, ticker, version, snapshot_date, is_current, is_watchlist, notes, created_at, updated_at');

        if (ticker) {
            query = query.eq('ticker', ticker.toUpperCase());
        }

        if (currentOnly) {
            query = query.eq('is_current', true);
        }

        query = query
            .order('updated_at', { ascending: false })
            .limit(limit);

        const { data, error } = await query;

        if (error) {
            return this.error(error.message);
        }

        return this.success({
            snapshots: data,
            count: data.length,
            ticker: ticker || 'all'
        });
    }

    /**
     * Create a new snapshot (delegates to finance-snapshots API)
     */
    async createSnapshot({ ticker, data }) {
        if (!ticker || !data) {
            return this.error('Ticker and data required');
        }

        // Use the existing API endpoint
        try {
            const response = await fetch('/api/finance-snapshots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker: ticker.toUpperCase(),
                    ...data
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                return this.success({
                    message: `Snapshot created for ${ticker}`,
                    snapshot: result
                });
            } else {
                return this.error(result.error || 'Failed to create snapshot');
            }
        } catch (e) {
            return this.error(e.message);
        }
    }

    /**
     * Export data from a table
     */
    async exportData({ table, format = 'json', filters = {} }) {
        const queryResult = await this.queryTable({
            table,
            filters,
            limit: 10000 // Max export
        });

        if (!queryResult.success) {
            return queryResult;
        }

        const data = queryResult.data.data;

        if (format === 'csv') {
            const csv = this.convertToCSV(data);
            return this.success({
                format: 'csv',
                data: csv,
                rowCount: data.length
            });
        }

        return this.success({
            format: 'json',
            data,
            rowCount: data.length
        });
    }

    /**
     * Get sync status for tickers
     */
    async getSyncStatus({ tickers }) {
        if (!tickers || !Array.isArray(tickers)) {
            return this.error('Tickers array required');
        }

        const results = [];

        for (const ticker of tickers) {
            const { data, error } = await this.supabase
                .from('finance_pro_snapshots')
                .select('id, version, snapshot_date, is_current, updated_at, sync_metadata')
                .eq('ticker', ticker.toUpperCase())
                .eq('is_current', true)
                .single();

            results.push({
                ticker: ticker.toUpperCase(),
                hasSnapshot: !error && !!data,
                lastUpdate: data?.updated_at || null,
                version: data?.version || 0,
                syncMetadata: data?.sync_metadata || null
            });
        }

        return this.success({
            syncStatus: results,
            upToDate: results.filter(r => {
                if (!r.lastUpdate) return false;
                const diff = Date.now() - new Date(r.lastUpdate).getTime();
                return diff < 24 * 60 * 60 * 1000; // Less than 24 hours
            }).length,
            outdated: results.filter(r => {
                if (!r.lastUpdate) return true;
                const diff = Date.now() - new Date(r.lastUpdate).getTime();
                return diff >= 24 * 60 * 60 * 1000;
            }).length
        });
    }

    /**
     * Execute a raw query (read-only, with safety checks)
     */
    async executeQuery({ query }) {
        if (!query) {
            return this.error('Query string required');
        }

        // Safety: Only allow SELECT queries
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery.startsWith('select')) {
            return this.error('Only SELECT queries are allowed for safety');
        }

        // Block dangerous keywords
        const dangerousKeywords = ['delete', 'drop', 'truncate', 'update', 'insert', 'alter', 'grant'];
        for (const keyword of dangerousKeywords) {
            if (normalizedQuery.includes(keyword)) {
                return this.error(`Query contains forbidden keyword: ${keyword}`);
            }
        }

        // Execute via RPC if available, otherwise return error
        return this.error('Raw query execution not supported. Use query_table action instead.');
    }

    /**
     * Helper: Convert data to CSV
     */
    convertToCSV(data) {
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
}

export default SupabaseAgent;
