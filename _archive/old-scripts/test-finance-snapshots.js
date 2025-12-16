/**
 * Test Finance Pro Snapshots API
 * Tests all CRUD operations
 */

const TEST_TICKER = 'AAPL';
const API_BASE = 'http://localhost:3000';

const testData = {
    ticker: TEST_TICKER,
    profile_id: `profile_${TEST_TICKER}`,
    notes: 'Test snapshot created via API',
    annual_data: [
        {
            year: 2023,
            priceHigh: 195.5,
            priceLow: 145.3,
            cashFlowPerShare: 6.50,
            dividendPerShare: 0.92,
            bookValuePerShare: 4.85,
            earningsPerShare: 6.13,
            isEstimate: false,
            autoFetched: true
        },
        {
            year: 2024,
            priceHigh: 250.0,
            priceLow: 165.0,
            cashFlowPerShare: 7.10,
            dividendPerShare: 0.98,
            bookValuePerShare: 5.20,
            earningsPerShare: 6.50,
            isEstimate: true,
            autoFetched: true
        }
    ],
    assumptions: {
        currentPrice: 185.50,
        currentDividend: 0.96,
        growthRateEPS: 0.08,
        growthRateSales: 0.07,
        growthRateCF: 0.09,
        growthRateBV: 0.10,
        growthRateDiv: 0.05,
        targetPE: 28.0,
        targetPCF: 25.0,
        targetPBV: 35.0,
        targetYield: 0.55,
        requiredReturn: 0.12,
        dividendPayoutRatio: 0.15,
        baseYear: 2024
    },
    company_info: {
        symbol: TEST_TICKER,
        name: 'Apple Inc.',
        sector: 'Technology',
        securityRank: 'A+',
        marketCap: '2.8T'
    },
    is_watchlist: false,
    auto_fetched: true
};

async function testAPI() {
    console.log('🧪 Testing Finance Pro Snapshots API\n');

    let createdId = null;

    try {
        // 1. CREATE
        console.log('1️⃣  POST /api/finance-snapshots (Create)');
        const createRes = await fetch(`${API_BASE}/api/finance-snapshots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        if (!createRes.ok) {
            throw new Error(`Create failed: ${createRes.status}`);
        }

        const created = await createRes.json();
        createdId = created.id;
        console.log(`   ✅ Created snapshot: ${created.id} (version ${created.version})`);
        console.log(`   📅 Date: ${created.snapshot_date}`);
        console.log();

        // 2. LIST
        console.log(`2️⃣  GET /api/finance-snapshots?ticker=${TEST_TICKER} (List)`);
        const listRes = await fetch(`${API_BASE}/api/finance-snapshots?ticker=${TEST_TICKER}`);

        if (!listRes.ok) {
            throw new Error(`List failed: ${listRes.status}`);
        }

        const listData = await listRes.json();
        console.log(`   ✅ Found ${listData.count} snapshot(s) for ${TEST_TICKER}`);
        listData.snapshots.forEach(s => {
            console.log(`      - v${s.version}: ${s.snapshot_date} ${s.is_current ? '(current)' : ''}`);
        });
        console.log();

        // 3. GET SPECIFIC
        console.log(`3️⃣  GET /api/finance-snapshots?id=${createdId} (Get specific)`);
        const getRes = await fetch(`${API_BASE}/api/finance-snapshots?id=${createdId}`);

        if (!getRes.ok) {
            throw new Error(`Get failed: ${getRes.status}`);
        }

        const gotten = await getRes.json();
        console.log(`   ✅ Retrieved snapshot ${gotten.id}`);
        console.log(`   📊 Annual data rows: ${gotten.annual_data.length}`);
        console.log(`   💼 Company: ${gotten.company_info.name}`);
        console.log();

        // 4. UPDATE
        console.log(`4️⃣  PUT /api/finance-snapshots (Update notes)`);
        const updateRes = await fetch(`${API_BASE}/api/finance-snapshots`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: createdId,
                notes: 'Updated test notes - API working perfectly!'
            })
        });

        if (!updateRes.ok) {
            throw new Error(`Update failed: ${updateRes.status}`);
        }

        const updated = await updateRes.json();
        console.log(`   ✅ Updated notes: "${updated.notes}"`);
        console.log();

        // 5. DELETE
        console.log(`5️⃣  DELETE /api/finance-snapshots?id=${createdId} (Delete)`);
        const deleteRes = await fetch(`${API_BASE}/api/finance-snapshots?id=${createdId}`, {
            method: 'DELETE'
        });

        if (!deleteRes.ok) {
            throw new Error(`Delete failed: ${deleteRes.status}`);
        }

        const deleteData = await deleteRes.json();
        console.log(`   ✅ Deleted: ${deleteData.message}`);
        console.log();

        console.log('🎉 All tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);

        // Cleanup if failed mid-test
        if (createdId) {
            console.log('🧹 Cleaning up...');
            await fetch(`${API_BASE}/api/finance-snapshots?id=${createdId}`, {
                method: 'DELETE'
            }).catch(() => { });
        }

        process.exit(1);
    }
}

// Run tests
testAPI();
