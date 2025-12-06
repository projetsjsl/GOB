/**
 * Seeking Alpha Tickers API - CRUD operations for unified tickers table
 * Uses source='team' or 'both' to identify team tickers
 *
 * GET     /api/seeking-alpha-tickers?limit=50
 * POST    /api/seeking-alpha-tickers (body: {ticker, priority})
 * PUT     /api/seeking-alpha-tickers (body: {ticker, active})
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
    // GET - Fetch tickers from unified tickers table (source='team' or 'both')
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

      // Fetch all tickers from unified tickers table with source='team' or 'both'
      let query = supabase
        .from('tickers')
        .select('*')
        .eq('is_active', true) // Only active tickers
        .or('category.eq.team,category.eq.both') // Team tickers only
        .order('priority', { ascending: false })
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
    // POST - Add new ticker(s) to unified tickers table with source='team'
    // ============================================================================
    if (req.method === 'POST') {
      const { ticker, tickers: tickerList, active = true } = req.body;

      // Support both single ticker and batch insert
      const tickersToInsert = tickerList
        ? tickerList.map(t => ({ 
            ticker: t, 
            is_active: active,
            source: 'team',
            priority: 1
          }))
        : [{ 
            ticker, 
            is_active: active,
            source: 'team',
            priority: 1
          }];

      const { data, error } = await supabase
        .from('tickers')
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
        message: `Added ${data.length} ticker(s) to tickers table (source=team)`,
        tickers: data,
        timestamp: new Date().toISOString()
      });
    }

    // ============================================================================
    // PUT - Update ticker active status in unified tickers table
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
        .from('tickers')
        .update({ is_active: active })
        .eq('ticker', ticker)
        .or('category.eq.team,category.eq.both') // Only update team tickers
        .select();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Ticker not found in tickers table (team source)'
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
    // DELETE - Remove ticker from unified tickers table (only if source='team')
    // ============================================================================
    if (req.method === 'DELETE') {
      const { ticker } = req.query;

      if (!ticker) {
        return res.status(400).json({
          success: false,
          error: 'Ticker parameter required'
        });
      }

      // First check if ticker exists and is a team ticker
      const { data: existingTicker, error: checkError } = await supabase
        .from('tickers')
        .select('source')
        .eq('ticker', ticker)
        .or('category.eq.team,category.eq.both')
        .single();

      if (checkError || !existingTicker) {
        return res.status(404).json({
          success: false,
          error: 'Ticker not found or not a team ticker'
        });
      }

      // If source is 'both', update to 'watchlist' instead of deleting
      if (existingTicker.category === 'both') {
        const { error: updateError } = await supabase
          .from('tickers')
          .update({ category: 'watchlist', categories: ['watchlist'] })
          .eq('ticker', ticker);

        if (updateError) {
          throw new Error(`Supabase error: ${updateError.message}`);
        }

        return res.status(200).json({
          success: true,
          message: `Ticker ${ticker} removed from team (now watchlist only)`,
          timestamp: new Date().toISOString()
        });
      }

      // If source is 'team', delete it
      const { error } = await supabase
        .from('tickers')
        .delete()
        .eq('ticker', ticker)
        .eq('source', 'team');

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return res.status(200).json({
        success: true,
        message: `Ticker ${ticker} deleted from tickers table`,
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
