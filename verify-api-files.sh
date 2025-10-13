#!/bin/bash

# Script de vérification des fichiers API
echo "🧪 Vérification des fichiers API"
echo "================================"
echo ""

echo "📋 Vérification des fichiers:"
echo ""

# Vérifier que les fichiers existent
api_files=(
    "api/gemini/chat.js"
    "api/news/cached.js"
    "api/cron/refresh-news.js"
    "vercel.json"
)

for file in "${api_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
        
        # Vérifier la taille du fichier
        size=$(wc -c < "$file")
        echo "   Taille: $size bytes"
        
        # Vérifier les imports/exports
        if grep -q "export default" "$file" 2>/dev/null; then
            echo "   ✅ Export ES6 trouvé"
        elif grep -q "module.exports" "$file" 2>/dev/null; then
            echo "   ✅ Export CommonJS trouvé"
        else
            echo "   ⚠️ Pas d'export trouvé"
        fi
        
    else
        echo "❌ $file manquant"
    fi
done

echo ""
echo "📊 Vérification vercel.json:"
echo ""

if [ -f "vercel.json" ]; then
    echo "✅ vercel.json existe"
    
    # Compter les fonctions
    function_count=$(grep -c "maxDuration" vercel.json)
    echo "   Fonctions configurées: $function_count"
    
    # Vérifier les nouvelles fonctions
    if grep -q "api/news/cached.js" vercel.json; then
        echo "   ✅ api/news/cached.js configurée"
    else
        echo "   ❌ api/news/cached.js non configurée"
    fi
    
    if grep -q "api/cron/refresh-news.js" vercel.json; then
        echo "   ✅ api/cron/refresh-news.js configurée"
    else
        echo "   ❌ api/cron/refresh-news.js non configurée"
    fi
    
    # Vérifier les crons
    cron_count=$(grep -c "schedule" vercel.json)
    echo "   Crons configurés: $cron_count"
    
else
    echo "❌ vercel.json manquant"
fi

echo ""
echo "🔍 Vérification des imports dans les APIs:"
echo ""

# Vérifier les imports dans api/news/cached.js
if [ -f "api/news/cached.js" ]; then
    if grep -q "import.*createClient" api/news/cached.js; then
        echo "✅ api/news/cached.js: Import Supabase OK"
    else
        echo "❌ api/news/cached.js: Import Supabase manquant"
    fi
fi

# Vérifier les imports dans api/cron/refresh-news.js
if [ -f "api/cron/refresh-news.js" ]; then
    if grep -q "import.*createClient" api/cron/refresh-news.js; then
        echo "✅ api/cron/refresh-news.js: Import Supabase OK"
    else
        echo "❌ api/cron/refresh-news.js: Import Supabase manquant"
    fi
    
    if grep -q "CRON_SECRET" api/cron/refresh-news.js; then
        echo "✅ api/cron/refresh-news.js: CRON_SECRET configuré"
    else
        echo "❌ api/cron/refresh-news.js: CRON_SECRET manquant"
    fi
fi

echo ""
echo "📋 Vérification des permissions:"
echo ""

# Vérifier les permissions des fichiers
for file in "${api_files[@]}"; do
    if [ -f "$file" ]; then
        perms=$(ls -l "$file" | cut -d' ' -f1)
        echo "   $file: $perms"
    fi
done

echo ""
echo "💡 Recommandations:"
echo "=================="
echo "1. Vérifier les logs Vercel Dashboard"
echo "2. Essayer de redéployer manuellement"
echo "3. Vérifier que toutes les variables d'environnement sont configurées"
echo "4. Tester avec un endpoint simple d'abord"
echo ""
echo "🔧 Prochaines étapes:"
echo "===================="
echo "1. Aller sur Vercel Dashboard"
echo "2. Vérifier les logs de déploiement"
echo "3. Essayer de redéployer manuellement"
echo "4. Vérifier les variables d'environnement"
