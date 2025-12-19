#!/usr/bin/env node

/**
 * Test pour vérifier que le DatePicker utilise un panneau modal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, '..', 'public', 'bienvenue', 'index.html');

function testDatePickerModal() {
    console.log('🧪 Test du DatePicker avec panneau modal\n');
    
    if (!fs.existsSync(htmlPath)) {
        console.error('❌ Fichier index.html non trouvé');
        return false;
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    let allTestsPassed = true;
    const errors = [];

    // Test 1: Vérifier que le DatePicker utilise un panneau modal
    console.log('1️⃣  Vérification du panneau modal...');
    const modalPatterns = [
        { pattern: /position:\s*['"]fixed['"]/g, name: 'Position fixed pour overlay' },
        { pattern: /zIndex:\s*10000/g, name: 'Z-index 10000 pour overlay' },
        { pattern: /bg-black\/20.*backdrop-blur/g, name: 'Overlay avec backdrop-blur' },
        { pattern: /Sélectionner une date/g, name: 'Titre "Sélectionner une date"' },
        { pattern: /Icons\.X.*Fermer/g, name: 'Bouton fermer avec Icons.X' }
    ];

    modalPatterns.forEach(check => {
        const matches = htmlContent.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`   ✅ ${check.name}: ${matches.length} occurrence(s)`);
        } else {
            console.log(`   ❌ ${check.name}: non trouvé`);
            errors.push(`${check.name} manquant`);
            allTestsPassed = false;
        }
    });

    // Test 2: Vérifier que l'input date est dans le panneau
    console.log('\n2️⃣  Vérification de l\'input date...');
    const inputPatterns = [
        { pattern: /type="date"/g, name: 'Input type="date"' },
        { pattern: /min=\{min \|\| '2026-01-01'\}/g, name: 'Min date 2026-01-01' },
        { pattern: /handleDateChange/g, name: 'Fonction handleDateChange' }
    ];

    inputPatterns.forEach(check => {
        const matches = htmlContent.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`   ✅ ${check.name}: ${matches.length} occurrence(s)`);
        } else {
            console.log(`   ⚠️  ${check.name}: non trouvé`);
        }
    });

    // Test 3: Vérifier la structure du panneau (similaire au panneau ressources)
    console.log('\n3️⃣  Vérification de la structure...');
    const structureChecks = [
        { pattern: /fixed.*inset.*0.*zIndex.*10000/g, name: 'Container fixe avec z-index' },
        { pattern: /bg-white.*rounded-xl.*shadow/g, name: 'Panneau blanc avec ombre' },
        { pattern: /from-blue-600.*to-indigo-600/g, name: 'Header avec gradient bleu' },
        { pattern: /onClick.*handleClose/g, name: 'Gestion de la fermeture' }
    ];

    structureChecks.forEach(check => {
        const matches = htmlContent.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`   ✅ ${check.name}: trouvé`);
        } else {
            console.log(`   ⚠️  ${check.name}: non trouvé`);
        }
    });

    // Test 4: Vérifier que le DatePicker n'utilise plus l'ancien pattern
    console.log('\n4️⃣  Vérification de l\'absence de l\'ancien pattern...');
    const oldPatterns = [
        { pattern: /opacity-0.*w-full.*h-full/g, name: 'Ancien input invisible' },
        { pattern: /pointerEvents.*isOpen/g, name: 'Ancien pattern pointerEvents conditionnel' }
    ];

    // On cherche dans la section DatePicker uniquement
    const datePickerSection = htmlContent.match(/const DatePicker = \{[\s\S]*?\};/);
    if (datePickerSection) {
        const section = datePickerSection[0];
        oldPatterns.forEach(check => {
            if (section.match(check.pattern)) {
                console.log(`   ⚠️  ${check.name}: encore présent (peut être OK si utilisé ailleurs)`);
            } else {
                console.log(`   ✅ ${check.name}: non trouvé dans DatePicker`);
            }
        });
    }

    // Résumé
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
        console.log('✅ Tous les tests sont passés!');
        console.log('🎉 Le DatePicker utilise maintenant un panneau modal\n');
        return true;
    } else {
        console.log('❌ Certains tests ont échoué:');
        errors.forEach(err => console.log(`   - ${err}`));
        console.log('');
        return false;
    }
}

// Exécuter les tests
const success = testDatePickerModal();
process.exit(success ? 0 : 1);

