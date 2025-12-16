import companyDataHandler from './fmp-company-data.js';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
     return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'INTC', 'NFLX'];
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  console.log('🚀 Starting 10-Ticker Sync Test via API...');

  for (const symbol of TICKERS) {
    // 1. Create Mock Request/Response for each ticker
    const mockReq = {
      method: 'GET',
      query: { symbol }
    };

    let responseData = null;
    let statusCode = 200;

    const mockRes = {
      setHeader: () => {}, 
      status: (code) => {
        statusCode = code;
        return mockRes;
      },
      json: (data) => {
        responseData = data;
        return mockRes;
      },
      send: (data) => {
        responseData = data;
        return mockRes;
      },
      end: () => {}
    };

    // 2. Call the actual handler
    try {
      const startTime = Date.now();
      await companyDataHandler(mockReq, mockRes);
      const duration = Date.now() - startTime;

      // 3. Evaluate Result
      if (statusCode >= 200 && statusCode < 300) {
        successCount++;
        results.push({
          symbol,
          status: 'OK',
          code: statusCode,
          duration: `${duration}ms`,
          price: responseData?.currentPrice || 'N/A'
        });
      } else {
        failureCount++;
        results.push({
          symbol,
          status: 'FAILED',
          code: statusCode,
          error: responseData?.error || 'Unknown Error',
          message: responseData?.message
        });
      }

    } catch (err) {
      failureCount++;
      results.push({
        symbol,
        status: 'CRASHED',
        error: err.message
      });
    }
  }

  // 4. Return Report
  return res.status(200).json({
    message: '10-Ticker Sync Test Complete',
    summary: {
      total: TICKERS.length,
      success: successCount,
      failed: failureCount,
      environment: process.env.VERCEL_ENV || 'development'
    },
    details: results
  });
}
