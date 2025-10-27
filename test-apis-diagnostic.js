/**
 * GOB API Diagnostic Tool - Node.js Version
 * Tests critical API endpoints for the GOB platform
 *
 * Usage: node test-apis-diagnostic.js [options]
 *
 * Options:
 *   --all         Test all APIs (default)
 *   --fmp         Test FMP only
 *   --perplexity  Test Perplexity only
 *   --finnhub     Test Finnhub only
 *   --gemini      Test Gemini only
 *   --alpha       Test Alpha Vantage only
 *   --verbose     Show detailed output
 */

// Load dotenv if available (optional)
let dotenvLoaded = false;
try {
  const dotenv = await import('dotenv');
  dotenv.config();
  dotenvLoaded = true;
} catch (e) {
  // dotenv not available, will use process.env directly
}

// ANSI color codes
const COLORS = {
  GREEN: '\x1b[92m',
  RED: '\x1b[91m',
  YELLOW: '\x1b[93m',
  BLUE: '\x1b[94m',
  RESET: '\x1b[0m'
};

/**
 * Test FMP API - Quote endpoint (most used)
 */
async function testFMP(verbose = false) {
  console.log('\n🔍 Testing FMP API...');
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    console.log(`${COLORS.RED}❌ FMP_API_KEY not found${COLORS.RESET}`);
    return false;
  }

  try {
    // Test 1: Quote endpoint (used in fmp.js)
    const url = `https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      console.log(`${COLORS.GREEN}✅ FMP Quote OK${COLORS.RESET}`);
      if (verbose) {
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}`);
      }
      return true;
    } else if (response.status === 402) {
      console.log(`${COLORS.YELLOW}⚠️  FMP 402: Endpoint restricted (upgrade needed)${COLORS.RESET}`);
      if (verbose) {
        console.log(`   ${JSON.stringify(data).substring(0, 120)}`);
      }
      return false;
    } else {
      console.log(`${COLORS.RED}❌ FMP Error ${response.status}${COLORS.RESET}`);
      if (verbose) {
        console.log(`   ${JSON.stringify(data).substring(0, 120)}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`${COLORS.RED}❌ FMP Exception: ${error.message}${COLORS.RESET}`);
    return false;
  }
}

/**
 * Test Perplexity API - Models used in ai-services.js
 */
async function testPerplexity(verbose = false) {
  console.log('\n🔍 Testing Perplexity API...');
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.log(`${COLORS.RED}❌ PERPLEXITY_API_KEY not found${COLORS.RESET}`);
    return false;
  }

  // Test with models configured in ai-services.js
  const modelsToTest = [
    'sonar-reasoning-pro',  // Primary
    'sonar-pro',            // Backup2
    'sonar'                 // Backup3
  ];

  for (const model of modelsToTest) {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 100
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`${COLORS.GREEN}✅ Perplexity ${model} OK${COLORS.RESET}`);
        if (verbose) {
          console.log(`   Tokens: ${data.usage?.total_tokens || 'N/A'}`);
        }
        return true;
      } else if (response.status === 401) {
        console.log(`${COLORS.RED}❌ Perplexity 401: Invalid API key${COLORS.RESET}`);
        return false;
      } else if (response.status === 429) {
        console.log(`${COLORS.YELLOW}⚠️  Perplexity 429: Rate limit, trying next model...${COLORS.RESET}`);
        continue;
      } else {
        console.log(`${COLORS.RED}❌ Perplexity Error ${response.status} with ${model}${COLORS.RESET}`);
        if (verbose) {
          console.log(`   ${JSON.stringify(data).substring(0, 120)}`);
        }
        continue;
      }
    } catch (error) {
      console.log(`${COLORS.RED}❌ Perplexity Exception with ${model}: ${error.message}${COLORS.RESET}`);
      continue;
    }
  }

  return false;
}

/**
 * Test Finnhub API - Endpoints implemented in finnhub.js
 */
async function testFinnhub(verbose = false) {
  console.log('\n🔍 Testing Finnhub API...');
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.log(`${COLORS.RED}❌ FINNHUB_API_KEY not found${COLORS.RESET}`);
    return false;
  }

  try {
    // Test 1: Quote (most critical endpoint)
    const url = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      console.log(`${COLORS.GREEN}✅ Finnhub Quote OK${COLORS.RESET}`);
      if (verbose) {
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}`);
      }
    } else if (response.status === 401) {
      console.log(`${COLORS.RED}❌ Finnhub 401: Invalid API key${COLORS.RESET}`);
      return false;
    } else if (response.status === 429) {
      console.log(`${COLORS.YELLOW}⚠️  Finnhub 429: Rate limit exceeded${COLORS.RESET}`);
      return false;
    } else {
      console.log(`${COLORS.RED}❌ Finnhub Error ${response.status}${COLORS.RESET}`);
      if (verbose) {
        console.log(`   ${JSON.stringify(data).substring(0, 120)}`);
      }
      return false;
    }

    // Test 2: Company news
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const toDate = today.toISOString().split('T')[0];
    const fromDate = weekAgo.toISOString().split('T')[0];

    const newsUrl = `https://finnhub.io/api/v1/company-news?symbol=AAPL&from=${fromDate}&to=${toDate}&token=${apiKey}`;
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();

    if (newsResponse.ok) {
      console.log(`${COLORS.GREEN}✅ Finnhub Company News OK${COLORS.RESET}`);
      const newsCount = Array.isArray(newsData) ? newsData.length : 0;
      if (verbose) {
        console.log(`   News found: ${newsCount}`);
      }
      return true;
    } else {
      console.log(`${COLORS.YELLOW}⚠️  Finnhub News Error ${newsResponse.status}${COLORS.RESET}`);
      return false;
    }
  } catch (error) {
    console.log(`${COLORS.RED}❌ Finnhub Exception: ${error.message}${COLORS.RESET}`);
    return false;
  }
}

/**
 * Test Google Gemini API - Used for Emma AI
 */
async function testGemini(verbose = false) {
  console.log('\n🔍 Testing Gemini API...');
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log(`${COLORS.RED}❌ GEMINI_API_KEY not found${COLORS.RESET}`);
    return false;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Say 'OK' if you're working" }]
        }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`${COLORS.GREEN}✅ Gemini API OK${COLORS.RESET}`);
      if (verbose) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'N/A';
        console.log(`   Response: ${text.substring(0, 50)}`);
      }
      return true;
    } else if (response.status === 400) {
      console.log(`${COLORS.RED}❌ Gemini 400: Invalid API key or request${COLORS.RESET}`);
      if (verbose) {
        console.log(`   ${JSON.stringify(data).substring(0, 120)}`);
      }
      return false;
    } else {
      console.log(`${COLORS.RED}❌ Gemini Error ${response.status}${COLORS.RESET}`);
      if (verbose) {
        console.log(`   ${JSON.stringify(data).substring(0, 120)}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`${COLORS.RED}❌ Gemini Exception: ${error.message}${COLORS.RESET}`);
    return false;
  }
}

/**
 * Test Alpha Vantage API - Fallback for market data
 */
async function testAlphaVantage(verbose = false) {
  console.log('\n🔍 Testing Alpha Vantage API...');
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    console.log(`${COLORS.RED}❌ ALPHA_VANTAGE_API_KEY not found${COLORS.RESET}`);
    return false;
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        console.log(`${COLORS.GREEN}✅ Alpha Vantage OK${COLORS.RESET}`);
        if (verbose) {
          console.log(`   Price: ${data['Global Quote']['05. price'] || 'N/A'}`);
        }
        return true;
      } else if (data.Note) {
        console.log(`${COLORS.YELLOW}⚠️  Alpha Vantage: Rate limit exceeded${COLORS.RESET}`);
        if (verbose) {
          console.log(`   ${data.Note.substring(0, 120)}`);
        }
        return false;
      } else {
        console.log(`${COLORS.RED}❌ Alpha Vantage: Unexpected response${COLORS.RESET}`);
        if (verbose) {
          console.log(`   ${JSON.stringify(data).substring(0, 120)}`);
        }
        return false;
      }
    } else {
      console.log(`${COLORS.RED}❌ Alpha Vantage Error ${response.status}${COLORS.RESET}`);
      if (verbose) {
        console.log(`   ${JSON.stringify(data).substring(0, 120)}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`${COLORS.RED}❌ Alpha Vantage Exception: ${error.message}${COLORS.RESET}`);
    return false;
  }
}

/**
 * Main function - Run API tests
 */
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');

  // Determine which APIs to test
  const testAll = args.length === 0 || args.includes('--all') ||
                  (!args.some(arg => ['--fmp', '--perplexity', '--finnhub', '--gemini', '--alpha'].includes(arg)));

  const shouldTest = {
    fmp: testAll || args.includes('--fmp'),
    perplexity: testAll || args.includes('--perplexity'),
    finnhub: testAll || args.includes('--finnhub'),
    gemini: testAll || args.includes('--gemini'),
    alpha: testAll || args.includes('--alpha')
  };

  console.log('='.repeat(60));
  console.log('🧪 GOB API Diagnostic Tool');
  console.log('='.repeat(60));

  const results = {};

  if (shouldTest.fmp) {
    results['FMP'] = await testFMP(verbose);
  }

  if (shouldTest.perplexity) {
    results['Perplexity'] = await testPerplexity(verbose);
  }

  if (shouldTest.finnhub) {
    results['Finnhub'] = await testFinnhub(verbose);
  }

  if (shouldTest.gemini) {
    results['Gemini'] = await testGemini(verbose);
  }

  if (shouldTest.alpha) {
    results['Alpha Vantage'] = await testAlphaVantage(verbose);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60));

  for (const [api, status] of Object.entries(results)) {
    const statusIcon = status ? `${COLORS.GREEN}✅` : `${COLORS.RED}❌`;
    console.log(`${statusIcon} ${api}: ${status ? 'OK' : 'FAILED'}${COLORS.RESET}`);
  }

  const allPass = Object.values(results).every(status => status);
  console.log('\n' + '='.repeat(60));

  if (allPass) {
    console.log(`${COLORS.GREEN}🎉 All tested APIs operational!${COLORS.RESET}`);
  } else {
    console.log(`${COLORS.RED}⚠️  Some APIs failed - check logs above${COLORS.RESET}`);
    if (!verbose) {
      console.log(`\n${COLORS.YELLOW}💡 Tip: Use --verbose for more details${COLORS.RESET}`);
    }
  }

  console.log('='.repeat(60));

  return allPass;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testFMP, testPerplexity, testFinnhub, testGemini, testAlphaVantage, main };
