/**
 * Script de validation automatique du workflow n8n
 * Vérifie les erreurs courantes avant l'import
 */

import { readFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';

console.log('🔍 Validation du workflow n8n...\n');

try {
  const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));
  const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

  if (!generateHtmlNode) {
    console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
    process.exit(1);
  }

  const code = generateHtmlNode.parameters.jsCode;
  const errors = [];
  const warnings = [];

  // 1. Vérifier les erreurs de syntaxe courantes
  console.log('1. Vérification des erreurs de syntaxe...');
  
  if (code.includes('cconst ')) {
    errors.push('❌ "cconst" trouvé (devrait être "const")');
  }
  
  if (code.match(/[^c]onst emma(ExecutionTime|Confidence)/)) {
    errors.push('❌ "onst" trouvé sans "c" (devrait être "const")');
  }

  // Vérifier les duplications de déclarations
  if (code.includes('const htmlParts = [const htmlParts = [')) {
    errors.push('❌ Duplication de "const htmlParts = [" trouvée');
  }
  
  // Vérifier les autres duplications courantes
  const duplicatePatterns = [
    /const\s+(\w+)\s*=\s*const\s+\1\s*=/,
    /let\s+(\w+)\s*=\s*let\s+\1\s*=/,
    /var\s+(\w+)\s*=\s*var\s+\1\s*=/
  ];
  
  duplicatePatterns.forEach((pattern, idx) => {
    if (pattern.test(code)) {
      errors.push(`❌ Duplication de déclaration trouvée (pattern ${idx + 1})`);
    }
  });

  // 2. Vérifier que htmlParts est déclaré avant d'être utilisé
  console.log('2. Vérification de l\'ordre des déclarations...');
  
  const extractIdx = code.indexOf('function extractPreheaderText');
  const preheaderIdx = code.indexOf('const preheaderText');
  const htmlPartsIdx = code.indexOf('const htmlParts = [');
  const htmlPartsEnd = code.indexOf('];', htmlPartsIdx);
  const pushPreheaderIdx = code.indexOf('htmlParts.push(\'  <!-- Preheader');

  if (extractIdx === -1) {
    errors.push('❌ extractPreheaderText non défini');
  }
  if (preheaderIdx === -1) {
    errors.push('❌ preheaderText non défini');
  }
  if (htmlPartsIdx === -1) {
    errors.push('❌ htmlParts non déclaré');
  }

  if (extractIdx !== -1 && preheaderIdx !== -1 && htmlPartsIdx !== -1) {
    if (extractIdx > preheaderIdx) {
      errors.push('❌ extractPreheaderText doit être défini AVANT preheaderText');
    }
    if (preheaderIdx > htmlPartsIdx) {
      errors.push('❌ preheaderText doit être défini AVANT htmlParts');
    }
  }

  // 3. Vérifier que le preheader n'est PAS dans le tableau htmlParts
  console.log('3. Vérification du preheader dans le tableau...');
  
  if (htmlPartsIdx !== -1 && htmlPartsEnd !== -1) {
    const arrayContent = code.substring(htmlPartsIdx, htmlPartsEnd);
    
    // Vérifier l'apostrophe problématique
    if (arrayContent.includes("l'apercu") && !arrayContent.includes("l\\'apercu")) {
      errors.push('❌ Apostrophe non échappée dans le tableau htmlParts (l\'apercu)');
    }
    
    // Vérifier que le preheader n'est pas dans le tableau
    if (arrayContent.includes('Preheader text') || 
        arrayContent.includes('display: none') && arrayContent.includes('preheaderText')) {
      errors.push('❌ Preheader trouvé dans le tableau htmlParts (doit être ajouté avec push() après)');
    }
  }

  // 4. Vérifier que le preheader est ajouté avec push() APRÈS htmlParts
  console.log('4. Vérification de l\'ajout du preheader...');
  
  if (pushPreheaderIdx !== -1 && htmlPartsEnd !== -1) {
    if (pushPreheaderIdx < htmlPartsEnd) {
      errors.push('❌ htmlParts.push() du preheader est AVANT la fermeture de htmlParts');
    }
  } else {
    warnings.push('⚠️  Preheader non ajouté avec push() (peut être normal si retiré)');
  }

  // 5. Vérifier les virgules orphelines
  console.log('5. Vérification des virgules orphelines...');
  
  if (code.match(/,\s*,\s*'/)) {
    errors.push('❌ Virgule orpheline trouvée (double virgule)');
  }

  // 6. Vérifier que les variables sont utilisées après déclaration
  console.log('6. Vérification de l\'utilisation des variables...');
  
  if (htmlPartsIdx !== -1) {
    const beforeHtmlParts = code.substring(0, htmlPartsIdx);
    if (beforeHtmlParts.includes('htmlParts.push') || beforeHtmlParts.includes('htmlParts[')) {
      errors.push('❌ htmlParts utilisé AVANT sa déclaration');
    }
  }

  // Afficher les résultats
  console.log('\n' + '='.repeat(60));
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Aucune erreur trouvée ! Le workflow est valide.\n');
    process.exit(0);
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ ${errors.length} erreur(s) trouvée(s):\n`);
      errors.forEach((error, idx) => console.log(`   ${idx + 1}. ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} avertissement(s):\n`);
      warnings.forEach((warning, idx) => console.log(`   ${idx + 1}. ${warning}`));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n❌ Le workflow contient des erreurs. Corrigez-les avant l\'import.');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Erreur lors de la validation:', error.message);
  process.exit(1);
}

