#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lire le fichier
const filePath = path.join(__dirname, 'public', 'beta-combined-dashboard.html');
let content = fs.readFileSync(filePath, 'utf8');

// Nouveau prompt OpenAI du soir
const newEveningOpenAIPrompt = `📉 Synthèse performance des marchés (indices, secteurs, grandes valeurs) avec % moves, volumes, volatilité, gaps et facteurs clés du jour

🏢 Review résultats d'après-midi : publications intraséance et after-market, analyse des écarts versus consensus, guidance, réactions boursières

🗞️ Événements macro-financiers clés de la journée (Federal Reserve, BCE, discours, annonces) avec résumé des impacts sur taux, devises, actions

📊 Analyse de flux fin de journée : liquidité, pression acheteuse/vendeuse, sentiment options et évolution du VIX, corrélations inter-assets (actions/obligations/devise)

🛠️ Analyse technique de clôture : supports résistances touchés, indicateurs momentum, implications pour la séance suivante

💼 Positionnement institutionnel fin de séance : ajustements, rotations sectorielles, comportements retail avec chiffres

🗓️ À suivre demain : événements macro, earnings, points de vigilance sectoriels

🎯 Recommendations tactiques overnight et open next day : stops, hedging, opportunités, risques à anticiper

Style : Information dense, riche en données et chiffres, 100% sourcé (endpoints Bloomberg, Reuters, sites officiels). Utilisation de graphiques et tableaux intégrés possible (selon format), toujours légendés et référencés. Format clair avec sous-titres, emojis, listes, paragraphes courts pour interface rapide avec prise de décision.`;

// Trouver et remplacer le contenu du prompt OpenAI du soir
const startMarker = '🎯 SYNTHÈSE EXÉCUTIVE APPROFONDIE (6-8 phrases)';
const endMarker = 'STYLE : Voix Emma - Niveau expert institutionnel, 2000-2500 mots, français, avec chiffres précis, références sectorielles détaillées, et recommandations tactiques approfondies`';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const beforePrompt = content.substring(0, startIndex);
    const afterPrompt = content.substring(endIndex + endMarker.length);
    
    content = beforePrompt + newEveningOpenAIPrompt + afterPrompt;
    
    // Écrire le fichier modifié
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Prompt OpenAI du soir mis à jour avec succès');
} else {
    console.log('❌ Marqueurs de début/fin non trouvés');
    console.log('Start marker found:', startIndex !== -1);
    console.log('End marker found:', endIndex !== -1);
}
