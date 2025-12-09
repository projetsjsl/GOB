
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
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
const fmpApiKey = process.env.FMP_API_KEY;

if (!supabaseUrl || !supabaseKey || !fmpApiKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateTickers() {
    console.log('🚀 Starting ticker validation...');

    try {
        // 1. Get active tickers from Supabase
        const { data: tickers, error } = await supabase
            .from('tickers')
            .select('ticker, company_name, sector')
            .eq('is_active', true);

        if (error) throw error;
        
        console.log(`Found ${tickers.length} active tickers.`);

        const problemTickers = [];

        // 2. Identify N/A tickers (simplified check - just calling FMP profile to see if it exists/is valid)
        // We do this in batches
        const batchSize = 10;
        for (let i = 0; i < tickers.length; i += batchSize) {
            const batch = tickers.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (t) => {
                try {
                     const symbol = t.ticker.toUpperCase();
                     const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${fmpApiKey}`;
                     const res = await fetch(url);
                     const data = await res.json();

                     if (!data || data.length === 0 || !data[0].price) {
                         problemTickers.push(t);
                         process.stdout.write('x'); // Visual progress
                     } else {
                         process.stdout.write('.');
                     }
                } catch (e) {
                    problemTickers.push(t);
                    process.stdout.write('E');
                }
            }));
            
            // Rate limit
            await new Promise(r => setTimeout(r, 200));
        }

        console.log(`\n\nFound ${problemTickers.length} potentially problematic tickers.`);
        
        // 3. Validate and find suggestions for problem tickers
        console.log('🔍 Searching for corrections...');
        
        const corrections = [];

        for (const t of problemTickers) {
            const companyName = t.company_name;
             if (!companyName) continue;

             try {
                // Search FMP
                const searchUrl = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(companyName)}&limit=10&apikey=${fmpApiKey}`;
                const res = await fetch(searchUrl);
                const results = await res.json();

                if (Array.isArray(results) && results.length > 0) {
                    // Filter for best match
                    // Prioritize exact name match if possible, and USD currency
                    const bestMatch = results.find(r => r.name && r.name.toUpperCase() === companyName.toUpperCase()) || results[0];
                    
                    if (bestMatch && bestMatch.symbol !== t.ticker) {
                        corrections.push({
                            original: t.ticker,
                            company: companyName,
                            suggested: bestMatch.symbol,
                            exchange: bestMatch.exchangeShortName,
                            currency: bestMatch.currency
                        });
                        console.log(`  💡 Correction found: ${t.ticker} -> ${bestMatch.symbol} (Exchange: ${bestMatch.exchangeShortName})`);
                    } else {
                        console.log(`  ❓ No better match for ${t.ticker} (${companyName}) - Search returned: ${results.map(r => r.symbol).join(', ')}`);
                    }
                } else {
                    console.log(`  ❌ No search results for ${t.ticker} (${companyName})`);
                }

             } catch (e) {
                 console.error(`Error validating ${t.ticker}:`, e.message);
             }
             
             // Rate limit
             await new Promise(r => setTimeout(r, 250));
        }

        console.log('\n--- VALIDATION SUMMARY ---');
        if (corrections.length > 0) {
            console.table(corrections);
            console.log(`\nFound ${corrections.length} suggested corrections.`);
        } else {
            console.log('No obvious corrections found.');
        }

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

validateTickers();
