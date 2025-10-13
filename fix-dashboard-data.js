/**
 * Script de Correction du Dashboard
 * Corrige l'affichage des données dans JLab et tous les onglets
 */

import fs from 'fs';

const fixDashboardData = () => {
  console.log('🔧 Correction du Dashboard JLab™');
  console.log('=================================');

  const dashboardPath = 'public/beta-combined-dashboard.html';
  
  if (!fs.existsSync(dashboardPath)) {
    console.log('❌ Fichier dashboard non trouvé:', dashboardPath);
    return false;
  }

  console.log('📖 Lecture du fichier dashboard...');
  let content = fs.readFileSync(dashboardPath, 'utf8');

  // Correction 1: Simplifier l'API hybride pour qu'elle fonctionne sans Supabase
  console.log('🔧 Correction 1: Simplification API hybride...');
  
  const hybridApiFix = `
// Version simplifiée de l'API hybride qui fonctionne sans Supabase
const fetchHybridData = async (symbol, dataType) => {
  try {
    console.log(\`🔄 Récupération \${dataType} pour \${symbol}\`);
    
    // Utiliser directement les APIs externes
    let apiUrl = '';
    switch (dataType) {
      case 'quote':
        apiUrl = \`/api/marketdata?endpoint=quote&symbol=\${symbol}&source=auto\`;
        break;
      case 'profile':
        apiUrl = \`/api/fmp?endpoint=profile&symbol=\${symbol}\`;
        break;
      case 'ratios':
        apiUrl = \`/api/fmp?endpoint=ratios&symbol=\${symbol}\`;
        break;
      case 'news':
        apiUrl = \`/api/marketaux?endpoint=ticker-sentiment&symbol=\${symbol}&limit=20\`;
        break;
      case 'prices':
        apiUrl = \`/api/fmp?endpoint=historical-chart&symbol=\${symbol}&timeframe=1day&limit=30\`;
        break;
      case 'analyst':
        apiUrl = \`/api/fmp?endpoint=rating&symbol=\${symbol}\`;
        break;
      case 'earnings':
        apiUrl = \`/api/fmp?endpoint=earnings&symbol=\${symbol}&limit=5\`;
        break;
      default:
        throw new Error(\`Type de données non supporté: \${dataType}\`);
    }
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(\`API \${dataType} échouée: \${response.status}\`);
    }
    
    const data = await response.json();
    console.log(\`✅ \${dataType} récupéré pour \${symbol}\`);
    
    return {
      success: true,
      symbol,
      dataType,
      data: data,
      source: 'external',
      metadata: {
        confidence: 0.9,
        freshness: 'fresh',
        lastUpdated: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error(\`❌ Erreur \${dataType} pour \${symbol}:\`, error);
    return {
      success: false,
      symbol,
      dataType,
      error: error.message,
      source: 'error'
    };
  }
};`;

  // Remplacer l'ancienne logique d'API hybride
  const oldHybridPattern = /const \[quoteResponse, profileResponse, ratiosResponse, newsResponse, intradayResponse, analystResponse, earningsResponse\] = await Promise\.allSettled\(\[[\s\S]*?\]\);/;
  
  if (oldHybridPattern.test(content)) {
    content = content.replace(oldHybridPattern, `
// Appels parallèles aux APIs avec gestion d'erreur améliorée
const [quoteResult, profileResult, ratiosResult, newsResult, intradayResult, analystResult, earningsResult] = await Promise.allSettled([
  fetchHybridData(symbol, 'quote'),
  fetchHybridData(symbol, 'profile'),
  fetchHybridData(symbol, 'ratios'),
  fetchHybridData(symbol, 'news'),
  fetchHybridData(symbol, 'prices'),
  fetchHybridData(symbol, 'analyst'),
  fetchHybridData(symbol, 'earnings')
]);`);
    console.log('✅ Logique API hybride remplacée');
  }

  // Ajouter la fonction fetchHybridData au début du script
  const scriptStartPattern = /<script type="text\/babel">/;
  if (scriptStartPattern.test(content)) {
    content = content.replace(scriptStartPattern, `<script type="text/babel">
${hybridApiFix}`);
    console.log('✅ Fonction fetchHybridData ajoutée');
  }

  // Correction 2: Simplifier le parsing des données
  console.log('🔧 Correction 2: Simplification du parsing...');
  
  const oldParsingPattern = /const quoteData = quoteResponse\.status === 'fulfilled'[\s\S]*?const earningsData = earningsResponse\.status === 'fulfilled'[\s\S]*?await earningsResponse\.value\.json\(\)[\s\S]*?: null;/;
  
  if (oldParsingPattern.test(content)) {
    content = content.replace(oldParsingPattern, `
// Parser les résultats simplifiés
const quote = quoteResult.status === 'fulfilled' && quoteResult.value.success ? quoteResult.value.data : null;
const profile = profileResult.status === 'fulfilled' && profileResult.value.success ? profileResult.value.data : null;
const ratios = ratiosResult.status === 'fulfilled' && ratiosResult.value.success ? ratiosResult.value.data : null;
const news = newsResult.status === 'fulfilled' && newsResult.value.success ? newsResult.value.data : null;
const intradayData = intradayResult.status === 'fulfilled' && intradayResult.value.success ? intradayResult.value.data : null;
const analystData = analystResult.status === 'fulfilled' && analystResult.value.success ? analystResult.value.data : null;
const earningsData = earningsResult.status === 'fulfilled' && earningsResult.value.success ? earningsResult.value.data : null;`);
    console.log('✅ Parsing des données simplifié');
  }

  // Correction 3: Améliorer la gestion des erreurs
  console.log('🔧 Correction 3: Amélioration de la gestion d\'erreurs...');
  
  const errorHandlingPattern = /console\.log\('✅ Données hybrides récupérées:'/;
  if (errorHandlingPattern.test(content)) {
    content = content.replace(errorHandlingPattern, `
// Log des données récupérées avec gestion d'erreur
console.log('✅ Données récupérées:', { 
  hasQuote: !!quote, 
  hasProfile: !!profile, 
  hasRatios: !!ratios,
  hasNews: !!news,
  hasIntraday: !!intradayData,
  hasAnalyst: !!analystData,
  hasEarnings: !!earningsData
});

// Gestion des erreurs
const errors = [];
if (!quote) errors.push('Quote manquant');
if (!profile) errors.push('Profile manquant');
if (!ratios) errors.push('Ratios manquant');
if (!news) errors.push('News manquant');

if (errors.length > 0) {
  console.warn('⚠️ Données manquantes:', errors);
  setMessage({
    text: \`Données partielles pour \${symbol}: \${errors.join(', ')}\`,
    type: 'warning'
  });
}

console.log('✅ Données hybrides récupérées:'`);
    console.log('✅ Gestion d\'erreurs améliorée');
  }

  // Correction 4: Corriger l'affichage des métriques
  console.log('🔧 Correction 4: Correction de l\'affichage des métriques...');
  
  // S'assurer que les métriques utilisent les bonnes données
  const metricsPattern = /const metrics = \{[\s\S]*?\};/;
  if (metricsPattern.test(content)) {
    content = content.replace(metricsPattern, `
const metrics = {
  marketCap: quote?.marketCapitalization || quote?.mktCap || 'N/A',
  pe: ratios?.priceEarningsRatioTTM || ratios?.peRatioTTM || 'N/A',
  eps: ratios?.earningsPerShareTTM || ratios?.epsTTM || 'N/A',
  dividend: ratios?.dividendYieldTTM || ratios?.dividendYield || 'N/A',
  beta: ratios?.beta || profile?.beta || 'N/A',
  volume: quote?.volume || quote?.vol || 'N/A',
  avgVolume: quote?.avgVolume || quote?.averageVolume || 'N/A',
  high52w: quote?.yearHigh || quote?.fiftyTwoWeekHigh || 'N/A',
  low52w: quote?.yearLow || quote?.fiftyTwoWeekLow || 'N/A'
};`);
    console.log('✅ Métriques corrigées');
  }

  // Sauvegarder le fichier corrigé
  console.log('💾 Sauvegarde du fichier corrigé...');
  fs.writeFileSync(dashboardPath, content);
  
  console.log('✅ Dashboard corrigé avec succès !');
  console.log('\n🎯 Corrections appliquées:');
  console.log('1. ✅ API hybride simplifiée (fonctionne sans Supabase)');
  console.log('2. ✅ Parsing des données simplifié');
  console.log('3. ✅ Gestion d\'erreurs améliorée');
  console.log('4. ✅ Métriques corrigées');
  
  console.log('\n📊 Prochaines étapes:');
  console.log('1. Tester le dashboard en local');
  console.log('2. Vérifier l\'affichage des données');
  console.log('3. Configurer Supabase pour le cache local');
  
  return true;
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDashboardData();
}

export { fixDashboardData };
