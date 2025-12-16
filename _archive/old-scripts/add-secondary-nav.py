#!/usr/bin/env python3
"""
Script pour ajouter automatiquement le SecondaryNavBar à tous les tabs.
"""

import re
import os

TABS_DIR = "/Users/projetsjsl/Documents/GitHub/GOB/public/js/dashboard/components/tabs"
EXCLUDE_TABS = ["AskEmmaTab.js", "PlusTab.js", "AdminJSLaiTab.js"]

# Le code à insérer (basé sur PlusTab.js)
SECONDARY_NAV_CODE = """            {/* Navigation Secondaire */}
            {window.SecondaryNavBar && (
                <window.SecondaryNavBar 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab} 
                    isDarkMode={isDarkMode} 
                />
            )}

"""

def add_secondary_nav(filepath):
    """Ajoute le SecondaryNavBar à un fichier tab."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Vérifier si déjà présent
    if 'window.SecondaryNavBar' in content:
        return False, "Already has SecondaryNavBar"
    
    # Chercher le premier return avec <div
    # Pattern: return (\n   <div
    pattern = r'(return\s*\(\s*\n\s*<div[^>]*>)'
    
    matches = list(re.finditer(pattern, content))
    if not matches:
        return False, "Could not find return statement with <div>"
    
    # Prendre le premier match
    match = matches[0]
    insert_pos = match.end()
    
    # Insérer le code
    new_content = content[:insert_pos] + '\n' + SECONDARY_NAV_CODE + content[insert_pos:]
    
    # Écrire le nouveau contenu
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True, "SecondaryNavBar added successfully"

def main():
    print("🚀 Adding SecondaryNavBar to all tabs...\n")
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for filename in sorted(os.listdir(TABS_DIR)):
        if not filename.endswith('Tab.js'):
            continue
        
        if filename in EXCLUDE_TABS:
            print(f"⏭️  Skip: {filename} (already has SecondaryNavBar)")
            skip_count += 1
            continue
        
        filepath = os.path.join(TABS_DIR, filename)
        
        success, message = add_secondary_nav(filepath)
        
        if success:
            print(f"✅ {filename}: {message}")
            success_count += 1
        else:
            print(f"⚠️  {filename}: {message}")
            error_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Added: {success_count}")
    print(f"   ⏭️  Skipped: {skip_count}")
    print(f"   ⚠️  Errors: {error_count}")

if __name__ == "__main__":
    main()
