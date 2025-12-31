#!/bin/bash

# GOB Dashboard - Automated API Testing Script
# Tests all critical API endpoints and generates a report

set -e  # Exit on error

# Configuration
BASE_URL=${1:-"https://gobapps.com"}
RESULTS_FILE="api-test-results-$(date +%Y%m%d-%H%M%S).json"
TIMEOUT=10  # Default timeout for curl

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 GOB Dashboard API Testing"
echo "======================================"
echo "Base URL: $BASE_URL"
echo "Results file: $RESULTS_FILE"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Initialize results JSON
cat > $RESULTS_FILE <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "base_url": "$BASE_URL",
  "tests": [
EOF

# Test counters
total=0
passed=0
failed=0
skipped=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local expected_status=${4:-200}
    local body=${5:-""}

    total=$((total + 1))
    printf "%-50s ... " "$name"

    # Build curl command
    if [ -n "$body" ]; then
        http_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -X $method \
            -H "Content-Type: application/json" \
            -d "$body" \
            --max-time $TIMEOUT \
            "$url" 2>&1 || echo "000")
    else
        http_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -X $method \
            --max-time $TIMEOUT \
            "$url" 2>&1 || echo "000")
    fi

    # Check if curl command failed
    if [ "$http_code" = "000" ]; then
        echo -e "${RED}❌ FAIL (timeout or connection error)${NC}"
        failed=$((failed + 1))
        result="FAIL"
        error="Connection timeout or network error"
    else
        local status_ok=0
        local expected_statuses=(${expected_status//,/ })
        for expected in "${expected_statuses[@]}"; do
            if [ "$http_code" -eq "$expected" ]; then
                status_ok=1
                break
            fi
        done
        if [ "$status_ok" -eq 1 ]; then
            echo -e "${GREEN}✅ PASS${NC} ($http_code)"
            passed=$((passed + 1))
            result="PASS"
            error=""
        else
            echo -e "${RED}❌ FAIL${NC} (got $http_code, expected $expected_status)"
            failed=$((failed + 1))
            result="FAIL"
            error="Unexpected status code"
        fi
    fi

    # Add to JSON results
    cat >> $RESULTS_FILE <<EOF
    {
      "name": "$name",
      "url": "$url",
      "method": "$method",
      "expected_status": $expected_status,
      "actual_status": $http_code,
      "result": "$result",
      "error": "$error"
    },
EOF
}

echo ""
echo "=== Market Data APIs ==="
test_endpoint "FMP - Quote AAPL" "$BASE_URL/api/fmp?endpoint=quote&symbol=AAPL"
test_endpoint "FMP - Profile AAPL" "$BASE_URL/api/fmp?endpoint=profile&symbol=AAPL"
test_endpoint "Market Data Batch" "$BASE_URL/api/marketdata/batch?symbols=AAPL,GOOGL,MSFT"
test_endpoint "Finnhub" "$BASE_URL/api/finnhub?symbol=AAPL"
test_endpoint "FMP Search" "$BASE_URL/api/fmp-search?query=Apple"

echo ""
echo "=== Calendar APIs ==="
test_endpoint "Calendar Earnings" "$BASE_URL/api/calendar-earnings"
test_endpoint "Calendar Dividends" "$BASE_URL/api/calendar-dividends"

echo ""
echo "=== News APIs ==="
test_endpoint "News - General" "$BASE_URL/api/news?limit=5"
test_endpoint "News - AAPL" "$BASE_URL/api/news?query=AAPL&limit=5"
test_endpoint "Finviz News" "$BASE_URL/api/finviz-news"
test_endpoint "Finviz Why Moving" "$BASE_URL/api/finviz-why-moving?ticker=AAPL"

echo ""
echo "=== Supabase APIs ==="
test_endpoint "Supabase Watchlist - List" "$BASE_URL/api/supabase-watchlist?action=list"
test_endpoint "Team Tickers" "$BASE_URL/api/team-tickers"

echo ""
echo "=== Screener APIs ==="
test_endpoint "FMP Stock Screener" "$BASE_URL/api/fmp-stock-screener?limit=10" GET "200,401,402,403,429"

echo ""
echo "=== Treasury & Rates ==="
test_endpoint "Treasury Rates" "$BASE_URL/api/treasury-rates"
test_endpoint "Yield Curve" "$BASE_URL/api/yield-curve"

echo ""
echo "=== Configuration APIs ==="
test_endpoint "Gemini Key Status" "$BASE_URL/api/gemini-key"
test_endpoint "LLM Models" "$BASE_URL/api/llm-models"
test_endpoint "Tickers Config" "$BASE_URL/api/tickers-config"

echo ""
echo "=== Briefing APIs ==="
# Note: These might be slow, increase timeout
TIMEOUT=30
test_endpoint "Briefing - Morning" "$BASE_URL/api/briefing?type=morning"
TIMEOUT=10

echo ""
echo "=== Finance APIs ==="
test_endpoint "Finance Snapshots" "$BASE_URL/api/finance-snapshots?all=true&limit=1"
test_endpoint "FMP Company Data" "$BASE_URL/api/fmp-company-data?symbol=AAPL"

# Finalize JSON
success_rate=$(node -e "const total=$total; const passed=$passed; const rate= total ? (passed/total*100).toFixed(2) : '0.00'; process.stdout.write(rate);")

cat >> $RESULTS_FILE <<EOF
    {
      "name": "END_OF_TESTS",
      "result": "SUMMARY"
    }
  ],
  "summary": {
    "total": $total,
    "passed": $passed,
    "failed": $failed,
    "skipped": $skipped,
    "success_rate": $success_rate
  }
}
EOF

# Summary
echo ""
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
passed_rate=$(node -e "const total=$total; const passed=$passed; const rate= total ? (passed/total*100).toFixed(1) : '0.0'; process.stdout.write(rate);")
failed_rate=$(node -e "const total=$total; const failed=$failed; const rate= total ? (failed/total*100).toFixed(1) : '0.0'; process.stdout.write(rate);")
echo -e "Total tests:   ${total}"
echo -e "Passed:        ${GREEN}${passed}${NC} (${passed_rate}%)"
echo -e "Failed:        ${RED}${failed}${NC} (${failed_rate}%)"
echo -e "Skipped:       ${YELLOW}${skipped}${NC}"
echo ""
echo "Full results saved to: $RESULTS_FILE"
echo ""

# Recommendations based on results
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo "The API is functioning correctly."
elif [ $failed -le 3 ]; then
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    echo "Check the failed endpoints in the results file."
    echo "This might be due to:"
    echo "  - Missing API keys"
    echo "  - Network issues"
    echo "  - Rate limiting"
else
    echo -e "${RED}❌ Multiple tests failed${NC}"
    echo "There might be a systemic issue:"
    echo "  - Deployment not completed"
    echo "  - Vercel configuration issue"
    echo "  - Network/firewall blocking access"
fi

echo ""
echo "Next steps:"
echo "  1. Review $RESULTS_FILE for details"
echo "  2. Check Vercel logs for errors"
echo "  3. Verify environment variables are set"
echo ""

# Exit with error code if any test failed
if [ $failed -gt 0 ]; then
    exit 1
fi

exit 0
