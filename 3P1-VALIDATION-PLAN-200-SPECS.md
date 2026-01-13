# JLab 3p1 - Complete Validation Plan (305 Specs)
## 4 Sprints for Ralph-Loop Execution
### Target: Real Data Validation - No Fallbacks, No Randomization

---

## SPRINT 1: Data Infrastructure & Validation (70 Specs)
### Goal: Ensure Supabase stores real FMP data correctly

---

### S1-DB: Database Schema Validation (15 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S1-DB-001 | Verify finance_pro_snapshots table exists | Table accessible via Supabase client |
| S1-DB-002 | Verify ticker column (VARCHAR 10) | All tickers <= 10 chars |
| S1-DB-003 | Verify profile_id column uniqueness | No duplicate profile_ids |
| S1-DB-004 | Verify annual_data JSONB structure | Contains year, EPS, CF, BV, DIV, prices |
| S1-DB-005 | Verify assumptions JSONB structure | Contains growth rates, target ratios |
| S1-DB-006 | Verify company_info JSONB structure | Contains symbol, name, sector, beta |
| S1-DB-007 | Verify is_current flag logic | Only one current per ticker |
| S1-DB-008 | Verify version auto-increment | Each save increments version |
| S1-DB-009 | Verify created_at/updated_at triggers | Timestamps auto-update |
| S1-DB-010 | Verify sync_metadata column exists | JSONB column for sync tracking |
| S1-DB-011 | Verify auto_fetched boolean flag | Distinguishes FMP vs manual data |
| S1-DB-012 | Verify is_watchlist flag | Portfolio vs watchlist distinction |
| S1-DB-013 | Verify indexes on ticker column | Fast ticker lookups |
| S1-DB-014 | Verify indexes on is_current | Fast current version queries |
| S1-DB-015 | Verify foreign key constraints | Data integrity maintained |

---

### S1-DATA: Data Quality Validation (25 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S1-DATA-001 | Verify no NULL EPS values in annual_data | All EPS are numeric or 0 |
| S1-DATA-002 | Verify no NULL CF values in annual_data | All CF are numeric or 0 |
| S1-DATA-003 | Verify no NULL BV values in annual_data | All BV are numeric or 0 |
| S1-DATA-004 | Verify no NULL DIV values in annual_data | All DIV are numeric or 0 |
| S1-DATA-005 | Verify no NULL priceHigh values | All priceHigh are numeric |
| S1-DATA-006 | Verify no NULL priceLow values | All priceLow are numeric |
| S1-DATA-007 | Verify year field is valid integer | Years between 1950-2030 |
| S1-DATA-008 | Verify no duplicate years per ticker | Each year appears once |
| S1-DATA-009 | Verify minimum 3 years of data | At least 3 annual records |
| S1-DATA-010 | Verify currentPrice > 0 in assumptions | No zero or negative prices |
| S1-DATA-011 | Verify growthRateEPS is reasonable | Between -50% and +100% |
| S1-DATA-012 | Verify growthRateCF is reasonable | Between -50% and +100% |
| S1-DATA-013 | Verify growthRateBV is reasonable | Between -50% and +100% |
| S1-DATA-014 | Verify targetPE is reasonable | Between 1 and 100 |
| S1-DATA-015 | Verify targetPCF is reasonable | Between 1 and 100 |
| S1-DATA-016 | Verify targetPBV is reasonable | Between 0.1 and 50 |
| S1-DATA-017 | Verify company_info.symbol matches ticker | Symbol consistency |
| S1-DATA-018 | Verify company_info.name is not empty | Real company name |
| S1-DATA-019 | Verify company_info.sector is valid | From valid sector list |
| S1-DATA-020 | Verify company_info.beta is numeric | Beta between 0 and 5 |
| S1-DATA-021 | Verify no NaN values anywhere | All values are finite |
| S1-DATA-022 | Verify no Infinity values anywhere | All values are finite |
| S1-DATA-023 | Verify dataSource field is set | FMP, manual, or calculated |
| S1-DATA-024 | Verify autoFetched flag consistency | True for FMP-sourced data |
| S1-DATA-025 | Verify isEstimate flag for future years | Only future years flagged |

---

### S1-SNAP: Snapshot Operations (15 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S1-SNAP-001 | Create new snapshot for ticker | POST /api/finance-snapshots works |
| S1-SNAP-002 | Retrieve current snapshot | GET returns is_current=true |
| S1-SNAP-003 | List all snapshots for ticker | Returns version history |
| S1-SNAP-004 | Update existing snapshot | PUT updates correctly |
| S1-SNAP-005 | Version increments on save | New version = old + 1 |
| S1-SNAP-006 | Previous version marked not current | is_current=false on old |
| S1-SNAP-007 | Snapshot date format correct | YYYY-MM-DD format |
| S1-SNAP-008 | Notes field saves correctly | Free text preserved |
| S1-SNAP-009 | Snapshot restore works | Can revert to old version |
| S1-SNAP-010 | Delete snapshot works | Removes specific version |
| S1-SNAP-011 | Concurrent save handling | No race conditions |
| S1-SNAP-012 | Large data handling | 30+ years saves correctly |
| S1-SNAP-013 | Unicode in notes | Special chars preserved |
| S1-SNAP-014 | Empty annual_data rejected | Validation error returned |
| S1-SNAP-015 | Invalid ticker format rejected | Only A-Z0-9 allowed |

---

### S1-LOAD: Data Loading Validation (15 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S1-LOAD-001 | Load ticker from Supabase | Data retrieved correctly |
| S1-LOAD-002 | Parse annual_data JSONB | Array converted to objects |
| S1-LOAD-003 | Parse assumptions JSONB | Object with all fields |
| S1-LOAD-004 | Parse company_info JSONB | Object with all fields |
| S1-LOAD-005 | Handle missing snapshot | Skeleton profile created |
| S1-LOAD-006 | Handle empty annual_data | Marked as invalid |
| S1-LOAD-007 | Handle zero currentPrice | Marked as invalid |
| S1-LOAD-008 | Cache loaded data | LocalStorage caching works |
| S1-LOAD-009 | Cache expiry logic | Refresh after timeout |
| S1-LOAD-010 | Multi-ticker batch load | Load 100 tickers efficiently |
| S1-LOAD-011 | Error handling on load fail | Graceful error display |
| S1-LOAD-012 | Retry logic on timeout | 3 retries with backoff |
| S1-LOAD-013 | Load from watchlist filter | Only watchlist tickers |
| S1-LOAD-014 | Load from portfolio filter | Only portfolio tickers |
| S1-LOAD-015 | Load all tickers | Full 1001+ ticker load |

---

## SPRINT 2: FMP Integration & Sync (70 Specs)
### Goal: Ensure FMP API returns real data and saves correctly

---

### S2-FMP: FMP API Integration (25 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S2-FMP-001 | Fetch company profile | Symbol, name, sector returned |
| S2-FMP-002 | Fetch key metrics | EPS, CF, BV, DIV returned |
| S2-FMP-003 | Fetch historical prices | 20+ years of prices |
| S2-FMP-004 | Fetch current price | Real-time price > 0 |
| S2-FMP-005 | Handle US tickers | NYSE, NASDAQ symbols work |
| S2-FMP-006 | Handle Canadian tickers | .TO suffix handled |
| S2-FMP-007 | Handle BRK.B format | Dot notation converted |
| S2-FMP-008 | Handle BBD-B.TO format | Hyphen notation handled |
| S2-FMP-009 | Symbol search fallback | Try variants on failure |
| S2-FMP-010 | Rate limit handling (429) | Retry with backoff |
| S2-FMP-011 | API timeout handling | 30s timeout, then retry |
| S2-FMP-012 | Invalid symbol handling | Clear error message |
| S2-FMP-013 | No data available handling | Appropriate error |
| S2-FMP-014 | Partial data handling | Use available data |
| S2-FMP-015 | Beta value fetched | From company profile |
| S2-FMP-016 | Market cap fetched | From company profile |
| S2-FMP-017 | Sector fetched | From company profile |
| S2-FMP-018 | Industry fetched | From company profile |
| S2-FMP-019 | Logo URL fetched | From company profile |
| S2-FMP-020 | Exchange fetched | NYSE, NASDAQ, TSX |
| S2-FMP-021 | Currency fetched | USD, CAD |
| S2-FMP-022 | Country fetched | US, CA |
| S2-FMP-023 | ROE fetched | From key metrics |
| S2-FMP-024 | ROA fetched | From key metrics |
| S2-FMP-025 | Dividend yield fetched | From key metrics |

---

### S2-SYNC: Synchronization Process (25 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S2-SYNC-001 | Single ticker sync | One ticker syncs correctly |
| S2-SYNC-002 | Batch sync (10 tickers) | 10 tickers sync correctly |
| S2-SYNC-003 | Batch sync (100 tickers) | 100 tickers sync correctly |
| S2-SYNC-004 | Full sync (1001 tickers) | All tickers sync |
| S2-SYNC-005 | Sync saves annual_data | EPS, CF, BV, DIV saved |
| S2-SYNC-006 | Sync saves assumptions | Growth rates saved |
| S2-SYNC-007 | Sync saves company_info | Name, sector saved |
| S2-SYNC-008 | Sync calculates CAGR EPS | 5-year CAGR calculated |
| S2-SYNC-009 | Sync calculates CAGR CF | 5-year CAGR calculated |
| S2-SYNC-010 | Sync calculates CAGR BV | 5-year CAGR calculated |
| S2-SYNC-011 | Sync calculates target PE | 3-year avg calculated |
| S2-SYNC-012 | Sync calculates target PCF | 3-year avg calculated |
| S2-SYNC-013 | Sync calculates target PBV | 3-year avg calculated |
| S2-SYNC-014 | Sync preserves manual edits | User changes kept |
| S2-SYNC-015 | Sync only new years option | Only adds new years |
| S2-SYNC-016 | Sync only missing metrics | Fills gaps only |
| S2-SYNC-017 | Force replace option | Overwrites all data |
| S2-SYNC-018 | Snapshot before sync | Backup created |
| S2-SYNC-019 | Outlier detection | Aberrant values flagged |
| S2-SYNC-020 | Outlier exclusion | Bad metrics excluded |
| S2-SYNC-021 | Sync progress tracking | X/1001 displayed |
| S2-SYNC-022 | Sync error handling | Failed tickers listed |
| S2-SYNC-023 | Sync cancellation | Can stop mid-sync |
| S2-SYNC-024 | Sync resume | Can continue after stop |
| S2-SYNC-025 | Sync report generation | Summary of results |

---

### S2-CALC: Calculation Validation (20 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S2-CALC-001 | EPS projection formula | EPS * (1 + growth)^5 |
| S2-CALC-002 | CF projection formula | CF * (1 + growth)^5 |
| S2-CALC-003 | BV projection formula | BV * (1 + growth)^5 |
| S2-CALC-004 | DIV projection formula | DIV * (1 + growth)^5 |
| S2-CALC-005 | Target price from EPS | Projected EPS * target PE |
| S2-CALC-006 | Target price from CF | Projected CF * target PCF |
| S2-CALC-007 | Target price from BV | Projected BV * target PBV |
| S2-CALC-008 | Target price from DIV | DIV / target yield |
| S2-CALC-009 | Composite target price | Average of 4 methods |
| S2-CALC-010 | Upside/downside % | (Target - Current) / Current |
| S2-CALC-011 | Recommendation logic | ACHAT/CONSERVER/VENTE |
| S2-CALC-012 | Dividend yield calc | DIV / Price * 100 |
| S2-CALC-013 | PE ratio calc | Price / EPS |
| S2-CALC-014 | PCF ratio calc | Price / CF |
| S2-CALC-015 | PBV ratio calc | Price / BV |
| S2-CALC-016 | CAGR formula | (End/Start)^(1/n) - 1 |
| S2-CALC-017 | Handle negative EPS | Use CF or BV fallback |
| S2-CALC-018 | Handle zero CF | Use EPS or BV fallback |
| S2-CALC-019 | Handle zero BV | Use EPS or CF fallback |
| S2-CALC-020 | Guardrails enforcement | Limits on growth rates |

---

## SPRINT 3: UI/UX & Final Validation (60 Specs)
### Goal: Verify complete user experience with real data

---

### S3-UI: User Interface Validation (20 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S3-UI-001 | Ticker list displays correctly | All 1001+ tickers shown |
| S3-UI-002 | Ticker search works | Filter by symbol/name |
| S3-UI-003 | Ticker selection loads data | Click loads profile |
| S3-UI-004 | Prix Actuel displays | Current price shown |
| S3-UI-005 | Dividende displays | Current dividend shown |
| S3-UI-006 | Rendement displays | Yield % calculated |
| S3-UI-007 | Capitalisation displays | Market cap formatted |
| S3-UI-008 | Cote Securite displays | ValueLine rating |
| S3-UI-009 | Beta displays | Beta value shown |
| S3-UI-010 | Historical data table | 30 years displayed |
| S3-UI-011 | Color coding works | Green/Blue/Orange/Gray/Red |
| S3-UI-012 | Resume Executif updates | Recommendation shown |
| S3-UI-013 | Data modification works | Can edit values |
| S3-UI-014 | Undo/Redo works | Changes reversible |
| S3-UI-015 | Save button works | Saves to Supabase |
| S3-UI-016 | Force Reload works | Fetches fresh FMP data |
| S3-UI-017 | Reports panel works | Generate visual reports |
| S3-UI-018 | Settings panel works | Configuration accessible |
| S3-UI-019 | Data Explorer works | View Supabase tables |
| S3-UI-020 | KPI Dashboard works | Metrics displayed |

---

### S3-FILTER: Filtering & Sorting (15 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S3-FILTER-001 | Filter by sector | Only selected sector shown |
| S3-FILTER-002 | Filter by exchange | NYSE/NASDAQ/TSX filter |
| S3-FILTER-003 | Filter by country | US/CA filter |
| S3-FILTER-004 | Filter by recommendation | ACHAT/CONSERVER/VENTE |
| S3-FILTER-005 | Filter by portfolio | Star icon filter |
| S3-FILTER-006 | Filter by watchlist | Eye icon filter |
| S3-FILTER-007 | Sort by ticker | A-Z, Z-A |
| S3-FILTER-008 | Sort by price | Low-High, High-Low |
| S3-FILTER-009 | Sort by upside | Best opportunities first |
| S3-FILTER-010 | Sort by dividend yield | Highest yield first |
| S3-FILTER-011 | Sort by market cap | Large/Small first |
| S3-FILTER-012 | Sort by beta | Low/High risk |
| S3-FILTER-013 | Combined filters | Multiple filters work |
| S3-FILTER-014 | Filter count display | "25 of 1001 shown" |
| S3-FILTER-015 | Clear all filters | Reset to default |

---

### S3-VAL: Final Validation (25 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S3-VAL-001 | AAPL has real data | EPS, CF, BV, DIV present |
| S3-VAL-002 | MSFT has real data | EPS, CF, BV, DIV present |
| S3-VAL-003 | GOOGL has real data | EPS, CF, BV, DIV present |
| S3-VAL-004 | AMZN has real data | EPS, CF, BV, DIV present |
| S3-VAL-005 | BRK-B has real data | Handles special symbol |
| S3-VAL-006 | TD.TO has real data | Canadian ticker works |
| S3-VAL-007 | RY.TO has real data | Canadian ticker works |
| S3-VAL-008 | BCE.TO has real data | Canadian ticker works |
| S3-VAL-009 | No skeleton profiles | All have real data |
| S3-VAL-010 | No zero prices | All prices > 0 |
| S3-VAL-011 | No N/A capitalizations | All have market cap |
| S3-VAL-012 | No empty sectors | All have sector |
| S3-VAL-013 | No missing betas | All have beta value |
| S3-VAL-014 | Calculations match manual | Verify formulas |
| S3-VAL-015 | Recommendations accurate | Based on real targets |
| S3-VAL-016 | Over-valued identified | VENTE recommendations |
| S3-VAL-017 | Under-valued identified | ACHAT recommendations |
| S3-VAL-018 | Fair-valued identified | CONSERVER recommendations |
| S3-VAL-019 | Export to CSV works | Data exports correctly |
| S3-VAL-020 | Export to JSON works | Data exports correctly |
| S3-VAL-021 | Print report works | Printable format |
| S3-VAL-022 | Session persistence | Data survives refresh |
| S3-VAL-023 | Multi-tab consistency | Same data in all tabs |
| S3-VAL-024 | Error recovery | Graceful handling |
| S3-VAL-025 | Performance acceptable | Load < 5s, sync < 10min |

---

## SPRINT 4: KPI, Performance & Edge Cases (50 Specs)
### Goal: Address observed issues from testing sessions

---

### S4-KPI: KPI Dashboard Validation (15 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-KPI-001 | KPI uses cached Supabase data | No re-fetch on KPI open |
| S4-KPI-002 | KPI loads in < 2 seconds | No spinner for cached data |
| S4-KPI-003 | N/A tickers explained | Tooltip shows missing data reason |
| S4-KPI-004 | JPEGY calculation documented | Formula visible in tooltip |
| S4-KPI-005 | Ratio 3:1 calculation correct | Non-zero for valid tickers |
| S4-KPI-006 | Performance matrix accuracy | % matches actual returns |
| S4-KPI-007 | Rendement Moyen accurate | Average of all valid tickers |
| S4-KPI-008 | Écart-Type accurate | Standard deviation correct |
| S4-KPI-009 | KPI icons labeled | Text labels under icons |
| S4-KPI-010 | "Voir détails par ticker" works | Links to ticker details |
| S4-KPI-011 | Auto-Sync N/A button works | Syncs only N/A tickers |
| S4-KPI-012 | Afficher N/A toggle works | Shows/hides N/A cards |
| S4-KPI-013 | Zoom Top 10 works | Shows best performers |
| S4-KPI-014 | Grid responsive | Cards adjust to window |
| S4-KPI-015 | KPI export to PDF | Dashboard prints correctly |

---

### S4-STARTUP: Auto-Load on Startup (5 specs) - CRITICAL UX

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-STARTUP-001 | Auto-load from Supabase on open | No manual click required |
| S4-STARTUP-002 | Show loading indicator | Progress shown during load |
| S4-STARTUP-003 | Auto-select first/last ticker | Ticker displayed on load |
| S4-STARTUP-004 | Remember last session state | Restore previous ticker |
| S4-STARTUP-005 | Graceful offline fallback | Use localStorage if offline |
| S4-STARTUP-006 | **BLOCKING loading overlay** | Prevent navigation during load |
| S4-STARTUP-007 | Progress bar with % complete | Show X/1001 tickers loaded |

---

### S4-PERF: Performance & Caching (10 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-PERF-001 | Supabase cache TTL configurable | 5min default, user settable |
| S4-PERF-002 | localStorage < 5MB limit | Warning at 4.5MB |
| S4-PERF-003 | Stale cache indicator | Shows "last sync" timestamp |
| S4-PERF-004 | Lazy loading for ticker list | Loads visible items first |
| S4-PERF-005 | Batch API calls efficient | Max 50 per batch to FMP |
| S4-PERF-006 | Memory cleanup on tab close | No memory leaks |
| S4-PERF-007 | IndexedDB for large data | Fallback from localStorage |
| S4-PERF-008 | Service worker caching | Offline mode partial support |
| S4-PERF-009 | Progress bar for long ops | Visual feedback > 2s |
| S4-PERF-010 | Cancel button for sync | Abort controller works |

---

### S4-UIUX: UI/UX Improvements (10 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-UIUX-001 | Buttons not truncated | All button text visible |
| S4-UIUX-002 | Icons have tooltips | Hover shows description |
| S4-UIUX-003 | Click targets >= 44px | Touch-friendly buttons |
| S4-UIUX-004 | Modal closes with X | X button always visible |
| S4-UIUX-005 | Modal closes with ESC | Keyboard escape works |
| S4-UIUX-006 | Modal closes with overlay click | Click outside closes |
| S4-UIUX-007 | Print button isolated | Not next to destructive actions |
| S4-UIUX-008 | Ticker click loads directly | No textbox filter required |
| S4-UIUX-009 | Time interval selector | 5yr, 10yr, 20yr, All options |
| S4-UIUX-010 | Responsive at 1024px | Usable on tablet screens |

---

### S4-EDGE: Edge Cases & Error Handling (10 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-EDGE-001 | CVS ticker loads | No N/A, real data present |
| S4-EDGE-002 | ABBV ticker loads | No N/A, real data present |
| S4-EDGE-003 | Negative EPS handled | Shows value, uses CF fallback |
| S4-EDGE-004 | Zero dividend handled | Shows 0%, not N/A |
| S4-EDGE-005 | API 429 retry works | 3 retries with exponential backoff |
| S4-EDGE-006 | API timeout recovery | Clear error, retry option |
| S4-EDGE-007 | Network offline mode | Shows cached data, sync disabled |
| S4-EDGE-008 | Invalid ticker format | Error message, not crash |
| S4-EDGE-009 | Concurrent saves handled | No data corruption |
| S4-EDGE-010 | Session restore works | Refreshed page keeps state |

---

### S4-ADV: Advanced Features (5 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-ADV-001 | Keyboard shortcuts documented | Help modal with shortcuts |
| S4-ADV-002 | Ctrl+S saves current ticker | Quick save shortcut |
| S4-ADV-003 | Ctrl+F opens filter | Quick filter shortcut |
| S4-ADV-004 | Arrow keys navigate tickers | Up/Down in ticker list |
| S4-ADV-005 | Accessibility WCAG 2.1 AA | Screen reader compatible |

---

### S4-MULTI: Multi-User & Cache Safety (5 specs) - CRITICAL

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-MULTI-001 | Supabase is source of truth | localStorage is cache only |
| S4-MULTI-002 | localStorage per-user isolation | No cross-user contamination |
| S4-MULTI-003 | Cache invalidation on data change | Stale cache cleared |
| S4-MULTI-004 | Conflict resolution strategy | Last-write-wins or merge |
| S4-MULTI-005 | Clear cache option in UI | User can force fresh load |

---

### S4-INTEG: KPI-Analysis Integration (5 specs) - CRITICAL

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-INTEG-001 | KPI uses same data source as Analysis | No separate data loading |
| S4-INTEG-002 | Selected ticker syncs between views | Click in KPI selects in Analysis |
| S4-INTEG-003 | Filters apply across views | Sector filter affects both |
| S4-INTEG-004 | Calculations consistent | Same JPEGY in both views |
| S4-INTEG-005 | State preserved on view switch | No data loss on tab change |

---

### S4-BATCH: Batch Loading Optimization (10 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-BATCH-001 | Adaptive batch size | Adjust based on API response time |
| S4-BATCH-002 | Rate limit detection | Detect 429 before it happens |
| S4-BATCH-003 | Exponential backoff | Double delay on each retry |
| S4-BATCH-004 | Parallel vs sequential | Max 3 concurrent requests |
| S4-BATCH-005 | Priority queue | Portfolio first, then watchlist |
| S4-BATCH-006 | Incremental loading | Load visible tickers first |
| S4-BATCH-007 | Background sync | Continue sync after initial load |
| S4-BATCH-008 | Pause/resume capability | User can pause long syncs |
| S4-BATCH-009 | Progress persistence | Resume after page refresh |
| S4-BATCH-010 | API quota tracking | Show remaining calls today |

---

### S4-NOPNA: N/A Prevention (10 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-NOPNA-001 | currentPrice must be > 0 | Reject profile if price = 0 |
| S4-NOPNA-002 | growthRateEPS calculated | Auto-calc from 5yr history |
| S4-NOPNA-003 | Fallback calculations | Use CF if EPS negative |
| S4-NOPNA-004 | Minimum data validation | 3+ years annual data required |
| S4-NOPNA-005 | Auto-sync on N/A detect | Trigger FMP sync for N/A |
| S4-NOPNA-006 | N/A reason tracking | Log WHY each N/A occurred |
| S4-NOPNA-007 | Admin N/A dashboard | List all N/A with reasons |
| S4-NOPNA-008 | Batch N/A resolution | One-click fix all N/A |
| S4-NOPNA-009 | N/A prevention alerts | Warn before saving bad data |
| S4-NOPNA-010 | Zero N/A target | Dashboard shows N/A count = 0 |

---

### S4-API: API Optimization (10 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-API-001 | Cache FMP responses | 24hr cache for company info |
| S4-API-002 | Bulk endpoints | Use batch API when available |
| S4-API-003 | Delta sync only | Only fetch changed data |
| S4-API-004 | Compression | Gzip API responses |
| S4-API-005 | Request deduplication | No duplicate calls same ticker |
| S4-API-006 | Timeout handling | 30s timeout, graceful retry |
| S4-API-007 | Circuit breaker | Stop calls after 5 failures |
| S4-API-008 | API key rotation | Support multiple keys |
| S4-API-009 | Offline queue | Queue requests when offline |
| S4-API-010 | Response validation | Reject malformed API data |

---

### S4-QUAL: Data Quality Assurance (10 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-QUAL-001 | Price sanity check | Price within 50% of yesterday |
| S4-QUAL-002 | EPS consistency | No 1000% YoY changes |
| S4-QUAL-003 | Dividend validation | DIV <= EPS typically |
| S4-QUAL-004 | Beta range check | 0 < Beta < 5 |
| S4-QUAL-005 | Market cap validation | > $1M typically |
| S4-QUAL-006 | Sector mapping | Valid sector from list |
| S4-QUAL-007 | Exchange verification | NYSE/NASDAQ/TSX only |
| S4-QUAL-008 | Currency normalization | Convert all to USD |
| S4-QUAL-009 | Date validation | No future dates in history |
| S4-QUAL-010 | Outlier flagging | Mark >3 std dev values |

---

### S4-ERR: Error Handling (10 specs)

| ID | Spec | Validation Criteria |
|----|------|---------------------|
| S4-ERR-001 | Graceful degradation | Show cached on API fail |
| S4-ERR-002 | User-friendly messages | No technical jargon |
| S4-ERR-003 | Retry with feedback | "Retrying in 5s..." |
| S4-ERR-004 | Error logging | Log to Supabase for debug |
| S4-ERR-005 | Recovery actions | Suggest fix for each error |
| S4-ERR-006 | Partial success | Save good data even if some fail |
| S4-ERR-007 | Rollback capability | Undo failed batch operations |
| S4-ERR-008 | Health check endpoint | /api/health returns status |
| S4-ERR-009 | Alert on critical errors | Notify admin of failures |
| S4-ERR-010 | Error rate monitoring | Track error % over time |

---

## Execution Summary

| Sprint | Specs | Focus Area | Time Estimate |
|--------|-------|------------|---------------|
| Sprint 1 | 70 | Database & Data Quality | 2-3 hours |
| Sprint 2 | 70 | FMP API & Sync | 3-4 hours |
| Sprint 3 | 60 | UI/UX & Validation | 2-3 hours |
| Sprint 4 | 105 | KPI, Batch, N/A Prevention, API, Quality, Errors | 4-5 hours |
| **TOTAL** | **305** | **Complete Validation** | **11-15 hours** |

---

## Ralph-Loop Commands

```bash
# Sprint 1
ralph-loop "Execute Sprint 1 specs S1-DB-001 through S1-LOAD-015. Validate database schema, data quality, snapshot operations, and data loading. Report pass/fail for each spec." --completion-promise=SPRINT1_COMPLETE

# Sprint 2
ralph-loop "Execute Sprint 2 specs S2-FMP-001 through S2-CALC-020. Test FMP API integration, synchronization process, and calculation accuracy. Sync all 1001 tickers with real FMP data." --completion-promise=SPRINT2_COMPLETE

# Sprint 3
ralph-loop "Execute Sprint 3 specs S3-UI-001 through S3-VAL-025. Validate UI components, filtering, and final data quality. Ensure all tickers have real data with no fallbacks." --completion-promise=SPRINT3_COMPLETE

# Sprint 4
ralph-loop "Execute Sprint 4 specs S4-KPI-001 through S4-ADV-005. Test KPI dashboard functionality, performance/caching, UI/UX improvements, edge cases, and advanced features. Fix N/A tickers CVS/ABBV. Ensure KPI uses cached data." --completion-promise=SPRINT4_COMPLETE
```

---

## Success Criteria

1. **All 1001+ tickers have real FMP data** (not skeleton/empty)
2. **All calculations use actual values** (no randomization)
3. **All validations pass** (no fallback values)
4. **Over/under-valued tickers identified** (real recommendations)
5. **Data persists in Supabase** (survives refresh)
6. **KPI Dashboard uses cached data** (no re-fetch on open)
7. **Zero N/A tickers** (CVS, ABBV fixed)
8. **UI buttons fully visible** (no truncation)
9. **All icons have tooltips** (clear labeling)
10. **Performance < 2s for cached operations**

---

*Generated for Ralph-Loop Execution on 2026-01-12*
*Updated 2026-01-13: Added Sprint 4 with 50 specs for KPI, Performance & Edge Cases*
