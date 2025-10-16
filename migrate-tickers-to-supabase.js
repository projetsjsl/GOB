/**
 * Script de migration des 25 tickers hardcodés vers Supabase
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Liste des 25 tickers d'équipe (extraite du code hardcodé)
const TEAM_TICKERS = [
    'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
    'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
    'TRP', 'UNH', 'UL', 'VZ', 'WFC'
];

async function migrateTickersToSupabase() {
    console.log('🚀 Starting ticker migration to Supabase...');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase configuration');
        console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
        process.exit(1);
    }

    try {
        // Vérifier la connexion Supabase
        console.log('🔍 Testing Supabase connection...');
        const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/team_tickers?select=count`, {
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

        // Vérifier les tickers existants
        const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/team_tickers?select=ticker`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const existingTickers = await existingResponse.json();
        const existingTickerSet = new Set(existingTickers.map(t => t.ticker));

        console.log(`📊 Found ${existingTickers.length} existing tickers in Supabase`);

        // Préparer les tickers à insérer (avec priorité)
        const tickersToInsert = TEAM_TICKERS
            .filter(ticker => !existingTickerSet.has(ticker))
            .map((ticker, index) => ({
                ticker: ticker,
                priority: index + 1,
                notes: `Migré automatiquement depuis le code hardcodé`
            }));

        if (tickersToInsert.length === 0) {
            console.log('✅ All tickers already exist in Supabase');
            return;
        }

        console.log(`📝 Inserting ${tickersToInsert.length} new tickers...`);

        // Insérer les tickers par batch
        const batchSize = 10;
        let insertedCount = 0;

        for (let i = 0; i < tickersToInsert.length; i += batchSize) {
            const batch = tickersToInsert.slice(i, i + batchSize);
            
            const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/team_tickers`, {
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
                throw new Error(`Insert failed: ${insertResponse.status} - ${JSON.stringify(errorData)}`);
            }

            insertedCount += batch.length;
            console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.map(t => t.ticker).join(', ')}`);
        }

        console.log(`🎉 Migration completed successfully!`);
        console.log(`📊 Total tickers inserted: ${insertedCount}`);
        console.log(`📊 Total tickers in database: ${existingTickers.length + insertedCount}`);

        // Vérification finale
        const finalResponse = await fetch(`${SUPABASE_URL}/rest/v1/team_tickers?select=*&order=priority.asc`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const finalTickers = await finalResponse.json();
        console.log('\n📋 Final ticker list:');
        finalTickers.forEach((ticker, index) => {
            console.log(`${index + 1}. ${ticker.ticker} (priority: ${ticker.priority})`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Exécution du script
migrateTickersToSupabase()
    .then(() => {
        console.log('✅ Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration script failed:', error);
        process.exit(1);
    });

module.exports = { migrateTickersToSupabase, TEAM_TICKERS };
