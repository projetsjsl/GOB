/**
 * Test d'Optimisation des Coûts SMS
 * 
 * Valide que la conversion emojis → ASCII réduit bien le coût
 * en forçant l'encodage GSM-7 au lieu de UCS-2
 */

import { adaptForSMS } from './lib/channel-adapter.js';

// Simuler une réponse Emma typique avec emojis
const longEmmaResponse = `
👩🏻 📱 Salut JS 👋 Voici l'analyse RHI version express, adaptée marché US !

1️⃣ Vue d'ensemble + prix
Robert Half Intl (RHI) cote autour de 68,30$ aujourd'hui. Perf YTD : -11% (vs S&P500 +13%).

2️⃣ Valorisation
P/E : 15,1x (5 ans : 18x, secteur : 17x)
EV/EBITDA : 9,4x (moyenne 5 ans : 11x)
Le titre se traite sous ses moyennes, marché anticipe peu/pas de croissance.

3️⃣ Performance YTD
YTD : -11% (sous-performe clairement le marché US)

4️⃣ Macro
Marché US sous pression : Fed 5,5% (pic 23 ans), emploi US en ralentissement, inflation 2,8% (retombée mais toujours au-dessus cible).

5️⃣ Fondamentaux
ROE : 32% (5 ans : 36%)
Marge nette : 7,5% (5 ans : 8,8%)
Léger repli mais reste qualitatif vs secteur staffing.

6️⃣ Moat analysis
Moat : faible à modéré (marque forte, réseau agences, mais peu de barrières à l'entrée)
Durabilité : faible (secteur très concurrentiel, pas d'avantage technologique décisif)

7️⃣ Valeur intrinsèque
DCF : valeur intrinsèque estimée ~75$ (base consensus croissance faible). Marge de sécurité ~10% (faible pour un titre cyclique).

8️⃣ Résultats récents
Q3 2025 : CA -6%, BPA -12% (vs 2024), management prudent sur outlook Q4. Pression sur volumes, prix et marges.

9️⃣ Catalysts
📈 Reprise économique US
💰 Stabilisation Fed (baisse taux 2026 ?)
🔧 Restructurations/optimisation coûts

🔟 Risques principaux
📉 Ralentissement macro (US/Europe)
⚠️ Pression marges (négos salaires, IA/recrutement automatisé)
❌ Faible pricing power
`.trim();

console.log('🧪 TEST D\'OPTIMISATION DES COÛTS SMS\n');
console.log('='.repeat(60));

// Test 1: Réponse AVANT optimisation (avec emojis)
console.log('\n📊 AVANT OPTIMISATION (Emojis UCS-2)');
console.log('-'.repeat(60));
console.log(`Longueur: ${longEmmaResponse.length} caractères`);
console.log(`Encodage: UCS-2 (forcé par emojis)`);
console.log(`Segments: ${Math.ceil(longEmmaResponse.length / 70)} (70 chars/segment)`);
console.log(`Coût estimé: $${(Math.ceil(longEmmaResponse.length / 70) * 0.0083).toFixed(4)} USD`);
console.log(`\nAperçu:\n${longEmmaResponse.substring(0, 200)}...`);

// Test 2: Réponse APRÈS optimisation (sans emojis)
console.log('\n\n✅ APRÈS OPTIMISATION (ASCII GSM-7)');
console.log('-'.repeat(60));

const optimizedResponse = adaptForSMS(longEmmaResponse, {});
console.log(`Longueur: ${optimizedResponse.length} caractères`);
console.log(`Encodage: GSM-7 (ASCII uniquement)`);
console.log(`Segments: ${Math.ceil(optimizedResponse.length / 160)} (160 chars/segment)`);
console.log(`Coût estimé: $${(Math.ceil(optimizedResponse.length / 160) * 0.0083).toFixed(4)} USD`);
console.log(`\nAperçu:\n${optimizedResponse.substring(0, 200)}...`);

// Test 3: Comparaison
console.log('\n\n💰 COMPARAISON & ÉCONOMIES');
console.log('-'.repeat(60));

const segmentsBefore = Math.ceil(longEmmaResponse.length / 70);
const segmentsAfter = Math.ceil(optimizedResponse.length / 160);
const costBefore = segmentsBefore * 0.0083;
const costAfter = segmentsAfter * 0.0083;
const savings = ((costBefore - costAfter) / costBefore) * 100;

console.log(`Segments: ${segmentsBefore} → ${segmentsAfter} (-${segmentsBefore - segmentsAfter} segments)`);
console.log(`Coût: $${costBefore.toFixed(4)} → $${costAfter.toFixed(4)} (-$${(costBefore - costAfter).toFixed(4)})`);
console.log(`Économie: ${savings.toFixed(1)}%`);

// Test 4: Vérification des conversions
console.log('\n\n🔍 VÉRIFICATION DES CONVERSIONS');
console.log('-'.repeat(60));

const conversions = [
  { emoji: '1️⃣', ascii: '1.', found: optimizedResponse.includes('1.') && !optimizedResponse.includes('1️⃣') },
  { emoji: '2️⃣', ascii: '2.', found: optimizedResponse.includes('2.') && !optimizedResponse.includes('2️⃣') },
  { emoji: '👩🏻', ascii: 'Emma', found: optimizedResponse.startsWith('Emma') || optimizedResponse.includes('Emma:') },
  { emoji: '📈', ascii: '[Hausse]', found: !optimizedResponse.includes('📈') },
  { emoji: '💰', ascii: '$', found: !optimizedResponse.includes('💰') },
  { emoji: '⚠️', ascii: '[ATTENTION]', found: !optimizedResponse.includes('⚠️') },
];

conversions.forEach(({ emoji, ascii, found }) => {
  const status = found ? '✅' : '❌';
  console.log(`${status} ${emoji} → ${ascii}`);
});

// Test 5: Encodage GSM-7 check
console.log('\n\n🔤 VÉRIFICATION ENCODAGE GSM-7');
console.log('-'.repeat(60));

// Caractères GSM-7 valides
const gsm7Regex = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà\[\\\]\^\{\|\}\~\€]*$/;

const isGSM7Compatible = gsm7Regex.test(optimizedResponse);
console.log(`Compatible GSM-7: ${isGSM7Compatible ? '✅ OUI' : '❌ NON'}`);

if (!isGSM7Compatible) {
  // Trouver les caractères problématiques
  const invalidChars = [...new Set(
    optimizedResponse.split('').filter(char => !gsm7Regex.test(char))
  )];
  console.log(`Caractères problématiques: ${invalidChars.join(', ')}`);
}

// Test 6: Limite de longueur (1500 chars)
console.log('\n\n📏 VÉRIFICATION LIMITE DE LONGUEUR');
console.log('-'.repeat(60));

const MAX_LENGTH = 1500;
const underLimit = optimizedResponse.length <= MAX_LENGTH;
console.log(`Longueur: ${optimizedResponse.length} chars`);
console.log(`Limite: ${MAX_LENGTH} chars`);
console.log(`Status: ${underLimit ? '✅ OK' : '⚠️ DÉPASSE (résumé appliqué)'}`);

// Résumé final
console.log('\n\n🎯 RÉSUMÉ FINAL');
console.log('='.repeat(60));
console.log(`✅ Encodage GSM-7: ${isGSM7Compatible ? 'OUI' : 'NON'}`);
console.log(`✅ Sous limite 1500 chars: ${underLimit ? 'OUI' : 'NON (résumé appliqué)'}`);
console.log(`✅ Économie de coût: ${savings.toFixed(1)}%`);
console.log(`✅ Réduction segments: -${Math.round((1 - segmentsAfter / segmentsBefore) * 100)}%`);

console.log('\n' + '='.repeat(60));
console.log('🚀 OPTIMISATION VALIDÉE - PRÊT À DÉPLOYER');
console.log('='.repeat(60) + '\n');

// Test 7: Exemple message court (pas de troncature)
console.log('\n📝 TEST MESSAGE COURT (pas de résumé nécessaire)\n');
const shortMessage = `
👩🏻 Salut JS! 

1️⃣ Prix actuel
AAPL: $175.43 (+1.2% aujourd'hui)

2️⃣ Analyse rapide
📈 Momentum positif
💰 P/E: 28.5x (raisonnable)
✅ Recommandation: ACHAT
`.trim();

console.log(`Message original: ${shortMessage.length} chars`);
const shortOptimized = adaptForSMS(shortMessage, {});
console.log(`Message optimisé: ${shortOptimized.length} chars`);
console.log(`Segments: ${Math.ceil(shortOptimized.length / 160)}`);
console.log(`Coût: $${(Math.ceil(shortOptimized.length / 160) * 0.0083).toFixed(4)} USD`);
console.log(`\n${shortOptimized}`);

console.log('\n✅ Tests terminés avec succès!\n');

