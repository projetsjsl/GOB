#!/bin/bash

# Script pour lancer le serveur BrowserTools MCP
# Usage: ./scripts/start-browser-tools-server.sh

echo "🚀 Démarrage du serveur BrowserTools MCP..."
echo ""
echo "📝 Note: Le serveur tourne sur le port 3025"
echo "📝 Assurez-vous qu'aucun autre processus n'utilise ce port"
echo ""

# Vérifier si le port 3025 est déjà utilisé
if lsof -Pi :3025 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Le port 3025 est déjà utilisé!"
    echo "🔍 Processus utilisant le port:"
    lsof -i :3025
    echo ""
    read -p "Voulez-vous tuer le processus? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $(lsof -t -i:3025)
        echo "✅ Processus tué"
        sleep 2
    else
        echo "❌ Installation annulée"
        exit 1
    fi
fi

echo "✅ Port 3025 disponible"
echo ""
echo "🔄 Lancement du serveur..."
echo ""

# Lancer le serveur
npx @agentdeskai/browser-tools-server@1.2.0

