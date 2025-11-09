/**
 * Script de build pour Vercel
 * Copie les fichiers statiques de public/ vers dist/
 */

import { mkdir, cp } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const PUBLIC_DIR = 'public';
const DIST_DIR = 'dist';

async function build() {
  try {
    console.log('📦 Démarrage du build...');
    
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
    console.log('✅ Build terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du build:', error);
    process.exit(1);
  }
}

build();

