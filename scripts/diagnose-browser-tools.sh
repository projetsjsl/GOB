#!/bin/bash

# Script de diagnostic pour BrowserTools MCP
# Usage: ./scripts/diagnose-browser-tools.sh

echo "🔍 Diagnostic BrowserTools MCP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Vérifier le serveur
echo "1️⃣  Vérification du serveur BrowserTools..."
if lsof -Pi :3025 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -t -i:3025)
    echo -e "${GREEN}✅ Serveur actif (PID: $PID)${NC}"
    
    # Tester la connexion HTTP
    HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3025 2>&1)
    if [ "$HTTP_RESPONSE" != "000" ]; then
        echo -e "${GREEN}✅ Serveur répond sur le port 3025 (HTTP: $HTTP_RESPONSE)${NC}"
    else
        echo -e "${RED}❌ Serveur ne répond pas${NC}"
    fi
else
    echo -e "${RED}❌ Serveur non démarré${NC}"
    echo "   → Pour démarrer: ./scripts/start-browser-tools-server.sh"
fi

echo ""

# 2. Vérifier l'extension
echo "2️⃣  Vérification de l'extension Chrome..."
EXTENSION_DIR="/tmp/BrowserTools-extension/chrome-extension"
if [ -d "$EXTENSION_DIR" ]; then
    if [ -f "$EXTENSION_DIR/manifest.json" ]; then
        echo -e "${GREEN}✅ Extension trouvée dans $EXTENSION_DIR${NC}"
        
        # Vérifier les fichiers essentiels
        FILES=("background.js" "devtools.js" "panel.html" "manifest.json")
        for file in "${FILES[@]}"; do
            if [ -f "$EXTENSION_DIR/$file" ]; then
                echo -e "   ${GREEN}✅ $file${NC}"
            else
                echo -e "   ${RED}❌ $file manquant${NC}"
            fi
        done
    else
        echo -e "${RED}❌ manifest.json manquant${NC}"
    fi
else
    echo -e "${RED}❌ Extension non trouvée${NC}"
fi

echo ""

# 3. Vérifier la configuration MCP
echo "3️⃣  Vérification de la configuration MCP..."
if [ -f ".cursor/mcp.json" ]; then
    if grep -q "browser-tools" .cursor/mcp.json; then
        echo -e "${GREEN}✅ Configuration MCP présente${NC}"
    else
        echo -e "${RED}❌ Configuration MCP incorrecte${NC}"
    fi
else
    echo -e "${RED}❌ Configuration MCP manquante${NC}"
fi

echo ""

# 4. Vérifier les processus Chrome
echo "4️⃣  Vérification des processus Chrome..."
CHROME_PROCESSES=$(ps aux | grep -i "Google Chrome" | grep -v grep | wc -l | tr -d ' ')
if [ "$CHROME_PROCESSES" -gt 0 ]; then
    echo -e "${GREEN}✅ Chrome en cours d'exécution ($CHROME_PROCESSES processus)${NC}"
else
    echo -e "${YELLOW}⚠️  Chrome non détecté${NC}"
fi

echo ""

# 5. Suggestions de résolution
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Suggestions de résolution:"
echo ""
echo "Si l'extension ne se connecte pas au serveur:"
echo "  1. Vérifiez que le serveur est bien lancé: lsof -i :3025"
echo "  2. Redémarrez le serveur: ./scripts/start-browser-tools-server.sh"
echo "  3. Dans Chrome, allez dans chrome://extensions/"
echo "  4. Rechargez l'extension BrowserTools (clic sur l'icône de rechargement)"
echo "  5. Ouvrez Chrome DevTools sur une page web"
echo "  6. Vérifiez le panneau BrowserTools dans DevTools"
echo ""
echo "Si vous voyez des erreurs dans la console:"
echo "  - 'Could not establish connection': Le serveur n'est pas accessible"
echo "  - 'Receiving end does not exist': L'extension n'est pas correctement chargée"
echo "  - Solution: Rechargez l'extension et redémarrez le serveur"
echo ""

