#!/bin/bash

# Script de configuration complète pour Render
# Ce script prépare tout pour le déploiement Render

set -e

echo "🚀 Configuration Render pour GOB"
echo "=================================="
echo ""

# Couleurs pour l'output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé${NC}"
    echo "Assurez-vous d'être dans le répertoire racine du projet"
    exit 1
fi

echo -e "${GREEN}✅ Répertoire correct${NC}"
echo ""

# Vérifier que server.js existe
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Erreur: server.js non trouvé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ server.js trouvé${NC}"

# Vérifier que le script start existe dans package.json
if ! grep -q '"start"' package.json; then
    echo -e "${RED}❌ Erreur: script 'start' non trouvé dans package.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Script 'start' présent dans package.json${NC}"
echo ""

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Build
echo ""
echo "🔨 Build du projet..."
npm run build

echo ""
echo -e "${GREEN}✅ Build terminé avec succès${NC}"
echo ""

# Afficher les instructions
echo "=================================="
echo -e "${YELLOW}📋 PROCHAINES ÉTAPES:${NC}"
echo "=================================="
echo ""
echo "1. ${YELLOW}Modifiez la configuration dans Render Dashboard:${NC}"
echo "   👉 https://dashboard.render.com/web/srv-d49ocoh5pdvs73dot64g/settings"
echo ""
echo "   Dans 'Build & Deploy':"
echo "   - Build Command: ${GREEN}npm install && npm run build${NC}"
echo "   - Start Command: ${GREEN}npm start${NC}"
echo ""
echo "2. ${YELLOW}Commitez et poussez les changements:${NC}"
echo "   git add ."
echo "   git commit -m 'Configure Render deployment'"
echo "   git push origin main"
echo ""
echo "3. ${YELLOW}Le service redéploiera automatiquement${NC}"
echo ""
echo "4. ${YELLOW}Vérifiez après le déploiement:${NC}"
echo "   - Health: https://gob-kmay.onrender.com/health"
echo "   - Dashboard: https://gob-kmay.onrender.com/"
echo ""
echo -e "${GREEN}✅ Configuration terminée!${NC}"

