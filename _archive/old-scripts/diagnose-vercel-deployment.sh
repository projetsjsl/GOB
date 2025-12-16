#!/bin/bash

# Script de diagnostic pour le déploiement Vercel
echo "🔍 Diagnostic du déploiement Vercel"
echo "==================================="
echo ""

BASE_URL="https://gob-projetsjsls-projects.vercel.app"

echo "📋 Vérification des fichiers locaux..."
echo ""

# Vérifier que les fichiers existent
echo "1. Fichiers API:"
if [ -f "api/gemini/chat.js" ]; then
    echo "   ✅ api/gemini/chat.js existe"
else
    echo "   ❌ api/gemini/chat.js manquant"
fi

if [ -f "api/news/cached.js" ]; then
    echo "   ✅ api/news/cached.js existe"
else
    echo "   ❌ api/news/cached.js manquant"
fi

if [ -f "api/cron/refresh-news.js" ]; then
    echo "   ✅ api/cron/refresh-news.js existe"
else
    echo "   ❌ api/cron/refresh-news.js manquant"
fi

echo ""
echo "2. Configuration Vercel:"
if [ -f "vercel.json" ]; then
    echo "   ✅ vercel.json existe"
    echo "   Contenu:"
    cat vercel.json | head -20
else
    echo "   ❌ vercel.json manquant"
fi

echo ""
echo "3. Test des endpoints de base..."
echo ""

# Test du frontend
echo "Frontend:"
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
echo "   Status: $frontend_status"

# Test d'un endpoint qui devrait exister
echo "API Gemini (devrait exister):"
gemini_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/gemini/chat")
echo "   Status: $gemini_status"

# Test d'un endpoint qui n'existe pas
echo "API inexistante (test):"
fake_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/fake-endpoint")
echo "   Status: $fake_status"

echo ""
echo "4. Vérification des commits récents..."
echo ""
git log --oneline -5

echo ""
echo "5. Vérification du statut Git..."
echo ""
git status --porcelain

echo ""
echo "📊 Diagnostic:"
echo "============="

if [ "$frontend_status" = "200" ]; then
    echo "✅ Frontend accessible - Vercel fonctionne"
else
    echo "❌ Frontend non accessible - Problème Vercel"
fi

if [ "$gemini_status" = "404" ]; then
    echo "❌ API Gemini non accessible - Problème de déploiement"
    echo "   Possible causes:"
    echo "   - Configuration vercel.json incorrecte"
    echo "   - Problème de build Vercel"
    echo "   - Limite de fonctions Vercel atteinte"
elif [ "$gemini_status" = "405" ]; then
    echo "✅ API Gemini accessible (Method Not Allowed = OK)"
else
    echo "⚠️ API Gemini: Status $gemini_status"
fi

echo ""
echo "💡 Solutions recommandées:"
echo "========================="

if [ "$gemini_status" = "404" ]; then
    echo "1. Vérifier la configuration vercel.json"
    echo "2. Vérifier les logs Vercel Dashboard"
    echo "3. Essayer de redéployer manuellement"
    echo "4. Vérifier les limites Vercel (12 fonctions max)"
fi

echo ""
echo "🔧 Commandes de test:"
echo "===================="
echo "curl -s \"$BASE_URL/api/gemini/chat\" -X POST -H \"Content-Type: application/json\" -d '{\"test\":\"test\"}'"
echo "curl -s \"$BASE_URL/api/news/cached?type=general&limit=5\""
echo "curl -s -X POST \"$BASE_URL/api/cron/refresh-news\" -H \"Authorization: Bearer YOUR_SECRET\""
