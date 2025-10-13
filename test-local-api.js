// Test local des APIs pour diagnostiquer le problème
const fs = require('fs');
const path = require('path');

console.log('🧪 Test local des APIs');
console.log('=====================');
console.log('');

// Vérifier que les fichiers existent
const apiFiles = [
    'api/gemini/chat.js',
    'api/news/cached.js',
    'api/cron/refresh-news.js',
    'vercel.json'
];

console.log('📋 Vérification des fichiers:');
apiFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} existe`);
        
        // Vérifier la syntaxe basique
        try {
            const content = fs.readFileSync(file, 'utf8');
            if (file.endsWith('.js')) {
                // Vérifier que c'est un module ES6 valide
                if (content.includes('export default') || content.includes('module.exports')) {
                    console.log(`   ✅ Syntaxe module OK`);
                } else {
                    console.log(`   ⚠️ Pas de export trouvé`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Erreur lecture: ${error.message}`);
        }
    } else {
        console.log(`❌ ${file} manquant`);
    }
});

console.log('');
console.log('📊 Vérification vercel.json:');
try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    console.log('✅ vercel.json valide');
    console.log(`   Fonctions configurées: ${Object.keys(vercelConfig.functions || {}).length}`);
    console.log(`   Crons configurés: ${(vercelConfig.crons || []).length}`);
    
    // Vérifier les nouvelles fonctions
    const functions = vercelConfig.functions || {};
    if (functions['api/news/cached.js']) {
        console.log('   ✅ api/news/cached.js configurée');
    } else {
        console.log('   ❌ api/news/cached.js non configurée');
    }
    
    if (functions['api/cron/refresh-news.js']) {
        console.log('   ✅ api/cron/refresh-news.js configurée');
    } else {
        console.log('   ❌ api/cron/refresh-news.js non configurée');
    }
    
} catch (error) {
    console.log(`❌ Erreur vercel.json: ${error.message}`);
}

console.log('');
console.log('🔍 Vérification des imports dans les APIs:');

// Vérifier les imports dans api/news/cached.js
try {
    const cachedContent = fs.readFileSync('api/news/cached.js', 'utf8');
    if (cachedContent.includes("import { createClient }")) {
        console.log('✅ api/news/cached.js: Import Supabase OK');
    } else {
        console.log('❌ api/news/cached.js: Import Supabase manquant');
    }
} catch (error) {
    console.log(`❌ Erreur lecture api/news/cached.js: ${error.message}`);
}

// Vérifier les imports dans api/cron/refresh-news.js
try {
    const cronContent = fs.readFileSync('api/cron/refresh-news.js', 'utf8');
    if (cronContent.includes("import { createClient }")) {
        console.log('✅ api/cron/refresh-news.js: Import Supabase OK');
    } else {
        console.log('❌ api/cron/refresh-news.js: Import Supabase manquant');
    }
    
    if (cronContent.includes('process.env.CRON_SECRET')) {
        console.log('✅ api/cron/refresh-news.js: CRON_SECRET configuré');
    } else {
        console.log('❌ api/cron/refresh-news.js: CRON_SECRET manquant');
    }
} catch (error) {
    console.log(`❌ Erreur lecture api/cron/refresh-news.js: ${error.message}`);
}

console.log('');
console.log('💡 Recommandations:');
console.log('==================');
console.log('1. Vérifier les logs Vercel Dashboard');
console.log('2. Essayer de redéployer manuellement');
console.log('3. Vérifier que toutes les variables d\'environnement sont configurées');
console.log('4. Tester avec un endpoint simple d\'abord');
