# Component Extraction Status

## Overview
- **Total Components**: 14
- **Successfully Extracted**: 12 ✅
- **Failed/Incomplete**: 2 ❌
- **Converted to Modules**: 1 ✅
- **Remaining to Convert**: 13 ⚠️

## Extraction Status

| # | Component | Status | Size | Start Line | File | Notes |
|---|-----------|--------|------|------------|------|-------|
| 1 | PlusTab | ✅ CONVERTED | 3.5 KB | 5497 | `/public/js/dashboard/components/tabs/PlusTab.js` | Complete |
| 2 | DansWatchlistTab | ✅ EXTRACTED | 43 KB | 5575 | `/tmp/component_DansWatchlistTab.txt` | Ready to convert |
| 3 | ScrappingSATab | ✅ EXTRACTED | 303 B | 6396 | `/tmp/component_ScrappingSATab.txt` | Small, easy to convert |
| 4 | SeekingAlphaTab | ✅ EXTRACTED | 282 B | 7137 | `/tmp/component_SeekingAlphaTab.txt` | Small, easy to convert |
| 5 | EmailBriefingsTab | ✅ EXTRACTED | 171 KB | 9909 | `/tmp/component_EmailBriefingsTab.txt` | COMPLEX - needs sub-components |
| 6 | AskEmmaTab | ❌ INCOMPLETE | 341 B | 12794 | `/tmp/component_AskEmmaTab.txt` | NEEDS RE-EXTRACTION |
| 7 | StocksNewsTab | ✅ EXTRACTED | 94 KB | 15654 | `/tmp/component_StocksNewsTab.txt` | Large - consider sub-components |
| 8 | IntelliStocksTab | ✅ EXTRACTED | 209 KB | 16979 | `/tmp/component_IntelliStocksTab.txt` | COMPLEX - needs sub-components |
| 9 | EconomicCalendarTab | ✅ EXTRACTED | 37 KB | 19875 | `/tmp/component_EconomicCalendarTab.txt` | Medium complexity |
| 10 | InvestingCalendarTab | ✅ EXTRACTED | 65 KB | 20624 | `/tmp/component_InvestingCalendarTab.txt` | Medium complexity |
| 11 | YieldCurveTab | ✅ EXTRACTED | 27 KB | 21998 | `/tmp/component_YieldCurveTab.txt` | Medium complexity |
| 12 | MarketsEconomyTab | ✅ EXTRACTED | 33 KB | 22540 | `/tmp/component_MarketsEconomyTab.txt` | Medium complexity |
| 13 | EmmaSmsPanel | ✅ EXTRACTED | 23 KB | 3962 | `/tmp/component_EmmaSmsPanel.txt` | Medium complexity |
| 14 | AdminJSLaiTab | ❌ INCOMPLETE | 224 B | 4315 | `/tmp/component_AdminJSLaiTab.txt` | NEEDS RE-EXTRACTION |

## Priority Queue

### 🔴 Critical (Do First)
1. **Re-extract AdminJSLaiTab** (lines 4315-~5495)
   - Current extraction is incomplete (only 224 bytes)
   - Bracket matching failed
   - Critical admin functionality

2. **Re-extract AskEmmaTab** (lines 12794-~15653)
   - Current extraction is incomplete (only 341 bytes)
   - React.memo wrapper confused extraction
   - Critical Emma IA interface

### 🟡 High Priority (Simple Components)
3. **ScrappingSATab** (303 B)
   - Smallest component
   - Quick win
   - Low complexity

4. **SeekingAlphaTab** (282 B)
   - Second smallest
   - Quick win
   - Low complexity

5. **YieldCurveTab** (27 KB)
   - Medium size
   - Relatively simple
   - Standalone functionality

### 🟢 Medium Priority (Medium Components)
6. **EmmaSmsPanel** (23 KB)
   - SMS interface
   - Medium complexity
   - Standalone functionality

7. **EconomicCalendarTab** (37 KB)
   - Calendar display
   - Medium complexity
   - Could benefit from sub-components

8. **MarketsEconomyTab** (33 KB)
   - Market overview
   - Medium complexity
   - Multiple sections

9. **DansWatchlistTab** (43 KB)
   - Watchlist management
   - Medium complexity
   - Modal dialogs

10. **InvestingCalendarTab** (65 KB)
    - Calendar functionality
    - Medium-high complexity
    - Multiple data sources

### 🔵 Complex (Need Sub-Components)
11. **StocksNewsTab** (94 KB)
    - Break into:
      - `StocksNewsTab.js` (main)
      - `TopMoversSection.js`
      - `AnalysesSection.js`
      - `HeadlinesSection.js`

12. **IntelliStocksTab** (209 KB) - SECOND LARGEST
    - Break into:
      - `IntelliStocksTab.js` (main)
      - `JSLAIScoreCard.js`
      - `StockDetailModal.js`
      - `ScoringAlgorithm.js`

13. **EmailBriefingsTab** (171 KB) - LARGEST
    - Break into:
      - `EmailBriefingsTab.js` (main)
      - `BriefingCard.js`
      - `BriefingTypeSelector.js`
      - `ScheduleManager.js`

## Re-Extraction Commands

### AdminJSLaiTab
```bash
# Find the actual end line (look for closing of AdminJSLaiTab)
grep -n "const AdminJSLaiTab" /tmp/dashboard-js-full.txt
grep -n "const PlusTab" /tmp/dashboard-js-full.txt

# Extract between AdminJSLaiTab and PlusTab
sed -n '4315,5496p' /tmp/dashboard-js-full.txt > /tmp/component_AdminJSLaiTab_v2.txt

# Verify bracket matching
echo "Opening braces:"
grep -o '{' /tmp/component_AdminJSLaiTab_v2.txt | wc -l
echo "Closing braces:"
grep -o '}' /tmp/component_AdminJSLaiTab_v2.txt | wc -l
```

### AskEmmaTab
```bash
# Find the actual end line (look for closing of AskEmmaTab)
grep -n "const AskEmmaTab" /tmp/dashboard-js-full.txt
grep -n "const StocksNewsTab" /tmp/dashboard-js-full.txt

# Extract between AskEmmaTab and StocksNewsTab
sed -n '12794,15653p' /tmp/dashboard-js-full.txt > /tmp/component_AskEmmaTab_v2.txt

# Verify bracket matching
echo "Opening braces:"
grep -o '{' /tmp/component_AskEmmaTab_v2.txt | wc -l
echo "Closing braces:"
grep -o '}' /tmp/component_AskEmmaTab_v2.txt | wc -l
```

## Conversion Template

For each extracted component:

```javascript
/**
 * ComponentName.js
 * Brief description of component functionality
 */

import React from 'react';
import { Icon, Button, Card, Modal } from '../common.js';
import { utility1, utility2 } from '../../utils.js';
import { fetchData1, fetchData2 } from '../../api-helpers.js';

export const ComponentName = ({
    // Props
    isDarkMode,
    isProfessionalMode,
    // Data props
    data,
    // State setters
    setData,
    // Event handlers
    onEvent
}) => {
    // Local state
    const [localState, setLocalState] = React.useState(null);

    // Effects
    React.useEffect(() => {
        // Effect logic
    }, [dependencies]);

    // Event handlers
    const handleEvent = () => {
        // Handler logic
    };

    // Render
    return (
        <div className="component-container">
            {/* JSX */}
        </div>
    );
};
```

## Verification Checklist

For each converted component:

- [ ] Component renders without errors
- [ ] All imports are correct
- [ ] All props are defined
- [ ] Dark mode works
- [ ] Professional mode works (if applicable)
- [ ] API calls work
- [ ] Event handlers work
- [ ] No console errors
- [ ] Bracket matching verified
- [ ] No missing dependencies
- [ ] File is under 50 KB (or split into sub-components)

## Sub-Component Splitting Strategy

### When to Split
- Component > 50 KB
- Multiple distinct sections
- Reusable parts
- Complex logic that can be isolated

### How to Split
1. Identify logical boundaries (sections, modals, cards)
2. Extract to separate file
3. Define clear props interface
4. Import in parent component
5. Test in isolation

### Example: EmailBriefingsTab

Original: 171 KB

Split into:
```
EmailBriefingsTab/
├── index.js (main component, 30 KB)
├── BriefingCard.js (20 KB)
├── BriefingTypeSelector.js (15 KB)
└── ScheduleManager.js (25 KB)
```

## Dependencies to Watch

### Common Dependencies
- `React` - All components
- `Icon` - Most components
- Dark mode props - All components
- Professional mode props - All components

### Specific Dependencies
- **DansWatchlistTab**: `fetchStockData`, `Modal`, `Card`
- **StocksNewsTab**: `fetchNews`, `getNewsIcon`, `sortNewsByCredibility`
- **IntelliStocksTab**: JSLAI scoring functions, `parseSeekingAlphaRawText`
- **EconomicCalendarTab**: Date utils, `formatCacheAge`
- **AskEmmaTab**: Emma API, conversation history
- **AdminJSLaiTab**: Health check functions, system logs

## Estimated Effort

| Component | Complexity | Time Estimate | Priority |
|-----------|------------|---------------|----------|
| AdminJSLaiTab (re-extract) | High | 2-3 hours | Critical |
| AskEmmaTab (re-extract) | High | 2-3 hours | Critical |
| ScrappingSATab | Low | 30 min | High |
| SeekingAlphaTab | Low | 30 min | High |
| YieldCurveTab | Medium | 1-2 hours | High |
| EmmaSmsPanel | Medium | 2 hours | Medium |
| EconomicCalendarTab | Medium | 2-3 hours | Medium |
| MarketsEconomyTab | Medium | 2-3 hours | Medium |
| DansWatchlistTab | Medium | 2-3 hours | Medium |
| InvestingCalendarTab | Medium-High | 3-4 hours | Medium |
| StocksNewsTab | High | 4-6 hours | Low (Complex) |
| IntelliStocksTab | Very High | 6-8 hours | Low (Complex) |
| EmailBriefingsTab | Very High | 6-8 hours | Low (Complex) |

**Total Estimated Time**: 35-50 hours (5-7 days full-time)

## Progress Tracking

### Week 1 Goals
- [x] Core infrastructure modules
- [x] Extraction tooling
- [x] Documentation
- [ ] Re-extract AdminJSLaiTab
- [ ] Re-extract AskEmmaTab
- [ ] Convert 3 simple components

### Week 2 Goals
- [ ] Convert all medium complexity components
- [ ] Start breaking down complex components
- [ ] Complete API helpers module

### Week 3 Goals
- [ ] Complete all complex components
- [ ] Create main dashboard component
- [ ] Integration testing
- [ ] Documentation updates

## Notes

### Extraction Script Limitations
The Python extraction script (`/tmp/extract_components.py`) works well for most components but has issues with:
1. React.memo wrapped components (e.g., AskEmmaTab)
2. Components with complex destructuring in parameters
3. Components with unusual bracket patterns

**Solution**: Manual extraction using `sed` with verified line ranges

### Bracket Matching Tips
```bash
# Count brackets in extracted file
grep -o '{' file.txt | wc -l  # Opening
grep -o '}' file.txt | wc -l  # Closing

# Should be equal for valid extraction

# Find unmatched brackets
python3 -c "
import sys
content = open(sys.argv[1]).read()
count = 0
for i, char in enumerate(content):
    if char == '{': count += 1
    elif char == '}': count -= 1
    if count < 0:
        print(f'Unmatched closing brace at position {i}')
        break
if count > 0:
    print(f'{count} unmatched opening braces')
elif count == 0:
    print('All brackets matched!')
" file.txt
```

---

**Last Updated**: November 20, 2025
**Next Update**: After completing re-extractions
