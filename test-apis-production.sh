#!/bin/bash

# 🧪 Script de Test Automatique des APIs - GOB Dashboard
# Usage: ./test-apis-production.sh

set -e

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL de base
BASE_URL="https://gob-apps.vercel.app"

# Compteurs
PASSED=0
FAILED=0
TOTAL=0

# Fonction de test
test_api() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="${4:-}"
    
    TOTAL=$((TOTAL + 1))
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🧪 TEST $TOTAL: $name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "URL: $url"
    echo "Method: $method"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    fi
    
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    echo "Status Code: $status_code"
    echo "Response preview:"
    echo "$body" | head -20
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    elif [ "$status_code" = "503" ]; then
        echo -e "${YELLOW}⚠️  WARNING - API Key may be missing${NC}"
        FAILED=$((FAILED + 1))
        return 1
    else
        echo -e "${RED}❌ FAILED - Status: $status_code${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Banner
echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🔍 AUDIT COMPLET DES APIs - GOB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo "Date: $(date)"
echo "Base URL: $BASE_URL"
echo ""

# Vérifier que le site est accessible
echo -e "${BLUE}🔍 Vérification de l'accessibilité du site...${NC}"
if curl -s --head "$BASE_URL" | head -n1 | grep "HTTP" > /dev/null; then
    echo -e "${GREEN}✅ Site accessible${NC}"
else
    echo -e "${RED}❌ Site inaccessible - arrêt des tests${NC}"
    exit 1
fi

# ================================
# TESTS DES APIs
# ================================

# Test 1: Gemini API (Emma IA)
test_api "Gemini API - Emma IA" \
    "$BASE_URL/api/gemini/chat" \
    "POST" \
    '{"messages":[{"role":"user","content":"Bonjour Emma, réponds juste bonjour"}]}'

# Test 2: Gemini Key Check
test_api "Gemini Key Validation" \
    "$BASE_URL/api/gemini-key" \
    "GET"

# Test 3: FMP - Quote
test_api "FMP API - Quote AAPL" \
    "$BASE_URL/api/fmp?endpoint=quote&symbol=AAPL" \
    "GET"

# Test 4: FMP - Profile
test_api "FMP API - Profile AAPL" \
    "$BASE_URL/api/fmp?endpoint=profile&symbol=AAPL" \
    "GET"

# Test 5: FMP - Ratios
test_api "FMP API - Financial Ratios" \
    "$BASE_URL/api/fmp?endpoint=ratios&symbol=AAPL" \
    "GET"

# Test 6: Market Data (Finnhub/Alpha Vantage/Twelve Data)
test_api "Market Data API - AAPL" \
    "$BASE_URL/api/marketdata?symbol=AAPL" \
    "GET"

# Test 7: News API
test_api "News API - Finance News" \
    "$BASE_URL/api/news?q=finance&limit=5" \
    "GET"

# Test 8: MarketAux
test_api "MarketAux API - Latest News" \
    "$BASE_URL/api/marketaux" \
    "GET"

# Test 9: Status API
test_api "Status Check API" \
    "$BASE_URL/api/status" \
    "GET"

# Test 10: Claude (si configuré)
test_api "Claude API (optionnel)" \
    "$BASE_URL/api/claude" \
    "POST" \
    '{"message":"Hello, respond with just hi"}'

# ================================
# RÉSUMÉ
# ================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 RÉSUMÉ DES TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Total des tests: $TOTAL"
echo -e "${GREEN}Tests réussis: $PASSED${NC}"
echo -e "${RED}Tests échoués: $FAILED${NC}"
echo ""

# Calcul du taux de réussite
success_rate=$((PASSED * 100 / TOTAL))
echo -e "Taux de réussite: ${success_rate}%"

# Verdict final
echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ TOUS LES TESTS SONT PASSÉS !${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
elif [ $success_rate -ge 70 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  QUELQUES APIs NÉCESSITENT ATTENTION${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Actions recommandées:"
    echo "1. Vérifier les clés API dans Vercel"
    echo "2. Consulter AUDIT_APIs.md pour les détails"
    echo "3. Redéployer si nécessaire"
    exit 1
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ ÉCHEC CRITIQUE - PLUSIEURS APIs HORS SERVICE${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Actions urgentes:"
    echo "1. Vérifier TOUTES les clés API dans Vercel"
    echo "2. Consulter AUDIT_APIs.md"
    echo "3. Vérifier les logs Vercel"
    echo "4. Redéployer l'application"
    exit 2
fi

