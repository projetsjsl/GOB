
const https = require('https');

const FMP_KEY = "Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt";
const symbol = "WSP.TO";

async function fetchFMP(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `https://financialmodelingprep.com/api/v3/${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${FMP_KEY}`;
        console.log(`Fetching ${url.replace(FMP_KEY, 'API_KEY')}...`);
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed['Error Message']) {
                        reject(new Error(parsed['Error Message']));
                    } else {
                        resolve(parsed);
                    }
                } catch (e) {
                    console.error('Error parsing JSON:', data.substring(0, 100));
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log(`Debug WSP.TO`);
        
        // 1. Check Profile
        const profile = await fetchFMP(`profile/${symbol}`);
        console.log('Profile:', profile && profile.length > 0 ? profile[0].symbol : 'Not Found');
        if (profile && profile.length > 0) {
            console.log('Profile Price:', profile[0].price);
            console.log('Profile Currency:', profile[0].currency);
        }

        // 2. Key Metrics
        console.log('\n--- Key Metrics (Annual) ---');
        const metrics = await fetchFMP(`key-metrics/${symbol}?period=annual&limit=5`);
        if (Array.isArray(metrics) && metrics.length > 0) {
            console.log('Count:', metrics.length);
            console.log('Latest Year:', metrics[0].date);
            console.log('Metrics available:', Object.keys(metrics[0]).filter(k => 
                ['netIncomePerShare', 'operatingCashFlowPerShare', 'bookValuePerShare', 'roe', 'returnOnEquity'].includes(k)
            ).map(k => `${k}: ${metrics[0][k]}`).join(', '));
        } else {
            console.log('Key Metrics: Empty or Invalid', metrics);
        }

        // 2. Income Statement
        console.log('\n--- Income Statement (Annual) ---');
        const income = await fetchFMP(`income-statement/${symbol}?period=annual&limit=5`);
        if (Array.isArray(income) && income.length > 0) {
             console.log('Count:', income.length);
             console.log('Latest Year:', income[0].date);
        } else {
             console.log('Income Statement: Empty or Invalid', income);
        }
        

        // 3. FMP Search to see what FMP thinks WSP is
        console.log('\n--- Search WSP ---');
        const search = await fetchFMP(`search?query=WSP&limit=5`);
        if (Array.isArray(search)) {
            search.forEach(r => console.log(`${r.symbol} - ${r.name} (${r.currency})`));
        }

        // 4. Historical Prices
        console.log('\n--- Historical Prices ---');
        const prices = await fetchFMP(`historical-price-full/${symbol}?serietype=line&timeseries=100`);
        if (prices && prices.historical && prices.historical.length > 0) {
            console.log('Count:', prices.historical.length);
            console.log('First (Newest):', prices.historical[0]);
            console.log('Last (Oldest of 100):', prices.historical[prices.historical.length - 1]);
        } else {
            console.log('Prices: Empty or Invalid', prices);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
