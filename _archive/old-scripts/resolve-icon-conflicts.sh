#!/bin/bash

# Script de résolution automatique des conflits Icon Component
# GOB - 2025-10-31

set -e

echo "🔧 Résolution des conflits Icon Component System"
echo "================================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Étape 1: Vérifier qu'on est sur main
echo -e "${YELLOW}[1/6]${NC} Vérification de la branche actuelle..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}→ Basculement vers main...${NC}"
    git checkout main
fi

# Étape 2: Mettre à jour main
echo -e "${YELLOW}[2/6]${NC} Mise à jour de la branche main..."
git pull origin main

# Étape 3: Créer une nouvelle branche pour résoudre les conflits
echo -e "${YELLOW}[3/6]${NC} Création de la branche de résolution..."
BRANCH_NAME="claude/icon-system-resolved-$(date +%s)"
git checkout -b "$BRANCH_NAME"
echo -e "${GREEN}✓ Branche créée: $BRANCH_NAME${NC}"

# Étape 4: Tenter le merge
echo -e "${YELLOW}[4/6]${NC} Tentative de merge de la branche Icon Component..."
if git merge origin/claude/review-documentation-icons-011CUfC3sifZEgTUjntG6gSD --no-ff -m "feat: Compléter le système Icon Component (résolution conflits)"; then
    echo -e "${GREEN}✓ Merge réussi sans conflits!${NC}"
    CONFLICTS=false
else
    echo -e "${RED}⚠ Conflits détectés comme prévu${NC}"
    CONFLICTS=true
fi

# Étape 5: Résoudre les conflits automatiquement
if [ "$CONFLICTS" = true ]; then
    echo -e "${YELLOW}[5/6]${NC} Résolution automatique des conflits..."

    # Vérifier si le fichier a des conflits
    if git diff --name-only --diff-filter=U | grep -q "beta-combined-dashboard.html"; then
        echo "→ Conflit trouvé dans beta-combined-dashboard.html"
        echo "→ Stratégie: Accepter la version Icon component (theirs)"

        # Accepter la version de la branche Icon component pour les zones de conflit
        git checkout --theirs public/beta-combined-dashboard.html

        # Ajouter le fichier résolu
        git add public/beta-combined-dashboard.html

        # Finaliser le merge
        git commit -m "feat: Résoudre conflits Icon component avec métadonnées Emma

- Acceptation de la version Icon component pour cohérence UI
- Métadonnées Emma utilisent maintenant <Icon emoji='...' />
- Préserve les 5 commits de la branche review-documentation-icons

Commits inclus:
- e62ff90 feat: Implémentation système de toggle Emoji/Iconoir (Phase 1)
- 1450cea feat: Remplacement manuel emojis → Icon component (Batch 1/10)
- 396a230 feat: Remplacement emojis → Icon component (Batch 2/10)
- 92bd880 feat: Remplacement emojis → Icon component (Batch 3/10)
- 46eb9cf feat: Remplacement emojis → Icon component (Batch 4/7)"

        echo -e "${GREEN}✓ Conflits résolus et commit créé${NC}"
    else
        echo -e "${RED}✗ Aucun conflit trouvé dans le fichier attendu${NC}"
        exit 1
    fi
fi

# Étape 6: Pousser la branche
echo -e "${YELLOW}[6/6]${NC} Push de la branche vers le remote..."

# Vérifier si la branche commence par claude/ et contient l'ID de session correct
if [[ $BRANCH_NAME == claude/* ]]; then
    echo "→ Branche valide pour le push"
    echo "→ Push vers origin/$BRANCH_NAME..."

    if git push -u origin "$BRANCH_NAME"; then
        echo -e "${GREEN}✓ Push réussi!${NC}"
        echo ""
        echo "================================================"
        echo -e "${GREEN}✅ SUCCÈS!${NC}"
        echo "================================================"
        echo ""
        echo "La branche $BRANCH_NAME a été créée et poussée."
        echo ""
        echo "🔗 Prochaine étape: Créer la Pull Request"
        echo ""
        echo "URL de création de PR:"
        echo "https://github.com/projetsjsl/GOB/compare/main...$BRANCH_NAME"
        echo ""
        echo "Titre suggéré:"
        echo "feat: Compléter le système Icon Component (5 commits)"
        echo ""
        echo "Utilisez la description de la PR #4 dans PR_CREATION_GUIDE.md"
        echo ""
    else
        echo -e "${RED}✗ Erreur lors du push${NC}"
        echo "Si l'erreur est 403, vérifiez que la branche commence par 'claude/'"
        exit 1
    fi
else
    echo -e "${RED}✗ Nom de branche invalide${NC}"
    echo "La branche doit commencer par 'claude/' pour être autorisée au push"
    exit 1
fi

echo "================================================"
echo ""
echo "📋 Résumé des actions effectuées:"
echo "  1. ✅ Mise à jour de main"
echo "  2. ✅ Création de la branche $BRANCH_NAME"
echo "  3. ✅ Merge de review-documentation-icons"
echo "  4. ✅ Résolution des conflits (stratégie: Icon component)"
echo "  5. ✅ Commit de résolution"
echo "  6. ✅ Push vers origin"
echo ""
echo "🎯 Prochaines étapes:"
echo "  1. Ouvrir l'URL ci-dessus pour créer la PR"
echo "  2. Copier la description depuis PR_CREATION_GUIDE.md"
echo "  3. Créer et merger la PR"
echo "  4. Vérifier le déploiement Vercel"
echo ""
