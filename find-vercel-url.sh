#!/bin/bash

# Script pour trouver l'URL Vercel correcte

echo "🔍 Recherche de l'URL Vercel correcte..."
echo ""

# Liste des URLs possibles
urls=(
    "https://gob.vercel.app"
    "https://gob-apps.vercel.app"
    "https://gob-projetsjsl.vercel.app"
    "https://gob-git-main-projetsjsl.vercel.app"
)

echo "🧪 Test des URLs possibles..."
echo ""

for url in "${urls[@]}"; do
    echo -n "Testing $url ... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 5)
    
    if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
        echo "✅ FOUND! (Status: $response)"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ URL CORRECTE: $url"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Teste Emma maintenant:"
        echo ""
        echo "curl -X POST $url/api/gemini/chat \\"
        echo "  -H 'Content-Type: application/json' \\"
        echo "  -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Bonjour Emma\"}]}'"
        echo ""
        exit 0
    else
        echo "❌ Not found (Status: $response)"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "❌ AUCUNE URL TROUVÉE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Actions à faire:"
echo "1. Va sur https://vercel.com/projetsjsl"
echo "2. Trouve ton projet 'gob'"
echo "3. Note l'URL affichée"
echo "4. Vérifie que le déploiement est 'Ready'"
echo ""

