# Structure report

This report lists the app structure by layer and function. ASCII only.

## Top level entry points
- src/main.tsx -> src/App.tsx -> src/components/BetaCombinedDashboard.tsx
- index.html, vite.config.ts, vercel.json

## React app tabs (active nav)
1. stocks-news | label: Stocks & News | component: StocksNewsTab | desc: stocks list and news feed
2. finance-pro | label: Finance Pro | component: FinanceProTab | desc: finance snapshots and valuation
3. nouvelles | label: Nouvelles | component: NouvellesTab | desc: news hub with filters and sub tabs
4. intellistocks | label: IntelliStocks | component: IntelliStocksTab | desc: AI stock analysis and signals
5. email-briefings | label: Briefings | component: EmailBriefingsTab | desc: email briefing admin tools
6. watchlist | label: Watchlist | component: DansWatchlistTab | desc: watchlist tools
7. economic-calendar | label: Calendar | component: EconomicCalendarTab | desc: economic calendar
8. yield-curve | label: Yield Curve | component: YieldCurveTab | desc: yield curve views
9. advanced-analysis | label: Analyse Pro | component: AdvancedAnalysisTab | desc: advanced analysis tools
10. ask-emma | label: Emma IATM | component: AskEmmaTab | desc: Emma assistant UI
11. emma-config | label: Emma Config | component: EmmaConfigTab | desc: link to Emma config page
12. testonly | label: Test Only | component: TestOnlyTab | desc: test only page
13. admin-jslai | label: Admin | component: AdminJSLaiTab | desc: admin tools
14. plus | label: Plus | component: PlusTab | desc: extra tools hub

## React app tabs (defined but not in nav)
1. scrapping-sa | component: ScrappingSATab | desc: Seeking Alpha scraping admin
2. seeking-alpha | component: SeekingAlphaTab | desc: Seeking Alpha feed
3. investing-calendar | component: InvestingCalendarTab | desc: market quotes widget
4. markets-economy | component: MarketsEconomyTab | desc: markets and economy dashboard

## React app sub tabs (NouvellesTab)
1. all | label: Toutes
2. french | label: Francais
3. by-source | label: Par Source
4. by-market | label: Par Marche
5. ground | label: Ground News

## React app internal sections (EmailBriefingsTab)
1. EmailRecipientsManager
2. PromptManager
3. ScheduleManager
4. EmailPreviewManager

## Legacy HTML dashboards
- public/beta-combined-dashboard.html
- public/beta-combined-dashboard-modular.html
- public/js/dashboard/tab-lazy-loader.js (tab id map)

## Legacy tab map grouped by component
1. /js/dashboard/components/tabs/AdminJSLaiTab.js | ids: admin-jsla | desc: admin tools
2. /js/dashboard/components/tabs/AdvancedAnalysisTab.js | ids: advanced-analysis, jlab-advanced | desc: advanced analysis tools
3. /js/dashboard/components/tabs/AskEmmaTab.js | ids: ask-emma, emma-chat | desc: Emma chat UI
4. /js/dashboard/components/tabs/ChatGPTGroupTab.js | ids: groupchat, emma-group | desc: group chat UI
5. /js/dashboard/components/tabs/CurveWatchTab.js | ids: jlab-curvewatch | desc: curve watch
6. /js/dashboard/components/tabs/DansWatchlistTab.js | ids: dans-watchlist | desc: watchlist tools
7. /js/dashboard/components/tabs/EconomicCalendarTab.js | ids: economic-calendar, marches-calendar | desc: economic calendar
8. /js/dashboard/components/tabs/EmailBriefingsTab.js | ids: email-briefings, admin-briefings | desc: email briefing admin
9. /js/dashboard/components/tabs/EmmAIATab.js | ids: emmaia, emma-live | desc: Emma IA live embed
10. /js/dashboard/components/tabs/FastGraphsTab.js | ids: fastgraphs, admin-fastgraphs | desc: FastGraphs integration
11. /js/dashboard/components/tabs/FinVoxTab.js | ids: finvox, emma-finvox | desc: FinVox assistant
12. /js/dashboard/components/tabs/GroupChatTab.js | ids: tests-roboweb | desc: alt group chat UI
13. /js/dashboard/components/tabs/JLabTab.js | ids: jlab, jlab-terminal | desc: JLab tools
14. /js/dashboard/components/tabs/MarketsEconomyTab.js | ids: markets-economy, marches-global, investing-calendar, tests-calendar | desc: markets and economy dashboard
15. /js/dashboard/components/tabs/MarketsEconomyTabRGL.js | ids: marches-flex | desc: markets dashboard grid layout
16. /js/dashboard/components/tabs/PlusTab.js | ids: plus, admin-settings | desc: settings hub
17. /js/dashboard/components/tabs/ScrappingSATab.js | ids: scrapping-sa, admin-scraping | desc: SA scraping admin
18. /js/dashboard/components/tabs/SeekingAlphaTab.js | ids: seeking-alpha, titres-seeking | desc: Seeking Alpha feed
19. /js/dashboard/components/tabs/StocksNewsTab.js | ids: marches-nouvelles, nouvelles, stocks-news, titres-stocks, titres-portfolio, titres-watchlist | desc: stocks and news
20. /js/dashboard/components/tabs/TerminalEmmaIATab.js | ids: terminal-emmaia, emma-terminal | desc: Emma terminal UI
21. /js/dashboard/components/tabs/VoiceAssistantTab.js | ids: assistant-vocal, emma-vocal | desc: voice assistant UI
22. /js/dashboard/components/tabs/YieldCurveTab.js | ids: yield-curve, marches-yield | desc: yield curve views

Preload tabs: markets-economy

## Legacy tab component files
1. public/js/dashboard/components/tabs/AdminJSLaiTab.compiled.js
2. public/js/dashboard/components/tabs/AdminJSLaiTab.js
3. public/js/dashboard/components/tabs/AdvancedAnalysisModals.compiled.js
4. public/js/dashboard/components/tabs/AdvancedAnalysisModals.js
5. public/js/dashboard/components/tabs/AdvancedAnalysisTab.compiled.js
6. public/js/dashboard/components/tabs/AdvancedAnalysisTab.js
7. public/js/dashboard/components/tabs/AskEmmaTab.compiled.js
8. public/js/dashboard/components/tabs/AskEmmaTab.js
9. public/js/dashboard/components/tabs/ChatGPTGroupTab.compiled.js
10. public/js/dashboard/components/tabs/ChatGPTGroupTab.js
11. public/js/dashboard/components/tabs/CurveWatchTab.compiled.js
12. public/js/dashboard/components/tabs/CurveWatchTab.js
13. public/js/dashboard/components/tabs/DansWatchlistTab.compiled.js
14. public/js/dashboard/components/tabs/DansWatchlistTab.js
15. public/js/dashboard/components/tabs/EconomicCalendarTab.compiled.js
16. public/js/dashboard/components/tabs/EconomicCalendarTab.js
17. public/js/dashboard/components/tabs/EmailBriefingsTab.compiled.js
18. public/js/dashboard/components/tabs/EmailBriefingsTab.js
19. public/js/dashboard/components/tabs/EmmAIATab.compiled.js
20. public/js/dashboard/components/tabs/EmmAIATab.js
21. public/js/dashboard/components/tabs/EmmaSmsPanel.js
22. public/js/dashboard/components/tabs/FastGraphsTab.compiled.js
23. public/js/dashboard/components/tabs/FastGraphsTab.js
24. public/js/dashboard/components/tabs/FinVoxTab.compiled.js
25. public/js/dashboard/components/tabs/FinVoxTab.js
26. public/js/dashboard/components/tabs/GroupChatTab.compiled.js
27. public/js/dashboard/components/tabs/GroupChatTab.js
28. public/js/dashboard/components/tabs/InvestingCalendarTab.js
29. public/js/dashboard/components/tabs/JLabTab.compiled.js
30. public/js/dashboard/components/tabs/JLabTab.js
31. public/js/dashboard/components/tabs/JLabUnifiedTab.compiled.js
32. public/js/dashboard/components/tabs/JLabUnifiedTab.js
33. public/js/dashboard/components/tabs/MarketsEconomyTab.compiled.js
34. public/js/dashboard/components/tabs/MarketsEconomyTab.js
35. public/js/dashboard/components/tabs/MarketsEconomyTabRGL.compiled.js
36. public/js/dashboard/components/tabs/MarketsEconomyTabRGL.js
37. public/js/dashboard/components/tabs/PlusTab.compiled.js
38. public/js/dashboard/components/tabs/PlusTab.js
39. public/js/dashboard/components/tabs/ScrappingSATab.compiled.js
40. public/js/dashboard/components/tabs/ScrappingSATab.js
41. public/js/dashboard/components/tabs/SeekingAlphaTab.compiled.js
42. public/js/dashboard/components/tabs/SeekingAlphaTab.js
43. public/js/dashboard/components/tabs/StocksNewsTab.compiled.js
44. public/js/dashboard/components/tabs/StocksNewsTab.js
45. public/js/dashboard/components/tabs/TerminalEmmaIATab.compiled.js
46. public/js/dashboard/components/tabs/TerminalEmmaIATab.js
47. public/js/dashboard/components/tabs/VoiceAssistantTab.compiled.js
48. public/js/dashboard/components/tabs/VoiceAssistantTab.js
49. public/js/dashboard/components/tabs/YieldCurveLiteTab.compiled.js
50. public/js/dashboard/components/tabs/YieldCurveLiteTab.js
51. public/js/dashboard/components/tabs/YieldCurveTab.js

## Standalone apps under public/
1. public/3p1/
2. public/bienvenue/
3. public/emmaia-build/
4. public/finvox---assistant-financier/
5. public/finvox-build/
6. public/groupchat/
7. public/jslai/
8. public/nouveauclient/
9. public/ouellet-bolduc-ar/
10. public/test/
11. public/yieldcurveanalytics/

## Standalone html pages in public root
1. public/beta-combined-dashboard-modular.html | desc: dashboard page
2. public/beta-combined-dashboard.html | desc: dashboard page
3. public/curvewatch.html | desc: yield curve page
4. public/dashboard-rgl-example.html | desc: dashboard page
5. public/diagnose-dashboard.html | desc: dashboard page
6. public/emma-config.html | desc: emma related page
7. public/emma-demo.html | desc: emma related page
8. public/emma-quick-start.html | desc: emma related page
9. public/emma-test.html | desc: emma related page
10. public/finance-pro-dashboard.html | desc: dashboard page
11. public/financial-dashboard.html | desc: dashboard page
12. public/index.html | desc: static page
13. public/jlab-dashboard.html | desc: dashboard page
14. public/jlab-settings.html | desc: jlab page
15. public/jlab.html | desc: jlab page
16. public/login.html | desc: login page
17. public/minimal.html | desc: static page
18. public/roles-config.html | desc: roles config page
19. public/stock-research.html | desc: static page
20. public/stocksandnews.html | desc: static page
21. public/terminal-emma-ia.html | desc: emma related page
22. public/test-god-mode.html | desc: test page
23. public/test-integrations.html | desc: test page
24. public/test-perplexity-labs.html | desc: test page
25. public/test-simple.html | desc: test page
26. public/workflow-builder.html | desc: workflow builder

## API endpoints grouped by folder
- group: 3p1-sync-na
  - /api/3p1-sync-na
- group: _middleware
  - /api/_middleware/emma-cors
- group: adapters
  - /api/adapters/email
  - /api/adapters/messenger
  - /api/adapters/sms
- group: admin
  - /api/admin/email-to-sms
  - /api/admin/emma-config
  - /api/admin/llm-models
  - /api/admin/migrate-emma
  - /api/admin/redirects
  - /api/admin/sms-control
  - /api/admin/test-llm
  - /api/admin/tickers
  - /api/admin/unrecoverable-tickers
- group: admin-warehouse-status
  - /api/admin-warehouse-status
- group: ai-services
  - /api/ai-services
- group: announcement-bars
  - /api/announcement-bars
- group: app-config
  - /api/app-config
- group: auth
  - /api/auth
- group: briefing
  - /api/briefing
- group: briefing-cron
  - /api/briefing-cron
- group: briefing-prompts
  - /api/briefing-prompts
- group: briefing-schedule
  - /api/briefing-schedule
- group: briefing-simple
  - /api/briefing-simple
- group: calendar-dividends
  - /api/calendar-dividends
- group: calendar-earnings
  - /api/calendar-earnings
- group: chat
  - /api/chat
- group: chat-assistant
  - /api/chat-assistant
- group: chatbot-js
  - /api/chatbot-js
- group: config
  - /api/config/tickers
- group: credentials
  - /api/credentials
- group: cron
  - /api/cron/fmp-batch-sync
- group: cron-briefings
  - /api/cron-briefings
- group: data-explorer
  - /api/data-explorer
- group: db-cleanup
  - /api/db-cleanup
- group: email-design
  - /api/email-design
- group: email-recipients
  - /api/email-recipients
- group: emma-agent
  - /api/emma-agent
- group: emma-briefing
  - /api/emma-briefing
- group: emma-config
  - /api/emma-config
- group: emma-n8n
  - /api/emma-n8n
- group: fastgraphs-login
  - /api/fastgraphs-login
- group: finance-snapshots
  - /api/finance-snapshots
- group: finnhub
  - /api/finnhub
- group: finviz-news
  - /api/finviz-news
- group: finviz-why-moving
  - /api/finviz-why-moving
- group: fmp
  - /api/fmp
- group: fmp-batch-sync
  - /api/fmp-batch-sync
- group: fmp-company-data
  - /api/fmp-company-data
- group: fmp-company-data-batch
  - /api/fmp-company-data-batch
- group: fmp-company-data-batch-sync
  - /api/fmp-company-data-batch-sync
- group: fmp-search
  - /api/fmp-search
- group: fmp-sector-data
  - /api/fmp-sector-data
- group: fmp-stock-screener
  - /api/fmp-stock-screener
- group: fmp-sync
  - /api/fmp-sync
- group: format-preview
  - /api/format-preview
- group: gemini
  - /api/gemini/chat-validated
  - /api/gemini/chat
  - /api/gemini/tools
- group: gemini-key
  - /api/gemini-key
- group: gemini-proxy
  - /api/gemini-proxy
- group: github-update
  - /api/github-update
- group: groupchat
  - /api/groupchat/admin
  - /api/groupchat/chat
  - /api/groupchat/config
  - /api/groupchat/integrated/create-room
  - /api/groupchat/integrated/get-messages
  - /api/groupchat/integrated/get-participants
  - /api/groupchat/integrated/send-message
  - /api/groupchat/integrated/update-presence
  - /api/groupchat/simulate
  - /api/groupchat/test
  - /api/groupchat/workflows
- group: groupchat-env
  - /api/groupchat-env
- group: images
  - /api/images
- group: jslai-proxy
  - /api/jslai-proxy
- group: kpi-engine
  - /api/kpi-engine
- group: llm-models
  - /api/llm-models
- group: marketdata
  - /api/marketdata/batch
- group: news
  - /api/news
- group: orchestrator
  - /api/orchestrator
- group: orchestrator-stream
  - /api/orchestrator-stream
- group: prompt-delivery-config
  - /api/prompt-delivery-config
- group: prompt-delivery-schedule
  - /api/prompt-delivery-schedule
- group: remove-ticker
  - /api/remove-ticker
- group: roles-config
  - /api/roles-config
- group: rsi-screener
  - /api/rsi-screener
- group: scrape-seeking-alpha
  - /api/scrape-seeking-alpha
- group: seeking-alpha-batch
  - /api/seeking-alpha-batch
- group: seeking-alpha-data
  - /api/seeking-alpha-data
- group: seeking-alpha-scraping
  - /api/seeking-alpha-scraping
- group: seeking-alpha-tickers
  - /api/seeking-alpha-tickers
- group: send-briefing
  - /api/send-briefing
- group: send-email
  - /api/send-email
- group: supabase-conversation
  - /api/supabase-conversation
- group: supabase-daily-cache
  - /api/supabase-daily-cache
- group: supabase-watchlist
  - /api/supabase-watchlist
- group: team-tickers
  - /api/team-tickers
- group: terminal-data
  - /api/terminal-data
- group: theme-colors
  - /api/theme-colors
- group: tickers-config
  - /api/tickers-config
- group: tools
  - /api/tools/rsi-screener
  - /api/tools/stock-screener
- group: treasury-rates
  - /api/treasury-rates
- group: validation-settings
  - /api/validation-settings
- group: yield-curve
  - /api/yield-curve
- group: yield-curve-ai-analysis
  - /api/yield-curve-ai-analysis

## Config files
1. config/briefing-prompts.json
2. config/briefing-schedule.json
3. config/email-design.json
4. config/email-recipients.json
5. config/emma-cfa-prompt.js
6. config/intent-prompts.js
7. config/news-sources-scoring.json
8. config/perplexity-prompt.js
9. config/prompts/analysis-3pour1.txt
10. config/prompts/sms-ultra-concise.txt
11. config/prompts/web-enhanced.txt
12. config/theme-colors.json
13. config/tools_config.json
14. config/usage_stats.json

