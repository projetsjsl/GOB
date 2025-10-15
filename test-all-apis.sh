#!/bin/bash

# ============================================================================
# SCRIPT DE TEST COMPLET - TOUTES LES APIs
# ============================================================================
# Ce script teste toutes les APIs pour identifier les modes demo/fallback
# ============================================================================

echo "🔍 TEST COMPLET DES APIs - Emma En Direct"
echo "=========================================="
echo ""

BASE_URL="https://gobapps.com/api/ai-services"

# Test 1: Variables d'environnement
echo "1️⃣  Test des variables d'environnement..."
curl -s -X GET "$BASE_URL" | jq -r '.debug | "OpenAI: \(.openai_key), Anthropic: \(.anthropic_key), Perplexity: \(.perplexity_key)"'
echo ""

# Test 2: OpenAI
echo "2️⃣  Test OpenAI..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"service": "openai", "prompt": "Test OpenAI", "marketData": {}, "news": "Test"}' \
  | jq -r '"Modèle: \(.model), Fallback: \(.fallback), Longueur: \(.content | length)"'
echo ""

# Test 3: Perplexity
echo "3️⃣  Test Perplexity..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"service": "perplexity", "prompt": "Test Perplexity", "recency": "day"}' \
  | jq -r '"Modèle: \(.model), Fallback: \(.fallback), Longueur: \(.content | length)"'
echo ""

# Test 4: Modules Expert Emma
echo "4️⃣  Test Modules Expert Emma..."

echo "   📊 Yield Curves..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"service": "yield-curves"}' \
  | jq -r '"Succès: \(.success), Données: \(.data != null)"'

echo "   💱 Forex Detailed..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"service": "forex-detailed"}' \
  | jq -r '"Succès: \(.success), Données: \(.data != null)"'

echo "   📈 Volatility Advanced..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"service": "volatility-advanced"}' \
  | jq -r '"Succès: \(.success), Données: \(.data != null)"'

echo "   🛢️  Commodities..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"service": "commodities"}' \
  | jq -r '"Succès: \(.success), Données: \(.data != null)"'

echo "   📰 Tickers News..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"service": "tickers-news", "tickers": ["AAPL", "GOOGL"], "watchlistTickers": ["TSLA"]}' \
  | jq -r '"Succès: \(.success), Tickers: \(.data.tickers_count)"'

echo ""
echo "✅ Tests terminés !"
echo ""
echo "🔧 ACTIONS NÉCESSAIRES :"
echo "- Si Perplexity = 'twelve-data' : Ajouter PERPLEXITY_API_KEY dans Vercel"
echo "- Si Perplexity = 'demo-mode' : Ajouter PERPLEXITY_API_KEY dans Vercel"
echo "- Si OpenAI = 'demo-mode' : Vérifier OPENAI_API_KEY dans Vercel"
echo "- Si Anthropic = 'demo-mode' : Vérifier ANTHROPIC_API_KEY dans Vercel"
