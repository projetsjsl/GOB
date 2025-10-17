/**
 * Seeking Alpha Tickers API - CRUD operations for tickers table
 *
 * GET     /api/seeking-alpha-tickers?active=true&source=team&limit=50
 * POST    /api/seeking-alpha-tickers (body: {ticker, company_name, sector, source})
 * PUT     /api/seeking-alpha-tickers (body: {ticker, updates})
 * DELETE  /api/seeking-alpha-tickers?ticker=AAPL
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
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
    // GET - Fetch tickers with optional filters
    // ============================================================================
    if (req.method === 'GET') {
      const {
        active,
        source,
        limit = 100,
        scraping_enabled,
        needs_scraping,
        max_age_hours = 24
      } = req.query;

      let query = supabase
        .from('tickers')
        .select('*')
        .order('ticker', { ascending: true });

      // Filter by active status
      if (active !== undefined) {
        query = query.eq('is_active', active === 'true');
      }

      // Filter by source (team, watchlist, manual, all)
      if (source) {
        query = query.eq('source', source);
      }

      // Filter by scraping enabled
      if (scraping_enabled !== undefined) {
        query = query.eq('scraping_enabled', scraping_enabled === 'true');
      }

      // Apply limit
      query = query.limit(parseInt(limit));

      const { data: tickers, error } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // If needs_scraping=true, use the smart function to get stale tickers
      if (needs_scraping === 'true') {
        const { data: staleTickers, error: funcError } = await supabase
          .rpc('get_tickers_to_scrape', {
            max_age_hours: parseInt(max_age_hours),
            limit_count: parseInt(limit)
          });

        if (funcError) {
          console.error('Error calling get_tickers_to_scrape:', funcError);
          // Fall through to return all tickers if function fails
        } else {
          return res.status(200).json({
            success: true,
            tickers: staleTickers,
            count: staleTickers.length,
            filter: 'needs_scraping',
            timestamp: new Date().toISOString()
          });
        }
      }

      return res.status(200).json({
        success: true,
        tickers,
        count: tickers.length,
        timestamp: new Date().toISOString()
      });
    }

    // ============================================================================
    // POST - Add new ticker(s)
    // ============================================================================
    if (req.method === 'POST') {
      const { ticker, tickers: tickerList, company_name, sector, source = 'manual' } = req.body;

      // Support both single ticker and batch insert
      const tickersToInsert = tickerList ? tickerList : [{ ticker, company_name, sector, source }];

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
        message: `Added ${data.length} ticker(s)`,
        tickers: data,
        timestamp: new Date().toISOString()
      });
    }

    // ============================================================================
    // PUT - Update ticker
    // ============================================================================
    if (req.method === 'PUT') {
      const { ticker, updates } = req.body;

      if (!ticker) {
        return res.status(400).json({
          success: false,
          error: 'Ticker parameter required'
        });
      }

      const { data, error } = await supabase
        .from('tickers')
        .update(updates)
        .eq('ticker', ticker)
        .select();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Ticker not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Ticker updated',
        ticker: data[0],
        timestamp: new Date().toISOString()
      });
    }

    // ============================================================================
    // DELETE - Remove ticker
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
        .from('tickers')
        .delete()
        .eq('ticker', ticker);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return res.status(200).json({
        success: true,
        message: `Ticker ${ticker} deleted`,
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
