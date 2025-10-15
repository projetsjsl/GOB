#!/bin/bash

# ============================================================================
# SCRIPT DE CONFIGURATION EMAIL AUTOMATISATION - EMMA EN DIRECT
# ============================================================================

echo "📧 CONFIGURATION EMAIL AUTOMATISATION"
echo "====================================="
echo ""

# Variables
BASE_URL="https://gobapps.com"
EMAIL_CONFIGURED=false

echo "🔍 Vérification du système actuel..."
echo "===================================="

# Test 1: Vérifier que Supabase est connecté
echo "📋 Test 1: Connexion Supabase"
supabase_status=$(curl -s "$BASE_URL/api/supabase-watchlist" | jq -r '.source' 2>/dev/null)
if [ "$supabase_status" = "supabase" ]; then
    echo "   ✅ Supabase connecté"
else
    echo "   ❌ Supabase non connecté (source: $supabase_status)"
    echo "   🔧 Configurez d'abord Supabase avant de continuer"
    exit 1
fi

# Test 2: Vérifier l'API Briefing Cron
echo "📋 Test 2: API Briefing Cron"
cron_status=$(curl -s "$BASE_URL/api/briefing-cron" | jq -r '.status' 2>/dev/null)
if [ "$cron_status" = "healthy" ]; then
    echo "   ✅ API Briefing Cron opérationnelle"
else
    echo "   ❌ API Briefing Cron non disponible"
    exit 1
fi

# Test 3: Vérifier l'API AI Services
echo "📋 Test 3: API AI Services"
ai_status=$(curl -s "$BASE_URL/api/ai-services" | jq -r '.status' 2>/dev/null)
if [ "$ai_status" = "healthy" ]; then
    echo "   ✅ API AI Services opérationnelle"
else
    echo "   ❌ API AI Services non disponible"
    exit 1
fi

echo ""
echo "✅ Système prêt pour la configuration email !"
echo ""

# Demander l'email de l'utilisateur
echo "📧 CONFIGURATION DE VOTRE EMAIL"
echo "================================"
echo ""
echo "Pour recevoir vos briefings Emma En Direct automatiquement,"
echo "nous devons configurer votre adresse email."
echo ""

read -p "Entrez votre adresse email : " USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
    echo "❌ Adresse email requise"
    exit 1
fi

echo ""
echo "📋 Vérification de l'email : $USER_EMAIL"
echo ""

# Test d'envoi d'email
echo "📧 Test d'envoi d'email..."
test_response=$(curl -s -X POST "$BASE_URL/api/ai-services" \
  -H "Content-Type: application/json" \
  -d "{
    \"service\": \"resend\",
    \"to\": \"$USER_EMAIL\",
    \"subject\": \"Test Emma En Direct - Configuration\",
    \"html\": \"<h1>🎉 Test réussi !</h1><p>Votre email est configuré pour recevoir les briefings Emma En Direct.</p><p><strong>Horaires :</strong></p><ul><li>🌅 Matin : 8h00 EST (Lundi-Vendredi)</li><li>☀️ Midi : 12h00 EST (Lundi-Vendredi)</li><li>🌆 Clôture : 16h30 EST (Lundi-Vendredi)</li></ul><p>Emma En Direct</p>\"
  }" 2>/dev/null)

if echo "$test_response" | jq -e '.success' > /dev/null 2>&1; then
    echo "   ✅ Email de test envoyé avec succès !"
    EMAIL_CONFIGURED=true
else
    echo "   ❌ Erreur lors de l'envoi de l'email de test"
    echo "   📋 Réponse : $test_response"
    echo ""
    echo "🔧 Vérifiez que :"
    echo "   - RESEND_API_KEY est configurée dans Vercel"
    echo "   - RESEND_FROM_EMAIL est configurée dans Vercel"
    echo "   - Votre adresse email est valide"
fi

echo ""
echo "📋 CONFIGURATION SUPABASE"
echo "========================="
echo ""

# Générer le script SQL personnalisé
echo "🔧 Génération du script SQL personnalisé..."

cat > supabase-email-config.sql << EOF
-- ============================================================================
-- Configuration Email Automatisation - Emma En Direct
-- Email configuré : $USER_EMAIL
-- Date : $(date)
-- ============================================================================

-- Modifier les adresses email dans les fonctions
CREATE OR REPLACE FUNCTION send_morning_briefing()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
BEGIN
  RETURN generate_emma_briefing('morning', '$USER_EMAIL');
END;
\$\$;

CREATE OR REPLACE FUNCTION send_noon_briefing()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
BEGIN
  RETURN generate_emma_briefing('noon', '$USER_EMAIL');
END;
\$\$;

CREATE OR REPLACE FUNCTION send_close_briefing()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
BEGIN
  RETURN generate_emma_briefing('close', '$USER_EMAIL');
END;
\$\$;

-- Ajouter l'utilisateur aux abonnés
INSERT INTO briefing_subscribers (email, name, preferences) 
VALUES ('$USER_EMAIL', 'Utilisateur Principal', '{"morning": true, "noon": true, "close": true}')
ON CONFLICT (email) DO UPDATE SET 
  preferences = '{"morning": true, "noon": true, "close": true}',
  active = true,
  updated_at = NOW();

-- Test du système
SELECT 'Configuration email terminée pour $USER_EMAIL' as message;
EOF

echo "   ✅ Script SQL généré : supabase-email-config.sql"
echo ""

echo "📋 INSTRUCTIONS SUPABASE"
echo "========================"
echo ""
echo "1. 🌐 Aller dans votre projet Supabase 'gob-watchlist'"
echo "2. 📝 SQL Editor → New Query"
echo "3. 📋 Copier le contenu du fichier 'supabase-email-config.sql'"
echo "4. ▶️ Exécuter le script"
echo "5. ✅ Vérifier que les fonctions sont mises à jour"
echo ""

echo "📋 INSTRUCTIONS VERCEL"
echo "======================"
echo ""
echo "1. 🌐 Aller dans Vercel Dashboard → Votre projet 'gob'"
echo "2. ⚙️ Settings → Environment Variables"
echo "3. ➕ Ajouter ces variables :"
echo ""
echo "   RESEND_FROM_EMAIL = briefing@your-domain.com"
echo "   RESEND_TO_EMAIL = $USER_EMAIL"
echo "   CRON_SECRET = $(openssl rand -hex 16)"
echo ""
echo "4. 💾 Save et Redéployer"
echo ""

echo "📋 TEST FINAL"
echo "============="
echo ""
echo "Après configuration, testez avec :"
echo ""
echo "curl -X POST \"$BASE_URL/api/briefing-cron\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"type\": \"morning\", \"secret\": \"YOUR_SECRET\"}'"
echo ""

echo "🎯 RÉSUMÉ DE CONFIGURATION"
echo "=========================="
echo ""
echo "✅ Système vérifié et opérationnel"
echo "✅ Email configuré : $USER_EMAIL"
if [ "$EMAIL_CONFIGURED" = true ]; then
    echo "✅ Test d'envoi réussi"
else
    echo "⚠️ Test d'envoi à vérifier après configuration Vercel"
fi
echo "✅ Script SQL généré"
echo "✅ Instructions fournies"
echo ""
echo "📅 Votre routine email du matin sera active à 8h00 EST !"
echo ""
echo "🎉 Configuration terminée !"
