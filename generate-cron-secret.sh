#!/bin/bash

# Script pour générer le CRON_SECRET pour Vercel
echo "🔐 Génération du CRON_SECRET pour Vercel..."
echo ""

# Générer un secret aléatoire de 32 caractères
CRON_SECRET=$(openssl rand -base64 32)

echo "✅ CRON_SECRET généré:"
echo "$CRON_SECRET"
echo ""
echo "📋 Instructions pour Vercel:"
echo "1. Allez dans votre projet Vercel"
echo "2. Settings > Environment Variables"
echo "3. Ajoutez la variable:"
echo "   - Name: CRON_SECRET"
echo "   - Value: $CRON_SECRET"
echo "   - Environment: Production, Preview, Development"
echo ""
echo "⚠️  IMPORTANT: Gardez ce secret confidentiel!"
echo "💡 Ce secret sécurise l'accès au cron job de refresh des nouvelles"
