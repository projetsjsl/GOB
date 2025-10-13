#!/bin/bash

# Script pour forcer un redéploiement Vercel
echo "🔄 Force redéploiement Vercel"
echo "============================"
echo ""

echo "📋 Étapes pour forcer le redéploiement:"
echo ""

echo "1. 🔧 Créer un fichier de test pour déclencher le déploiement..."
echo "   Création d'un fichier temporaire..."

# Créer un fichier temporaire pour déclencher le déploiement
echo "# Force redeploy $(date)" > .vercel-force-redeploy
echo "   ✅ Fichier .vercel-force-redeploy créé"

echo ""
echo "2. 📝 Commit et push du changement..."
git add .vercel-force-redeploy
git commit -m "🔄 Force Vercel redeploy - $(date)"
git push

echo ""
echo "3. ⏰ Attente du déploiement (2-3 minutes)..."
echo "   Le déploiement Vercel va se déclencher automatiquement"
echo ""

echo "4. 🧪 Test automatique dans 3 minutes..."
echo "   Exécution du script de test..."

# Attendre 3 minutes puis tester
sleep 180

echo ""
echo "🧪 Test après redéploiement:"
echo "============================"

# Test des endpoints
BASE_URL="https://gob.vercel.app"

echo "Test API Gemini:"
gemini_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/gemini/chat")
echo "   Status: $gemini_status $([ "$gemini_status" = "405" ] && echo "✅ (Method Not Allowed = OK)" || echo "❌")"

echo "Test API Cache:"
cache_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/news/cached?type=general&limit=5")
echo "   Status: $cache_status $([ "$cache_status" = "200" ] && echo "✅" || echo "❌")"

echo "Test Cron Job:"
cron_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/cron/refresh-news")
echo "   Status: $cron_status $([ "$cron_status" = "401" ] && echo "✅ (Unauthorized = OK)" || echo "❌")"

echo ""
echo "📊 Résultat:"
echo "============"

if [ "$gemini_status" = "405" ] && [ "$cache_status" = "200" ] && [ "$cron_status" = "401" ]; then
    echo "🎉 SUCCÈS! Toutes les APIs sont déployées et fonctionnelles"
    echo ""
    echo "✅ Prochaines étapes:"
    echo "   1. Tester le système de cache complet"
    echo "   2. Vérifier que les nouvelles se chargent"
    echo "   3. Valider les performances"
    echo ""
    echo "🧪 Commandes de test:"
    echo "   ./test-cache-system.sh"
    echo "   ./check-deployment-status.sh"
else
    echo "❌ Problème persistant avec le déploiement"
    echo ""
    echo "🔧 Actions recommandées:"
    echo "   1. Vérifier les logs Vercel Dashboard"
    echo "   2. Essayer de redéployer manuellement depuis Vercel"
    echo "   3. Vérifier les variables d'environnement"
    echo "   4. Contacter le support Vercel si nécessaire"
fi

echo ""
echo "🧹 Nettoyage..."
rm -f .vercel-force-redeploy
git add .vercel-force-redeploy
git commit -m "🧹 Cleanup force redeploy file"
git push

echo "✅ Nettoyage terminé"
