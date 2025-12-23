# 🧪 JLAB - AI Laboratory Architecture

## Vision: All-in-One AI Laboratory

**JLAB** (JSL AI Laboratory) is the unified AI platform that powers all intelligent features in GOB.
The **MasterOrchestrator** is the central brain that routes all AI requests.

---

## 🎯 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              JLAB AI LABORATORY                                   │
│                        "One Entry Point, All AI Power"                            │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│                           ┌──────────────────────┐                                │
│                           │   /api/orchestrator  │ ◄── Universal Entry Point     │
│                           │                      │                                │
│                           │  • Chat messages     │                                │
│                           │  • Agent calls       │                                │
│                           │  • Workflow triggers │                                │
│                           └──────────┬───────────┘                                │
│                                      │                                            │
│                                      ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                         MASTER ORCHESTRATOR                                │   │
│  │                      lib/orchestrator/master-orchestrator.js               │   │
│  │                                                                            │   │
│  │  ► Analyzes intent    ► Selects persona    ► Routes to agents             │   │
│  │  ► Aggregates results ► Manages context    ► Applies skepticism           │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                    │                                      │                       │
│                    ▼                                      ▼                       │
│  ┌────────────────────────────────┐      ┌────────────────────────────────────┐  │
│  │      PERSONA MANAGER           │      │       SPECIALIZED AGENTS            │  │
│  │                                │      │                                     │  │
│  │  🎯 8 Emma Personalities:      │      │  📊 DataAgent      → Market data    │  │
│  │                                │      │  📰 NewsAgent      → News monitoring│  │
│  │  • finance  → Stocks/Portfolio │      │  📅 EarningsAgent  → Earnings cal.  │  │
│  │  • critic   → Risk analysis    │      │  📧 BriefingAgent  → Email reports  │  │
│  │  • researcher → Deep research  │      │  📱 SMSAgent       → Mobile comm.   │  │
│  │  • writer   → Professional docs│      │  ⚙️ WorkflowAgent  → Automation     │  │
│  │  • geek     → Technical charts │      │                                     │  │
│  │  • ceo      → Executive summary│      │  ┌─────────────────────────────────┐│  │
│  │  • macro    → Macroeconomics   │      │  │    MODEL SELECTOR AGENT        ││  │
│  │  • politics → Policy impact    │      │  │                                 ││  │
│  │                                │      │  │  • Skepticism for real-time     ││  │
│  │  Each persona has:             │      │  │  • Multi-source corroboration   ││  │
│  │  - Unique system prompt        │      │  │  • Smart model selection        ││  │
│  │  - Preferred model             │      │  │  • Perplexity for citations     ││  │
│  │  - Specialized tools           │      │  │  • Gemini for grounding         ││  │
│  └────────────────────────────────┘      │  └─────────────────────────────────┘│  │
│                                          └────────────────────────────────────────┘  │
│                                                                                   │
│  ═══════════════════════════════════════════════════════════════════════════════ │
│                                   LLM LAYER                                       │
│  ═══════════════════════════════════════════════════════════════════════════════ │
│                                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  PERPLEXITY │  │   GEMINI    │  │  ANTHROPIC  │  │        OPENAI           │  │
│  │             │  │             │  │             │  │                         │  │
│  │  • Sonar    │  │  • Flash    │  │  • Claude   │  │  • GPT-4o               │  │
│  │  • Pro      │  │  • Pro      │  │  • Sonnet   │  │  • GPT-4 Turbo          │  │
│  │             │  │             │  │  • Haiku    │  │                         │  │
│  │  ⭐ Web     │  │  ⭐ Ground   │  │  ⭐ Reason  │  │  ⭐ General             │  │
│  │   Search    │  │   ing       │  │   ing       │  │   Purpose               │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
lib/orchestrator/
├── master-orchestrator.js   # Central brain - routes all AI requests
├── persona-manager.js       # 8 Emma personalities with prompts
├── model-selector-agent.js  # Smart model selection + skepticism
├── base-agent.js            # Base class for all agents
├── agent-registry.js        # Registers all agents
└── workflow-agent.js        # Automation & scheduling

api/
└── orchestrator.js          # Universal REST API endpoint

public/js/
├── orchestrator-client.js   # Frontend SDK (window.orchestratorClient)
└── dashboard/components/tabs/
    ├── AskEmmaTab.js        # Integrated with orchestrator (feature flag)
    └── JLabTab.js           # Financial terminal (uses DataAgent)
```

---

## 🔌 Usage Examples

### From Any Frontend Code

```javascript
// Load the client (already in dashboard)
// <script src="/js/orchestrator-client.js"></script>

// Simple chat
const response = await orchestratorClient.ask("Analyse AAPL");

// With specific persona
const criticAnalysis = await orchestratorClient.askCritic("What are the risks of TSLA?");

// Direct agent call
const stockData = await orchestratorClient.getStockQuote("MSFT");
const news = await orchestratorClient.getNews(["AAPL", "GOOGL"]);

// Run a workflow
await orchestratorClient.runWorkflow("morning_briefing");
```

### From API (cURL/fetch)

```bash
# Chat request
curl -X POST https://gobapps.com/api/orchestrator \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyse AAPL", "persona": "finance"}'

# Agent request
curl -X POST https://gobapps.com/api/orchestrator \
  -H "Content-Type: application/json" \
  -d '{"agent": "data", "action": "get_stock_quote", "ticker": "AAPL"}'
```

### From Console (Developer Tools)

```javascript
// Type in browser console:
orchestratorClient.help()  // Show all commands

// Quick tests:
emma.ask("What's the S&P 500 doing?")
emma.askFinance("NVDA valuation")
emma.getStockQuote("TSLA")
```

---

## 🎭 Persona Details

| Persona | Focus | Best For | Model Priority |
|---------|-------|----------|----------------|
| finance | 📊 Stocks | Valuation, dividends, portfolio | Perplexity Pro |
| critic | ⚖️ Risk | Contrarian analysis, red flags | Claude |
| researcher | 🔬 Deep | Long-form research, citations | Perplexity Pro |
| writer | ✍️ Docs | Reports, emails, briefings | GPT-4o |
| geek | 📈 Tech | Charts, patterns, RSI | Gemini |
| ceo | 👔 Strategy | Executive summary, decisions | GPT-4o |
| macro | 🌍 Econ | Rates, inflation, GDP | Perplexity |
| politics | 🏛️ Policy | Regulations, elections | Claude |

---

## 🔧 Configuration

### Enable Orchestrator in AskEmma

```javascript
// In browser console:
localStorage.setItem('emma-use-orchestrator', 'true');
localStorage.setItem('emma-orchestrator-persona', 'finance');

// Then refresh the page
```

### Override Persona Selection

```javascript
// The orchestrator auto-selects persona, but you can force one:
fetch('/api/orchestrator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Analyse Tesla",
    persona: "critic"  // Force critic persona
  })
});
```

---

## 🚀 Roadmap

### Phase 1: Foundation ✅

- [x] MasterOrchestrator core
- [x] 8 Emma personas
- [x] Model selection with skepticism
- [x] Agent registry
- [x] REST API endpoint
- [x] Frontend client
- [x] AskEmmaTab integration

### Phase 2: Full Integration

- [ ] JLabTab → uses orchestrator.DataAgent
- [ ] GroupChatTab → uses orchestrator for multi-agent
- [ ] EmmaIA App → full orchestrator integration
- [ ] Migrate all prompts to Supabase

### Phase 3: Advanced Features

- [ ] WorkflowAgent cron scheduling
- [ ] Real-time streaming responses
- [ ] Memory/context persistence
- [ ] Multi-user personalization

---

## 📊 Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Personas | 8 | 8 |
| Agents | 6 | 10 |
| API response time | ~2s | <1.5s |
| Model selection accuracy | 85% | 95% |
| Code coverage | 10% | 60% |

---

*Last updated: 2024-12-23*
