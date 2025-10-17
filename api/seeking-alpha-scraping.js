/**
 * Seeking Alpha Scraping Data API - Handle raw data and analysis
 *
 * POST /api/seeking-alpha-scraping?type=raw
 *   body: {ticker, url, raw_text, raw_html, scrape_duration_ms, status}
 *
 * POST /api/seeking-alpha-scraping?type=analysis
 *   body: {ticker, raw_data_id, company_name, sector, current_price, ...}
 *
 * GET /api/seeking-alpha-scraping?type=raw&ticker=AAPL&limit=10
 * GET /api/seeking-alpha-scraping?type=analysis&ticker=AAPL&latest=true
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type = 'analysis' } = req.query; // 'raw' or 'analysis'

  try {
    // ============================================================================
    // GET - Fetch scraped data or analysis
    // ============================================================================
    if (req.method === 'GET') {
      const { ticker, limit = 50, latest = 'false' } = req.query;

      if (type === 'raw') {
        // Fetch raw scraped data
        let query = supabase
          .from('seeking_alpha_raw_data')
          .select('*')
          .order('scraped_at', { ascending: false });

        if (ticker) {
          query = query.eq('ticker', ticker.toUpperCase());
        }

        query = query.limit(parseInt(limit));

        const { data, error } = await query;

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        return res.status(200).json({
          success: true,
          type: 'raw',
          data,
          count: data.length,
          timestamp: new Date().toISOString()
        });
      }

      if (type === 'analysis') {
        // Fetch analysis data
        if (latest === 'true') {
          // Use the view for latest analysis per ticker
          let query = supabase
            .from('latest_seeking_alpha_analysis')
            .select('*');

          if (ticker) {
            query = query.eq('ticker', ticker.toUpperCase());
          }

          query = query.limit(parseInt(limit));

          const { data, error } = await query;

          if (error) {
            throw new Error(`Supabase error: ${error.message}`);
          }

          return res.status(200).json({
            success: true,
            type: 'analysis',
            filter: 'latest',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
          });
        } else {
          // Fetch all analysis with optional ticker filter
          let query = supabase
            .from('seeking_alpha_analysis')
            .select('*')
            .order('analyzed_at', { ascending: false });

          if (ticker) {
            query = query.eq('ticker', ticker.toUpperCase());
          }

          query = query.limit(parseInt(limit));

          const { data, error } = await query;

          if (error) {
            throw new Error(`Supabase error: ${error.message}`);
          }

          return res.status(200).json({
            success: true,
            type: 'analysis',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
          });
        }
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid type parameter',
        allowed: ['raw', 'analysis']
      });
    }

    // ============================================================================
    // POST - Save scraped data or analysis
    // ============================================================================
    if (req.method === 'POST') {
      if (type === 'raw') {
        // Save raw scraped data
        const {
          ticker,
          url,
          raw_text,
          raw_html,
          scrape_method = 'manual',
          scrape_duration_ms,
          user_agent,
          status = 'success',
          error_message,
          metadata
        } = req.body;

        if (!ticker || !url || !raw_text) {
          return res.status(400).json({
            success: false,
            error: 'ticker, url, and raw_text are required'
          });
        }

        const { data, error } = await supabase
          .from('seeking_alpha_raw_data')
          .insert({
            ticker: ticker.toUpperCase(),
            url,
            raw_html,
            raw_text,
            scrape_method,
            scrape_duration_ms,
            user_agent,
            status,
            error_message,
            metadata
          })
          .select();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        // Update last_scraped timestamp in tickers table
        await supabase
          .from('tickers')
          .update({ last_scraped: new Date().toISOString() })
          .eq('ticker', ticker.toUpperCase());

        return res.status(201).json({
          success: true,
          type: 'raw',
          message: 'Raw data saved',
          data: data[0],
          timestamp: new Date().toISOString()
        });
      }

      if (type === 'analysis') {
        // Save Claude analysis
        const analysisData = req.body;

        if (!analysisData.ticker) {
          return res.status(400).json({
            success: false,
            error: 'ticker is required'
          });
        }

        // Ensure ticker is uppercase
        analysisData.ticker = analysisData.ticker.toUpperCase();

        // Set data_as_of_date if not provided
        if (!analysisData.data_as_of_date) {
          analysisData.data_as_of_date = new Date().toISOString().split('T')[0];
        }

        const { data, error } = await supabase
          .from('seeking_alpha_analysis')
          .upsert(analysisData, {
            onConflict: 'ticker,data_as_of_date'
          })
          .select();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        return res.status(201).json({
          success: true,
          type: 'analysis',
          message: 'Analysis saved',
          data: data[0],
          timestamp: new Date().toISOString()
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid type parameter',
        allowed: ['raw', 'analysis']
      });
    }

    // Invalid method
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed: ['GET', 'POST']
    });

  } catch (error) {
    console.error('❌ Seeking Alpha Scraping API Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
