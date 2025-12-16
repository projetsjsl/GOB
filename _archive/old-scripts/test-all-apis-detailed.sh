#!/bin/bash

# ============================================================================
# SCRIPT DE TEST DÉTAILLÉ - TOUTES LES APIs
# ============================================================================
# Ce script teste toutes les APIs en détail pour identifier les problèmes
# ============================================================================

echo "🔍 TEST DÉTAILLÉ DE TOUTES LES APIs - Emma En Direct"
echo "====================================================="
echo ""

BASE_URL="https://gobapps.com"

# Test 1: Variables d'environnement
echo "1️⃣  Variables d'environnement..."
curl -s -X GET "$BASE_URL/api/ai-services" | jq -r '.debug | "OpenAI: \(.openai_key), Anthropic: \(.anthropic_key), Perplexity: \(.perplexity_key)"'
echo ""

# Test 2: APIs principales
echo "2️⃣  APIs principales..."

echo "   🤖 AI Services..."
curl -s -X POST "$BASE_URL/api/ai-services" \
  -H "Content-Type: application/json" \
  -d '{"service": "openai", "prompt": "Test", "marketData": {}, "news": "Test"}' \
  | jq -r '"Modèle: \(.model), Fallback: \(.fallback), Longueur: \(.content | length)"'

echo "   📊 Market Data (Yahoo Finance)..."
curl -s "$BASE_URL/api/marketdata?endpoint=quote&symbol=AAPL&source=yahoo" \
  | jq -r '"Erreur: \(.error // "Aucune"), Prix: \(.c // "N/A")"'

echo "   🗄️  Supabase Watchlist..."
curl -s "$BASE_URL/api/supabase-watchlist" \
  | jq -r '"Succès: \(.success), Tickers: \(.count), Source: \(.source)"'

echo "   📧 Resend Email..."
curl -s -X POST "$BASE_URL/api/ai-services" \
  -H "Content-Type: application/json" \
  -d '{"service": "resend", "to": ["test@example.com"], "subject": "Test", "html": "<p>Test</p>"}' \
  | jq -r '"Succès: \(.success), Erreur: \(.error // "Aucune")"'

echo ""

# Test 3: APIs externes (via Market Data)
echo "3️⃣  APIs externes via Market Data..."

echo "   📈 Yahoo Finance..."
curl -s "$BASE_URL/api/marketdata?endpoint=quote&symbol=AAPL&source=yahoo" \
  | jq -r '"Source: \(.source // "Erreur"), Prix: \(.c // "N/A")"'

echo "   🏦 Financial Modeling Prep..."
curl -s "$BASE_URL/api/marketdata?endpoint=quote&symbol=AAPL&source=fmp" \
  | jq -r '"Source: \(.source // "Erreur"), Prix: \(.c // "N/A")"'

echo "   📊 Alpha Vantage..."
curl -s "$BASE_URL/api/marketdata?endpoint=quote&symbol=AAPL&source=alpha" \
  | jq -r '"Source: \(.source // "Erreur"), Prix: \(.c // "N/A")"'

echo "   🔢 Twelve Data..."
curl -s "$BASE_URL/api/marketdata?endpoint=quote&symbol=AAPL&source=twelve" \
  | jq -r '"Source: \(.source // "Erreur"), Prix: \(.c // "N/A")"'

echo "   🦌 Finnhub..."
curl -s "$BASE_URL/api/marketdata?endpoint=quote&symbol=AAPL&source=finnhub" \
  | jq -r '"Source: \(.source // "Erreur"), Prix: \(.c // "N/A")"'

echo ""

# Test 4: APIs Gemini
echo "4️⃣  APIs Gemini..."

echo "   💬 Gemini Chat Simple..."
curl -s -X POST "$BASE_URL/api/gemini/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test"}]}' \
  | jq -r '"Source: \(.source), Longueur: \(.response | length)"'

echo "   ✅ Gemini Chat Validé..."
curl -s -X POST "$BASE_URL/api/gemini/chat-validated" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test"}], "useValidatedMode": true}' \
  | jq -r '"Succès: \(.success), Modèle: \(.model)"'

echo ""

# Test 5: APIs utilitaires
echo "5️⃣  APIs utilitaires..."

echo "   🔧 GitHub Update..."
curl -s "$BASE_URL/api/github-update" \
  | jq -r '"Statut: \(.error // "OK")"'

echo "   🧪 Test Gemini..."
curl -s "$BASE_URL/api/test-gemini" \
  | jq -r '"Statut: \(.status // "Erreur")"'

echo "   🔑 Gemini Key..."
curl -s "$BASE_URL/api/gemini-key" \
  | jq -r '"Statut: \(.status // "Erreur")"'

echo "   ⏰ Briefing Cron..."
curl -s "$BASE_URL/api/briefing-cron" \
  | jq -r '"Statut: \(.status // "Erreur")"'

echo ""

# Test 6: Diagnostic global
echo "6️⃣  Diagnostic global..."
curl -s "$BASE_URL/api/health-check-simple" \
  | jq -r '"Statut global: \(.health.overall_status), APIs saines: \(.health.healthy_apis)/\(.health.total_apis)"'

echo ""
echo "✅ Tests détaillés terminés !"
echo ""
echo "📊 RÉSUMÉ :"
echo "- APIs principales : Vérifiez les résultats ci-dessus"
echo "- APIs externes : Vérifiez les sources et prix"
echo "- APIs Gemini : Vérifiez les réponses"
echo "- APIs utilitaires : Vérifiez les statuts"
echo ""
echo "🔧 ACTIONS NÉCESSAIRES :"
echo "- Si erreurs 500 : Vérifier les clés API dans Vercel"
echo "- Si prix N/A : Vérifier les sources de données"
echo "- Si fallback : Vérifier la configuration des APIs"
