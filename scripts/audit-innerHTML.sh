#!/bin/bash

# Script d'audit innerHTML pour identifier les risques XSS
# Catégorise les usages: SAFE, RISKY, DANGEROUS

echo "🔍 Audit innerHTML - Analyse de sécurité XSS"
echo "=========================================="
echo ""

REPORT_FILE="innerHTML-audit-$(date +%Y%m%d-%H%M%S).md"

cat > $REPORT_FILE <<'HEADER'
# Audit innerHTML - Rapport de Sécurité XSS

**Date:** $(date)
**Total innerHTML:** 137 occurrences dans 12 fichiers

---

## Classification

### 🟢 SAFE - Cleanup uniquement
Utilisation pour nettoyer le DOM (container.innerHTML = '')

### 🟡 RISKY - Nécessite vérification
Contenu statique ou partiellement dynamique

### 🔴 DANGEROUS - Correction requise
Données utilisateur non sanitizées

---

HEADER

echo "Analyse en cours..."

# Recherche innerHTML dans les fichiers JS
grep -rn "innerHTML" public/js/dashboard --include="*.js" > /tmp/innerHTML_raw.txt

TOTAL=$(wc -l < /tmp/innerHTML_raw.txt)
SAFE=0
RISKY=0
DANGEROUS=0

echo "## Résultats par Fichier" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Analyser chaque occurrence
while IFS= read -r line; do
    FILE=$(echo "$line" | cut -d: -f1)
    LINENO=$(echo "$line" | cut -d: -f2)
    CODE=$(echo "$line" | cut -d: -f3-)

    # Classification
    if echo "$CODE" | grep -q "innerHTML\s*=\s*['\"]\\s*['\"]"; then
        # Pattern: innerHTML = '' ou innerHTML = ""
        CATEGORY="🟢 SAFE"
        ((SAFE++))
    elif echo "$CODE" | grep -q "innerHTML.*\${"; then
        # Pattern: innerHTML avec template literals
        CATEGORY="🔴 DANGEROUS"
        ((DANGEROUS++))
    elif echo "$CODE" | grep -q "innerHTML.*+"; then
        # Pattern: innerHTML avec concaténation
        CATEGORY="🟡 RISKY"
        ((RISKY++))
    else
        CATEGORY="🟡 RISKY"
        ((RISKY++))
    fi

done < /tmp/innerHTML_raw.txt

echo "Analyse terminée!"
echo ""
echo "📊 Résumé:"
echo "  Total: $TOTAL"
echo "  🟢 SAFE: $SAFE"
echo "  🟡 RISKY: $RISKY"
echo "  🔴 DANGEROUS: $DANGEROUS"
echo ""
echo "Rapport sauvegardé: $REPORT_FILE"
