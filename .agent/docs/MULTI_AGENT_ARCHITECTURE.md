# 🧠 GOB Multi-Agent Orchestrator Architecture

## Executive Summary

This document outlines a comprehensive multi-agent architecture for GOB (Gestion Optimisée Boursière) that unifies:

- **Emma AI Personalities** (Finance, CEO, Critic, Researcher, Writer, Geek)
- **3P1 Financial Analysis Pro** (Unified stock analysis platform)
- **Specialized Subagents** (News, Earnings, Portfolio, Macro)

---

## 📊 Current System Inventory

### Existing Emma Personalities (EmmaIA App)

| Personality | ID | Role | Model | Avatar | System Prompt |
|-------------|-----|------|-------|--------|---------------|
| **Emma BOURSE** | `finance` | Analyste Boursier & Financier | sonar-pro | ia.png | DEFAULT_SYSTEM_INSTRUCTION |
| **Emma MACRO** | `economy` | Analyste Économique & Macro | sonar-pro | professional.png | DEFAULT_SYSTEM_INSTRUCTION |
| **Emma POLITIQUE** | `politics` | Analyste Politique | sonar-pro | professional.png | DEFAULT_SYSTEM_INSTRUCTION |
| **Dr. Emma RECHERCHE** | `researcher` | Chercheur & Académique | sonar-pro | chercheur.png | RESEARCHER_SYSTEM_INSTRUCTION |
| **Emma GEEK** | `geek` | Analyste Technique (patterns, RSI, MACD) | gemini-3-flash | data.png | TECHNICAL_SYSTEM_INSTRUCTION |
| **Emma RÉDACTION** | `writer` | Rédactrice (briefings, lettres) | gemini-3-pro | ecrivain_auteur.png | WRITER_SYSTEM_INSTRUCTION |
| **Emma AVOCAT DU DIABLE** | `critic` | Critique & Contrarian | claude-3.5-sonnet | avocat.png | CRITIC_SYSTEM_INSTRUCTION |
| **CEO Mode** | `ceo` | Simule un CEO répondant aux questions | gemini/claude | entrepreneur.png | CEO_SYSTEM_INSTRUCTION_TEMPLATE |
| **Tavus Video** | `tavus` | Avatar vidéo interactif | gemini-live | emma-avatar.jpg | DEFAULT_TAVUS_CONTEXT |

### Existing Agents (lib/agents/)

| Agent | File | Status | Capabilities |
|-------|------|--------|--------------|
| EarningsCalendarAgent | earnings-calendar-agent.js | ✅ Built | Yearly calendar, daily checks, pre-earnings analysis |
| EarningsResultsAgent | earnings-results-agent.js | ✅ Built | Post-earnings analysis, surprise tracking |
| NewsMonitoringAgent | news-monitoring-agent.js | ✅ Built | 15min monitoring, importance scoring, weekly digest |

### Existing Tools (lib/tools/)

| Tool | Purpose |
|------|---------|
| fmp-quote-tool.js | Real-time stock prices |
| fmp-fundamentals-tool.js | Financial statements |
| fmp-key-metrics-tool.js | P/E, ROE, margins |
| fmp-ratios-tool.js | Financial ratios |
| fmp-ratings-tool.js | Analyst ratings |
| finnhub-news-tool.js | News aggregation |
| twelve-data-technical.js | RSI, MACD, Bollinger |
| calculator-tool.js | Financial calculations |
| earnings-calendar-tool.js | Upcoming earnings |
| economic-calendar-tool.js | Fed meetings, macro events |

---

## 🎯 Proposed Multi-Agent Architecture

### High-Level Architecture

```
                           ┌──────────────────────────────────────┐
                           │       MASTER ORCHESTRATOR            │
                           │    (Central Brain / Task Router)      │
                           │                                      │
                           │  • Intent Classification (NLU)       │
                           │  • Agent Selection & Routing         │
                           │  • Task Decomposition                │
                           │  • Result Aggregation                │
                           │  • Personality Management            │
                           └────────────────┬─────────────────────┘
                                            │
        ┌───────────────────┬───────────────┼───────────────┬───────────────────┐
        │                   │               │               │                   │
        ▼                   ▼               ▼               ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ PERSONA LAYER │  │  3P1 AGENT    │  │ RESEARCH      │  │ MONITORING    │  │ DELIVERY      │
│               │  │               │  │ AGENT         │  │ AGENT         │  │ AGENT         │
│ • Finance     │  │ • KPI Engine  │  │               │  │               │  │               │
│ • CEO         │  │ • Valueline   │  │ • Perplexity  │  │ • News 15min  │  │ • SMS/Twilio  │
│ • Critic      │  │ • Multi-user  │  │ • Deep dive   │  │ • Earnings    │  │ • Email/Resend│
│ • Researcher  │  │ • Sync system │  │ • Comparisons │  │ • Price alert │  │ • Dashboard   │
│ • Writer      │  │ • Scoring     │  │ • Sector      │  │ • Macro       │  │ • PDF export  │
│ • Geek/Tech   │  │ • Charts      │  │               │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
        │                   │               │               │                   │
        └───────────────────┴───────────────┴───────────┬───┴───────────────────┘
                                                        │
                                            ┌───────────┴───────────┐
                                            │    TOOL LAYER         │
                                            │                       │
                                            │ • FMP APIs            │
                                            │ • Finnhub             │
                                            │ • Twelve Data         │
                                            │ • Yahoo Finance       │
                                            │ • Polygon             │
                                            │ • Supabase            │
                                            └───────────────────────┘
```

---

## 🤖 Agent Specifications

### 1. Master Orchestrator (`lib/orchestrator/master-orchestrator.js`)

**Purpose**: Central brain that routes tasks to appropriate agents and personalities.

```javascript
class MasterOrchestrator {
    constructor() {
        this.personas = new PersonaManager();      // Emma personalities
        this.agents = {
            '3p1': new ThreePOneAgent(),           // Financial analysis pro
            research: new ResearchAgent(),          // Deep dives
            monitoring: new MonitoringAgent(),      // Alerts
            portfolio: new PortfolioAgent(),        // Watchlist
            delivery: new DeliveryAgent(),          // SMS/Email
            calendar: new CalendarAgent(),          // Earnings/events
            macro: new MacroAgent()                 // Yield curves, Fed
        };
    }

    async process(userMessage, context) {
        // 1. Select personality based on context/preference
        const persona = await this.personas.select(context);
        
        // 2. Classify intent and select agents
        const { intent, agents } = await this.classify(userMessage, persona);
        
        // 3. Execute agents in parallel/sequence
        const results = await this.executeAgents(agents, userMessage, context);
        
        // 4. Synthesize with selected persona's style
        return this.synthesize(results, persona);
    }
}
```

### 2. Persona Manager (`lib/orchestrator/persona-manager.js`)

**Purpose**: Manages all Emma personalities with their system prompts and styles.

```javascript
class PersonaManager {
    constructor() {
        this.personas = {
            finance: {
                id: 'finance',
                name: 'Emma IA • BOURSE',
                model: 'sonar-pro',
                promptKey: 'prompts.finance_identity',  // From emma-config
                style: 'analytical',
                capabilities: ['stock_analysis', 'technical', 'fundamentals']
            },
            critic: {
                id: 'critic',
                name: 'Emma IA • AVOCAT DU DIABLE',
                model: 'claude-3.5-sonnet',
                promptKey: 'prompts.critic_identity',
                style: 'contrarian',
                capabilities: ['risk_analysis', 'counter_arguments']
            },
            researcher: {
                id: 'researcher',
                name: 'Dr. Emma • RECHERCHE',
                model: 'sonar-pro',
                promptKey: 'prompts.researcher_identity',
                style: 'academic',
                capabilities: ['deep_research', 'citations', 'data']
            },
            writer: {
                id: 'writer',
                name: 'Emma IA • RÉDACTION',
                model: 'gemini-3-pro',
                promptKey: 'prompts.writer_identity',
                style: 'eloquent',
                capabilities: ['briefings', 'letters', 'reports']
            },
            geek: {
                id: 'geek',
                name: 'Emma IA • GEEK',
                model: 'gemini-3-flash',
                promptKey: 'prompts.technical_identity',
                style: 'technical',
                capabilities: ['charts', 'patterns', 'indicators']
            },
            ceo: {
                id: 'ceo',
                name: 'CEO Mode',
                model: 'claude-3.5-sonnet',
                promptKey: 'prompts.ceo_template',
                style: 'executive',
                capabilities: ['strategy', 'vision', 'leadership']
            },
            macro: {
                id: 'macro',
                name: 'Emma IA • MACRO',
                model: 'sonar-pro',
                promptKey: 'prompts.macro_identity',
                style: 'macroeconomic',
                capabilities: ['yield_curves', 'fed', 'inflation']
            },
            politics: {
                id: 'politics',
                name: 'Emma IA • POLITIQUE',
                model: 'sonar-pro',
                promptKey: 'prompts.politics_identity',
                style: 'geopolitical',
                capabilities: ['elections', 'policy', 'trade']
            }
        };
    }

    async select(context) {
        // Auto-select based on query type or use explicit preference
        if (context.persona) return this.personas[context.persona];
        
        // Default routing logic
        if (context.intent === 'technical_analysis') return this.personas.geek;
        if (context.intent === 'risk_analysis') return this.personas.critic;
        if (context.intent === 'briefing') return this.personas.writer;
        if (context.intent === 'macro') return this.personas.macro;
        
        return this.personas.finance; // Default
    }
}
```

### 3. 3P1 Agent (`lib/agents/3p1-agent.js`)

**Purpose**: Unified financial analysis platform agent.

```javascript
class ThreePOneAgent extends BaseAgent {
    constructor() {
        super('3P1Agent', [
            'unified_stock_analysis',
            'kpi_scoring',
            'valueline_comparison',
            'multi_user_sync',
            'comprehensive_report'
        ]);
        
        this.kpiEngine = new KPIEngine();
        this.syncManager = new SyncManager();
    }

    async execute(task, context) {
        const { ticker, analysisType } = task;
        
        // Gather all data sources
        const [quote, fundamentals, technicals, news, valueline] = await Promise.all([
            this.tools.fmpQuote.execute(ticker),
            this.tools.fmpFundamentals.execute(ticker),
            this.tools.twelveDataTech.execute(ticker),
            this.tools.finnhubNews.execute(ticker),
            this.tools.valuelineData.execute(ticker)
        ]);

        // Calculate KPI scores
        const kpis = this.kpiEngine.calculate({
            quote, fundamentals, technicals, valueline
        });

        // Generate comprehensive report
        return {
            ticker,
            summary: this.generateSummary(kpis),
            kpis,
            data: { quote, fundamentals, technicals, news },
            recommendation: this.generateRecommendation(kpis),
            lastUpdated: new Date().toISOString()
        };
    }
}
```

### 4. Research Agent (`lib/agents/research-agent.js`)

**Purpose**: Deep research with Perplexity integration.

```javascript
class ResearchAgent extends BaseAgent {
    constructor() {
        super('ResearchAgent', [
            'deep_dive_analysis',
            'sector_comparison',
            'competitive_analysis',
            'historical_context'
        ]);
        
        this.perplexity = new PerplexityClient();
    }

    async execute(task, context) {
        const { query, tickers, depth } = task;
        
        // Use Perplexity for deep research
        const research = await this.perplexity.generate(
            this.buildResearchPrompt(query, tickers),
            { recency: 'day', max_tokens: 4000 }
        );
        
        return {
            content: research.content,
            citations: research.citations,
            tickers,
            depth,
            generatedAt: new Date().toISOString()
        };
    }
}
```

### 5. Monitoring Agent (`lib/agents/monitoring-agent.js`)

**Purpose**: Continuous monitoring and alerting.

```javascript
class MonitoringAgent extends BaseAgent {
    constructor() {
        super('MonitoringAgent', [
            'news_monitoring',
            'price_alerts',
            'earnings_watch',
            'macro_events'
        ]);
        
        this.newsAgent = new NewsMonitoringAgent();
        this.earningsAgent = new EarningsCalendarAgent();
    }

    async execute(task, context) {
        const { monitorType, tickers, thresholds } = task;
        
        switch (monitorType) {
            case 'news':
                return this.newsAgent.monitorNews(tickers);
            case 'earnings':
                return this.earningsAgent.dailyEarningsCheck();
            case 'price':
                return this.checkPriceAlerts(tickers, thresholds);
            case 'macro':
                return this.checkMacroEvents();
        }
    }
}
```

### 6. Delivery Agent (`lib/agents/delivery-agent.js`)

**Purpose**: Multi-channel delivery (SMS, Email, Push).

```javascript
class DeliveryAgent extends BaseAgent {
    constructor() {
        super('DeliveryAgent', [
            'sms_delivery',
            'email_delivery',
            'dashboard_push',
            'pdf_generation'
        ]);
    }

    async execute(task, context) {
        const { channel, content, recipients } = task;
        
        switch (channel) {
            case 'sms':
                return this.sendSMS(content, recipients);
            case 'email':
                return this.sendEmail(content, recipients);
            case 'dashboard':
                return this.pushToDashboard(content);
            case 'pdf':
                return this.generatePDF(content);
        }
    }
}
```

---

## 🔄 Agent Communication Protocol

### Message Format

```javascript
{
    messageId: 'uuid',
    from: 'MasterOrchestrator',
    to: 'ResearchAgent',
    type: 'TASK',
    payload: {
        action: 'deep_dive_analysis',
        ticker: 'AAPL',
        context: { persona: 'finance', depth: 'comprehensive' }
    },
    replyTo: 'uuid-callback',
    timestamp: '2024-12-22T19:00:00Z'
}
```

### Execution Flow

```
User Query: "Analyse NVDA en mode critique et alerte-moi si earnings battent"

1. MasterOrchestrator.process()
   ├── persona = 'critic' (detected from "en mode critique")
   ├── agents = [ResearchAgent, 3P1Agent, MonitoringAgent]
   └── decompose into subtasks

2. Parallel Execution:
   ├── ResearchAgent → Deep NVDA analysis with Perplexity
   ├── 3P1Agent → KPI scoring and fundamentals
   └── MonitoringAgent.setAlert → Earnings watch for NVDA

3. Synthesis:
   └── Combine results with Critic persona style (contrarian view)

4. Delivery:
   └── Dashboard + SMS alert registration
```

---

## 📁 Proposed File Structure

```
lib/
├── orchestrator/
│   ├── master-orchestrator.js      # Central brain
│   ├── persona-manager.js          # Emma personalities
│   ├── task-router.js              # Intent → Agent routing
│   └── result-aggregator.js        # Combines agent outputs
│
├── agents/
│   ├── base-agent.js               # Abstract base class
│   ├── 3p1-agent.js                # Financial Analysis Pro
│   ├── research-agent.js           # Perplexity deep dives
│   ├── monitoring-agent.js         # Alerts and watches
│   ├── portfolio-agent.js          # Watchlist management
│   ├── delivery-agent.js           # SMS, Email, Push
│   ├── macro-agent.js              # Yield curves, Fed
│   ├── earnings-calendar-agent.js  # (existing)
│   ├── earnings-results-agent.js   # (existing)
│   └── news-monitoring-agent.js    # (existing)
│
├── tools/                          # (existing - 19 tools)
│
└── personas/
    ├── finance-persona.js
    ├── critic-persona.js
    ├── researcher-persona.js
    ├── writer-persona.js
    ├── geek-persona.js
    ├── ceo-persona.js
    ├── macro-persona.js
    └── politics-persona.js
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Create `BaseAgent` abstract class
- [ ] Implement `MasterOrchestrator`
- [ ] Implement `PersonaManager`
- [ ] Migrate existing agents to new interface

### Phase 2: Core Agents (Week 3-4)

- [ ] Build `3P1Agent` (unify existing 3P1 logic)
- [ ] Build `ResearchAgent` (Perplexity integration)
- [ ] Build `PortfolioAgent` (watchlist management)
- [ ] Build `MacroAgent` (yield curves, Fed)

### Phase 3: Personas (Week 5)

- [ ] Migrate all persona prompts to emma-config
- [ ] Implement persona-based response styling
- [ ] Add persona switching in UI

### Phase 4: Integration (Week 6)

- [ ] Connect to existing API endpoints
- [ ] Update frontend components
- [ ] End-to-end testing
- [ ] Documentation

---

## 📝 Configuration (emma-config)

All prompts and agent configs stored in Supabase `emma_system_config`:

| Section | Key | Description |
|---------|-----|-------------|
| `prompts` | `finance_identity` | Emma BOURSE persona |
| `prompts` | `critic_identity` | Avocat du Diable persona |
| `prompts` | `researcher_identity` | Dr. Emma persona |
| `prompts` | `writer_identity` | Rédaction persona |
| `prompts` | `technical_identity` | Geek persona |
| `prompts` | `ceo_template` | CEO simulation template |
| `agents` | `3p1_config` | 3P1 agent settings |
| `agents` | `monitoring_intervals` | Alert frequencies |
| `routing` | `intent_to_agent` | Intent → Agent mapping |

---

## 🎯 Benefits

1. **Unified Interface**: Single entry point for all AI capabilities
2. **Specialized Expertise**: Each agent masters its domain
3. **Personality**: Emma adapts tone/style to context
4. **Scalability**: Easy to add new agents
5. **Maintainability**: Clear separation of concerns
6. **Configurability**: All prompts in emma-config
7. **Parallelism**: Agents execute concurrently when possible

---

*Document created: 2024-12-22*
*Author: AI Architecture Session*
