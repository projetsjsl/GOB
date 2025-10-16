/**
 * Script de migration des données Seeking Alpha vers Supabase
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STOCK_ANALYSIS_FILE = path.join(__dirname, 'public', 'stock_analysis.json');

async function migrateSeekingAlphaToSupabase() {
    console.log('🚀 Starting Seeking Alpha data migration to Supabase...');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase configuration');
        console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
        process.exit(1);
    }

    // Vérifier que le fichier existe
    if (!fs.existsSync(STOCK_ANALYSIS_FILE)) {
        console.error(`❌ Stock analysis file not found: ${STOCK_ANALYSIS_FILE}`);
        process.exit(1);
    }

    try {
        // Lire et parser le fichier JSON
        console.log('📖 Reading stock_analysis.json...');
        const fileContent = fs.readFileSync(STOCK_ANALYSIS_FILE, 'utf8');
        const stockData = JSON.parse(fileContent);

        if (!Array.isArray(stockData)) {
            throw new Error('Invalid JSON format: expected array');
        }

        console.log(`📊 Found ${stockData.length} entries in stock_analysis.json`);

        // Vérifier la connexion Supabase
        console.log('🔍 Testing Supabase connection...');
        const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/seeking_alpha_data?select=count`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!testResponse.ok) {
            throw new Error(`Supabase connection failed: ${testResponse.status}`);
        }

        console.log('✅ Supabase connection successful');

        // Vérifier les données existantes
        const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/seeking_alpha_data?select=ticker,timestamp`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const existingData = await existingResponse.json();
        const existingSet = new Set(existingData.map(item => `${item.ticker}-${item.timestamp}`));

        console.log(`📊 Found ${existingData.length} existing entries in Supabase`);

        // Préparer les données à insérer
        const dataToInsert = stockData
            .filter(item => {
                const key = `${item.ticker}-${item.timestamp}`;
                return !existingSet.has(key);
            })
            .map(item => ({
                ticker: item.ticker,
                raw_text: item.raw_text,
                url: item.url,
                timestamp: item.timestamp
            }));

        if (dataToInsert.length === 0) {
            console.log('✅ All Seeking Alpha data already exists in Supabase');
            return;
        }

        console.log(`📝 Inserting ${dataToInsert.length} new entries...`);

        // Insérer les données par batch
        const batchSize = 5; // Plus petit batch car les données sont volumineuses
        let insertedCount = 0;

        for (let i = 0; i < dataToInsert.length; i += batchSize) {
            const batch = dataToInsert.slice(i, i + batchSize);
            
            try {
                const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/seeking_alpha_data`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(batch)
                });

                if (!insertResponse.ok) {
                    const errorData = await insertResponse.json();
                    console.error(`❌ Batch insert failed: ${insertResponse.status}`, errorData);
                    continue;
                }

                insertedCount += batch.length;
                console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.map(item => item.ticker).join(', ')}`);
                
                // Pause entre les batches pour éviter les rate limits
                if (i + batchSize < dataToInsert.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
                continue;
            }
        }

        console.log(`🎉 Migration completed successfully!`);
        console.log(`📊 Total entries inserted: ${insertedCount}`);
        console.log(`📊 Total entries in database: ${existingData.length + insertedCount}`);

        // Statistiques par ticker
        const statsResponse = await fetch(`${SUPABASE_URL}/rest/v1/seeking_alpha_data?select=ticker`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const allData = await statsResponse.json();
        const tickerStats = allData.reduce((acc, item) => {
            acc[item.ticker] = (acc[item.ticker] || 0) + 1;
            return acc;
        }, {});

        console.log('\n📋 Data per ticker:');
        Object.entries(tickerStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([ticker, count]) => {
                console.log(`${ticker}: ${count} entries`);
            });

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Exécution du script
if (require.main === module) {
    migrateSeekingAlphaToSupabase()
        .then(() => {
            console.log('✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateSeekingAlphaToSupabase };
