/**
 * Script de build pour Vercel
 * Copie les fichiers statiques de public/ vers dist/
 * Construit également l'application 3p1
 */

import { mkdir, cp } from 'fs/promises';
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
        // Installer les dépendances si nécessaire
        const packageLockPath = join(APP_3P1_DIR, 'package-lock.json');
        if (!existsSync(packageLockPath)) {
          console.log('📦 Installation des dépendances 3p1...');
          execSync('npm install', { 
            cwd: APP_3P1_DIR, 
            stdio: 'inherit' 
          });
        }
        
        // Construire l'application
        execSync('npm run build', { 
          cwd: APP_3P1_DIR, 
          stdio: 'inherit' 
        });
        console.log('✅ Application 3p1 construite avec succès');
      } catch (error) {
        console.warn('⚠️ Erreur lors de la construction de 3p1:', error.message);
        console.warn('⚠️ Continuons le build sans 3p1...');
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
    
    // Copier récursivement tous les fichiers de public vers dist
    await cp(PUBLIC_DIR, DIST_DIR, { recursive: true });
    console.log(`✅ Fichiers copiés de ${PUBLIC_DIR}/ vers ${DIST_DIR}/`);
    
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

