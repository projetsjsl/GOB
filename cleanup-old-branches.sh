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
echo "║   Branches avant le déploiement en production            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Date du dernier déploiement en production
PRODUCTION_DATE="2025-12-31 19:59:38"
PRODUCTION_COMMIT="0025bd0a"

echo -e "${YELLOW}Dernier déploiement en production:${NC}"
echo "  Date: $PRODUCTION_DATE"
echo "  Commit: $PRODUCTION_COMMIT"
echo ""

# Collecter toutes les branches avant la production
echo -e "${BLUE}Analyse des branches Claude...${NC}"

OLD_BRANCHES=()
while IFS= read -r branch; do
    commit_date=$(git log -1 --format='%ci' "$branch" 2>/dev/null)
    if [[ "$commit_date" < "$PRODUCTION_DATE" ]]; then
        # Retirer le préfixe origin/
        branch_name="${branch#origin/}"
        OLD_BRANCHES+=("$branch_name")
    fi
done < <(git for-each-ref --format='%(refname:short)' refs/remotes/origin/claude/)

echo ""
echo -e "${YELLOW}Total de branches à supprimer: ${#OLD_BRANCHES[@]}${NC}"
echo ""

if [ ${#OLD_BRANCHES[@]} -eq 0 ]; then
    echo -e "${GREEN}Aucune branche obsolète trouvée!${NC}"
    exit 0
fi

# Identifier les branches déjà mergées
echo -e "${BLUE}Identification des branches déjà mergées dans main...${NC}"
MERGED_BRANCHES=()
while IFS= read -r branch; do
    branch_name="${branch#origin/}"
    branch_name="${branch_name#  }"  # Retirer les espaces
    MERGED_BRANCHES+=("$branch_name")
done < <(git branch -r --merged origin/main | grep "origin/claude/")

echo -e "${GREEN}Branches déjà mergées: ${#MERGED_BRANCHES[@]}${NC}"
echo ""

# Afficher un échantillon
echo "Échantillon de branches à supprimer (10 premières):"
for i in {0..9}; do
    if [ $i -lt ${#OLD_BRANCHES[@]} ]; then
        branch="${OLD_BRANCHES[$i]}"
        # Vérifier si mergée
        if [[ " ${MERGED_BRANCHES[@]} " =~ " ${branch} " ]]; then
            echo "  - $branch ${GREEN}(déjà mergée dans main)${NC}"
        else
            echo "  - $branch"
        fi
    fi
done
if [ ${#OLD_BRANCHES[@]} -gt 10 ]; then
    echo "  ... et $((${#OLD_BRANCHES[@]} - 10)) autres"
fi

echo ""
echo -e "${YELLOW}⚠️  ATTENTION: Cette action est irréversible!${NC}"
echo -e "${YELLOW}Toutes ces branches datent d'avant le déploiement en production.${NC}"
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
    echo "Branches post-production conservées:"
    echo "  - claude/audit-gob-stack-eZBGE (⭐ contient tout le travail depuis la production)"
    echo "  - claude/tailwind-poc-eZBGE (POC Tailwind, déjà mergé dans audit)"
else
    echo -e "${RED}Aucune branche n'a été supprimée.${NC}"
fi

echo ""
