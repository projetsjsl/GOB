#!/usr/bin/env python3
import os
import re

TABS_DIR = "/Users/projetsjsl/Documents/GitHub/GOB/public/js/dashboard/components/tabs"

def check_props(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    
    # Chercher la définition du composant
    # Pattern: const ComponentName = ({ ... }) => {
    match = re.search(r'const\s+(\w+)\s*=\s*\(\s*{(.*?)}\s*\)\s*=>', content, re.DOTALL)
    
    if not match:
        # Peut-être qu'il n'utilise pas la déstructuration: const Component = (props) =>
        match_props = re.search(r'const\s+(\w+)\s*=\s*\(\s*props\s*\)\s*=>', content)
        if match_props:
             return "OK (uses props object)"
        return "⚠️ Could not parse component definition"

    component_name = match.group(1)
    props_str = match.group(2)
    
    # Vérifier si activeTab est utilisé dans le code (hors définition)
    body_start = match.end()
    body = content[body_start:]
    
    uses_active_tab = "activeTab" in body
    uses_set_active_tab = "setActiveTab" in body
    
    if not uses_active_tab and not uses_set_active_tab:
        return "✅ Safe (does not use activeTab)"

    # Vérifier si activeTab est dans les props
    has_active_tab_prop = "activeTab" in props_str
    has_set_active_tab_prop = "setActiveTab" in props_str
    
    missing = []
    if uses_active_tab and not has_active_tab_prop:
        missing.append("activeTab")
    if uses_set_active_tab and not has_set_active_tab_prop:
        missing.append("setActiveTab")
        
    if missing:
        return f"❌ Missing props: {', '.join(missing)}"
    
    return "✅ OK"

print("🔍 Checking Tab Components for missing props...")
for filename in sorted(os.listdir(TABS_DIR)):
    if filename.endswith("Tab.js"):
        filepath = os.path.join(TABS_DIR, filename)
        result = check_props(filepath)
        if "❌" in result:
            print(f"{filename}: {result}")
        elif "⚠️" in result:
            # Vérifier si c'est un faux positif (cas spéciaux)
            pass
