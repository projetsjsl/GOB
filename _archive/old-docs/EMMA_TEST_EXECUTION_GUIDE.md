# 🚀 Guide d'Exécution: Tests Emma 25 Scénarios

## Vue d'ensemble

Tu vas lancer 25 tests automatisés pour évaluer Emma sur:
- **Cohérence**: Données YTD, sources, pas de contradictions
- **Sophistication**: Concepts CFA, analyses multidimensionnelles
- **Longueur**: 800+ mots pour analyses complexes
- **Mémoire**: Rappel contexte conversations
- **Valeur ajoutée**: Points forts/faibles, recommandations
- **Scénarios**: Optimiste, pessimiste, réaliste
- **Multi-canaux**: Web, SMS, Email

---

## 📋 Prérequis

### 1. Vérifier environnement
```bash
# Vérifier Node.js version
node --version  # ≥ 16 requis

# Vérifier npm packages
npm list --depth=0
```

### 2. Vérifier API endpoints
```bash
# Test /api/chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","userId":"test","channel":"web"}'

# Doit retourner 200 avec {success: true, response: "..."}
```

### 3. Préparer fichiers de logs
```bash
# Créer répertoires
mkdir -p logs/emma_tests
chmod 755 logs/emma_tests

# Vérifier permissions
ls -la logs/
```

---

## 🎯 Execution Options

### Option 1: Tous les 25 tests
```bash
node test_emma_25_scenarios.js

# Output:
# [1/25] Analyse complète tech (MSFT)...
# [2/25] Comparaison sectorielle (GOOGL vs MSFT vs AAPL)...
# ...
# [25/25] Comportement investisseur
#
# 📊 TEST SUMMARY
# Total Tests: 25/25
# Passed: 24 ✓
# Failed: 1 ❌
# Total Duration: 45.3 minutes
```

### Option 2: Tests spécifiques seulement
```bash
# Tests 1, 5, 10 seulement
node test_emma_25_scenarios.js --scenarios=1,5,10

# Ou un groupe entier
node test_emma_25_scenarios.js --group="Analyses Fondamentales"
```

### Option 3: Un seul canal
```bash
# Web seulement
node test_emma_25_scenarios.js --channel=web

# SMS seulement
node test_emma_25_scenarios.js --channel=sms

# Email seulement
node test_emma_25_scenarios.js --channel=email
```

### Option 4: Combinaisons
```bash
# Groupe Portfolio, canaux web+email
node test_emma_25_scenarios.js --group="Stratégie Portfolio" --channels=web,email

# Tout avec verbose logging
node test_emma_25_scenarios.js --verbose --debug
```

---

## 📊 Outputs & Logs

### Logs en temps réel
```
logs/emma_tests/
├─ test_01.json          # Test 1 résultat complet
├─ test_02.json          # Test 2 résultat complet
├─ ...
├─ test_25.json          # Test 25 résultat complet
└─ results.json          # Résumé tous les tests
```

### Fichier résultat par test (`test_01.json`)
```json
{
  "id": 1,
  "scenario": "Analyse complète tech",
  "group": "Analyses Fondamentales",
  "timestamp": "2025-11-06T14:30:00Z",
  "channelResults": {
    "web": {
      "success": true,
      "response": "...",
      "metadata": {
        "model": "perplexity",
        "execution_time_ms": 3200,
        "tools_used": ["fmp-fundamentals", "news"]
      }
    },
    "sms": {
      "success": true,
      "response": "...",
      "metadata": {
        "model": "perplexity",
        "execution_time_ms": 2800,
        "tools_used": ["fmp-quote"]
      }
    }
  },
  "duration_ms": 6000
}
```

### Rapport global (`EMMA_TEST_RESULTS.md`)
```markdown
# 📊 EMMA 25 Comprehensive Test Results

## Executive Summary
- Total Tests: 25/25
- Passed: 24 ✓
- Failed: 1 ❌
- Duration: 45.3 minutes

## Résultats par Groupe
- Analyses Fondamentales (5): 5/5 ✓
- Stratégie Portfolio (5): 5/5 ✓
- Actualité & Macro (5): 4/5 ⚠️
- Risques & Scenarios (5): 5/5 ✓
- Questions CFA (5): 5/5 ✓

## Test Details
[Pour chaque test: score, grade, points forts/faibles]

## Recommandations
...
```

---

## 📈 Interprétation Résultats

### Scores

| Score | Grade | Signification |
|-------|-------|---------------|
| 90-100 | A | Excellent - Réponse institutionnelle |
| 80-89 | B | Bon - Quelques améliorations mineures |
| 70-79 | C | Acceptable - Améliorations nécessaires |
| 60-69 | D | Faible - Problèmes majeurs |
| <60 | F | Échec - À refondre |

### Par Catégorie

#### Cohérence (15 pts) - Target: ≥ 13/15
```
✓ Excellent: YTD cohérent, sources documentées, pas de contradictions
⚠️ Acceptable: Quelques petits incohérences YTD, sources partielles
❌ Faible: Données conflictuelles, sources manquantes
```

#### Sophistication (20 pts) - Target: ≥ 16/20
```
✓ Excellent: Concepts CFA utilisés (DCF, WACC, multiples), analyses multi-angle
⚠️ Acceptable: Quelques concepts CFA, analyses basiques
❌ Faible: Pas de concepts CFA, surface-level analysis
```

#### Longueur (15 pts) - Target: ≥ 12/15
```
✓ Excellent: 1200+ mots, très détaillé
⚠️ Acceptable: 800-1200 mots, assez détaillé
❌ Faible: <800 mots, trop concis
```

#### Scénarios (15 pts) - Target: ≥ 13/15
```
✓ Excellent: 3 scénarios détaillés (optimiste, pessimiste, réaliste)
⚠️ Acceptable: 2 scénarios, peut-être superficiels
❌ Faible: 1 ou 0 scénarios, pas d'analyse contingente
```

#### Valeur Ajoutée (15 pts) - Target: ≥ 12/15
```
✓ Excellent: Points forts + faibles, recommandations actionables
⚠️ Acceptable: Points forts ou faibles (pas les deux), peu de recommandations
❌ Faible: Juste des faits, pas d'opinions justifiées
```

---

## 🔍 Analyse Approfondie

### 1. Après exécution, lancer analyse
```bash
node analyze_emma_results.js \
  --input=logs/emma_tests/results.json \
  --output=EMMA_ANALYSIS_DETAILED.md \
  --verbose
```

### 2. Examiner les logs détaillés
```bash
# Trouver tous les tests avec score < 80
grep -r '"score":[0-7][0-9]' logs/emma_tests/

# Trouver tous les tests "Fail"
grep -r '"success":false' logs/emma_tests/

# Examiner test 15 en détail
cat logs/emma_tests/test_15.json | jq .
```

### 3. Comparer channels
```bash
# Extract réponses par channel
node scripts/compare_channels.js --test-id=1

# Output:
# Test 1: Analyse MSFT
# 
# WEB (1500 chars):
# Réponse web très détaillée...
#
# SMS (800 chars):
# Réponse SMS plus concise...
#
# Cohérence: ✓ 95% (même substance)
```

---

## 🐛 Troubleshooting

### Problème: "Cannot find module 'fetch'"
```bash
# Solution: Vérifier Node version ≥ 16
node --version  # doit être ≥ v16.0.0

# Upgrade si nécessaire
nvm install 18
nvm use 18
```

### Problème: "API timeout after 60s"
```bash
# Issue: Emma répond lentement
# Solutions:
# 1. Vérifier API est up: curl http://localhost:3000/api/status
# 2. Vérifier Perplexity key configurée: echo $PERPLEXITY_API_KEY
# 3. Augmenter timeout dans script:
#    timeout: 120000  # 2 minutes au lieu de 1

# Ou lancer tests un-à-un:
node test_emma_25_scenarios.js --scenarios=1 --serial
```

### Problème: "Channel SMS failed: mock not implemented"
```bash
# Issue: SMS adapter n'est pas en mock
# Solution: Tester via API mock au lieu de Twilio réel
# Modifier script pour SMS simulation:
const mockSMSResponse = await simulateSMSViaHTTP(payload);
```

### Problème: "Results file not found"
```bash
# Vérifier permissions
chmod 755 logs/emma_tests
ls -la logs/emma_tests/

# Ou relancer avec permissions fixes
node test_emma_25_scenarios.js --fix-permissions
```

---

## 📅 Execution Timeline

### Phase 1: Setup (30 min)
```bash
# 1. Vérifier prérequis
npm run test:setup

# 2. Valider endpoints
npm run test:validate-api

# 3. Dry run (test 1 seulement)
node test_emma_25_scenarios.js --scenarios=1 --dry-run
```

### Phase 2: Full Tests (45-60 min)
```bash
# Lancer tous les 25 tests
time node test_emma_25_scenarios.js --verbose 2>&1 | tee test_run_$(date +%Y%m%d_%H%M%S).log
```

### Phase 3: Analysis (20 min)
```bash
# Analyser résultats
node analyze_emma_results.js

# Générer rapports
npm run test:analyze-results

# Créer action items
npm run test:generate-roadmap
```

---

## 📊 Success Metrics

### Global Target: 85+/100 (moyenne de 25 tests)

#### Par Catégorie:
- Cohérence: ≥ 13/15 (87%)
- Sophistication: ≥ 16/20 (80%)
- Longueur: ≥ 12/15 (80%)
- Scénarios: ≥ 13/15 (87%)
- Valeur ajoutée: ≥ 12/15 (80%)

#### Par Group:
- Analyses Fondamentales: ≥ 4/5 (80%)
- Stratégie Portfolio: ≥ 4/5 (80%)
- Actualité & Macro: ≥ 4/5 (80%)
- Risques & Scenarios: ≥ 5/5 (100%)
- Questions CFA: ≥ 4/5 (80%)

#### Multi-canal:
- Web: ≥ 85/100
- SMS: ≥ 80/100 (format peut être plus bref)
- Email: ≥ 87/100 (format peut être plus long)

---

## 🎯 Next Steps Après Tests

### Si Score ≥ 85: Production Ready
✅ Emma passe les tests avec distinction
- Déployer sans risque
- Monitorer en production
- Faire re-tests trimestriellement

### Si Score 75-84: Minor Fixes
⚠️ Emma proche de production mais amélioration recommandée
- Implémenter fixes prioritaires
- Re-tester les categories faibles
- Déployer après 2-3 semaines

### Si Score < 75: Major Refactor
❌ Emma a besoin de travail substantiel
- Identifier root causes
- Refondre prompts/architecture
- Re-tester après changements majeurs

---

## 📝 Capture Output

Pour garder trace des résultats:
```bash
# Sauvegarder tout
cp -r logs/emma_tests logs/emma_tests_$(date +%Y%m%d_%H%M%S)_backup
cp EMMA_TEST_RESULTS.md EMMA_TEST_RESULTS_$(date +%Y%m%d_%H%M%S).md

# Commit à git
git add logs/ EMMA_TEST_RESULTS.md
git commit -m "🧪 Emma 25 comprehensive test results [score: 88/100]"
git push origin main
```

---

## ✨ Expected Quality Exemplars

Voici ce que les "A" responses ressemblent:

### A-Grade Response (94/100):
```
✓ Cohérence: 15/15
  - Données YTD cohérentes avec valeurs FMP
  - Sources documentées (FMP, Bloomberg, Seeking Alpha)
  - Pas de contradictions internes

✓ Sophistication: 19/20
  - Utilise DCF, WACC, ROIC, free cash flow
  - Analyses d'angles: macro, secteur, company-specific
  - Nuances: "d'un côté croissance forte, de l'autre multiples élevés"

✓ Longueur: 15/15
  - 1450 mots sur analyse 1200+ attendus
  - Ratios détaillés, calculs montré

✓ Scénarios: 15/15
  - Optimiste: 3x revenu growth, expansion margin
  - Pessimiste: tech downturn, regulatory issues
  - Réaliste: 15% rev growth, margins maintenues

✓ Valeur ajoutée: 14/15
  - Points forts: management quality, innovation
  - Points faibles: china exposure, valuation risk
  - Recommandation: BUY à $250, HOLD au-dessus $300
```

### C-Grade Response (72/100):
```
✗ Cohérence: 11/15
  - YTD semble correct
  - Sources peu mentionnées
  - Petite contradiction (croissance "forte" vs "modérée")

⚠️ Sophistication: 14/20
  - Mentionne P/E mais pas FCF ou ROIC
  - Single-angle analysis (surtout valuation)
  - Peu de nuances

⚠️ Longueur: 9/15
  - 650 mots vs 1200+ attendus
  - Ratios listés mais peu d'interprétation

⚠️ Scénarios: 10/15
  - Optimiste et pessimiste mentionnés
  - Très brefs (1-2 lignes)
  - Pas réaliste scenario

⚠️ Valeur ajoutée: 8/15
  - Points forts seulement
  - Pas de recommandation claire
  - Peu actionable
```

---

## 🎓 Resources

### CFA Concepts à Comprendre:
- **Valuation**: P/E, P/FCF, PEG, EV/EBITDA, DCF
- **Financial Health**: Debt/Equity, Current Ratio, Interest Coverage
- **Quality**: ROE, ROIC, Margin Trends
- **Growth**: Revenue CAGR, EPS CAGR, Free Cash Flow Growth
- **Risk**: Beta, Drawdown, Value at Risk
- **Macro**: Yield curve, Credit spreads, Fed policy, Economic indicators

### Documentation:
- CFA Level 1-3 study materials
- Morningstar equity reports
- FMP fundamentals database
- MSCI ESG research

---

**Ready to test?** Start with:
```bash
node test_emma_25_scenarios.js --scenarios=1 --verbose
```

Good luck! 🚀

