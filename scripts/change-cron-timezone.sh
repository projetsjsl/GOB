#!/bin/bash

###############################################################################
# Script de Changement de Timezone pour Crons Vercel
#
# Usage:
#   ./scripts/change-cron-timezone.sh edt   # Passer à l'heure d'été (mars)
#   ./scripts/change-cron-timezone.sh est   # Passer à l'heure d'hiver (novembre)
#
# Briefings Montréal: 7h20, 11h50, 16h20 (peu importe la timezone)
###############################################################################

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier l'argument
if [ -z "$1" ]; then
    echo -e "${RED}❌ Erreur: Argument manquant${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 edt    # Passer à l'heure d'été (EDT = UTC-4)"
    echo "  $0 est    # Passer à l'heure d'hiver (EST = UTC-5)"
    echo ""
    exit 1
fi

TIMEZONE=$(echo "$1" | tr '[:upper:]' '[:lower:]')

if [ "$TIMEZONE" != "edt" ] && [ "$TIMEZONE" != "est" ]; then
    echo -e "${RED}❌ Erreur: Timezone invalide '$1'${NC}"
    echo "Utilisez 'edt' ou 'est'"
    exit 1
fi

# Chemin du fichier vercel.json
VERCEL_JSON="vercel.json"

if [ ! -f "$VERCEL_JSON" ]; then
    echo -e "${RED}❌ Erreur: Fichier $VERCEL_JSON non trouvé${NC}"
    echo "Exécutez ce script depuis la racine du projet GOB"
    exit 1
fi

echo ""
echo -e "${BLUE}⏰ Changement de Timezone des Crons Vercel${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$TIMEZONE" = "edt" ]; then
    echo -e "${GREEN}🌞 Configuration pour EDT (Heure d'Été)${NC}"
    echo "Période: Mars à Novembre"
    echo "Décalage: UTC-4"
    echo ""
    echo "Briefings Montréal → UTC:"
    echo "  • 7:20 EDT → 11:20 UTC"
    echo "  • 11:50 EDT → 15:50 UTC"
    echo "  • 16:20 EDT → 20:20 UTC"
    echo ""

    # Remplacements pour EDT
    sed -i '' 's/"schedule": "20 12 \* \* 1-5"/"schedule": "20 11 * * 1-5"/' "$VERCEL_JSON"
    sed -i '' 's/"schedule": "50 16 \* \* 1-5"/"schedule": "50 15 * * 1-5"/' "$VERCEL_JSON"
    sed -i '' 's/"schedule": "20 21 \* \* 1-5"/"schedule": "20 20 * * 1-5"/' "$VERCEL_JSON"

    COMMIT_MSG="⏰ Cron Timezone: EST → EDT (heure d'été)"

else
    echo -e "${BLUE}❄️ Configuration pour EST (Heure d'Hiver)${NC}"
    echo "Période: Novembre à Mars"
    echo "Décalage: UTC-5"
    echo ""
    echo "Briefings Montréal → UTC:"
    echo "  • 7:20 EST → 12:20 UTC"
    echo "  • 11:50 EST → 16:50 UTC"
    echo "  • 16:20 EST → 21:20 UTC"
    echo ""

    # Remplacements pour EST
    sed -i '' 's/"schedule": "20 11 \* \* 1-5"/"schedule": "20 12 * * 1-5"/' "$VERCEL_JSON"
    sed -i '' 's/"schedule": "50 15 \* \* 1-5"/"schedule": "50 16 * * 1-5"/' "$VERCEL_JSON"
    sed -i '' 's/"schedule": "20 20 \* \* 1-5"/"schedule": "20 21 * * 1-5"/' "$VERCEL_JSON"

    COMMIT_MSG="⏰ Cron Timezone: EDT → EST (heure d'hiver)"
fi

# Vérifier si les changements ont été appliqués
if git diff --quiet "$VERCEL_JSON"; then
    echo -e "${YELLOW}⚠️ Aucun changement détecté${NC}"
    echo "Le fichier $VERCEL_JSON est déjà configuré pour $TIMEZONE"
    echo ""
    exit 0
fi

echo -e "${GREEN}✅ Fichier $VERCEL_JSON modifié avec succès${NC}"
echo ""

# Afficher les changements
echo -e "${YELLOW}📝 Changements effectués:${NC}"
git diff "$VERCEL_JSON" | grep "schedule"
echo ""

# Demander confirmation pour commit
read -p "Voulez-vous commit et push ces changements? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Commit
    git add "$VERCEL_JSON"
    git commit -m "$COMMIT_MSG"

    echo ""
    echo -e "${GREEN}✅ Changements committés${NC}"
    echo ""

    # Demander pour push
    read -p "Voulez-vous push vers GitHub maintenant? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push
        echo ""
        echo -e "${GREEN}✅ Changements pushés vers GitHub${NC}"
        echo ""
        echo -e "${BLUE}📋 Prochaines étapes:${NC}"
        echo "  1. Vérifier Vercel Dashboard → Settings → Cron Jobs"
        echo "  2. Confirmer les nouveaux schedules"
        echo "  3. Attendre le premier briefing demain"
        echo "  4. Vérifier l'heure de réception"
        echo ""
    else
        echo ""
        echo -e "${YELLOW}⚠️ Push annulé${NC}"
        echo "N'oubliez pas de push manuellement:"
        echo "  git push"
        echo ""
    fi
else
    echo ""
    echo -e "${YELLOW}⚠️ Commit annulé${NC}"
    echo "Les changements sont toujours dans le fichier."
    echo "Pour annuler:"
    echo "  git checkout $VERCEL_JSON"
    echo ""
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Script terminé${NC}"
echo ""
