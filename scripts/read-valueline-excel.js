/**
 * Script pour lire le fichier Excel ValueLine et générer le SQL de mise à jour
 * 
 * Usage: node scripts/read-valueline-excel.js
 * 
 * Prérequis:
 * npm install xlsx
 * 
 * Le fichier valueline.xlsx doit être à la racine du projet
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chercher le fichier Excel à plusieurs emplacements possibles
const possiblePaths = [
    path.join(__dirname, '..', 'valueline.xlsx'), // Racine
    path.join(__dirname, '..', 'public', '3p1', 'valueline.xlsx'), // public/3p1
    path.join(__dirname, '..', 'valueline.xlsx') // Fallback
];

let EXCEL_FILE = null;
for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
        EXCEL_FILE = filePath;
        break;
    }
}

// Si pas trouvé, utiliser le premier chemin par défaut
if (!EXCEL_FILE) {
    EXCEL_FILE = possiblePaths[0];
}

const OUTPUT_SQL = path.join(__dirname, '..', 'supabase-update-valueline-data.sql');
const OUTPUT_JS = path.join(__dirname, '..', 'scripts', 'valueline-data-generated.js');

function readExcelFile() {
    console.log('📖 Lecture du fichier Excel...\n');
    
    if (!fs.existsSync(EXCEL_FILE)) {
        console.error(`❌ Fichier non trouvé: ${EXCEL_FILE}`);
        console.error('   Assurez-vous que le fichier valueline.xlsx est à la racine du projet.');
        process.exit(1);
    }

    try {
        // Lire le fichier Excel
        const workbook = XLSX.readFile(EXCEL_FILE);
        
        // Afficher les noms des feuilles
        console.log('📋 Feuilles disponibles:', workbook.SheetNames.join(', '));
        
        // Prendre la première feuille (ou chercher une feuille spécifique)
        const sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase().includes('valueline') || 
            name.toLowerCase().includes('ticker') ||
            name.toLowerCase().includes('data')
        ) || workbook.SheetNames[0];
        
        console.log(`\n📄 Utilisation de la feuille: "${sheetName}"\n`);
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { 
            defval: null, // Valeurs par défaut null pour les cellules vides
            raw: false // Convertir les dates et nombres en strings
        });
        
        console.log(`✅ ${data.length} lignes trouvées\n`);
        
        // Afficher les premières lignes pour vérification
        if (data.length > 0) {
            console.log('📊 Aperçu des colonnes:', Object.keys(data[0]).join(', '));
            console.log('\n📋 Aperçu des 3 premières lignes:');
            console.log(JSON.stringify(data.slice(0, 3), null, 2));
            console.log('\n');
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Erreur lors de la lecture du fichier Excel:', error.message);
        process.exit(1);
    }
}

function normalizeColumnName(name) {
    if (!name) return null;
    
    // Normaliser les noms de colonnes
    const normalized = name.toString().trim().toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    
    // Mapping des noms possibles
    const mappings = {
        'ticker': 'ticker',
        'symbol': 'ticker',
        'symbole': 'ticker',
        'security_rank': 'security_rank',
        'securityrank': 'security_rank',
        'financial_strength': 'security_rank',
        'financial_strength_rating': 'security_rank',
        'financialstrengthrating': 'security_rank',
        'cote_securite': 'security_rank',
        'earnings_predictability': 'earnings_predictability',
        'earningspredictability': 'earnings_predictability',
        'predictability': 'earnings_predictability',
        'price_growth': 'price_growth',
        'pricegrowth': 'price_growth',
        'growth': 'price_growth',
        'price_growth_persistence': 'price_growth_persistence', // Colonne combinée
        'pricegrowthpersistence': 'price_growth_persistence',
        'persistence': 'persistence',
        'price_stability': 'price_stability',
        'pricestability': 'price_stability',
        'stability': 'price_stability'
    };
    
    return mappings[normalized] || normalized;
}

function parseValueLineData(excelData) {
    console.log('🔄 Parsing des données...\n');
    
    const tickers = {};
    
    excelData.forEach((row, index) => {
        // Normaliser les colonnes
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
            const normalizedKey = normalizeColumnName(key);
            if (normalizedKey) {
                normalizedRow[normalizedKey] = row[key];
            }
        });
        
        // Extraire le ticker
        const ticker = (normalizedRow.ticker || '').toString().trim().toUpperCase();
        
        if (!ticker) {
            console.warn(`⚠️ Ligne ${index + 2}: Ticker manquant, ignorée`);
            return;
        }
        
        // Extraire les métriques
        // IMPORTANT: "Price Growth Persistence" est une SEULE métrique ValueLine (note numérique 5-100)
        // Ce n'est PAS une combinaison de "Price Growth" et "Persistence"
        // Source: ValueLine Investment Survey - mesure la croissance persistante du prix (10 dernières années)
        let priceGrowth = normalizedRow.price_growth; // Peut être null si pas de colonne séparée
        let persistence = normalizedRow.persistence;
        
        // Si on a "price_growth_persistence" (colonne ValueLine unique)
        if (normalizedRow.price_growth_persistence && !persistence) {
            const value = String(normalizedRow.price_growth_persistence).trim();
            // "Price Growth Persistence" est une note numérique (5-100) = Persistence
            // Format: nombre entre 5 et 100 (par incréments de 5)
            if (/^\d+$/.test(value)) {
                persistence = value;
            } else {
                // Si format inattendu, essayer de parser
                persistence = value;
            }
        }
        
        // Note: price_growth reste null car il n'existe pas de colonne séparée dans valueline.xlsx
        // Si vous avez une source séparée pour Price Growth (format A++, A+, etc.), elle doit être ajoutée manuellement
        
        tickers[ticker] = {
            securityRank: normalizedRow.security_rank ? String(normalizedRow.security_rank).trim() : null,
            earningsPredictability: normalizedRow.earnings_predictability ? String(normalizedRow.earnings_predictability).trim() : null,
            priceGrowth: priceGrowth ? String(priceGrowth).trim() : null,
            persistence: persistence ? String(persistence).trim() : null,
            priceStability: normalizedRow.price_stability ? String(normalizedRow.price_stability).trim() : null
        };
        
        // Nettoyer les valeurs null
        Object.keys(tickers[ticker]).forEach(key => {
            if (tickers[ticker][key] === null || tickers[ticker][key] === '' || tickers[ticker][key] === 'N/A') {
                delete tickers[ticker][key];
            }
        });
    });
    
    console.log(`✅ ${Object.keys(tickers).length} tickers parsés\n`);
    
    return tickers;
}

function generateSQL(tickers) {
    console.log('📝 Génération du SQL...\n');
    
    const updates = [];
    const dateValue = '2025-12-03 00:00:00+00';
    
    Object.keys(tickers).sort().forEach(ticker => {
        const metrics = tickers[ticker];
        const setParts = [];
        
        if (metrics.securityRank) {
            setParts.push(`security_rank = '${metrics.securityRank.replace(/'/g, "''")}'`);
        }
        if (metrics.earningsPredictability) {
            setParts.push(`earnings_predictability = '${metrics.earningsPredictability.replace(/'/g, "''")}'`);
        }
        if (metrics.priceGrowth) {
            setParts.push(`price_growth = '${metrics.priceGrowth.replace(/'/g, "''")}'`);
        }
        if (metrics.persistence) {
            setParts.push(`persistence = '${metrics.persistence.replace(/'/g, "''")}'`);
        }
        if (metrics.priceStability) {
            setParts.push(`price_stability = '${metrics.priceStability.replace(/'/g, "''")}'`);
        }
        
        if (setParts.length > 0) {
            setParts.push(`valueline_updated_at = '${dateValue}'`);
            setParts.push(`updated_at = NOW()`);
            
            updates.push(`UPDATE tickers 
SET 
    ${setParts.join(',\n    ')}
WHERE ticker = '${ticker}';`);
        }
    });
    
    const sql = `-- ============================================================================
-- MISE À JOUR DES MÉTRIQUES VALUELINE
-- Généré automatiquement depuis valueline.xlsx
-- Date: ${new Date().toISOString()}
-- ============================================================================
-- 
-- Ce script met à jour les métriques ValueLine pour tous les tickers
-- Source: ValueLine au 3 décembre 2025
-- 
-- IMPORTANT: Exécuter d'abord supabase-add-valueline-metrics.sql si les colonnes n'existent pas
-- ============================================================================

${updates.join('\n\n')}

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
SELECT 
    ticker,
    security_rank,
    earnings_predictability,
    price_growth,
    persistence,
    price_stability,
    valueline_updated_at
FROM tickers
WHERE valueline_updated_at IS NOT NULL
ORDER BY ticker;
`;
    
    return sql;
}

function generateJS(tickers) {
    console.log('📝 Génération du fichier JavaScript...\n');
    
    const js = `/**
 * Données ValueLine générées automatiquement depuis valueline.xlsx
 * Date de génération: ${new Date().toISOString()}
 * Source: ValueLine au 3 décembre 2025
 */

const valuelineData = ${JSON.stringify(tickers, null, 2)};

module.exports = { valuelineData };
`;
    
    return js;
}

function main() {
    console.log('🚀 Script de lecture ValueLine Excel\n');
    console.log('='.repeat(60));
    console.log(`📁 Fichier: ${EXCEL_FILE}\n`);
    
    // Lire le fichier Excel
    const excelData = readExcelFile();
    
    // Parser les données
    const tickers = parseValueLineData(excelData);
    
    // Afficher un résumé
    console.log('📊 Résumé des métriques:');
    const metricsCount = {
        securityRank: 0,
        earningsPredictability: 0,
        priceGrowth: 0,
        persistence: 0,
        priceStability: 0
    };
    
    Object.values(tickers).forEach(ticker => {
        if (ticker.securityRank) metricsCount.securityRank++;
        if (ticker.earningsPredictability) metricsCount.earningsPredictability++;
        if (ticker.priceGrowth) metricsCount.priceGrowth++;
        if (ticker.persistence) metricsCount.persistence++;
        if (ticker.priceStability) metricsCount.priceStability++;
    });
    
    console.log(`   - Financial Strength: ${metricsCount.securityRank}`);
    console.log(`   - Earnings Predictability: ${metricsCount.earningsPredictability}`);
    console.log(`   - Price Growth: ${metricsCount.priceGrowth}`);
    console.log(`   - Persistence: ${metricsCount.persistence}`);
    console.log(`   - Price Stability: ${metricsCount.priceStability}\n`);
    
    // Générer le SQL
    const sql = generateSQL(tickers);
    fs.writeFileSync(OUTPUT_SQL, sql, 'utf8');
    console.log(`✅ SQL généré: ${OUTPUT_SQL}`);
    
    // Générer le JS
    const js = generateJS(tickers);
    fs.writeFileSync(OUTPUT_JS, js, 'utf8');
    console.log(`✅ JavaScript généré: ${OUTPUT_JS}\n`);
    
    console.log('='.repeat(60));
    console.log('✅ Génération terminée!\n');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Vérifier le fichier SQL généré');
    console.log('   2. Exécuter supabase-add-valueline-metrics.sql dans Supabase (si pas déjà fait)');
    console.log('   3. Exécuter supabase-update-valueline-data.sql dans Supabase');
    console.log('   4. Ou utiliser le script update-tickers-valueline-metrics.js avec les données générées\n');
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('read-valueline-excel.js')) {
    main();
}

export { readExcelFile, parseValueLineData, generateSQL, generateJS };

