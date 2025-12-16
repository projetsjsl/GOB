
const https = require('https');

// API Key hardcoded as per previous debug sessions
const API_KEY = 'Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt';
const SYMBOL = 'COST';

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const fullUrl = `${url}${url.includes('?') ? '&' : '?'}apikey=${API_KEY}`;
        console.log(`Fetching ${fullUrl.replace(API_KEY, 'API_KEY')}...`);
        
        https.get(fullUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                    console.log('Raw data preview:', data.substring(0, 200));
                    resolve([]);
                }
            });
        }).on('error', (err) => {
            console.error('Error fetching URL:', err);
            reject(err);
        });
    });
}

async function runDebug() {
    try {
        console.log(`Debug ${SYMBOL}`);
        
/*
        // 1. Profile (Price, Currency, Sector)
        const profiles = await fetchUrl(`https://financialmodelingprep.com/api/v3/profile/${SYMBOL}`);
        if (profiles.length > 0) {
            console.log('Profile Price:', profiles[0].price);
            console.log('Profile Currency:', profiles[0].currency);
            console.log('Profile Sector:', profiles[0].sector);
        } else {
            console.log('❌ Profile not found');
        }
*/
        // 2. Key Metrics (Annual) - Backend Limit 30
        console.log('\n--- Key Metrics (Annual, limit=30 - BACKEND SIMULATION) ---');
        const startMetrics = Date.now();
        const metrics = await fetchUrl(`https://financialmodelingprep.com/api/v3/key-metrics/${SYMBOL}?period=annual&limit=30`);
        console.log(`Metrics fetch took ${Date.now() - startMetrics}ms`);
        
        if (metrics.length > 0) {
            console.log(`Fetched ${metrics.length} metrics.`);
            const m = metrics[0]; // Recent
            const year = m.date.substring(0,4);
            console.log(`Recent (${year}) - EPS: ${m.netIncomePerShare}, Rev/Share: ${m.revenuePerShare}`);
        } else {
            console.log('❌ No Key Metrics found');
        }

/*
        // 3. Financial Statements (Income) for basic sanity
        // ... (commented out) ...
*/

        // 5. Historical Prices (Backend Limit 7300)
        console.log('\n--- Historical Prices (timeseries=7300 - BACKEND SIMULATION) ---');
        const startPrices = Date.now();
        const prices = await fetchUrl(`https://financialmodelingprep.com/api/v3/historical-price-full/${SYMBOL}?serietype=line&timeseries=7300`);
        console.log(`Prices fetch took ${Date.now() - startPrices}ms`);
        
        if (prices.historical && prices.historical.length > 0) {
            console.log(`Found ${prices.historical.length} price records.`);
        } else {
            console.log('❌ No historical prices found (or empty list)');
        }

    } catch (e) {
        console.error('Run failed:', e);
    }
}

runDebug();
