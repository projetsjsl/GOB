#!/bin/bash

# ============================================================================
# SCRIPT DE TEST - CONNEXION SUPABASE
# ============================================================================

echo "🔍 Test de connexion Supabase..."
echo "=================================="

# Test 1: Endpoint de test Supabase (via health-check-simple)
echo "📋 Test 1: Test Supabase via Health Check"
echo "----------------------------------------"
curl -s "https://gobapps.com/api/health-check-simple" | jq '{
  status: .status,
  message: .message,
  apis: .apis | map(select(.name == "Supabase Connection"))
}' 2>/dev/null || echo "❌ Erreur lors du test Supabase"

echo ""

# Test 2: API Watchlist Supabase
echo "📋 Test 2: API Watchlist Supabase"
echo "---------------------------------"
curl -s "https://gobapps.com/api/supabase-watchlist" | jq '{
  success: .success,
  source: .source,
  message: .message,
  tickers: .tickers
}' 2>/dev/null || echo "❌ Erreur lors du test Watchlist"

echo ""

# Test 3: Vérification des variables d'environnement
echo "📋 Test 3: Variables d'environnement"
echo "------------------------------------"
echo "Variables requises :"
echo "- SUPABASE_URL"
echo "- SUPABASE_ANON_KEY" 
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "🔧 Pour configurer :"
echo "1. Aller dans Vercel → Settings → Environment Variables"
echo "2. Ajouter les 3 variables Supabase"
echo "3. Redéployer l'application"
echo "4. Relancer ce test"
echo "   - Test Supabase maintenant via health-check-simple"

echo ""
echo "✅ Test terminé !"
