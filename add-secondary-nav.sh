#!/bin/bash
# Script pour ajouter le SecondaryNavBar à tous les tabs qui ne l'ont pas encore

TABS_DIR="/Users/projetsjsl/Documents/GitHub/GOB/public/js/dashboard/components/tabs"

# Liste des tabs qui ont déjà le SecondaryNavBar (à exclure)
EXCLUDE_TABS=("AskEmmaTab.js" "PlusTab.js" "AdminJSLaiTab.js")

# Liste de tous les fichiers *Tab.js
cd "$TABS_DIR"

for tab_file in *Tab.js; do
    # Vérifier si ce fichier est dans la liste d'exclusion
    skip=false
    for exclude in "${EXCLUDE_TABS[@]}"; do
        if [ "$tab_file" = "$exclude" ]; then
            skip=true
            break
        fi
    done
    
    if [ "$skip" = true ]; then
        echo "⏭️  Skip: $tab_file (already has SecondaryNavBar)"
        continue
    fi
    
    # Vérifier si le fichier contient déjà window.SecondaryNavBar
    if grep -q "window.SecondaryNavBar" "$tab_file"; then
        echo "✅ Skip: $tab_file (already has SecondaryNavBar)"
        continue
    fi
    
    echo "🔧 Processing: $tab_file"
    
    # Ajouter le SecondaryNavBar au début du return statement
    # On cherche le premier "return (" et on insère le SecondaryNavBar après <div>
    
    # Cette opération est complexe via sed, donc on va créer un fichier temporaire
    # et utiliser awk/sed pour l'insertion
    
    echo "   Adding SecondaryNavBar..."
    
    # On va ajouter à la main pour chaque fichier
    # Pour l'instant, on liste juste les fichiers à modifier
    echo "   ⚠️  Needs manual addition"
done

echo ""
echo "✅ Scan completed!"
echo "📝 Files needing manual SecondaryNavBar addition:"
ls -1 *.js | grep -v -E "(AskEmmaTab|PlusTab|AdminJSLaiTab)" | grep "Tab.js"
