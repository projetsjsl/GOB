# 📁 File Locations - Know Exactly Where to Edit

---

## 🎯 Core Files (You'll edit these 90% of the time)

### 1. **All Skeleton Components**
```
📄 src/components/shared/LoadingSkeletons.tsx
```

**What's inside:**
- Line 1-10: Imports & base Skeleton component ← **Edit colors here**
- Line 12-23: StockCardSkeleton
- Line 25-40: StockTableRowSkeleton  
- Line 42-65: NewsArticleSkeleton ← **Edit news cards**
- Line 67-75: NewsListSkeleton
- Line 77-85: StockListSkeleton ← **Edit stock count**
- Line 87-110: TableSkeleton
- Line 112-130: ChartSkeleton
- Line 132-155: WidgetSkeleton
- Line 157-165: CompactCardSkeleton
- Line 167-175: CompactCardGridSkeleton

**Edit this file when:**
- Changing skeleton appearance
- Adding new skeleton types
- Modifying animations
- Changing colors globally

---

### 2. **Where Skeletons Are Used**
```
📄 src/components/tabs/StocksNewsTab.tsx
```

**Skeleton locations:**
- Line 7: Import statement ← **Remove to disable**
- Line 862: List view loading ← **Change count here**
- Line 970: Card view loading ← **Change count here**
- Line 1540: News section loading ← **Change count here**

**Edit this file when:**
- Changing how many skeletons show
- Enabling/disabling per view
- Modifying loading logic
- Adding to other tabs (copy pattern)

---

## 📚 Documentation Files (Reference, don't need to edit)

### Implementation Details
```
📄 docs/LOADING_SKELETONS_IMPLEMENTATION.md
```
- What was implemented
- Benefits achieved
- Testing checklist
- Rollback instructions

### How to Customize
```
📄 docs/CUSTOMIZATION_GUIDE.md  ← **Read this**
```
- Common modifications
- Create your own skeletons
- Change loading logic
- Future-proofing

### Quick Reference
```
📄 docs/QUICK_EDITS_CHEATSHEET.md  ← **Keep this open**
```
- 30-second edits
- Common changes
- Undo instructions
- Pro shortcuts

### This File
```
📄 docs/FILE_LOCATIONS.md  ← **You are here**
```

---

## 🎨 Other Files (Usually don't need to edit)

### TypeScript Types
```
📄 src/types.ts
```
- TabProps interface
- Global type definitions
- No skeleton-specific types needed

### Main App Component  
```
📄 src/components/BetaCombinedDashboard.tsx
```
- Doesn't use skeletons directly
- Passes props to tabs
- No changes needed

### Global Styles
```
📄 src/index.css
```
- Global CSS variables
- No skeleton styles here
- Uses Tailwind classes

---

## 🔍 Find Files Quickly

### VS Code:
```
Cmd+P (Mac) / Ctrl+P (Windows)
Type: LoadingSkeleton
Press Enter
```

### Terminal:
```bash
# Find skeleton files
find src -name "*Skeleton*"

# Find files using skeletons
grep -r "Skeleton" src/components/
```

### File Tree:
```
src/
├── components/
│   ├── shared/
│   │   └── LoadingSkeletons.tsx    ← Main file
│   └── tabs/
│       ├── StocksNewsTab.tsx       ← Uses skeletons
│       ├── IntelliStocksTab.tsx    ← Could add skeletons
│       ├── FinanceProTab.tsx       ← Could add skeletons
│       └── ...
├── types.ts
└── index.css

docs/
├── LOADING_SKELETONS_IMPLEMENTATION.md
├── CUSTOMIZATION_GUIDE.md
├── QUICK_EDITS_CHEATSHEET.md
└── FILE_LOCATIONS.md               ← You are here
```

---

## 💾 Backup Strategy

### Before Making Changes:
```bash
# Save current state
git add .
git commit -m "Before skeleton changes"

# Make changes
# ...

# Don't like it? Go back
git reset --hard HEAD
```

### Or Create Branch:
```bash
git checkout -b skeleton-experiments
# Make changes
# Don't like it?
git checkout main  # Instant rollback
```

---

## 🎯 Edit Workflow

### Typical Edit Flow:
1. **Open** `LoadingSkeletons.tsx` in editor
2. **Find** component you want to edit (Cmd+F)
3. **Change** color/size/animation
4. **Save** (Cmd+S)
5. **Check** browser (auto-reloads)
6. **Like it?** Done!
7. **Don't like?** Undo (Cmd+Z)

**No build. No restart. Instant feedback.**

---

## 🚀 Add to New Tab (Copy-Paste)

### Step 1: Add import (Top of new tab file)
```tsx
import { StockListSkeleton } from '../shared/LoadingSkeletons';
```

### Step 2: Use in loading state
```tsx
{loading ? (
  <StockListSkeleton count={6} />
) : (
  <YourContent />
)}
```

**Done!** Works in any tab.

---

## 📊 File Size Reference

| File | Lines | Size | Complexity |
|------|-------|------|-----------|
| LoadingSkeletons.tsx | ~250 | 8 KB | Simple |
| StocksNewsTab.tsx | 1,706 | 70 KB | Complex |
| CUSTOMIZATION_GUIDE.md | ~400 | 15 KB | Reference |
| QUICK_EDITS_CHEATSHEET.md | ~200 | 7 KB | Reference |

**Total added:** ~300 lines actual code  
**Everything else:** Documentation (optional to read)

---

## ✅ Summary: Your Editing Workflow

### Common Changes (95% of edits):
```
1. Change color → LoadingSkeletons.tsx → Line 7
2. Change count → StocksNewsTab.tsx → Search "count="
3. On/Off → Add flag at top of StocksNewsTab.tsx
```

### Less Common (5% of edits):
```
4. New skeleton → LoadingSkeletons.tsx → Copy existing, modify
5. New location → Any tab → Copy import + usage pattern
6. Remove all → Delete LoadingSkeletons.tsx + remove imports
```

---

**You know exactly where everything is. No mystery. No canvas. Just files.**