# 🔍 API Diagnostic Report - GOB Financial Dashboard

**Date**: October 17, 2025
**Status**: FMP API returning 403 Forbidden errors despite available quota

---

## 📊 API Status Summary

| API | Status | Issues | Priority |
|-----|--------|--------|----------|
| ❌ **FMP** | FAILING | 403 Forbidden | 🔴 HIGH |
| ✅ **Supabase** | WORKING | None | 🟢 NORMAL |
| ⚠️ **Gemini** | UNKNOWN | Needs testing | 🟡 MEDIUM |
| ⚠️ **Perplexity** | UNKNOWN | Needs testing | 🟡 MEDIUM |
| ⚠️ **Market Data** | UNKNOWN | Fallback system | 🟡 MEDIUM |

---

## 1️⃣ Financial Modeling Prep (FMP) API

### ❌ Current Status: **FAILING**

**Error**: `403 Forbidden` on all endpoints (quote, news, profile, etc.)

### 🔍 Root Cause Analysis

Based on FMP's official documentation (October 2025), the **403 Forbidden** error is most likely caused by:

#### **Primary Cause: 30-Day Rolling Bandwidth Limit**
- FMP implements a **30-day rolling monthly bandwidth limit**
- This limit affects less than 0.5% of users
- When exceeded, API returns `403 Forbidden` even if API key is valid
- Separate from daily request limits

#### **Secondary Causes**:
1. **Daily Request Limit Exceeded**:
   - Free Plan: 250 daily market data requests
   - Starter/Premium: Higher limits
   - Ultimate: 150GB monthly bandwidth

2. **API Key Issues**:
   - Invalid or mistyped API key
   - Improper query parameter formatting
   - API key not activated for current plan tier

3. **Missing Headers**:
   - User-Agent header may be required (now added in our code)

### ✅ What We've Already Fixed

**Commit**: `d226b6b` - Added User-Agent header and better error logging

```javascript
// Now includes required headers
const fmpResponse = await fetch(fmpUrl, {
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'GOB-Financial-Dashboard/1.0',
    'Accept-Encoding': 'gzip, deflate'
  }
});
```

### 🛠️ Recommended Actions

1. **Check FMP Dashboard** (IMMEDIATE):
   - Visit: https://site.financialmodelingprep.com/developer/docs/dashboard
   - Check "Bandwidth Usage" for 30-day rolling period
   - Verify remaining API calls for today
   - Check subscription tier and limits

2. **Verify API Key** (5 minutes):
   - Copy API key from FMP dashboard
   - Compare with Vercel environment variable `FMP_API_KEY`
   - Regenerate key if needed (old key still works during transition)

3. **Monitor Usage** (Ongoing):
   ```bash
   # After deployment, check detailed error logs
   vercel logs --token YOUR_TOKEN
   ```
   - Look for FMP error response details in logs
   - Check if error message contains bandwidth/limit info

4. **Consider Plan Upgrade** (If limits exceeded):
   - **Free Plan**: 250 requests/day (insufficient for frequent scraping)
   - **Starter**: $14/month - 750 requests/day
   - **Premium**: $29/month - 1,500 requests/day
   - **Ultimate**: $99/month - 5,000 requests/day + 150GB bandwidth

### 📝 FMP API Usage Best Practices

**Authentication Format**:
```javascript
// ✅ CORRECT - First parameter
https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=YOUR_KEY

// ✅ CORRECT - With other parameters
https://financialmodelingprep.com/api/v3/stock_news?limit=50&apikey=YOUR_KEY

// ❌ WRONG - Missing & for second parameter
https://financialmodelingprep.com/api/v3/stock_news?limit=50?apikey=YOUR_KEY
```

**Rate Limiting**:
- Respect 30-day rolling bandwidth limit
- Implement caching for repeated requests
- Use batch endpoints when available
- Monitor usage via dashboard

**Error Handling**:
- `403 Forbidden`: Bandwidth/daily limit exceeded or invalid key
- `401 Unauthorized`: Invalid API key
- `429 Too Many Requests`: Rate limit (wait and retry)
- `400 Bad Request`: Invalid parameters

---

## 2️⃣ Supabase API

### ✅ Current Status: **WORKING PERFECTLY**

**Test Results**:
```bash
✅ Tickers API: 3 results returned
✅ Scraping API (raw): 1 record found
✅ Scraping API (analysis): 1 record found
```

### 📊 Available Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/api/seeking-alpha-tickers` | Get active team tickers | ✅ |
| `/api/seeking-alpha-scraping?type=raw` | Store/fetch scraped data | ✅ |
| `/api/seeking-alpha-scraping?type=analysis` | Store/fetch Claude analysis | ✅ |
| `/api/seeking-alpha-batch` | Batch process tickers | ⚠️ Not tested |

### 🎯 Recommendations

1. **Fully Operational**: No changes needed
2. **Consider Testing Batch Endpoint**: For processing multiple tickers efficiently
3. **Monitor Supabase Quota**: Check dashboard for DB size/requests

---

## 3️⃣ Google Gemini API

### ⚠️ Current Status: **NEEDS TESTING**

**Test Result**: `null` response (inconclusive)

### 🔍 Investigation Needed

The Gemini API test returned `null`, which could mean:
1. API key not configured
2. Request format incorrect
3. Endpoint timeout
4. Service temporarily unavailable

### 🛠️ Recommended Test

```bash
# Test Gemini API directly
curl -X POST "https://gobapps.com/api/gemini/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is 2+2?",
    "conversationHistory": []
  }'
```

### 📚 Latest Gemini API Documentation (2025)

**Model**: Gemini 2.0 Flash (latest)
**Authentication**: API key via environment variable `GEMINI_API_KEY`
**Rate Limits**:
- Free tier: 15 requests per minute, 1,500 requests per day
- Paid tier: Higher limits based on billing

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

---

## 4️⃣ Perplexity API

### ⚠️ Current Status: **INTEGRATED BUT NOT TESTED**

**Integration**: Emma Agent (`/api/emma-agent.js`) uses Perplexity via:
- Model: `sonar-pro` (latest as of 2025)
- Purpose: Data formatting for Seeking Alpha scraper
- Mode: `output_mode: 'data'` for JSON responses

### 🔍 Test Needed

```bash
# Test Perplexity via Emma Agent
curl -X POST "https://gobapps.com/api/emma-agent" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Extract company info for AAPL from: Apple Inc. is a technology company...",
    "context": {
      "output_mode": "data",
      "tickers": ["AAPL"]
    }
  }'
```

### 📚 Latest Perplexity API Info

**Authentication**: API key via `PERPLEXITY_API_KEY`
**Models Available** (2025):
- `sonar-pro`: Most capable, real-time web search
- `sonar`: Standard model
- `sonar-turbo`: Faster responses

**Rate Limits**: Based on subscription tier

---

## 5️⃣ Market Data API (Fallback System)

### ⚠️ Current Status: **FALLBACK ACTIVE**

**Purpose**: Multi-source data fetching with automatic fallback

**Fallback Chain**:
```
1. FMP (Primary) → 403 Error ❌
2. Finnhub (Fallback 1) → Attempting...
3. Alpha Vantage (Fallback 2) → Attempting...
4. Yahoo Finance (Fallback 3) → Last resort
```

### 🛠️ Recommendation

**Current Behavior**: Since FMP is failing, the system automatically falls back to Finnhub, then Alpha Vantage, then Yahoo Finance.

**Action**: Once FMP is fixed, the primary source will resume automatically.

**Verify Fallback Keys**:
```bash
# Check that fallback API keys are configured
vercel env ls --token YOUR_TOKEN | grep -E "FINNHUB|ALPHA_VANTAGE"
```

---

## 6️⃣ Anthropic Claude API

### ⚠️ Current Status: **AVAILABLE BUT REPLACED**

**Recent Change**: Scraper switched from Claude to Perplexity for data formatting

**Claude Still Used For**:
- Emma AI advanced analysis (optional)
- Batch processing (`/api/seeking-alpha-batch.js`)

### 🔍 Recommendation

- Keep `ANTHROPIC_API_KEY` configured for batch processing
- Monitor usage if using batch endpoint
- Claude Sonnet 4.5 currently configured

---

## 🎯 Immediate Action Plan

### Priority 1: Fix FMP API (🔴 Critical)

1. **Login to FMP Dashboard**:
   ```
   https://site.financialmodelingprep.com/developer/docs/dashboard
   ```

2. **Check Bandwidth Usage**:
   - Look for "30-day rolling bandwidth" metric
   - Check "Daily API calls remaining"
   - Verify subscription tier

3. **Possible Outcomes**:

   **A. Bandwidth Exceeded**:
   - Wait for rolling period to reset (check date)
   - OR upgrade plan immediately
   - Consider caching strategy to reduce calls

   **B. API Key Invalid**:
   - Regenerate new API key
   - Update Vercel env variable:
     ```bash
     vercel env add FMP_API_KEY --token YOUR_TOKEN
     ```

   **C. Plan Limitations**:
   - Upgrade from Free (250/day) to Starter (750/day) or higher
   - Consider Ultimate plan if scraping >20 tickers daily

### Priority 2: Test Gemini & Perplexity (🟡 Medium)

1. Test Gemini chat endpoint (see Section 3)
2. Test Perplexity via Emma Agent (see Section 4)
3. Verify both API keys in Vercel environment

### Priority 3: Monitor Fallback System (🟢 Low)

1. Check if Finnhub is successfully providing data
2. Verify Alpha Vantage API key is valid
3. Consider which fallback source to prioritize

---

## 📈 Usage Optimization Recommendations

### Reduce FMP API Calls

**1. Implement Caching**:
```javascript
// Cache quote data for 5 minutes
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

function getCachedQuote(symbol) {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

**2. Batch Requests**:
```javascript
// Instead of 10 separate calls:
// /api/fmp?endpoint=quote&symbol=AAPL (x10)

// Use batch endpoint:
// /api/fmp?endpoint=quote&symbols=AAPL,MSFT,GOOGL,AMZN,TSLA
```

**3. Use Supabase as Primary Store**:
- Store FMP data in Supabase `seeking_alpha_analysis` table
- Only fetch from FMP when data is >24 hours old
- Serve from Supabase for recent requests

**4. Schedule Updates**:
- Use Vercel Cron to update ticker data once daily
- Avoid real-time fetching during user interactions
- Pre-populate data during off-peak hours

---

## 🔧 Environment Variables Checklist

Ensure these are set in Vercel (Production):

- [ ] `FMP_API_KEY` - Financial Modeling Prep (**VERIFY THIS**)
- [ ] `GEMINI_API_KEY` - Google Gemini 2.0 Flash
- [ ] `PERPLEXITY_API_KEY` - Perplexity AI (Emma Agent)
- [ ] `ANTHROPIC_API_KEY` - Claude AI (batch processing)
- [ ] `FINNHUB_API_KEY` - Fallback market data
- [ ] `ALPHA_VANTAGE_API_KEY` - Fallback market data
- [ ] `SUPABASE_URL` - Database ✅
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Database admin ✅
- [ ] `GITHUB_TOKEN` - Data persistence ✅

---

## 📝 Testing Script

Save this as `test-all-apis.sh` and run after fixes:

```bash
#!/bin/bash

echo "🧪 Testing All GOB APIs"
echo "======================="

# 1. FMP API
echo "1. FMP Quote (AAPL):"
curl -s "https://gobapps.com/api/fmp?endpoint=quote&symbol=AAPL" | jq '.success, .error'

# 2. FMP News
echo "2. FMP News:"
curl -s "https://gobapps.com/api/fmp?endpoint=news&limit=5" | jq '.success, .count'

# 3. Gemini Chat
echo "3. Gemini AI:"
curl -s -X POST "https://gobapps.com/api/gemini/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","conversationHistory":[]}' | jq '.success'

# 4. Supabase Tickers
echo "4. Supabase Tickers:"
curl -s "https://gobapps.com/api/seeking-alpha-tickers?limit=3" | jq '.success, .count'

# 5. Market Data (Fallback)
echo "5. Market Data (AAPL):"
curl -s "https://gobapps.com/api/marketdata?symbol=AAPL" | jq '.success, .source'

echo "======================="
echo "✅ Testing complete"
```

---

## 📊 Next Steps

1. **IMMEDIATE**: Check FMP dashboard for bandwidth/limits
2. **TODAY**: Verify and update FMP_API_KEY if needed
3. **THIS WEEK**: Implement caching to reduce API calls
4. **ONGOING**: Monitor API usage and optimize scraper frequency

---

**Last Updated**: October 17, 2025
**Report Generated By**: Claude Code
**Status**: Awaiting FMP dashboard verification from user
