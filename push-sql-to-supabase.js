#!/usr/bin/env node

/**
 * Script pour pousser le code SQL vers Supabase
 * Utilise les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables d\'environnement Supabase manquantes:');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
    console.error('\n💡 Configurez ces variables dans Vercel ou localement');
    process.exit(1);
}

async function executeSQL(sqlContent, description) {
    console.log(`\n🚀 Exécution: ${description}`);
    console.log('─'.repeat(50));
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({
                sql: sqlContent
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.text();
        console.log('✅ Succès:', result);
        return true;
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return false;
    }
}

async function pushSQLToSupabase() {
    console.log('🎯 PUSH SQL VERS SUPABASE');
    console.log('═'.repeat(50));
    console.log(`📍 URL Supabase: ${SUPABASE_URL}`);
    console.log(`🔑 Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);

    // Liste des fichiers SQL à exécuter dans l'ordre
    const sqlFiles = [
        {
            file: 'supabase-schema-complete.sql',
            description: 'Schéma complet Supabase avec toutes les tables'
        },
        {
            file: 'SUPABASE_SETUP_FINAL.sql', 
            description: 'Configuration finale Emma AI'
        }
    ];

    let successCount = 0;
    let totalCount = sqlFiles.length;

    for (const { file, description } of sqlFiles) {
        const filePath = path.join(__dirname, file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Fichier non trouvé: ${file}`);
            continue;
        }

        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // Nettoyer le SQL (enlever les commentaires de début/fin)
        const cleanSQL = sqlContent
            .replace(/^--.*$/gm, '') // Enlever les commentaires de ligne
            .replace(/\/\*[\s\S]*?\*\//g, '') // Enlever les commentaires de bloc
            .trim();

        if (cleanSQL.length === 0) {
            console.log(`⚠️  Fichier vide: ${file}`);
            continue;
        }

        const success = await executeSQL(cleanSQL, description);
        if (success) {
            successCount++;
        }

        // Pause entre les exécutions
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 RÉSULTATS FINAUX');
    console.log('═'.repeat(50));
    console.log(`✅ Succès: ${successCount}/${totalCount}`);
    console.log(`❌ Échecs: ${totalCount - successCount}/${totalCount}`);

    if (successCount === totalCount) {
        console.log('\n🎉 TOUS LES SCRIPTS SQL ONT ÉTÉ EXÉCUTÉS AVEC SUCCÈS!');
        console.log('💡 Vérifiez votre dashboard Supabase pour voir les nouvelles tables.');
    } else {
        console.log('\n⚠️  Certains scripts ont échoué. Vérifiez les erreurs ci-dessus.');
    }
}

// Fonction alternative utilisant l'API REST directe
async function createTablesDirectly() {
    console.log('\n🔄 Tentative alternative: Création directe des tables...');
    
    const tables = [
        {
            name: 'committee_recommendations',
            sql: `
                CREATE TABLE IF NOT EXISTS committee_recommendations (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    ticker TEXT NOT NULL,
                    action TEXT NOT NULL,
                    committee_date DATE NOT NULL,
                    recommendation_text TEXT NOT NULL,
                    rationale_data JSONB,
                    status TEXT DEFAULT 'pending_approval',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'watchlist',
            sql: `
                CREATE TABLE IF NOT EXISTS watchlist (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    ticker TEXT NOT NULL UNIQUE,
                    company_name TEXT,
                    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    notes TEXT,
                    target_price DECIMAL(10,2),
                    stop_loss DECIMAL(10,2)
                );
            `
        }
    ];

    for (const table of tables) {
        await executeSQL(table.sql, `Création table ${table.name}`);
    }
}

// Exécution principale
async function main() {
    try {
        await pushSQLToSupabase();
        
        // Si échec, essayer la méthode alternative
        if (successCount < totalCount) {
            await createTablesDirectly();
        }
        
    } catch (error) {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }
}

// Variables globales pour le suivi
let successCount = 0;
let totalCount = 0;

// Exécuter le script
if (require.main === module) {
    main();
}

module.exports = { pushSQLToSupabase, executeSQL };
