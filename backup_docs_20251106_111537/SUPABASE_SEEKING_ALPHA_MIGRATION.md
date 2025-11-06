# Supabase Migration for Seeking Alpha Data

**Status**: ✅ Backend & Frontend Complete | ⏳ Deployment Pending

## Overview

The Seeking Alpha scraping system has been migrated from GitHub JSON files (`tickers.json`, `stock_analysis.json`, `stock_data.json`) to a Supabase PostgreSQL database. This provides better scalability, historical tracking, and eliminates the 500KB+ file size issues.

---

## What Was Completed

### 1. Database Schema (`supabase-seeking-alpha-refactor.sql`)

Created 3 main tables:

#### **Table 1: `tickers`** (Master Ticker List)
- Replaces: `/public/tickers.json`
- 25 tickers seeded (team tickers)
- Fields: ticker, company_name, sector, source, is_active, last_scraped, scraping_enabled
- Indexes on: ticker, is_active, source, last_scraped

#### **Table 2: `seeking_alpha_raw_data`** (Historical Scraping Archive)
- Replaces: `/public/stock_analysis.json`
- Stores raw HTML/text scraped from Seeking Alpha
- Fields: ticker, url, raw_html, raw_text, scrape_method, scrape_duration_ms, scraped_at, status, error_message
- Auto-cleanup: Delete raw data older than 90 days
- Indexes on: ticker, scraped_at, status

#### **Table 3: `seeking_alpha_analysis`** (Claude AI Processed Data)
- Replaces: `/public/stock_data.json`
- 50+ fields for comprehensive stock analysis
- Key fields:
  - **Company Info**: company_name, sector, industry
  - **Pricing**: current_price, market_cap, pe_ratio, forward_pe
  - **Dividends**: dividend_yield, annual_dividend, ex_dividend_date
  - **Growth**: revenue_growth_yoy, earnings_growth_yoy
  - **Profitability**: gross_margin, operating_margin, net_margin, roe
  - **Financial Health**: current_ratio, debt_to_equity
  - **Quant Ratings**: quant_overall, quant_valuation, quant_growth, quant_profitability, quant_momentum
  - **AI Analysis**: strengths[], concerns[], analyst_rating, analyst_recommendation
- Unique constraint: One analysis per ticker per day

#### **View: `latest_seeking_alpha_analysis`**
- Shows most recent analysis per ticker
- Used by frontend for efficient querying

#### **Helper Functions**
1. `get_tickers_to_scrape(max_age_hours, limit_count)` - Smart scraping queue
2. `cleanup_old_seeking_alpha_data()` - Auto-delete old raw data
3. `update_updated_at_column()` - Auto-update timestamps on row changes

#### **RLS Policies**
- Public READ access for all tables
- Authenticated users can INSERT/UPDATE

---

### 2. API Endpoints Created

#### **`/api/seeking-alpha-tickers.js`** (Ticker Management)
- **GET** `/api/seeking-alpha-tickers?active=true&source=team&limit=50`
  - Fetch tickers with filters
  - `needs_scraping=true` - Get stale tickers needing refresh
- **POST** `/api/seeking-alpha-tickers` - Add new ticker(s)
- **PUT** `/api/seeking-alpha-tickers` - Update ticker
- **DELETE** `/api/seeking-alpha-tickers?ticker=AAPL` - Remove ticker
- **Timeout**: 15s

#### **`/api/seeking-alpha-scraping.js`** (Data Storage & Retrieval)
- **POST** `/api/seeking-alpha-scraping?type=raw` - Save raw scraped data
  - Body: `{ticker, url, raw_text, raw_html, scrape_duration_ms, status}`
  - Auto-updates `last_scraped` timestamp in tickers table
- **POST** `/api/seeking-alpha-scraping?type=analysis` - Save Claude analysis
  - Body: Full analysis object (50+ fields)
  - Upserts on `(ticker, data_as_of_date)` conflict
- **GET** `/api/seeking-alpha-scraping?type=raw&ticker=AAPL&limit=10` - Fetch raw data
- **GET** `/api/seeking-alpha-scraping?type=analysis&latest=true` - Fetch latest analyses
- **Timeout**: 30s

#### **`/api/seeking-alpha-batch.js`** (Batch Processing)
- **POST** `/api/seeking-alpha-batch` - Start batch Claude analysis
  - Body: `{tickers: ['AAPL', 'MSFT'], force_refresh: false}`
  - Returns `batch_id` for status tracking
  - Processes tickers in background
  - Skips tickers already analyzed today (unless `force_refresh=true`)
- **GET** `/api/seeking-alpha-batch/status?batch_id=xxx` - Check batch progress
- **Timeout**: 300s (5 minutes)

#### **`/api/config/tickers.js`** (Updated)
- Now fetches team tickers from new `tickers` table (source=team)
- Query: `SELECT ticker FROM tickers WHERE source='team' AND is_active=true`
- Backward compatible with old fallback

---

### 3. Frontend Updates (`beta-combined-dashboard.html`)

#### **Data Loading Functions Updated**

**`fetchSeekingAlphaData()`** (Raw Scraped Data)
- **Before**: `fetch('/stock_analysis.json')`
- **After**: `fetch('/api/seeking-alpha-scraping?type=raw&limit=100')`
- Converts Supabase format to old format for backward compatibility
- Fallback to JSON file if Supabase unavailable
- Console logs data source: `supabase`, `json_fallback`, or `error`

**`fetchSeekingAlphaStockData()`** (Claude Analyses)
- **Before**: `fetch('/stock_data.json')`
- **After**: `fetch('/api/seeking-alpha-scraping?type=analysis&latest=true&limit=100')`
- Converts Supabase format to old format for backward compatibility
- Fallback to JSON file if Supabase unavailable

**Data Format Conversion**
```javascript
// Supabase format → Old format
{
  ticker: item.ticker,
  companyName: item.company_name,
  metrics: {
    marketCap: item.market_cap,
    peRatio: item.pe_ratio,
    ...
  },
  quantRating: {
    valuation: item.quant_valuation,
    growth: item.quant_growth,
    ...
  }
}
```

---

### 4. Configuration Updates

**`vercel.json` - Timeout Settings**
```json
{
  "api/seeking-alpha-tickers.js": { "maxDuration": 15 },
  "api/seeking-alpha-scraping.js": { "maxDuration": 30 },
  "api/seeking-alpha-batch.js": { "maxDuration": 300 }
}
```

---

## What Still Needs To Be Done

### ⏳ **Step 1: Deploy Supabase Schema** (REQUIRED)
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql
2. Copy contents of `supabase-seeking-alpha-refactor.sql`
3. Paste into SQL Editor and run
4. Verify tables created:
   ```sql
   SELECT * FROM tickers WHERE source='team'; -- Should return 25 rows
   SELECT * FROM seeking_alpha_raw_data LIMIT 1; -- Should return 0 rows (empty)
   SELECT * FROM seeking_alpha_analysis LIMIT 1; -- Should return 0 rows (empty)
   ```

### ⏳ **Step 2: Migrate Existing Data** (OPTIONAL)
If you have existing data in `stock_analysis.json` and `stock_data.json`, run migration:
1. Create migration script (see below)
2. Run: `node migrate-seeking-alpha-to-supabase.js`
3. This will populate the Supabase tables with existing data

### ⏳ **Step 3: Update Scraper Saving Logic** (REQUIRED)
**Currently**: Scraper still saves to GitHub JSON files via `/api/github-update.js`

**Needs Update**: Make scraper save to Supabase instead

**File**: `beta-combined-dashboard.html`
**Function**: `analyzeWithClaudeAndUpdate(ticker, scrapedData)` (around line 2019)

**Change From**:
```javascript
await fetch('/api/github-update', {
  method: 'POST',
  body: JSON.stringify({
    file: 'stock_analysis.json',
    data: scrapedData
  })
});
```

**Change To**:
```javascript
// 1. Save raw data
await fetch('/api/seeking-alpha-scraping?type=raw', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ticker: ticker.toUpperCase(),
    url: `https://seekingalpha.com/symbol/${ticker}/virtual_analyst_report`,
    raw_text: scrapedData.raw_text,
    raw_html: scrapedData.raw_html,
    scrape_duration_ms: scrapedData.duration,
    status: 'success'
  })
});

// 2. Analyze with Claude (batch or direct)
// Option A: Immediate analysis
const analysis = await analyzeWithClaude(ticker, scrapedData.raw_text);
await fetch('/api/seeking-alpha-scraping?type=analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(analysis)
});

// Option B: Batch analysis (recommended)
await fetch('/api/seeking-alpha-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tickers: [ticker],
    force_refresh: false
  })
});
```

### ⏳ **Step 4: Test End-to-End**
1. Open dashboard
2. Click "🚀 Lancer le Scraper"
3. Log in to Seeking Alpha manually
4. Scraper opens each ticker URL
5. Manually copy/paste data (current workflow)
6. Verify data saves to Supabase:
   ```sql
   SELECT * FROM seeking_alpha_raw_data ORDER BY scraped_at DESC LIMIT 5;
   SELECT * FROM seeking_alpha_analysis ORDER BY analyzed_at DESC LIMIT 5;
   ```
7. Check frontend display refreshes with new data

---

## Manual Scraping Workflow (Unchanged)

The manual scraping process remains the same:

1. **User logs into Seeking Alpha** (required for access)
2. **Click "🚀 Lancer le Scraper"**
3. **Scraper opens each ticker URL** in sequence (window.open)
4. **User manually copies data** from each page
5. **Data is saved** (now to Supabase instead of JSON)
6. **Batch analysis** runs via Claude API
7. **Dashboard displays** analyzed data

---

## Benefits of Supabase Migration

✅ **No more file size limits** - GitHub has 500KB+ file issues
✅ **Historical tracking** - Keep all scraping history for analysis
✅ **Centralized storage** - Single source of truth
✅ **Better performance** - SQL queries faster than JSON parsing
✅ **Automated cleanup** - Auto-delete old raw data (90 days)
✅ **Smart scraping** - Only scrape stale tickers
✅ **Batch processing** - Analyze multiple tickers in background
✅ **Graceful fallback** - Still works with JSON files if Supabase down

---

## API Usage Examples

### Fetch team tickers needing scraping
```bash
curl 'https://[app].vercel.app/api/seeking-alpha-tickers?needs_scraping=true&max_age_hours=24&limit=10'
```

### Save raw scraped data
```bash
curl -X POST 'https://[app].vercel.app/api/seeking-alpha-scraping?type=raw' \
  -H 'Content-Type: application/json' \
  -d '{
    "ticker": "AAPL",
    "url": "https://seekingalpha.com/symbol/AAPL/virtual_analyst_report",
    "raw_text": "Full text from page...",
    "scrape_duration_ms": 2500,
    "status": "success"
  }'
```

### Start batch Claude analysis
```bash
curl -X POST 'https://[app].vercel.app/api/seeking-alpha-batch' \
  -H 'Content-Type: application/json' \
  -d '{
    "tickers": ["AAPL", "MSFT", "GOOGL"],
    "force_refresh": false
  }'
```

### Fetch latest analyses
```bash
curl 'https://[app].vercel.app/api/seeking-alpha-scraping?type=analysis&latest=true&limit=50'
```

---

## Migration Script Template

Create `migrate-seeking-alpha-to-supabase.js`:

```javascript
const fs = require('fs');

async function migrate() {
  // 1. Read old JSON files
  const rawData = JSON.parse(fs.readFileSync('./public/stock_analysis.json'));
  const analysisData = JSON.parse(fs.readFileSync('./public/stock_data.json'));

  const API_BASE = 'https://[your-app].vercel.app';

  // 2. Migrate raw data
  for (const stock of rawData.stocks) {
    await fetch(`${API_BASE}/api/seeking-alpha-scraping?type=raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: stock.ticker,
        url: stock.url,
        raw_text: stock.raw_text,
        raw_html: stock.raw_html,
        scraped_at: stock.timestamp,
        status: 'success'
      })
    });
    console.log(`✅ Migrated raw data for ${stock.ticker}`);
  }

  // 3. Migrate analysis data
  for (const [ticker, analysis] of Object.entries(analysisData.stocks)) {
    await fetch(`${API_BASE}/api/seeking-alpha-scraping?type=analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker,
        company_name: analysis.companyName,
        sector: analysis.metrics?.sector,
        current_price: analysis.metrics?.price,
        market_cap: analysis.metrics?.marketCap,
        pe_ratio: analysis.metrics?.peRatio,
        dividend_yield: analysis.metrics?.dividendYield,
        quant_overall: analysis.quantRating?.overall,
        quant_valuation: analysis.quantRating?.valuation,
        quant_growth: analysis.quantRating?.growth,
        quant_profitability: analysis.quantRating?.profitability,
        quant_momentum: analysis.quantRating?.momentum,
        strengths: analysis.strengths,
        concerns: analysis.concerns,
        analyst_rating: analysis.finalConclusion?.rating,
        analyst_recommendation: analysis.finalConclusion?.recommendation,
        company_description: analysis.companyProfile?.description
      })
    });
    console.log(`✅ Migrated analysis for ${ticker}`);
  }

  console.log('🎉 Migration complete!');
}

migrate().catch(console.error);
```

---

## Troubleshooting

### Frontend not loading data
1. Check browser console for data source: `supabase`, `json_fallback`, or `error`
2. If `error`, check Supabase API endpoint: `/api/seeking-alpha-scraping?type=analysis&latest=true`
3. Verify Supabase env vars: `SUPABASE_URL`, `SUPABASE_KEY`

### Scraper not saving to Supabase
1. Check browser console for POST request to `/api/seeking-alpha-scraping?type=raw`
2. Verify response is 201 Created
3. Check Supabase table: `SELECT * FROM seeking_alpha_raw_data ORDER BY scraped_at DESC LIMIT 1;`

### Batch analysis not running
1. Check endpoint: `/api/seeking-alpha-batch` POST request
2. Verify response includes `batch_id`
3. Monitor status: `/api/seeking-alpha-batch/status?batch_id=xxx`
4. Check Claude API key: `ANTHROPIC_API_KEY` in Vercel env

---

## Next Immediate Action

**YOU MUST DO THIS FIRST** before the system works:

1. **Deploy Supabase Schema**
   - Open: https://supabase.com/dashboard
   - Go to SQL Editor
   - Run: `supabase-seeking-alpha-refactor.sql`
   - Verify 25 tickers inserted

2. **Test Fetching Data**
   - Open dashboard
   - Open browser console
   - Look for: `"✅ Seeking Alpha raw data chargée depuis Supabase: X stocks"`
   - Should show 0 stocks initially (empty table)

3. **Update Scraper Saving Logic** (see Step 3 above)

4. **Test Scraping**
   - Run scraper
   - Verify data appears in Supabase
   - Check frontend display

---

**Commit**: `1038a3f` - 🗄️ FEATURE: Supabase migration for Seeking Alpha data
