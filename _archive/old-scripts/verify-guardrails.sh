#!/bin/bash

# ============================================================================
# SCRIPT DE VÉRIFICATION DES GUARDRAILS - EMMA EN DIRECT
# ============================================================================

echo "🛡️ VÉRIFICATION DES GUARDRAILS SYSTÈME"
echo "======================================"
echo ""

# Variables
BASE_URL="https://gobapps.com"
ERRORS=0

# Fonction pour vérifier un endpoint
check_endpoint() {
    local endpoint=$1
    local name=$2
    local expected_field=$3
    local expected_value=$4
    
    echo "🔍 Test: $name"
    echo "   Endpoint: $endpoint"
    
    response=$(curl -s "$BASE_URL$endpoint" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        if [ -n "$expected_field" ] && [ -n "$expected_value" ]; then
            actual_value=$(echo "$response" | jq -r ".$expected_field" 2>/dev/null)
            if [ "$actual_value" = "$expected_value" ]; then
                echo "   ✅ Status: OK ($expected_field = $expected_value)"
            else
                echo "   ❌ Status: ERROR ($expected_field = $actual_value, expected $expected_value)"
                ((ERRORS++))
            fi
        else
            echo "   ✅ Status: OK (endpoint répond)"
        fi
    else
        echo "   ❌ Status: ERROR (endpoint ne répond pas)"
        ((ERRORS++))
    fi
    echo ""
}

# Test 1: Supabase Watchlist (CRITIQUE)
check_endpoint "/api/supabase-watchlist" "Supabase Watchlist" "source" "supabase"

# Test 2: AI Services
check_endpoint "/api/ai-services" "AI Services" "status" "healthy"

# Test 3: Gemini Chat
check_endpoint "/api/test-gemini" "Gemini Chat" "status" "healthy"

# Test 4: Health Check
check_endpoint "/api/health-check-simple" "Health Check" "status" "healthy"

# Test 5: Market Data
check_endpoint "/api/marketdata" "Market Data" "status" "healthy"

# Test 6: Dashboard principal
echo "🔍 Test: Dashboard Principal"
echo "   URL: $BASE_URL/beta-combined-dashboard.html"
dashboard_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/beta-combined-dashboard.html" 2>/dev/null)
if [ "$dashboard_response" = "200" ]; then
    echo "   ✅ Status: OK (dashboard accessible)"
else
    echo "   ❌ Status: ERROR (HTTP $dashboard_response)"
    ((ERRORS++))
fi
echo ""

# Vérification des fichiers critiques
echo "🔍 Vérification des fichiers critiques"
echo "======================================"

critical_files=(
    "api/supabase-watchlist.js"
    "api/ai-services.js"
    "api/gemini/chat.js"
    "api/gemini/chat-validated.js"
    "api/gemini/tools.js"
    "vercel.json"
    "public/beta-combined-dashboard.html"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file - Présent"
    else
        echo "   ❌ $file - MANQUANT"
        ((ERRORS++))
    fi
done
echo ""

# Vérification du nombre de fonctions serverless
echo "🔍 Vérification des fonctions serverless"
echo "========================================"
function_count=$(grep -c '"api/' vercel.json 2>/dev/null || echo "0")
if [ "$function_count" -le 12 ]; then
    echo "   ✅ Fonctions serverless: $function_count/12 (limite respectée)"
else
    echo "   ❌ Fonctions serverless: $function_count/12 (LIMITE DÉPASSÉE)"
    ((ERRORS++))
fi
echo ""

# Résumé final
echo "📊 RÉSUMÉ DE LA VÉRIFICATION"
echo "============================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ TOUS LES GUARDRAILS SONT RESPECTÉS"
    echo "✅ SYSTÈME 100% OPÉRATIONNEL"
    echo "✅ AUCUNE MODIFICATION CRITIQUE DÉTECTÉE"
    echo ""
    echo "🛡️ Le système est protégé et stable !"
    exit 0
else
    echo "❌ $ERRORS ERREUR(S) DÉTECTÉE(S)"
    echo "❌ GUARDRAILS COMPROMIS"
    echo "❌ MODIFICATION CRITIQUE DÉTECTÉE"
    echo ""
    echo "🚨 ACTIONS REQUISES :"
    echo "1. Vérifier les erreurs ci-dessus"
    echo "2. Consulter GUARDRAILS-SYSTEME-PRODUCTION.md"
    echo "3. Effectuer un rollback si nécessaire"
    echo "4. Contacter l'équipe de support"
    exit 1
fi
