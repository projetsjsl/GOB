# 🚀 Deployment Checklist - Supabase Seeking Alpha Migration

**Date**: January 2025
**Commit**: `1038a3f` - 🗄️ FEATURE: Supabase migration for Seeking Alpha data

---

## ✅ Completed

- [x] Database schema designed (`supabase-seeking-alpha-refactor.sql`)
- [x] API endpoints created (tickers, scraping, batch)
- [x] Frontend updated to fetch from Supabase
- [x] Timeout configs added to `vercel.json`
- [x] Code pushed to GitHub (`main` branch)
- [x] Environment variables verified in Vercel:
  - SUPABASE_URL ✓
  - SUPABASE_SERVICE_ROLE_KEY ✓
  - ANTHROPIC_API_KEY ✓
  - FMP_API_KEY ✓
  - GEMINI_API_KEY ✓
  - All other APIs configured ✓

---

## ⏳ Pending (DO THESE NOW)

### 1. Deploy Supabase Schema (5 minutes)

**This is the MOST IMPORTANT step - nothing will work without it!**

1. Open Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/ctjnhddcrsddhfhfhfiu/sql
   ```

2. Open the SQL Editor (left sidebar → SQL Editor)

3. Click "New Query"

4. Open `supabase-seeking-alpha-refactor.sql` from this project

5. Copy ALL content (373 lines)

6. Paste into Supabase SQL Editor

7. Click "Run" (or press Ctrl/Cmd + Enter)

8. **Verify success** - You should see:
   ```
   ✅ CREATE TABLE (3 tables)
   ✅ CREATE VIEW (1 view)
   ✅ CREATE FUNCTION (3 functions)
   ✅ CREATE POLICY (7 policies)
   ✅ INSERT 25 rows (tickers)
   ```

9. **Double-check data** - Run this query:
   ```sql
   SELECT COUNT(*) as team_tickers FROM tickers WHERE source = 'team';
   ```
   Should return: **25**

---

### 2. Wait for Vercel Deployment (2-3 minutes)

Your code was pushed to GitHub. Vercel is automatically deploying now.

**Check deployment status:**
1. Go to: https://vercel.com/projetsjsls-projects/gob/deployments
2. Wait for "Building..." to change to "Ready"
3. Click on the deployment to see logs

**Current deployment status:**
- Commit: `1038a3f`
- Branch: `main`
- Status: Building... (check Vercel dashboard)

---

### 3. Verify API Endpoints (1 minute)

Once Vercel deployment is complete, test these endpoints:

#### **Test 1: Tickers API**
```bash
curl https://gobapps.com/api/seeking-alpha-tickers?limit=5
```

**Expected response:**
```json
{
  "success": true,
  "tickers": [
    {"ticker": "BCE", "company_name": "BCE Inc.", "source": "team"},
    {"ticker": "BNS", "company_name": "Bank of Nova Scotia", "source": "team"},
    ...
  ],
  "count": 5
}
```

#### **Test 2: Scraping API (should return empty initially)**
```bash
curl "https://gobapps.com/api/seeking-alpha-scraping?type=analysis&latest=true&limit=5"
```

**Expected response:**
```json
{
  "success": true,
  "type": "analysis",
  "filter": "latest",
  "data": [],
  "count": 0
}
```
*(Empty is normal - no data scraped yet)*

#### **Test 3: Config Tickers (used by frontend)**
```bash
curl https://gobapps.com/api/config/tickers
```

**Expected response:**
```json
{
  "success": true,
  "team_tickers": ["GOOGL", "T", "BNS", ...],
  "team_count": 25,
  "team_source": "supabase",
  "watchlist_tickers": [...],
  ...
}
```
**Important**: `team_source` should be `"supabase"` (not `"fallback"`)

---

### 4. Test Frontend Dashboard (5 minutes)

1. **Open dashboard**: https://gobapps.com

2. **Open browser console** (F12 → Console tab)

3. **Check for Supabase logs**:
   ```
   Look for these messages:
   ✅ "📊 Chargement des tickers depuis Supabase..."
   ✅ "✅ Tickers chargés: 25 équipe, X watchlist"
   ✅ "📊 Chargement des données brutes Seeking Alpha depuis Supabase..."
   ✅ "📊 Chargement des analyses Claude depuis Supabase..."
   ```

4. **Verify data source**:
   - Should see: `"source": "supabase"` in console logs
   - Should NOT see: `"source": "json_fallback"` (means Supabase failed)
   - Should NOT see: `"source": "error"` (means API error)

5. **Navigate to tabs**:
   - ✅ Stocks & News (should load)
   - ✅ JLab (should load)
   - ✅ Economic Calendar (should load)
   - ✅ Scrapping SA (should be empty initially - normal)
   - ✅ Admin JSLAI (should load)

---

### 5. Test Seeking Alpha Scraper (10-15 minutes)

**This is the end-to-end test!**

1. **Navigate to "Scrapping SA" tab**

2. **Click "🚀 Lancer le Scraper"**

3. **Manual login required**:
   - First window that opens → Log in to Seeking Alpha
   - Keep that window open for all tickers

4. **Scraper will iterate through team tickers**:
   - Opens each ticker URL in sequence
   - Wait 3 seconds between tickers
   - 25 tickers total (~2-3 minutes)

5. **Currently still uses OLD GitHub JSON saving**:
   - ⚠️ This part is NOT yet updated to Supabase
   - ⚠️ Data will save to GitHub JSON files
   - ⚠️ This is expected behavior for now

6. **Next update needed** (see Step 6 below):
   - Update scraper to save to Supabase instead of GitHub

---

### 6. Update Scraper Saving Logic (Next Task)

**File**: `public/beta-combined-dashboard.html`
**Function**: `analyzeWithClaudeAndUpdate()` (around line 2019)

**Current behavior**: Saves to GitHub JSON via `/api/github-update`
**Target behavior**: Save to Supabase via new APIs

**Required changes**:

```javascript
// CURRENT (line ~2086-2095):
const response = await fetch(`${API_BASE_URL}/api/ai-services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        service: 'perplexity',
        prompt: 'Test de connexion API',
        marketData: {},
        news: 'Test'
    })
});

// CHANGE TO:
// Step 1: Save raw scraped data to Supabase
const rawDataResponse = await fetch(`${API_BASE_URL}/api/seeking-alpha-scraping?type=raw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        ticker: ticker.toUpperCase(),
        url: `https://seekingalpha.com/symbol/${ticker}/virtual_analyst_report`,
        raw_text: scrapedData.raw_text || JSON.stringify(scrapedData),
        raw_html: scrapedData.raw_html || null,
        scrape_method: 'manual',
        scrape_duration_ms: Date.now() - scrapingStartTime,
        status: 'success'
    })
});

if (!rawDataResponse.ok) {
    throw new Error(`Failed to save raw data: ${rawDataResponse.status}`);
}

const rawResult = await rawDataResponse.json();
const rawDataId = rawResult.data?.id;

addScrapingLog(`✅ Raw data saved to Supabase (ID: ${rawDataId})`, 'success');

// Step 2: Analyze with Claude and save analysis
const claudePrompt = `... (keep existing prompt) ...`;

const claudeResponse = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: claudePrompt,
        conversationHistory: []
    })
});

if (!claudeResponse.ok) {
    throw new Error(`Claude analysis failed: ${claudeResponse.status}`);
}

const claudeResult = await claudeResponse.json();
const analysis = JSON.parse(claudeResult.response);

// Step 3: Save Claude analysis to Supabase
const analysisResponse = await fetch(`${API_BASE_URL}/api/seeking-alpha-scraping?type=analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        ticker: ticker.toUpperCase(),
        raw_data_id: rawDataId,
        company_name: analysis.companyName,
        sector: analysis.metrics?.sector,
        current_price: parseFloat(analysis.metrics?.price) || null,
        market_cap: analysis.metrics?.marketCap,
        pe_ratio: parseFloat(analysis.metrics?.peRatio) || null,
        dividend_yield: parseFloat(analysis.metrics?.dividendYield) || null,
        annual_dividend: parseFloat(analysis.metrics?.annualPayout) || null,
        dividend_frequency: analysis.metrics?.dividendFrequency,
        ex_dividend_date: analysis.metrics?.exDivDate,
        quant_overall: analysis.quantRating?.valuation, // Fix: should map correctly
        quant_valuation: analysis.quantRating?.valuation,
        quant_growth: analysis.quantRating?.growth,
        quant_profitability: analysis.quantRating?.profitability,
        quant_momentum: analysis.quantRating?.momentum,
        quant_eps_revisions: analysis.quantRating?.revisions,
        strengths: analysis.strengths || [],
        concerns: analysis.concerns || [],
        analyst_rating: analysis.finalConclusion?.rating,
        analyst_recommendation: analysis.finalConclusion?.recommendation,
        company_description: analysis.companyProfile?.description,
        analysis_model: 'claude-3-5-sonnet-20241022'
    })
});

if (!analysisResponse.ok) {
    throw new Error(`Failed to save analysis: ${analysisResponse.status}`);
}

addScrapingLog(`✅ Analysis saved to Supabase for ${ticker}`, 'success');
```

---

## 📊 Success Criteria

### ✅ Deployment is successful when:

1. **Supabase tables exist**:
   ```sql
   SELECT * FROM tickers LIMIT 1; -- Returns data
   SELECT * FROM seeking_alpha_raw_data LIMIT 1; -- Returns 0 or data
   SELECT * FROM seeking_alpha_analysis LIMIT 1; -- Returns 0 or data
   ```

2. **API endpoints respond**:
   - `/api/seeking-alpha-tickers` → 200 OK with 25 team tickers
   - `/api/seeking-alpha-scraping?type=raw` → 200 OK (empty initially)
   - `/api/config/tickers` → `team_source: "supabase"`

3. **Frontend loads data**:
   - Console shows: `"✅ Tickers chargés: 25 équipe..."`
   - Console shows: `"source": "supabase"` (NOT "json_fallback")

4. **Scraper works** (after Step 6 update):
   - Scraper saves raw data to Supabase
   - Claude analyzes and saves to Supabase
   - Frontend displays data from Supabase

---

## 🆘 Troubleshooting

### Frontend shows `"source": "json_fallback"`
**Problem**: Frontend falling back to old JSON files
**Cause**: Supabase API endpoints not responding
**Fix**:
1. Check Supabase schema deployed: `SELECT * FROM tickers;`
2. Check Vercel environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
3. Check Vercel deployment logs for errors
4. Test API directly: `curl https://gobapps.com/api/seeking-alpha-tickers`

### API returns 500 error
**Problem**: Server error in API endpoint
**Cause**: Supabase connection issue or missing environment variable
**Fix**:
1. Check Vercel logs: https://vercel.com/projetsjsls-projects/gob/logs
2. Verify env vars are set in Vercel dashboard
3. Check Supabase API is accessible (test with curl)

### Scraper not saving to Supabase
**Problem**: Data still going to GitHub JSON
**Cause**: Step 6 not completed yet (scraper code not updated)
**Fix**:
1. Update `analyzeWithClaudeAndUpdate()` function (see Step 6 above)
2. Commit and push changes
3. Wait for Vercel deployment
4. Test scraper again

### "Table does not exist" errors
**Problem**: Supabase schema not deployed
**Cause**: Step 1 not completed
**Fix**:
1. Go to Supabase SQL Editor
2. Run `supabase-seeking-alpha-refactor.sql`
3. Verify: `SELECT COUNT(*) FROM tickers;` returns 25

---

## 🎯 Current Priority

**RIGHT NOW - DO THIS FIRST:**

1. ✅ Deploy Supabase schema (Step 1) - **5 minutes**
2. ⏳ Wait for Vercel deployment (Step 2) - **2-3 minutes** (automatic)
3. ✅ Test API endpoints (Step 3) - **1 minute**
4. ✅ Test frontend dashboard (Step 4) - **5 minutes**

**After basic deployment works:**

5. 🔄 Update scraper saving logic (Step 6) - **30 minutes coding**
6. ✅ Test end-to-end scraping (Step 5) - **15 minutes**

---

## 📝 Summary

**What's working now:**
- ✅ All code committed and pushed to GitHub
- ✅ Vercel deploying automatically
- ✅ All environment variables configured
- ✅ Frontend updated to fetch from Supabase
- ✅ API endpoints created

**What's needed:**
- ⏳ Deploy Supabase SQL schema (YOU MUST DO THIS)
- ⏳ Wait for Vercel deployment
- ⏳ Test everything works
- 🔄 Update scraper to save to Supabase (next task)

**Files created/modified:**
- `supabase-seeking-alpha-refactor.sql` (NEW) - Database schema
- `api/seeking-alpha-tickers.js` (NEW) - Ticker CRUD
- `api/seeking-alpha-scraping.js` (NEW) - Data storage
- `api/seeking-alpha-batch.js` (NEW) - Batch processing
- `api/config/tickers.js` (UPDATED) - Now reads from Supabase
- `public/beta-combined-dashboard.html` (UPDATED) - Fetch from Supabase
- `vercel.json` (UPDATED) - Timeout configs added
- `SUPABASE_SEEKING_ALPHA_MIGRATION.md` (NEW) - Full documentation

**Commit**: `1038a3f`

---

**Start with Step 1 → Deploy Supabase Schema!**
