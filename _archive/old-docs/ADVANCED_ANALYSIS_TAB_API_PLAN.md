# Advanced Analysis Tab - Complete API Integration Plan

## 📊 API Stack Inventory

### 1. Market Data APIs (/api/marketdata)
**Endpoints:**
- `quote` - Real-time stock quotes (Polygon → Twelve Data)
- `fundamentals` - Company profile, ratios, metrics (FMP + Alpha Vantage + Twelve Data)
- `intraday` - 5-minute interval data (Twelve Data)
- `analyst` - Analyst estimates and consensus (FMP)
- `earnings` - Earnings calendar + historical (FMP)

**Batch Support:**
- `/api/marketdata/batch?symbols=AAPL,MSFT,GOOGL&endpoints=quote,profile,fundamentals`
- **Optimization:** 60-90% reduction in API calls
- **Example:** 10 stocks × 3 endpoints = 30 calls → 3 batch calls

### 2. AI Services (/api/ai-services)
**Available Models:**
- **Perplexity:**
  - `sonar-reasoning-pro` - DeepSeek-R1 + Chain of Thought (primary)
  - `sonar-reasoning` - Fast reasoning (backup1)
  - `sonar-pro` - Advanced search (backup2)
  - `sonar` - Basic search (backup3)
  - `sonar-deep-research` - Exhaustive research (expert, 5 req/min)

- **OpenAI:** gpt-4o (2000 tokens, temp 0.7)
- **Anthropic:** Claude-3-Sonnet (fallback)

**Services:**
- `perplexity` - Real-time web search + analysis
- `openai` - GPT-4o completions
- `tickers-news` - News aggregation with AI summarization

### 3. Calendar APIs
**Endpoints:**
- `/api/calendar-earnings` - Next 7 days earnings (FMP + fallback)
- `/api/calendar-economic` - Economic events (FMP → Finnhub → Alpha Vantage → Twelve Data)

### 4. News APIs
**Endpoints:**
- `/api/news` - FMP stock news API
- `/api/finviz-news` - Finviz news scraping
- `/api/ai-services?service=tickers-news` - AI-powered news with Perplexity

### 5. Supabase Storage
**Endpoints:**
- `/api/supabase-watchlist` - User watchlist CRUD
- `/api/supabase-daily-cache` - Daily data caching

---

## 🚀 Proposed Features for Advanced Analysis Tab

### Feature 1: AI-Powered Stock Analysis
**API Stack:**
- Perplexity `sonar-reasoning-pro` for investment thesis
- OpenAI GPT-4o for detailed analysis
- FMP fundamentals + ratios

**Data Points:**
- AI-generated investment thesis (bullish/bearish/neutral)
- Risk factors identified
- Competitive advantages
- Valuation assessment
- Recommendation with confidence score

**Implementation:**
```javascript
// Prompt for Perplexity
const analysisPrompt = `Analyze ${symbol} stock as an investment opportunity.
Provide: 1) Investment thesis, 2) Key risks, 3) Competitive position,
4) Valuation assessment, 5) 3-6 month outlook. Use latest data.`;

const aiResponse = await fetch('/api/ai-services', {
  method: 'POST',
  body: JSON.stringify({
    service: 'perplexity',
    prompt: analysisPrompt,
    section: 'analysis',
    recency: 'day'
  })
});
```

---

### Feature 2: Real-Time News & Sentiment
**API Stack:**
- FMP stock news (50 articles/ticker)
- Perplexity for sentiment analysis
- Batch processing for watchlist

**Data Points:**
- Last 24h news count
- Sentiment score (-100 to +100)
- Top 5 headlines with AI summaries
- News impact on price

**Implementation:**
```javascript
// Batch news fetch for watchlist
const newsData = await fetch(`/api/news?symbols=${watchlist.join(',')}&limit=50`);

// AI sentiment analysis
const sentimentPrompt = `Analyze sentiment of these news headlines for ${symbol}:
${headlines.join('\n')}. Return: overall_sentiment, key_themes, impact_level.`;
```

---

### Feature 3: Analyst Consensus Dashboard
**API Stack:**
- FMP analyst estimates
- FMP rating API
- Batch endpoint for efficiency

**Data Points:**
- EPS consensus (avg, high, low, # analysts)
- Revenue estimates
- Analyst ratings distribution (Buy/Hold/Sell)
- Historical accuracy vs actual

**Implementation:**
```javascript
const analystData = await fetch(
  '/api/marketdata/batch?symbols=AAPL,MSFT&endpoints=analyst,rating'
);
```

---

### Feature 4: Earnings Calendar with Surprise Analysis
**API Stack:**
- FMP earnings calendar
- FMP historical earnings
- AI-powered impact prediction (Perplexity)

**Data Points:**
- Next earnings date + countdown
- Expected EPS vs revenue
- Historical surprise % (last 4 quarters)
- Pre-earnings volatility estimate

**Implementation:**
```javascript
const earningsData = await fetch('/api/calendar-earnings');

// AI prediction
const impactPrompt = `Based on ${symbol}'s earnings history and current
market conditions, predict potential price impact of upcoming earnings.
Factors: ${earningsHistory}, current sentiment: ${sentiment}`;
```

---

### Feature 5: Economic Calendar Impact Analysis
**API Stack:**
- FMP economic calendar (or fallbacks)
- AI correlation analysis (Perplexity)

**Data Points:**
- Next 7 days high-impact events
- Stock-specific correlation to events
- Sector sensitivity scores
- Trading strategy recommendations

**Implementation:**
```javascript
const economicEvents = await fetch('/api/calendar-economic');

// AI correlation
const correlationPrompt = `How do these economic events typically impact
${symbol} in ${sector}? Events: ${events}. Provide historical correlation
and trading strategy.`;
```

---

### Feature 6: Advanced Watchlist Screener with AI Ranking
**API Stack:**
- Batch API for all watchlist stocks
- Perplexity for AI-powered ranking
- FMP fundamentals + ratios

**Data Points:**
- AI-generated "buy score" (0-100)
- Value vs Growth classification
- Risk-reward ratio
- Momentum indicators
- Best opportunities ranked

**Implementation:**
```javascript
// Batch fetch all watchlist data
const batchData = await fetch(
  `/api/marketdata/batch?symbols=${watchlist}&endpoints=quote,fundamentals,ratios,analyst`
);

// AI ranking
const rankingPrompt = `Rank these ${watchlist.length} stocks for best
3-6 month return potential. Consider: fundamentals, technicals,
analyst consensus, recent news. Return JSON with scores.`;
```

---

## 📈 Performance Optimizations

### 1. Batch Loading Strategy
```javascript
// BEFORE: 30 API calls for 10 stocks
watchlist.forEach(async symbol => {
  await fetch(`/api/marketdata?endpoint=quote&symbol=${symbol}`);
  await fetch(`/api/marketdata?endpoint=fundamentals&symbol=${symbol}`);
  await fetch(`/api/marketdata?endpoint=analyst&symbol=${symbol}`);
});

// AFTER: 3 batch calls
const allData = await fetch(
  `/api/marketdata/batch?symbols=${watchlist.join(',')}&endpoints=quote,fundamentals,analyst`
);
// 90% reduction in API calls!
```

### 2. Smart Caching System
```javascript
// 5-minute cache for quotes
// 1-hour cache for fundamentals, analyst, earnings
// Daily cache for Supabase watchlist

const CACHE_DURATIONS = {
  quote: 5 * 60 * 1000,
  fundamentals: 60 * 60 * 1000,
  analyst: 60 * 60 * 1000,
  news: 15 * 60 * 1000,
  aiAnalysis: 60 * 60 * 1000
};
```

### 3. Progressive Loading
```javascript
// Load critical data first, then enhance
1. Load quotes (fast, batch) → Display prices
2. Load fundamentals (cached) → Show ratios
3. Load AI analysis (slow) → Progressive enhancement
4. Load news/earnings (background) → Optional data
```

---

## 🎨 UI Components to Build

### 1. AI Analysis Card
- Robot icon, gradient background (blue/purple)
- "Generating analysis..." loading state
- Collapsible sections: Thesis, Risks, Valuation
- Confidence meter (0-100%)

### 2. News Feed Card
- Real-time update badge
- Sentiment indicator (green/red/gray)
- Scrollable headlines with timestamps
- "Load more" pagination

### 3. Analyst Consensus Card
- Bar chart: Buy/Hold/Sell distribution
- EPS estimate range visualization
- Historical accuracy chart

### 4. Earnings Calendar Card
- Countdown timer to next earnings
- Surprise % history (bar chart)
- Expected vs actual comparison

### 5. Economic Events Card
- Timeline view (next 7 days)
- Impact level badges (High/Med/Low)
- Stock correlation indicator

### 6. Watchlist Screener Card
- Sortable table with AI scores
- Filter by sector, score, momentum
- Quick action buttons (Analyze, Buy, Add to Portfolio)

---

## 🧪 Testing Plan

### 1. API Rate Limits
- Perplexity: 50 req/min (premium models)
- FMP: 250 req/day (free tier) → Monitor quota
- Polygon: 5 req/min (free) → Use Twelve Data fallback

### 2. Error Handling
- Graceful degradation when APIs fail
- Show cached data with "Stale data" warning
- Fallback to static data for demos

### 3. Performance Targets
- Initial load: <3 seconds (critical data)
- Cached load: <1 second
- AI analysis: <10 seconds (progressive)
- Batch fetch: <5 seconds for 20 stocks

---

## 📝 Implementation Priority

### Phase 1: Foundation (Day 1)
✅ Document API stack
✅ Create implementation plan
🔄 Set up batch loading infrastructure
🔄 Implement smart caching

### Phase 2: Core Features (Day 2-3)
- [ ] AI Stock Analysis card
- [ ] News & Sentiment feed
- [ ] Analyst Consensus dashboard

### Phase 3: Advanced Features (Day 4-5)
- [ ] Earnings Calendar
- [ ] Economic Events
- [ ] Watchlist Screener with AI

### Phase 4: Polish (Day 6)
- [ ] Loading states & animations
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Performance optimization

---

## 🎯 Success Metrics

1. **API Efficiency:** 90% reduction in API calls via batching
2. **Load Time:** <3s initial, <1s cached
3. **User Engagement:** 10+ feature interactions/session
4. **AI Quality:** 85%+ user satisfaction with analysis
5. **Data Freshness:** 95%+ data <5min old

---

## 🔐 Security & Rate Limiting

### API Key Protection
- All keys stored in Vercel environment variables
- No keys exposed to client
- Backend proxy pattern for all API calls

### Rate Limit Management
```javascript
// Implement exponential backoff
const retryWithBackoff = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        await new Promise(r => setTimeout(r, 2 ** i * 1000));
      } else throw error;
    }
  }
};
```

---

## 🚨 Known Limitations

1. **FMP Free Tier:** 250 calls/day → Use caching aggressively
2. **Perplexity Quota:** 50 req/min → Queue requests
3. **Polygon Free:** 5 req/min → Fallback to Twelve Data
4. **AI Latency:** 5-10s → Use loading states

---

## 📚 Next Steps

1. Review this plan with stakeholders
2. Prioritize features based on user value
3. Begin implementation with Phase 1
4. Set up monitoring dashboard
5. Create user documentation

---

**Document Version:** 1.0
**Created:** 2025-12-01
**Last Updated:** 2025-12-01
**Status:** Ready for Implementation
