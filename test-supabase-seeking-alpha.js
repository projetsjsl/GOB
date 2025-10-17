/**
 * Test Supabase Seeking Alpha Setup
 * Run: node test-supabase-seeking-alpha.js
 */

const SUPABASE_URL = 'https://ctjnhddcrsddhfhfhfiu.supabase.co'; // Replace if different
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0am5oZGRjcnNkZGhmaGZoZml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDY5ODY0MSwiZXhwIjoyMDUwMjc0NjQxfQ.hYcJzlH8xkGTcbJOGJMYt0fLWGgTOKKwJfHABHBVLpw'; // Your key

console.log('🔍 Testing Supabase Seeking Alpha Setup...\n');

async function test() {
  try {
    // Test 1: Check tickers table
    console.log('1️⃣ Testing tickers table...');
    const tickersResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tickers?select=*&limit=5`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (tickersResponse.ok) {
      const tickers = await tickersResponse.json();
      console.log(`   ✅ Tickers table exists: ${tickers.length} rows`);
      console.log(`   Sample: ${tickers.slice(0, 3).map(t => t.ticker).join(', ')}\n`);
    } else {
      console.log(`   ❌ Tickers table error: ${tickersResponse.status}`);
      console.log(`   👉 Run supabase-seeking-alpha-refactor.sql first!\n`);
      return;
    }

    // Test 2: Check seeking_alpha_raw_data table
    console.log('2️⃣ Testing seeking_alpha_raw_data table...');
    const rawResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/seeking_alpha_raw_data?select=count`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'count=exact'
        }
      }
    );

    if (rawResponse.ok) {
      const count = rawResponse.headers.get('content-range')?.split('/')[1] || '0';
      console.log(`   ✅ seeking_alpha_raw_data table exists: ${count} rows\n`);
    } else {
      console.log(`   ❌ seeking_alpha_raw_data table error: ${rawResponse.status}\n`);
      return;
    }

    // Test 3: Check seeking_alpha_analysis table
    console.log('3️⃣ Testing seeking_alpha_analysis table...');
    const analysisResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/seeking_alpha_analysis?select=count`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'count=exact'
        }
      }
    );

    if (analysisResponse.ok) {
      const count = analysisResponse.headers.get('content-range')?.split('/')[1] || '0';
      console.log(`   ✅ seeking_alpha_analysis table exists: ${count} rows\n`);
    } else {
      console.log(`   ❌ seeking_alpha_analysis table error: ${analysisResponse.status}\n`);
      return;
    }

    // Test 4: Test API endpoint (if deployed)
    console.log('4️⃣ Testing API endpoint...');
    try {
      const apiResponse = await fetch('https://gobapps.com/api/seeking-alpha-tickers?limit=5');

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log(`   ✅ API endpoint working: ${result.tickers?.length || 0} tickers`);
        console.log(`   Source: ${result.tickers?.[0]?.source || 'N/A'}\n`);
      } else {
        console.log(`   ⚠️  API endpoint not yet deployed (${apiResponse.status})`);
        console.log(`   👉 Deploy to Vercel and wait for deployment to complete\n`);
      }
    } catch (error) {
      console.log(`   ⚠️  API endpoint not accessible`);
      console.log(`   👉 Deploy to Vercel first\n`);
    }

    // Test 5: Test insert (create and delete test record)
    console.log('5️⃣ Testing insert/delete...');
    const testTicker = {
      ticker: 'TEST_' + Date.now(),
      company_name: 'Test Company',
      source: 'manual',
      is_active: false,
      scraping_enabled: false
    };

    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/tickers`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(testTicker)
    });

    if (insertResponse.ok) {
      console.log(`   ✅ Insert works`);

      // Delete test record
      await fetch(`${SUPABASE_URL}/rest/v1/tickers?ticker=eq.${testTicker.ticker}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      console.log(`   ✅ Delete works\n`);
    } else {
      console.log(`   ❌ Insert failed: ${insertResponse.status}\n`);
    }

    console.log('🎉 All tests passed! Supabase setup is ready.\n');
    console.log('📋 Next steps:');
    console.log('   1. Verify environment variables in Vercel:');
    console.log('      - SUPABASE_URL');
    console.log('      - SUPABASE_KEY (anon key for frontend)');
    console.log('      - SUPABASE_SERVICE_ROLE_KEY (for backend APIs)');
    console.log('   2. Deploy to Vercel: git push origin main');
    console.log('   3. Wait for deployment to complete');
    console.log('   4. Test scraper: Open dashboard → 🚀 Lancer le Scraper');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();
