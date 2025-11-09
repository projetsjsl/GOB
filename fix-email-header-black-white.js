/**
 * Corriger le header de l'email pour utiliser toujours un thème noir/blanc
 * indépendamment du type de briefing
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🎨 Correction du header pour thème noir/blanc permanent...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
const currentCode = generateHtmlNode.parameters.jsCode;

// Remplacer la définition du thème pour utiliser un header noir/blanc permanent
// Le header utilisera toujours un gradient noir/gris/blanc
const blackWhiteHeaderGradient = 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)';

// Chercher où le gradient primary est défini et utilisé pour le header
// On va modifier pour que le header utilise toujours le gradient noir/blanc

// Option 1: Si le code utilise déjà briefingTypes, on modifie juste le header
if (currentCode.includes('briefingTypes')) {
  console.log('🔧 Modification du header pour utiliser le gradient noir/blanc permanent...');
  
  // Remplacer la définition des briefingTypes pour que tous utilisent le même header
  const updatedCode = currentCode.replace(
    /briefingTypes\s*=\s*\{[\s\S]*?\};/,
    `briefingTypes = {
  morning: {
    headerGradient: '${blackWhiteHeaderGradient}',
    backgroundColor: '#fef3c7',
    tickerBoxGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    tickerBoxBorder: '#f59e0b',
    tickerTextColor: '#92400e',
    emoji: '🌅'
  },
  midday: {
    headerGradient: '${blackWhiteHeaderGradient}',
    backgroundColor: '#eff6ff',
    tickerBoxGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    tickerBoxBorder: '#3b82f6',
    tickerTextColor: '#1e40af',
    emoji: '☀️'
  },
  evening: {
    headerGradient: '${blackWhiteHeaderGradient}',
    backgroundColor: '#f3e8ff',
    tickerBoxGradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    tickerBoxBorder: '#8b5cf6',
    tickerTextColor: '#6b21a8',
    emoji: '🌆'
  },
  custom: {
    headerGradient: '${blackWhiteHeaderGradient}',
    backgroundColor: '#f8fafc',
    tickerBoxGradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    tickerBoxBorder: '#6366f1',
    tickerTextColor: '#ffffff',
    emoji: '📊'
  }
};`
  );
  
  generateHtmlNode.parameters.jsCode = updatedCode;
  console.log('✅ Header modifié pour utiliser le gradient noir/blanc permanent');
} else {
  // Option 2: Si le code n'utilise pas encore briefingTypes, on ajoute la logique
  console.log('🔧 Ajout de la logique pour header noir/blanc permanent...');
  
  // Trouver où theme.gradients.primary est défini
  const themeGradientMatch = currentCode.match(/gradients:\s*\{[\s\S]*?primary:\s*['"]([^'"]+)['"]/);
  
  if (themeGradientMatch) {
    // Remplacer le gradient primary par le gradient noir/blanc
    const updatedCode = currentCode.replace(
      /gradients:\s*\{[\s\S]*?primary:\s*['"][^'"]+['"]/,
      `gradients: {
    primary: '${blackWhiteHeaderGradient}'`
    );
    
    generateHtmlNode.parameters.jsCode = updatedCode;
    console.log('✅ Gradient primary remplacé par le gradient noir/blanc');
  } else {
    // Si on ne trouve pas, on ajoute une constante pour le header
    const headerConstant = `\n// Header toujours noir/blanc indépendamment du type\nconst HEADER_GRADIENT = '${blackWhiteHeaderGradient}';\n\n`;
    
    // Insérer après la définition du thème
    const themeEnd = currentCode.indexOf('};', currentCode.indexOf('const theme = {'));
    if (themeEnd !== -1) {
      const updatedCode = currentCode.substring(0, themeEnd + 2) + headerConstant + currentCode.substring(themeEnd + 2);
      
      // Remplacer l'utilisation dans le header
      const finalCode = updatedCode.replace(
        /'      background: ' \+ theme\.gradients\.primary \+ ';/g,
        `'      background: ' + HEADER_GRADIENT + ';`
      );
      
      generateHtmlNode.parameters.jsCode = finalCode;
      console.log('✅ Constante HEADER_GRADIENT ajoutée et utilisée');
    }
  }
}

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Modifications apportées :');
console.log('   ✅ Header toujours noir/blanc (gradient: #1f2937 → #374151 → #4b5563)');
console.log('   ✅ Indépendant du type de briefing (morning/midday/evening/custom)');
console.log('   ✅ Thématique cohérente noir/blanc pour tous les emails');

