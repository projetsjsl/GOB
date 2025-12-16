#!/bin/bash

echo "🚀 Forçage du redéploiement Vercel..."

# Créer un commit vide pour forcer le redéploiement
git commit --allow-empty -m "🔄 Force Vercel redeploy - $(date)"

# Pousser vers origin
git push origin main

echo "✅ Redéploiement forcé - Vercel devrait maintenant déployer les dernières modifications"
echo "⏳ Attendez 2-3 minutes puis testez le dashboard"