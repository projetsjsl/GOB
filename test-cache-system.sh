#!/bin/bash

# Script de test pour le système de cache des nouvelles
echo "🧪 Test du système de cache des nouvelles"
echo "=========================================="
echo ""

# Configuration
BASE_URL="https://gob-projetsjsls-projects.vercel.app"
CRON_SECRET="0S0WkQvmLDYpkxDFrE1N7Q5JHl15bwCfb9g/Tpf19gA="

echo "🔍 Test 1: Vérification de l'API de cache (nouvelles générales)"
echo "URL: $BASE_URL/api/news/cached?type=general&limit=5"
echo ""

response1=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/news/cached?type=general&limit=5")
http_code1=$(echo "$response1" | tail -n1)
body1=$(echo "$response1" | head -n -1)

echo "Status HTTP: $http_code1"
if [ "$http_code1" = "200" ]; then
    echo "✅ API de cache accessible"
    echo "Réponse:"
    echo "$body1" | jq '.' 2>/dev/null || echo "$body1"
else
    echo "❌ Erreur API de cache: $http_code1"
    echo "Réponse: $body1"
fi

echo ""
echo "🔍 Test 2: Vérification de l'API de cache (nouvelles par symbole)"
echo "URL: $BASE_URL/api/news/cached?type=symbol&symbol=AAPL&limit=5"
echo ""

response2=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/news/cached?type=symbol&symbol=AAPL&limit=5")
http_code2=$(echo "$response2" | tail -n1)
body2=$(echo "$response2" | head -n -1)

echo "Status HTTP: $http_code2"
if [ "$http_code2" = "200" ]; then
    echo "✅ API de cache symbol accessible"
    echo "Réponse:"
    echo "$body2" | jq '.' 2>/dev/null || echo "$body2"
else
    echo "❌ Erreur API de cache symbol: $http_code2"
    echo "Réponse: $body2"
fi

echo ""
echo "🔍 Test 3: Test du cron job (refresh des nouvelles)"
echo "URL: $BASE_URL/api/cron/refresh-news"
echo ""

response3=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cron/refresh-news" \
  -H "Authorization: Bearer $CRON_SECRET")
http_code3=$(echo "$response3" | tail -n1)
body3=$(echo "$response3" | head -n -1)

echo "Status HTTP: $http_code3"
if [ "$http_code3" = "200" ]; then
    echo "✅ Cron job fonctionnel"
    echo "Réponse:"
    echo "$body3" | jq '.' 2>/dev/null || echo "$body3"
elif [ "$http_code3" = "401" ]; then
    echo "⚠️ Cron job accessible mais CRON_SECRET non configuré"
    echo "Configurez la variable d'environnement CRON_SECRET dans Vercel"
else
    echo "❌ Erreur cron job: $http_code3"
    echo "Réponse: $body3"
fi

echo ""
echo "🔍 Test 4: Vérification du frontend"
echo "URL: $BASE_URL/"
echo ""

response4=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
http_code4=$(echo "$response4" | tail -n1)

echo "Status HTTP: $http_code4"
if [ "$http_code4" = "200" ]; then
    echo "✅ Frontend accessible"
else
    echo "❌ Erreur frontend: $http_code4"
fi

echo ""
echo "📊 Résumé des tests:"
echo "==================="
echo "API Cache Général: $([ "$http_code1" = "200" ] && echo "✅ OK" || echo "❌ ERREUR")"
echo "API Cache Symbol:  $([ "$http_code2" = "200" ] && echo "✅ OK" || echo "❌ ERREUR")"
echo "Cron Job:          $([ "$http_code3" = "200" ] && echo "✅ OK" || echo "❌ ERREUR")"
echo "Frontend:          $([ "$http_code4" = "200" ] && echo "✅ OK" || echo "❌ ERREUR")"

echo ""
echo "💡 Prochaines étapes:"
echo "1. Si des erreurs 404: Attendre le déploiement Vercel (2-3 minutes)"
echo "2. Si erreur 401 sur cron: Configurer CRON_SECRET dans Vercel"
echo "3. Si erreurs 500: Vérifier les variables d'environnement Supabase"
echo "4. Exécuter le script SQL dans Supabase Dashboard"
