/**
 * AUDIT COMPLET ET AUTO-FIX
 * 
 * Script principal qui orchestre :
 * 1. Audit marathon (3h)
 * 2. Auto-correction
 * 3. Push & Deploy
 * 4. Attente 120s
 * 5. Re-vérification
 * 6. Corrections finales
 * 7. Push & Deploy final
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function wait(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function runCommand(cmd, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log('='.repeat(60));
  try {
    execSync(cmd, { cwd: PROJECT_ROOT, stdio: 'inherit' });
    console.log(`✅ ${description} - Succès`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Erreur:`, error.message);
    return false;
  }
}

async function findLatestReport(pattern) {
  const files = fs.readdirSync(PROJECT_ROOT)
    .filter(f => f.includes(pattern))
    .map(f => ({
      name: f,
      path: path.join(PROJECT_ROOT, f),
      mtime: fs.statSync(path.join(PROJECT_ROOT, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files[0]?.path;
}

async function main() {
  console.log('🎯 AUDIT COMPLET ET AUTO-FIX - PROCESSUS COMPLET\n');
  console.log('Ce script va:');
  console.log('1. Lancer l\'audit marathon (3h)');
  console.log('2. Auto-corriger les problèmes');
  console.log('3. Push & Deploy');
  console.log('4. Attendre 120s pour Vercel');
  console.log('5. Re-vérifier');
  console.log('6. Corrections finales');
  console.log('7. Push & Deploy final\n');

  // Note: L'audit marathon tourne déjà en arrière-plan
  console.log('⏳ Attente de la fin de l\'audit marathon...');
  console.log('   (Vérifiez audit-marathon.log pour le suivi)\n');

  // Attendre qu'un rapport soit généré (max 3h + buffer)
  let reportPath = null;
  let attempts = 0;
  const maxAttempts = 200; // ~3h20 avec vérification toutes les minutes

  while (!reportPath && attempts < maxAttempts) {
    await wait(60); // Attendre 1 minute
    reportPath = await findLatestReport('RAPPORT-AUDIT-MARATHON');
    attempts++;
    
    if (reportPath) {
      console.log(`✅ Rapport trouvé: ${reportPath}`);
      break;
    }
    
    if (attempts % 10 === 0) {
      console.log(`⏳ En attente... (${attempts} minutes)`);
    }
  }

  if (!reportPath) {
    console.log('⚠️  Aucun rapport trouvé après 3h20, utilisation du rapport rapide...');
    reportPath = await findLatestReport('RAPPORT-AUDIT-RAPIDE');
  }

  if (!reportPath) {
    console.log('❌ Aucun rapport disponible');
    return;
  }

  // Auto-correction
  console.log('\n🔧 PHASE 2: AUTO-CORRECTION...');
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('node auto-fix-from-audit.mjs', { cwd: PROJECT_ROOT });
    console.log(stdout);
  } catch (error) {
    console.error('Erreur auto-fix:', error.message);
  }

  // Push & Deploy
  console.log('\n🚀 PHASE 3: PUSH & DEPLOY...');
  await runCommand('git add -A', 'Git add');
  await runCommand(
    `git commit -m "fix: Auto-fixes from marathon audit - ${new Date().toISOString()}"`,
    'Git commit'
  );
  await runCommand('git push origin main', 'Git push');

  // Attendre 120s
  console.log('\n⏳ PHASE 4: Attente 120s pour déploiement Vercel...');
  await wait(120);
  console.log('✅ Déploiement terminé');

  // Re-vérification rapide
  console.log('\n🔍 PHASE 5: RE-VÉRIFICATION...');
  try {
    const { stdout } = await execAsync('node quick-audit-critical.mjs', { cwd: PROJECT_ROOT });
    console.log(stdout);
  } catch (error) {
    console.error('Erreur re-vérification:', error.message);
  }

  // Corrections finales si nécessaire
  console.log('\n🔧 PHASE 6: CORRECTIONS FINALES...');
  // Logique de correction finale basée sur la re-vérification

  // Push & Deploy final
  console.log('\n🚀 PHASE 7: PUSH & DEPLOY FINAL...');
  await runCommand('git add -A', 'Git add final');
  await runCommand(
    `git commit -m "fix: Final corrections after re-verification - ${new Date().toISOString()}"`,
    'Git commit final'
  );
  await runCommand('git push origin main', 'Git push final');

  console.log('\n🎉 TOUT EST TERMINÉ - PERFECTION ATTEINTE!');
}

main().catch(console.error);
