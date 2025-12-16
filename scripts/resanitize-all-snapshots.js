/**
 * Script pour resanitiser tous les snapshots existants dans Supabase
 * 
 * Ce script:
 * 1. Charge tous les snapshots depuis Supabase
 * 2. Applique sanitizeAssumptions à chaque snapshot
 * 3. Resauvegarde les snapshots avec les valeurs corrigées
 * 
 * Usage: node scripts/resanitize-all-snapshots.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔗 Connexion Supabase...');
console.log(`   URL: ${supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : 'NON DÉFINIE'}`);
console.log(`   Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NON DÉFINIE'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables Supabase manquantes');
    console.error('   Assurez-vous que SUPABASE_URL et SUPABASE_ANON_KEY sont définis dans .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Sanitize assumptions - Corrige les valeurs aberrantes
 * Copie de la fonction du frontend pour cohérence
 */
function sanitizeAssumptions(assumptions) {
    if (!assumptions) return getDefaultAssumptions();

    const safeDefaults = {
        currentPrice: 0,
        currentDividend: 0,
        baseYear: new Date().getFullYear(),
        growthRateEPS: 5,
        growthRateSales: 5,
        growthRateCF: 5,
        growthRateBV: 5,
        growthRateDiv: 0,
        targetPE: 15,
        targetPCF: 10,
        targetPBV: 2,
        targetYield: 2,
        requiredReturn: 10,
        dividendPayoutRatio: 30,
        excludeEPS: false,
        excludeCF: false,
        excludeBV: false,
        excludeDIV: false
    };

    const clamp = (value, min, max, defaultVal) => {
        if (value === undefined || value === null || !isFinite(value)) return defaultVal;
        return Math.max(min, Math.min(value, max));
    };

    const round = (value, decimals = 2) => {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    };

    return {
        currentPrice: assumptions.currentPrice && assumptions.currentPrice > 0 && isFinite(assumptions.currentPrice)
            ? round(assumptions.currentPrice, 2)
            : safeDefaults.currentPrice,
        currentDividend: assumptions.currentDividend && assumptions.currentDividend >= 0 && isFinite(assumptions.currentDividend)
            ? round(assumptions.currentDividend, 4)
            : safeDefaults.currentDividend,
        baseYear: assumptions.baseYear && assumptions.baseYear >= 2015 && assumptions.baseYear <= new Date().getFullYear() + 1
            ? assumptions.baseYear
            : safeDefaults.baseYear,
        
        // Taux de croissance: -20% / +20%
        growthRateEPS: round(clamp(assumptions.growthRateEPS, -20, 20, safeDefaults.growthRateEPS), 2),
        growthRateSales: round(clamp(assumptions.growthRateSales, -20, 20, safeDefaults.growthRateSales), 2),
        growthRateCF: round(clamp(assumptions.growthRateCF, -20, 20, safeDefaults.growthRateCF), 2),
        growthRateBV: round(clamp(assumptions.growthRateBV, -20, 20, safeDefaults.growthRateBV), 2),
        growthRateDiv: round(clamp(assumptions.growthRateDiv, -20, 20, safeDefaults.growthRateDiv), 2),
        
        // Ratios cibles: valeurs réalistes
        targetPE: round(clamp(assumptions.targetPE, 5, 50, safeDefaults.targetPE), 1),
        targetPCF: round(clamp(assumptions.targetPCF, 3, 50, safeDefaults.targetPCF), 1),
        targetPBV: round(clamp(assumptions.targetPBV, 0.5, 10, safeDefaults.targetPBV), 2),
        targetYield: round(clamp(assumptions.targetYield, 0, 15, safeDefaults.targetYield), 2),
        
        requiredReturn: round(clamp(assumptions.requiredReturn, 5, 25, safeDefaults.requiredReturn), 1),
        dividendPayoutRatio: round(clamp(assumptions.dividendPayoutRatio, 0, 100, safeDefaults.dividendPayoutRatio), 1),
        
        excludeEPS: assumptions.excludeEPS ?? safeDefaults.excludeEPS,
        excludeCF: assumptions.excludeCF ?? safeDefaults.excludeCF,
        excludeBV: assumptions.excludeBV ?? safeDefaults.excludeBV,
        excludeDIV: assumptions.excludeDIV ?? safeDefaults.excludeDIV
    };
}

function getDefaultAssumptions() {
    return {
        currentPrice: 0,
        currentDividend: 0,
        baseYear: new Date().getFullYear(),
        growthRateEPS: 5,
        growthRateSales: 5,
        growthRateCF: 5,
        growthRateBV: 5,
        growthRateDiv: 0,
        targetPE: 15,
        targetPCF: 10,
        targetPBV: 2,
        targetYield: 2,
        requiredReturn: 10,
        dividendPayoutRatio: 30,
        excludeEPS: false,
        excludeCF: false,
        excludeBV: false,
        excludeDIV: false
    };
}

/**
 * Vérifie si les assumptions ont des valeurs aberrantes
 */
function hasAberrantValues(assumptions) {
    if (!assumptions) return true;
    
    // Vérifier les taux de croissance
    if (assumptions.growthRateEPS < -20 || assumptions.growthRateEPS > 20) return true;
    if (assumptions.growthRateCF < -20 || assumptions.growthRateCF > 20) return true;
    if (assumptions.growthRateBV < -20 || assumptions.growthRateBV > 20) return true;
    if (assumptions.growthRateDiv < -20 || assumptions.growthRateDiv > 20) return true;
    
    // Vérifier les ratios cibles
    if (assumptions.targetPE < 5 || assumptions.targetPE > 50) return true;
    if (assumptions.targetPCF < 3 || assumptions.targetPCF > 50) return true;
    if (assumptions.targetPBV < 0.5 || assumptions.targetPBV > 10) return true;
    if (assumptions.targetYield < 0 || assumptions.targetYield > 15) return true;
    
    return false;
}

async function resanitizeAllSnapshots() {
    console.log('🔄 Resanitisation des snapshots...');
    console.log('');

    // 1. Récupérer tous les snapshots avec is_current = true
    const { data: snapshots, error } = await supabase
        .from('finance_snapshots')
        .select('id, ticker, assumptions')
        .eq('is_current', true);

    if (error) {
        console.error('❌ Erreur lors du chargement des snapshots:', error.message);
        process.exit(1);
    }

    console.log(`📊 ${snapshots.length} snapshots trouvés`);
    console.log('');

    // 2. Identifier ceux avec des valeurs aberrantes
    const toFix = snapshots.filter(s => hasAberrantValues(s.assumptions));
    console.log(`⚠️ ${toFix.length} snapshots avec valeurs aberrantes à corriger`);
    console.log('');

    if (toFix.length === 0) {
        console.log('✅ Aucune correction nécessaire !');
        return;
    }

    // 3. Afficher quelques exemples
    console.log('📋 Exemples de corrections à appliquer:');
    toFix.slice(0, 5).forEach(s => {
        const sanitized = sanitizeAssumptions(s.assumptions);
        console.log(`   ${s.ticker}:`);
        
        if (s.assumptions.targetPE !== sanitized.targetPE) {
            console.log(`     P/E: ${s.assumptions.targetPE} → ${sanitized.targetPE}`);
        }
        if (s.assumptions.targetPCF !== sanitized.targetPCF) {
            console.log(`     P/CF: ${s.assumptions.targetPCF} → ${sanitized.targetPCF}`);
        }
        if (s.assumptions.targetPBV !== sanitized.targetPBV) {
            console.log(`     P/BV: ${s.assumptions.targetPBV} → ${sanitized.targetPBV}`);
        }
        if (s.assumptions.growthRateEPS !== sanitized.growthRateEPS) {
            console.log(`     Growth EPS: ${s.assumptions.growthRateEPS}% → ${sanitized.growthRateEPS}%`);
        }
    });
    console.log('');

    // 4. Demander confirmation (via argument --yes)
    const autoConfirm = process.argv.includes('--yes');
    if (!autoConfirm) {
        console.log('💡 Pour exécuter les corrections, relancez avec --yes');
        console.log('   node scripts/resanitize-all-snapshots.js --yes');
        return;
    }

    // 5. Appliquer les corrections
    console.log('🔧 Application des corrections...');
    let fixed = 0;
    let errors = 0;

    for (const snapshot of toFix) {
        const sanitized = sanitizeAssumptions(snapshot.assumptions);
        
        const { error: updateError } = await supabase
            .from('finance_snapshots')
            .update({ assumptions: sanitized })
            .eq('id', snapshot.id);

        if (updateError) {
            console.error(`   ❌ ${snapshot.ticker}: ${updateError.message}`);
            errors++;
        } else {
            console.log(`   ✅ ${snapshot.ticker} corrigé`);
            fixed++;
        }
    }

    console.log('');
    console.log('════════════════════════════════════════');
    console.log(`✅ ${fixed} snapshots corrigés`);
    if (errors > 0) {
        console.log(`❌ ${errors} erreurs`);
    }
    console.log('════════════════════════════════════════');
}

// Exécution
resanitizeAllSnapshots().catch(console.error);

