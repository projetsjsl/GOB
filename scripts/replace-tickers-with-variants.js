/**
 * Script pour remplacer les tickers en échec par leurs variantes fonctionnelles
 * Gère les doublons intelligemment
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://boyuxgdplbpkknplxbxp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non définie');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mapping des remplacements
const REPLACEMENTS = [
  { from: 'ATD.B', to: 'ATD.TO', exchange: 'TSX', company: 'Alimentation Couche-Tard Inc.' },
  { from: 'BBD.B', to: 'BBD-B.TO', exchange: 'TSX', company: 'Bombardier Inc. (Class B)' },
  { from: 'BFB', to: 'BF-B', exchange: 'NYSE', company: 'Brown-Forman Corporation (Class B)' },
  { from: 'MOGA', to: 'MOG-A', exchange: 'NYSE', company: 'Moog Inc. (Class A)' },
  { from: 'CCLB.TO', to: 'CCLLF', exchange: 'OTC', company: 'CCL Industries Inc.', country: 'CA' },
  { from: 'CTCA.TO', to: 'CTC.TO', exchange: 'TSX', company: 'Canadian Tire Corporation, Limited' },
  { from: 'GIBA.TO', to: 'GIB', exchange: 'NYSE', company: 'CGI Inc.', country: 'CA' },
  { from: 'RCIB.TO', to: 'RCI', exchange: 'NYSE', company: 'Rogers Communications Inc.', country: 'CA' },
  { from: 'CCA', to: 'CCA.TO', exchange: 'TSX', company: 'Cogeco Communications Inc.', country: 'CA' },
  { from: 'GWO', to: 'GWO.TO', exchange: 'TSX', company: 'Great-West Lifeco Inc.', country: 'CA' },
  { from: 'IFC', to: 'IFC.TO', exchange: 'TSX', company: 'Intact Financial Corporation', country: 'CA' },
  { from: 'MRU', to: 'MRU.TO', exchange: 'TSX', company: 'Metro Inc.', country: 'CA' },
  // BRK.B - À vérifier manuellement (commenté)
  // { from: 'BRK.B', to: 'BRK-B', exchange: 'NYSE', company: 'Berkshire Hathaway Inc. (Class B)' },
];

// Suppressions
const TO_DELETE = ['EMPA.TO'];

async function replaceTickers() {
  console.log('🔄 Remplacement des tickers par leurs variantes fonctionnelles...\n');
  
  const results = {
    replaced: [],
    deleted: [],
    skipped: [],
    errors: []
  };
  
  try {
    // 1. Remplacements
    for (const replacement of REPLACEMENTS) {
      console.log(`\n📋 ${replacement.from} → ${replacement.to}`);
      
      // Vérifier si le ticker source existe
      const { data: sourceTicker, error: sourceError } = await supabase
        .from('tickers')
        .select('*')
        .eq('ticker', replacement.from)
        .eq('is_active', true)
        .single();
      
      if (sourceError || !sourceTicker) {
        console.log(`  ⏭️  ${replacement.from} n'existe pas ou est déjà inactif`);
        results.skipped.push({ ticker: replacement.from, reason: 'Non trouvé' });
        continue;
      }
      
      // Vérifier si le ticker destination existe déjà
      const { data: destTicker, error: destError } = await supabase
        .from('tickers')
        .select('*')
        .eq('ticker', replacement.to)
        .eq('is_active', true)
        .single();
      
      if (!destError && destTicker) {
        // Le ticker destination existe déjà
        console.log(`  ⚠️  ${replacement.to} existe déjà - Désactivation de ${replacement.from}`);
        
        // Désactiver l'ancien ticker
        const { error: updateError } = await supabase
          .from('tickers')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('ticker', replacement.from);
        
        if (updateError) {
          console.log(`  ❌ Erreur désactivation: ${updateError.message}`);
          results.errors.push({ ticker: replacement.from, error: updateError.message });
        } else {
          console.log(`  ✅ ${replacement.from} désactivé (doublon de ${replacement.to})`);
          results.replaced.push({
            from: replacement.from,
            to: replacement.to,
            action: 'Désactivé (doublon existant)'
          });
        }
      } else {
        // Remplacer le ticker
        const { error: updateError } = await supabase
          .from('tickers')
          .update({
            ticker: replacement.to,
            exchange: replacement.exchange,
            company_name: replacement.company,
            country: replacement.country || sourceTicker.country,
            updated_at: new Date().toISOString()
          })
          .eq('ticker', replacement.from);
        
        if (updateError) {
          console.log(`  ❌ Erreur: ${updateError.message}`);
          results.errors.push({ ticker: replacement.from, error: updateError.message });
        } else {
          console.log(`  ✅ Remplacé par ${replacement.to}`);
          results.replaced.push({
            from: replacement.from,
            to: replacement.to,
            action: 'Remplacé'
          });
        }
      }
    }
    
    // 2. Suppressions
    console.log('\n\n🗑️  Suppression des tickers sans alternative...');
    for (const ticker of TO_DELETE) {
      console.log(`\n📋 ${ticker}`);
      
      const { error: deleteError } = await supabase
        .from('tickers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('ticker', ticker);
      
      if (deleteError) {
        console.log(`  ❌ Erreur: ${deleteError.message}`);
        results.errors.push({ ticker, error: deleteError.message });
      } else {
        console.log(`  ✅ Désactivé`);
        results.deleted.push({ ticker });
      }
    }
    
    // Résumé
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(80));
    console.log(`\n✅ Remplacés: ${results.replaced.length}`);
    console.log(`🗑️  Supprimés: ${results.deleted.length}`);
    console.log(`⏭️  Ignorés: ${results.skipped.length}`);
    console.log(`❌ Erreurs: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Erreurs:');
      results.errors.forEach(e => {
        console.log(`  - ${e.ticker}: ${e.error}`);
      });
    }
    
    // Export
    const exportData = {
      summary: {
        replaced: results.replaced.length,
        deleted: results.deleted.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
        generatedAt: new Date().toISOString()
      },
      replaced: results.replaced,
      deleted: results.deleted,
      skipped: results.skipped,
      errors: results.errors
    };
    
    const outputPath = path.join(__dirname, '../docs/REMPLACEMENT_TICKERS_RESULT.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Résultats exportés dans: ${outputPath}`);
    
    return exportData;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter
if (import.meta.url === `file://${process.argv[1]}`) {
  replaceTickers()
    .then(() => {
      console.log('\n✅ Remplacement terminé');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { replaceTickers };
