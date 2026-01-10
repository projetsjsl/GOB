# 🧹 PLAN DE NETTOYAGE DU REPOSITORY

**Date**: 10 janvier 2026  
**Objectif**: Supprimer les fichiers inutiles ou redondants tout en préservant les fichiers critiques

---

## 📊 ANALYSE INITIALE

### Taille des dossiers
- `_archive/`: **46MB, 1049 fichiers** ⚠️
- `docs/`: **664KB, 66 fichiers**
- `test-screenshots/`: **36KB, 1 fichier**
- `.agent/`: **136KB** (référencé dans code - À GARDER)
- `.cursor/`: **48KB** (config - À GARDER)
- `.kombai/`: **280KB** (config - À GARDER)

---

## ✅ FICHIERS À CONSERVER (Critiques)

### Documentation Essentielle
- ✅ `docs/REPERTOIRE_COMPLET_ERREURS.md` - **CRITIQUE** (référencé dans .cursorrules)
- ✅ `docs/INDEX.md` - Index principal
- ✅ `docs/RAPPORT_AUDIT_COMPLET_DASHBOARD_BETA.md` - Rapport d'audit principal
- ✅ `docs/CORRECTIONS_BUGS_AUDIT.md` - Suivi des corrections
- ✅ `docs/RESUME_COMPLET_CORRECTIONS.md` - Résumé final
- ✅ `docs/TESTS_FINAUX_COMPLETS.md` - Tests récents
- ✅ `README.md` - Documentation principale

### Configuration
- ✅ `.agent/` - Référencé dans code (orchestrator)
- ✅ `.cursor/` - Configuration Cursor
- ✅ `.kombai/` - Configuration Kombai

---

## 🗑️ FICHIERS À SUPPRIMER

### 1. Dossier `_archive/` (46MB, 1049 fichiers)
**Raison**: Archive complète, non référencée dans le code actif
- ✅ Vérifié: Aucune référence dans code JS/TS/TSX
- ✅ Peut être supprimé en toute sécurité

### 2. Documentation Redondante dans `docs/`
**Raison**: Plusieurs rapports d'audit/test redondants

#### Rapports d'Audit Redondants (à consolider)
- ❌ `AUDIT_MARATHON_2024-12-24.md`
- ❌ `AUDIT_MARATHON_FINAL_2024-12-24.md`
- ❌ `AUDIT_MARATHON_ULTIMATE_2024-12-24.md`
- ❌ `AUDIT_COMPLET_2024-12-24.md`
- ❌ `AUDIT_COMPLET_2024-12-24-VERCEL.md`
- ✅ **GARDER**: `AUDIT_COMPLET_SITE.md` (plus récent)
- ✅ **GARDER**: `RAPPORT_AUDIT_COMPLET_DASHBOARD_BETA.md` (principal)

#### Résumés Redondants
- ❌ `RESUME_CORRECTIONS_FINAL.md`
- ✅ **GARDER**: `RESUME_COMPLET_CORRECTIONS.md` (plus complet)

#### Tests Redondants
- ❌ `TEST_REPORT.md`
- ❌ `TEST_REPORT_FRONTEND.md`
- ❌ `RESUME_TESTS_FINAL.md`
- ✅ **GARDER**: `TESTS_FINAUX_COMPLETS.md` (plus récent)

#### Scripts d'Audit Automatisés (obsolètes)
- ❌ `AUDIT_AUTOMATED_SCRIPT.js`
- ❌ `SCRIPT_AUDIT_AUTOMATISE.js`
- ❌ `SCRIPT_AUDIT_COMPLET_AUTOMATISE.js`
- ❌ `SCRIPT_AUDIT_MARATHON_COMPLET.js`
- ❌ `SCRIPT_AUDIT_MARATHON_FINAL.js`

### 3. Fichiers à la Racine (à déplacer ou supprimer)

#### Rapports d'Audit (à déplacer vers docs/ ou supprimer)
- ❌ `AUDIT_SUMMARY.md` (redondant avec docs/)
- ❌ `COMPREHENSIVE_CODE_AUDIT.md` (redondant)
- ❌ `CONSOLE_LOG_CLEANUP_REPORT.md` (obsolète)
- ❌ `INNERHTML_SECURITY_AUDIT.md` (obsolète)
- ❌ `QA_AUDIT_REPORT.md` (redondant)
- ❌ `API_AUDIT_REPORT.md` (redondant)

#### Rapports de Déploiement (à consolider)
- ❌ `DEPLOYMENT_GUIDE.md` (si redondant avec docs/)
- ❌ `DEPLOYMENT_STATUS.md` (obsolète)
- ❌ `POST_DEPLOY_QUICK_START.md` (obsolète)
- ❌ `PRODUCTION_READINESS_REPORT.md` (obsolète)
- ❌ `STATUS.md` (obsolète)
- ❌ `FINAL_SUMMARY.md` (redondant)
- ❌ `CORRECTIONS_APPLIED.md` (redondant avec docs/)

#### Autres
- ❌ `BRANCH_CLEANUP_REPORT.md` (obsolète)
- ❌ `REACT_GRID_LAYOUT_FIX_REPORT.md` (obsolète)
- ❌ `POC_TAILWIND_RESULTS.md` (obsolète)
- ❌ `VALIDATION_REPORT.md` (redondant)
- ❌ `VERCEL_DEPLOYMENT_VALIDATION_REPORT.md` (obsolète)
- ❌ `YIELD_CURVE_FIX_FINAL_REPORT.md` (obsolète)
- ❌ `PROMPT_V0_CURVEWATCH.md` (à déplacer vers docs/ si utile)

### 4. Screenshots de Test
- ❌ `test-screenshots/page-principale.png` (36KB, obsolète)

### 5. Fichiers de Marqueur (obsolètes)
- ❌ `.night-work-complete`
- ❌ `.SUCCESS_MARKER`

---

## 📋 PLAN D'EXÉCUTION

### Phase 1: Suppression Sûre (100% sûr)
1. ✅ Supprimer `_archive/` (46MB)
2. ✅ Supprimer fichiers de marqueur obsolètes
3. ✅ Supprimer `test-screenshots/`

### Phase 2: Documentation Redondante
1. ✅ Supprimer rapports d'audit redondants (garder les plus récents)
2. ✅ Supprimer scripts d'audit automatisés obsolètes
3. ✅ Supprimer résumés/tests redondants

### Phase 3: Fichiers Racine
1. ✅ Supprimer rapports obsolètes à la racine
2. ✅ Déplacer fichiers utiles vers `docs/` si nécessaire

---

## ⚠️ PRÉCAUTIONS

1. **Vérification Git**: Tous les fichiers seront supprimés du working directory, pas de l'historique Git
2. **Backup**: Les fichiers dans `_archive/` sont déjà archivés
3. **Références**: Vérifié qu'aucun fichier supprimé n'est référencé dans le code actif
4. **Documentation**: Les fichiers critiques sont préservés

---

## 📊 ESTIMATION GAIN

- **Espace disque**: ~47MB
- **Fichiers**: ~1100+ fichiers
- **Clarté**: Repository plus maintenable

---

**Status**: ✅ Prêt pour exécution après validation
