// scripts/test-sync-10.js
import 'dotenv/config';
import companyDataHandler from '../api/fmp-company-data.js';

// Configuration
const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'INTC', 'NFLX'];

// Mock Res
const mockRes = (symbol) => {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    json: (data) => {
      res.data = data;
      return res;
    },
    send: (data) => {
      res.data = data;
      return res;
    },
    setHeader: (key, value) => {
      res.headers[key] = value;
      return res;
    },
    end: () => res
  };
  return res;
};

async function runTest() {
  console.log(`🚀 Starting Test: Syncing ${TICKERS.length} tickers...\n`);
  
  if (!process.env.FMP_API_KEY) {
      console.error('❌ FMP_API_KEY missing in .env');
      return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (const symbol of TICKERS) {
    console.log(`Processing ${symbol}...`);
    const req = {
       method: 'GET',
       query: { symbol }
    };
    const res = mockRes(symbol);
    
    try {
        const startTime = Date.now();
        await companyDataHandler(req, res);
        const duration = Date.now() - startTime;
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${symbol}: OK (${duration}ms)`);
            // Basic validation
            if (!res.data || !res.data.currentPrice) {
                 console.warn(`   ⚠️ Warning: Missing currentPrice for ${symbol}`);
            }
            successCount++;
        } else {
            console.error(`❌ ${symbol}: Failed with status ${res.statusCode}`);
            if (res.data) console.error('   Error:', JSON.stringify(res.data));
            failureCount++;
        }
    } catch (err) {
        console.error(`❌ ${symbol}: CRASHED`, err.message);
        failureCount++;
    }
  }

  console.log('\n==========================================');
  console.log(`Total: ${TICKERS.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log('==========================================');
  
  if (failureCount > 0) process.exit(1);
}

runTest();
