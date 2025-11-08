#!/bin/bash
# Script pour récupérer N8N_API_KEY depuis Vercel

echo "🔍 Recherche de N8N_API_KEY dans Vercel..."
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "   Installez-le avec: npm install -g vercel"
    exit 1
fi

# Vérifier si connecté à Vercel
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Vous n'êtes pas connecté à Vercel"
    echo "   Connectez-vous avec: vercel login"
    echo ""
    read -p "Voulez-vous vous connecter maintenant? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        vercel login
    else
        echo "❌ Connexion annulée"
        exit 1
    fi
fi

echo "📋 Liste des variables d'environnement Vercel contenant 'N8N':"
echo ""

# Lister toutes les variables et filtrer N8N
vercel env ls 2>/dev/null | grep -i n8n || echo "Aucune variable N8N trouvée"

echo ""
echo "🔑 Pour récupérer la valeur de N8N_API_KEY:"
echo "   vercel env pull .env.local"
echo ""
echo "   Ou pour voir la valeur directement:"
echo "   vercel env pull .env.local && grep N8N_API_KEY .env.local"
echo ""

# Proposer de récupérer la valeur
read -p "Voulez-vous récupérer toutes les variables d'environnement? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[OoYy]$ ]]; then
    echo "📥 Récupération des variables d'environnement..."
    vercel env pull .env.local
    
    if [ -f .env.local ]; then
        echo ""
        echo "✅ Variables récupérées dans .env.local"
        echo ""
        
        if grep -q "N8N_API_KEY" .env.local; then
            echo "🔑 N8N_API_KEY trouvée!"
            echo ""
            # Afficher la valeur (masquée partiellement)
            N8N_KEY=$(grep "N8N_API_KEY" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")
            if [ ! -z "$N8N_KEY" ]; then
                # Masquer la clé (afficher seulement les 4 premiers et 4 derniers caractères)
                KEY_LEN=${#N8N_KEY}
                if [ $KEY_LEN -gt 8 ]; then
                    KEY_START="${N8N_KEY:0:4}"
                    KEY_END="${N8N_KEY: -4}"
                    KEY_MASKED="${KEY_START}...${KEY_END}"
                    echo "   Valeur: ${KEY_MASKED}"
                    echo ""
                    echo "💡 Pour l'utiliser:"
                    echo "   export N8N_API_KEY=\"$N8N_KEY\""
                    echo "   node connect-n8n-specific.js"
                else
                    echo "   Valeur: (trop courte, vérifiez manuellement)"
                fi
            fi
        else
            echo "⚠️  N8N_API_KEY non trouvée dans .env.local"
            echo "   Vérifiez dans Vercel Dashboard → Settings → Environment Variables"
        fi
    else
        echo "❌ Erreur lors de la récupération"
    fi
fi

