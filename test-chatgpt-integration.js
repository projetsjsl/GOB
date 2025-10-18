#!/usr/bin/env node
// ============================================================================
// TEST CHATGPT INTEGRATION - Script de validation de l'intégration ChatGPT
// ============================================================================
//
// Ce script teste l'intégration ChatGPT avec les différents endpoints
// et valide le système de fallback multi-fournisseurs
//
// Usage: node test-chatgpt-integration.js
// ============================================================================

import fetch from 'node-fetch';

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';

console.log('🧪 Test d\'intégration ChatGPT');
console.log('🌐 Base URL:', BASE_URL);
console.log('');

// Tests à effectuer
const tests = [
  {
    name: 'Test ChatGPT Chat Simple',
    endpoint: '/api/chatgpt/chat.js',
    payload: {
      message: 'Bonjour Emma, peux-tu m\'expliquer ce qu\'est le P/E ratio?'
    }
  },
  {
    name: 'Test ChatGPT Tools (Function Calling)',
    endpoint: '/api/chatgpt/tools.js',
    payload: {
      messages: [
        { role: 'user', content: 'Peux-tu me donner le prix de l\'action Apple (AAPL) et calculer son P/E ratio?' }
      ]
    }
  },
  {
    name: 'Test AI Services avec ChatGPT prioritaire',
    endpoint: '/api/ai-services.js',
    payload: {
      message: 'Analyse la performance de Microsoft (MSFT)',
      preferred_provider: 'chatgpt',
      use_functions: true
    }
  },
  {
    name: 'Test AI Services avec fallback automatique',
    endpoint: '/api/ai-services.js',
    payload: {
      message: 'Quelles sont les tendances du marché aujourd\'hui?',
      preferred_provider: 'auto',
      use_functions: false
    }
  }
];

async function runTest(test) {
  console.log(`\n🔍 ${test.name}`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}${test.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(test.payload)
    });
    
    const executionTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Erreur HTTP ${response.status}:`, errorData.error || response.statusText);
      return false;
    }
    
    const data = await response.json();
    
    console.log(`✅ Succès (${executionTime}ms)`);
    console.log(`📝 Réponse:`, data.response?.substring(0, 200) + '...');
    console.log(`🔧 Source:`, data.source || 'N/A');
    console.log(`🤖 Provider:`, data.provider_used || data.provider || 'N/A');
    
    if (data.functions_executed && data.functions_executed.length > 0) {
      console.log(`🛠️ Fonctions exécutées:`, data.functions_executed.join(', '));
    }
    
    if (data.usage) {
      console.log(`📊 Usage:`, {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens
      });
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Erreur:`, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Démarrage des tests d\'intégration ChatGPT\n');
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await runTest(test);
    if (success) passed++;
    
    // Pause entre les tests pour éviter les rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS DES TESTS');
  console.log('='.repeat(60));
  console.log(`✅ Tests réussis: ${passed}/${total}`);
  console.log(`❌ Tests échoués: ${total - passed}/${total}`);
  console.log(`📈 Taux de réussite: ${Math.round((passed / total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 Tous les tests sont passés! L\'intégration ChatGPT fonctionne correctement.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez la configuration des clés API.');
  }
  
  console.log('\n📋 Configuration requise:');
  console.log('• OPENAI_API_KEY (sk-...) - Pour ChatGPT');
  console.log('• GEMINI_API_KEY (AI...) - Pour Gemini (fallback)');
  console.log('• PERPLEXITY_API_KEY (pplx-...) - Pour Perplexity (fallback)');
}

// Vérifier les variables d'environnement
console.log('🔧 Vérification de la configuration...');
const requiredKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'PERPLEXITY_API_KEY'];
const missingKeys = requiredKeys.filter(key => !process.env[key]);

if (missingKeys.length > 0) {
  console.log('❌ Clés API manquantes:', missingKeys.join(', '));
  console.log('⚠️ Certains tests pourraient échouer sans ces clés.');
} else {
  console.log('✅ Toutes les clés API sont configurées');
}

// Lancer les tests
runAllTests().catch(error => {
  console.error('❌ Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});