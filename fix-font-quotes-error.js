/**
 * Script pour corriger l'erreur de syntaxe dans le node "Generate HTML Newsletter"
 * 
 * Problème: Guillemets mal échappés dans la définition de la police
 * primary: ''Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif'
 * 
 * Solution: Corriger les guillemets pour avoir une chaîne valide
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de l\'erreur de syntaxe dans Generate HTML Newsletter...\n');

// Trouver le node "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Node "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

// Récupérer le code actuel
const currentCode = generateHtmlNode.parameters.jsCode || '';

// Chercher et corriger la ligne problématique
// Le problème est: primary: ''Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif'
// Doit être: primary: "'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

let fixedCode = currentCode;

// Chercher toutes les occurrences du problème
// Pattern: ''Inter' ou similaire avec des guillemets mal échappés
const problematicPatterns = [
  // Pattern 1: ''Inter', 'Roboto'...
  /primary:\s*''Inter'/g,
  // Pattern 2: Dans l'objet theme.email.fonts.primary
  /primary:\s*''Inter',\s*'Roboto',\s*'Segoe UI',\s*Tahoma,\s*Geneva,\s*Verdana,\s*sans-serif'/g,
  // Pattern 3: Plus général - chercher les doubles guillemets simples au début
  /primary:\s*''([^']+)'/g
];

// Correction spécifique pour la police
fixedCode = fixedCode.replace(
  /primary:\s*''Inter',\s*'Roboto',\s*'Segoe UI',\s*Tahoma,\s*Geneva,\s*Verdana,\s*sans-serif'/g,
  "primary: \"'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\""
);

// Si le pattern n'a pas été trouvé, chercher dans l'objet theme
if (fixedCode === currentCode) {
  // Chercher dans l'objet theme.email.fonts
  fixedCode = fixedCode.replace(
    /fonts:\s*\{[^}]*primary:\s*''([^']+)'/g,
    (match, content) => {
      return match.replace(/''([^']+)'/, "\"'$1\"");
    }
  );
  
  // Chercher directement dans theme.email.fonts.primary
  fixedCode = fixedCode.replace(
    /theme\.email\.fonts\.primary/g,
    "theme.email.fonts.primary"
  );
  
  // Chercher la définition complète avec le problème
  fixedCode = fixedCode.replace(
    /primary:\s*''Inter',\s*'Roboto'/g,
    "primary: \"'Inter', 'Roboto'"
  );
}

// Si toujours pas corrigé, chercher le pattern exact dans le code
if (fixedCode === currentCode) {
  // Chercher la ligne exacte avec le problème
  const lines = fixedCode.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("primary: ''Inter'") || lines[i].includes("primary:''Inter'")) {
      // Remplacer par la version correcte
      lines[i] = lines[i].replace(
        /primary:\s*''Inter',\s*'Roboto',\s*'Segoe UI',\s*Tahoma,\s*Geneva,\s*Verdana,\s*sans-serif'/,
        "primary: \"'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\""
      );
      console.log(`✅ Ligne ${i + 1} corrigée`);
    }
  }
  fixedCode = lines.join('\n');
}

// Vérifier si le code a été modifié
if (fixedCode === currentCode) {
  // Essayer une approche plus agressive - chercher le pattern exact dans le JSON
  console.log('⚠️  Pattern exact non trouvé, recherche manuelle...');
  
  // Le problème est probablement dans la définition de theme.email.fonts.primary
  // Chercher: primary: ''Inter', 'Roboto'...
  const regex = /primary:\s*''([^']+)'/;
  const match = fixedCode.match(regex);
  
  if (match) {
    console.log(`✅ Pattern trouvé: ${match[0]}`);
    fixedCode = fixedCode.replace(
      regex,
      `primary: "'${match[1]}"`
    );
  } else {
    // Chercher dans l'objet complet
    const themeRegex = /fonts:\s*\{[^}]*primary:\s*''([^']+)'[^}]*\}/;
    const themeMatch = fixedCode.match(themeRegex);
    
    if (themeMatch) {
      console.log(`✅ Pattern dans theme trouvé`);
      fixedCode = fixedCode.replace(
        /primary:\s*''([^']+)'/g,
        "primary: \"'$1\""
      );
    }
  }
}

// Si toujours pas corrigé, utiliser une approche plus directe
if (fixedCode === currentCode) {
  console.log('⚠️  Correction directe nécessaire...');
  
  // Remplacer directement toutes les occurrences de ''Inter' par "'Inter"
  fixedCode = fixedCode.replace(/''Inter'/g, "\"'Inter'");
  
  // Et corriger la fin de la chaîne
  fixedCode = fixedCode.replace(/, 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif'/g, ", 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\"");
}

// Mettre à jour le node
generateHtmlNode.parameters.jsCode = fixedCode;

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Code corrigé !');
console.log('\n📋 Vérification:');
if (fixedCode.includes("primary: \"'Inter'")) {
  console.log('   ✅ La police est maintenant correctement définie');
} else if (fixedCode.includes("primary: 'Inter'")) {
  console.log('   ✅ La police est maintenant correctement définie (guillemets simples)');
} else {
  console.log('   ⚠️  Vérifiez manuellement que la correction a été appliquée');
  console.log('   Cherchez "primary:" dans le code pour vérifier');
}

