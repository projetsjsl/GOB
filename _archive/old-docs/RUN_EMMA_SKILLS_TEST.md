# 🚀 RUN: Emma SKILLS Test - Quick Start

> **Ce qu'on teste**: Tous les 30+ SKILLS (mots-clés) d'Emma
>
> **Résultat**: Analyse complète avec scores 0-30 et recommandations

---

## ⚡ Super Quick Start (5 minutes)

```bash
# Terminal 1: Démarrer le serveur
npm run dev

# Terminal 2: Lancer les tests (dans un autre terminal)
node test_emma_all_skills.js

# Terminal 3: Voir les résultats en live
tail -f logs/emma_skills_test/skills_summary.json
```

---

## 📋 Qu'est-ce qui est testé?

**32 SKILLS en 9 catégories**:

| Catégorie | SKILLS | Exemple |
|-----------|--------|---------|
| 📊 Analyses | ANALYSE, FONDAMENTAUX, TECHNIQUE, COMPARER, PRIX, RATIOS, CROISSANCE | `ANALYSE MSFT` |
| 📈 Tech | RSI, MACD, MOYENNES | `RSI MSFT` |
| 📰 News | TOP 5 NEWS, NEWS, ACTUALITES | `NEWS MSFT` |
| 📅 Calendrier | RESULTATS, CALENDRIER ECONOMIQUE | `RESULTATS` |
| 📊 Watchlist | LISTE, AJOUTER, RETIRER | `AJOUTER MSFT` |
| 📈 Marché | INDICES, MARCHE, SECTEUR | `INDICES` |
| 💼 Advice | ACHETER, VENDRE | `ACHETER MSFT` |
| 🌍 Macro | INFLATION, FED, TAUX | `INFLATION` |
| 📚 Aide | AIDE, EXEMPLES, SKILLS | `SKILLS` |

---

## ✅ Step-by-Step Execution

### Step 1: Démarrer le serveur (Terminal 1)
```bash
cd /Users/projetsjsl/Documents/GitHub/GOB
npm run dev
```

**Attendez de voir**: `> GOB@1.0.0 dev > vite`

### Step 2: Lancer les tests (Terminal 2)
```bash
cd /Users/projetsjsl/Documents/GitHub/GOB
node test_emma_all_skills.js
```

**Vous verrez**:
```
🤖 EMMA SKILLS TEST - Test complet de tous les mots-clés

[1/32] ANALYSE
Category: Analyses Complètes
Question: "ANALYSE MSFT"
📤 Sending to Emma...
✅ Response received (2145 chars)

[Emma's response displayed...]

📊 Quick Evaluation:
   Length: 10/10
   Coherence: 9/10
   Relevance: 10/10
   🎯 SCORE: 29/30 (A)

[Repeats 32x...]
```

### Step 3: Analyser les résultats (5-10 min)

```bash
# Voir le rapport formaté
cat logs/emma_skills_test/EMMA_SKILLS_REPORT.md

# Voir le résumé JSON
cat logs/emma_skills_test/skills_summary.json | head -50

# Voir un SKILL spécifique
cat logs/emma_skills_test/skill_01_ANALYSE.json | jq
```

### Step 4: Analyse profonde (Optional)
```bash
# Générer tableaux + recommandations détaillées
node analyze_emma_skills_responses.js
```

---

## 📊 What Scores Mean

| Score | Grade | Signification |
|-------|-------|---------------|
| 25-30 | A | ✅ Excellent - Production ready |
| 20-24 | B | 👍 Good - Minor fixes |
| 15-19 | C | ⚠️ Acceptable - Improvements needed |
| <15 | D | ❌ Failure - Major rework |

### Score Breakdown (30 points)

- **Length** (10 pts): Réponse assez détaillée?
  - 10 pts = 300+ words (analyses) ou 100+ (aide)
  - 5 pts = 100-300 words
  - 0 pts = <100 words

- **Coherence** (10 pts): Données cohérentes?
  - 10 pts = Parfaitement cohérent
  - 5 pts = Quelques contradictions
  - 0 pts = Incoherent/hallucinations

- **Relevance** (10 pts): Répond bien à la question?
  - 10 pts = Parfaitement pertinent
  - 5 pts = Partiellement pertinent
  - 0 pts = Hors sujet

---

## 📁 Output Files

Après exécution:

```
logs/emma_skills_test/
├─ skill_01_ANALYSE.json              [Détails test #1]
├─ skill_02_FONDAMENTAUX.json         [Détails test #2]
├─ ... (32 files)
├─ skills_summary.json                [Résumé complet JSON]
└─ EMMA_SKILLS_REPORT.md              [Rapport formaté]
```

**Chaque JSON contient**:
- Keyword et description
- Question posée
- Réponse complète d'Emma
- Score (0-30) avec breakdown
- Grade (A/B/C/D)

---

## 🔍 Quick Analysis

### ✅ Good Signs to Look For
```
✓ Responses > 300 words (analyses)
✓ Données cohérentes entre appels
✓ Keywords du SKILL dans la réponse
✓ Structure claire et bien organisée
✓ Aucune hallucination
✓ Sources mentionnées (FMP, données temps réel)
```

### ❌ Warning Signs
```
✗ Réponse < 100 words
✗ Données contradictoires
✗ Hors sujet
✗ Nombres inventés/hallucinations
✗ Pas de structure logique
✗ Erreurs financières (P/E négatif, etc.)
```

---

## 🎯 Category Performance Expectations

| Catégorie | Score Attendu | Raison |
|-----------|---------------|--------|
| Analyses | 25-30 (A) | Core business d'Emma |
| Tech | 20-30 (A-B) | Calculs standards |
| News | 20-30 (A-B) | Données temps réel |
| Calendriers | 20-25 (B) | Données structurées |
| Watchlist | 25-30 (A) | Opérations simples |
| Marché | 20-30 (A-B) | Données importantes |
| Advice | 25-30 (A) | Wealth advice core |
| Macro | 20-30 (A-B) | Données macro |
| Aide | 25-30 (A) | Reference info |

---

## ⏱️ Timeline

| Action | Durée |
|--------|-------|
| Setup serveur | 1-2 min |
| Lancer tests | 5-10 min |
| Tests exécutés | 5-15 min |
| Analyser résultats | 5-10 min |
| **Total** | **15-45 min** |

---

## 🛠️ If Something Goes Wrong

### Tests ne se lancent pas
```bash
# Vérifier que le serveur est bien lancé
curl http://localhost:3000/api/status

# Si erreur, redémarrer:
npm run dev
```

### Pas de résultats
```bash
# Vérifier API availability
curl -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"SKILLS","userId":"test"}'

# Si timeout (>30s), vérifier:
# - GEMINI_API_KEY
# - Connection internet
# - Vercel logs
```

### Scores tous faibles
```bash
# 1. Vérifier les réponses
cat logs/emma_skills_test/skill_01_ANALYSE.json | jq .response

# 2. Vérifier erreurs
grep "error\|Error\|ERROR" logs/emma_skills_test/*.json

# 3. Vérifier prompt
cat api/emma-agent.js | grep -A 20 "_buildChatPrompt"
```

---

## 💡 Next Steps

### Si Scores OK (A/B mostly)
✅ **Multi-channel validation**:
```bash
node test-multichannel.js web  # Web
node test-multichannel.js sms  # SMS
node test-multichannel.js email  # Email
```

### Si Scores LOW (C/D)
⚠️ **Optimization**:
1. Lire `EMMA_SKILLS_TEST_GUIDE.md` (section "Optimization")
2. Appliquer fixes par SKILL
3. Re-tester ce SKILL
4. Itérer jusqu'à Grade ≥ B

### Advanced: Voir Réponses Brutes
```bash
# Voir réponse Emma pour SKILL spécifique
jq '.response' logs/emma_skills_test/skill_01_ANALYSE.json

# Voir toutes les métadonnées
jq '.metadata' logs/emma_skills_test/skill_01_ANALYSE.json

# Filter uniquement Grade D
jq '.[] | select(.evaluation.grade == "D")' logs/emma_skills_test/skills_summary.json
```

---

## 📞 Summary

**Vous testez**: 32 SKILLS (mots-clés spécialisés)

**Vous mesurez**: Length, Coherence, Relevance (30 pts total)

**Vous optimisez**: Chaque SKILL vers Grade A

**Vous validez**: Multi-channel consistency

---

## 🚀 Ready? Let's Go!

```bash
# Terminal 1
npm run dev

# Terminal 2
node test_emma_all_skills.js

# Terminal 3
tail -f logs/emma_skills_test/skills_summary.json
```

**Puis**:
```bash
cat logs/emma_skills_test/EMMA_SKILLS_REPORT.md
```

---

**Time**: 15-45 minutes
**Effort**: Minimal (mostly automated)
**ROI**: Complete assessment of all Emma capabilities ✅

Let's ship it! 🚀

