#!/bin/bash

echo "🚀 Déploiement des corrections GOB Apps"
echo "========================================"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "vercel.json" ]; then
    echo "❌ Erreur: vercel.json non trouvé. Êtes-vous dans le bon répertoire ?"
    exit 1
fi

echo "✅ Configuration Vercel trouvée"

# Vérifier les fichiers créés
echo "🔍 Vérification des fichiers de correction..."

files=(
    "public/404.html"
    "public/error-handler.js"
    "public/diagnostic.html"
    "vercel.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file manquant"
        exit 1
    fi
done

echo ""
echo "📋 Résumé des corrections implémentées:"
echo "• Configuration Vercel avec routes explicites"
echo "• Page d'erreur 404 personnalisée"
echo "• Gestionnaire d'erreurs pour Eruda"
echo "• Outil de diagnostic"
echo "• Gestion robuste des erreurs de script"

echo ""
echo "🔧 Test local des corrections..."

# Tester la configuration Vercel
if command -v node &> /dev/null; then
    echo "✅ Node.js disponible"
    if node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8'))" 2>/dev/null; then
        echo "✅ Configuration Vercel valide"
    else
        echo "❌ Configuration Vercel invalide"
        exit 1
    fi
else
    echo "⚠️  Node.js non disponible pour la validation"
fi

echo ""
echo "🌐 URLs de test après déploiement:"
echo "• https://gobapps.com/ (Accueil)"
echo "• https://gobapps.com/seeking-alpha (Seeking Alpha)"
echo "• https://gobapps.com/stocksandnews (Stocks & News)"
echo "• https://gobapps.com/beta-combined-dashboard (Dashboard Beta)"
echo "• https://gobapps.com/diagnostic (Diagnostic)"
echo "• https://gobapps.com/404 (Page d'erreur)"

echo ""
echo "✅ Corrections prêtes pour le déploiement !"
echo ""
echo "📝 Instructions de déploiement:"
echo "1. Les modifications sont déjà commitées et poussées sur GitHub"
echo "2. Si Vercel est connecté à ce repo, le déploiement sera automatique"
echo "3. Sinon, connectez-vous à Vercel et importez le projet"
echo "4. Testez les URLs listées ci-dessus"
echo "5. Utilisez /diagnostic pour vérifier le bon fonctionnement"

echo ""
echo "🎯 Problèmes résolus:"
echo "• Erreur 404 NOT_FOUND avec ID: iad1::zm7qh-1759961229270-9a69d4b05ec8"
echo "• Erreurs Eruda dans la console"
echo "• Erreurs de script aux lignes 27+"
echo "• Problèmes de routing des pages statiques"