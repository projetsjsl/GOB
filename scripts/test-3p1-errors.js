#!/usr/bin/env node
/**
 * Script de test pour vérifier les erreurs courantes dans 3p1
 * 
 * Vérifie :
 * 1. Les imports manquants
 * 2. L'utilisation correcte des hooks React
 * 3. Les références aux fonctions
 * 
 * Usage: node scripts/test-3p1-errors.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Test des erreurs 3p1\n');
console.log('═══════════════════════════════════════════════════════════\n');

let errors = [];
let warnings = [];
let success = [];

// 1. Vérifier les imports dans Sidebar.tsx
console.log('📄 VÉRIFICATION DES IMPORTS\n');

const sidebarPath = path.join(__dirname, '..', 'public/3p1/components/Sidebar.tsx');
if (fs.existsSync(sidebarPath)) {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    
    if (sidebarContent.includes("import { createLogoLoadHandler }")) {
        success.push('✅ Sidebar.tsx importe createLogoLoadHandler');
    } else {
        errors.push('❌ Sidebar.tsx n\'importe pas createLogoLoadHandler');
    }
    
    if (sidebarContent.includes('createLogoLoadHandler()')) {
        if (sidebarContent.includes("import { createLogoLoadHandler }")) {
            success.push('✅ createLogoLoadHandler est utilisé et importé dans Sidebar.tsx');
        } else {
            errors.push('❌ createLogoLoadHandler est utilisé mais non importé dans Sidebar.tsx');
        }
    }
} else {
    errors.push('❌ Sidebar.tsx introuvable');
}

// 2. Vérifier l'utilisation de useMemo dans App.tsx
console.log('📄 VÉRIFICATION DES HOOKS REACT\n');

const appPath = path.join(__dirname, '..', 'public/3p1/App.tsx');
if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    // Vérifier que useMemo n'est pas utilisé dans le JSX
    const jsxUseMemoRegex = /<[^>]+>\s*\{useMemo\(/;
    if (jsxUseMemoRegex.test(appContent)) {
        errors.push('❌ useMemo utilisé directement dans le JSX (doit être au niveau du composant)');
    } else {
        success.push('✅ useMemo n\'est pas utilisé directement dans le JSX');
    }
    
    // Vérifier que useMemo est importé
    if (appContent.includes("import React, { useState, useEffect, useRef, useMemo }")) {
        success.push('✅ useMemo est importé dans App.tsx');
    } else {
        warnings.push('⚠️ useMemo pourrait ne pas être importé dans App.tsx');
    }
    
    // Vérifier KPIDashboard profiles prop
    if (appContent.includes('<KPIDashboard')) {
        const kpiDashboardMatch = appContent.match(/<KPIDashboard[^>]*>[\s\S]*?<\/KPIDashboard>/);
        if (kpiDashboardMatch) {
            const kpiContent = kpiDashboardMatch[0];
            if (kpiContent.includes('profiles={useMemo')) {
                errors.push('❌ KPIDashboard utilise useMemo dans le JSX (ligne ~1904)');
            } else if (kpiContent.includes('profiles={Object.values')) {
                success.push('✅ KPIDashboard utilise Object.values directement (correct)');
            }
        }
    }
} else {
    errors.push('❌ App.tsx introuvable');
}

// 3. Vérifier que logoUtils.ts exporte createLogoLoadHandler
console.log('📄 VÉRIFICATION DES EXPORTS\n');

const logoUtilsPath = path.join(__dirname, '..', 'public/3p1/utils/logoUtils.ts');
if (fs.existsSync(logoUtilsPath)) {
    const logoUtilsContent = fs.readFileSync(logoUtilsPath, 'utf8');
    
    if (logoUtilsContent.includes('export function createLogoLoadHandler')) {
        success.push('✅ logoUtils.ts exporte createLogoLoadHandler');
    } else {
        errors.push('❌ logoUtils.ts n\'exporte pas createLogoLoadHandler');
    }
    
    if (logoUtilsContent.includes('export function createLogoErrorHandler')) {
        success.push('✅ logoUtils.ts exporte createLogoErrorHandler');
    } else {
        warnings.push('⚠️ logoUtils.ts n\'exporte pas createLogoErrorHandler');
    }
} else {
    errors.push('❌ logoUtils.ts introuvable');
}

// 4. Vérifier Header.tsx
console.log('📄 VÉRIFICATION DE HEADER.TSX\n');

const headerPath = path.join(__dirname, '..', 'public/3p1/components/Header.tsx');
if (fs.existsSync(headerPath)) {
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    
    if (headerContent.includes("import { createLogoErrorHandler, createLogoLoadHandler }")) {
        success.push('✅ Header.tsx importe createLogoLoadHandler');
    } else {
        warnings.push('⚠️ Header.tsx pourrait ne pas importer createLogoLoadHandler');
    }
} else {
    errors.push('❌ Header.tsx introuvable');
}

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
    console.log('💡 Les avertissements sont non-bloquants.\n');
    process.exit(0);
} else {
    console.log('❌ Certains tests critiques ont échoué.');
    console.log('💡 Corrigez les erreurs avant de déployer.\n');
    process.exit(1);
}

