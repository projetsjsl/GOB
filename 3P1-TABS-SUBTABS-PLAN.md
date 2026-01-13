# 3P1 Tabs & Sub-Tabs Implementation Plan (250 Specs)
## 4 Sprints for Ralph-Loop Execution
### Full Permissions Mode - No Confirmation Required

---

## Overview

Implement a comprehensive tabbed navigation system for the 3P1 Finance Pro application with:
- **Main Tabs**: Analysis, KPI Dashboard, Data Explorer, Admin, Settings
- **Sub-Tabs**: Context-specific nested navigation within each main tab
- **State Management**: Persistent tab state across sessions
- **Responsive Design**: Mobile-friendly tab navigation
- **Keyboard Navigation**: Full accessibility support

---

## SPRINT 1: Core Tab Infrastructure (70 Specs)
### Goal: Build the foundational tab system with proper state management

---

### T1-ARCH: Tab Architecture & Types (15 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T1-ARCH-001 | Define TabConfig interface | `{ id, label, icon, component, subTabs?, disabled?, badge? }` |
| T1-ARCH-002 | Define SubTabConfig interface | `{ id, label, icon?, component, parentId }` |
| T1-ARCH-003 | Define TabState type | `{ activeTab, activeSubTab, history, collapsed }` |
| T1-ARCH-004 | Create TabContext provider | React Context for global tab state |
| T1-ARCH-005 | Create useTab hook | Access and modify tab state |
| T1-ARCH-006 | Create useSubTab hook | Access and modify sub-tab state |
| T1-ARCH-007 | Define TabPermission type | `{ canView, canEdit, requiresAuth }` |
| T1-ARCH-008 | Create TabRegistry singleton | Central tab configuration store |
| T1-ARCH-009 | Define TabEvent interface | `{ type, tabId, subTabId?, timestamp }` |
| T1-ARCH-010 | Create TabEventEmitter | Pub/sub for tab changes |
| T1-ARCH-011 | Define TabAnimation type | `fade | slide | none` |
| T1-ARCH-012 | Create TabTransition component | Animated tab switches |
| T1-ARCH-013 | Define TabLayout enum | `horizontal | vertical | sidebar` |
| T1-ARCH-014 | Create TabLayoutManager | Handle different layouts |
| T1-ARCH-015 | Define TabBadge interface | `{ count?, color?, pulse? }` |

---

### T1-COMP: Core Tab Components (20 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T1-COMP-001 | Create TabContainer component | Main wrapper for tab system |
| T1-COMP-002 | Create TabBar component | Horizontal tab navigation bar |
| T1-COMP-003 | Create TabItem component | Individual clickable tab |
| T1-COMP-004 | Create TabPanel component | Content area for active tab |
| T1-COMP-005 | Create TabIcon component | Icon display with fallback |
| T1-COMP-006 | Create TabLabel component | Text label with truncation |
| T1-COMP-007 | Create TabBadge component | Notification/count badge |
| T1-COMP-008 | Create TabDivider component | Visual separator between tabs |
| T1-COMP-009 | Create TabDropdown component | Overflow menu for many tabs |
| T1-COMP-010 | Create TabScrollContainer | Horizontal scroll for tabs |
| T1-COMP-011 | Create SubTabContainer | Wrapper for sub-tab navigation |
| T1-COMP-012 | Create SubTabBar component | Secondary navigation bar |
| T1-COMP-013 | Create SubTabItem component | Individual sub-tab button |
| T1-COMP-014 | Create SubTabPanel component | Content area for sub-tab |
| T1-COMP-015 | Create TabSkeleton component | Loading placeholder |
| T1-COMP-016 | Create TabError component | Error state display |
| T1-COMP-017 | Create TabEmpty component | Empty state display |
| T1-COMP-018 | Create TabCloseButton | Closable tab support |
| T1-COMP-019 | Create TabAddButton | Add new tab button |
| T1-COMP-020 | Create TabContextMenu | Right-click menu |

---

### T1-STATE: State Management (15 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T1-STATE-001 | Initialize default tab state | First tab active on load |
| T1-STATE-002 | Persist tab state to localStorage | Survive page refresh |
| T1-STATE-003 | Restore tab state on mount | Load from localStorage |
| T1-STATE-004 | Track tab navigation history | Back/forward support |
| T1-STATE-005 | Clear tab history on logout | Security measure |
| T1-STATE-006 | Sync tab state across tabs | Multi-tab browser support |
| T1-STATE-007 | Handle tab state conflicts | Last-write-wins or merge |
| T1-STATE-008 | Validate tab state on restore | Handle deleted tabs |
| T1-STATE-009 | Reset to default state action | Clear all customizations |
| T1-STATE-010 | Export tab state for backup | JSON export |
| T1-STATE-011 | Import tab state from backup | JSON import |
| T1-STATE-012 | Track sub-tab state per parent | Each main tab remembers sub-tab |
| T1-STATE-013 | Handle deep linking to sub-tabs | URL reflects full path |
| T1-STATE-014 | Debounce state persistence | Avoid excessive writes |
| T1-STATE-015 | Handle storage quota exceeded | Graceful degradation |

---

### T1-NAV: Navigation Logic (20 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T1-NAV-001 | Switch tab on click | Basic navigation |
| T1-NAV-002 | Switch sub-tab on click | Nested navigation |
| T1-NAV-003 | Keyboard navigation (arrows) | Left/right arrow keys |
| T1-NAV-004 | Keyboard activation (Enter/Space) | Activate focused tab |
| T1-NAV-005 | Tab key navigation | Focus management |
| T1-NAV-006 | Home/End key navigation | First/last tab |
| T1-NAV-007 | Escape key behavior | Close sub-menu or return |
| T1-NAV-008 | Prevent navigation to disabled | No action on disabled |
| T1-NAV-009 | Confirm before leaving dirty tab | Unsaved changes warning |
| T1-NAV-010 | Navigate via URL hash | #tab/subtab routing |
| T1-NAV-011 | Navigate via URL params | ?tab=x&subtab=y routing |
| T1-NAV-012 | Update URL on tab change | History API integration |
| T1-NAV-013 | Handle browser back/forward | Respect history |
| T1-NAV-014 | Deep link to specific sub-tab | /app/analysis/assumptions |
| T1-NAV-015 | Redirect invalid tab URLs | Fallback to default |
| T1-NAV-016 | Navigate programmatically | useNavigateTab hook |
| T1-NAV-017 | Navigate with replace | No history entry |
| T1-NAV-018 | Navigate with callback | After navigation action |
| T1-NAV-019 | Block navigation conditionally | Guard function |
| T1-NAV-020 | Queue navigation during transition | Prevent race conditions |

---

## SPRINT 2: UI/UX & Styling (70 Specs)
### Goal: Polish the visual design and user experience

---

### T2-STYLE: Visual Styling (25 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T2-STYLE-001 | Tab active state styling | Bold, underline, color |
| T2-STYLE-002 | Tab hover state styling | Background highlight |
| T2-STYLE-003 | Tab focus state styling | Outline ring |
| T2-STYLE-004 | Tab disabled state styling | Muted, no pointer |
| T2-STYLE-005 | Tab loading state styling | Spinner or skeleton |
| T2-STYLE-006 | Tab error state styling | Red border/icon |
| T2-STYLE-007 | Sub-tab active indicator | Bottom border or pill |
| T2-STYLE-008 | Tab badge styling | Color, size, position |
| T2-STYLE-009 | Tab icon sizing | Consistent 20px |
| T2-STYLE-010 | Tab label typography | Font, size, weight |
| T2-STYLE-011 | Tab spacing/padding | Consistent gaps |
| T2-STYLE-012 | Tab container border | Bottom border line |
| T2-STYLE-013 | Dark mode support | Theme-aware colors |
| T2-STYLE-014 | Light mode support | Default theme |
| T2-STYLE-015 | System theme detection | prefers-color-scheme |
| T2-STYLE-016 | Tab panel background | Distinct from tabs |
| T2-STYLE-017 | Tab panel padding | Content spacing |
| T2-STYLE-018 | Tab scroll arrows | Left/right indicators |
| T2-STYLE-019 | Tab overflow gradient | Fade at edges |
| T2-STYLE-020 | Tab dropdown trigger | "More" or "..." button |
| T2-STYLE-021 | Tab dropdown menu | Popup styling |
| T2-STYLE-022 | Tab close button hover | Show on hover |
| T2-STYLE-023 | Tab drag indicator | Reorder visual |
| T2-STYLE-024 | Tab separator styling | Vertical line between |
| T2-STYLE-025 | Tab group styling | Visual grouping |

---

### T2-ANIM: Animations & Transitions (15 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T2-ANIM-001 | Tab switch animation | Fade or slide |
| T2-ANIM-002 | Tab hover animation | Scale or highlight |
| T2-ANIM-003 | Tab active animation | Bounce or pulse |
| T2-ANIM-004 | Tab badge animation | Pulse on update |
| T2-ANIM-005 | Sub-tab expand animation | Slide down |
| T2-ANIM-006 | Sub-tab collapse animation | Slide up |
| T2-ANIM-007 | Tab panel enter animation | Fade in |
| T2-ANIM-008 | Tab panel exit animation | Fade out |
| T2-ANIM-009 | Reduced motion support | prefers-reduced-motion |
| T2-ANIM-010 | Tab scroll animation | Smooth scroll |
| T2-ANIM-011 | Tab reorder animation | Drag feedback |
| T2-ANIM-012 | Tab close animation | Shrink and fade |
| T2-ANIM-013 | Tab add animation | Expand from button |
| T2-ANIM-014 | Loading spinner animation | Rotate |
| T2-ANIM-015 | Error shake animation | Attention grab |

---

### T2-RESP: Responsive Design (15 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T2-RESP-001 | Desktop layout (1024px+) | Full horizontal tabs |
| T2-RESP-002 | Tablet layout (768-1023px) | Condensed tabs |
| T2-RESP-003 | Mobile layout (< 768px) | Bottom nav or drawer |
| T2-RESP-004 | Tab label hide on mobile | Icon only |
| T2-RESP-005 | Sub-tab as dropdown mobile | Save space |
| T2-RESP-006 | Touch-friendly tap targets | 44px minimum |
| T2-RESP-007 | Swipe gesture for tabs | Left/right swipe |
| T2-RESP-008 | Pull down for sub-tabs | Mobile gesture |
| T2-RESP-009 | Breakpoint transitions | Smooth layout shift |
| T2-RESP-010 | Orientation change handling | Portrait/landscape |
| T2-RESP-011 | Safe area support | iPhone notch |
| T2-RESP-012 | Foldable device support | Fold awareness |
| T2-RESP-013 | High DPI support | Crisp icons |
| T2-RESP-014 | Print stylesheet | Clean print output |
| T2-RESP-015 | TV/large screen layout | Extra large text |

---

### T2-A11Y: Accessibility (15 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T2-A11Y-001 | ARIA tablist role | Container role |
| T2-A11Y-002 | ARIA tab role | Tab button role |
| T2-A11Y-003 | ARIA tabpanel role | Content panel role |
| T2-A11Y-004 | aria-selected attribute | Current tab indicator |
| T2-A11Y-005 | aria-controls attribute | Panel association |
| T2-A11Y-006 | aria-labelledby attribute | Panel labeled by tab |
| T2-A11Y-007 | aria-disabled attribute | Disabled state |
| T2-A11Y-008 | tabindex management | Focus control |
| T2-A11Y-009 | Focus visible styles | Keyboard focus ring |
| T2-A11Y-010 | Screen reader announcements | Tab changes |
| T2-A11Y-011 | Skip to content link | Bypass tabs |
| T2-A11Y-012 | High contrast mode | Windows HC support |
| T2-A11Y-013 | Color contrast 4.5:1 | WCAG AA |
| T2-A11Y-014 | Text scaling to 200% | No overflow |
| T2-A11Y-015 | Voice control support | Dictation compatible |

---

## SPRINT 3: Features & Integration (60 Specs)
### Goal: Add advanced features and integrate with existing 3P1 app

---

### T3-FEAT: Advanced Features (20 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T3-FEAT-001 | Closable tabs | X button to close |
| T3-FEAT-002 | Draggable tab reordering | Drag and drop |
| T3-FEAT-003 | Tab pinning | Pin to left |
| T3-FEAT-004 | Tab groups | Group related tabs |
| T3-FEAT-005 | Tab search | Filter tabs by name |
| T3-FEAT-006 | Tab favorites | Star/bookmark tabs |
| T3-FEAT-007 | Recent tabs list | Quick access to recent |
| T3-FEAT-008 | Tab shortcuts | Ctrl+1-9 for tabs |
| T3-FEAT-009 | Tab context menu | Right-click actions |
| T3-FEAT-010 | Duplicate tab | Clone current tab |
| T3-FEAT-011 | Move tab to window | Multi-window support |
| T3-FEAT-012 | Tab undo close | Restore closed tab |
| T3-FEAT-013 | Tab notifications | Badge updates |
| T3-FEAT-014 | Tab progress indicator | Loading bar |
| T3-FEAT-015 | Tab split view | Side by side |
| T3-FEAT-016 | Tab maximize | Full screen mode |
| T3-FEAT-017 | Tab minimize | Collapse to icon |
| T3-FEAT-018 | Tab lazy loading | Load on first view |
| T3-FEAT-019 | Tab preloading | Prefetch next tab |
| T3-FEAT-020 | Tab refresh action | Reload content |

---

### T3-INT: 3P1 Integration (25 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T3-INT-001 | Analysis tab with sub-tabs | Data, Assumptions, Charts |
| T3-INT-002 | Analysis > Data sub-tab | Historical data grid |
| T3-INT-003 | Analysis > Assumptions sub-tab | Growth rates form |
| T3-INT-004 | Analysis > Charts sub-tab | Valuation charts |
| T3-INT-005 | Analysis > Sensitivity sub-tab | Sensitivity tables |
| T3-INT-006 | KPI Dashboard tab | Main KPI view |
| T3-INT-007 | KPI > Overview sub-tab | Summary stats |
| T3-INT-008 | KPI > JPEGY Chart sub-tab | Scatter plot |
| T3-INT-009 | KPI > Returns sub-tab | Return distribution |
| T3-INT-010 | KPI > Table sub-tab | Full data table |
| T3-INT-011 | KPI > Comparison sub-tab | Side-by-side |
| T3-INT-012 | Data Explorer tab | Raw data browse |
| T3-INT-013 | Data Explorer > Snapshots sub-tab | Version history |
| T3-INT-014 | Data Explorer > Raw Data sub-tab | JSON viewer |
| T3-INT-015 | Data Explorer > Quality sub-tab | Data quality report |
| T3-INT-016 | Admin tab | Admin functions |
| T3-INT-017 | Admin > Sync sub-tab | Batch sync controls |
| T3-INT-018 | Admin > Tickers sub-tab | Ticker management |
| T3-INT-019 | Admin > Config sub-tab | App configuration |
| T3-INT-020 | Admin > Logs sub-tab | Error logs |
| T3-INT-021 | Settings tab | User preferences |
| T3-INT-022 | Settings > Profile sub-tab | User profile |
| T3-INT-023 | Settings > Display sub-tab | Theme, layout |
| T3-INT-024 | Settings > Notifications sub-tab | Alert settings |
| T3-INT-025 | Settings > Export sub-tab | Data export options |

---

### T3-DATA: Tab Data Management (15 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T3-DATA-001 | Tab-specific data loading | Fetch on activate |
| T3-DATA-002 | Tab data caching | Avoid re-fetch |
| T3-DATA-003 | Tab data invalidation | Clear on change |
| T3-DATA-004 | Tab data sharing | Cross-tab data |
| T3-DATA-005 | Tab loading state | Per-tab loading |
| T3-DATA-006 | Tab error state | Per-tab errors |
| T3-DATA-007 | Tab retry logic | Retry failed loads |
| T3-DATA-008 | Tab data refresh | Manual refresh |
| T3-DATA-009 | Tab auto-refresh | Interval refresh |
| T3-DATA-010 | Tab stale detection | Mark stale data |
| T3-DATA-011 | Tab data prefetch | Prefetch adjacent |
| T3-DATA-012 | Tab data persistence | LocalStorage backup |
| T3-DATA-013 | Tab data sync | Supabase sync |
| T3-DATA-014 | Tab data conflict | Handle conflicts |
| T3-DATA-015 | Tab data reset | Clear tab data |

---

## SPRINT 4: Observations & Improvements (50 Specs)
### Goal: Address issues discovered during implementation and add enhancements

---

### T4-OBS: Observed Issues & Fixes (20 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T4-OBS-001 | Fix star icons showing on all tickers | Only team tickers get stars |
| T4-OBS-002 | Fix KPI loading performance | Bulk query optimization |
| T4-OBS-003 | Fix syntax errors in components | Reserved words, async issues |
| T4-OBS-004 | Fix N/A values display | Proper null handling |
| T4-OBS-005 | Fix duplicate alt attributes | Remove duplicates |
| T4-OBS-006 | Clean skeleton snapshots | Database cleanup |
| T4-OBS-007 | Remove test tickers | Delete BULK*, TEST* |
| T4-OBS-008 | Fix isWatchlist logic | Explicit true/false/null |
| T4-OBS-009 | Fix market data cache | Proper price fetching |
| T4-OBS-010 | Fix tab memory leaks | Cleanup on unmount |
| T4-OBS-011 | Fix tab focus trap | Proper escape |
| T4-OBS-012 | Fix tab scroll position | Preserve on return |
| T4-OBS-013 | Fix tab animation jank | CSS optimization |
| T4-OBS-014 | Fix mobile tab overflow | Horizontal scroll |
| T4-OBS-015 | Fix tab badge count | Real-time updates |
| T4-OBS-016 | Fix sub-tab deep linking | Full URL support |
| T4-OBS-017 | Fix tab keyboard nav | Arrow key issues |
| T4-OBS-018 | Fix tab print layout | Clean print CSS |
| T4-OBS-019 | Fix tab SSR support | Server-side render |
| T4-OBS-020 | Fix tab hydration mismatch | Client/server sync |

---

### T4-ENH: Enhancements (15 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T4-ENH-001 | Add tab quick switch | Ctrl+Tab cycling |
| T4-ENH-002 | Add tab search modal | Cmd+K search |
| T4-ENH-003 | Add tab history modal | Recent tabs view |
| T4-ENH-004 | Add tab customization | User preferences |
| T4-ENH-005 | Add tab export state | Share tab layout |
| T4-ENH-006 | Add tab import state | Import layout |
| T4-ENH-007 | Add tab analytics | Track usage |
| T4-ENH-008 | Add tab tips/hints | Onboarding tooltips |
| T4-ENH-009 | Add tab command palette | All actions menu |
| T4-ENH-010 | Add tab session restore | After crash |
| T4-ENH-011 | Add tab workspace | Save/restore sets |
| T4-ENH-012 | Add tab sync cloud | Cross-device sync |
| T4-ENH-013 | Add tab collaboration | Multi-user tabs |
| T4-ENH-014 | Add tab permissions | Role-based access |
| T4-ENH-015 | Add tab audit log | Track changes |

---

### T4-TEST: Testing & Quality (15 specs)

| ID | Spec | Implementation |
|----|------|----------------|
| T4-TEST-001 | Unit tests for TabContext | Jest tests |
| T4-TEST-002 | Unit tests for useTab hook | Hook testing |
| T4-TEST-003 | Unit tests for navigation | Nav logic tests |
| T4-TEST-004 | Integration tests for tabs | Component tests |
| T4-TEST-005 | E2E tests for tab flow | Playwright tests |
| T4-TEST-006 | Accessibility audit | axe-core tests |
| T4-TEST-007 | Performance benchmark | Lighthouse audit |
| T4-TEST-008 | Visual regression tests | Screenshot compare |
| T4-TEST-009 | Cross-browser testing | Chrome/Safari/Firefox |
| T4-TEST-010 | Mobile device testing | Real device tests |
| T4-TEST-011 | Screen reader testing | VoiceOver/NVDA |
| T4-TEST-012 | Keyboard-only testing | Tab navigation |
| T4-TEST-013 | Load testing | Many tabs performance |
| T4-TEST-014 | Memory leak testing | Long session tests |
| T4-TEST-015 | Error boundary testing | Graceful failures |

---

## Execution Summary

| Sprint | Specs | Focus Area |
|--------|-------|------------|
| Sprint 1 | 70 | Core Tab Infrastructure (Architecture, Components, State, Navigation) |
| Sprint 2 | 70 | UI/UX & Styling (Visual, Animations, Responsive, Accessibility) |
| Sprint 3 | 60 | Features & Integration (Advanced Features, 3P1 Integration, Data) |
| Sprint 4 | 50 | Observations & Improvements (Fixes, Enhancements, Testing) |
| **TOTAL** | **250** | **Complete Tabs/Sub-Tabs System** |

---

## Implementation Priority Order

### Phase 1: Foundation (Sprint 1 first half)
1. T1-ARCH-001 to T1-ARCH-010 (Type definitions)
2. T1-COMP-001 to T1-COMP-010 (Core components)
3. T1-STATE-001 to T1-STATE-005 (Basic state)

### Phase 2: Navigation (Sprint 1 second half)
4. T1-NAV-001 to T1-NAV-010 (Basic navigation)
5. T1-COMP-011 to T1-COMP-015 (Sub-tab components)
6. T1-STATE-006 to T1-STATE-015 (Advanced state)

### Phase 3: Styling (Sprint 2 first half)
7. T2-STYLE-001 to T2-STYLE-015 (Core styling)
8. T2-ANIM-001 to T2-ANIM-010 (Animations)
9. T2-A11Y-001 to T2-A11Y-010 (Accessibility)

### Phase 4: Responsive (Sprint 2 second half)
10. T2-RESP-001 to T2-RESP-015 (Responsive design)
11. T2-STYLE-016 to T2-STYLE-025 (Advanced styling)
12. T2-ANIM-011 to T2-ANIM-015 (Polish)

### Phase 5: Features (Sprint 3 first half)
13. T3-FEAT-001 to T3-FEAT-010 (Core features)
14. T3-INT-001 to T3-INT-015 (3P1 integration)
15. T3-DATA-001 to T3-DATA-010 (Data management)

### Phase 6: Polish (Sprint 3 second half)
16. T3-FEAT-011 to T3-FEAT-020 (Advanced features)
17. T3-INT-016 to T3-INT-025 (Full integration)
18. T3-DATA-011 to T3-DATA-015 (Data polish)

### Phase 7: Fixes (Sprint 4)
19. T4-OBS-001 to T4-OBS-020 (Bug fixes)
20. T4-ENH-001 to T4-ENH-015 (Enhancements)
21. T4-TEST-001 to T4-TEST-015 (Testing)

---

## File Structure

```
public/3p1/
├── components/
│   └── tabs/
│       ├── TabContainer.tsx
│       ├── TabBar.tsx
│       ├── TabItem.tsx
│       ├── TabPanel.tsx
│       ├── TabIcon.tsx
│       ├── TabBadge.tsx
│       ├── SubTabContainer.tsx
│       ├── SubTabBar.tsx
│       ├── SubTabItem.tsx
│       ├── SubTabPanel.tsx
│       ├── TabContextMenu.tsx
│       ├── TabDropdown.tsx
│       └── index.ts
├── hooks/
│   ├── useTab.ts
│   ├── useSubTab.ts
│   └── useTabNavigation.ts
├── context/
│   └── TabContext.tsx
├── types/
│   └── tabs.ts
├── utils/
│   └── tabUtils.ts
└── styles/
    └── tabs.css
```

---

## Ralph-Loop Execution Commands

```bash
# Sprint 1 - Core Infrastructure
/ralph-loop "Execute Sprint 1 specs T1-ARCH-001 through T1-NAV-020. Build foundational tab system with TypeScript types, React components, state management, and navigation logic. Create files in public/3p1/components/tabs/, hooks/, context/, types/. Full permissions - proceed without asking."

# Sprint 2 - UI/UX & Styling
/ralph-loop "Execute Sprint 2 specs T2-STYLE-001 through T2-A11Y-015. Add visual styling, animations, responsive design, and accessibility. Use Tailwind CSS. Support dark mode. Full permissions - proceed without asking."

# Sprint 3 - Features & Integration
/ralph-loop "Execute Sprint 3 specs T3-FEAT-001 through T3-DATA-015. Add advanced features (closable, draggable, searchable tabs) and integrate with 3P1 app (Analysis, KPI, Data Explorer, Admin, Settings tabs with sub-tabs). Full permissions - proceed without asking."

# Sprint 4 - Observations & Improvements
/ralph-loop "Execute Sprint 4 specs T4-OBS-001 through T4-TEST-015. Fix observed issues, add enhancements, and add tests. Address star icons, KPI loading, N/A values, and other issues. Full permissions - proceed without asking."
```

---

*Generated for Ralph-Loop Execution on 2026-01-13*
*Total: 250 specs across 4 sprints*
*Full permissions mode - no confirmation required*
