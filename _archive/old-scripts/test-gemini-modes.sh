#!/bin/bash

# ============================================================================
# SCRIPT DE TEST COMPLET - GEMINI MODES
# ============================================================================
# Ce script teste tous les modes de Gemini pour valider le fonctionnement
# ============================================================================

echo "🤖 TEST COMPLET DES MODES GEMINI - Emma En Direct"
echo "=================================================="
echo ""

BASE_URL="https://gobapps.com/api/gemini"

# Test 1: Mode Simple (chat.js)
echo "1️⃣  Test Mode Simple (chat.js)..."
curl -s -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Bonjour Emma, comment allez-vous ?"}]}' \
  | jq -r '"Réponse: \(.response[0:100])... | Longueur: \(.response | length) | Source: \(.source)"'
echo ""

# Test 2: Mode Validé (chat-validated.js)
echo "2️⃣  Test Mode Validé (chat-validated.js)..."
curl -s -X POST "$BASE_URL/chat-validated" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Bonjour Emma, comment allez-vous ?"}], "useValidatedMode": true}' \
  | jq -r '"Succès: \(.success) | Modèle: \(.model) | Réponse: \(.response[0:100])... | Longueur: \(.response | length)"'
echo ""

# Test 3: Test Function Calling (si activé)
echo "3️⃣  Test Function Calling (chat.js)..."
curl -s -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Peux-tu me donner le prix de AAPL ?"}]}' \
  | jq -r '"Fonctions exécutées: \(.functionsExecuted | length) | Réponse: \(.response[0:100])..."'
echo ""

# Test 4: Test avec message complexe
echo "4️⃣  Test Message Complexe (Mode Validé)..."
curl -s -X POST "$BASE_URL/chat-validated" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Analysez le marché actuel et donnez-moi votre perspective sur les tendances technologiques."}], "useValidatedMode": true}' \
  | jq -r '"Succès: \(.success) | Tokens: \(.usage.totalTokens) | Réponse: \(.response[0:150])..."'
echo ""

# Test 5: Test de gestion d'erreur
echo "5️⃣  Test Gestion d'Erreur (Message vide)..."
curl -s -X POST "$BASE_URL/chat-validated" \
  -H "Content-Type: application/json" \
  -d '{"messages": [], "useValidatedMode": true}' \
  | jq -r '"Erreur: \(.error // "Aucune") | Succès: \(.success)"'
echo ""

echo "✅ Tests terminés !"
echo ""
echo "📊 RÉSUMÉ DES MODES :"
echo "- Mode Simple : Chat basique avec fallback"
echo "- Mode Validé : Validation avancée + métriques"
echo "- Function Calling : Désactivé (commenté dans le code)"
echo ""
echo "🔧 ACTIONS NÉCESSAIRES :"
echo "- Si Function Calling souhaité : Décommenter l'import dans chat.js"
echo "- Si clé Gemini manquante : Ajouter GEMINI_API_KEY dans Vercel"
echo "- Si erreurs 401 : Vérifier la validité de la clé API"
