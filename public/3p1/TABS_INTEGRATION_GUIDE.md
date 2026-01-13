# 3P1 Tabs Integration Guide

## Overview
This guide explains how to integrate the new tabs system into the existing 3P1 application.

## Integration Strategy

The tabs system has been designed to integrate with minimal changes to the existing App.tsx codebase. We use a wrapper approach that preserves all existing functionality.

## Step-by-Step Integration

### Step 1: Replace View State with Tab Navigation

**Current Code** (Line ~199 in App.tsx):
```typescript
const [currentView, setCurrentView] = useState<'analysis' | 'info' | 'kpi'>('analysis');
```

**No Change Needed** - The tab system will manage this internally.

### Step 2: Replace View Buttons with TabsWrapper

**Current Code** (Lines ~5025-5060):
```typescript
<div className="flex gap-2 mb-4">
    <button
        onClick={() => setCurrentView('analysis')}
        className={...}
    >
        📊 Analysis
    </button>
    <button
        onClick={() => setCurrentView('kpi')}
        className={...}
    >
        📈 KPI Dashboard
    </button>
    <button
        onClick={() => setCurrentView('info')}
        className={...}
    >
        ℹ️ Info
    </button>
</div>
```

**Replace With**:
```typescript
import { TabsWrapper } from './components/tabs/TabsWrapper';

// In the render section, replace the button group and content area with:
<TabsWrapper
  defaultTab="analysis"
  onTabChange={(tabId, subTabId) => {
    // Optional: Track tab changes
    console.log('Tab changed:', tabId, subTabId);
  }}
/>
```

### Step 3: Remove Conditional Rendering Logic

**Current Code** (Lines ~5081-5090):
```typescript
{currentView === 'info' ? (
    <InfoTab {...props} />
) : currentView === 'kpi' ? (
    <Suspense fallback={<LoadingFallback />}>
        <KPIDashboard {...props} />
    </Suspense>
) : (
    // Analysis view
    <div>...</div>
)}
```

**This is handled by TabContainer** - No manual conditional rendering needed.

### Step 4: Update the TabsConfig to Use Real Components

Edit `/public/3p1/config/tabsConfig.tsx` to replace placeholder components with actual components that receive props from App.tsx:

```typescript
// Example: Analysis Data sub-tab
{
  id: 'analysis-data',
  label: 'Data',
  icon: TableCellsIcon,
  component: () => {
    // Access App.tsx state via React Context or props
    const { data, assumptions, onDataChange } = useAppContext();
    return <HistoricalTable data={data} assumptions={assumptions} onChange={onDataChange} />;
  },
  parentId: 'analysis',
}
```

### Step 5: Create App Context (Optional but Recommended)

To share state between App.tsx and tab components, create a context:

```typescript
// Create /public/3p1/context/AppContext.tsx

import React, { createContext, useContext } from 'react';
import { AnnualData, Assumptions, CompanyInfo } from '../types';

interface AppContextValue {
  data: AnnualData[];
  assumptions: Assumptions;
  info: CompanyInfo;
  notes: string;
  isWatchlist: boolean;
  onDataChange: (data: AnnualData[]) => void;
  onAssumptionsChange: (assumptions: Assumptions) => void;
  onInfoChange: (info: CompanyInfo) => void;
  onNotesChange: (notes: string) => void;
  // ... other shared state
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children, value }: { children: React.ReactNode; value: AppContextValue }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
```

Then wrap the TabsWrapper in App.tsx:

```typescript
<AppProvider value={{
  data,
  assumptions,
  info,
  notes,
  isWatchlist,
  onDataChange: setData,
  onAssumptionsChange: setAssumptions,
  onInfoChange: setInfo,
  onNotesChange: setNotes,
  // ... other state
}}>
  <TabsWrapper defaultTab="analysis" />
</AppProvider>
```

## Minimal Integration (Quick Start)

If you want to integrate quickly without major refactoring:

1. **Keep existing App.tsx structure**
2. **Add tabs to Header component instead**:

```typescript
// In Header.tsx, add import:
import { useTab } from '../context/TabContext';
import { TabBar } from './tabs/TabBar';
import { tabs3P1Config } from '../config/tabsConfig';

// In Header component, add:
<TabBar
  tabs={tabs3P1Config}
  activeTabId={activeTab}
  onTabClick={(tabId) => setActiveTab(tabId)}
  showIcons={true}
  showLabels={true}
/>
```

3. **Use TabProvider at App root**:

```typescript
import { TabProvider } from './context/TabContext';
import { tabs3P1Config } from './config/tabsConfig';

// Wrap entire App:
<TabProvider tabs={tabs3P1Config} defaultTab="analysis">
  {/* Existing App content */}
</TabProvider>
```

4. **Update content rendering to use tab state**:

```typescript
import { useTab } from './context/TabContext';

function App() {
  const { state } = useTab();

  // Replace currentView with state.activeTab
  const currentView = state.activeTab;

  // Rest of App logic remains the same
}
```

## Benefits of Tab System

1. **Persistent State**: Tab history saved to localStorage
2. **URL Routing**: Deep linking support (e.g., `#analysis/assumptions`)
3. **Keyboard Navigation**: Arrow keys, Home/End, Tab key
4. **Accessibility**: Full ARIA support, screen reader compatible
5. **Sub-tabs**: Organized navigation within each main tab
6. **Extensibility**: Easy to add new tabs without modifying App.tsx

## Testing the Integration

After integration, test:

1. ✅ Tab switching works
2. ✅ Sub-tab navigation works
3. ✅ Data persists when switching tabs
4. ✅ Keyboard navigation (arrows, Tab, Enter)
5. ✅ URL updates with tab changes
6. ✅ Browser back/forward buttons work
7. ✅ Tab state persists after refresh

## Rollback Plan

If issues occur:
1. Remove `<TabProvider>` wrapper
2. Restore original `currentView` state logic
3. Restore original button group for view switching

## Next Steps

1. Build the application: `npm run build`
2. Test in development: `npm run dev`
3. Verify all features work correctly
4. Commit changes with descriptive message

## Support

If you encounter issues:
- Check browser console for errors
- Verify all imports are correct
- Ensure TabProvider wraps the component tree
- Check that tab IDs match between config and usage
