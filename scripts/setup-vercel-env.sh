#!/bin/bash

# Script pour configurer les variables d'environnement Vercel
# Usage: ./scripts/setup-vercel-env.sh

echo "🔧 Configuration Vercel Environment Variables pour Supabase"
echo ""

# Vérifier que vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "Installez avec: npm i -g vercel"
    exit 1
fi

echo "📝 Ajout des variables d'environnement..."

# IMPORTANT: Remplacez les valeurs ci-dessous par vos vraies clés Supabase
# Récupérez-les depuis: https://app.supabase.com → Settings → API

# Supabase URL (publique)
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development <<EOF
https://gob-watchlist.supabase.co
EOF

# Supabase Anon Key (publique)
echo ""
echo "⚠️  Entrez votre SUPABASE_ANON_KEY (depuis Supabase Dashboard → API):"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development

# Supabase Service Role Key (PRIVÉE - seulement production)
echo ""
echo "🔒 Entrez votre SUPABASE_SERVICE_ROLE_KEY (PRIVÉE - depuis Supabase Dashboard → API):"
vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo ""
echo "✅ Variables d'environnement configurées !"
echo "🚀 Vercel redéploiera automatiquement avec les nouvelles variables"
