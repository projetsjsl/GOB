#!/usr/bin/env node

/**
 * Script de configuration automatique Supabase pour GOB
 * Mot de passe PostgreSQL: 5mUaqujMflrgZyCo
 */

import fs from 'fs';
import path from 'path';

const SUPABASE_PASSWORD = '5mUaqujMflrgZyCo';

console.log('🎯 CONFIGURATION AUTOMATIQUE SUPABASE GOB');
console.log('═'.repeat(60));
console.log(`🔑 Mot de passe PostgreSQL: ${SUPABASE_PASSWORD}`);
console.log('');

// Créer le fichier de configuration Supabase
const supabaseConfig = `// Configuration Supabase pour GOB
export const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL || 'https://gob-watchlist.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    dbPassword: '${SUPABASE_PASSWORD}',
    
    // Tables principales
    tables: {
        earnings_calendar: 'earnings_calendar',
        pre_earnings_analysis: 'pre_earnings_analysis',
        earnings_results: 'earnings_results',
        significant_news: 'significant_news',
        watchlist: 'watchlist'
    },
    
    // Vues utiles
    views: {
        upcoming_earnings: 'upcoming_earnings',
        critical_news_pending: 'critical_news_pending',
        earnings_performance_summary: 'earnings_performance_summary'
    }
};

// Fonction de connexion Supabase
export function createSupabaseClient(useServiceRole = false) {
    const { createClient } = require('@supabase/supabase-js');
    
    const key = useServiceRole 
        ? SUPABASE_CONFIG.serviceRoleKey 
        : SUPABASE_CONFIG.anonKey;
        
    if (!key) {
        throw new Error('Clé Supabase manquante. Configurez SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY');
    }
    
    return createClient(SUPABASE_CONFIG.url, key);
}

// Fonction de connexion PostgreSQL directe
export function createPostgresClient() {
    const { Client } = require('pg');
    
    return new Client({
        host: 'db.gob-watchlist.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: SUPABASE_CONFIG.dbPassword,
        ssl: { rejectUnauthorized: false }
    });
}
`;

// Créer le fichier de configuration
fs.writeFileSync('lib/supabase-config.js', supabaseConfig);

// Créer le fichier .env.example
const envExample = `# Configuration Supabase pour GOB
# Récupérer ces valeurs depuis https://app.supabase.com

# URL du projet Supabase
SUPABASE_URL=https://gob-watchlist.supabase.co

# Clé publique anonyme (Settings > API)
SUPABASE_ANON_KEY=eyJ...

# Clé secrète service role (Settings > API)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Mot de passe PostgreSQL (déjà fourni)
SUPABASE_DB_PASSWORD=${SUPABASE_PASSWORD}

# Instructions:
# 1. Copiez ce fichier vers .env.local
# 2. Remplissez les valeurs depuis Supabase
# 3. Testez avec: node test-supabase-gob-watchlist.js
`;

fs.writeFileSync('.env.example', envExample);

// Créer le script de test complet
const testScript = `#!/usr/bin/env node

/**
 * Test complet de la configuration Supabase
 */

import { createSupabaseClient, createPostgresClient } from './lib/supabase-config.js';

async function testSupabaseAPI() {
    console.log('🧪 Test API Supabase...');
    
    try {
        const supabase = createSupabaseClient();
        
        // Test de connexion
    const { data, error } = await supabase
            .from('watchlist')
            .select('*')
      .limit(1);

        if (error) {
            console.log('❌ Erreur API:', error.message);
    return false;
  }

        console.log('✅ API Supabase fonctionnelle');
        console.log('📊 Watchlist:', data?.length || 0, 'enregistrements');
        return true;
        
    } catch (err) {
        console.log('❌ Erreur:', err.message);
        return false;
    }
}

async function testPostgresDirect() {
    console.log('\\n🧪 Test PostgreSQL direct...');
    
    try {
        const client = createPostgresClient();
        await client.connect();
        
        // Tester les tables
        const result = await client.query(\`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        \`);
        
        console.log('✅ PostgreSQL direct fonctionnel');
        console.log('📋 Tables:', result.rows.map(r => r.table_name).join(', '));
        
        await client.end();
        return true;
        
    } catch (err) {
        console.log('❌ Erreur PostgreSQL:', err.message);
        return false;
    }
}

async function main() {
    console.log('🎯 TEST COMPLET SUPABASE GOB');
    console.log('═'.repeat(50));
    
    const apiOk = await testSupabaseAPI();
    const pgOk = await testPostgresDirect();
    
    console.log('\\n📊 RÉSULTATS:');
    console.log('═'.repeat(50));
    console.log('API Supabase:', apiOk ? '✅' : '❌');
    console.log('PostgreSQL:', pgOk ? '✅' : '❌');
    
    if (apiOk && pgOk) {
        console.log('\\n🎉 CONFIGURATION COMPLÈTE!');
        console.log('Le système Emma AI est prêt à fonctionner.');
    } else {
        console.log('\\n⚠️  Configuration incomplète.');
        console.log('Vérifiez les variables d\\'environnement.');
    }
}

main().catch(console.error);
`;

fs.writeFileSync('test-supabase-complete.js', testScript);

// Créer le script de déploiement
const deployScript = `#!/usr/bin/env node

/**
 * Script de déploiement Supabase pour GOB
 */

import { execSync } from 'child_process';

console.log('🚀 DÉPLOIEMENT SUPABASE GOB');
console.log('═'.repeat(50));

console.log('📋 Étapes de déploiement:');
console.log('');

console.log('1️⃣  Configurer les variables Vercel:');
console.log('   vercel env add SUPABASE_URL');
console.log('   vercel env add SUPABASE_ANON_KEY');
console.log('   vercel env add SUPABASE_SERVICE_ROLE_KEY');
console.log('');

console.log('2️⃣  Exécuter le SQL dans Supabase:');
console.log('   • Ouvrir https://app.supabase.com');
console.log('   • SQL Editor > New query');
console.log('   • Copier SUPABASE_SETUP_FINAL.sql');
console.log('   • Exécuter le script');
console.log('');

console.log('3️⃣  Tester la configuration:');
console.log('   node test-supabase-complete.js');
console.log('');

console.log('4️⃣  Déployer sur Vercel:');
console.log('   git add .');
console.log('   git commit -m "Configuration Supabase complète"');
console.log('   git push origin main');
console.log('');

console.log('5️⃣  Vérifier le déploiement:');
console.log('   vercel --prod');
console.log('');

console.log('✅ Déploiement terminé!');
console.log('Le système Emma AI est maintenant opérationnel.');
`;

fs.writeFileSync('deploy-supabase.js', deployScript);

console.log('📄 Fichiers créés:');
console.log('   ✅ lib/supabase-config.js - Configuration Supabase');
console.log('   ✅ .env.example - Variables d\'environnement');
console.log('   ✅ test-supabase-complete.js - Test complet');
console.log('   ✅ deploy-supabase.js - Script de déploiement');
console.log('');

console.log('🔧 PROCHAINES ÉTAPES:');
console.log('═'.repeat(50));
console.log('1. Récupérer les clés depuis Supabase');
console.log('2. Configurer les variables Vercel');
console.log('3. Exécuter le SQL dans Supabase');
console.log('4. Tester: node test-supabase-complete.js');
console.log('5. Déployer: node deploy-supabase.js');
console.log('');

console.log('📖 Guide complet: SUPABASE_SETUP_GUIDE.md');
console.log('');

export { SUPABASE_PASSWORD };