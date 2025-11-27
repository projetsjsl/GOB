#!/usr/bin/env node
/**
 * Script de nettoyage du projet
 * Supprime les fichiers inutiles: backups, logs, fichiers obsolètes
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

console.log('🧹 NETTOYAGE DU PROJET GOB\n');
console.log('='.repeat(70));

// Fichiers de backup à supprimer
const backupFiles = [
    'public/beta-combined-dashboard-BACKUP.html',
    'public/beta-combined-dashboard.html.backup',
    'public/emma-config-OLD-BACKUP.html',
    'public/emma-config-old.html',
    'public/js/dashboard/dashboard-main-simple.txt',
    'n8n-workflow-current-backup.json'
];

// Fichiers de logs à supprimer
const logFiles = [
    'scripts/bulk-load-final.log',
    'scripts/bulk-load-output-fixed.log',
    'scripts/bulk-load-output.log',
    'scripts/bulk-load-retry.log',
    'scripts/enrich-output.log'
];

// Fichiers obsolètes (selon CLEANUP_SAFE_TO_DELETE.md)
const obsoleteFiles = [
    'FINAL_MESSAGE.txt',
    'MESSAGE_FINAL_ULTIME.txt',
    'MISSION_COMPLETE.txt',
    'LISEZ_MOI_EN_PREMIER.txt',
    'LISEZ_MOI_MAINTENANT.md',
    'ORDRE_DE_LECTURE.txt',
    'RESUME_ULTRA_SIMPLE.txt',
    'TABLEAU_RECAP.txt',
    'NAVIGATION_MAP.txt',
    'DIAGRAMME-AUTOMATISATION.txt',
    'SESSION_MARATHON_31OCT_COMPLETE.md',
    'SESSION_SUMMARY.md',
    'SESSION_SUMMARY_EMMA_COMPREHENSIVE.md',
    'AUDIT_COMPLET_2025-10-31.md',
    'DASHBOARD_STATUS_REPORT.md',
    'API_DIAGNOSTIC_REPORT.md',
    'API-VALIDATION-REPORT.md',
    'VALIDATION_REPORT.md',
    'ACTION-IMMEDIATE-SUPABASE.md',
    'ACTION-IMMEDIATE-VALIDATION.md',
    'ACTIONS_IMMEDIATES.md',
    'URGENT_VERCEL_FIX_REQUIRED.md',
    'URGENT-SUPABASE-DIAGNOSTIC.md',
    'CONFIGURATION-SUPABASE-IMMEDIATE.md',
    'CONFIGURATION-SUPABASE-URGENTE.md',
    'FIX_LOGIN_ERROR.md',
    'FIX_LOGIN_PATTERN_ERROR_IMMEDIATE.md',
    'FIX_SMS_FOREIGN_KEY.md',
    'FIX_SUMMARY.md',
    'FIX_WATCHLIST_ERROR.md',
    'FIX-SERVERLESS-LIMIT.md',
    'FIX-WATCHLIST-SUPABASE.md',
    'FMP_API_FIXED.md',
    'CORRECTIONS_APPLIQUEES.md',
    'CORRECTIONS-DASHBOARD-RESUME.md',
    'STATUS-CORRECTIONS-FINAL.md',
    'DIAGNOSTIC_SMS_ERROR.md',
    'CALENDAR_INTEGRATION_REPORT.md',
    'CALENDAR_TEST_REPORT.md',
    'CALENDRIER_EVALUATION_FINALE.md',
    'PRODUCTION-API-TEST-REPORT.md',
    'RAPPORT-CORRECTIONS-APIS.md',
    'RAPPORT-TEST-FINAL-APIS.md',
    'RAPPORT-VALIDATION-FINALE.md',
    'RAPPORT_VALIDATION_FINALE.md',
    'RAPPORT_COHERENCE_SUPABASE.md',
    'TESTS_SUPABASE_SUMMARY.md',
    'DEPLOYMENT_CHECKLIST.md',
    'DEPLOYMENT_COMPLETE.md',
    'DEPLOYMENT_GUIDE.md',
    'DEPLOIEMENT-CALENDRIER-EN-LIGNE.md',
    'BRANCHES_CLEANUP_README.md',
    'PR_CREATION_GUIDE.md',
    'PR_DESCRIPTION_NEW_FEATURES.md',
    'PULL_REQUEST_READY.md',
    'PULL_REQUEST_SMS_INTEGRATION.md',
    'CLEANUP_COMPLETE.txt',
    'CLEANUP_SUMMARY.txt',
    'CLEANUP_SAFE_TO_DELETE.md'
];

const allFilesToDelete = [...backupFiles, ...logFiles, ...obsoleteFiles];

let deleted = 0;
let notFound = 0;
let errors = 0;

console.log(`\n📋 Fichiers à supprimer: ${allFilesToDelete.length}\n`);

allFilesToDelete.forEach(file => {
    const filePath = path.join(ROOT_DIR, file);
    
    if (fs.existsSync(filePath)) {
        try {
            const stats = fs.statSync(filePath);
            fs.unlinkSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.log(`✅ Supprimé: ${file} (${sizeKB} KB)`);
            deleted++;
        } catch (error) {
            console.log(`❌ Erreur lors de la suppression de ${file}: ${error.message}`);
            errors++;
        }
    } else {
        notFound++;
    }
});

console.log('\n' + '='.repeat(70));
console.log('📊 RÉSUMÉ DU NETTOYAGE');
console.log('='.repeat(70));
console.log(`✅ Fichiers supprimés: ${deleted}`);
console.log(`⚠️  Fichiers non trouvés: ${notFound}`);
console.log(`❌ Erreurs: ${errors}`);

if (deleted > 0) {
    console.log('\n✨ Nettoyage terminé avec succès!');
    process.exit(0);
} else {
    console.log('\n⚠️  Aucun fichier supprimé.');
    process.exit(0);
}

