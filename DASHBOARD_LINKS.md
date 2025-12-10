# 🔗 Dashboard Links & Structure

This document lists all available dashboard tabs and their direct links.
Since the dashboard is a Single Page Application (SPA), all links use the main URL with a `?tab=` parameter.

**Base URL:** `https://gobapps.com/jlab`

## 📋 Main Tabs

| Tab Name | ID (Parameter) | Direct Link | Component File |
|----------|---------------|-------------|----------------|
| **JLab™ (Unified)** | `intellistocks` | [Open Tab](https://gobapps.com/jlab?tab=intellistocks) | `JLabUnifiedTab` (inline) |
| **Marchés & Économie** | `markets-economy` | [Open Tab](https://gobapps.com/jlab?tab=markets-economy) | `MarketsEconomyTab` (inline) |
| **Ask Emma** | `ask-emma` | [Open Tab](https://gobapps.com/jlab?tab=ask-emma) | `public/js/dashboard/components/tabs/AskEmmaTab.js` |
| **Assistant Vocal** | `assistant-vocal` | [Open Tab](https://gobapps.com/jlab?tab=assistant-vocal) | `public/js/dashboard/components/tabs/VoiceAssistantTab.js` |
| **Group Chat** | `groupchat` | [Open Tab](https://gobapps.com/jlab?tab=groupchat) | `public/js/dashboard/components/tabs/GroupChatTab.js` |
| **Plus (Menu)** | `plus` | [Open Tab](https://gobapps.com/jlab?tab=plus) | `public/js/dashboard/components/tabs/PlusTab.js` |
| **Admin JSL AI** | `admin-jsla` | [Open Tab](https://gobapps.com/jlab?tab=admin-jsla) | `public/js/dashboard/components/tabs/AdminJSLaiTab.js` |

## 🛠️ Tools & Analysis

| Tab Name | ID (Parameter) | Direct Link | Component File |
|----------|---------------|-------------|----------------|
| **Dan's Watchlist** | `dans-watchlist` | [Open Tab](https://gobapps.com/jlab?tab=dans-watchlist) | `public/js/dashboard/components/tabs/DansWatchlistTab.js` |
| **Seeking Alpha** | `seeking-alpha` | [Open Tab](https://gobapps.com/jlab?tab=seeking-alpha) | `public/js/dashboard/components/tabs/SeekingAlphaTab.js` |
| **Scraping SA** | `scrapping-sa` | [Open Tab](https://gobapps.com/jlab?tab=scrapping-sa) | `public/js/dashboard/components/tabs/ScrappingSATab.js` |
| **Email Briefings** | `email-briefings` | [Open Tab](https://gobapps.com/jlab?tab=email-briefings) | `public/js/dashboard/components/tabs/EmailBriefingsTab.js` |
| **Calendrier Éco.** | `economic-calendar` | [Open Tab](https://gobapps.com/jlab?tab=economic-calendar) | `public/js/dashboard/components/tabs/EconomicCalendarTab.js` |
| **Calendrier Inv.** | `investing-calendar` | [Open Tab](https://gobapps.com/jlab?tab=investing-calendar) | `public/js/dashboard/components/tabs/InvestingCalendarTab.js` |
| **FinVox** | `finvox` | [Open Tab](https://gobapps.com/jlab?tab=finvox) | `public/js/dashboard/components/tabs/FinVoxTab.js` |
| **EmmAIA (Gemini)** | `emmaia` | [Open Tab](https://gobapps.com/jlab?tab=emmaia) | `public/js/dashboard/components/tabs/EmmAIATab.js` |
| **Terminal EmmAIA** | `terminal-emmaia` | [Open Tab](https://gobapps.com/jlab?tab=terminal-emmaia) | `public/js/dashboard/components/tabs/TerminalEmmaIATab.js` |
| **FastGraphs** | `fastgraphs` | [Open Tab](https://gobapps.com/jlab?tab=fastgraphs) | `public/js/dashboard/components/tabs/FastGraphsTab.js` |
| **Emma Config** | `emma-config` | [Open Tab](https://gobapps.com/jlab?tab=emma-config) | `public/js/dashboard/components/tabs/EmmaConfigTab.js` |

## 📝 Notes using "Links"
- Since the application is a SPA, these "links" just set the initial state.
- Navigating between tabs does **not** reload the page, but now **updates** the URL.
- You can bookmark specific tabs using these links.
