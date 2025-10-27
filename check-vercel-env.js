#!/usr/bin/env node

/**
 * Vérification du statut des variables Vercel
 */

import { execSync } from 'child_process';

console.log('🔍 VÉRIFICATION VARIABLES VERCEL');
console.log('═'.repeat(60));

try {
    console.log('📋 Variables d\'environnement Vercel:');
    console.log('');
    
    // Essayer de lister les variables Vercel
    const result = execSync('vercel env ls', { encoding: 'utf8' });
    console.log(result);
    
    console.log('✅ Variables Vercel récupérées');
    console.log('');
    
    // Vérifier les variables Supabase spécifiques
    const lines = result.split('\n');
    const supabaseVars = lines.filter(line => 
        line.includes('SUPABASE') || line.includes('supabase')
    );
    
    if (supabaseVars.length > 0) {
        console.log('🔑 Variables Supabase trouvées:');
        supabaseVars.forEach(line => {
            console.log(`   ${line}`);
        });
    } else {
        console.log('⚠️  Aucune variable Supabase trouvée');
        console.log('');
        console.log('💡 Configurez les variables Supabase:');
        console.log('   vercel env add SUPABASE_URL');
        console.log('   vercel env add SUPABASE_ANON_KEY');
        console.log('   vercel env add SUPABASE_SERVICE_ROLE_KEY');
    }
    
} catch (error) {
    console.log('❌ Erreur lors de la récupération des variables Vercel');
    console.log('   Erreur:', error.message);
    console.log('');
    console.log('💡 Solutions possibles:');
    console.log('   1. Connectez-vous à Vercel: vercel login');
    console.log('   2. Vérifiez que vous êtes dans le bon projet');
    console.log('   3. Configurez les variables manuellement');
    console.log('');
    console.log('🔧 Commandes de configuration:');
    console.log('   vercel env add SUPABASE_URL');
    console.log('   vercel env add SUPABASE_ANON_KEY');
    console.log('   vercel env add SUPABASE_SERVICE_ROLE_KEY');
}

console.log('\n📖 Guide complet: SUPABASE_SETUP_GUIDE.md');
