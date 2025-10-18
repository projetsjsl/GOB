#!/bin/bash
# ============================================================================
# DEPLOY CHATGPT INTEGRATION - Script de déploiement et test
# ============================================================================
#
# Ce script déploie l'intégration ChatGPT et exécute les tests de validation
#
# Usage: bash deploy-chatgpt-integration.sh
# ============================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement de l'intégration ChatGPT"
echo "======================================"
echo ""

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour les logs colorés
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    log_error "package.json non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI n'est pas installé. Installez-le avec: npm i -g vercel"
    exit 1
fi

# Vérifier que les dépendances sont installées
log_info "Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
    log_info "Installation des dépendances..."
    npm install
fi

# Vérifier les variables d'environnement
log_info "Vérification des variables d'environnement..."

# Vérifier OPENAI_API_KEY
if [ -z "$OPENAI_API_KEY" ]; then
    log_warning "OPENAI_API_KEY non définie localement"
    log_info "Vérification dans Vercel..."
    if ! vercel env ls | grep -q "OPENAI_API_KEY"; then
        log_error "OPENAI_API_KEY non configurée dans Vercel"
        log_info "Ajoutez-la avec: vercel env add OPENAI_API_KEY"
        exit 1
    fi
else
    log_success "OPENAI_API_KEY configurée localement"
fi

# Vérifier GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    log_warning "GEMINI_API_KEY non définie localement"
    log_info "Vérification dans Vercel..."
    if ! vercel env ls | grep -q "GEMINI_API_KEY"; then
        log_error "GEMINI_API_KEY non configurée dans Vercel"
        log_info "Ajoutez-la avec: vercel env add GEMINI_API_KEY"
        exit 1
    fi
else
    log_success "GEMINI_API_KEY configurée localement"
fi

# Vérifier PERPLEXITY_API_KEY
if [ -z "$PERPLEXITY_API_KEY" ]; then
    log_warning "PERPLEXITY_API_KEY non définie localement"
    log_info "Vérification dans Vercel..."
    if ! vercel env ls | grep -q "PERPLEXITY_API_KEY"; then
        log_error "PERPLEXITY_API_KEY non configurée dans Vercel"
        log_info "Ajoutez-la avec: vercel env add PERPLEXITY_API_KEY"
        exit 1
    fi
else
    log_success "PERPLEXITY_API_KEY configurée localement"
fi

# Build du projet
log_info "Build du projet..."
npm run build

if [ $? -eq 0 ]; then
    log_success "Build réussi"
else
    log_error "Échec du build"
    exit 1
fi

# Déploiement sur Vercel
log_info "Déploiement sur Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    log_success "Déploiement réussi"
else
    log_error "Échec du déploiement"
    exit 1
fi

# Attendre que le déploiement soit prêt
log_info "Attente de la disponibilité du déploiement..."
sleep 10

# Récupérer l'URL du déploiement
DEPLOY_URL=$(vercel ls | head -n 2 | tail -n 1 | awk '{print $2}')
if [ -z "$DEPLOY_URL" ]; then
    log_error "Impossible de récupérer l'URL du déploiement"
    exit 1
fi

log_success "URL du déploiement: https://$DEPLOY_URL"

# Exécuter les tests d'intégration
log_info "Exécution des tests d'intégration..."

# Mettre à jour l'URL dans le script de test
export VERCEL_URL="$DEPLOY_URL"

# Exécuter le script de test
if [ -f "test-chatgpt-integration.js" ]; then
    node test-chatgpt-integration.js
    if [ $? -eq 0 ]; then
        log_success "Tous les tests sont passés"
    else
        log_warning "Certains tests ont échoué"
    fi
else
    log_warning "Script de test non trouvé"
fi

# Afficher les endpoints disponibles
echo ""
log_info "Endpoints ChatGPT disponibles:"
echo "  • https://$DEPLOY_URL/api/chatgpt/chat.js"
echo "  • https://$DEPLOY_URL/api/chatgpt/tools.js"
echo "  • https://$DEPLOY_URL/api/ai-services.js"

# Afficher les commandes de test
echo ""
log_info "Commandes de test:"
echo "  # Test ChatGPT simple"
echo "  curl -X POST https://$DEPLOY_URL/api/chatgpt/chat.js \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"message\": \"Bonjour Emma!\"}'"
echo ""
echo "  # Test AI Services avec fallback"
echo "  curl -X POST https://$DEPLOY_URL/api/ai-services.js \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"message\": \"Analyse AAPL\", \"preferred_provider\": \"auto\"}'"

echo ""
log_success "🎉 Intégration ChatGPT déployée avec succès!"
echo ""
log_info "Prochaines étapes:"
echo "  1. Tester les endpoints manuellement"
echo "  2. Intégrer dans le frontend si nécessaire"
echo "  3. Configurer le monitoring des performances"
echo "  4. Documenter les cas d'usage spécifiques"

echo ""
log_info "Pour plus d'informations, consultez CHATGPT-INTEGRATION-GUIDE.md"