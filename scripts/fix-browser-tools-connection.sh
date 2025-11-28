#!/bin/bash

# Script pour résoudre les problèmes de connexion BrowserTools
# Usage: ./scripts/fix-browser-tools-connection.sh

echo "🔧 Résolution des problèmes de connexion BrowserTools MCP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Arrêter le serveur actuel
echo "1️⃣  Arrêt du serveur BrowserTools actuel..."
if lsof -Pi :3025 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -t -i:3025)
    echo "   Arrêt du processus PID: $PID"
    kill $PID 2>/dev/null
    sleep 2
    
    # Vérifier qu'il est arrêté
    if lsof -Pi :3025 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "   ${YELLOW}⚠️  Le processus résiste, utilisation de kill -9...${NC}"
        kill -9 $PID 2>/dev/null
        sleep 1
    fi
    
    if ! lsof -Pi :3025 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Serveur arrêté${NC}"
    else
        echo -e "   ${RED}❌ Impossible d'arrêter le serveur${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Aucun serveur en cours d'exécution${NC}"
fi

echo ""

# 2. Attendre un peu
echo "2️⃣  Attente de 2 secondes..."
sleep 2

echo ""

# 3. Relancer le serveur
echo "3️⃣  Relance du serveur BrowserTools..."
echo "   Commande: npx @agentdeskai/browser-tools-server@1.2.0"
echo ""

# Lancer en arrière-plan
npx -y @agentdeskai/browser-tools-server@1.2.0 > /tmp/browser-tools-server.log 2>&1 &
SERVER_PID=$!

# Attendre que le serveur démarre
echo "   Attente du démarrage du serveur..."
sleep 5

# Vérifier que le serveur est démarré
if lsof -Pi :3025 -sTCP:LISTEN -t >/dev/null 2>&1; then
    NEW_PID=$(lsof -t -i:3025)
    echo -e "   ${GREEN}✅ Serveur relancé avec succès (PID: $NEW_PID)${NC}"
    echo -e "   ${GREEN}✅ Port 3025: ACTIF${NC}"
else
    echo -e "   ${RED}❌ Le serveur n'a pas démarré${NC}"
    echo "   Logs:"
    tail -20 /tmp/browser-tools-server.log 2>/dev/null || echo "   Aucun log disponible"
    exit 1
fi

echo ""

# 4. Instructions pour Chrome
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Prochaines étapes dans Chrome:"
echo ""
echo "1. Allez dans chrome://extensions/"
echo "2. Trouvez 'BrowserTools MCP 1.2.0'"
echo "3. Cliquez sur l'icône de rechargement (🔄)"
echo "4. Attendez quelques secondes"
echo "5. Ouvrez Chrome DevTools sur une page web (⌘⌥I)"
echo "6. Cherchez l'onglet 'BrowserTools' dans DevTools"
echo ""
echo "💡 Si l'erreur persiste:"
echo "   - Fermez tous les onglets Chrome"
echo "   - Redémarrez Chrome"
echo "   - Rechargez l'extension"
echo ""
echo "📊 Vérifier le serveur:"
echo "   lsof -i :3025"
echo ""
echo "📝 Logs du serveur:"
echo "   tail -f /tmp/browser-tools-server.log"
echo ""

