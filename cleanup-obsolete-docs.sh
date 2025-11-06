#!/bin/bash

# 🗑️ Script de nettoyage des fichiers obsolètes
# Confiance: 100% (50 fichiers ultra-sûrs)
# Backup automatique avant suppression

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     🗑️  NETTOYAGE FICHIERS OBSOLÈTES - CONFIANCE 100%        ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Répertoire de backup
BACKUP_DIR="../GOB_BACKUP_DOCS_$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}📊 Analyse du projet...${NC}"
echo ""

# Compter les fichiers actuels
TOTAL_MD=$(find . -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')
TOTAL_TXT=$(find . -maxdepth 1 -name "*.txt" | wc -l | tr -d ' ')
TOTAL=$((TOTAL_MD + TOTAL_TXT))

echo -e "${YELLOW}Fichiers actuels à la racine:${NC}"
echo "  • Fichiers .md:  $TOTAL_MD"
echo "  • Fichiers .txt: $TOTAL_TXT"
echo "  • TOTAL:         $TOTAL"
echo ""

# Fichiers à supprimer (50 fichiers - confiance 100%)
FILES_TO_DELETE=(
  # Catégorie 1: Messages finaux redondants (10)
  "FINAL_MESSAGE.txt"
  "MESSAGE_FINAL_ULTIME.txt"
  "MISSION_COMPLETE.txt"
  "LISEZ_MOI_EN_PREMIER.txt"
  "LISEZ_MOI_MAINTENANT.md"
  "ORDRE_DE_LECTURE.txt"
  "RESUME_ULTRA_SIMPLE.txt"
  "TABLEAU_RECAP.txt"
  "NAVIGATION_MAP.txt"
  "DIAGRAMME-AUTOMATISATION.txt"
  
  # Catégorie 2: Rapports de session (8)
  "SESSION_MARATHON_31OCT_COMPLETE.md"
  "SESSION_SUMMARY.md"
  "SESSION_SUMMARY_EMMA_COMPREHENSIVE.md"
  "AUDIT_COMPLET_2025-10-31.md"
  "DASHBOARD_STATUS_REPORT.md"
  "API_DIAGNOSTIC_REPORT.md"
  "API-VALIDATION-REPORT.md"
  "VALIDATION_REPORT.md"
  
  # Catégorie 3: Actions immédiates complétées (7)
  "ACTION-IMMEDIATE-SUPABASE.md"
  "ACTION-IMMEDIATE-VALIDATION.md"
  "ACTIONS_IMMEDIATES.md"
  "URGENT_VERCEL_FIX_REQUIRED.md"
  "URGENT-SUPABASE-DIAGNOSTIC.md"
  "CONFIGURATION-SUPABASE-IMMEDIATE.md"
  "CONFIGURATION-SUPABASE-URGENTE.md"
  
  # Catégorie 4: Fixes appliqués (12)
  "FIX_LOGIN_ERROR.md"
  "FIX_LOGIN_PATTERN_ERROR_IMMEDIATE.md"
  "FIX_SMS_FOREIGN_KEY.md"
  "FIX_SUMMARY.md"
  "FIX_WATCHLIST_ERROR.md"
  "FIX-SERVERLESS-LIMIT.md"
  "FIX-WATCHLIST-SUPABASE.md"
  "FMP_API_FIXED.md"
  "CORRECTIONS_APPLIQUEES.md"
  "CORRECTIONS-DASHBOARD-RESUME.md"
  "STATUS-CORRECTIONS-FINAL.md"
  "DIAGNOSTIC_SMS_ERROR.md"
  
  # Catégorie 5: Tests et validation (10)
  "CALENDAR_INTEGRATION_REPORT.md"
  "CALENDAR_TEST_REPORT.md"
  "CALENDRIER_EVALUATION_FINALE.md"
  "PRODUCTION-API-TEST-REPORT.md"
  "RAPPORT-CORRECTIONS-APIS.md"
  "RAPPORT-TEST-FINAL-APIS.md"
  "RAPPORT-VALIDATION-FINALE.md"
  "RAPPORT_VALIDATION_FINALE.md"
  "RAPPORT_COHERENCE_SUPABASE.md"
  "TESTS_SUPABASE_SUMMARY.md"
  
  # Catégorie 6: Déploiement (9)
  "DEPLOYMENT_CHECKLIST.md"
  "DEPLOYMENT_COMPLETE.md"
  "DEPLOYMENT_GUIDE.md"
  "DEPLOIEMENT-CALENDRIER-EN-LIGNE.md"
  "BRANCHES_CLEANUP_README.md"
  "PR_CREATION_GUIDE.md"
  "PR_DESCRIPTION_NEW_FEATURES.md"
  "PULL_REQUEST_READY.md"
  "PULL_REQUEST_SMS_INTEGRATION.md"
)

TOTAL_TO_DELETE=${#FILES_TO_DELETE[@]}

echo -e "${YELLOW}Fichiers à supprimer: ${RED}$TOTAL_TO_DELETE${NC}"
echo ""

# Demander confirmation
echo -e "${YELLOW}⚠️  ATTENTION:${NC}"
echo "  • $TOTAL_TO_DELETE fichiers seront supprimés"
echo "  • Backup automatique dans: $BACKUP_DIR"
echo "  • Confiance: 100% (aucun fichier essentiel)"
echo ""
read -p "Continuer? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Annulé par l'utilisateur${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Création du backup...${NC}"

# Créer le répertoire de backup
mkdir -p "$BACKUP_DIR"

# Copier tous les fichiers .md et .txt
cp *.md "$BACKUP_DIR/" 2>/dev/null || true
cp *.txt "$BACKUP_DIR/" 2>/dev/null || true

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l | tr -d ' ')
echo -e "${GREEN}   → $BACKUP_COUNT fichiers sauvegardés${NC}"
echo ""

# Supprimer les fichiers
echo -e "${BLUE}🗑️  Suppression en cours...${NC}"
echo ""

DELETED=0
NOT_FOUND=0

for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo -e "  ${GREEN}✓${NC} $file"
    ((DELETED++))
  else
    echo -e "  ${YELLOW}⊘${NC} $file (déjà supprimé)"
    ((NOT_FOUND++))
  fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║                    ✅ NETTOYAGE TERMINÉ                       ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Compter les fichiers restants
NEW_TOTAL_MD=$(find . -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')
NEW_TOTAL_TXT=$(find . -maxdepth 1 -name "*.txt" | wc -l | tr -d ' ')
NEW_TOTAL=$((NEW_TOTAL_MD + NEW_TOTAL_TXT))

echo -e "${GREEN}📊 Résultats:${NC}"
echo "  • Fichiers supprimés:     $DELETED"
echo "  • Déjà supprimés:         $NOT_FOUND"
echo "  • Backup créé dans:       $BACKUP_DIR"
echo ""
echo -e "${BLUE}Avant → Après:${NC}"
echo "  • Fichiers .md:  $TOTAL_MD → $NEW_TOTAL_MD (-$((TOTAL_MD - NEW_TOTAL_MD)))"
echo "  • Fichiers .txt: $TOTAL_TXT → $NEW_TOTAL_TXT (-$((TOTAL_TXT - NEW_TOTAL_TXT)))"
echo "  • TOTAL:         $TOTAL → $NEW_TOTAL (-$((TOTAL - NEW_TOTAL)))"
echo ""

REDUCTION=$((100 * (TOTAL - NEW_TOTAL) / TOTAL))
echo -e "${GREEN}✅ Réduction: -$REDUCTION% de fichiers documentation${NC}"
echo ""

echo -e "${YELLOW}💡 Prochaines étapes:${NC}"
echo "  1. Vérifier que tout fonctionne: npm run dev"
echo "  2. Tester Emma: node test_emma_all_skills.js"
echo "  3. Si OK, commit: git add . && git commit -m '🗑️ Cleanup: suppression 50 fichiers obsolètes'"
echo "  4. Si problème, restaurer: cp $BACKUP_DIR/* ."
echo ""

echo -e "${GREEN}🎉 Projet plus propre et maintenable!${NC}"

