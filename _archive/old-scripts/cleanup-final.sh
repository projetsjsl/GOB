#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "🗑️  NETTOYAGE FICHIERS OBSOLÈTES"
echo ""

# Backup DANS le workspace
BACKUP_DIR="backup_docs_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp *.md "$BACKUP_DIR/" 2>/dev/null || true
cp *.txt "$BACKUP_DIR/" 2>/dev/null || true

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l | tr -d ' ')
echo -e "${GREEN}✅ Backup créé: $BACKUP_DIR ($BACKUP_COUNT fichiers)${NC}"
echo ""

# Fichiers à supprimer
FILES=(
  "FINAL_MESSAGE.txt" "MESSAGE_FINAL_ULTIME.txt" "MISSION_COMPLETE.txt"
  "LISEZ_MOI_EN_PREMIER.txt" "LISEZ_MOI_MAINTENANT.md" "ORDRE_DE_LECTURE.txt"
  "RESUME_ULTRA_SIMPLE.txt" "TABLEAU_RECAP.txt" "NAVIGATION_MAP.txt"
  "DIAGRAMME-AUTOMATISATION.txt"
  "SESSION_MARATHON_31OCT_COMPLETE.md" "SESSION_SUMMARY.md"
  "SESSION_SUMMARY_EMMA_COMPREHENSIVE.md" "AUDIT_COMPLET_2025-10-31.md"
  "DASHBOARD_STATUS_REPORT.md" "API_DIAGNOSTIC_REPORT.md"
  "API-VALIDATION-REPORT.md" "VALIDATION_REPORT.md"
  "ACTION-IMMEDIATE-SUPABASE.md" "ACTION-IMMEDIATE-VALIDATION.md"
  "ACTIONS_IMMEDIATES.md" "URGENT_VERCEL_FIX_REQUIRED.md"
  "URGENT-SUPABASE-DIAGNOSTIC.md" "CONFIGURATION-SUPABASE-IMMEDIATE.md"
  "CONFIGURATION-SUPABASE-URGENTE.md"
  "FIX_LOGIN_ERROR.md" "FIX_LOGIN_PATTERN_ERROR_IMMEDIATE.md"
  "FIX_SMS_FOREIGN_KEY.md" "FIX_SUMMARY.md" "FIX_WATCHLIST_ERROR.md"
  "FIX-SERVERLESS-LIMIT.md" "FIX-WATCHLIST-SUPABASE.md" "FMP_API_FIXED.md"
  "CORRECTIONS_APPLIQUEES.md" "CORRECTIONS-DASHBOARD-RESUME.md"
  "STATUS-CORRECTIONS-FINAL.md" "DIAGNOSTIC_SMS_ERROR.md"
  "CALENDAR_INTEGRATION_REPORT.md" "CALENDAR_TEST_REPORT.md"
  "CALENDRIER_EVALUATION_FINALE.md" "PRODUCTION-API-TEST-REPORT.md"
  "RAPPORT-CORRECTIONS-APIS.md" "RAPPORT-TEST-FINAL-APIS.md"
  "RAPPORT-VALIDATION-FINALE.md" "RAPPORT_VALIDATION_FINALE.md"
  "RAPPORT_COHERENCE_SUPABASE.md" "TESTS_SUPABASE_SUMMARY.md"
  "DEPLOYMENT_CHECKLIST.md" "DEPLOYMENT_COMPLETE.md" "DEPLOYMENT_GUIDE.md"
  "DEPLOIEMENT-CALENDRIER-EN-LIGNE.md" "BRANCHES_CLEANUP_README.md"
  "PR_CREATION_GUIDE.md" "PR_DESCRIPTION_NEW_FEATURES.md"
  "PULL_REQUEST_READY.md" "PULL_REQUEST_SMS_INTEGRATION.md"
)

echo -e "${BLUE}🗑️  Suppression...${NC}"
DELETED=0
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "  ✓ $file"
    ((DELETED++))
  fi
done

echo ""
TOTAL_BEFORE=143
TOTAL_AFTER=$(find . -maxdepth 1 \( -name "*.md" -o -name "*.txt" \) | wc -l | tr -d ' ')

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                            ║${NC}"
echo -e "${GREEN}║        ✅ NETTOYAGE TERMINÉ ✅            ║${NC}"
echo -e "${GREEN}║                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "📊 Résultats:"
echo "  • Fichiers supprimés:  $DELETED"
echo "  • Avant:               $TOTAL_BEFORE fichiers"
echo "  • Après:               $TOTAL_AFTER fichiers"
echo "  • Réduction:           -$((TOTAL_BEFORE - TOTAL_AFTER)) fichiers (-$((100 * (TOTAL_BEFORE - TOTAL_AFTER) / TOTAL_BEFORE))%)"
echo "  • Backup:              $BACKUP_DIR/"
echo ""
echo -e "${GREEN}🎉 Projet plus propre et professionnel!${NC}"
