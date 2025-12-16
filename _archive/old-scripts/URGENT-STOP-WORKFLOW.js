/**
 * URGENCE : Désactiver immédiatement le workflow n8n
 * pour arrêter les envois multiples d'emails
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workflowPath = join(__dirname, 'n8n-workflow-03lgcA4e9uRTtli1.json');
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

// DÉSACTIVER LE WORKFLOW IMMÉDIATEMENT
workflow.active = false;

console.log('🚨 URGENCE : Workflow DÉSACTIVÉ');
console.log('   Le workflow ne s\'exécutera plus automatiquement.');

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
console.log('✅ Workflow sauvegardé avec active=false');
console.log('\n⚠️  IMPORTANT :');
console.log('   1. Le workflow est maintenant DÉSACTIVÉ dans le fichier');
console.log('   2. Vous devez aussi le DÉSACTIVER dans n8n Cloud :');
console.log('      https://projetsjsl.app.n8n.cloud/workflow/03lgcA4e9uRTtli1');
console.log('   3. Cliquez sur le toggle "Active" pour le désactiver');
console.log('\n🔍 Pour diagnostiquer le problème :');
console.log('   - Vérifiez les exécutions dans n8n pour voir ce qui a déclenché 80 messages');
console.log('   - Vérifiez si le Schedule Trigger s\'est déclenché plusieurs fois');
console.log('   - Vérifiez si le Gmail Trigger a détecté plusieurs emails');

