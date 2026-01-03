#!/bin/bash

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Nettoyage des branches Claude obsolètes - GOB          ║"
echo "║   73 branches obsolètes (avant décembre 2025)            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Branches à supprimer (avant décembre 2025)
OLD_BRANCHES=(
  "claude/add-fastgraph-variations-012BmdXLTksmzPM6gcHgHWff"
  "claude/emma-config-ui-admin-01SXqtt3Rs1aJzMxTq8xT2fQ"
  "claude/fix-emma-sms-data-01Hntxr6UpDTQ7dyVbJ9X4Dx"
  "claude/fix-admin-api-get-01SXqtt3Rs1aJzMxTq8xT2fQ"
  "claude/fix-babel-transpilation-timeout-01WrfUtGMtGeiR6zgyXowrpB"
  "claude/fix-storage-library-loading-019PFnsDDLGzWSgbcbnd9PyE"
  "claude/fix-production-warnings-01Buo1mUqh5H8aFpDPH6KbFN"
  "claude/optimize-emma-prompts-01VUPd99qRjR5xYJAFDYypo1"
  "claude/refactor-sms-chatbot-architecture-014vcK1Dk6zPtaQsDLcn9WGQ"
  "claude/fix-emma-product-type-analysis-01B8HydDLbWhtM76j6Y5KPhV"
  "claude/improve-emma-response-quality-01ToYsx9kEugfkGZhNs8D4GP"
  "claude/fix-emma-json-serialization-01Rf2oCeexbbvnssYszswLf2"
  "claude/fix-emma-analysis-response-01PtG2fB2fjxDtTQneTfQrWL"
  "claude/process-emma-analysis-properly-01Eo9E3kkKeBBhRAe9N2KPWt"
  "claude/fix-emma-analysis-parsing-01P6HuJvMDkChcWMEaUbQdBR"
  "claude/maintain-emma-context-015HvC6J2z33LFm4gg3cHcb9"
  "claude/fix-emma-context-syntax-014x5pjmLtgzuWBP1vCFWvvv"
  "claude/remove-duplicate-emma-variables-015xUEjPHoRmGGFf3aVc9QJE"
  "claude/improve-emma-formatting-01LQRR8yMkrHFoB84v9Vr6m2"
  "claude/fix-emma-analysis-formatting-01ToJzZxQHqSdXxWjDMXQAkB"
  "claude/fix-missing-curly-brace-011CUshHdXnuNH7gp5CJiLcW"
  "claude/fix-conversation-memory-011CUoyL2KYfuoaxH8bRqjPK"
  "claude/fix-emma-agent-errors-011CUsWzr3PQk2CstJoPxh6t"
  "claude/add-tradingview-chart-011CUshT8RmEMYg9QFbGDiyA"
  "claude/emma-rsi-skill-011CUsfTbVhQppVRnVWAibpe"
  "claude/fix-emma-agent-syntax-error-011CUpfMSwaM9vj3Ho2yghLo"
  "claude/configure-twilio-sms-url-011CUk86CKxUQVuEmok4zwKn"
  "claude/add-multichannel-support-011CUjyrjfnSAW4RzDgsEKjT"
  "claude/audit-site-functionality-011CUfP5eBAq1QLRKYUV8WXA"
  "claude/add-emma-prompt-context-011CUfKM6Ph5ffVJt5DqfTDK"
  "claude/branch-cleanup-guide-011CUfJuY54cTkxYDrqhqq2t"
  "claude/chatbot-image-display-011CUeWgT2j8kkepj8s917ER"
  "claude/chatbot-image-display-011CUf9uNmfa5SYfwTaPWA8v"
  "claude/fix-admin-gob-role-access-011CUeWL3CCsah3TAHZ2rr5k"
  "claude/fix-pattern-validation-011CUYephHrKWV5RjK4zrrWj"
  "claude/analyze-finance-chatbots-011CUYYtjF67gKbXj9qQjnvU"
  "claude/chat-response-type-011CUWo5VASfhAoSN5Qt1vyU"
  "claude/test-gob-api-endpoints-011CUWmsxQ6fH6Bxph3MZn7f"
  "claude/improve-plus-icon-overlay-011CUWmHCpXcGgEfyiVZHLXo"
  "claude/fix-api-errors-011CUWmBMwJdtYAzLsE8Rpzy"
  "claude/optimize-theme-icons-011CUWkL2QBhbkjw4a2rGCtU"
  "claude/update-theme-icons-011CUWhmotVg9iMZiGEQp8t1"
  "claude/update-site-icons-011CUWgPNjvArBjstxXiKfwJ"
  "claude/add-footer-tab-icons-011CUWf9N1WwnM6Yd9DXEPUk"
  "claude/improve-chat-animation-011CUWeyN9RLdJQVZaUHVW9C"
  "claude/dark-mode-styling-011CUWeszM7FUTv5Kv4sxxhP"
  "claude/prevent-mobile-scroll-011CUWejYfYuq6VS4icih83W"
  "claude/mobile-desktop-navigation-update-011CUWdbYqdU8AQwrxBHnoT2"
  "claude/fix-typescript-indexing-011CUUi2xcGA4bNHKgabLC3S"
  "claude/fix-deployment-error-011CUUhZnQqjyYoABbDE4ruE"
  "claude/update-site-icons-011CUUg7zEuMHp9SFEteXphR"
  "claude/implement-dark-theme-011CUUcecBVhJBnvSB8TtqaN"
  "claude/remove-deprecated-tabs-011CUUc3x3My3mgEQqzzq8a3"
  "claude/improve-tab-navigation-011CUUYe7UshrC6HmznC8u5C"
  "claude/fix-js-widget-overlap-011CUUMswmLETKiPshCDZz55"
  "claude/validate-api-endpoints-011CUUFBW9QqtETPehqGCv5Z"
  "claude/mobile-quote-graph-layout-011CUUCHM4HYRHgJNpLhwXtw"
  "claude/optimize-mobile-tests-011CUU72Gyy1v8t2TuaRt3bv"
  "claude/deploy-github-commons-011CUUDy3aoCQcqcHdSp3fBQ"
  "claude/add-birthday-email-form-011CUPNdyjNYsoZyXJK1jEm7"
  "claude/fetch-all-tickers-011CULjSpvf6sYZoqTvAjsGs"
  "claude/ai-initiative-research-011CULepYkMWRn5eXDMZeZeY"
  "claude/explain-dashboard-tab-011CULSbSkw13Q1L6AVYq1FT"
  "claude/fix-login-validation-011CUZVMv9DtXpgodih8heQN"
  "claude/research-market-visualization-011CUajWqxQwq7f9M12CxNLT"
  "claude/fix-tradingview-ticker-011CUby1Y1ABFP1CQAaCzqXF"
  "claude/research-market-visualization-011CUbp6f8FMvKzRiDzShN9J"
  "claude/research-financial-charts-011CUch3Y1VY2xvJJAi8hNMd"
  "claude/add-ai-analyst-tab-structure-011CUfK5YqPyP1cPQxvUZDqG"
  "claude/update-portfolio-tab-011CUfNz8rNMTHdYbx8JeNjq"
  "claude/optimize-tab-navigation-011CUfPq9qKK7LNiMtW4fqvL"
  "claude/analyze-codebase-structure-011CUfS62dY8sCbBiUKDaSx8"
  "claude/integrate-sms-service-011CUfT3YveW27dETggpbYKe"
)

echo -e "${YELLOW}Total de branches à supprimer: ${#OLD_BRANCHES[@]}${NC}"
echo ""
echo "Ces branches datent d'avant décembre 2025 et n'ont jamais été mergées dans main."
echo "Elles contiennent probablement du travail expérimental ou abandonné."
echo ""
echo -e "${YELLOW}⚠️  ATTENTION: Cette action est irréversible!${NC}"
echo ""
read -p "Voulez-vous continuer? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Annulé.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Début de la suppression...${NC}\n"

DELETED=0
FAILED=0
ERROR_LOG="/tmp/branch_cleanup_errors.log"
> "$ERROR_LOG"  # Clear error log

for branch in "${OLD_BRANCHES[@]}"; do
    echo -n "Suppression de ${branch}... "

    OUTPUT=$(git push origin --delete "$branch" 2>&1)
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✓${NC}"
        ((DELETED++))
    else
        echo -e "${RED}✗${NC}"
        echo "$branch: $OUTPUT" >> "$ERROR_LOG"
        ((FAILED++))
    fi

    # Petit délai pour éviter de surcharger le serveur
    sleep 0.1
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Branches supprimées avec succès: $DELETED${NC}"
echo -e "${RED}✗ Échecs: $FAILED${NC}"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Des erreurs sont survenues. Voir les détails dans: $ERROR_LOG${NC}"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ $DELETED -gt 0 ]; then
    echo -e "${GREEN}Nettoyage terminé avec succès!${NC}"
    echo ""
    echo "Branches restantes (recommandées à garder):"
    echo "  - claude/audit-gob-stack-eZBGE (⭐ branche principale avec tout le travail récent)"
    echo "  - claude/tailwind-poc-eZBGE (peut être supprimée si déjà mergée dans audit)"
    echo "  - claude/fix-exports-error-RD7IV"
    echo "  - claude/fix-gobapps-nlTje"
    echo ""
    echo "Branches déjà mergées dans main (peuvent être supprimées):"
    echo "  - claude/fix-production-urgent-nlTje ✓"
    echo "  - claude/push-commits-new-branch-UWFTL ✓"
    echo "  - claude/validate-vercel-deployment-BGrrA ✓"
    echo "  - claude/yield-curve-final-fix-BGrrA ✓"
else
    echo -e "${RED}Aucune branche n'a été supprimée.${NC}"
fi

echo ""
