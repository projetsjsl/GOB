# 🎨 Customization Guide - Make Changes Easily

**Goal:** You can change ANYTHING without being locked in.

---

## 🔧 Common Modifications (5 minutes each)

### 1. **Change Skeleton Colors**

**Location:** `src/components/shared/LoadingSkeletons.tsx`

**Current:**
```tsx
<div className="animate-pulse bg-gray-700/50 rounded" />
```

**Want lighter?**
```tsx
<div className="animate-pulse bg-gray-600/50 rounded" />
```

**Want blue tint?**
```tsx
<div className="animate-pulse bg-blue-700/30 rounded" />
```

**Want gradient?**
```tsx
<div className="animate-pulse bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded" />
```

---

### 2. **Change Animation Speed**

**Tailwind's default:** `animate-pulse` (2s cycle)

**Want faster?**
```tsx
// Add to your CSS file
@keyframes pulse-fast {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse-fast {
  animation: pulse-fast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**Then use:**
```tsx
<div className="animate-pulse-fast bg-gray-700/50" />
```

---

### 3. **Change Skeleton Count**

**Current:**
```tsx
<StockListSkeleton count={8} />
```

**Want more/less?**
```tsx
<StockListSkeleton count={4} />  // Show fewer
<StockListSkeleton count={12} /> // Show more
```

**Want responsive count?**
```tsx
const count = window.innerWidth < 768 ? 4 : 8;
<StockListSkeleton count={count} />
```

---

### 4. **Add/Remove Skeleton Parts**

**Example: Remove logo from StockCardSkeleton**

**Before:**
```tsx
export const StockCardSkeleton: React.FC = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" /> {/* ← REMOVE THIS */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  </div>
);
```

**After:**
```tsx
export const StockCardSkeleton: React.FC = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  </div>
);
```

---

### 5. **Change Where Skeletons Appear**

**Don't like skeletons in card view?**

**File:** `src/components/tabs/StocksNewsTab.tsx`

**Find:**
```tsx
{tickers.length === 0 || loading ? (
  <StockCardSkeleton />
) : (
  <RealStockCard />
)}
```

**Change to:**
```tsx
{tickers.length === 0 ? (
  <StockCardSkeleton />
) : loading ? (
  <div>Loading...</div>  // Old style
) : (
  <RealStockCard />
)}
```

**Or remove entirely:**
```tsx
{loading ? null : <RealStockCard />}
```

---

## 🎯 Create Your Own Skeleton

**Step 1:** Copy the pattern
```tsx
export const MyCustomSkeleton: React.FC = () => (
  <div className="p-4 bg-gray-800 rounded-lg">
    <Skeleton className="h-6 w-32 mb-2" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);
```

**Step 2:** Import and use
```tsx
import { MyCustomSkeleton } from '../shared/LoadingSkeletons';

{loading ? <MyCustomSkeleton /> : <MyComponent />}
```

---

## 🚫 Disable Skeletons Entirely

### Option 1: Feature Flag (Recommended)
```tsx
// Add to your config
const ENABLE_SKELETONS = false;

// In your component
{loading ? (
  ENABLE_SKELETONS ? <Skeleton /> : <div>Loading...</div>
) : (
  <RealContent />
)}
```

### Option 2: Quick Toggle Per Tab
```tsx
// In StocksNewsTab.tsx, change line 862:
const USE_SKELETONS = false;  // ← Add this

{loading ? (
  USE_SKELETONS ? <StockListSkeleton /> : <p>Loading...</p>
) : (
  <RealContent />
)}
```

### Option 3: Complete Removal
1. Delete `src/components/shared/LoadingSkeletons.tsx`
2. Remove imports from `StocksNewsTab.tsx`
3. Replace skeleton calls with old loading messages

**Time:** 2 minutes

---

## 🔄 Modify Loading States Logic

### Current Pattern:
```tsx
{tickers.length === 0 || loading ? (
  <Skeleton />
) : (
  <Content />
)}
```

### Want skeleton only on first load?
```tsx
const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

useEffect(() => {
  if (!loading && tickers.length > 0) {
    setHasLoadedOnce(true);
  }
}, [loading, tickers]);

{!hasLoadedOnce && loading ? (
  <Skeleton />
) : (
  <Content />
)}
```

### Want skeleton only for slow loads?
```tsx
const [showSkeleton, setShowSkeleton] = useState(false);

useEffect(() => {
  if (loading) {
    const timer = setTimeout(() => setShowSkeleton(true), 300);
    return () => clearTimeout(timer);
  }
  setShowSkeleton(false);
}, [loading]);

{showSkeleton ? <Skeleton /> : <Content />}
```

---

## 📦 Component Architecture (Nothing is locked)

```
src/
├── components/
│   ├── shared/
│   │   └── LoadingSkeletons.tsx  ← All skeletons (1 file)
│   └── tabs/
│       └── StocksNewsTab.tsx     ← Uses skeletons (3 changes)
```

**Key Points:**
1. ✅ **Only 1 file** contains skeleton components
2. ✅ **Only 3 places** use them in StocksNewsTab
3. ✅ **No global changes** - other tabs unaffected
4. ✅ **No config files** modified
5. ✅ **No build changes** needed

---

## 🎨 Styling Flexibility

### Change for ONE skeleton:
```tsx
<StockCardSkeleton className="my-custom-class" />
```

### Change for ALL skeletons:
```tsx
// In LoadingSkeletons.tsx, modify the base Skeleton:
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-purple-700/50 rounded ${className}`} />
  //                              ↑ Change this
);
```

### Add custom props:
```tsx
export const StockCardSkeleton: React.FC<{ 
  color?: string 
}> = ({ color = 'bg-gray-700/50' }) => (
  <div className={`animate-pulse ${color}`} />
);

// Usage:
<StockCardSkeleton color="bg-blue-700/50" />
```

---

## 🧪 Test Your Changes Instantly

1. **Make change** in `LoadingSkeletons.tsx`
2. **Save file** (Vite auto-reloads)
3. **See result** in browser immediately
4. **Don't like it?** Undo (Cmd+Z)

**No build step. No compilation. Instant feedback.**

---

## 💡 Pro Tips

### 1. **Keep Old Code Commented**
```tsx
{loading ? (
  <StockListSkeleton count={8} />
  // <div>Loading...</div>  ← Old code, easy to restore
) : (
  <Content />
)}
```

### 2. **Use Git Branches**
```bash
git checkout -b test-skeleton-changes
# Make changes
# Don't like it?
git checkout main  # Back to original
```

### 3. **Create Variants**
```tsx
// LoadingSkeletons.tsx
export const StockCardSkeletonLight = () => (
  <div className="bg-gray-600/30">...</div>
);

export const StockCardSkeletonDark = () => (
  <div className="bg-gray-800/50">...</div>
);

// Use conditionally
{isDarkMode ? <StockCardSkeletonDark /> : <StockCardSkeletonLight />}
```

---

## 🚀 Future-Proofing

### Easy to Add Features:
```tsx
// Want shimmer effect?
export const Skeleton = ({ shimmer = false }) => (
  <div className={`animate-pulse ${shimmer ? 'animate-shimmer' : ''}`} />
);

// Want blur effect?
export const Skeleton = ({ blur = false }) => (
  <div className={`animate-pulse ${blur ? 'blur-sm' : ''}`} />
);

// Want glow effect?
export const Skeleton = ({ glow = false }) => (
  <div className={`animate-pulse ${glow ? 'shadow-lg shadow-blue-500/50' : ''}`} />
);
```

### Easy to Replace:
```tsx
// Don't like our skeletons? Use a library instead:
import { Skeleton } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Just replace imports, logic stays same
```

---

## 📋 Quick Reference: Where Things Are

| What to Change | File | Line(s) |
|----------------|------|---------|
| Skeleton colors | `LoadingSkeletons.tsx` | Line 7 |
| Skeleton count | `StocksNewsTab.tsx` | Lines 862, 970, 1537 |
| Enable/disable | `StocksNewsTab.tsx` | Add flag at top |
| Add new skeleton | `LoadingSkeletons.tsx` | Add new export |
| Skeleton animation | `LoadingSkeletons.tsx` | Line 7 className |

---

## ✅ You're NOT Locked In

### Can Change:
- ✅ Colors, sizes, shapes
- ✅ Animation speed/type
- ✅ Where skeletons appear
- ✅ When skeletons show
- ✅ How many skeletons
- ✅ Add your own skeletons
- ✅ Remove skeletons entirely

### Cannot Change:
- ❌ Nothing! Everything is customizable

### Rollback Time:
- **1 file:** 30 seconds
- **Full removal:** 2 minutes
- **Zero risk**

---

## 🎯 Bottom Line

**You have 100% control.**

Every line is in files you can edit. No magic, no hidden config, no locked patterns.

If you don't like something:
1. Open the file
2. Change it
3. Save
4. Done

**No canvas. No lock-in. Full flexibility.**