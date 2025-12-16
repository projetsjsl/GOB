#!/bin/bash

# ============================================
# Script de Test - Interface Admin Emma
# ============================================
# Teste l'accès et la configuration de l'interface
# admin de gestion d'Emma IA
# ============================================

echo "🧪 Test Interface Admin Emma - GOB"
echo "===================================="
echo ""

DOMAIN="https://gobapps.com"
ADMIN_URL="${DOMAIN}/admin-jslai.html"
API_URL="${DOMAIN}/api/admin/emma-config"

# Couleurs pour output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher résultat
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================
# Test 1: Interface HTML accessible
# ============================================
echo "Test 1: Interface Admin HTML"
echo "----------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL")

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Interface accessible à $ADMIN_URL"
else
    print_result 1 "Interface NON accessible (HTTP $HTTP_CODE)"
    print_warning "Vérifier le déploiement Vercel"
fi
echo ""

# ============================================
# Test 2: API Backend accessible (sans auth)
# ============================================
echo "Test 2: API Backend"
echo "----------------------------"
API_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL")
API_CODE=$(echo "$API_RESPONSE" | tail -n1)
API_BODY=$(echo "$API_RESPONSE" | sed '$d')

if [ "$API_CODE" = "401" ]; then
    print_result 0 "API backend accessible (auth requise - normal)"
    print_info "Code HTTP 401 = authentification requise (comportement attendu)"
elif [ "$API_CODE" = "200" ]; then
    print_warning "API accessible SANS auth (ADMIN_API_KEY non configuré)"
    echo "$API_BODY" | jq '.' 2>/dev/null || echo "$API_BODY"
else
    print_result 1 "API erreur (HTTP $API_CODE)"
    echo "$API_BODY"
fi
echo ""

# ============================================
# Test 3: Vérifier fichiers locaux
# ============================================
echo "Test 3: Fichiers Locaux"
echo "----------------------------"

FILES=(
    "public/admin-jslai.html:Interface HTML"
    "api/admin/emma-config.js:API Backend"
    "supabase-emma-admin-setup.sql:Script SQL Supabase"
    "docs/ADMIN_JSLai_SETUP.md:Documentation"
)

for FILE_INFO in "${FILES[@]}"; do
    FILE_PATH="${FILE_INFO%%:*}"
    FILE_DESC="${FILE_INFO##*:}"

    if [ -f "$FILE_PATH" ]; then
        SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null)
        print_result 0 "$FILE_DESC ($FILE_PATH) - ${SIZE} bytes"
    else
        print_result 1 "$FILE_DESC MANQUANT ($FILE_PATH)"
    fi
done
echo ""

# ============================================
# Test 4: Vérifier vercel.json
# ============================================
echo "Test 4: Configuration Vercel"
echo "----------------------------"

if grep -q "api/admin/emma-config.js" vercel.json 2>/dev/null; then
    print_result 0 "API admin configurée dans vercel.json"
    TIMEOUT=$(grep -A2 "api/admin/emma-config.js" vercel.json | grep maxDuration | awk '{print $2}' | tr -d ',')
    print_info "Timeout configuré: ${TIMEOUT}s"
else
    print_result 1 "API admin NON configurée dans vercel.json"
fi
echo ""

# ============================================
# Checklist de Configuration
# ============================================
echo "📋 CHECKLIST DE CONFIGURATION"
echo "=============================="
echo ""
echo "Pour utiliser l'interface Admin Emma, vous devez :"
echo ""
echo "1️⃣  Configuration Supabase"
echo "   □ Créer la table emma_system_config"
echo "   └─ Exécuter: supabase-emma-admin-setup.sql"
echo "   └─ URL: https://app.supabase.com/project/[PROJECT]/sql"
echo ""
echo "2️⃣  Configuration Vercel"
echo "   □ Ajouter la variable ADMIN_API_KEY"
echo "   └─ Générer un token: openssl rand -hex 32"
echo "   └─ URL: https://vercel.com/projetsjsls-projects/gob/settings/environment-variables"
echo ""
echo "3️⃣  Test de l'Interface"
echo "   □ Accéder à: https://gobapps.com/admin-jslai.html"
echo "   □ Entrer le token ADMIN_API_KEY"
echo "   □ Vérifier le chargement de la config"
echo ""
echo "4️⃣  Sauvegarde du Token"
echo "   □ Sauvegarder le token dans 1Password/LastPass"
echo "   □ Partager avec l'équipe autorisée"
echo ""

# ============================================
# Commandes Utiles
# ============================================
echo "🛠️  COMMANDES UTILES"
echo "===================="
echo ""
echo "# Générer un token admin sécurisé"
echo "openssl rand -hex 32"
echo ""
echo "# Tester l'API avec token"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' $API_URL"
echo ""
echo "# Voir les logs Vercel"
echo "vercel logs --follow"
echo ""
echo "# Redéployer après config"
echo "vercel --prod"
echo ""

# ============================================
# Résumé
# ============================================
echo "📊 RÉSUMÉ"
echo "========="
echo ""
if [ "$HTTP_CODE" = "200" ] && ([ "$API_CODE" = "401" ] || [ "$API_CODE" = "200" ]); then
    echo -e "${GREEN}✅ Déploiement OK - Interface et API accessibles${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Configurer Supabase (table emma_system_config)"
    echo "2. Ajouter ADMIN_API_KEY dans Vercel"
    echo "3. Tester l'interface à https://gobapps.com/admin-jslai.html"
else
    echo -e "${RED}❌ Problèmes détectés${NC}"
    echo ""
    echo "Actions requises:"
    echo "1. Vérifier le déploiement sur Vercel"
    echo "2. Consulter les logs: vercel logs"
    echo "3. Redéployer si nécessaire: vercel --prod"
fi
echo ""
echo "📖 Documentation complète: docs/ADMIN_JSLai_SETUP.md"
echo ""
