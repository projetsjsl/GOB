#!/bin/bash

# Test Emma Production API - Vérifier le Fix JSON
# Usage: bash test-emma-production.sh

echo "🧪 Test Emma Production API - Fix Réponses Conversationnelles"
echo "=============================================================="
echo ""

# Configuration
API_URL="https://gob-beta.vercel.app/api/emma-agent"

echo "📍 API URL: $API_URL"
echo ""

# Fonction pour tester un appel
test_emma() {
    local test_name="$1"
    local message="$2"
    local tickers="$3"

    echo "───────────────────────────────────────────────────────────"
    echo "TEST: $test_name"
    echo "Message: $message"
    if [ -n "$tickers" ]; then
        echo "Tickers: $tickers"
    fi
    echo ""

    # Construire le payload JSON
    if [ -n "$tickers" ]; then
        payload="{\"message\":\"$message\",\"context\":{\"output_mode\":\"chat\",\"tickers\":[$tickers]}}"
    else
        payload="{\"message\":\"$message\",\"context\":{\"output_mode\":\"chat\"}}"
    fi

    echo "📤 Envoi de la requête..."

    # Faire l'appel avec timeout
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time 30 2>&1)

    curl_exit=$?

    if [ $curl_exit -ne 0 ]; then
        echo "❌ ERREUR: Échec de la requête (curl exit code: $curl_exit)"
        echo "Réponse brute: $response"
        echo ""
        return 1
    fi

    echo "📥 Réponse reçue"
    echo ""

    # Parser le JSON (nécessite jq)
    if command -v jq &> /dev/null; then
        success=$(echo "$response" | jq -r '.success // "unknown"')
        response_text=$(echo "$response" | jq -r '.response // empty')
        intent=$(echo "$response" | jq -r '.intent // "unknown"')

        echo "✓ Success: $success"
        echo "✓ Intent: $intent"
        echo ""
        echo "📝 Response Content:"
        echo "───────────────────────────────────────────────────────────"
        echo "$response_text"
        echo "───────────────────────────────────────────────────────────"
        echo ""

        # Vérifier si c'est du JSON
        if echo "$response_text" | jq . &> /dev/null 2>&1; then
            echo "❌ PROBLÈME DÉTECTÉ: La réponse est du JSON!"
            echo "   Emma devrait retourner du texte conversationnel, pas du JSON."
            echo ""
            return 1
        else
            # Vérifier si ça ressemble à du JSON même sans être valide
            if echo "$response_text" | grep -qE '^\s*\{.*\}\s*$'; then
                echo "⚠️ ATTENTION: La réponse ressemble à du JSON (contient { })"
                echo ""
                return 1
            else
                echo "✅ SUCCÈS: Réponse conversationnelle (pas du JSON)"
                echo ""
                return 0
            fi
        fi
    else
        echo "⚠️ Note: jq n'est pas installé, affichage brut"
        echo "───────────────────────────────────────────────────────────"
        echo "$response"
        echo "───────────────────────────────────────────────────────────"
        echo ""

        # Vérification basique sans jq
        if echo "$response" | grep -q '"success":true'; then
            echo "✅ API répond avec success:true"
        else
            echo "❌ API ne répond pas correctement"
            return 1
        fi

        # Vérifier présence de JSON dans response
        if echo "$response" | grep -qE '"response":\s*"\{'; then
            echo "❌ PROBLÈME: La réponse contient du JSON stringifié"
            return 1
        else
            echo "✅ La réponse semble conversationnelle"
        fi
        echo ""
    fi
}

# Test 1: Greeting simple
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "TEST 1: GREETING SIMPLE (Sans ticker)"
echo "═══════════════════════════════════════════════════════════"
test_emma "Greeting" "Bonjour Emma, qui es-tu ?" ""
test1_result=$?

sleep 2

# Test 2: Question conceptuelle
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "TEST 2: QUESTION CONCEPTUELLE"
echo "═══════════════════════════════════════════════════════════"
test_emma "Question Conceptuelle" "Qu'est-ce que le ratio P/E ?" ""
test2_result=$?

sleep 2

# Test 3: Analyse avec ticker
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "TEST 3: ANALYSE AVEC TICKER"
echo "═══════════════════════════════════════════════════════════"
test_emma "Analyse Apple" "Analyse la performance d'Apple aujourd'hui" "\"AAPL\""
test3_result=$?

# Résumé final
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "RÉSUMÉ DES TESTS"
echo "═══════════════════════════════════════════════════════════"

total_tests=3
passed_tests=0

echo ""
if [ $test1_result -eq 0 ]; then
    echo "✅ Test 1 (Greeting): PASSÉ"
    ((passed_tests++))
else
    echo "❌ Test 1 (Greeting): ÉCHOUÉ"
fi

if [ $test2_result -eq 0 ]; then
    echo "✅ Test 2 (Question conceptuelle): PASSÉ"
    ((passed_tests++))
else
    echo "❌ Test 2 (Question conceptuelle): ÉCHOUÉ"
fi

if [ $test3_result -eq 0 ]; then
    echo "✅ Test 3 (Analyse avec ticker): PASSÉ"
    ((passed_tests++))
else
    echo "❌ Test 3 (Analyse avec ticker): ÉCHOUÉ"
fi

echo ""
echo "───────────────────────────────────────────────────────────"
echo "Score: $passed_tests/$total_tests tests passés"
echo "───────────────────────────────────────────────────────────"
echo ""

if [ $passed_tests -eq $total_tests ]; then
    echo "🎉 SUCCÈS COMPLET!"
    echo "Emma retourne maintenant des réponses conversationnelles."
    echo ""
    exit 0
elif [ $passed_tests -gt 0 ]; then
    echo "⚠️ SUCCÈS PARTIEL"
    echo "Certains tests ont échoué. Vérifiez les logs ci-dessus."
    echo ""
    exit 1
else
    echo "❌ ÉCHEC COMPLET"
    echo "Tous les tests ont échoué. Vérifiez:"
    echo "1. Le déploiement Vercel est-il terminé?"
    echo "2. PERPLEXITY_API_KEY est-elle configurée?"
    echo "3. Les logs Vercel pour plus de détails"
    echo ""
    exit 1
fi
