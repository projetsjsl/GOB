#!/usr/bin/env node
/**
 * Script pour ajouter l'onglet Terminal Emma IA au dashboard
 * 
 * Ce script modifie beta-combined-dashboard.html pour :
 * 1. Ajouter le script TerminalEmmaIATab.js
 * 2. Ajouter le bouton d'onglet dans la navigation
 * 3. Ajouter le rendu conditionnel du contenu
 * 
 * Usage: node scripts/add-terminal-emma-ia-tab.js
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_FILE = path.join(__dirname, '..', 'public', 'beta-combined-dashboard.html');

console.log('📊 Ajout de l\'onglet Terminal Emma IA au dashboard...\n');

// Lire le fichier
let content = fs.readFileSync(DASHBOARD_FILE, 'utf8');

// 1. Ajouter le script TerminalEmmaIATab.js après EmmAIATab.js
const scriptTag = '<script type="text/babel" src="js/dashboard/components/tabs/TerminalEmmaIATab.js"></script>';
const emmaTabScript = '<script type="text/babel" src="js/dashboard/components/tabs/EmmAIATab.js"></script>';

if (content.includes('TerminalEmmaIATab.js')) {
    console.log('✅ Le script TerminalEmmaIATab.js est déjà présent');
} else if (content.includes(emmaTabScript)) {
    content = content.replace(
        emmaTabScript,
        `${emmaTabScript}\n    <!-- Terminal Emma IA Tab -->\n    ${scriptTag}`
    );
    console.log('✅ Script TerminalEmmaIATab.js ajouté');
} else {
    console.log('⚠️  Impossible de trouver EmmAIATab.js, ajout manuel requis');
}

// 2. Chercher où les onglets sont rendus (pattern à adapter selon votre structure)
// Note: Cette partie nécessite de connaître la structure exacte de votre dashboard
// Vous devrez peut-être l'ajouter manuellement

console.log('\n📝 Instructions pour finaliser l\'intégration :');
console.log('1. Ouvrez public/beta-combined-dashboard.html');
console.log('2. Trouvez où les boutons d\'onglets sont définis');
console.log('3. Ajoutez un bouton pour "Terminal Emma IA"');
console.log('4. Trouvez où le contenu des onglets est rendu');
console.log('5. Ajoutez : {activeTab === \'terminal-emma-ia\' && <TerminalEmmaIATab isDarkMode={isDarkMode} />}');
console.log('\n✅ Script exécuté. Vérifiez le fichier pour les modifications.');

// Sauvegarder
fs.writeFileSync(DASHBOARD_FILE, content, 'utf8');
console.log('\n💾 Fichier sauvegardé');

