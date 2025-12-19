#!/usr/bin/env node

/**
 * Test complet du DatePicker avec panneau modal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, '..', 'public', 'bienvenue', 'index.html');

function testDatePickerComplete() {
    console.log('🧪 Test complet du DatePicker avec panneau modal\n');
    
    if (!fs.existsSync(htmlPath)) {
        console.error('❌ Fichier index.html non trouvé');
        return false;
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    let allTestsPassed = true;
    const errors = [];
    const warnings = [];

    // Test 1: Vérifier la structure du panneau modal
    console.log('1️⃣  Vérification de la structure du panneau modal...');
    const modalChecks = [
        { pattern: /isOpen.*useState\(false\)/g, name: 'State isOpen avec useState' },
        { pattern: /isOpen && \(/g, name: 'Rendu conditionnel avec isOpen' },
        { pattern: /position:\s*['"]fixed['"].*inset:\s*0.*zIndex:\s*10000/g, name: 'Container fixe avec z-index 10000' },
        { pattern: /bg-black\/20.*backdrop-blur-sm/g, name: 'Overlay avec backdrop-blur' },
        { pattern: /handleClose/g, name: 'Fonction handleClose' },
        { pattern: /onClick.*handleClose/g, name: 'Gestion du clic pour fermer' }
    ];

    modalChecks.forEach(check => {
        const matches = htmlContent.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`   ✅ ${check.name}: ${matches.length} occurrence(s)`);
        } else {
            console.log(`   ❌ ${check.name}: non trouvé`);
            errors.push(`${check.name} manquant`);
            allTestsPassed = false;
        }
    });

    // Test 2: Vérifier le panneau flottant
    console.log('\n2️⃣  Vérification du panneau flottant...');
    const panelChecks = [
        { pattern: /fixed.*bg-white.*rounded-xl.*shadow/g, name: 'Panneau blanc avec ombre' },
        { pattern: /top:\s*['"]50%['"].*left:\s*['"]50%['"].*transform.*translate/g, name: 'Centrage du panneau' },
        { pattern: /width:\s*['"]320px['"]/g, name: 'Largeur du panneau (320px)' },
        { pattern: /zIndex:\s*10001/g, name: 'Z-index du panneau (10001)' },
        { pattern: /pointerEvents:\s*['"]auto['"]/g, name: 'Pointer events activés' }
    ];

    panelChecks.forEach(check => {
        const matches = htmlContent.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`   ✅ ${check.name}: trouvé`);
        } else {
            console.log(`   ⚠️  ${check.name}: non trouvé`);
            warnings.push(`${check.name} manquant`);
        }
    });

    // Test 3: Vérifier le header
    console.log('\n3️⃣  Vérification du header...');
    const headerChecks = [
        { pattern: /from-blue-600.*to-indigo-600/g, name: 'Gradient bleu/indigo' },
        { pattern: /Sélectionner une date/g, name: 'Titre "Sélectionner une date"' },
        { pattern: /Icons\.X/g, name: 'Icône X pour fermer' },
        { pattern: /rounded-t-xl/g, name: 'Coins arrondis en haut' }
    ];

    headerChecks.forEach(check => {
        const matches = htmlContent.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`   ✅ ${check.name}: ${matches.length} occurrence(s)`);
        } else {
            console.log(`   ⚠️  ${check.name}: non trouvé`);
            warnings.push(`${check.name} manquant`);
        }
    });

    // Test 4: Vérifier l'input date
    console.log('\n4️⃣  Vérification de l\'input date...');
    const inputChecks = [
        { pattern: /type="date"/g, name: 'Input type="date"' },
        { pattern: /inputRef.*useRef/g, name: 'Ref pour l\'input' },
        { pattern: /min=\{min \|\| '2026-01-01'\}/g, name: 'Min date 2026-01-01' },
        { pattern: /handleDateChange/g, name: 'Fonction handleDateChange' },
        { pattern: /focus.*showPicker/g, name: 'Focus et showPicker' }
    ];

    inputChecks.forEach(check => {
        const matches = htmlContent.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`   ✅ ${check.name}: ${matches.length} occurrence(s)`);
        } else {
            console.log(`   ⚠️  ${check.name}: non trouvé`);
            warnings.push(`${check.name} manquant`);
        }
    });

    // Test 5: Vérifier la validation des dates
    console.log('\n5️⃣  Vérification de la validation des dates...');
    const validationChecks = [
        { pattern: /minDate.*min \|\| '2026-01-01'/g, name: 'Min date par défaut 2026-01-01' },
        { pattern: /newValue.*<.*minDate/g, name: 'Vérification date < minDate' },
        { pattern: /finalValue.*minDate.*:.*newValue/g, name: 'Correction automatique de la date' }
    ];

    validationChecks.forEach(check => {
        const matches = htmlContent.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`   ✅ ${check.name}: trouvé`);
        } else {
            console.log(`   ⚠️  ${check.name}: non trouvé`);
            warnings.push(`${check.name} manquant`);
        }
    });

    // Test 6: Vérifier le footer avec date formatée
    console.log('\n6️⃣  Vérification du footer...');
    const footerChecks = [
        { pattern: /Date sélectionnée/g, name: 'Texte "Date sélectionnée"' },
        { pattern: /formatDate\(value\)/g, name: 'Formatage de la date' }
    ];

    footerChecks.forEach(check => {
        const matches = htmlContent.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`   ✅ ${check.name}: ${matches.length} occurrence(s)`);
        } else {
            console.log(`   ⚠️  ${check.name}: non trouvé`);
            warnings.push(`${check.name} manquant`);
        }
    });

    // Test 7: Vérifier que l'ancien pattern n'est plus utilisé
    console.log('\n7️⃣  Vérification de l\'absence de l\'ancien pattern...');
    const oldPatterns = [
        { pattern: /opacity-0.*w-full.*h-full.*cursor-pointer/g, name: 'Ancien input invisible' }
    ];

    // Extraire la section DatePicker
    const datePickerMatch = htmlContent.match(/const DatePicker = [\s\S]*?};/);
    if (datePickerMatch) {
        const datePickerCode = datePickerMatch[0];
        oldPatterns.forEach(check => {
            if (datePickerCode.match(check.pattern)) {
                console.log(`   ⚠️  ${check.name}: encore présent`);
                warnings.push(`${check.name} encore présent`);
            } else {
                console.log(`   ✅ ${check.name}: non trouvé dans DatePicker`);
            }
        });
    }

    // Test 8: Vérifier l'utilisation du DatePicker
    console.log('\n8️⃣  Vérification de l\'utilisation du DatePicker...');
    const usageChecks = [
        { pattern: /<DatePicker/g, name: 'Utilisation de DatePicker' },
        { pattern: /value=.*onChange=/g, name: 'Props value et onChange' }
    ];

    usageChecks.forEach(check => {
        const matches = htmlContent.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`   ✅ ${check.name}: ${matches.length} occurrence(s)`);
        } else {
            console.log(`   ⚠️  ${check.name}: non trouvé`);
            warnings.push(`${check.name} manquant`);
        }
    });

    // Résumé
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
        console.log('✅ Tous les tests critiques sont passés!');
        if (warnings.length > 0) {
            console.log(`\n⚠️  ${warnings.length} avertissement(s):`);
            warnings.forEach(warn => console.log(`   - ${warn}`));
        }
        console.log('🎉 Le DatePicker avec panneau modal est correctement implémenté\n');
        return true;
    } else {
        console.log('❌ Certains tests critiques ont échoué:');
        errors.forEach(err => console.log(`   - ${err}`));
        if (warnings.length > 0) {
            console.log(`\n⚠️  ${warnings.length} avertissement(s):`);
            warnings.forEach(warn => console.log(`   - ${warn}`));
        }
        console.log('');
        return false;
    }
}

// Exécuter les tests
const success = testDatePickerComplete();
process.exit(success ? 0 : 1);

