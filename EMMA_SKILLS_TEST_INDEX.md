# 🎯 Emma SKILLS Test - Complete Index

**Objectif**: Tester TOUS les 30+ SKILLS (mots-clés) d'Emma et analyser ses réponses

**Durée**: 15-45 minutes

---

## 📚 Files in This Test Suite

| File | Purpose | Timing |
|------|---------|--------|
| **RUN_EMMA_SKILLS_TEST.md** | ⭐ START HERE - Quick start guide | 5 min read |
| **EMMA_SKILLS_TEST_GUIDE.md** | Complete guide with all details | 10 min read |
| **check_emma_skills_setup.js** | Pre-test checklist | 2-3 min |
| **test_emma_all_skills.js** | Main test runner (32 SKILLS) | 10-20 min |
| **analyze_emma_skills_responses.js** | Analyze results with tables | 2-3 min |

---

## 🚀 3-Step Execution

### Step 1️⃣: Read Quick Start (5 min)
```bash
cat RUN_EMMA_SKILLS_TEST.md
```
**Vous découvrez**: 
- Les 32 SKILLS à tester
- Structure du test
- Ce que mesurer (Length/Coherence/Relevance)

---

### Step 2️⃣: Check Setup (2 min)
```bash
npm run dev  # Terminal 1

# Terminal 2:
node check_emma_skills_setup.js
```
**Résultat**: ✅ All checks passed - Ready to run tests!

**Si erreur**:
- API not accessible? → Check `npm run dev` is running
- Chat API error? → Check GEMINI_API_KEY
- Timeout? → First request can be slow (cold start)

---

### Step 3️⃣: Run Tests (15-20 min)
```bash
# Terminal 2 (if not already running):
node test_emma_all_skills.js
```

**Console Output**:
```
[1/32] ANALYSE
Category: Analyses Complètes
Question: "ANALYSE MSFT"
📤 Sending to Emma...
✅ Response received (2145 chars)

[Emma's response...]

📊 Quick Evaluation:
   Length: 10/10
   Coherence: 9/10
   Relevance: 10/10
   🎯 SCORE: 29/30 (A)

[Repeats 32x...]
```

---

## 📊 What Gets Measured

### For Each SKILL:

| Metric | Max | Measures |
|--------|-----|----------|
| **Length** | 10 | Is response detailed enough? |
| **Coherence** | 10 | Is data consistent? No hallucinations? |
| **Relevance** | 10 | Does it answer the question? |
| **TOTAL** | 30 | Combined score |

### Final Grades:

```
A (25-30)  = Excellent ✅ Production ready
B (20-24)  = Good 👍 Minor fixes needed
C (15-19)  = Acceptable ⚠️ Improvements needed
D (<15)    = Failure ❌ Major rework needed
```

---

## 📁 Files Generated

After tests complete:

```
logs/emma_skills_test/
├─ skill_01_ANALYSE.json           [Test #1 details]
├─ skill_02_FONDAMENTAUX.json      [Test #2 details]
├─ ... (30+ files)
├─ skills_summary.json             [Summary with all scores]
└─ EMMA_SKILLS_REPORT.md           [Formatted report]
```

---

## 📈 View Results

### Quick Summary (2 min)
```bash
cat logs/emma_skills_test/EMMA_SKILLS_REPORT.md
```

### Detailed Analysis with Tables (5 min)
```bash
node analyze_emma_skills_responses.js
```

### Specific SKILL Details (1 min)
```bash
# View ANALYSE MSFT results
jq . logs/emma_skills_test/skill_01_ANALYSE.json

# See Emma's full response for one SKILL
jq '.response' logs/emma_skills_test/skill_01_ANALYSE.json
```

### Find Low Scores (30 sec)
```bash
# Show all Grade D (failures)
jq '.[] | select(.evaluation.grade == "D") | {keyword: .keyword, score: .evaluation.total}' logs/emma_skills_test/skills_summary.json
```

---

## 🎯 What the 32 SKILLS Are

### Group 1: Core Analyses (7)
```
ANALYSE [T]        → Full stock analysis
FONDAMENTAUX [T]   → Ratios & fundamentals
TECHNIQUE [T]      → Technical analysis
COMPARER [T1] [T2] → Multi-stock comparison
PRIX [T]           → Real-time price
RATIOS [T]         → P/E, ROE, etc.
CROISSANCE [T]     → Revenue/EPS growth
```

### Group 2: Technical Indicators (3)
```
RSI [T]            → Relative strength
MACD [T]           → Momentum
MOYENNES [T]       → Moving averages
```

### Group 3: News (3)
```
TOP 5 NEWS         → Top daily news
NEWS [T]           → Ticker-specific news
ACTUALITES [T]     → Alternative NEWS
```

### Group 4: Calendars (3)
```
RESULTATS          → Full earnings calendar
RESULTATS [T]      → Ticker earnings
CALENDRIER ECONOMIQUE → Macro events
```

### Group 5: Watchlist (3)
```
LISTE              → Show watchlist
AJOUTER [T]        → Add to watchlist
RETIRER [T]        → Remove from watchlist
```

### Group 6: Market View (3)
```
INDICES            → Dow, S&P, Nasdaq
MARCHE             → Global market overview
SECTEUR [NAME]     → Sector analysis
```

### Group 7: Recommendations (2)
```
ACHETER [T]        → Buy recommendation
VENDRE [T]         → Sell recommendation
```

### Group 8: Macro (3)
```
INFLATION          → Inflation data
FED                → Fed & rates
TAUX               → Interest rates
```

### Group 9: Help (3)
```
AIDE               → Complete guide
EXEMPLES           → Example questions
SKILLS             → List of SKILLS
```

---

## 💡 Expected Performance

| Category | Expected Grade | Why |
|----------|---|---|
| Analyses | A (25-30) | Emma's core function |
| Tech | A-B (20-30) | Standard calculations |
| News | A-B (20-30) | Real-time data available |
| Calendars | B (20-25) | Structured data |
| Watchlist | A (25-30) | Simple operations |
| Market | A-B (20-30) | Key for investors |
| Recommendations | A (25-30) | Critical for wealth advice |
| Macro | A-B (20-30) | Important data |
| Help | A (25-30) | Reference info |

---

## ⚠️ What to Look For

### ✅ Good Signs
```
✓ Responses > 300 words
✓ Consistent data across calls
✓ SKILL keywords in response
✓ Clear structure
✓ No hallucinations
✓ Sources mentioned (FMP, real-time)
```

### ❌ Warning Signs
```
✗ Too short (< 100 words)
✗ Contradictory data
✗ Off-topic
✗ Made-up numbers
✗ Poor structure
✗ Financial errors
```

---

## 🔧 If Scores Are Low

### For Length Issues (< 8/10)
```
→ Increase max_tokens in api/emma-agent.js
→ Force detailed prompts
→ Add section headers
```

### For Coherence Issues (< 9/10)
```
→ Use ytd-validator for consistency
→ Prioritize FMP data source
→ Add validation layer
```

### For Relevance Issues (< 9/10)
```
→ Add explicit examples to prompts
→ Force keyword inclusion
→ Verify prompt construction
```

See **EMMA_SKILLS_TEST_GUIDE.md** section "Optimization" for details.

---

## ⏱️ Timeline

| Phase | Time | Action |
|-------|------|--------|
| **Setup** | 1-2 min | npm run dev |
| **Preflight Check** | 2-3 min | node check_emma_skills_setup.js |
| **Tests Run** | 10-20 min | node test_emma_all_skills.js |
| **Analysis** | 5-10 min | Read results, identify patterns |
| **Optimization** (if needed) | 15-60 min | Fix low scores, re-test |
| **Total** | **15-90 min** | Depending on optimization needs |

---

## 🚀 Full Execution Plan

### NOW (Read this page - 2 min)
✓ Understand what's being tested
✓ Understand how it's measured
✓ See expected grades

### NEXT (Read quick start - 5 min)
```bash
cat RUN_EMMA_SKILLS_TEST.md
```
✓ 3-step execution
✓ Scoring system
✓ Output files

### THEN (Check setup - 2 min)
```bash
npm run dev
node check_emma_skills_setup.js
```
✓ Verify everything works
✓ Get "Ready to run tests" message

### EXECUTE (Run tests - 15-20 min)
```bash
node test_emma_all_skills.js
```
✓ Watch all 32 SKILLS tested
✓ See live scores
✓ Get summary at end

### ANALYZE (Review results - 5 min)
```bash
cat logs/emma_skills_test/EMMA_SKILLS_REPORT.md
```
✓ See by-category breakdown
✓ Identify top/bottom performers
✓ Get recommendations

### OPTIMIZE (If needed - 15-60 min)
```bash
node analyze_emma_skills_responses.js
```
✓ See detailed tables
✓ Get specific fixes
✓ Re-test low-scoring SKILLS

---

## 📞 Common Questions

**Q: How long does each test take?**
A: 30-60 seconds per SKILL (total 15-30 min for all 32)

**Q: Can I test just a few SKILLS?**
A: Yes, edit test_emma_all_skills.js to filter categories

**Q: What if Emma's response is in English?**
A: That's okay - analyzer doesn't care about language

**Q: Can I use this to test multi-channel (SMS, Email)?**
A: Yes, modify channel parameter in test script

**Q: How do I improve low scores?**
A: See EMMA_SKILLS_TEST_GUIDE.md "Optimization" section

---

## ✅ Checklist Before Running

```
[ ] Read RUN_EMMA_SKILLS_TEST.md
[ ] npm run dev is running (Terminal 1)
[ ] Run check_emma_skills_setup.js (Terminal 2)
[ ] All checks passed ✅
[ ] Directory logs/emma_skills_test created
[ ] Ready to run node test_emma_all_skills.js
```

---

## 🎯 Success Criteria

### Level 1: Basic (All tests run)
✅ All 32 SKILLS tested
✅ All results saved to logs
✅ No fatal errors

### Level 2: Good (Most passing)
✅ 90%+ tests pass
✅ Average score > 20/30
✅ No Grade D's in main categories

### Level 3: Excellent (Production ready)
✅ 95%+ tests pass
✅ Average score > 25/30
✅ All categories Grade A-B
✅ Consistent multi-channel

---

## 🚀 Let's Go!

**Ready?** Start here:

```bash
# Terminal 1
npm run dev

# Terminal 2 (wait 3-5 seconds for server to start)
cat RUN_EMMA_SKILLS_TEST.md
node check_emma_skills_setup.js
node test_emma_all_skills.js
```

Then analyze:
```bash
cat logs/emma_skills_test/EMMA_SKILLS_REPORT.md
```

---

## 📁 Quick Reference

```
Master index (you are here):
└─ EMMA_SKILLS_TEST_INDEX.md

Quick start:
└─ RUN_EMMA_SKILLS_TEST.md (⭐ Start here)

Complete guide:
└─ EMMA_SKILLS_TEST_GUIDE.md

Scripts:
├─ check_emma_skills_setup.js
├─ test_emma_all_skills.js
└─ analyze_emma_skills_responses.js
```

---

**Generated**: 2025-01-06
**Version**: 1.0
**Status**: Ready for execution ✅


