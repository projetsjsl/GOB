#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     🔧 AUTO-FIX: Tous les problèmes Emma                      ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 Statut actuel:${NC}"
echo "  • Fix outputMode: ✅ Commit cad908d (pushé)"
echo "  • Fix SMS feedback: ✅ Commit 151ff00 (pushé)"
echo "  • Twilio credentials: ⚠️ À vérifier"
echo ""

echo -e "${YELLOW}🚀 Étape 1: Force redéploiement Vercel${NC}"
git commit --allow-empty -m "chore: force redeploy - fix outputMode + SMS feedback"
git push

echo ""
echo -e "${GREEN}✅ Push effectué!${NC}"
echo ""

echo -e "${BLUE}⏰ Étape 2: Attente déploiement Vercel (5 minutes)${NC}"
echo "  Vercel va automatiquement:"
echo "  1. Détecter le nouveau commit"
echo "  2. Builder le projet (npm install, build)"
echo "  3. Déployer en production"
echo ""

echo -e "${YELLOW}📊 Vérifier le déploiement:${NC}"
echo "  Dashboard: https://vercel.com/[ton-compte]/gob/deployments"
echo "  Cherche le commit avec message: 'force redeploy'"
echo "  Attends statut: ✅ Ready"
echo ""

echo -e "${RED}⚠️  Étape 3: TWILIO CREDENTIALS (MANUEL)${NC}"
echo "  ❌ Erreur 401 détectée - credentials invalides"
echo ""
echo "  Action requise:"
echo "  1. Va sur: https://console.twilio.com"
echo "  2. Copie: Account SID, Auth Token, Phone Number"
echo "  3. Va sur: https://vercel.com → GOB → Settings → Environment Variables"
echo "  4. Mets à jour:"
echo "     • TWILIO_ACCOUNT_SID"
echo "     • TWILIO_AUTH_TOKEN"
echo "     • TWILIO_PHONE_NUMBER"
echo "  5. Redéploie: Deployments → Latest → Redeploy"
echo ""

echo -e "${BLUE}🧪 Étape 4: Test (après 10 minutes)${NC}"
echo "  1. Envoie SMS: 'test'"
echo "  2. Tu devrais recevoir:"
echo "     • Feedback immédiat: '🔍 Message reçu...'"
echo "     • Réponse Emma (30-60s)"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║     ✅ AUTO-FIX LANCÉ - Attends 10 minutes                    ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}⏰ Timeline:${NC}"
echo "  T+0:     Push effectué ✅"
echo "  T+1-2:   Vercel détecte le push"
echo "  T+2-5:   Build en cours"
echo "  T+5-10:  Déploiement en production"
echo "  T+10:    ✅ LIVE (si Twilio fixé)"
echo ""

echo -e "${BLUE}📝 Prochaines actions:${NC}"
echo "  1. ⏰ Attends 10 minutes"
echo "  2. 🔥 Fixe Twilio credentials (voir instructions ci-dessus)"
echo "  3. 🧪 Teste avec SMS: 'test'"
echo ""

echo -e "${GREEN}✨ Déploiement automatique en cours!${NC}"
