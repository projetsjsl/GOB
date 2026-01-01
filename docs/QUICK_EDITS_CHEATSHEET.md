# ⚡ Quick Edits Cheatsheet

**For when you need to change something in 60 seconds.**

---

## 🎨 Skeleton Appearance

### Make skeletons lighter/darker
**File:** `src/components/shared/LoadingSkeletons.tsx` → Line 7

```tsx
// Current
<div className="animate-pulse bg-gray-700/50" />

// Lighter
<div className="animate-pulse bg-gray-600/40" />

// Darker  
<div className="animate-pulse bg-gray-800/60" />

// Blue-ish
<div className="animate-pulse bg-blue-700/30" />
```

---

### Make skeletons rounder/sharper
**Same file** → Add to any skeleton

```tsx
// More rounded
<div className="animate-pulse bg-gray-700/50 rounded-xl" />

// Sharp corners
<div className="animate-pulse bg-gray-700/50 rounded-none" />

// Fully round
<div className="animate-pulse bg-gray-700/50 rounded-full" />
```

---

### Change animation
**Same file** → Line 7

```tsx
// Slower pulse
<div className="animate-pulse-slow bg-gray-700/50" />

// No animation
<div className="bg-gray-700/50" />

// Slide animation
<div className="animate-slide bg-gray-700/50" />
```

---

## 🔢 How Many Skeletons

**File:** `src/components/tabs/StocksNewsTab.tsx`

```tsx
// Search for: StockListSkeleton count={8}
// Change to: StockListSkeleton count={4}  // Show fewer

// Search for: [...Array(9)]
// Change to: [...Array(6)]  // Show fewer news cards
```

**Locations:**
- Line 862: List view
- Line 970: Card view  
- Line 1540: News section

---

## 🎯 Turn Skeletons On/Off

### Per Tab (Recommended)
**File:** `src/components/tabs/StocksNewsTab.tsx` → Top of component

```tsx
const StocksNewsTab = (props) => {
  const USE_SKELETONS = false;  // ← Add this line
  
  // Then change:
  {loading ? (
    USE_SKELETONS ? <StockListSkeleton /> : <p>Loading...</p>
  ) : (
    <Content />
  )}
}
```

### Globally (All Tabs)
**Create:** `src/config/features.ts`

```tsx
export const FEATURES = {
  LOADING_SKELETONS: true  // ← Toggle here
};
```

**Import everywhere:**
```tsx
import { FEATURES } from '@/config/features';

{loading && FEATURES.LOADING_SKELETONS ? <Skeleton /> : null}
```

---

## 🚫 Remove Skeletons Completely

**Step 1:** Delete file
```bash
rm src/components/shared/LoadingSkeletons.tsx
```

**Step 2:** Remove imports from `StocksNewsTab.tsx`
```tsx
// Delete these lines (around line 7):
import {
  StockListSkeleton,
  // ... etc
} from '../shared/LoadingSkeletons';
```

**Step 3:** Replace skeleton calls
```bash
# Find (Cmd+F):
<StockListSkeleton

# Replace with:
<div className="text-center py-12 text-gray-400">Loading...</div>
```

**Done!** Back to original.

---

## 🎨 Create Your Own Skeleton

**File:** `src/components/shared/LoadingSkeletons.tsx` → Add at bottom

```tsx
export const MyCustomSkeleton: React.FC = () => (
  <div className="p-6 bg-gray-800 rounded-xl space-y-3">
    <Skeleton className="h-8 w-40" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
);
```

**Use it:**
```tsx
import { MyCustomSkeleton } from '../shared/LoadingSkeletons';

{loading ? <MyCustomSkeleton /> : <MyComponent />}
```

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Change color | 30 sec |
| Change count | 15 sec |
| Add new skeleton | 2 min |
| Disable per tab | 1 min |
| Remove entirely | 2 min |
| Custom animation | 5 min |

---

## 🆘 Undo Anything

### Just saved wrong change?
```
Cmd+Z (Mac) / Ctrl+Z (Windows)
```

### Saved a while ago?
```bash
git diff src/components/shared/LoadingSkeletons.tsx
git checkout src/components/shared/LoadingSkeletons.tsx
```

### Want clean slate?
```bash
git stash  # Save your changes
# Test original
git stash pop  # Get your changes back
```

---

## 💡 Pro Shortcuts

### Find all skeleton usage:
```bash
# Mac/Linux:
grep -r "Skeleton" src/components/tabs/

# Or use VSCode:
Cmd+Shift+F → Search: "Skeleton"
```

### Replace all colors at once:
```
Find: bg-gray-700/50
Replace: bg-blue-700/40
Replace All
```

### Copy skeleton to other tabs:
```tsx
// Copy from StocksNewsTab.tsx
import { StockListSkeleton } from '../shared/LoadingSkeletons';

// Paste in any other tab
import { StockListSkeleton } from '../shared/LoadingSkeletons';
```

---

## 🎯 Most Common Edits

**90% of changes are:**

1. **Color** → `LoadingSkeletons.tsx` line 7
2. **Count** → `StocksNewsTab.tsx` search "count="
3. **On/Off** → Add `USE_SKELETONS` flag

**That's it!**

---

## 📱 Contact for Help

Stuck? Check these first:

1. **Syntax error?** → Check browser console (F12)
2. **Not showing?** → Check import statement
3. **Wrong style?** → Check className spelling

**Still stuck?** You can ask Kombai again anytime.

---

**Remember:** Nothing is locked. Everything is a file you can edit.

**Time to read this:** 3 minutes  
**Time to make most changes:** 30 seconds  
**Risk of breaking something:** Near zero