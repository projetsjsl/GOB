/**
 * Script de build pour Vercel
 * Copie les fichiers statiques de public/ vers dist/
 * Construit également l'application 3p1
 */

import { mkdir, cp, readdir, stat, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const PUBLIC_DIR = 'public';
const DIST_DIR = 'dist';
const APP_3P1_DIR = join(PUBLIC_DIR, '3p1');

async function build() {
  try {
    console.log('📦 Démarrage du build...');

    // Construire l'application 3p1 si elle existe
    if (existsSync(APP_3P1_DIR)) {
      console.log('🔨 Construction de l\'application 3p1...');
      try {
        // Toujours installer les dépendances (nécessaire sur Vercel)
        console.log('📦 Installation des dépendances 3p1...');
        execSync('npm install', {
          cwd: APP_3P1_DIR,
          stdio: 'inherit',
          env: { ...process.env } // Ne pas forcer production ici pour installer les devDependencies (vite)
        });

        // Construire l'application
        console.log('🔨 Build de l\'application 3p1...');
        execSync('npm run build', {
          cwd: APP_3P1_DIR,
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'production' }
        });

        // Vérifier que le build a réussi
        const distPath = join(APP_3P1_DIR, 'dist', 'assets', 'index.js');
        if (existsSync(distPath)) {
          console.log('✅ Application 3p1 construite avec succès');
          console.log(`✅ Fichier trouvé: ${distPath}`);

          // Lister les fichiers dans dist pour debug
          const distDir = join(APP_3P1_DIR, 'dist');
          if (existsSync(distDir)) {
            const files = await readdir(distDir, { recursive: true });
            console.log(`📁 Fichiers dans dist: ${files.slice(0, 10).join(', ')}...`);
          }
        } else {
          console.warn(`⚠️ Fichier de build non trouvé: ${distPath}`);
          // Lister le contenu de dist pour debug
          const distDir = join(APP_3P1_DIR, 'dist');
          if (existsSync(distDir)) {
            try {
              const files = await readdir(distDir, { recursive: true });
              console.log(`📁 Contenu de dist: ${files.join(', ')}`);
            } catch (e) {
              console.warn('⚠️ Impossible de lire le contenu de dist:', e.message);
            }
          }
          throw new Error('Build 3p1 réussi mais fichier index.js non trouvé');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la construction de 3p1:', error.message);
        console.error('❌ Stack:', error.stack);
        // Ne pas continuer si le build échoue - c'est critique
        throw error;
      }
    }

    // Créer la structure Vercel Build Output API
    // https://vercel.com/docs/build-output-api/v3
    const VERCEL_OUTPUT = '.vercel/output';
    const STATIC_DIR = join(VERCEL_OUTPUT, 'static');

    console.log('📦 Création de la structure Vercel Build Output...');

    // 1. Créer les dossiers
    await mkdir(STATIC_DIR, { recursive: true });

    // 2. Copier public/ vers .vercel/output/static/
    async function copyRecursive(src, dest) {
      const entries = await readdir(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
          await mkdir(destPath, { recursive: true });
          await copyRecursive(srcPath, destPath);
        } else {
          await cp(srcPath, destPath);
        }
      }
    }

    await copyRecursive(PUBLIC_DIR, STATIC_DIR);
    console.log('✅ Fichiers statiques copiés vers .vercel/output/static/');

    // 3. Créer config.json
    const configJson = {
      version: 3
    };
    await writeFile(
      join(VERCEL_OUTPUT, 'config.json'),
      JSON.stringify(configJson, null, 2)
    );
    console.log('✅ config.json créé');

    // Injection des variables d'environnement dans emma-config.js
    const emmaConfigPath = join(STATIC_DIR, 'emma-config.js');
    if (existsSync(emmaConfigPath)) {
      console.log('🔑 Injection des clés API dans emma-config.js...');
      let emmaConfigContent = await readFile(emmaConfigPath, 'utf8');

      if (process.env.GEMINI_API_KEY) {
        emmaConfigContent = emmaConfigContent.replace('YOUR_GEMINI_API_KEY', process.env.GEMINI_API_KEY);
        console.log('✅ Clé Gemini injectée');
      }

      if (process.env.TAVUS_API_KEY) {
        emmaConfigContent = emmaConfigContent.replace('YOUR_TAVUS_API_KEY', process.env.TAVUS_API_KEY);
        console.log('✅ Clé Tavus injectée');
      }

      await writeFile(emmaConfigPath, emmaConfigContent);
    }

    console.log('✅ Build terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du build:', error);
    process.exit(1);
  }
}

build();

