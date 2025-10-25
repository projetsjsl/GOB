#!/bin/bash

# Production API Testing Script
# Tests all critical endpoints on live Vercel deployment

BASE_URL="https://gob.vercel.app"

echo "========================================"
echo "GOB Production API Testing"
echo "========================================"
echo "Base URL: $BASE_URL"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

# Test function
test_api() {
    local name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="$4"

    test_count=$((test_count + 1))
    echo "Testing: $name"
    echo "Endpoint: $endpoint"

    if [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $http_code)"
        pass_count=$((pass_count + 1))
        # Show first 200 chars of response
        echo "$body" | head -c 200
        echo ""
    else
        echo -e "${RED}❌ FAIL${NC} (Status: $http_code)"
        fail_count=$((fail_count + 1))
        echo "$body" | head -c 300
        echo ""
    fi
    echo "----------------------------------------"
}

echo "========================================="
echo "1. CORE APIs"
echo "========================================="

test_api "FMP Health Check" "/api/fmp"
test_api "Market Data - AAPL Quote" "/api/marketdata?endpoint=quote&symbol=AAPL&source=auto"
test_api "Market Data Batch" "/api/marketdata/batch?symbols=AAPL,MSFT"

echo ""
echo "========================================="
echo "2. AI SERVICES"
echo "========================================="

test_api "Gemini Key" "/api/gemini-key"
test_api "Gemini Chat" "/api/gemini/chat" "POST" '{"message":"Hello","history":[]}'
test_api "Emma Briefing Morning" "/api/emma-briefing?type=morning"
test_api "AI Services Info" "/api/ai-services"

echo ""
echo "========================================="
echo "3. CALENDAR APIs"
echo "========================================="

test_api "Economic Calendar" "/api/calendar-economic"
test_api "Earnings Calendar" "/api/calendar-earnings"
test_api "Dividends Calendar" "/api/calendar-dividends"

echo ""
echo "========================================="
echo "4. DATABASE APIs"
echo "========================================="

test_api "Supabase Watchlist" "/api/supabase-watchlist?action=list"
test_api "Tickers Config" "/api/tickers-config"

echo ""
echo "========================================="
echo "5. UTILITY APIs"
echo "========================================="

test_api "Health Check Simple" "/api/health-check-simple"
test_api "Test Gemini" "/api/test-gemini"

echo ""
echo "========================================="
echo "SUMMARY"
echo "========================================="
echo "Total Tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"

if [ $fail_count -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All APIs are working!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some APIs failed. Check the output above.${NC}"
    exit 1
fi
