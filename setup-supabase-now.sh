#!/bin/bash

# ============================================================================
# SCRIPT DE CONFIGURATION SUPABASE - CONFIGURATION IMMÉDIATE
# ============================================================================

echo "🚀 CONFIGURATION SUPABASE - EMMA EN DIRECT"
echo "=========================================="
echo ""

# Test actuel
echo "📋 Test actuel de l'API Watchlist :"
echo "-----------------------------------"
curl -s "https://gobapps.com/api/supabase-watchlist" | jq '{
  success: .success,
  source: .source,
  message: .message,
  tickers: .tickers
}' 2>/dev/null || echo "❌ Erreur lors du test"

echo ""
echo "🔍 Statut actuel :"
echo "- Source: fallback (❌ Supabase non connecté)"
echo "- Tickers: Données temporaires"
echo "- Persistance: Aucune"
echo ""

echo "🔧 CONFIGURATION REQUISE :"
echo "=========================="
echo ""
echo "1. 📱 Aller dans votre projet Supabase 'gob-watchlist'"
echo "   - Settings → API"
echo "   - Copier Project URL, anon public, service_role"
echo ""
echo "2. 🌐 Aller dans Vercel Dashboard"
echo "   - Votre projet 'gob'"
echo "   - Settings → Environment Variables"
echo "   - Ajouter ces 3 variables :"
echo ""
echo "   SUPABASE_URL = https://[votre-project-id].supabase.co"
echo "   SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo "   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""
echo "3. 🚀 Redéployer l'application"
echo "   - Save les variables"
echo "   - Redéployer"
echo ""
echo "4. ✅ Tester la connexion"
echo "   - Relancer ce script"
echo "   - Vérifier que source = 'supabase'"
echo ""

echo "🎯 RÉSULTAT ATTENDU APRÈS CONFIGURATION :"
echo "=========================================="
echo ""
echo "✅ Test Supabase réussi :"
echo '{
  "success": true,
  "source": "supabase",
  "tickers": ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
}'
echo ""
echo "✅ Bénéfices immédiats :"
echo "- Watchlist persistante"
echo "- Briefings stockés"
echo "- Cache des actualités"
echo "- Données de marché réelles"
echo "- Performance optimale"
echo ""

echo "⏱️  TEMPS ESTIMÉ : 5-8 minutes"
echo "🎉 RÉSULTAT : Système 100% opérationnel"
echo ""
echo "📞 Support : Contactez-moi si vous avez des difficultés"
echo ""
echo "✅ Script terminé !"
