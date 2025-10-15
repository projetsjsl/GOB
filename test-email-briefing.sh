#!/bin/bash

# ============================================================================
# SCRIPT DE TEST EMAIL BRIEFING - EMMA EN DIRECT
# ============================================================================

echo "📧 TEST EMAIL BRIEFING EMMA EN DIRECT"
echo "====================================="
echo ""

# Variables
BASE_URL="https://gobapps.com"
USER_EMAIL=""

# Demander l'email si pas fourni en paramètre
if [ -z "$1" ]; then
    read -p "Entrez votre adresse email pour le test : " USER_EMAIL
else
    USER_EMAIL="$1"
fi

if [ -z "$USER_EMAIL" ]; then
    echo "❌ Adresse email requise"
    exit 1
fi

echo "📧 Test avec l'email : $USER_EMAIL"
echo ""

# Test 1: Génération de briefing matinal
echo "🔍 Test 1: Génération Briefing Matinal"
echo "======================================"

briefing_response=$(curl -s -X POST "$BASE_URL/api/ai-services" \
  -H "Content-Type: application/json" \
  -d "{
    \"service\": \"openai\",
    \"prompt\": \"Génère un briefing matinal Emma En Direct pour $USER_EMAIL. Inclus les données de marché, actualités, et analyse technique.\",
    \"marketData\": {
      \"timestamp\": \"$(date)\",
      \"source\": \"test\"
    },
    \"news\": \"Actualités de test pour le briefing matinal\"
  }" 2>/dev/null)

if echo "$briefing_response" | jq -e '.success' > /dev/null 2>&1; then
    echo "   ✅ Briefing généré avec succès"
    briefing_content=$(echo "$briefing_response" | jq -r '.content' 2>/dev/null)
    echo "   📊 Longueur du contenu : ${#briefing_content} caractères"
else
    echo "   ❌ Erreur lors de la génération du briefing"
    echo "   📋 Réponse : $briefing_response"
fi

echo ""

# Test 2: Envoi d'email de test
echo "🔍 Test 2: Envoi Email de Test"
echo "=============================="

email_response=$(curl -s -X POST "$BASE_URL/api/ai-services" \
  -H "Content-Type: application/json" \
  -d "{
    \"service\": \"resend\",
    \"to\": \"$USER_EMAIL\",
    \"subject\": \"Emma En Direct - Test Briefing Matinal\",
    \"html\": \"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'><h1 style='color: #2563eb; text-align: center;'>🌅 Emma En Direct</h1><h2 style='color: #1f2937;'>Briefing Matinal - Test</h2><p style='color: #4b5563;'>Bonjour,</p><p style='color: #4b5563;'>Ceci est un test de votre configuration email pour Emma En Direct.</p><div style='background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;'><h3 style='color: #1f2937; margin-top: 0;'>📊 Données de Test</h3><ul style='color: #4b5563;'><li>✅ Système opérationnel</li><li>✅ Email configuré</li><li>✅ Briefing généré</li><li>✅ Envoi réussi</li></ul></div><div style='background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;'><h3 style='color: #1e40af; margin-top: 0;'>📅 Horaires de Réception</h3><ul style='color: #1e40af;'><li>🌅 Matin : 8h00 EST (Lundi-Vendredi)</li><li>☀️ Midi : 12h00 EST (Lundi-Vendredi)</li><li>🌆 Clôture : 16h30 EST (Lundi-Vendredi)</li></ul></div><p style='color: #4b5563; font-size: 14px;'>Emma En Direct - Système de Briefing Financier Automatisé</p><p style='color: #9ca3af; font-size: 12px;'>Test effectué le $(date)</p></div>\"
  }" 2>/dev/null)

if echo "$email_response" | jq -e '.success' > /dev/null 2>&1; then
    echo "   ✅ Email envoyé avec succès !"
    echo "   📧 Vérifiez votre boîte de réception (et le dossier spam)"
else
    echo "   ❌ Erreur lors de l'envoi de l'email"
    echo "   📋 Réponse : $email_response"
    echo ""
    echo "🔧 Vérifiez que :"
    echo "   - RESEND_API_KEY est configurée dans Vercel"
    echo "   - RESEND_FROM_EMAIL est configurée dans Vercel"
    echo "   - Votre adresse email est valide"
fi

echo ""

# Test 3: Test complet du système Briefing Cron
echo "🔍 Test 3: Système Briefing Cron"
echo "================================"

# Générer un secret de test
TEST_SECRET=$(openssl rand -hex 8)

cron_response=$(curl -s -X POST "$BASE_URL/api/briefing-cron" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"morning\",
    \"secret\": \"$TEST_SECRET\",
    \"test_email\": \"$USER_EMAIL\"
  }" 2>/dev/null)

if echo "$cron_response" | jq -e '.success' > /dev/null 2>&1; then
    echo "   ✅ Système Briefing Cron opérationnel"
    logs_count=$(echo "$cron_response" | jq -r '.logs | length' 2>/dev/null)
    echo "   📊 Logs générés : $logs_count"
else
    echo "   ⚠️ Système Briefing Cron nécessite configuration"
    echo "   📋 Réponse : $cron_response"
    echo ""
    echo "🔧 Pour activer l'automatisation :"
    echo "   1. Configurer CRON_SECRET dans Vercel"
    echo "   2. Configurer RESEND_TO_EMAIL dans Vercel"
    echo "   3. Exécuter le script Supabase"
fi

echo ""

# Résumé final
echo "📊 RÉSUMÉ DU TEST"
echo "================="
echo ""

# Vérifier les résultats
briefing_ok=$(echo "$briefing_response" | jq -e '.success' > /dev/null 2>&1 && echo "✅" || echo "❌")
email_ok=$(echo "$email_response" | jq -e '.success' > /dev/null 2>&1 && echo "✅" || echo "❌")
cron_ok=$(echo "$cron_response" | jq -e '.success' > /dev/null 2>&1 && echo "✅" || echo "⚠️")

echo "📋 Résultats des tests :"
echo "   $briefing_ok Génération de briefing"
echo "   $email_ok Envoi d'email"
echo "   $cron_ok Système d'automatisation"
echo ""

if [ "$briefing_ok" = "✅" ] && [ "$email_ok" = "✅" ]; then
    echo "🎉 SYSTÈME EMAIL OPÉRATIONNEL !"
    echo ""
    echo "✅ Votre email est configuré et fonctionnel"
    echo "✅ Les briefings peuvent être générés et envoyés"
    echo "✅ Votre routine email du matin sera active"
    echo ""
    echo "📅 Prochaines étapes :"
    echo "   1. Configurer l'automatisation Supabase"
    echo "   2. Vérifier les horaires de réception"
    echo "   3. Surveiller les premiers envois automatiques"
    echo ""
    echo "🛡️ Système protégé par des guardrails"
    echo "📧 Email configuré : $USER_EMAIL"
else
    echo "⚠️ CONFIGURATION REQUISE"
    echo ""
    echo "❌ Certains tests ont échoué"
    echo "🔧 Vérifiez la configuration Vercel"
    echo "📞 Consultez la documentation de configuration"
fi

echo ""
echo "✅ Test terminé !"
