#!/bin/bash
# Commande /start - Setup initial de développement GOB Dashboard
# Cette commande prépare l'environnement de développement complet

set -e

echo "🚀 GOB Dashboard - Setup de Développement Initial"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Pull des repos GitHub
echo -e "${BLUE}📥 Étape 1/7: Pull des repos GitHub...${NC}"
cd "$(dirname "$0")/.."
git fetch origin
git pull origin main || git pull origin master
echo -e "${GREEN}✅ Repos à jour${NC}"
echo ""

# 2. Vérifier les branches récentes
echo -e "${BLUE}🌿 Étape 2/7: Analyse des branches...${NC}"
echo "Branches locales:"
git branch -a --sort=-committerdate | head -10
echo ""
echo "Branches distantes récentes:"
git branch -r --sort=-committerdate | head -10
echo ""

# 3. Évaluer les derniers commits
echo -e "${BLUE}📝 Étape 3/7: Analyse des derniers commits...${NC}"
echo "Derniers commits sur main:"
git log --oneline --graph --decorate -10 origin/main 2>/dev/null || git log --oneline --graph --decorate -10 origin/master 2>/dev/null || git log --oneline --graph --decorate -10
echo ""

# 4. Vérifier l'état actuel
echo -e "${BLUE}📊 Étape 4/7: État du dépôt...${NC}"
echo "Branche actuelle: $(git branch --show-current)"
echo "Statut:"
git status --short
echo ""

# 5. Installer les dépendances si nécessaire
echo -e "${BLUE}📦 Étape 5/7: Vérification des dépendances...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances npm..."
    npm install
else
    echo "Dépendances déjà installées"
fi
echo ""

# 6. Démarrer le serveur de développement
echo -e "${BLUE}🖥️  Étape 6/7: Démarrage du serveur de développement...${NC}"
echo "Le serveur va démarrer en arrière-plan..."
echo "URL: http://localhost:5173"
echo ""

# Démarrer Vite en arrière-plan
npm run dev > /tmp/gob-dev-server.log 2>&1 &
VITE_PID=$!
echo "PID du serveur Vite: $VITE_PID"
echo "Logs: /tmp/gob-dev-server.log"

# Attendre que le serveur démarre
echo "Attente du démarrage du serveur..."
sleep 5

# Vérifier que le serveur répond
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Serveur démarré avec succès${NC}"
else
    echo -e "${YELLOW}⚠️  Le serveur peut prendre quelques secondes supplémentaires${NC}"
fi
echo ""

# 7. Ouvrir le navigateur
echo -e "${BLUE}🌐 Étape 7/7: Ouverture du navigateur...${NC}"
if command -v open &> /dev/null; then
    # macOS
    open "http://localhost:5173"
    open "http://localhost:5173/test-integrations.html" 2>/dev/null || true
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "http://localhost:5173"
    xdg-open "http://localhost:5173/test-integrations.html" 2>/dev/null || true
elif command -v start &> /dev/null; then
    # Windows
    start "http://localhost:5173"
    start "http://localhost:5173/test-integrations.html" 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Impossible d'ouvrir le navigateur automatiquement${NC}"
    echo "Ouvrez manuellement: http://localhost:5173"
fi
echo ""

# Résumé
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup terminé avec succès!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "📋 Informations importantes:"
echo "  • Serveur: http://localhost:5173"
echo "  • Tests: http://localhost:5173/test-integrations.html"
echo "  • PID serveur: $VITE_PID"
echo "  • Logs: /tmp/gob-dev-server.log"
echo ""
echo "🛑 Pour arrêter le serveur:"
echo "  kill $VITE_PID"
echo ""
echo "📊 Prochaines étapes suggérées:"
echo "  1. Vérifier la console du navigateur pour les erreurs"
echo "  2. Tester les intégrations FastGraph et Ground News"
echo "  3. Vérifier que Tailwind CSS est bien chargé (pas de CDN)"
echo "  4. Examiner les derniers commits pour comprendre les changements"
echo ""

# Sauvegarder le PID pour référence future
echo $VITE_PID > /tmp/gob-vite.pid
