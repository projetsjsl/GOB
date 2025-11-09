/**
 * Corriger le thème de couleurs de l'email pour utiliser les couleurs appropriées
 * selon le type de briefing (morning/midday/evening/custom)
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🎨 Correction du thème de couleurs de l\'email...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
const currentCode = generateHtmlNode.parameters.jsCode;

// Vérifier si le code utilise déjà les couleurs par type
if (currentCode.includes('briefingTypes') || currentCode.includes('morning') && currentCode.includes('headerGradient')) {
  console.log('⚠️  Le workflow semble déjà utiliser les couleurs par type');
  console.log('   Vérifiez que les couleurs sont correctement appliquées');
} else {
  console.log('🔧 Mise à jour du code pour utiliser les couleurs par type de briefing...');
  
  // Extraire la partie du code qui définit le thème
  // On va modifier pour utiliser les couleurs selon le type de briefing
  const updatedCode = currentCode.replace(
    /const theme = \{[\s\S]*?\};/,
    `// ============================================
// COULEURS PAR TYPE DE BRIEFING
// ============================================
const briefingTypes = {
  morning: {
    headerGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    backgroundColor: '#fef3c7',
    tickerBoxGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    tickerBoxBorder: '#f59e0b',
    tickerTextColor: '#92400e',
    emoji: '🌅'
  },
  midday: {
    headerGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    backgroundColor: '#eff6ff',
    tickerBoxGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    tickerBoxBorder: '#3b82f6',
    tickerTextColor: '#1e40af',
    emoji: '☀️'
  },
  evening: {
    headerGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    backgroundColor: '#f3e8ff',
    tickerBoxGradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    tickerBoxBorder: '#8b5cf6',
    tickerTextColor: '#6b21a8',
    emoji: '🌆'
  },
  custom: {
    headerGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    backgroundColor: '#f8fafc',
    tickerBoxGradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    tickerBoxBorder: '#6366f1',
    tickerTextColor: '#ffffff',
    emoji: '📊'
  }
};

// Déterminer le type de briefing
let briefingType = data.prompt_type || 'custom';
if (briefingType === 'noon') {
  briefingType = 'midday';
}

// Sélectionner les couleurs selon le type
const typeColors = briefingTypes[briefingType] || briefingTypes.custom;

const theme = {
  colors: {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#8b5cf6',
    success: '#10b981',
    text: {
      dark: '#1f2937',
      medium: '#4b5563',
      light: '#6b7280',
      muted: '#9ca3af'
    },
    background: {
      white: '#ffffff',
      light: '#f8fafc',
      medium: '#f1f5f9',
      dark: '#e2e8f0'
    },
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db'
    }
  },
  gradients: {
    primary: typeColors.headerGradient, // Utiliser le gradient selon le type
    primaryAlt: typeColors.tickerBoxGradient,
    secondary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  },
  briefingType: briefingType,
  typeColors: typeColors,
  email: {
    fonts: {
      primary: "'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    spacing: {
      containerMaxWidth: '700px',
      padding: {
        small: '20px',
        medium: '30px',
        large: '40px'
      },
      borderRadius: {
        small: '8px',
        medium: '12px',
        large: '16px'
      }
    },
    shadows: {
      small: '0 2px 4px rgba(0, 0, 0, 0.05)',
      medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
      large: '0 10px 25px rgba(99, 102, 241, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)',
      primary: '0 4px 12px rgba(99, 102, 241, 0.15)'
    }
  }
};`
  );
  
  // Mettre à jour aussi la partie qui utilise le gradient dans le header
  // Remplacer theme.gradients.primary par le gradient du type
  const finalCode = updatedCode.replace(
    /'      background: ' \+ theme\.gradients\.primary \+ ';/g,
    "'      background: " + typeColors.headerGradient + ";"
  ).replace(
    /background: theme\.gradients\.primary/g,
    "background: typeColors.headerGradient"
  );
  
  generateHtmlNode.parameters.jsCode = finalCode;
  console.log('✅ Code mis à jour pour utiliser les couleurs par type de briefing');
}

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Couleurs par type de briefing :');
console.log('   🌅 Morning : Gradient orange/jaune (#f59e0b → #fbbf24)');
console.log('   ☀️  Midday : Gradient bleu (#3b82f6 → #2563eb)');
console.log('   🌆 Evening : Gradient violet (#8b5cf6 → #7c3aed)');
console.log('   📊 Custom : Gradient purple/indigo (#6366f1 → #8b5cf6)');

