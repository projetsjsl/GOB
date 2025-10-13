#!/bin/bash

# Script de monitoring du déploiement Vercel
echo "📊 Monitoring du déploiement Vercel"
echo "==================================="
echo ""

BASE_URL="https://gob.vercel.app"

# Fonction pour tester un endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "🔍 Test $name: "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" = "$expected_status" ]; then
        echo "✅ OK ($status)"
        return 0
    else
        echo "❌ ERREUR ($status, attendu: $expected_status)"
        return 1
    fi
}

# Test initial
echo "📋 Test initial (déploiement en cours)..."
echo ""

test_endpoint "Frontend" "$BASE_URL/" "200"
test_endpoint "API Gemini" "$BASE_URL/api/gemini/chat" "405"
test_endpoint "API Cache" "$BASE_URL/api/news/cached?type=general&limit=5" "200"
test_endpoint "Cron Job" "$BASE_URL/api/cron/refresh-news" "401"

echo ""
echo "⏰ Monitoring en continu..."
echo "   Appuyez sur Ctrl+C pour arrêter"
echo ""

# Monitoring en continu
counter=0
while true; do
    counter=$((counter + 1))
    echo ""
    echo "🔄 Test #$counter - $(date '+%H:%M:%S')"
    echo "================================"
    
    # Test rapide des endpoints critiques
    frontend_ok=false
    gemini_ok=false
    cache_ok=false
    cron_ok=false
    
    if test_endpoint "Frontend" "$BASE_URL/" "200"; then
        frontend_ok=true
    fi
    
    if test_endpoint "API Gemini" "$BASE_URL/api/gemini/chat" "405"; then
        gemini_ok=true
    fi
    
    if test_endpoint "API Cache" "$BASE_URL/api/news/cached?type=general&limit=5" "200"; then
        cache_ok=true
    fi
    
    if test_endpoint "Cron Job" "$BASE_URL/api/cron/refresh-news" "401"; then
        cron_ok=true
    fi
    
    # Vérifier si tout est OK
    if [ "$frontend_ok" = true ] && [ "$gemini_ok" = true ] && [ "$cache_ok" = true ] && [ "$cron_ok" = true ]; then
        echo ""
        echo "🎉 SUCCÈS! Toutes les APIs sont déployées et fonctionnelles!"
        echo ""
        echo "✅ Prochaines étapes:"
        echo "   1. Tester le système de cache complet: ./test-cache-system.sh"
        echo "   2. Vérifier que les nouvelles se chargent dans le dashboard"
        echo "   3. Valider les performances"
        echo ""
        break
    fi
    
    echo ""
    echo "⏳ Attente de 30 secondes avant le prochain test..."
    sleep 30
done
