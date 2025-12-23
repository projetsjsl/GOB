# 🧪 JLAB Orchestrator - Complete Agent Reference

> **Current Version:** 14 Agents | **Last Updated:** December 23, 2024

## 📋 Agent Summary

| Agent | Purpose | Key Actions |
|-------|---------|-------------|
| `modelSelector` | AI model selection with skepticism | select_model, get_capabilities |
| `workflow` | Automation & scheduling | execute_workflow, schedule, list_workflows |
| `earnings` | Earnings calendar | daily_check, prepare_analysis |
| `news` | News monitoring | monitor_news, weekly_digest |
| `sms` | SMS communication | send_sms, send_briefing_sms |
| `data` | Market data fetching | get_stock_quote, get_company_data |
| `briefing` | Email briefings | generate_morning, generate_weekly |
| `mcp` | MCP tools access | perplexity_ask, supabase_query |
| `context` | Conversation memory | get_history, set_preferences |
| `analytics` | Usage tracking | get_stats, get_latency_report |
| `tools` | Function calling (OpenAI-style) | 10 structured tools |
| `research` | Deep financial analysis | analyze_stock, deep_dive, bull_bear |
| `portfolio` | Portfolio management | analyze_portfolio, suggest_rebalance |
| `alert` | Price alerts & notifications | create_alert, check_alerts |

---

## 🔬 Research Agent

Deep financial analysis combining multiple data sources.

```javascript
// Full stock analysis
emma.analyzeStock("AAPL")

// Comprehensive deep dive
emma.deepDive("MSFT")

// Bull/Bear case generation
emma.getBullBear("TSLA")

// Risk assessment with scoring
emma.assessRisk("NVDA")

// Investment thesis
emma.generateThesis("GOOGL", "bull")  // or "bear", "neutral"

// Peer comparison
emma.comparePeers("AAPL", ["MSFT", "GOOGL"])
```

---

## 💼 Portfolio Agent

Full portfolio management and optimization.

```javascript
// Create portfolio
emma.agent('portfolio', 'create_portfolio', {
  portfolioId: 'my_portfolio',
  name: 'Tech Growth',
  holdings: [
    { ticker: 'AAPL', shares: 100, costBasis: 150 },
    { ticker: 'MSFT', shares: 50, costBasis: 300 }
  ]
})

// Add holding
emma.agent('portfolio', 'add_holding', {
  portfolioId: 'my_portfolio',
  ticker: 'NVDA',
  shares: 20,
  costBasis: 450
})

// Analyze portfolio (P&L, allocation)
emma.agent('portfolio', 'analyze_portfolio', { portfolioId: 'my_portfolio' })

// Get dividend income
emma.agent('portfolio', 'get_dividends', { portfolioId: 'my_portfolio' })

// Rebalancing suggestions
emma.agent('portfolio', 'suggest_rebalance', { portfolioId: 'my_portfolio' })

// Optimize for objective
emma.agent('portfolio', 'optimize_portfolio', {
  portfolioId: 'my_portfolio',
  objective: 'income'  // or 'growth', 'value', 'balanced'
})
```

---

## 🔔 Alert Agent

Price alerts with multi-channel notifications.

```javascript
// Create price target alert
emma.agent('alert', 'create_alert', {
  ticker: 'AAPL',
  type: 'price_above',
  value: 200,
  channels: ['email', 'sms']
})

// Create movement alert
emma.agent('alert', 'create_alert', {
  ticker: 'TSLA',
  type: 'percent_change_up',
  value: 5,  // 5% movement
  channels: ['email']
})

// Set notification destination
emma.agent('alert', 'set_notification_channel', {
  channel: 'email',
  destination: 'your@email.com'
})

// Check all alerts against live data
emma.agent('alert', 'check_alerts')

// Get triggered history
emma.agent('alert', 'get_triggered_history', { limit: 20 })
```

---

## 🔧 Tools Agent (Function Calling)

OpenAI-compatible function calling for structured data.

```javascript
// List all available tools
emma.getTools()

// Real-time stock quote
emma.getStockQuote("AAPL")

// DCF valuation
emma.calculateDCF("MSFT", 10, 12)  // growthRate, discountRate

// Yield curve data
emma.getYieldCurve("us")  // or "canada", "both"

// Compare stocks
emma.executeTool('compare_stocks', {
  tickers: ['AAPL', 'MSFT', 'GOOGL'],
  metrics: ['price', 'pe', 'roe']
})

// Portfolio analysis
emma.executeTool('get_portfolio_analysis', {
  tickers: ['AAPL', 'MSFT', 'GOOGL'],
  weights: [0.4, 0.35, 0.25]
})
```

### Available Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| get_stock_price | Real-time quote | ticker |
| get_company_profile | Company info | ticker |
| get_financial_ratios | P/E, ROE, margins | ticker |
| get_earnings_calendar | Upcoming earnings | tickers |
| search_ticker | Find stocks | query |
| get_market_news | Latest news | ticker (optional) |
| get_yield_curve | US/Canada rates | country |
| get_portfolio_analysis | Multi-stock analysis | tickers |
| compare_stocks | Side-by-side | tickers |
| calculate_dcf | DCF valuation | ticker, growthRate |

---

## 📊 Analytics Agent

Usage tracking and performance metrics.

```javascript
// Get usage stats
emma.getAnalytics("24h")  // "1h", "7d", "30d", "all"

// Latency report (p50, p90, p95, p99)
emma.getLatencyReport()

// Export all analytics
emma.exportAnalytics()

// Track a request manually
emma.agent('analytics', 'track_request', {
  model: 'gpt-4o',
  persona: 'finance',
  duration: 1500,
  success: true
})
```

---

## 💬 Context Agent

Conversation memory and session management.

```javascript
// Get conversation history
emma.getHistory()

// Clear history
emma.clearHistory()

// Set user preferences
emma.setPreferences({
  persona: 'finance',
  language: 'fr',
  detailLevel: 'detailed'
})

// Get full session context
emma.getContext()
```

---

## 🔌 MCP Agent

Model Context Protocol tools access.

```javascript
// List MCP tools
emma.listMCPTools()

// Perplexity web search
emma.perplexityAsk("Latest news on AAPL earnings")

// Supabase query
emma.supabaseQuery("SELECT * FROM stocks WHERE ticker = 'AAPL'")

// Generic MCP call
emma.callMCP('perplexity-ask', 'perplexity_ask', { query: 'test' })
```

---

## 🎭 Personas

8 Emma personalities, each with unique style and expertise.

| Persona | Focus | Use For |
|---------|-------|---------|
| `finance` | Stocks, dividends | Portfolio analysis, valuations |
| `critic` | Risk, skepticism | Red flags, contrarian views |
| `researcher` | Deep research | Long-form analysis, citations |
| `writer` | Professional docs | Briefings, reports, emails |
| `geek` | Technical analysis | Charts, patterns, RSI/MACD |
| `ceo` | Strategy | Executive summaries, decisions |
| `macro` | Macroeconomics | Rates, inflation, GDP |
| `politics` | Policy | Regulations, elections |

```javascript
// Use specific persona
emma.askFinance("Analyse AAPL")
emma.askCritic("Risques Tesla")
emma.askResearcher("Deep dive NVDA")
emma.askCEO("Summary for board")
```

---

## ⚡ Quick Start

```javascript
// In browser console:
emma.help()  // Show all commands

// Chat
emma.ask("Analyse AAPL")

// Research
emma.deepDive("MSFT")

// Portfolio
emma.agent('portfolio', 'create_portfolio', {
  portfolioId: 'test',
  holdings: [{ ticker: 'AAPL', shares: 100, costBasis: 150 }]
})

// Alert
emma.agent('alert', 'create_alert', {
  ticker: 'AAPL',
  type: 'price_above',
  value: 200,
  channels: ['email']
})

// Analytics
emma.getAnalytics("24h")
```

---

## 🏗️ Architecture

```
                           User Request
                                │
                                ▼
                    ┌───────────────────────┐
                    │   /api/orchestrator   │
                    │   Universal Entry     │
                    └───────────┬───────────┘
                                │
                                ▼
            ┌───────────────────────────────────────┐
            │         MASTER ORCHESTRATOR           │
            │                                       │
            │  • Intent Classification              │
            │  • Persona Selection                  │
            │  • Agent Routing                      │
            │  • Result Synthesis                   │
            └───────────────────┬───────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Core Agents │   │ Data Agents   │   │ Action Agents │
│               │   │               │   │               │
│ modelSelector │   │ data          │   │ portfolio     │
│ workflow      │   │ tools         │   │ alert         │
│ context       │   │ research      │   │ briefing      │
│ analytics     │   │ news          │   │ sms           │
│ mcp           │   │ earnings      │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

*Generated by JLAB AI Laboratory*
