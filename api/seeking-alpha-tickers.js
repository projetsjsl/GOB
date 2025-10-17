/**
 * Seeking Alpha Tickers API - CRUD operations for team_tickers table (existing)
 *
 * GET     /api/seeking-alpha-tickers?limit=50
 * POST    /api/seeking-alpha-tickers (body: {ticker, priority})
 * PUT     /api/seeking-alpha-tickers (body: {ticker, priority})
 * DELETE  /api/seeking-alpha-tickers?ticker=AAPL
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ============================================================================
    // GET - Fetch tickers from EXISTING table: team_tickers
    // ============================================================================
    if (req.method === 'GET') {
      const {
        limit = 100,
        needs_analysis,
        max_age_hours = 24
      } = req.query;

      // If needs_analysis=true, use the function to get tickers needing analysis
      if (needs_analysis === 'true') {
        const { data: staleTickers, error: funcError } = await supabase
          .rpc('get_tickers_needing_analysis', {
            max_age_hours: parseInt(max_age_hours),
            limit_count: parseInt(limit)
          });

        if (funcError) {
          console.error('Error calling get_tickers_needing_analysis:', funcError);
          // Fall through to return all tickers if function fails
        } else {
          return res.status(200).json({
            success: true,
            tickers: staleTickers,
            count: staleTickers.length,
            filter: 'needs_analysis',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Fetch all tickers from team_tickers (your existing table)
      let query = supabase
        .from('team_tickers')
        .select('*')
        .eq('active', true) // Only active tickers
        .order('ticker', { ascending: true });

      query = query.limit(parseInt(limit));

      const { data: tickers, error } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return res.status(200).json({
        success: true,
        tickers,
        count: tickers.length,
        timestamp: new Date().toISOString()
      });
    }

    // ============================================================================
    // POST - Add new ticker(s) to team_tickers
    // ============================================================================
    if (req.method === 'POST') {
      const { ticker, tickers: tickerList, active = true } = req.body;

      // Support both single ticker and batch insert
      const tickersToInsert = tickerList
        ? tickerList.map(t => ({ ticker: t, active: active }))
        : [{ ticker, active: active }];

      const { data, error } = await supabase
        .from('team_tickers')
        .insert(tickersToInsert)
        .select();

      if (error) {
        // Handle unique constraint violations gracefully
        if (error.code === '23505') {
          return res.status(409).json({
            success: false,
            error: 'Ticker already exists',
            message: error.message
          });
        }
        throw new Error(`Supabase error: ${error.message}`);
      }

      return res.status(201).json({
        success: true,
        message: `Added ${data.length} ticker(s) to team_tickers`,
        tickers: data,
        timestamp: new Date().toISOString()
      });
    }

    // ============================================================================
    // PUT - Update ticker active status in team_tickers
    // ============================================================================
    if (req.method === 'PUT') {
      const { ticker, active } = req.body;

      if (!ticker) {
        return res.status(400).json({
          success: false,
          error: 'Ticker parameter required'
        });
      }

      const { data, error } = await supabase
        .from('team_tickers')
        .update({ active })
        .eq('ticker', ticker)
        .select();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Ticker not found in team_tickers'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Ticker active status updated',
        ticker: data[0],
        timestamp: new Date().toISOString()
      });
    }

    // ============================================================================
    // DELETE - Remove ticker from team_tickers
    // ============================================================================
    if (req.method === 'DELETE') {
      const { ticker } = req.query;

      if (!ticker) {
        return res.status(400).json({
          success: false,
          error: 'Ticker parameter required'
        });
      }

      const { error } = await supabase
        .from('team_tickers')
        .delete()
        .eq('ticker', ticker);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return res.status(200).json({
        success: true,
        message: `Ticker ${ticker} deleted from team_tickers`,
        timestamp: new Date().toISOString()
      });
    }

    // Invalid method
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed: ['GET', 'POST', 'PUT', 'DELETE']
    });

  } catch (error) {
    console.error('❌ Seeking Alpha Tickers API Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
