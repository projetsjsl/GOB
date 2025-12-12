
const https = require('https');

const API_KEY = 'Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt';
const SYMBOL = 'KMI';

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
                    resolve([]);
                }
            });
        }).on('error', (err) => reject(err));
    });
}

async function runDebug() {
    try {
        console.log(`Debug ${SYMBOL} Data`);
        
        // 1. Key Metrics (Annual)
        console.log('\n--- Key Metrics (Annual, limit=10) ---');
        const metrics = await fetchUrl(`https://financialmodelingprep.com/api/v3/key-metrics/${SYMBOL}?period=annual&limit=10`);
        
        if (metrics.length > 0) {
            console.log('Year | EPS | CF/Share | BV/Share | Div/Share | PE | P/CF');
            console.log('-----|-----|----------|----------|-----------|----|-----');
            metrics.forEach(m => {
                console.log(`${m.date.substring(0,4)} | ${m.netIncomePerShare} | ${m.operatingCashFlowPerShare} | ${m.bookValuePerShare} | ${m.dividendPerShare} | ${m.peRatio} | ${m.pfcfRatio}`);
            });
        } else {
            console.log('❌ No Key Metrics found');
        }

    } catch (e) {
        console.error('Run failed:', e);
    }
}

runDebug();
