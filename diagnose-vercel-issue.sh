#!/bin/bash

# Script de diagnostic approfondi pour Vercel
echo "🔍 Diagnostic approfondi Vercel"
echo "==============================="
echo ""

BASE_URL="https://gob.vercel.app"

echo "📋 1. Vérification des commits récents..."
echo ""
git log --oneline -5

echo ""
echo "📋 2. Vérification du statut Git..."
echo ""
git status --porcelain

echo ""
echo "📋 3. Test des endpoints avec détails..."
echo ""

# Test détaillé du frontend
echo "Frontend:"
frontend_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
frontend_status=$(echo "$frontend_response" | tail -n1)
frontend_body=$(echo "$frontend_response" | head -n -1)
echo "   Status: $frontend_status"
if [ "$frontend_status" = "200" ]; then
    echo "   ✅ Frontend accessible"
    if echo "$frontend_body" | grep -q "GOB Apps"; then
        echo "   ✅ Contenu correct détecté"
    else
        echo "   ⚠️ Contenu inattendu"
    fi
else
    echo "   ❌ Frontend non accessible"
fi

echo ""
echo "API Gemini (test détaillé):"
gemini_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/gemini/chat")
gemini_status=$(echo "$gemini_response" | tail -n1)
gemini_body=$(echo "$gemini_response" | head -n -1)
echo "   Status: $gemini_status"
echo "   Réponse: $gemini_body"

echo ""
echo "API Cache (test détaillé):"
cache_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/news/cached?type=general&limit=5")
cache_status=$(echo "$cache_response" | tail -n1)
cache_body=$(echo "$cache_response" | head -n -1)
echo "   Status: $cache_status"
echo "   Réponse: $cache_body"

echo ""
echo "📋 4. Vérification de la configuration Vercel..."
echo ""

if [ -f "vercel.json" ]; then
    echo "✅ vercel.json existe"
    echo "Contenu complet:"
    cat vercel.json
    echo ""
    
    # Vérifier la syntaxe JSON
    if python3 -m json.tool vercel.json > /dev/null 2>&1; then
        echo "✅ Syntaxe JSON valide"
    else
        echo "❌ Erreur de syntaxe JSON"
    fi
else
    echo "❌ vercel.json manquant"
fi

echo ""
echo "📋 5. Vérification des fichiers API..."
echo ""

api_files=(
    "api/gemini/chat.js"
    "api/news/cached.js"
    "api/cron/refresh-news.js"
)

for file in "${api_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
        # Vérifier la syntaxe basique
        if head -1 "$file" | grep -q "export default\|module.exports"; then
            echo "   ✅ Export trouvé"
        else
            echo "   ⚠️ Pas d'export au début"
        fi
    else
        echo "❌ $file manquant"
    fi
done

echo ""
echo "📋 6. Test d'un endpoint simple..."
echo ""

# Créer un endpoint de test simple
echo "export default function handler(req, res) {
  res.status(200).json({ message: 'Test endpoint OK', timestamp: new Date().toISOString() });
}" > api/test-simple.js

echo "✅ Endpoint de test créé: api/test-simple.js"

echo ""
echo "📋 7. Commit et test de l'endpoint simple..."
echo ""

git add api/test-simple.js
git commit -m "🧪 Test endpoint simple pour diagnostic"
git push

echo "✅ Commit envoyé, attente du déploiement..."

# Attendre 2 minutes
sleep 120

echo ""
echo "🧪 Test de l'endpoint simple..."
echo ""

test_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/test-simple")
test_status=$(echo "$test_response" | tail -n1)
test_body=$(echo "$test_response" | head -n -1)

echo "Status: $test_status"
echo "Réponse: $test_body"

if [ "$test_status" = "200" ]; then
    echo "✅ Endpoint simple fonctionne - Le problème est spécifique aux autres APIs"
else
    echo "❌ Même l'endpoint simple ne fonctionne pas - Problème général Vercel"
fi

echo ""
echo "📊 Diagnostic final:"
echo "==================="

if [ "$test_status" = "200" ]; then
    echo "✅ Vercel fonctionne - Problème spécifique aux APIs existantes"
    echo ""
    echo "💡 Solutions recommandées:"
    echo "   1. Vérifier les imports dans les APIs"
    echo "   2. Vérifier les variables d'environnement"
    echo "   3. Vérifier les logs Vercel pour les erreurs spécifiques"
else
    echo "❌ Problème général avec Vercel"
    echo ""
    echo "💡 Solutions recommandées:"
    echo "   1. Vérifier les logs Vercel Dashboard"
    echo "   2. Essayer de redéployer manuellement"
    echo "   3. Vérifier les limites Vercel"
    echo "   4. Contacter le support Vercel"
fi

echo ""
echo "🧹 Nettoyage..."
rm -f api/test-simple.js
git add api/test-simple.js
git commit -m "🧹 Cleanup test endpoint"
git push

echo "✅ Nettoyage terminé"
