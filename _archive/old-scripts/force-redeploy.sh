#!/bin/bash
echo "🚀 Force redéploiement Vercel..."
echo ""
echo "Option 1: Via Vercel CLI"
echo "  vercel --prod"
echo ""
echo "Option 2: Via Git (trigger redeploy)"
echo "  git commit --allow-empty -m 'chore: force redeploy'"
echo "  git push"
echo ""
echo "Option 3: Via Dashboard Vercel"
echo "  1. Va sur https://vercel.com"
echo "  2. Sélectionne ton projet GOB"
echo "  3. Onglet 'Deployments'"
echo "  4. Click 'Redeploy' sur le dernier déploiement"
echo ""
read -p "Quelle option? (1/2/3): " choice

case $choice in
  1)
    echo "Déploiement via Vercel CLI..."
    vercel --prod
    ;;
  2)
    echo "Déploiement via Git..."
    git commit --allow-empty -m "chore: force redeploy Emma V3.1.1"
    git push
    echo "✅ Push effectué, Vercel va redéployer dans 2-3 minutes"
    ;;
  3)
    echo "Ouvre le dashboard Vercel:"
    echo "https://vercel.com"
    ;;
  *)
    echo "Option invalide"
    ;;
esac
