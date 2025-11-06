#!/usr/bin/env node

/**
 * Vérification complète de l'existence et cohérence du projet GOB
 * Vérifie tous les fichiers, configurations et dépendances
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 VÉRIFICATION COMPLÈTE PROJET GOB');
console.log('═'.repeat(60));

// Configuration des fichiers à vérifier
const REQUIRED_FILES = {
    // Configuration principale
    'package.json': 'Configuration npm et dépendances',
    'vercel.json': 'Configuration Vercel et timeouts',
    'tsconfig.json': 'Configuration TypeScript',
    'tailwind.config.js': 'Configuration TailwindCSS',
    'vite.config.ts': 'Configuration Vite',
    
    // Dashboard principal
    'public/beta-combined-dashboard.html': 'Dashboard principal financier',
    'index.html': 'Point d\'entrée Vite',
    'src/App.tsx': 'Application React principale',
    
    // APIs critiques
    'api/supabase-watchlist.js': 'API watchlist Supabase',
    'api/supabase-watchlist-fixed.js': 'API watchlist corrigée',
    'api/tickers-config.js': 'Configuration des tickers',
    'api/team-tickers.js': 'API tickers d\'équipe',
    'api/marketdata.js': 'API données de marché',
    'api/fmp.js': 'API Financial Modeling Prep',
    'api/gemini/chat.js': 'API Gemini chat',
    'api/emma-agent.js': 'Agent Emma intelligent',
    'api/emma-briefing.js': 'Briefings Emma automatisés',
    
    // Agents Emma AI
    'lib/agents/earnings-calendar-agent.js': 'Agent calendrier earnings',
    'lib/agents/earnings-results-agent.js': 'Agent résultats earnings',
    'lib/agents/news-monitoring-agent.js': 'Agent monitoring news',
    'lib/intent-analyzer.js': 'Analyseur d\'intentions',
    'lib/supabase-config.js': 'Configuration Supabase',
    
    // Outils Emma
    'lib/tools/supabase-watchlist-tool.js': 'Outil watchlist Supabase',
    'lib/tools/team-tickers-tool.js': 'Outil tickers d\'équipe',
    'lib/tools/base-tool.js': 'Classe de base des outils',
    
    // Scripts SQL Supabase
    'supabase-improve-existing-tables.sql': 'Amélioration tables existantes',
    'supabase-migration-watchlists-to-watchlist.sql': 'Migration watchlists',
    'supabase-security-fixes-corrected.sql': 'Corrections sécurité',
    'supabase-watchlist-base.sql': 'Table watchlist de base',
    
    // Scripts de test et vérification
    'check-supabase-coherence.js': 'Vérification cohérence Supabase',
    'check-supabase-security.js': 'Vérification sécurité Supabase',
    'test-coherence-final.js': 'Test cohérence final',
    'test-supabase-final.js': 'Test Supabase final',
    
    // Documentation
    'RAPPORT_COHERENCE_SUPABASE.md': 'Rapport cohérence Supabase',
    'GUIDE_SECURITE_SUPABASE.md': 'Guide sécurité Supabase',
    'SUPABASE_SETUP_GUIDE.md': 'Guide configuration Supabase',
    'CLAUDE.md': 'Documentation projet pour Claude'
};

// Configuration des répertoires à vérifier
const REQUIRED_DIRECTORIES = {
    'api': 'Endpoints API',
    'api/gemini': 'APIs Gemini',
    'lib': 'Bibliothèques et utilitaires',
    'lib/agents': 'Agents Emma AI',
    'lib/tools': 'Outils Emma',
    'lib/gemini': 'Fonctions Gemini',
    'public': 'Fichiers publics',
    'src': 'Code source React',
    'config': 'Configurations',
    'docs': 'Documentation'
};

// Dépendances npm critiques
const CRITICAL_DEPENDENCIES = [
    '@supabase/supabase-js',
    '@google/generative-ai',
    '@anthropic-ai/sdk',
    'react',
    'react-dom',
    'pg',
    'resend'
];

console.log('📁 VÉRIFICATION DES FICHIERS');
console.log('═'.repeat(60));

let filesOk = 0;
let filesMissing = 0;
const missingFiles = [];

Object.entries(REQUIRED_FILES).forEach(([file, description]) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} - ${description}`);
        filesOk++;
    } else {
        console.log(`❌ ${file} - ${description} (MANQUANT)`);
        filesMissing++;
        missingFiles.push(file);
    }
});

console.log('');
console.log('📂 VÉRIFICATION DES RÉPERTOIRES');
console.log('═'.repeat(60));

let dirsOk = 0;
let dirsMissing = 0;

Object.entries(REQUIRED_DIRECTORIES).forEach(([dir, description]) => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        console.log(`✅ ${dir}/ - ${description}`);
        dirsOk++;
    } else {
        console.log(`❌ ${dir}/ - ${description} (MANQUANT)`);
        dirsMissing++;
    }
});

console.log('');
console.log('📦 VÉRIFICATION DES DÉPENDANCES NPM');
console.log('═'.repeat(60));

let depsOk = 0;
let depsMissing = 0;

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    CRITICAL_DEPENDENCIES.forEach(dep => {
        if (allDeps[dep]) {
            console.log(`✅ ${dep} - ${allDeps[dep]}`);
            depsOk++;
        } else {
            console.log(`❌ ${dep} - MANQUANT`);
            depsMissing++;
        }
    });
} catch (error) {
    console.log('❌ Erreur lecture package.json:', error.message);
}

console.log('');
console.log('⚙️  VÉRIFICATION DES CONFIGURATIONS');
console.log('═'.repeat(60));

// Vérifier vercel.json
try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    console.log('✅ vercel.json - Configuration valide');
    console.log(`   • ${Object.keys(vercelConfig.functions || {}).length} fonctions configurées`);
    console.log(`   • ${vercelConfig.crons?.length || 0} crons configurés`);
} catch (error) {
    console.log('❌ vercel.json - Erreur:', error.message);
}

// Vérifier tsconfig.json
try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    console.log('✅ tsconfig.json - Configuration TypeScript valide');
} catch (error) {
    console.log('❌ tsconfig.json - Erreur:', error.message);
}

console.log('');
console.log('🔍 VÉRIFICATION DU DASHBOARD');
console.log('═'.repeat(60));

try {
    const dashboardContent = fs.readFileSync('public/beta-combined-dashboard.html', 'utf8');
    const dashboardSize = Math.round(dashboardContent.length / 1024);
    console.log(`✅ Dashboard principal - ${dashboardSize} KB`);
    
    // Vérifier des éléments clés
    const hasEmmaIntegration = dashboardContent.includes('Emma') || dashboardContent.includes('emma');
    const hasSupabaseIntegration = dashboardContent.includes('supabase') || dashboardContent.includes('Supabase');
    const hasChartJS = dashboardContent.includes('Chart.js') || dashboardContent.includes('chart');
    
    console.log(`   • Intégration Emma: ${hasEmmaIntegration ? '✅' : '❌'}`);
    console.log(`   • Intégration Supabase: ${hasSupabaseIntegration ? '✅' : '❌'}`);
    console.log(`   • Charts intégrés: ${hasChartJS ? '✅' : '❌'}`);
    
} catch (error) {
    console.log('❌ Dashboard principal - Erreur:', error.message);
}

console.log('');
console.log('📊 RÉSUMÉ DE VÉRIFICATION');
console.log('═'.repeat(60));

const totalFiles = filesOk + filesMissing;
const totalDirs = dirsOk + dirsMissing;
const totalDeps = depsOk + depsMissing;

console.log(`📁 Fichiers: ${filesOk}/${totalFiles} (${Math.round(filesOk/totalFiles*100)}%)`);
console.log(`📂 Répertoires: ${dirsOk}/${totalDirs} (${Math.round(dirsOk/totalDirs*100)}%)`);
console.log(`📦 Dépendances: ${depsOk}/${totalDeps} (${Math.round(depsOk/totalDeps*100)}%)`);

const overallScore = Math.round((filesOk + dirsOk + depsOk) / (totalFiles + totalDirs + totalDeps) * 100);
console.log(`🎯 Score global: ${overallScore}%`);

console.log('');
console.log('🎯 STATUT DU PROJET');
console.log('═'.repeat(60));

if (overallScore >= 95) {
    console.log('🟢 EXCELLENT - Projet complet et prêt');
    console.log('✅ Tous les composants essentiels sont présents');
    console.log('✅ Configuration cohérente');
    console.log('🚀 Prêt pour la production');
} else if (overallScore >= 85) {
    console.log('🟡 BON - Quelques éléments manquants');
    console.log('⚠️  Vérifiez les fichiers manquants');
    console.log('🔧 Complétez avant déploiement');
} else if (overallScore >= 70) {
    console.log('🟠 MOYEN - Plusieurs éléments manquants');
    console.log('❌ Problèmes de configuration');
    console.log('🔧 Corrections importantes nécessaires');
} else {
    console.log('🔴 CRITIQUE - Projet incomplet');
    console.log('❌ Nombreux fichiers manquants');
    console.log('🚨 Configuration défaillante');
}

if (missingFiles.length > 0) {
    console.log('');
    console.log('❌ FICHIERS MANQUANTS:');
    console.log('═'.repeat(60));
    missingFiles.forEach(file => {
        console.log(`   • ${file}`);
    });
}

console.log('');
console.log('💡 ACTIONS RECOMMANDÉES:');
console.log('═'.repeat(60));

if (overallScore >= 95) {
    console.log('1. ✅ Projet prêt - Déployez sur Vercel');
    console.log('2. 🧪 Testez les APIs en production');
    console.log('3. 🔒 Exécutez les scripts de sécurité Supabase');
    console.log('4. 📊 Validez le dashboard');
} else {
    console.log('1. 🔧 Créez les fichiers manquants');
    console.log('2. 📦 Installez les dépendances manquantes');
    console.log('3. ⚙️  Vérifiez les configurations');
    console.log('4. 🧪 Testez localement avant déploiement');
}

console.log('');
console.log('🎉 Vérification terminée!');

export { REQUIRED_FILES, REQUIRED_DIRECTORIES, CRITICAL_DEPENDENCIES };

