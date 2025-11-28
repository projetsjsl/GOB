#!/bin/bash

# Script de vérification de l'installation BrowserTools MCP
# Usage: ./scripts/verify-browser-tools-installation.sh

echo "🔍 Vérification de l'installation BrowserTools MCP..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteur de vérifications
PASSED=0
FAILED=0

# 1. Vérifier le fichier MCP
echo "1️⃣  Vérification du fichier .cursor/mcp.json..."
if [ -f ".cursor/mcp.json" ]; then
    if grep -q "browser-tools" .cursor/mcp.json; then
        echo -e "${GREEN}✅ Fichier MCP configuré correctement${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ Fichier MCP existe mais configuration incorrecte${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${RED}❌ Fichier .cursor/mcp.json manquant${NC}"
    FAILED=$((FAILED + 1))
fi

# 2. Vérifier l'extension Chrome
echo ""
echo "2️⃣  Vérification de l'extension Chrome..."
if [ -d "/tmp/BrowserTools-extension/chrome-extension" ]; then
    if [ -f "/tmp/BrowserTools-extension/chrome-extension/manifest.json" ]; then
        echo -e "${GREEN}✅ Extension Chrome trouvée dans /tmp/BrowserTools-extension/chrome-extension/${NC}"
        echo -e "${YELLOW}⚠️  Action requise: Installer l'extension dans Chrome${NC}"
        echo "   → Ouvrir chrome://extensions/"
        echo "   → Activer 'Mode développeur'"
        echo "   → 'Charger l'extension non empaquetée'"
        echo "   → Sélectionner: /tmp/BrowserTools-extension/chrome-extension/"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ Extension Chrome incomplète${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${RED}❌ Extension Chrome non trouvée${NC}"
    FAILED=$((FAILED + 1))
fi

# 3. Vérifier le serveur BrowserTools
echo ""
echo "3️⃣  Vérification du serveur BrowserTools..."
if lsof -Pi :3025 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -t -i:3025)
    echo -e "${GREEN}✅ Serveur BrowserTools en cours d'exécution (PID: $PID)${NC}"
    echo -e "${GREEN}   Port 3025: ACTIF${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ Serveur BrowserTools non démarré${NC}"
    echo -e "${YELLOW}   Pour démarrer: ./scripts/start-browser-tools-server.sh${NC}"
    FAILED=$((FAILED + 1))
fi

# 4. Vérifier NPX
echo ""
echo "4️⃣  Vérification de NPX..."
if command -v npx &> /dev/null; then
    NPX_VERSION=$(npx --version)
    echo -e "${GREEN}✅ NPX disponible (version: $NPX_VERSION)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ NPX non trouvé${NC}"
    FAILED=$((FAILED + 1))
fi

# 5. Vérifier Node.js
echo ""
echo "5️⃣  Vérification de Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js disponible (version: $NODE_VERSION)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ Node.js non trouvé${NC}"
    FAILED=$((FAILED + 1))
fi

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Résumé de la vérification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Réussies: $PASSED${NC}"
echo -e "${RED}❌ Échouées: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Toutes les vérifications sont passées!${NC}"
    echo ""
    echo "📋 Actions manuelles restantes:"
    echo "   1. Installer l'extension Chrome (voir instructions ci-dessus)"
    echo "   2. Redémarrer Cursor pour charger la configuration MCP"
    echo "   3. Ouvrir Chrome DevTools sur une page web"
    echo ""
    echo "🧪 Test rapide dans Cursor:"
    echo "   \"Peux-tu vérifier les logs de la console?\""
    exit 0
else
    echo -e "${YELLOW}⚠️  Certaines vérifications ont échoué${NC}"
    echo ""
    echo "📋 Actions à prendre:"
    if [ ! -f ".cursor/mcp.json" ]; then
        echo "   - Créer le fichier .cursor/mcp.json"
    fi
    if ! lsof -Pi :3025 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   - Lancer le serveur: ./scripts/start-browser-tools-server.sh"
    fi
    exit 1
fi

