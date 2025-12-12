
const https = require('https');

const FMP_KEY = "Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt";
const symbol = "EIX";

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
        console.log(`Debug ${symbol}`);
        
        // 1. Check Profile
        const profile = await fetchFMP(`profile/${symbol}`);
        if (profile && profile.length > 0) {
            console.log('Price:', profile[0].price);
        }

        // 2. Key Metrics
        console.log('\n--- Key Metrics (Annual, last 10) ---');
        const metrics = await fetchFMP(`key-metrics/${symbol}?period=annual&limit=10`);
        if (Array.isArray(metrics) && metrics.length > 0) {
            metrics.forEach(m => {
                console.log(`Year: ${m.date}, EPS: ${m.netIncomePerShare}, CF/Share: ${m.operatingCashFlowPerShare}, Div (KeyMetrics): ${m.dividendPerShare}`);
            });
        }

        // 3. Stock Dividends (Endpoint used by backend) & Aggregation Test
        console.log('\n--- Stock Dividends (historical-price-full/stock_dividend) ---');
        const stockDivs = await fetchFMP(`historical-price-full/stock_dividend/${symbol}`);
        if (stockDivs && stockDivs.historical && stockDivs.historical.length > 0) {
            console.log(`Found ${stockDivs.historical.length} dividend records.`);
            
            // SIMULATE BACKEND AGGREGATION LOGIC
            let dividendsByFiscalYear = {};
            stockDivs.historical.forEach(div => {
                const mkDate = new Date(div.date);
                const fiscalYear = mkDate.getFullYear();
                
                if (!dividendsByFiscalYear[fiscalYear]) {
                    dividendsByFiscalYear[fiscalYear] = 0;
                }
                dividendsByFiscalYear[fiscalYear] += div.dividend || div.adjDividend || 0;
            });
            console.log('Simulated Aggregation (Last 5 years):');
            const recentYears = Object.keys(dividendsByFiscalYear).sort((a,b) => b-a).slice(0, 5);
            recentYears.forEach(y => console.log(`${y}: ${dividendsByFiscalYear[y].toFixed(2)}`));

        } else {
            console.log('Stock Dividends: Empty or Invalid', stockDivs);
        }

        // 4. Cash Flow Fallback Check
        console.log('\n--- Cash Flow Statement (Annual) ---');
        const cf = await fetchFMP(`cash-flow-statement/${symbol}?period=annual&limit=5`);
        if (Array.isArray(cf) && cf.length > 0) {
            cf.forEach(c => {
                 console.log(`Year: ${c.date.substring(0,4)}, DividendsPaid: ${c.dividendsPaid}`);
            });
        }
        
        // 5. Key Metrics Dividend Yield Check
        console.log('\n--- Dividend Yield Check (Key Metrics) ---');
        if (metrics && metrics.length > 0) {
            metrics.forEach(m => {
                const year = m.date.substring(0,4);
                // Approximate price from PE? Or fetch historical price...
                // implied price from PE = netIncomePerShare * peRatio (if peRatio exists?)
                // Helper: we likely don't have price here easily without fetching more.
                // But we can check if dividendYield is populated.
                console.log(`Year: ${year}, Yield: ${m.dividendYield}, EPS: ${m.netIncomePerShare}`);
            });
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
