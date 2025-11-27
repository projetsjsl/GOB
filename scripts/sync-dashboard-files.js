#!/usr/bin/env node
/**
 * Script de synchronisation automatique des fichiers dashboard
 * Garantit qu'il n'y a qu'une seule source de vérité (public/)
 * et synchronise vers dist/ si nécessaire
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../public/js/dashboard');
const TARGET_DIRS = [
    path.join(__dirname, '../dist/js/dashboard'),
    path.join(__dirname, '../dist/js/dashboard/dashboard')
];

function syncFile(sourcePath, targetPath) {
    try {
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, targetPath);
        return true;
    } catch (error) {
        console.error(`❌ Erreur copie ${sourcePath} → ${targetPath}:`, error.message);
        return false;
    }
}

function syncDirectory(sourceDir, targetDir, relativePath = '') {
    if (!fs.existsSync(sourceDir)) {
        console.warn(`⚠️  Répertoire source inexistant: ${sourceDir}`);
        return;
    }

    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
    let synced = 0;
    let errors = 0;

    for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);
        const currentRelative = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
            syncDirectory(sourcePath, targetPath, currentRelative);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            if (syncFile(sourcePath, targetPath)) {
                synced++;
            } else {
                errors++;
            }
        }
    }

    return { synced, errors };
}

function main() {
    console.log('🔄 Synchronisation des fichiers dashboard...\n');
    console.log(`📂 Source: ${SOURCE_DIR}\n`);

    let totalSynced = 0;
    let totalErrors = 0;

    for (const targetDir of TARGET_DIRS) {
        if (fs.existsSync(targetDir)) {
            console.log(`📤 Synchronisation vers: ${targetDir}`);
            const result = syncDirectory(SOURCE_DIR, targetDir);
            totalSynced += result.synced || 0;
            totalErrors += result.errors || 0;
            console.log(`   ✅ ${result.synced || 0} fichiers synchronisés\n`);
        } else {
            console.log(`⚠️  Répertoire cible inexistant (sera créé si nécessaire): ${targetDir}\n`);
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Synchronisation terminée: ${totalSynced} fichiers`);
    if (totalErrors > 0) {
        console.log(`❌ Erreurs: ${totalErrors}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Exécuter si appelé directement
if (require.main === module) {
    main();
}

module.exports = { syncDirectory, syncFile };

