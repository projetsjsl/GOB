/**
 * Seeking Alpha Batch Processing API
 *
 * Processes raw scraped data through Claude AI and saves analysis
 *
 * POST /api/seeking-alpha-batch
 * body: {
 *   tickers: ['AAPL', 'MSFT', ...],  // Array of tickers to process
 *   force_refresh: false              // Re-analyze even if analysis exists today
 * }
 *
 * GET /api/seeking-alpha-batch/status?batch_id=xxx
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// In-memory batch status tracking (in production, use Redis or DB)
const batchStatus = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ============================================================================
    // GET - Check batch processing status
    // ============================================================================
    if (req.method === 'GET') {
      const { batch_id } = req.query;

      if (!batch_id) {
        return res.status(400).json({
          success: false,
          error: 'batch_id required'
        });
      }

      const status = batchStatus.get(batch_id);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Batch not found'
        });
      }

      return res.status(200).json({
        success: true,
        batch_id,
        status,
        timestamp: new Date().toISOString()
      });
    }

    // ============================================================================
    // POST - Start batch processing
    // ============================================================================
    if (req.method === 'POST') {
      const { tickers = [], force_refresh = false } = req.body;

      if (!Array.isArray(tickers) || tickers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'tickers array required'
        });
      }

      const batch_id = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initialize batch status
      batchStatus.set(batch_id, {
        status: 'processing',
        total: tickers.length,
        completed: 0,
        failed: 0,
        results: [],
        started_at: new Date().toISOString()
      });

      // Process in background (don't await)
      processBatch(batch_id, tickers, force_refresh).catch(error => {
        console.error(`Batch ${batch_id} failed:`, error);
        const status = batchStatus.get(batch_id);
        if (status) {
          status.status = 'failed';
          status.error = error.message;
          status.completed_at = new Date().toISOString();
        }
      });

      return res.status(202).json({
        success: true,
        batch_id,
        message: 'Batch processing started',
        tickers_count: tickers.length,
        status_url: `/api/seeking-alpha-batch/status?batch_id=${batch_id}`,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Batch Processing API Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// ============================================================================
// Background Batch Processing Function
// ============================================================================
async function processBatch(batch_id, tickers, force_refresh) {
  const status = batchStatus.get(batch_id);
  const today = new Date().toISOString().split('T')[0];

  for (const ticker of tickers) {
    try {
      const tickerUpper = ticker.toUpperCase();

      // Check if already analyzed today (unless force_refresh)
      if (!force_refresh) {
        const { data: existing } = await supabase
          .from('seeking_alpha_analysis')
          .select('id')
          .eq('ticker', tickerUpper)
          .eq('data_as_of_date', today)
          .single();

        if (existing) {
          console.log(`⏭️  Skipping ${tickerUpper} - already analyzed today`);
          status.completed++;
          status.results.push({
            ticker: tickerUpper,
            status: 'skipped',
            reason: 'already_analyzed_today'
          });
          continue;
        }
      }

      // Fetch latest raw data for this ticker from EXISTING table: seeking_alpha_data
      const { data: rawData, error: rawError } = await supabase
        .from('seeking_alpha_data')
        .select('*')
        .eq('ticker', tickerUpper)
        .order('scraped_at', { ascending: false })
        .limit(1)
        .single();

      if (rawError || !rawData) {
        console.error(`❌ No raw data found for ${tickerUpper}`);
        status.failed++;
        status.results.push({
          ticker: tickerUpper,
          status: 'failed',
          error: 'No raw data available'
        });
        continue;
      }

      // Analyze with Claude
      console.log(`🤖 Analyzing ${tickerUpper} with Claude...`);
      const analysisStart = Date.now();

      const analysis = await analyzeWithClaude(tickerUpper, rawData.raw_text);

      const processingTime = Date.now() - analysisStart;

      // Save analysis to database
      const { error: insertError } = await supabase
        .from('seeking_alpha_analysis')
        .upsert({
          ticker: tickerUpper,
          raw_data_id: rawData.id,
          data_as_of_date: today,
          analysis_model: 'claude-3-5-sonnet-20241022',
          processing_time_ms: processingTime,
          analyzed_at: new Date().toISOString(),
          ...analysis
        }, {
          onConflict: 'ticker,data_as_of_date'
        });

      if (insertError) {
        throw new Error(`Failed to save analysis: ${insertError.message}`);
      }

      console.log(`✅ ${tickerUpper} analyzed successfully (${processingTime}ms)`);
      status.completed++;
      status.results.push({
        ticker: tickerUpper,
        status: 'success',
        processing_time_ms: processingTime
      });

    } catch (error) {
      console.error(`❌ Failed to process ${ticker}:`, error.message);
      status.failed++;
      status.results.push({
        ticker: ticker.toUpperCase(),
        status: 'failed',
        error: error.message
      });
    }
  }

  // Mark batch as complete
  status.status = 'completed';
  status.completed_at = new Date().toISOString();
  console.log(`🎉 Batch ${batch_id} completed: ${status.completed} success, ${status.failed} failed`);
}

// ============================================================================
// Claude AI Analysis Function
// ============================================================================
async function analyzeWithClaude(ticker, rawText) {
  const prompt = `Analyze this Seeking Alpha page data for ${ticker} and extract structured information.

Raw text from Seeking Alpha:
${rawText}

Extract the following information and return as JSON:
{
  "company_name": "Company Name",
  "sector": "Technology",
  "industry": "Software",
  "current_price": 150.25,
  "price_change": 2.50,
  "price_change_percent": 1.69,
  "market_cap": "2.5T",
  "market_cap_numeric": 2500000000000,
  "pe_ratio": 25.5,
  "forward_pe": 22.3,
  "dividend_yield": 1.5,
  "annual_dividend": 2.25,
  "revenue_growth_yoy": 0.15,
  "earnings_growth_yoy": 0.20,
  "gross_margin": 0.42,
  "operating_margin": 0.30,
  "net_margin": 0.25,
  "roe": 0.45,
  "debt_to_equity": 1.2,
  "current_ratio": 1.5,
  "quant_overall": "A+",
  "quant_valuation": "B+",
  "quant_growth": "A",
  "quant_profitability": "A+",
  "quant_momentum": "B",
  "strengths": ["Strong revenue growth", "High profit margins", "Solid balance sheet"],
  "concerns": ["High valuation", "Competitive pressure"],
  "analyst_rating": "Buy",
  "analyst_recommendation": "Detailed recommendation text",
  "risk_level": "Medium",
  "company_description": "Brief company description"
}

Return ONLY valid JSON, no markdown formatting.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const responseText = message.content[0].text;

  // Parse JSON response
  try {
    const analysis = JSON.parse(responseText);
    return analysis;
  } catch (parseError) {
    // Try to extract JSON from markdown code block
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error('Failed to parse Claude response as JSON');
  }
}
