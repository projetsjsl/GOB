
const https = require('https');

const API_KEY = 'Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt';

// Common Canadian REITs and Corps that often have .UN / -UN suffixes
const CANDIDATES = [
    { base: 'SRU', name: 'SmartCentres' },
    { base: 'AP', name: 'Allied Properties' },
    { base: 'CAR', name: 'CAPREIT' },
    { base: 'DIR', name: 'Dream Industrial' },
    { base: 'GRT', name: 'Granite' },
    { base: 'CSH', name: 'Chartwell' },
    { base: 'CHP', name: 'Choice Properties' },
    { base: 'BIP', name: 'Brookfield Infra' },
    { base: 'BEP', name: 'Brookfield Renew' },
    { base: 'HR', name: 'H&R REIT' },
    { base: 'KMP', name: 'Killam' },
    { base: 'NWH', name: 'NorthWest Health' }
];

function checkSymbol(symbol) {
    return new Promise((resolve) => {
        const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${API_KEY}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (Array.isArray(json) && json.length > 0) {
                        resolve(true); // Found!
                    } else {
                        resolve(false);
                    }
                } catch(e) { resolve(false); }
            });
        }).on('error', () => resolve(false));
    });
}

async function runCheck() {
    console.log('Checking Canadian Ticker Variants on FMP...\n');
    
    for (const c of CANDIDATES) {
        process.stdout.write(`Checking ${c.name} (${c.base})... `);
        
        // Try variants
        const v1 = `${c.base}.TO`;
        const v2 = `${c.base}-UN.TO`; // FMP often uses this for Units
        const v3 = `${c.base}.UN.TO`;
        
        const foundV1 = await checkSymbol(v1);
        const foundV2 = await checkSymbol(v2);
        const foundV3 = await checkSymbol(v3);
        
        const results = [];
        if (foundV1) results.push(v1);
        if (foundV2) results.push(v2);
        if (foundV3) results.push(v3);
        
        if (results.length > 0) {
            console.log(`✅ Valid: ${results.join(', ')}`);
        } else {
            console.log(`❌ NOT FOUND`);
        }
    }
}

runCheck();
