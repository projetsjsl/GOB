#!/usr/bin/env node
/**
 * Script de test pour l'intégration Terminal Emma IA
 * 
 * Vérifie que :
 * 1. Les fichiers nécessaires existent
 * 2. Les endpoints API fonctionnent
 * 3. L'onglet est correctement intégré
 * 
 * Usage: node scripts/test-terminal-emma-ia-integration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

console.log('🧪 Test d\'intégration Terminal Emma IA\n');
console.log('═══════════════════════════════════════════════════════════\n');

let errors = [];
let warnings = [];
let success = [];

// 1. Vérifier les fichiers
console.log('📁 VÉRIFICATION DES FICHIERS\n');

const requiredFiles = [
    'public/terminal-emma-ia.html',
    'public/js/dashboard/components/tabs/TerminalEmmaIATab.js',
    'api/fmp-sync.js',
    'api/kpi-engine.js',
    'api/terminal-data.js',
    'supabase-terminal-emma-ia-schema-ADAPTED.sql',
    'supabase-terminal-emma-ia-kpi-init.sql'
];

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        success.push(`✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
        errors.push(`❌ ${file} - MANQUANT`);
    }
});

// 2. Vérifier l'intégration dans beta-combined-dashboard.html
console.log('📄 VÉRIFICATION DE L\'INTÉGRATION DASHBOARD\n');

const dashboardPath = path.join(__dirname, '..', 'public/beta-combined-dashboard.html');
if (fs.existsSync(dashboardPath)) {
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    if (dashboardContent.includes('TerminalEmmaIATab.js')) {
        success.push('✅ TerminalEmmaIATab.js référencé dans beta-combined-dashboard.html');
    } else {
        errors.push('❌ TerminalEmmaIATab.js NON référencé dans beta-combined-dashboard.html');
    }
} else {
    errors.push('❌ beta-combined-dashboard.html introuvable');
}

// 3. Vérifier l'intégration dans app-inline.js
console.log('📄 VÉRIFICATION DE L\'INTÉGRATION APP-INLINE\n');

const appInlinePath = path.join(__dirname, '..', 'public/js/dashboard/app-inline.js');
if (fs.existsSync(appInlinePath)) {
    const appInlineContent = fs.readFileSync(appInlinePath, 'utf8');
    
    if (appInlineContent.includes('terminal-emma-ia')) {
        success.push('✅ Onglet terminal-emma-ia présent dans app-inline.js');
    } else {
        errors.push('❌ Onglet terminal-emma-ia NON présent dans app-inline.js');
    }
    
    if (appInlineContent.includes('TerminalEmmaIATab')) {
        success.push('✅ TerminalEmmaIATab référencé dans app-inline.js');
    } else {
        warnings.push('⚠️ TerminalEmmaIATab non référencé dans app-inline.js (peut être chargé via window)');
    }
} else {
    errors.push('❌ app-inline.js introuvable');
}

// 4. Vérifier vercel.json
console.log('⚙️  VÉRIFICATION DE LA CONFIGURATION VERCEL\n');

const vercelPath = path.join(__dirname, '..', 'vercel.json');
if (fs.existsSync(vercelPath)) {
    const vercelContent = fs.readFileSync(vercelPath, 'utf8');
    
    const requiredEndpoints = ['fmp-sync.js', 'kpi-engine.js', 'terminal-data.js'];
    requiredEndpoints.forEach(endpoint => {
        if (vercelContent.includes(endpoint)) {
            success.push(`✅ ${endpoint} configuré dans vercel.json`);
        } else {
            warnings.push(`⚠️ ${endpoint} non configuré dans vercel.json`);
        }
    });
} else {
    errors.push('❌ vercel.json introuvable');
}

// 5. Tester les endpoints API (si l'app est accessible)
console.log('🌐 TEST DES ENDPOINTS API\n');

async function testEndpoint(name, url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok || response.status === 400) {
            // 400 est OK car on n'a pas fourni les paramètres requis
            success.push(`✅ ${name} - Endpoint accessible`);
            return true;
        } else {
            warnings.push(`⚠️ ${name} - Status ${response.status}`);
            return false;
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
            warnings.push(`⚠️ ${name} - Serveur non accessible (${API_BASE})`);
        } else {
            warnings.push(`⚠️ ${name} - ${error.message}`);
        }
        return false;
    }
}

async function testAPIs() {
    await testEndpoint('terminal-data', `${API_BASE}/api/terminal-data?action=sectors`);
    await testEndpoint('fmp-sync', `${API_BASE}/api/fmp-sync?action=sync-indices`);
    await testEndpoint('kpi-engine', `${API_BASE}/api/kpi-engine?action=compute&kpi_code=QUALITY_SCORE_V1&symbol=AAPL`);
}

// 6. Vérifier la structure du composant TerminalEmmaIATab
console.log('🔍 VÉRIFICATION DU COMPOSANT\n');

const componentPath = path.join(__dirname, '..', 'public/js/dashboard/components/tabs/TerminalEmmaIATab.js');
if (fs.existsSync(componentPath)) {
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    if (componentContent.includes('window.TerminalEmmaIATab')) {
        success.push('✅ Composant exposé globalement (window.TerminalEmmaIATab)');
    } else {
        errors.push('❌ Composant non exposé globalement');
    }
    
    if (componentContent.includes('/terminal-emma-ia.html')) {
        success.push('✅ iframe pointe vers /terminal-emma-ia.html');
    } else {
        errors.push('❌ iframe ne pointe pas vers /terminal-emma-ia.html');
    }
    
    if (componentContent.includes('isDarkMode')) {
        success.push('✅ Composant accepte la prop isDarkMode');
    } else {
        warnings.push('⚠️ Composant n\'accepte pas isDarkMode');
    }
}

// Exécuter les tests
(async () => {
    await testAPIs();
    
    // Afficher les résultats
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RÉSULTATS DES TESTS\n');
    
    if (success.length > 0) {
        console.log('✅ SUCCÈS:');
        success.forEach(msg => console.log(`   ${msg}`));
        console.log('');
    }
    
    if (warnings.length > 0) {
        console.log('⚠️  AVERTISSEMENTS:');
        warnings.forEach(msg => console.log(`   ${msg}`));
        console.log('');
    }
    
    if (errors.length > 0) {
        console.log('❌ ERREURS:');
        errors.forEach(msg => console.log(`   ${msg}`));
        console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (errors.length === 0) {
        console.log('✅ Tous les tests critiques sont passés!');
        console.log('💡 Vérifiez les avertissements ci-dessus si nécessaire.\n');
        process.exit(0);
    } else {
        console.log('❌ Certains tests critiques ont échoué.');
        console.log('💡 Corrigez les erreurs avant de déployer.\n');
        process.exit(1);
    }
})();

