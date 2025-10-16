# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GOB (Groupe Ouellet Bolduc) Financial Dashboard** - A comprehensive financial analysis platform powered by JSL AI, combining real-time market data, AI-powered financial analysis (Emma IA™), and custom scoring algorithms (JSLAI™ Score).

## Tech Stack

- **Frontend**: React 18.2 + TypeScript, Vite, TailwindCSS
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI Services**: Google Gemini 2.0 Flash, Anthropic Claude 3.5 Sonnet
- **Data Sources**: FMP (Financial Modeling Prep), Finnhub, Alpha Vantage, Yahoo Finance
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Development Commands

### Build & Development
```bash
# Start development server (opens browser automatically)
npm run dev

# Build for production (TypeScript compilation + Vite build)
npm run build

# Preview production build
npm run preview

# Lint TypeScript/TSX files
npm run lint
```

### Testing & Diagnostics
```bash
# Test all APIs
node test-apis.js

# Test Gemini function calling
node test-gemini-functions.js

# Test FMP API directly
node test-fmp-direct.js

# Test Emma AI system
node test-emma-function-calling.js

# Diagnose Vercel deployment
bash diagnose-vercel-deployment.sh

# Monitor deployment status
bash monitor-deployment.sh
```

### Deployment
```bash
# Deploy to GitHub Pages (legacy)
npm run deploy

# Deploy to Vercel (automatic via git push)
git push origin main
```

## Critical Architecture Patterns

### Multi-Source Data Fetching with Fallback

The platform implements a sophisticated fallback system for market data:

1. **Primary Source**: FMP (Financial Modeling Prep) via `/api/fmp.js`
2. **Fallback Chain**: Finnhub → Alpha Vantage → Yahoo Finance → Error
3. **Implementation**: `/api/marketdata.js` handles automatic source switching

When working with data APIs, always preserve the fallback mechanism to ensure reliability.

### Emma AI™ - Function Calling Agent System

Emma is the core AI assistant with two operational modes:

**Mode 1: Direct Chat** (`/api/gemini/chat.js`)
- Simple Q&A without real-time data
- Uses Gemini 2.0 Flash with custom system prompt
- Prompt stored in `localStorage` key: `emma-financial-prompt`

**Mode 2: Smart Agent** (`/api/emma-agent.js`)
- Intelligent function calling with tool selection
- Automatic scoring and fallback mechanisms
- Integrates with Perplexity for response generation
- Tool configurations: `config/tools_config.json`
- Usage statistics: `config/usage_stats.json`

### JSLAI™ Score System

Custom proprietary scoring algorithm for stock evaluation:

**Components** (7 weighted factors):
1. Valuation (P/E, P/FCF vs historical)
2. Profitability (margins, ROE)
3. Growth (revenue, earnings trends)
4. Financial Health (debt, current ratio)
5. Momentum (RSI, moving averages)
6. Moat (competitive advantages)
7. Sector Position (relative performance)

**Implementation**: Backend calculations in `/api/*` endpoints, frontend display in `beta-combined-dashboard.html`

### Serverless Function Configuration

All API endpoints are Vercel Functions with specific timeout configurations in `vercel.json`:

- AI services (emma-agent, gemini): 30-60s timeout
- Market data: 10s timeout
- Cron jobs (briefing): 45-60s timeout

Function timeouts are critical - never remove the `vercel.json` configuration.

### Cron Jobs for Automated Briefings

Three daily automated briefings via `/api/briefing-cron.js`:
- Morning: 11:20 UTC (weekdays)
- Midday: 15:50 UTC (weekdays)
- Evening: 20:20 UTC (weekdays)

These run automatically on Vercel's infrastructure.

## Key Files & Their Purpose

### Main Application
- `src/App.tsx` - GOB launcher app (React component for managing financial apps)
- `public/beta-combined-dashboard.html` - Main financial dashboard (self-contained HTML+JS)
- `index.html` - Vite entry point

### API Layer
- `api/emma-agent.js` - Smart AI agent with function calling
- `api/gemini/chat.js` - Direct Gemini chat endpoint
- `api/gemini/tools.js` - Function declarations for Gemini
- `api/fmp.js` - FMP API health check
- `api/marketdata.js` - Unified market data endpoint with fallback
- `api/supabase-watchlist.js` - Watchlist management
- `api/emma-briefing.js` - Generate AI briefings
- `api/briefing-cron.js` - Automated briefing cron job

### Configuration
- `vercel.json` - Vercel deployment config (timeouts, cron, redirects)
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - TailwindCSS theme
- `vite.config.ts` - Vite build configuration
- `package.json` - Dependencies and scripts

### Documentation
- `docs/technical/COMPLETE_IMPLEMENTATION_PLAN.md` - Full implementation roadmap
- `docs/api/DOCUMENTATION_APIs.md` - API documentation and usage
- `docs/deployment/DEPLOYMENT.md` - Deployment instructions
- `README.md` - Project overview

## Environment Variables (Vercel)

### Required for Core Functionality
```bash
GEMINI_API_KEY          # Google Gemini 2.0 Flash (AI primary)
GITHUB_TOKEN            # GitHub data persistence
FMP_API_KEY            # Financial Modeling Prep (market data primary)
```

### Recommended for Reliability
```bash
FINNHUB_API_KEY        # Fallback market data
ALPHA_VANTAGE_API_KEY  # Fallback market data
TWELVE_DATA_API_KEY    # Fallback market data
ANTHROPIC_API_KEY      # Claude AI for advanced analysis
SUPABASE_URL           # Database
SUPABASE_KEY           # Database access
```

### Optional
```bash
NEWSAPI_KEY            # News data (Finnhub also provides news)
PERPLEXITY_API_KEY     # Enhanced AI responses (emma-agent)
```

## Common Development Workflows

### Adding a New API Endpoint
1. Create file in `api/` directory
2. Add CORS headers (see existing endpoints for pattern)
3. Add timeout configuration in `vercel.json`
4. Test locally with `node <file>.js` or via Vercel dev
5. Document in `docs/api/DOCUMENTATION_APIs.md`

### Modifying Emma's Behavior
1. System prompt: Edit in `api/gemini/chat.js` (line 83-107)
2. Function calling: Modify tool configs in `api/gemini/tools.js`
3. Smart agent: Edit scoring logic in `api/emma-agent.js`
4. Frontend: Update UI in relevant HTML dashboard files

### Working with the Dashboard
The main dashboard (`public/beta-combined-dashboard.html`) is a monolithic self-contained file combining:
- HTML structure
- Inline JavaScript (React-like components)
- Inline CSS
- Chart.js for visualizations

When editing, search for specific component functions (e.g., `JLabTab`, `EconomicCalendarTab`) to locate sections.

### Database Schema (Supabase)
- `watchlist` table: User's tracked stocks
- `historical_data` table: Price history for charting
- `news_cache` table: Cached news articles (reduces API calls)

Setup scripts in `supabase-*.sql` files.

## Important Notes

### Data Source Reliability
- **Never** add fake/demo data to production endpoints
- Always implement fallback chains for critical data
- Return proper HTTP error codes (503 for missing config, 500 for failures)

### AI Integration
- Emma's system prompt is critical - changes affect all user interactions
- Function calling is currently disabled in production (commented out) due to deployment issues
- Test AI changes thoroughly before deploying

### Vercel Deployment
- Default route (`/`) redirects to `/beta-combined-dashboard.html`
- All changes pushed to `main` branch auto-deploy
- Check deployment status: `vercel --prod`

### Python Scripts (Legacy)
Multiple Python scraper scripts exist for Seeking Alpha data extraction. These are **legacy** and not actively used. The platform now relies on API endpoints for real-time data.

## Troubleshooting

### APIs Returning Errors
1. Check `/api/status?test=true` endpoint
2. Verify environment variables: `vercel env ls`
3. Check API key validity and rate limits
4. Review fallback chain in `/api/marketdata.js`

### Build Failures
1. Check TypeScript errors: `npm run lint`
2. Verify dependencies: `npm install`
3. Clear cache: `rm -rf node_modules dist && npm install`

### Emma Not Responding
1. Check `GEMINI_API_KEY` in Vercel env
2. Test endpoint directly: `curl https://[app].vercel.app/api/gemini/chat`
3. Check browser console for frontend errors
4. Verify system prompt is being sent (network tab in DevTools)

## Recent Major Changes
- Rebranded from "IntelliStocks" to "JLab™"
- Removed all demo/fake data from APIs
- Implemented smart agent system for Emma
- Added automated daily briefings via cron
- Integrated multiple data source fallbacks
- Fixed JavaScript structure and error handling (Oct 2025)
