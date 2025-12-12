
const https = require('https');

const API_KEY = 'Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt';
const SYMBOL = 'KMI';

// Mimic calculations.ts
function calculateCAGR(start, end, periods) {
    if (start <= 0 || end <= 0 || periods <= 0) return 0;
    return (Math.pow(end / start, 1 / periods) - 1) * 100;
}

function calculate5YearGrowth(data, metricKey) {
   // 1. Sort by year asc
   const sorted = [...data].sort((a, b) => new Date(a.date).getFullYear() - new Date(b.date).getFullYear());
   
   if (sorted.length < 2) return 0;
   
   const last = sorted[sorted.length - 1];
   const lastYear = new Date(last.date).getFullYear();
   
   // Find N-5
   let start = sorted.find(d => new Date(d.date).getFullYear() === lastYear - 5);
   
   if (!start) start = sorted[0];

   const startValue = start[metricKey];
   const endValue = last[metricKey];
   const years = lastYear - new Date(start.date).getFullYear();

   console.log(`Calc ${metricKey}: Start(${new Date(start.date).getFullYear()})=${startValue}, End(${lastYear})=${endValue}, Years=${years}`);

   if (years < 1 || startValue <= 0 || endValue <= 0) {
       console.log(`Aborted ${metricKey}: years=${years}, start=${startValue}, end=${endValue}`);
       return 0;
   }

   return calculateCAGR(startValue, endValue, years);
}

async function runDebug() {
    try {
        console.log(`Fetch limit=30 for ${SYMBOL}...`);
        const url = `https://financialmodelingprep.com/api/v3/key-metrics/${SYMBOL}?period=annual&limit=30&apikey=${API_KEY}`;
        
        https.get(url, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                const json = JSON.parse(body);
                console.log(`Fetched ${json.length} records.`);
                
                // Show raw dividend data for first record
                if (json.length > 0) {
                     console.log('First Record Partial:', {
                         date: json[0].date,
                         dividendPerShare: json[0].dividendPerShare,
                         dividendYield: json[0].dividendYield
                     });
                }

                if (json.length > 0) {
                    const gEPS = calculate5YearGrowth(json, 'netIncomePerShare');
                    console.log(`Growth EPS: ${gEPS}`);
                    
                    const gBV = calculate5YearGrowth(json, 'bookValuePerShare');
                    console.log(`Growth BV: ${gBV}`);
                }
            });
        });
    } catch(e) { console.error(e); }
}

runDebug();
