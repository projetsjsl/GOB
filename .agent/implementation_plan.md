# Implementation Plan - Restore Dashboard Functionality & Visuals

The goal is to restore the full functionality and visual appearance of the dashboard to match the previous stable version (backup), while maintaining the new modular architecture.

## Phase 1: Restore Core Components
- [x] Restore `ExpandableComponent` in `common.js` (Completed)
- [ ] Verify other core components in `common.js` against backup (Icon, Modal, etc.)

## Phase 2: Restore ExpandableComponent Usage
Identify where `ExpandableComponent` was used in the backup and restore it in the corresponding modular files.

- [ ] **MarketsEconomyTab.js**
  - [ ] Restore usage for "Vue d'ensemble des Marchés"
  - [ ] Restore usage for "Heatmap Boursière"
  - [ ] Restore usage for "Screener - Top Gainers & Losers"
- [ ] **YieldCurveTab.js**
  - [ ] Restore usage for "Courbe des Taux"
  - [ ] Restore usage for "Tableau des Maturités"
- [ ] **IntelliStocksTab.js** (and related)
  - [ ] Check for usages in stock analysis sections
- [ ] **Other Tabs**
  - [ ] Scan backup for other usages and map to modules

## Phase 3: Systematic Tab Verification
Compare each modular file with the backup code to ensure no other logic or UI elements were lost.

- [ ] **IntelliStocksTab.js**
- [ ] **StocksNewsTab.js**
- [ ] **FinanceProTab.js**
- [ ] **SeekingAlphaTab.js**
- [ ] **MarketsEconomyTab.js**
- [ ] **YieldCurveTab.js**
- [ ] **EconomicCalendarTab.js**
- [ ] **InvestingCalendarTab.js**
- [ ] **AskEmmaTab.js**
- [ ] **AdminJSLaiTab.js**

## Phase 4: Final Polish
- [ ] Ensure all styles match (check `emma-styles.css` vs inline styles in backup)
- [ ] Verify global variables and event listeners
