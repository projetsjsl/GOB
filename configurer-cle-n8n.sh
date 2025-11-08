#!/bin/bash
# Script interactif pour configurer N8N_API_KEY

echo "🔑 Configuration de N8N_API_KEY"
echo "================================"
echo ""

# Option 1: Récupérer depuis Vercel
echo "Option 1: Récupérer depuis Vercel"
read -p "Voulez-vous récupérer la clé depuis Vercel? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[OoYy]$ ]]; then
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI n'est pas installé"
        echo "   Installez-le avec: npm install -g vercel"
    else
        echo "📥 Récupération depuis Vercel..."
        vercel env pull .env.local 2>&1
        
        if [ -f .env.local ]; then
            if grep -q "N8N_API_KEY" .env.local; then
                echo "✅ Clé récupérée dans .env.local"
                source .env.local
                echo "✅ Variable chargée dans l'environnement"
                echo ""
                echo "🧪 Test de la connexion..."
                node connect-n8n-with-vercel.js
                exit 0
            else
                echo "⚠️  N8N_API_KEY non trouvée dans Vercel"
            fi
        fi
    fi
fi

# Option 2: Saisie manuelle
echo ""
echo "Option 2: Saisie manuelle"
read -p "Voulez-vous saisir la clé manuellement? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[OoYy]$ ]]; then
    read -p "Collez votre N8N_API_KEY: " N8N_KEY
    if [ ! -z "$N8N_KEY" ]; then
        # Créer .env.local
        echo "N8N_API_KEY=$N8N_KEY" > .env.local
        echo "✅ Clé sauvegardée dans .env.local"
        
        # Exporter pour cette session
        export N8N_API_KEY="$N8N_KEY"
        echo "✅ Variable exportée"
        echo ""
        echo "🧪 Test de la connexion..."
        node connect-n8n-with-vercel.js
        exit 0
    else
        echo "❌ Clé vide"
        exit 1
    fi
fi

# Option 3: Passer en argument
echo ""
echo "Option 3: Utiliser directement"
echo "Vous pouvez aussi utiliser:"
echo "  export N8N_API_KEY='votre_cle'"
echo "  node connect-n8n-with-vercel.js"
echo ""
echo "Ou:"
echo "  node connect-n8n-with-vercel.js --api-key 'votre_cle'"

