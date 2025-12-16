#!/bin/bash

# Script de déploiement pour Render
# Ce script prépare le projet pour le déploiement sur Render

set -e

echo "🚀 Préparation du déploiement Render..."

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Build du projet
echo "🔨 Build du projet..."
npm run build

# Vérifier que le serveur existe
if [ ! -f "server.js" ]; then
    echo "❌ server.js n'existe pas"
    exit 1
fi

echo "✅ Build terminé avec succès"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Commitez et poussez les changements:"
echo "   git add ."
echo "   git commit -m 'Configure Render deployment'"
echo "   git push origin main"
echo ""
echo "2. Dans le dashboard Render, configurez:"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo ""
echo "3. Le service redéploiera automatiquement"
echo ""
echo "✅ Prêt pour le déploiement!"

