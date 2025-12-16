#!/bin/bash

# Script de nettoyage des branches Claude mergées
# GOB - 2025-10-31

set -e

echo "🗑️  Nettoyage des branches Claude mergées"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Mettre à jour les références remote
echo -e "${YELLOW}[1/4]${NC} Mise à jour des références remote..."
git fetch origin --prune
echo -e "${GREEN}✓ Références mises à jour${NC}"
echo ""

# Lister les branches mergées
echo -e "${YELLOW}[2/4]${NC} Liste des branches Claude mergées dans main..."
MERGED_BRANCHES=$(git branch -r --merged origin/main | grep "origin/claude/" | sed 's/origin\///' || true)

if [ -z "$MERGED_BRANCHES" ]; then
    echo -e "${BLUE}ℹ Aucune branche Claude mergée à supprimer${NC}"
    exit 0
fi

echo "$MERGED_BRANCHES" | while read branch; do
    echo "  • $branch"
done
echo ""

# Compter les branches
BRANCH_COUNT=$(echo "$MERGED_BRANCHES" | wc -l)
echo -e "${BLUE}Total: $BRANCH_COUNT branches mergées${NC}"
echo ""

# Demander confirmation
echo -e "${YELLOW}⚠️  ATTENTION:${NC} Cette action va supprimer ces branches du remote!"
echo -e "Voulez-vous continuer? (y/N)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${RED}✗ Nettoyage annulé${NC}"
    exit 0
fi

# Supprimer les branches locales mergées
echo ""
echo -e "${YELLOW}[3/4]${NC} Suppression des branches locales..."
git branch --merged origin/main | grep "claude/" | xargs -r git branch -d 2>/dev/null || true
echo -e "${GREEN}✓ Branches locales supprimées${NC}"
echo ""

# Supprimer les branches remote
echo -e "${YELLOW}[4/4]${NC} Suppression des branches remote..."
DELETED_COUNT=0
FAILED_COUNT=0

echo "$MERGED_BRANCHES" | while read branch; do
    echo -n "→ Suppression de $branch... "
    if git push origin --delete "$branch" 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    else
        echo -e "${RED}✗${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
done

echo ""
echo "=========================================="
echo -e "${GREEN}✅ NETTOYAGE TERMINÉ${NC}"
echo "=========================================="
echo ""
echo "📊 Statistiques:"
echo "  • Branches analysées: $BRANCH_COUNT"
echo "  • Branches supprimées: $DELETED_COUNT"
if [ "$FAILED_COUNT" -gt 0 ]; then
    echo "  • Échecs: $FAILED_COUNT"
fi
echo ""

# Lister les branches restantes
echo -e "${YELLOW}📋 Branches Claude restantes (non mergées):${NC}"
git branch -r --no-merged origin/main | grep "origin/claude/" | sed 's/origin\///' | while read branch; do
    echo "  • $branch"
done || echo -e "${GREEN}  Aucune${NC}"
echo ""

echo "🎉 Le repository est maintenant plus propre!"
echo ""
