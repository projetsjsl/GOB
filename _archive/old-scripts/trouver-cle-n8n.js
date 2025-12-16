#!/usr/bin/env node
/**
 * Script pour trouver où se trouve la clé API n8n
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile(filename) {
  const filePath = join(__dirname, filename);
  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^N8N_API_KEY\s*=\s*(.+)$/i);
          if (match) {
            const value = match[1].replace(/^["']|["']$/g, '');
            return { found: true, file: filename, value };
          }
        }
      }
      return { found: false, file: filename };
    } catch (error) {
      return { found: false, file: filename, error: error.message };
    }
  }
  return { found: false, file: filename, exists: false };
}

function checkVercelEnv() {
  try {
    // Vérifier si vercel CLI est disponible
    execSync('which vercel', { stdio: 'ignore' });
    
    // Essayer de lister les variables
    try {
      const output = execSync('vercel env ls 2>&1', { encoding: 'utf-8', stdio: 'pipe' });
      if (output.includes('N8N_API_KEY') || output.toLowerCase().includes('n8n')) {
        return { found: true, source: 'Vercel CLI' };
      }
      return { found: false, source: 'Vercel CLI', message: 'Variable non trouvée dans la liste' };
    } catch (error) {
      if (error.message.includes('No existing credentials')) {
        return { found: false, source: 'Vercel CLI', message: 'Non connecté à Vercel (run: vercel login)' };
      }
      return { found: false, source: 'Vercel CLI', error: error.message };
    }
  } catch (error) {
    return { found: false, source: 'Vercel CLI', message: 'Vercel CLI non installé' };
  }
}

function checkProcessEnv() {
  if (process.env.N8N_API_KEY) {
    return { found: true, source: 'Variable d\'environnement système', value: process.env.N8N_API_KEY };
  }
  return { found: false, source: 'Variable d\'environnement système' };
}

async function main() {
  log('\n🔍 Recherche de N8N_API_KEY...', 'cyan');
  log('='.repeat(70), 'cyan');
  
  let found = false;
  
  // 1. Vérifier les fichiers .env
  log('\n📁 1. Fichiers locaux (.env, .env.local, etc.)', 'blue');
  const envFiles = ['.env.local', '.env', '.env.production', '.env.development'];
  
  for (const envFile of envFiles) {
    const result = checkEnvFile(envFile);
    if (result.found) {
      log(`   ✅ Trouvé dans ${envFile}`, 'green');
      const masked = result.value.length > 8 
        ? `${result.value.substring(0, 4)}...${result.value.substring(result.value.length - 4)}`
        : '***';
      log(`      Valeur: ${masked}`, 'gray');
      found = true;
    } else if (result.exists === false) {
      log(`   ⚪ ${envFile} n'existe pas`, 'gray');
    } else {
      log(`   ⚪ ${envFile} existe mais N8N_API_KEY non trouvée`, 'gray');
    }
  }
  
  // 2. Vérifier les variables d'environnement système
  log('\n💻 2. Variables d\'environnement système', 'blue');
  const processResult = checkProcessEnv();
  if (processResult.found) {
    log(`   ✅ Trouvé dans ${processResult.source}`, 'green');
    const masked = processResult.value.length > 8 
      ? `${processResult.value.substring(0, 4)}...${processResult.value.substring(processResult.value.length - 4)}`
      : '***';
    log(`      Valeur: ${masked}`, 'gray');
    found = true;
  } else {
    log(`   ⚪ ${processResult.source}: Non définie`, 'gray');
  }
  
  // 3. Vérifier Vercel
  log('\n☁️  3. Vercel (Variables d\'environnement)', 'blue');
  const vercelResult = checkVercelEnv();
  if (vercelResult.found) {
    log(`   ✅ Trouvé dans ${vercelResult.source}`, 'green');
    log(`      Pour récupérer: vercel env pull .env.local`, 'yellow');
    found = true;
  } else {
    log(`   ⚪ ${vercelResult.source}: ${vercelResult.message || 'Non trouvée'}`, 'gray');
    if (vercelResult.message && vercelResult.message.includes('Non connecté')) {
      log(`      Solution: vercel login`, 'yellow');
    }
  }
  
  // Résumé
  log('\n' + '='.repeat(70), 'cyan');
  
  if (found) {
    log('\n✅ Clé API trouvée!', 'green');
    log('\n💡 Pour l\'utiliser:', 'yellow');
    log('   node connect-n8n-with-vercel.js', 'blue');
  } else {
    log('\n⚠️  Clé API non trouvée localement', 'yellow');
    log('\n📍 Où la trouver:', 'cyan');
    log('\n1️⃣  Dans Vercel Dashboard (Recommandé):', 'blue');
    log('   → https://vercel.com/dashboard', 'gray');
    log('   → Sélectionnez votre projet GOB', 'gray');
    log('   → Settings → Environment Variables', 'gray');
    log('   → Cherchez N8N_API_KEY', 'gray');
    log('\n2️⃣  Dans l\'interface n8n:', 'blue');
    log('   → https://projetsjsl.app.n8n.cloud', 'gray');
    log('   → Settings → API', 'gray');
    log('   → Créez ou copiez votre API key', 'gray');
    log('\n3️⃣  Récupérer depuis Vercel:', 'blue');
    log('   vercel login', 'yellow');
    log('   vercel env pull .env.local', 'yellow');
    log('   grep N8N_API_KEY .env.local', 'yellow');
    log('\n4️⃣  Utiliser le script automatique:', 'blue');
    log('   ./get-n8n-api-key.sh', 'yellow');
  }
  
  log('\n' + '='.repeat(70), 'cyan');
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

