/**
 * Script de diagnostic pour identifier pourquoi des données sont à 0
 * Usage: node scripts/diagnose-zero-data.js BP
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ticker = process.argv[2]?.toUpperCase() || 'BP';

console.log(`🔍 Diagnostic des données à 0 pour ${ticker}\n`);

// 1. Vérifier l'API FMP
console.log('1️⃣ Vérification API FMP...');
try {
    const https = require('https');
    const url = `https://gobapps.com/api/fmp-company-data?symbol=${ticker}`;
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            const json = JSON.parse(data);
            console.log(`   ✅ API FMP: ${json.data?.length || 0} années de données`);
            
            if (json.data && json.data.length > 0) {
                const sample = json.data.slice(0, 3);
                console.log(`   📊 Exemples de données FMP:`);
                sample.forEach(d => {
                    console.log(`      ${d.year}: EPS=${d.earningsPerShare}, CF=${d.cashFlowPerShare}, BV=${d.bookValuePerShare}`);
                });
                
                // Compter les zéros
                const zeroCounts = {
                    eps: json.data.filter(d => !d.earningsPerShare || d.earningsPerShare === 0).length,
                    cf: json.data.filter(d => !d.cashFlowPerShare || d.cashFlowPerShare === 0).length,
                    bv: json.data.filter(d => !d.bookValuePerShare || d.bookValuePerShare === 0).length
                };
                console.log(`   ⚠️  Zéros dans FMP: EPS=${zeroCounts.eps}/${json.data.length}, CF=${zeroCounts.cf}/${json.data.length}, BV=${zeroCounts.bv}/${json.data.length}`);
            } else {
                console.log(`   ❌ Aucune donnée retournée par FMP`);
            }
            
            // 2. Vérifier Supabase (si possible)
            console.log(`\n2️⃣ Vérification Supabase...`);
            console.log(`   ℹ️  Pour vérifier Supabase, utilisez l'interface admin ou la console Supabase`);
            console.log(`   📝 Requête SQL suggérée:`);
            console.log(`      SELECT ticker, snapshot_date, annual_data->0 as first_year_data`);
            console.log(`      FROM finance_snapshots`);
            console.log(`      WHERE ticker = '${ticker}'`);
            console.log(`      ORDER BY snapshot_date DESC LIMIT 1;`);
            
            // 3. Recommandations
            console.log(`\n3️⃣ Recommandations:`);
            if (json.data && json.data.length > 0) {
                const hasZeros = json.data.some(d => 
                    (!d.earningsPerShare || d.earningsPerShare === 0) &&
                    (!d.cashFlowPerShare || d.cashFlowPerShare === 0) &&
                    (!d.bookValuePerShare || d.bookValuePerShare === 0)
                );
                
                if (hasZeros) {
                    console.log(`   ⚠️  Certaines années ont toutes les valeurs à 0 (normal pour certaines entreprises)`);
                }
                
                console.log(`   ✅ Les données FMP sont disponibles`);
                console.log(`   🔄 Action recommandée: Synchroniser ${ticker} depuis l'interface 3p1`);
                console.log(`      - Cliquez sur "⚙️ Options Sync" dans le header`);
                console.log(`      - Sélectionnez "Synchroniser les données"`);
                console.log(`      - Cliquez sur "Synchroniser"`);
            } else {
                console.log(`   ❌ Les données FMP ne sont pas disponibles`);
                console.log(`   🔍 Vérifiez que le symbole ${ticker} est correct`);
                console.log(`   📝 Essayez des variantes (ex: ${ticker}.L pour Londres)`);
            }
        });
    }).on('error', (err) => {
        console.error(`   ❌ Erreur API FMP:`, err.message);
    });
} catch (error) {
    console.error(`❌ Erreur:`, error.message);
}


