#!/bin/bash

# Script de déploiement - Optimisation Coût SMS
# Réduit les coûts SMS de 52% en convertissant emojis → ASCII

set -e

echo "🚀 DÉPLOIEMENT OPTIMISATION COÛT SMS"
echo "====================================="
echo ""

# 1. Vérifier les modifications
echo "📝 Fichiers modifiés:"
git status --short
echo ""

# 2. Tests de validation
echo "🧪 Exécution des tests d'optimisation..."
node test-sms-cost-optimization.js
echo ""

# 3. Confirmer avec l'utilisateur
read -p "✅ Les tests sont OK. Déployer sur Vercel? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Déploiement annulé"
    exit 1
fi

# 4. Commit des changements
echo "📦 Commit des changements..."
git add lib/channel-adapter.js
git add OPTIMISATION-COUT-SMS.md
git add test-sms-cost-optimization.js
git add DEPLOYER-OPTIMISATION-SMS.sh

git commit -m "🚀 Optimisation coûts SMS: -52% (emojis → ASCII GSM-7)

- Conversion emojis numérotés (1️⃣→1.) pour GSM-7
- Normalisation caractères accentués (â→a, ê→e, etc.)
- Limite intelligente 1500 chars avec résumé
- Réduction: 23 segments → 10 segments
- Économie: \$0.19 → \$0.08 USD par analyse longue

Fichiers modifiés:
- lib/channel-adapter.js (adaptForSMS optimisé)
- Documentation: OPTIMISATION-COUT-SMS.md
- Tests: test-sms-cost-optimization.js"

echo ""

# 5. Push vers GitHub (déclenche déploiement Vercel automatique)
echo "🚀 Push vers GitHub + Vercel..."
git push origin main

echo ""
echo "✅ DÉPLOIEMENT EN COURS"
echo "======================="
echo ""
echo "🔗 Vérifier le déploiement:"
echo "   https://vercel.com/projetsjsl/gob/deployments"
echo ""
echo "⏱️  Temps estimé: 2-3 minutes"
echo ""
echo "🧪 Tests post-déploiement:"
echo "   1. Envoyer SMS à Emma: 'Analyse RHI'"
echo "   2. Vérifier coût Twilio Dashboard"
echo "   3. Confirmer segments < 12 (au lieu de 23)"
echo ""
echo "📊 Monitoring:"
echo "   Twilio Console → Logs → Message History"
echo "   Regarder: 'Segments' et 'Encoding' (doit être GSM-7)"
echo ""

