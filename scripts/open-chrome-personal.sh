#!/bin/bash

# Script pour ouvrir Chrome avec le profil personnel (pas celui de Cursor)
# Usage: ./scripts/open-chrome-personal.sh [url]

CHROME_APP="/Applications/Google Chrome.app"
CHROME_PROFILE="Default"
CHROME_USER_DATA_DIR="$HOME/Library/Application Support/Google/Chrome"

# URL par défaut
URL="${1:-chrome://extensions/}"

echo "🚀 Ouverture de Chrome avec votre profil personnel..."
echo "📁 Profil: $CHROME_PROFILE"
echo "🌐 URL: $URL"
echo ""

# Vérifier que Chrome existe
if [ ! -d "$CHROME_APP" ]; then
    echo "❌ Chrome n'est pas installé dans $CHROME_APP"
    exit 1
fi

# Ouvrir Chrome avec le profil par défaut
open -a "Google Chrome" --args \
    --profile-directory="$CHROME_PROFILE" \
    --user-data-dir="$CHROME_USER_DATA_DIR" \
    "$URL"

echo "✅ Chrome ouvert avec votre profil personnel"
echo ""
echo "💡 Pour installer l'extension BrowserTools:"
echo "   1. Activez 'Mode développeur' (toggle en haut à droite)"
echo "   2. Cliquez 'Charger l'extension non empaquetée'"
echo "   3. Sélectionnez: /tmp/BrowserTools-extension/chrome-extension/"

