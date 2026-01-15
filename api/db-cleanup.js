/**
 * Database Cleanup API
 * Identifies and deletes skeleton/empty snapshots from finance_pro_snapshots
 *
 * Endpoints:
 * - GET    ?action=analyze        - Analyze database for cleanup candidates
 * - DELETE ?action=cleanup        - Delete skeleton snapshots (empty annual_data)
 * - DELETE ?action=duplicates     - Delete duplicate snapshots (keep only current)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
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
        switch (req.method) {
            case 'GET':
                if (action === 'analyze') {
                    return await analyzeDatabase(req, res, supabase);
                }
                return res.status(400).json({ error: 'Action required: analyze' });

            case 'DELETE':
                if (action === 'cleanup') {
                    return await cleanupSkeleton(req, res, supabase);
                }
                if (action === 'duplicates') {
                    return await cleanupDuplicates(req, res, supabase);
                }
                return res.status(400).json({ error: 'Action required: cleanup or duplicates' });

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error(' DB Cleanup API error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}

/**
 * Analyze database for cleanup candidates
 */
async function analyzeDatabase(req, res, supabase) {
    console.log(' Analyzing database for cleanup...');

    // Get all snapshots
    const { data: allSnapshots, error: allError } = await supabase
        .from('finance_pro_snapshots')
        .select('id, ticker, annual_data, is_current, snapshot_date, version');

    if (allError) {
        console.error('Error fetching snapshots:', allError);
        return res.status(500).json({ error: 'Failed to fetch snapshots' });
    }

    // Analyze snapshots
    const analysis = {
        total: allSnapshots.length,
        skeletonEmpty: 0,
        skeletonNoEPS: 0,
        duplicates: 0,
        valid: 0,
        byCategory: {
            empty: [],
            noEPS: [],
            duplicates: []
        }
    };

    const tickerCounts = {};

    for (const snapshot of allSnapshots) {
        const ticker = snapshot.ticker;

        // Count tickers for duplicate detection
        tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;

        // Check for skeleton snapshots
        const annualData = snapshot.annual_data || [];

        if (!Array.isArray(annualData) || annualData.length === 0) {
            analysis.skeletonEmpty++;
            analysis.byCategory.empty.push({ id: snapshot.id, ticker, version: snapshot.version });
            continue;
        }

        // Check if any year has valid EPS data
        const hasValidEPS = annualData.some(row =>
            row.earningsPerShare && row.earningsPerShare !== 0
        );

        if (!hasValidEPS) {
            analysis.skeletonNoEPS++;
            analysis.byCategory.noEPS.push({ id: snapshot.id, ticker, version: snapshot.version });
            continue;
        }

        analysis.valid++;
    }

    // Count duplicates (tickers with more than 1 snapshot)
    for (const [ticker, count] of Object.entries(tickerCounts)) {
        if (count > 1) {
            analysis.duplicates += (count - 1); // Keep 1, count others as duplicates
        }
    }

    console.log(` Analysis complete:
  - Total snapshots: ${analysis.total}
  - Empty annual_data: ${analysis.skeletonEmpty}
  - No valid EPS: ${analysis.skeletonNoEPS}
  - Duplicates: ${analysis.duplicates}
  - Valid: ${analysis.valid}`);

    return res.status(200).json({
        success: true,
        analysis,
        // Limit sample data to prevent huge responses
        samples: {
            empty: analysis.byCategory.empty.slice(0, 20),
            noEPS: analysis.byCategory.noEPS.slice(0, 20)
        }
    });
}

/**
 * Delete skeleton snapshots (empty or no EPS data)
 */
async function cleanupSkeleton(req, res, supabase) {
    const { dry_run = 'true', keep_current = 'true' } = req.query;
    const isDryRun = dry_run === 'true';
    const keepCurrent = keep_current === 'true';

    console.log(` Cleaning skeleton snapshots (dry_run=${isDryRun}, keep_current=${keepCurrent})...`);

    // Get all snapshots
    const { data: allSnapshots, error: fetchError } = await supabase
        .from('finance_pro_snapshots')
        .select('id, ticker, annual_data, is_current, version');

    if (fetchError) {
        return res.status(500).json({ error: 'Failed to fetch snapshots' });
    }

    const toDelete = [];

    for (const snapshot of allSnapshots) {
        // Skip current snapshots if keepCurrent is true
        if (keepCurrent && snapshot.is_current) {
            continue;
        }

        const annualData = snapshot.annual_data || [];

        // Check for empty or invalid data
        if (!Array.isArray(annualData) || annualData.length === 0) {
            toDelete.push(snapshot.id);
            continue;
        }

        // Check if any year has valid EPS data
        const hasValidEPS = annualData.some(row =>
            row.earningsPerShare && row.earningsPerShare !== 0
        );

        if (!hasValidEPS) {
            toDelete.push(snapshot.id);
        }
    }

    console.log(` Found ${toDelete.length} skeleton snapshots to delete`);

    if (isDryRun) {
        return res.status(200).json({
            success: true,
            dry_run: true,
            would_delete: toDelete.length,
            sample_ids: toDelete.slice(0, 50)
        });
    }

    // Actually delete in batches
    const BATCH_SIZE = 100;
    let deleted = 0;
    let errors = [];

    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const batch = toDelete.slice(i, i + BATCH_SIZE);

        const { error: deleteError } = await supabase
            .from('finance_pro_snapshots')
            .delete()
            .in('id', batch);

        if (deleteError) {
            console.error(`Error deleting batch ${i / BATCH_SIZE}:`, deleteError);
            errors.push(deleteError.message);
        } else {
            deleted += batch.length;
        }
    }

    console.log(` Deleted ${deleted} skeleton snapshots`);

    return res.status(200).json({
        success: true,
        deleted,
        errors: errors.length > 0 ? errors : undefined
    });
}

/**
 * Delete duplicate snapshots (keep only is_current=true or latest)
 */
async function cleanupDuplicates(req, res, supabase) {
    const { dry_run = 'true' } = req.query;
    const isDryRun = dry_run === 'true';

    console.log(` Cleaning duplicate snapshots (dry_run=${isDryRun})...`);

    // Get all snapshots grouped by ticker
    const { data: allSnapshots, error: fetchError } = await supabase
        .from('finance_pro_snapshots')
        .select('id, ticker, is_current, snapshot_date, version')
        .order('ticker', { ascending: true })
        .order('is_current', { ascending: false }) // Current first
        .order('snapshot_date', { ascending: false }); // Latest first

    if (fetchError) {
        return res.status(500).json({ error: 'Failed to fetch snapshots' });
    }

    // Group by ticker and mark duplicates
    const tickerSnapshots = {};
    for (const snapshot of allSnapshots) {
        const ticker = snapshot.ticker;
        if (!tickerSnapshots[ticker]) {
            tickerSnapshots[ticker] = [];
        }
        tickerSnapshots[ticker].push(snapshot);
    }

    const toDelete = [];

    for (const [ticker, snapshots] of Object.entries(tickerSnapshots)) {
        if (snapshots.length <= 1) continue;

        // Keep the first one (is_current=true or latest), delete others
        for (let i = 1; i < snapshots.length; i++) {
            toDelete.push(snapshots[i].id);
        }
    }

    console.log(` Found ${toDelete.length} duplicate snapshots to delete`);

    if (isDryRun) {
        return res.status(200).json({
            success: true,
            dry_run: true,
            would_delete: toDelete.length,
            sample_ids: toDelete.slice(0, 50)
        });
    }

    // Actually delete in batches
    const BATCH_SIZE = 100;
    let deleted = 0;
    let errors = [];

    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const batch = toDelete.slice(i, i + BATCH_SIZE);

        const { error: deleteError } = await supabase
            .from('finance_pro_snapshots')
            .delete()
            .in('id', batch);

        if (deleteError) {
            console.error(`Error deleting batch ${i / BATCH_SIZE}:`, deleteError);
            errors.push(deleteError.message);
        } else {
            deleted += batch.length;
        }
    }

    console.log(` Deleted ${deleted} duplicate snapshots`);

    return res.status(200).json({
        success: true,
        deleted,
        errors: errors.length > 0 ? errors : undefined
    });
}
