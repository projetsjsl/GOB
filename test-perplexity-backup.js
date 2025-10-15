#!/usr/bin/env node

// ============================================================================
// TEST DU SYSTÈME DE BACKUP PERPLEXITY
// ============================================================================
// Script de test pour valider le système multi-modèles Perplexity

const BASE_URL = 'https://gob-git-main-projetsjsls-projects.vercel.app';

async function testPerplexityBackup() {
  console.log('🚀 Test du système de backup Perplexity...\n');
  
  const tests = [
    {
      name: 'Test Analyse Financière',
      service: 'perplexity',
      section: 'analysis',
      query: 'Analysez les performances récentes d\'Apple (AAPL) et ses perspectives'
    },
    {
      name: 'Test Actualités',
      service: 'perplexity', 
      section: 'news',
      query: 'Dernières actualités sur les marchés financiers canadiens'
    },
    {
      name: 'Test Recherche Approfondie',
      service: 'perplexity',
      section: 'research', 
      query: 'Rapport complet sur l\'industrie des énergies renouvelables'
    }
  ];
  
  for (const test of tests) {
    console.log(`📊 ${test.name}...`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/ai-services?service=${test.service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: test.query,
          section: test.section,
          recency: 'day'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Succès: ${data.model}`);
        console.log(`   📝 Tokens: ${data.tokens}`);
        console.log(`   🔄 Backup: ${data.fallback ? 'Oui' : 'Non'}`);
        console.log(`   💾 Cache: ${data.cached ? 'Oui' : 'Non'}`);
        if (data.backup_info) {
          console.log(`   📊 Tentative: ${data.backup_info.attempt}/${data.backup_info.totalAttempts}`);
        }
        if (data.quota_warning) {
          console.log(`   ⚠️  ${data.quota_warning}`);
        }
      } else {
        console.log(`❌ Échec: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Test du monitoring
  console.log('📊 Test du monitoring...');
  try {
    const response = await fetch(`${BASE_URL}/api/ai-services?service=monitoring`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Monitoring opérationnel');
      console.log(`   📈 Taux de succès: ${data.stats.successRate}`);
      console.log(`   💾 Taux de cache: ${data.stats.cacheHitRate}`);
      console.log(`   🔄 Total requêtes: ${data.stats.totalRequests}`);
      console.log(`   ⏱️  Uptime: ${data.stats.uptime}s`);
    }
  } catch (error) {
    console.log(`❌ Erreur monitoring: ${error.message}`);
  }
}

// Exécuter les tests
testPerplexityBackup().catch(console.error);
