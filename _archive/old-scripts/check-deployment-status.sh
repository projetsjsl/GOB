#!/bin/bash

# Script pour vérifier le statut du déploiement Vercel
echo "🔍 Vérification du statut du déploiement Vercel"
echo "=============================================="
echo ""

BASE_URL="https://gob-projetsjsls-projects.vercel.app"

# Test des endpoints existants
echo "🧪 Test des endpoints existants..."
echo ""

# Test 1: Frontend
echo "1. Frontend:"
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
echo "   Status: $frontend_status $([ "$frontend_status" = "200" ] && echo "✅" || echo "❌")"

# Test 2: API unifiée existante
echo "2. API Unifiée:"
api_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/unified-serverless?endpoint=status")
echo "   Status: $api_status $([ "$api_status" = "200" ] && echo "✅" || echo "❌")"

# Test 3: API Gemini
echo "3. API Gemini:"
gemini_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/gemini/chat")
echo "   Status: $gemini_status $([ "$gemini_status" = "405" ] && echo "✅ (Method Not Allowed = OK)" || echo "❌")"

echo ""
echo "🆕 Test des nouveaux endpoints..."
echo ""

# Test 4: Nouvelle API de cache
echo "4. API Cache Nouvelles:"
cache_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/news/cached?type=general&limit=5")
echo "   Status: $cache_status $([ "$cache_status" = "200" ] && echo "✅" || echo "❌")"

# Test 5: Cron job
echo "5. Cron Job:"
cron_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/cron/refresh-news")
echo "   Status: $cron_status $([ "$cron_status" = "401" ] && echo "✅ (Unauthorized = OK, secret pas configuré)" || echo "❌")"

echo ""
echo "📊 Résumé:"
echo "=========="

if [ "$frontend_status" = "200" ]; then
    echo "✅ Frontend: Déployé"
else
    echo "❌ Frontend: Non accessible"
fi

if [ "$api_status" = "200" ]; then
    echo "✅ API Unifiée: Fonctionnelle"
else
    echo "❌ API Unifiée: Non accessible"
fi

if [ "$cache_status" = "200" ]; then
    echo "✅ API Cache: Déployée et fonctionnelle"
elif [ "$cache_status" = "404" ]; then
    echo "⏳ API Cache: Pas encore déployée (404)"
else
    echo "❌ API Cache: Erreur ($cache_status)"
fi

if [ "$cron_status" = "401" ]; then
    echo "✅ Cron Job: Déployé (besoin de configurer CRON_SECRET)"
elif [ "$cron_status" = "404" ]; then
    echo "⏳ Cron Job: Pas encore déployé (404)"
else
    echo "❌ Cron Job: Erreur ($cron_status)"
fi

echo ""
echo "💡 Actions recommandées:"
echo "======================="

if [ "$cache_status" = "404" ] || [ "$cron_status" = "404" ]; then
    echo "⏳ Le déploiement Vercel est en cours..."
    echo "   Attendez 2-3 minutes et relancez ce script"
    echo "   Commande: ./check-deployment-status.sh"
fi

if [ "$cron_status" = "401" ]; then
    echo "🔐 CRON_SECRET doit être configuré dans Vercel"
    echo "   Valeur: 0S0WkQvmLDYpkxDFrE1N7Q5JHl15bwCfb9g/Tpf19gA="
fi

if [ "$cache_status" = "200" ]; then
    echo "🗄️ Créer les tables Supabase avec le script SQL"
    echo "   Fichier: supabase-news-cache.sql"
fi

echo ""
echo "🔄 Pour relancer ce test:"
echo "   ./check-deployment-status.sh"
