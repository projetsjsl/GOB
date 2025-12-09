
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// High confidence corrections based on validation analysis
const CORRECTIONS = [
    // Canadian Stocks (add .TO)
    { old: 'BNS', new: 'BNS.TO' },
    { old: 'ENB', new: 'ENB.TO' },
    { old: 'AEM', new: 'AEM.TO' },
    { old: 'ABX', new: 'ABX.TO' },
    { old: 'BCE', new: 'BCE.TO' },
    { old: 'BMO', new: 'BMO.TO' },
    { old: 'CAE', new: 'CAE.TO' },
    { old: 'CM', new: 'CM.TO' },
    { old: 'CNQ', new: 'CNQ.TO' },
    { old: 'CNR', new: 'CNR.TO' },
    { old: 'CP', new: 'CP.TO' },
    { old: 'CTC.A', new: 'CTC-A.TO' }, // FMP often uses dash
    { old: 'DOL', new: 'DOL.TO' },
    { old: 'FTS', new: 'FTS.TO' },
    { old: 'GIB.A', new: 'GIB-A.TO' },
    { old: 'IMO', new: 'IMO.TO' },
    { old: 'L', new: 'L.TO' }, // Loblaws
    { old: 'MFC', new: 'MFC.TO' },
    { old: 'MG', new: 'MG.TO' },
    { old: 'MRU', new: 'MRU.TO' },
    { old: 'NA', new: 'NA.TO' },
    { old: 'PPL', new: 'PPL.TO' },
    { old: 'QBR.B', new: 'QBR-B.TO' },
    { old: 'RCI.B', new: 'RCI-B.TO' },
    { old: 'RY', new: 'RY.TO' },
    { old: 'SAP', new: 'SAP.TO' }, // Saputo
    { old: 'SHOP', new: 'SHOP.TO' },
    { old: 'SU', new: 'SU.TO' },
    { old: 'T', new: 'T.TO' }, // Telus (T is AT&T in US)
    { old: 'TD', new: 'TD.TO' },
    { old: 'TRI', new: 'TRI.TO' },
    { old: 'TRP', new: 'TRP.TO' },
    { old: 'WCN', new: 'WCN.TO' },
    { old: 'WN', new: 'WN.TO' },
    
    // US / Formatting Corrections
    { old: 'BRK.B', new: 'BRK-B' },
    { old: 'BF.B', new: 'BF-B' },
    { old: 'ATD.B', new: 'ATD.TO' }, // Couche Tard logic
];

async function applyCorrections() {
    console.log(`🚀 Starting application of ${CORRECTIONS.length} corrections...`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const correction of CORRECTIONS) {
        const { old: oldTicker, new: newTicker } = correction;
        process.stdout.write(`Processing ${oldTicker} -> ${newTicker}... `);

        try {
            // 1. Check if old ticker exists
            const { data: oldData, error: oldError } = await supabase
                .from('tickers')
                .select('*')
                .eq('ticker', oldTicker)
                .single();

            if (oldError || !oldData) {
                console.log('Skipped (Old ticker not found)');
                skippedCount++;
                continue;
            }

            // 2. Check if new ticker ALREADY exists
            const { data: newData, error: newError } = await supabase
                .from('tickers')
                .select('*')
                .eq('ticker', newTicker)
                .single();

            if (newData) {
                console.log('Skipped (Target ticker already exists)');
                // Optional: We could delete the old one if the new one is valid, 
                // but let's be safe and just leave it for manual review.
                skippedCount++;
                continue;
            }

            // 3. Update the ticker
            const { error: updateError } = await supabase
                .from('tickers')
                .update({ ticker: newTicker })
                .eq('ticker', oldTicker);

            if (updateError) {
                console.log(`❌ Error: ${updateError.message}`);
                errorCount++;
            } else {
                console.log('✅ Updated');
                updatedCount++;
            }

        } catch (err) {
            console.log(`❌ Exception: ${err.message}`);
            errorCount++;
        }
    }

    console.log('\n--- SUMMARY ---');
    console.log(`Total: ${CORRECTIONS.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
}

applyCorrections();
