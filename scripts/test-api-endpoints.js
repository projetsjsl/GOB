#!/usr/bin/env node
/**
 * Script de test pour valider les endpoints API après migration
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

let testsPassed = 0;
let testsFailed = 0;
const errors = [];

function logTest(name, passed, message = '') {
    if (passed) {
        console.log(`✅ ${name}${message ? ': ' + message : ''}`);
        testsPassed++;
    } else {
        console.error(`❌ ${name}${message ? ': ' + message : ''}`);
        testsFailed++;
        errors.push(`${name}: ${message}`);
    }
}

async function testEndpoint(name, url, expectedFields = []) {
    try {
        const response = await fetch(url);
        const passed = response.ok;
        
        if (passed) {
            const data = await response.json();
            let message = `HTTP ${response.status}`;
            
            if (expectedFields.length > 0) {
                const hasFields = expectedFields.every(field => {
                    if (typeof field === 'string') {
                        return data.hasOwnProperty(field);
                    } else {
                        // Field is an object with path and value
                        const value = field.path.split('.').reduce((obj, key) => obj?.[key], data);
                        return value !== undefined && (field.value === undefined || value === field.value);
                    }
                });
                
                if (hasFields) {
                    message += `, ${expectedFields.length} champs présents`;
                } else {
                    logTest(name, false, `Champs manquants dans la réponse`);
                    return;
                }
            }
            
            logTest(name, true, message);
        } else {
            const errorText = await response.text();
            logTest(name, false, `HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        }
    } catch (error) {
        logTest(name, false, error.message);
    }
}

async function runAPITests() {
    console.log('🧪 TESTS DES ENDPOINTS API\n');
    console.log('='.repeat(60));
    
    // Test 1: /api/config/tickers?list=team
    await testEndpoint(
        'API /api/config/tickers?list=team',
        `${BASE_URL}/api/config/tickers?list=team`,
        ['team_tickers', 'team_count', 'success']
    );
    
    // Test 2: /api/config/tickers?list=watchlist
    await testEndpoint(
        'API /api/config/tickers?list=watchlist',
        `${BASE_URL}/api/config/tickers?list=watchlist`,
        ['watchlist_tickers', 'watchlist_count', 'success']
    );
    
    // Test 3: /api/tickers-config?list=team
    await testEndpoint(
        'API /api/tickers-config?list=team',
        `${BASE_URL}/api/tickers-config?list=team`,
        ['teamTickers']
    );
    
    // Test 4: /api/admin/tickers?source=team
    await testEndpoint(
        'API /api/admin/tickers?source=team',
        `${BASE_URL}/api/admin/tickers?source=team`,
        ['success', 'tickers']
    );
    
    // Test 5: /api/admin/tickers?source=watchlist
    await testEndpoint(
        'API /api/admin/tickers?source=watchlist',
        `${BASE_URL}/api/admin/tickers?source=watchlist`,
        ['success', 'tickers']
    );
    
    // Test 6: /api/seeking-alpha-tickers (GET)
    await testEndpoint(
        'API /api/seeking-alpha-tickers (GET)',
        `${BASE_URL}/api/seeking-alpha-tickers?limit=5`,
        ['success', 'tickers']
    );
    
    // Test 7: /api/team-tickers (GET)
    await testEndpoint(
        'API /api/team-tickers (GET)',
        `${BASE_URL}/api/team-tickers`,
        ['success', 'tickers']
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSULTATS');
    console.log(`✅ Tests réussis: ${testsPassed}`);
    console.log(`❌ Tests échoués: ${testsFailed}`);
    
    if (errors.length > 0) {
        console.log('\n❌ ERREURS:');
        errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (testsFailed === 0) {
        console.log('\n🎉 TOUS LES TESTS API SONT PASSÉS !');
        process.exit(0);
    } else {
        console.log('\n⚠️ CERTAINS TESTS API ONT ÉCHOUÉ');
        process.exit(1);
    }
}

runAPITests().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});


