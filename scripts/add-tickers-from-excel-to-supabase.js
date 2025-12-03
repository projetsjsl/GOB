import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
// Les variables d'environnement sont chargées automatiquement par Vercel/Node
// Pour local, utiliser .env.local ou les variables système

const EXCEL_FILE = path.join(process.cwd(), 'public', '3p1', 'confirmationtest.xlsx');

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
    console.error('   SUPABASE_KEY:', SUPABASE_KEY ? '✅' : '❌');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function readExcelFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier non trouvé: ${filePath}`);
        return null;
    }
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null, raw: false });
}

async function getExistingTickers() {
    const { data, error } = await supabase
        .from('tickers')
        .select('ticker')
        .eq('is_active', true);
    
    if (error) {
        console.error('❌ Erreur récupération tickers existants:', error);
        return [];
    }
    
    return data.map(t => t.ticker.toUpperCase());
}

async function addTickersToSupabase(tickersToAdd) {
    if (tickersToAdd.length === 0) {
        console.log('✅ Aucun nouveau ticker à ajouter');
        return { added: 0, errors: [] };
    }
    
    console.log(`\n📝 Ajout de ${tickersToAdd.length} tickers à Supabase...`);
    
    // Insérer par batch de 50 pour éviter les limites
    const batchSize = 50;
    let added = 0;
    const errors = [];
    
    for (let i = 0; i < tickersToAdd.length; i += batchSize) {
        const batch = tickersToAdd.slice(i, i + batchSize);
        
        const insertData = batch.map(t => ({
            ticker: t.ticker.toUpperCase(),
            company_name: t.company_name || null,
            sector: t.sector || null,
            country: t.country || null,
            exchange: t.exchange || null,
            currency: t.currency || 'USD',
            source: 'watchlist',
            is_active: true,
            priority: 1,
            added_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
            .from('tickers')
            .insert(insertData)
            .select();
        
        if (error) {
            // Gérer les conflits (ticker existe déjà)
            if (error.code === '23505') {
                console.log(`⚠️  ${batch.length} tickers déjà existants dans ce batch, ignorés`);
            } else {
                console.error(`❌ Erreur batch ${i / batchSize + 1}:`, error.message);
                errors.push({ batch: i / batchSize + 1, error: error.message });
            }
        } else {
            added += data.length;
            console.log(`✅ Batch ${i / batchSize + 1}: ${data.length} tickers ajoutés`);
        }
    }
    
    return { added, errors };
}

async function main() {
    console.log('=== AJOUT TICKERS DEPUIS EXCEL VERS SUPABASE ===\n');
    
    // 1. Lire le fichier Excel
    console.log('📖 Lecture du fichier Excel...');
    const data = readExcelFile(EXCEL_FILE);
    
    if (!data) {
        process.exit(1);
    }
    
    console.log(`✅ ${data.length} lignes lues depuis ${EXCEL_FILE}\n`);
    
    // 2. Extraire les tickers
    console.log('🔍 Extraction des tickers...');
    const tickersFromExcel = data
        .map(row => ({
            ticker: row.Ticker || row.ticker,
            company_name: row['Company Name'] || row.company_name || null,
            sector: null, // Pas dans le Excel, sera rempli par API plus tard
            country: row.Country || null,
            exchange: row.Exchange || null,
            currency: 'USD' // Par défaut, sera ajusté si nécessaire
        }))
        .filter(t => t.ticker && t.ticker.trim().length > 0)
        .map(t => ({ ...t, ticker: t.ticker.toUpperCase().trim() }));
    
    console.log(`✅ ${tickersFromExcel.length} tickers extraits\n`);
    
    // 3. Récupérer les tickers existants
    console.log('🔍 Vérification des tickers existants dans Supabase...');
    const existingTickers = await getExistingTickers();
    console.log(`✅ ${existingTickers.length} tickers existants trouvés\n`);
    
    // 4. Filtrer les nouveaux tickers
    const tickersToAdd = tickersFromExcel.filter(t => !existingTickers.includes(t.ticker));
    const tickersAlreadyExist = tickersFromExcel.filter(t => existingTickers.includes(t.ticker));
    
    console.log(`📊 Statistiques:`);
    console.log(`   - Tickers dans Excel: ${tickersFromExcel.length}`);
    console.log(`   - Tickers déjà dans Supabase: ${tickersAlreadyExist.length}`);
    console.log(`   - Nouveaux tickers à ajouter: ${tickersToAdd.length}\n`);
    
    if (tickersToAdd.length === 0) {
        console.log('✅ Tous les tickers sont déjà dans Supabase');
        return;
    }
    
    // 5. Afficher quelques exemples
    console.log('📋 Exemples de nouveaux tickers à ajouter:');
    tickersToAdd.slice(0, 10).forEach(t => {
        console.log(`   - ${t.ticker} (${t.company_name || 'N/A'})`);
    });
    if (tickersToAdd.length > 10) {
        console.log(`   ... et ${tickersToAdd.length - 10} autres\n`);
    }
    
    // 6. Demander confirmation (automatique pour script)
    console.log('🚀 Ajout des tickers à Supabase...\n');
    
    // 7. Ajouter les tickers
    const result = await addTickersToSupabase(tickersToAdd);
    
    // 8. Résumé
    console.log('\n=== RÉSUMÉ ===');
    console.log(`✅ Tickers ajoutés: ${result.added}`);
    console.log(`⚠️  Erreurs: ${result.errors.length}`);
    if (result.errors.length > 0) {
        console.log('\nErreurs détaillées:');
        result.errors.forEach(e => console.log(`   - Batch ${e.batch}: ${e.error}`));
    }
    console.log(`\n📊 Total tickers dans Supabase après ajout: ${existingTickers.length + result.added}`);
}

main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

