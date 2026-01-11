#!/bin/bash

# Script de surveillance du marathon de tests de 3 heures
# Ce script vérifie régulièrement la progression et affiche un résumé

OUTPUT_FILE="/var/folders/yc/s3s647h1675b91vb9h7w6xlw0000gn/T/claude/-Users-projetsjsl-Documents-GitHub-GOB/tasks/a031e6e.output"
SCREENSHOTS_DIR="/Users/projetsjsl/Documents/GitHub/GOB/bug-screenshots"
START_TIME=$(date +%s)
DURATION=10800  # 3 heures en secondes

echo "🔍 Surveillance du marathon de tests démarrée à $(date)"
echo "📊 Durée prévue: 3 heures"
echo "📁 Dossier screenshots: $SCREENSHOTS_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    REMAINING=$((DURATION - ELAPSED))

    if [ $REMAINING -le 0 ]; then
        echo "✅ Les 3 heures de test sont terminées!"
        break
    fi

    # Calcul du temps écoulé et restant
    HOURS_ELAPSED=$((ELAPSED / 3600))
    MINS_ELAPSED=$(((ELAPSED % 3600) / 60))
    HOURS_REMAINING=$((REMAINING / 3600))
    MINS_REMAINING=$(((REMAINING % 3600) / 60))

    # Comptage des screenshots
    SCREENSHOT_COUNT=$(ls -1 "$SCREENSHOTS_DIR" 2>/dev/null | wc -l | tr -d ' ')

    # Taille du fichier de sortie
    OUTPUT_SIZE=$(du -h "$OUTPUT_FILE" 2>/dev/null | cut -f1)

    clear
    echo "🔍 MARATHON DE TESTS - SURVEILLANCE EN TEMPS RÉEL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⏱️  Temps écoulé: ${HOURS_ELAPSED}h ${MINS_ELAPSED}m"
    echo "⏳ Temps restant: ${HOURS_REMAINING}h ${MINS_REMAINING}m"
    echo "📸 Screenshots capturés: $SCREENSHOT_COUNT"
    echo "📄 Taille du log: $OUTPUT_SIZE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Dernières lignes du log:"
    tail -20 "$OUTPUT_FILE" 2>/dev/null | grep -E "(BUG|ERROR|WARN|✅|❌|🔍)" || echo "En cours de traitement..."

    sleep 60  # Mise à jour toutes les minutes
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 RÉSUMÉ FINAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 Total screenshots: $(ls -1 "$SCREENSHOTS_DIR" 2>/dev/null | wc -l | tr -d ' ')"
echo "📄 Rapport disponible: RAPPORT-BUGS-EXHAUSTIF-2026-01-10.md"
echo "✅ Marathon de tests terminé!"
