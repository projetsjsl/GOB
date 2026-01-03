#!/bin/bash

# Auto-configuration Vercel Environment Variables pour Supabase
# Utilise les valeurs de .env.example comme référence

set -e

echo "🚀 Configuration automatique Vercel → Supabase"
echo "================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI n'est pas installé${NC}"
    echo ""
    echo "Installation automatique..."
    npm i -g vercel
fi

# Variables Supabase depuis .env.example
SUPABASE_URL="https://gob-watchlist.supabase.co"

echo -e "${BLUE}📝 Configuration des variables Supabase dans Vercel...${NC}"
echo ""

# 1. SUPABASE_URL (publique)
echo -e "${GREEN}✓${NC} Ajout de NEXT_PUBLIC_SUPABASE_URL"
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development 2>/dev/null || echo "  (déjà configurée)"

# 2. SUPABASE_ANON_KEY (publique)
echo ""
echo -e "${YELLOW}🔑 SUPABASE_ANON_KEY${NC}"
echo "Récupérez depuis: https://app.supabase.com → gob-watchlist → Settings → API → anon/public"
echo ""
echo "Collez votre ANON KEY (ou ENTER pour skip si déjà configurée):"
read -r ANON_KEY

if [ ! -z "$ANON_KEY" ]; then
    echo "$ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
    echo -e "${GREEN}✓${NC} ANON_KEY ajoutée"
else
    echo "  (skippée)"
fi

# 3. SUPABASE_SERVICE_ROLE_KEY (privée - PRODUCTION SEULEMENT)
echo ""
echo -e "${YELLOW}🔒 SUPABASE_SERVICE_ROLE_KEY (SECRÈTE)${NC}"
echo "Récupérez depuis: https://app.supabase.com → gob-watchlist → Settings → API → service_role"
echo ""
echo "⚠️  Cette clé est PRIVÉE - elle sera ajoutée SEULEMENT en production"
echo "Collez votre SERVICE_ROLE KEY (ou ENTER pour skip si déjà configurée):"
read -r SERVICE_KEY

if [ ! -z "$SERVICE_KEY" ]; then
    echo "$SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
    echo -e "${GREEN}✓${NC} SERVICE_ROLE_KEY ajoutée (production seulement)"
else
    echo "  (skippée)"
fi

# 4. Autres variables utiles
echo ""
echo -e "${BLUE}📦 Configuration de variables supplémentaires...${NC}"

# SUPABASE_KEY (alias pour compatibilité)
if [ ! -z "$SERVICE_KEY" ]; then
    echo "$SERVICE_KEY" | vercel env add SUPABASE_KEY production 2>/dev/null || echo "  SUPABASE_KEY (déjà configurée)"
fi

# SUPABASE_URL (sans prefix NEXT_PUBLIC pour backend)
echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production preview development 2>/dev/null || echo "  SUPABASE_URL backend (déjà configurée)"

echo ""
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo "🔍 Vérifiez vos variables:"
echo "   vercel env ls"
echo ""
echo "🚀 Vercel redéploiera automatiquement avec les nouvelles variables"
echo ""
echo "📝 Variables configurées:"
echo "   • NEXT_PUBLIC_SUPABASE_URL (tous environnements)"
echo "   • NEXT_PUBLIC_SUPABASE_ANON_KEY (tous environnements)"
echo "   • SUPABASE_SERVICE_ROLE_KEY (production seulement)"
echo "   • SUPABASE_URL (backend, tous environnements)"
echo "   • SUPABASE_KEY (production seulement)"
