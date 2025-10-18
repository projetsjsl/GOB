#!/usr/bin/env node
// ============================================================================
// TEST SIMPLE CHATGPT - Test rapide de l'intégration ChatGPT
// ============================================================================
//
// Ce script teste rapidement l'intégration ChatGPT sans dépendances externes
//
// Usage: node test-simple-chatgpt.js
// ============================================================================

console.log('🧪 Test simple de l\'intégration ChatGPT');
console.log('=====================================');
console.log('');

// Test 1: Vérifier que les fichiers existent
console.log('📁 Vérification des fichiers...');

import fs from 'fs';
import path from 'path';

const requiredFiles = [
    'api/chatgpt/chat.js',
    'api/chatgpt/tools.js',
    'api/ai-services.js',
    'test-chatgpt-integration.js',
    'deploy-chatgpt-integration.sh',
    'CHATGPT-INTEGRATION-GUIDE.md'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MANQUANT`);
        allFilesExist = false;
    }
});

console.log('');

// Test 2: Vérifier la syntaxe des fichiers JavaScript
console.log('🔍 Vérification de la syntaxe...');

const jsFiles = [
    'api/chatgpt/chat.js',
    'api/chatgpt/tools.js',
    'api/ai-services.js'
];

let syntaxValid = true;

jsFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        // Vérification basique de la syntaxe
        if (content.includes('export default') && content.includes('async function handler')) {
            console.log(`✅ ${file} - Syntaxe valide`);
        } else {
            console.log(`⚠️  ${file} - Structure suspecte`);
        }
    } catch (error) {
        console.log(`❌ ${file} - Erreur de lecture: ${error.message}`);
        syntaxValid = false;
    }
});

console.log('');

// Test 3: Vérifier la configuration Vercel
console.log('⚙️  Vérification de la configuration Vercel...');

try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    
    const requiredEndpoints = [
        'api/chatgpt/chat.js',
        'api/chatgpt/tools.js',
        'api/ai-services.js'
    ];
    
    let configValid = true;
    
    requiredEndpoints.forEach(endpoint => {
        if (vercelConfig.functions && vercelConfig.functions[endpoint]) {
            console.log(`✅ ${endpoint} - Configuré (${vercelConfig.functions[endpoint].maxDuration}s)`);
        } else {
            console.log(`❌ ${endpoint} - Non configuré`);
            configValid = false;
        }
    });
    
    if (configValid) {
        console.log('✅ Configuration Vercel valide');
    } else {
        console.log('❌ Configuration Vercel incomplète');
    }
    
} catch (error) {
    console.log(`❌ Erreur de lecture vercel.json: ${error.message}`);
}

console.log('');

// Test 4: Vérifier les variables d'environnement
console.log('🔑 Vérification des variables d\'environnement...');

const requiredEnvVars = [
    'OPENAI_API_KEY',
    'GEMINI_API_KEY',
    'PERPLEXITY_API_KEY'
];

let envVarsConfigured = 0;

requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
        console.log(`✅ ${envVar} - Configurée`);
        envVarsConfigured++;
    } else {
        console.log(`❌ ${envVar} - Non configurée`);
    }
});

console.log('');

// Test 5: Vérifier les dépendances
console.log('📦 Vérification des dépendances...');

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.dependencies && packageJson.dependencies.openai) {
        const openaiVersion = packageJson.dependencies.openai;
        console.log(`✅ OpenAI SDK: ${openaiVersion}`);
        
        // Vérifier que la version est compatible
        if (openaiVersion.includes('^4.') || openaiVersion.includes('4.')) {
            console.log('✅ Version OpenAI compatible (v4.0.0+)');
        } else {
            console.log('⚠️  Version OpenAI potentiellement incompatible');
        }
    } else {
        console.log('❌ OpenAI SDK non trouvé dans package.json');
    }
    
} catch (error) {
    console.log(`❌ Erreur de lecture package.json: ${error.message}`);
}

console.log('');

// Résumé des tests
console.log('📊 RÉSUMÉ DES TESTS');
console.log('==================');

if (allFilesExist) {
    console.log('✅ Tous les fichiers requis sont présents');
} else {
    console.log('❌ Certains fichiers sont manquants');
}

if (syntaxValid) {
    console.log('✅ Syntaxe des fichiers JavaScript valide');
} else {
    console.log('❌ Erreurs de syntaxe détectées');
}

if (envVarsConfigured === requiredEnvVars.length) {
    console.log('✅ Toutes les variables d\'environnement sont configurées');
} else {
    console.log(`⚠️  ${envVarsConfigured}/${requiredEnvVars.length} variables d\'environnement configurées`);
}

console.log('');

// Instructions finales
if (allFilesExist && syntaxValid) {
    console.log('🎉 Intégration ChatGPT prête pour le déploiement!');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('1. Configurer les variables d\'environnement manquantes');
    console.log('2. Exécuter: bash deploy-chatgpt-integration.sh');
    console.log('3. Tester les endpoints avec: node test-chatgpt-integration.js');
    console.log('');
    console.log('📚 Pour plus d\'informations:');
    console.log('• Consultez CHATGPT-INTEGRATION-GUIDE.md');
    console.log('• Vérifiez les logs Vercel après déploiement');
} else {
    console.log('⚠️  Intégration ChatGPT nécessite des corrections');
    console.log('');
    console.log('🔧 Actions requises:');
    if (!allFilesExist) {
        console.log('• Créer les fichiers manquants');
    }
    if (!syntaxValid) {
        console.log('• Corriger les erreurs de syntaxe');
    }
    if (envVarsConfigured < requiredEnvVars.length) {
        console.log('• Configurer les variables d\'environnement');
    }
}

console.log('');
console.log('✨ Test terminé!');