# GOB Dashboard Navigation System Documentation

## Overview

This document explains the navigation architecture of the GOB Financial Dashboard (beta-combined-dashboard.html) to help future developers and LLM agents understand the structure.

## Navigation Components

### 1. Bottom Dock Navigation (`app-inline.js`)
**Location:** Lines ~26862-27050 in `app-inline.js`
**Component:** Part of `BetaCombinedDashboard` component

```jsx
<nav ref={navRef} className="fixed bottom-0 left-0 right-0...">
```

**Features:**
- Fixed at bottom of screen
- Auto-hides on scroll down (controlled by `isNavHidden` state)
- Reappears on scroll up or after 2 seconds of inactivity
- Contains main navigation tabs (Admin, Marchés, Titres, JLab, Emma, Tests, Plus)
- Centered items (`justify-center`)
- Dark/Light mode support

**Key States:**
- `isNavHidden` - Controls visibility during scroll
- `showLoadingScreen` - Hides during initial load
- `activeTab` - Currently active tab ID

### 2. Mobile/Side Navigation Overlay (`MobileNavOverlay.js`)
**Location:** `/public/js/dashboard/components/MobileNavOverlay.js`

**Features:**
- Positioned on the RIGHT side of screen (default)
- Menu icon button that expands to show navigation panel
- Larger button (p-4) with larger icon (w-7 h-7)
- Slides out panel with all navigation options

**Props:**
- `items` - Array of navigation items
- `activeTab` - Current tab ID
- `onTabChange` - Callback when tab changes
- `isDarkMode` - Theme control
- `position` - 'left' or 'right' (default: 'right')

### 3. Secondary Navigation Bar (`SecondaryNavBar.js`)
**Location:** `/public/js/dashboard/components/SecondaryNavBar.js`

**Features:**
- Sub-navigation within each main tab
- Configurable per tab via `secondaryNavConfig`
- Persisted to localStorage and Supabase

### 4. Page Name Indicator (Header Info Bar)
**Location:** CSS in `beta-combined-dashboard.html` (lines ~1311-1335)

**Features:**
- Fixed at TOP of screen (previously bottom)
- Shows: "GOB Apps | [Current Tab Name] • [Context]"
- Semi-transparent with blur effect
- Non-interactive (`pointer-events: none`)

## Scroll-Hide Behavior

**Implementation:** Lines ~3593-3627 in `app-inline.js`

```javascript
const [isNavHidden, setIsNavHidden] = useState(false);
const lastScrollY = useRef(0);
const scrollTimeout = useRef(null);

useEffect(() => {
    const handleScroll = () => {
        // Hide on scroll down > 10px when past 100px from top
        // Show on scroll up > 5px
        // Auto-show after 2 seconds of no scrolling
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // ...cleanup
}, []);
```

## Tab Configuration

### Main Tabs (allTabs array)
**Location:** ~Line 25765 in `app-inline.js`

```javascript
const allTabs = useMemo(() => [
    { id: 'admin-jslai', label: 'Admin', icon: 'iconoir-settings', component: AdminJSLaiTab },
    { id: 'marches-economy', label: 'Marchés', icon: 'iconoir-graph-up', component: MarketsEconomyTab },
    { id: 'stocks-news', label: 'Titres', icon: 'iconoir-wallet', component: StocksNewsTabWrapper },
    { id: 'jlab', label: 'JLab', icon: 'iconoir-code', component: JLabTabWrapper },
    { id: 'ask-emma', label: 'Emma', icon: 'iconoir-brain', component: AskEmmaTab },
    { id: 'testonly', label: 'Tests', icon: 'iconoir-flask', component: TestOnlyTab },
    // ... sub-tabs
], []);
```

### Sub-tabs
Sub-tabs are defined within the same `allTabs` array and accessed via the secondaryNavConfig:

```javascript
{ id: 'marches-yield', label: 'Courbe Taux', icon: 'iconoir-graph-up', component: YieldCurveTab },
{ id: 'jlab-advanced', label: 'Analyse Pro', icon: 'iconoir-activity', component: AdvancedAnalysisTab },
// etc.
```

## Configuration Persistence

### localStorage Keys:
- `gob-secondary-nav-config` - Secondary nav configuration per tab
- `gob-primary-nav-config` - Primary nav visibility settings

### Supabase Sync:
Configuration is loaded from `/api/admin/emma-config` on startup.

## File References

| File | Purpose |
|------|---------|
| `app-inline.js` | Main dashboard component, navigation logic |
| `MobileNavOverlay.js` | Side panel navigation (right side) |
| `SecondaryNavBar.js` | Sub-navigation within tabs |
| `SecondaryNavEditor.js` | Admin UI for configuring secondary nav |
| `beta-combined-dashboard.html` | Main HTML with CSS styles |

## CSS Classes for Navigation

- `fixed bottom-0` - Bottom dock positioning
- `translate-y-full` - Hidden state (off-screen)
- `translate-y-0` - Visible state
- `transition-all duration-300` - Smooth animations
- `backdrop-blur-md` - Frosted glass effect
- `z-40` / `z-[9999]` - Layering (higher = on top)

## Common Issues & Solutions

1. **Navigation not showing:** Check `showLoadingScreen` state
2. **Tabs not rendering:** Verify component is loaded on `window` object
3. **Sub-tabs empty:** Check `secondaryNavConfig` has entries for the tab
4. **Scroll-hide not working:** Ensure scroll listener is attached

---
*Last updated: 2025-12-22*
