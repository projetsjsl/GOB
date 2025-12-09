/**
 * Remove Ticker API - Safely remove a ticker from all data sources
 *
 * POST /api/remove-ticker
 * Body: { ticker: "AAPL", confirm: true }
 *
 * Removes ticker from:
 * - stock_data.json (data['stocks'][ticker])
 * - stock_analysis.json (data['stocks'] array)
 * - Supabase watchlist (if applicable)
 * - Supabase seeking_alpha_data & seeking_alpha_analysis
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { ticker, confirm } = req.body;

        if (!ticker) {
            return res.status(400).json({
                success: false,
                error: 'Ticker is required'
            });
        }

        if (!confirm) {
            return res.status(400).json({
                success: false,
                error: 'Confirmation required. Set confirm: true to proceed'
            });
        }

        const tickerUpper = ticker.toUpperCase();
        const results = {
            ticker: tickerUpper,
            removed_from: [],
            errors: []
        };

        // 1. Remove from stock_data.json
        try {
            const stockDataPath = path.join(process.cwd(), 'public', 'stock_data.json');
            const stockData = JSON.parse(fs.readFileSync(stockDataPath, 'utf8'));

            if (stockData.stocks && stockData.stocks[tickerUpper]) {
                delete stockData.stocks[tickerUpper];
                fs.writeFileSync(stockDataPath, JSON.stringify(stockData, null, 2));
                results.removed_from.push('stock_data.json');
            }
        } catch (error) {
            results.errors.push(`stock_data.json: ${error.message}`);
        }

        // 2. Remove from stock_analysis.json
        try {
            const stockAnalysisPath = path.join(process.cwd(), 'public', 'stock_analysis.json');
            const stockAnalysis = JSON.parse(fs.readFileSync(stockAnalysisPath, 'utf8'));

            if (stockAnalysis.stocks && Array.isArray(stockAnalysis.stocks)) {
                const originalLength = stockAnalysis.stocks.length;
                stockAnalysis.stocks = stockAnalysis.stocks.filter(
                    item => item.ticker !== tickerUpper
                );

                if (stockAnalysis.stocks.length < originalLength) {
                    fs.writeFileSync(stockAnalysisPath, JSON.stringify(stockAnalysis, null, 2));
                    results.removed_from.push('stock_analysis.json');
                }
            }
        } catch (error) {
            results.errors.push(`stock_analysis.json: ${error.message}`);
        }

        // 3. Remove from Supabase watchlist (if exists)
        try {
            const { data, error } = await supabase
                .from('watchlist')
                .delete()
                .eq('ticker', tickerUpper);

            if (!error) {
                results.removed_from.push('supabase_watchlist');
            } else if (error.code !== 'PGRST116') { // PGRST116 = no rows found
                results.errors.push(`supabase_watchlist: ${error.message}`);
            }
        } catch (error) {
            results.errors.push(`supabase_watchlist: ${error.message}`);
        }

        // 4. Remove from Supabase seeking_alpha_data
        try {
            const { data, error } = await supabase
                .from('seeking_alpha_data')
                .delete()
                .eq('ticker', tickerUpper);

            if (!error) {
                results.removed_from.push('supabase_seeking_alpha_data');
            } else if (error.code !== 'PGRST116') {
                results.errors.push(`supabase_seeking_alpha_data: ${error.message}`);
            }
        } catch (error) {
            results.errors.push(`supabase_seeking_alpha_data: ${error.message}`);
        }

        // 5. Remove from Supabase seeking_alpha_analysis
        try {
            const { data, error } = await supabase
                .from('seeking_alpha_analysis')
                .delete()
                .eq('ticker', tickerUpper);

            if (!error) {
                results.removed_from.push('supabase_seeking_alpha_analysis');
            } else if (error.code !== 'PGRST116') {
                results.errors.push(`supabase_seeking_alpha_analysis: ${error.message}`);
            }
        } catch (error) {
            results.errors.push(`supabase_seeking_alpha_analysis: ${error.message}`);
        }

        // 6. Remove from Supabase finance_snapshots (used by 3p1 app)
        try {
            const { data, error } = await supabase
                .from('finance_snapshots')
                .delete()
                .eq('ticker', tickerUpper);

            if (!error) {
                results.removed_from.push('supabase_finance_snapshots');
            } else if (error.code !== 'PGRST116') {
                results.errors.push(`supabase_finance_snapshots: ${error.message}`);
            }
        } catch (error) {
            results.errors.push(`supabase_finance_snapshots: ${error.message}`);
        }

        // 7. ✅ FIX: Mark ticker as inactive in tickers table (instead of deleting)
        // This prevents the ticker from being recreated during sync
        try {
            const { data, error } = await supabase
                .from('tickers')
                .update({ is_active: false })
                .eq('ticker', tickerUpper);

            if (!error) {
                results.removed_from.push('supabase_tickers (marked inactive)');
            } else if (error.code !== 'PGRST116') {
                results.errors.push(`supabase_tickers: ${error.message}`);
            }
        } catch (error) {
            results.errors.push(`supabase_tickers: ${error.message}`);
        }


        // Prepare response
        const success = results.removed_from.length > 0;
        const hasErrors = results.errors.length > 0;

        return res.status(success ? 200 : 404).json({
            success,
            message: success
                ? `Successfully removed ${tickerUpper} from ${results.removed_from.length} source(s)`
                : `Ticker ${tickerUpper} not found in any data source`,
            ticker: tickerUpper,
            removed_from: results.removed_from,
            errors: hasErrors ? results.errors : undefined,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Remove Ticker API Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
