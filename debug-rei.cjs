
const https = require('https');

// API Key hardcoded as per previous debug sessions
const API_KEY = 'Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt';
const SYMBOL = 'REI-UN.TO'; // Variant 1: REI-UN.TO
const SYMBOL_ALT = 'REI.TO'; // Variant 2: REI.TO

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
        console.log(`Debug ${SYMBOL} vs ${SYMBOL_ALT}`);
        
        // 1. Profile Check
        console.log('\n--- Profile Check (REI-UN.TO) ---');
        const profilesVideo = await fetchUrl(`https://financialmodelingprep.com/api/v3/profile/${SYMBOL}`);
        if (profilesVideo.length > 0) {
            console.log(`✅ Found ${SYMBOL}:`, profilesVideo[0].companyName, profilesVideo[0].price);
        } else {
            console.log(`❌ ${SYMBOL} not found in Profile`);
        }

        console.log('\n--- Profile Check (REI.TO) ---');
        const profilesAlt = await fetchUrl(`https://financialmodelingprep.com/api/v3/profile/${SYMBOL_ALT}`);
        if (profilesAlt.length > 0) {
            console.log(`✅ Found ${SYMBOL_ALT}:`, profilesAlt[0].companyName, profilesAlt[0].price);
        } else {
            console.log(`❌ ${SYMBOL_ALT} not found in Profile`);
        }

        const activeSymbol = profilesVideo.length > 0 ? SYMBOL : (profilesAlt.length > 0 ? SYMBOL_ALT : null);

        if (!activeSymbol) {
            console.error('Neither symbol worked. Aborting.');
            return;
        }

        console.log(`\nContinuing debug with ACTIVE SYMBOL: ${activeSymbol}`);

        // 2. Key Metrics
        console.log('\n--- Key Metrics (Annual, limit=5) ---');
        const metrics = await fetchUrl(`https://financialmodelingprep.com/api/v3/key-metrics/${activeSymbol}?period=annual&limit=5`);
        if (metrics.length > 0) {
            console.log(`Fetched ${metrics.length} metrics.`);
            const m = metrics[0];
            console.log(`Recent (${m.date}) - EPS: ${m.netIncomePerShare}, Rev/Share: ${m.revenuePerShare}`);
        } else {
            console.log('❌ No Key Metrics found');
        }

        // 3. Historical Prices
        console.log('\n--- Historical Prices (limit=100) ---');
        const prices = await fetchUrl(`https://financialmodelingprep.com/api/v3/historical-price-full/${activeSymbol}?serietype=line&timeseries=100`);
        if (prices.historical && prices.historical.length > 0) {
            console.log(`Found ${prices.historical.length} price records.`);
            console.log('Last close:', prices.historical[0].close);
        } else {
            console.log('❌ No historical prices found');
        }

    } catch (e) {
        console.error('Run failed:', e);
    }
}

runDebug();
