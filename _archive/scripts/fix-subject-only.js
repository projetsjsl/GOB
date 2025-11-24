/**
 * Script pour corriger UNIQUEMENT le problème du subject avec \n
 * SANS modifier les connexions ou autres configurations existantes
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function fixSubjectOnly() {
  try {
    console.log('🔍 Récupération du workflow actuel depuis n8n...\n');

    // 1. Récupérer le workflow actuel depuis n8n
    const getResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`Failed to get workflow: ${getResponse.status} - ${errorText}`);
    }

    const currentWorkflow = await getResponse.json();
    console.log(`✅ Workflow actuel récupéré: ${currentWorkflow.name}`);
    console.log(`   Nodes: ${currentWorkflow.nodes.length}`);
    console.log(`   Active: ${currentWorkflow.active}\n`);

    // 2. Trouver et corriger UNIQUEMENT les nœuds qui génèrent le subject
    let modified = false;
    
    // Chercher le nœud "Generate HTML Newsletter"
    const generateHtmlNode = currentWorkflow.nodes.find(n => 
      n.name === 'Generate HTML Newsletter' || 
      n.id === '9f33f73d-349d-48b3-8d6a-a49184737384'
    );

    if (generateHtmlNode && generateHtmlNode.parameters.jsCode) {
      console.log('🔧 Correction du nœud "Generate HTML Newsletter"...');
      
      let jsCode = generateHtmlNode.parameters.jsCode;
      
      // Vérifier si la correction n'est pas déjà présente
      if (!jsCode.includes('cleanSubjectType') || !jsCode.includes('emailSubject')) {
        // Ajouter le nettoyage du subjectType
        if (jsCode.includes('const subjectType = subjectMap[data.prompt_type]')) {
          jsCode = jsCode.replace(
            /const subjectType = subjectMap\[data\.prompt_type\][^;]+;/,
            `const subjectType = subjectMap[data.prompt_type] || data.prompt_type || 'Briefing';\n\n// Nettoyer le subjectType pour supprimer tous les retours à la ligne (Resend n'accepte pas \\n dans subject)\nconst cleanSubjectType = String(subjectType).replace(/[\\n\\r\\t]+/g, ' ').trim();`
          );
        }

        // Remplacer la construction du subject
        if (jsCode.includes("subject: 'Newsletter Emma - Mise à jour du ' + subjectType")) {
          jsCode = jsCode.replace(
            /subject:\s*['"]Newsletter Emma - Mise à jour du ['"]\s*\+\s*subjectType/,
            `// Construire le subject en s'assurant qu'il n'y a pas de retours à la ligne\nconst emailSubject = ('Newsletter Emma - Mise à jour du ' + cleanSubjectType)\n  .replace(/[\\n\\r\\t]+/g, ' ')  // Remplacer tous les retours à la ligne par des espaces\n  .replace(/\\s+/g, ' ')        // Remplacer les espaces multiples par un seul espace\n  .trim();                     // Supprimer les espaces en début/fin\n\n    subject: emailSubject`
          );
        }

        generateHtmlNode.parameters.jsCode = jsCode;
        modified = true;
        console.log('   ✅ Code JavaScript corrigé');
      } else {
        console.log('   ⚪ Correction déjà présente');
      }
    }

    // Chercher le nœud "Process Recipients"
    const processRecipientsNode = currentWorkflow.nodes.find(n => 
      n.name === 'Process Recipients' || 
      n.id === 'process-recipients-node'
    );

    if (processRecipientsNode && processRecipientsNode.parameters.jsCode) {
      console.log('🔧 Correction du nœud "Process Recipients"...');
      
      let jsCode = processRecipientsNode.parameters.jsCode;
      
      // Vérifier si la correction n'est pas déjà présente
      if (!jsCode.includes('Nettoyer le subject pour supprimer tous les retours à la ligne')) {
        // Ajouter le nettoyage avant le return
        if (jsCode.includes('subject = subject ||') && !jsCode.includes('Nettoyer le subject')) {
          jsCode = jsCode.replace(
            /if \(!subject\) \{[^}]+\}/,
            `if (!subject) {\n  console.warn('⚠️  subject manquant, utilisation d\\'un sujet par défaut');\n  subject = subject || \`Newsletter Emma - Mise à jour du \${normalizedType}\`;\n}\n\n// Nettoyer le subject pour supprimer tous les retours à la ligne (Resend n'accepte pas \\n dans subject)\nsubject = String(subject)\n  .replace(/[\\n\\r\\t]+/g, ' ')  // Remplacer tous les retours à la ligne par des espaces\n  .replace(/\\s+/g, ' ')        // Remplacer les espaces multiples par un seul espace\n  .trim();                     // Supprimer les espaces en début/fin`
          );
        }

        processRecipientsNode.parameters.jsCode = jsCode;
        modified = true;
        console.log('   ✅ Code JavaScript corrigé');
      } else {
        console.log('   ⚪ Correction déjà présente');
      }
    }

    if (!modified) {
      console.log('\n✅ Aucune modification nécessaire - les corrections sont déjà présentes');
      return;
    }

    // 3. Mettre à jour UNIQUEMENT les nœuds modifiés (préserver tout le reste)
    console.log('\n🔄 Mise à jour du workflow avec les corrections...');
    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify({
        name: currentWorkflow.name,
        nodes: currentWorkflow.nodes, // Tous les nœuds avec les corrections
        connections: currentWorkflow.connections, // Préserver toutes les connexions
        settings: currentWorkflow.settings, // Préserver les settings
        staticData: currentWorkflow.staticData, // Préserver staticData
        active: currentWorkflow.active // Préserver l'état actif/inactif
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`❌ Erreur mise à jour: ${updateResponse.status}`);
      console.error(errorText);
      throw new Error(`Failed to update workflow: ${updateResponse.status}`);
    }

    const updatedWorkflow = await updateResponse.json();
    console.log('✅ Workflow mis à jour avec succès!');
    console.log(`   ID: ${updatedWorkflow.id}`);
    console.log(`   Nom: ${updatedWorkflow.name}`);
    console.log(`   Nodes: ${updatedWorkflow.nodes.length}`);
    console.log(`   Active: ${updatedWorkflow.active}`);
    console.log(`\n🔗 URL: ${N8N_URL}/workflow/${updatedWorkflow.id}`);

    console.log('\n📋 Corrections appliquées:');
    console.log('   ✅ Nettoyage du subject dans "Generate HTML Newsletter"');
    console.log('   ✅ Nettoyage du subject dans "Process Recipients"');
    console.log('   ✅ Toutes les connexions préservées');
    console.log('   ✅ Toutes les configurations préservées');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécuter
fixSubjectOnly();

