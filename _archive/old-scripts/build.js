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

    console.log('✅ Build terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du build:', error);
    process.exit(1);
  }
}

build();

