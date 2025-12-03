import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const EXCEL_FILE = path.join(process.cwd(), 'public', '3p1', 'confirmationtest.xlsx');
const API_BASE_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://gobapps.com';

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
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers?is_active=true&limit=1000`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erreur lors du chargement des tickers');
        }
        
        return (result.tickers || []).map(t => t.ticker.toUpperCase());
    } catch (error) {
        console.error('❌ Erreur récupération tickers existants:', error.message);
        return [];
    }
}

async function addTickerToSupabase(ticker) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticker: ticker.ticker.toUpperCase(),
                company_name: ticker.company_name || null,
                sector: ticker.sector || null,
                country: ticker.country || null,
                exchange: ticker.exchange || null,
                currency: ticker.currency || 'USD',
                source: 'watchlist',
                priority: 1,
                is_active: true
            })
        });
        
        const result = await response.json();
        
        if (response.status === 409) {
            // Ticker existe déjà
            return { success: false, exists: true, ticker: ticker.ticker };
        }
        
        if (!result.success) {
            return { success: false, error: result.error, ticker: ticker.ticker };
        }
        
        return { success: true, ticker: ticker.ticker };
    } catch (error) {
        return { success: false, error: error.message, ticker: ticker.ticker };
    }
}

async function main() {
    console.log('=== AJOUT TICKERS DEPUIS EXCEL VERS SUPABASE ===\n');
    console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);
    
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
            currency: 'USD' // Par défaut
        }))
        .filter(t => t.ticker && t.ticker.trim().length > 0)
        .map(t => ({ ...t, ticker: t.ticker.toUpperCase().trim() }));
    
    // Dédupliquer par ticker
    const uniqueTickers = [];
    const seenTickers = new Set();
    for (const t of tickersFromExcel) {
        if (!seenTickers.has(t.ticker)) {
            seenTickers.add(t.ticker);
            uniqueTickers.push(t);
        }
    }
    
    console.log(`✅ ${uniqueTickers.length} tickers uniques extraits\n`);
    
    // 3. Récupérer les tickers existants
    console.log('🔍 Vérification des tickers existants dans Supabase...');
    const existingTickers = await getExistingTickers();
    console.log(`✅ ${existingTickers.length} tickers existants trouvés\n`);
    
    // 4. Filtrer les nouveaux tickers
    const tickersToAdd = uniqueTickers.filter(t => !existingTickers.includes(t.ticker));
    const tickersAlreadyExist = uniqueTickers.filter(t => existingTickers.includes(t.ticker));
    
    console.log(`📊 Statistiques:`);
    console.log(`   - Tickers dans Excel: ${uniqueTickers.length}`);
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
    
    // 6. Ajouter les tickers (avec délai pour éviter rate limiting)
    console.log('🚀 Ajout des tickers à Supabase...\n');
    
    let added = 0;
    let exists = 0;
    let errors = 0;
    const errorDetails = [];
    
    for (let i = 0; i < tickersToAdd.length; i++) {
        const ticker = tickersToAdd[i];
        const result = await addTickerToSupabase(ticker);
        
        if (result.success) {
            added++;
            if (added % 10 === 0) {
                console.log(`   ✅ ${added}/${tickersToAdd.length} ajoutés...`);
            }
        } else if (result.exists) {
            exists++;
        } else {
            errors++;
            errorDetails.push({ ticker: ticker.ticker, error: result.error });
        }
        
        // Délai pour éviter rate limiting (50ms entre chaque requête)
        if (i < tickersToAdd.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    
    // 7. Résumé
    console.log('\n=== RÉSUMÉ ===');
    console.log(`✅ Tickers ajoutés: ${added}`);
    console.log(`⚠️  Tickers déjà existants: ${exists}`);
    console.log(`❌ Erreurs: ${errors}`);
    if (errorDetails.length > 0) {
        console.log('\nErreurs détaillées (premiers 10):');
        errorDetails.slice(0, 10).forEach(e => {
            console.log(`   - ${e.ticker}: ${e.error}`);
        });
        if (errorDetails.length > 10) {
            console.log(`   ... et ${errorDetails.length - 10} autres erreurs`);
        }
    }
    console.log(`\n📊 Total tickers dans Supabase après ajout: ${existingTickers.length + added}`);
    console.log('\n✅ Processus terminé!');
}

main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

