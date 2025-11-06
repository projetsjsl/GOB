#!/bin/bash
# Script manuel pour vider le cache immédiatement
# Usage: ./clear-cache.sh

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        🗑️  VIDAGE MANUEL DU CACHE                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier que les variables d'environnement sont définies
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Erreur: Variables d'environnement Supabase manquantes"
    echo ""
    echo "Pour utiliser ce script localement, définissez:"
    echo "  export SUPABASE_URL='votre_url'"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='votre_clé'"
    echo ""
    echo "Ou utilisez la commande Vercel:"
    echo "  vercel env pull .env.local"
    echo "  source .env.local"
    echo "  ./clear-cache.sh"
    echo ""
    exit 1
fi

# Exécuter le script Node.js
node scripts/clear-cache-post-deploy.js

if [ $? -eq 0 ]; then
    echo "✅ Cache vidé avec succès!"
    echo ""
    echo "📝 Les prochaines requêtes SMS généreront de nouvelles réponses"
    echo "   avec les dernières optimisations."
    echo ""
else
    echo "❌ Erreur lors du vidage du cache"
    exit 1
fi

