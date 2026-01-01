#!/bin/bash

# 🎯 MASTER Script - Configuration Vercel Supabase TOTALEMENT AUTOMATIQUE
# Détecte la meilleure méthode et configure tout

set -e

echo "🔥 MASTER MODE: Configuration Vercel → Supabase"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables Supabase
SUPABASE_URL="https://gob-watchlist.supabase.co"

# Détection du projet Vercel
PROJECT_ID=$(grep -o '"projectId":"[^"]*"' .vercel/project.json 2>/dev/null | cut -d'"' -f4 || echo "")
TEAM_ID=$(grep -o '"orgId":"[^"]*"' .vercel/project.json 2>/dev/null | cut -d'"' -f4 || echo "")

echo -e "${BLUE}📦 Projet détecté:${NC} ${PROJECT_ID:-'non trouvé'}"
echo ""

# Méthode 1: API Vercel directe (si VERCEL_TOKEN disponible)
if [ ! -z "$VERCEL_TOKEN" ]; then
    echo -e "${GREEN}✓${NC} VERCEL_TOKEN détecté - Utilisation de l'API Vercel"
    echo ""

    # URL de base API Vercel
    API_BASE="https://api.vercel.com/v9/projects/$PROJECT_ID/env"

    # Fonction pour ajouter une variable via API
    add_env_var() {
        local key=$1
        local value=$2
        local target=$3  # production, preview, development

        curl -s -X POST "$API_BASE" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"key\": \"$key\",
                \"value\": \"$value\",
                \"target\": [\"$target\"],
                \"type\": \"encrypted\"
            }" > /dev/null

        echo -e "${GREEN}✓${NC} $key ajoutée ($target)"
    }

    # Ajouter SUPABASE_URL
    add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "production"
    add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "preview"
    add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "development"

    add_env_var "SUPABASE_URL" "$SUPABASE_URL" "production"
    add_env_var "SUPABASE_URL" "$SUPABASE_URL" "preview"
    add_env_var "SUPABASE_URL" "$SUPABASE_URL" "development"

    echo ""
    echo -e "${YELLOW}⚠️  Pour les clés sensibles (ANON_KEY, SERVICE_ROLE_KEY):${NC}"
    echo "   Ajoutez-les manuellement sur: https://vercel.com/dashboard"
    echo "   Ou exportez-les comme variables d'environnement:"
    echo ""
    echo "   export SUPABASE_ANON_KEY='eyJ...'"
    echo "   export SUPABASE_SERVICE_ROLE_KEY='eyJ...'"
    echo "   ./scripts/master-vercel-setup.sh"

    if [ ! -z "$SUPABASE_ANON_KEY" ]; then
        add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "production"
        add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "preview"
        add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "development"
    fi

    if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "production"
        add_env_var "SUPABASE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "production"
    fi

    echo ""
    echo -e "${GREEN}✅ Configuration API terminée !${NC}"

# Méthode 2: Vercel CLI (si installé et authentifié)
elif command -v vercel &> /dev/null; then
    echo -e "${GREEN}✓${NC} Vercel CLI détecté - Utilisation de vercel env"
    echo ""

    ./scripts/auto-setup-vercel-supabase.sh

# Méthode 3: Installation auto de Vercel CLI
else
    echo -e "${YELLOW}⚙️  Installation de Vercel CLI...${NC}"
    npm install -g vercel --silent

    echo ""
    echo -e "${BLUE}🔐 Authentification Vercel requise${NC}"
    echo "Lancez: vercel login"
    echo ""
    echo "Puis relancez ce script."
    exit 1
fi

echo ""
echo -e "${GREEN}🎯 MASTER SETUP TERMINÉ !${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Vérifiez: https://vercel.com/dashboard → GOB → Settings → Environment Variables"
echo "   2. Ajoutez les clés secrètes si nécessaire (ANON_KEY, SERVICE_ROLE_KEY)"
echo "   3. Redéployez: git push (Vercel auto-deploy)"
echo ""
