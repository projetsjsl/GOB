
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });
dotenv.config();

const API_BASE_URL = 'http://localhost:3000'; // Assuming local dev server or I can mock the handler call but better to call the file directly if possible or simulate logic. 
// Actually, I can just import the handler if I mock req/res.
// Or I can rewrite the logic in this script to be sure. 
// Let's rewrite the logic of fmp-company-data.js in a simplified way to check FMP output directly with the key.

const FMP_KEY = process.env.FMP_API_KEY;

if (!FMP_KEY) {
  console.error("Missing FMP_API_KEY");
  process.exit(1);
}

async function testCompanyData(symbol) {
  console.log(`Testing full data for ${symbol}...`);
  const FMP_BASE = 'https://financialmodelingprep.com/api/v3';
  
  // 1. Profile
  const profileUrl = `${FMP_BASE}/profile/${symbol}?apikey=${FMP_KEY}`;
  const profileRes = await fetch(profileUrl);
  const profileData = await profileRes.json();
  console.log('Profile:', profileData.length > 0 ? 'OK' : 'EMPTY');

  // 2. Key Metrics
  const metricsUrl = `${FMP_BASE}/key-metrics/${symbol}?period=annual&limit=30&apikey=${FMP_KEY}`;
  const metricsRes = await fetch(metricsUrl);
  const metricsData = await metricsRes.json();
  console.log('Metrics:', Array.isArray(metricsData) ? metricsData.length : 'ERROR', metricsData && metricsData['Error Message'] ? metricsData['Error Message'] : '');

  if (metricsData.length > 0) {
      console.log('First Metric Year:', metricsData[0].date);
      console.log('First Metric EPS:', metricsData[0].netIncomePerShare);
  }

  // 3. Historical Price
  const priceUrl = `${FMP_BASE}/historical-price-full/${symbol}?serietype=line&timeseries=7300&apikey=${FMP_KEY}`;
  const priceRes = await fetch(priceUrl);
  const priceData = await priceRes.json();
  console.log('Prices:', priceData.historical ? priceData.historical.length : 'EMPTY');
}

testCompanyData('AAPL');
testCompanyData('9984.T');
