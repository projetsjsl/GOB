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

    // Créer le dossier dist s'il n'existe pas
    if (!existsSync(DIST_DIR)) {
      await mkdir(DIST_DIR, { recursive: true });
      console.log(`✅ Dossier ${DIST_DIR} créé`);
    }

    // Vérifier que public existe
    if (!existsSync(PUBLIC_DIR)) {
      console.warn(`⚠️ Dossier ${PUBLIC_DIR} n'existe pas`);
      return;
    }

    // Fonction récursive pour copier en excluant node_modules et fichiers source
    async function copyDir(src, dest) {
      await mkdir(dest, { recursive: true });
      const entries = await readdir(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        // Exclure node_modules, package.json, et fichiers de dev
        if (entry.name === 'node_modules' ||
            entry.name === 'package.json' ||
            entry.name === 'package-lock.json' ||
            entry.name === 'tsconfig.json' ||
            entry.name === 'vite.config.ts' ||
            entry.name === 'postcss.config.js' ||
            entry.name === 'tailwind.config.js') {
          continue;
        }

        // Exclure les dossiers source TypeScript (mais garder dist)
        if (entry.isDirectory()) {
          // Pour 3p1, on ne copie QUE le dossier dist si on est dans public/3p1
          if (src.endsWith('3p1') && entry.name !== 'dist') {
            continue;
          }
          await copyDir(srcPath, destPath);
        } else {
          // Exclure les fichiers source TypeScript/React
          if (entry.name.endsWith('.tsx') ||
              entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
            continue;
          }
          await cp(srcPath, destPath);
        }
      }
    }

    // Copier récursivement tous les fichiers de public vers dist
    await copyDir(PUBLIC_DIR, DIST_DIR);
    console.log(`✅ Fichiers copiés de ${PUBLIC_DIR}/ vers ${DIST_DIR}/`);

    // Injection des variables d'environnement dans emma-config.js
    const emmaConfigPath = join(DIST_DIR, 'emma-config.js');
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

    // Copier index.html de la racine vers dist
    const INDEX_HTML = 'index.html';
    if (existsSync(INDEX_HTML)) {
      await cp(INDEX_HTML, join(DIST_DIR, INDEX_HTML));
      console.log(`✅ ${INDEX_HTML} copié vers ${DIST_DIR}/`);
    } else {
      console.warn(`⚠️ ${INDEX_HTML} n'existe pas à la racine`);
    }

    console.log('✅ Build terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du build:', error);
    process.exit(1);
  }
}

build();

