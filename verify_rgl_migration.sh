#!/bin/bash
# Script de vérification de la migration RGL
echo "🔍 Vérification de la migration RGL..."

FILES=("public/js/dashboard/components/grid-layout/RglDashboard.js" "public/js/dashboard/components/tabs/MarketsEconomyTabRGL.js" "public/js/dashboard/components/tabs/TitresTabRGL.js")
ERRORS=0

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Existant: $file"
    else
        echo "❌ Manquant: $file"
        ERRORS=$((ERRORS+1))
    fi
done

grep "react-grid-layout" public/beta-combined-dashboard.html > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Import RGL trouvé dans HTML"
else
    echo "❌ Import RGL manquant dans HTML"
    ERRORS=$((ERRORS+1))
fi

grep "MarketsEconomyTabRGL" public/js/dashboard/app-inline.js > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ MarketsEconomyTabRGL référencé dans app-inline.js"
else
    echo "❌ MarketsEconomyTabRGL non référencé dans app-inline.js"
    ERRORS=$((ERRORS+1))
fi

if [ $ERRORS -eq 0 ]; then
    echo "✨ Tous les tests sont passés!"
    exit 0
else
    echo "🔥 Il y a des erreurs."
    exit 1
fi
