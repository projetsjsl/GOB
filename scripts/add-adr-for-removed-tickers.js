/**
 * Script pour ajouter les ADR américains pour les entreprises supprimées
 * Recherche les ADR disponibles pour les principales entreprises canadiennes
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://boyuxgdplbpkknplxbxp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXV4Z2RwbGJwa2tucGx4YnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzU5MTQsImV4cCI6MjA3NTkxMTkxNH0.-M-QdpBFlDtg1CeA00VepQCNzGzvU-tISyVA0yCLBdw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mapping des principales entreprises canadiennes vers leurs ADR
// Basé sur les tickers supprimés (.L, .MX, .ST, .HK, .DE, .F, .KQ)
const ADR_MAPPING = [
  // Entreprises canadiennes majeures avec ADR
  { original: 'SHOP', adr: 'SHOP', exchange: 'NYSE', name: 'Shopify Inc.', country: 'CA', sector: 'Technology' },
  { original: 'ENB', adr: 'ENB', exchange: 'NYSE', name: 'Enbridge Inc.', country: 'CA', sector: 'Energy' },
  { original: 'RY', adr: 'RY', exchange: 'NYSE', name: 'Royal Bank of Canada', country: 'CA', sector: 'Financial Services' },
  { original: 'TD', adr: 'TD', exchange: 'NYSE', name: 'The Toronto-Dominion Bank', country: 'CA', sector: 'Financial Services' },
  { original: 'BMO', adr: 'BMO', exchange: 'NYSE', name: 'Bank of Montreal', country: 'CA', sector: 'Financial Services' },
  { original: 'BNS', adr: 'BNS', exchange: 'NYSE', name: 'The Bank of Nova Scotia', country: 'CA', sector: 'Financial Services' },
  { original: 'MFC', adr: 'MFC', exchange: 'NYSE', name: 'Manulife Financial Corporation', country: 'CA', sector: 'Financial Services' },
  { original: 'SLF', adr: 'SLF', exchange: 'NYSE', name: 'Sun Life Financial Inc.', country: 'CA', sector: 'Financial Services' },
  { original: 'NTR', adr: 'NTR', exchange: 'NYSE', name: 'Nutrien Ltd.', country: 'CA', sector: 'Basic Materials' },
  { original: 'FNV', adr: 'FNV', exchange: 'NYSE', name: 'Franco-Nevada Corporation', country: 'CA', sector: 'Basic Materials' },
  { original: 'AEM', adr: 'AEM', exchange: 'NYSE', name: 'Agnico Eagle Mines Limited', country: 'CA', sector: 'Basic Materials' },
  { original: 'CCJ', adr: 'CCJ', exchange: 'NYSE', name: 'Cameco Corporation', country: 'CA', sector: 'Energy' },
  { original: 'LULU', adr: 'LULU', exchange: 'NASDAQ', name: 'Lululemon Athletica Inc.', country: 'CA', sector: 'Consumer Cyclical' },
  { original: 'QSR', adr: 'QSR', exchange: 'NYSE', name: 'Restaurant Brands International Inc.', country: 'CA', sector: 'Consumer Cyclical' },
  { original: 'WPM', adr: 'WPM', exchange: 'NYSE', name: 'Wheaton Precious Metals Corp.', country: 'CA', sector: 'Basic Materials' },
  { original: 'K', adr: 'K', exchange: 'NYSE', name: 'Kinross Gold Corporation', country: 'CA', sector: 'Basic Materials' },
  { original: 'CGI', adr: 'GIB', exchange: 'NYSE', name: 'CGI Inc.', country: 'CA', sector: 'Technology' },
];

async function addADRTickers() {
  console.log('🔍 Recherche et ajout des ADR américains...\n');
  
  try {
    const added = [];
    const skipped = [];
    
    for (const mapping of ADR_MAPPING) {
      // Vérifier si l'ADR existe déjà
      const { data: existing } = await supabase
        .from('tickers')
        .select('ticker, is_active')
        .eq('ticker', mapping.adr)
        .single();
      
      if (existing) {
        if (existing.is_active) {
          skipped.push({ ticker: mapping.adr, reason: 'Déjà actif' });
          continue;
        } else {
          // Réactiver si désactivé
          const { error } = await supabase
            .from('tickers')
            .update({
              is_active: true,
              company_name: mapping.name,
              country: mapping.country,
              exchange: mapping.exchange,
              sector: mapping.sector,
              source: 'manual',
              updated_at: new Date().toISOString()
            })
            .eq('ticker', mapping.adr);
          
          if (error) {
            console.error(`❌ Erreur réactivation ${mapping.adr}:`, error.message);
            continue;
          }
          
          added.push({ ticker: mapping.adr, action: 'Réactivé', original: mapping.original });
          console.log(`✅ ${mapping.adr} réactivé (remplace ${mapping.original})`);
          continue;
        }
      }
      
      // Ajouter le nouvel ADR
      const { error } = await supabase
        .from('tickers')
        .insert({
          ticker: mapping.adr,
          company_name: mapping.name,
          country: mapping.country,
          exchange: mapping.exchange,
          sector: mapping.sector,
          source: 'manual',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`❌ Erreur ajout ${mapping.adr}:`, error.message);
        continue;
      }
      
      added.push({ ticker: mapping.adr, action: 'Ajouté', original: mapping.original });
      console.log(`✅ ${mapping.adr} ajouté (remplace ${mapping.original})`);
    }
    
    console.log(`\n📊 Résumé:`);
    console.log(`  ✅ Ajoutés/Réactivés: ${added.length}`);
    console.log(`  ⏭️  Déjà actifs: ${skipped.length}`);
    
    return { added, skipped };
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  addADRTickers()
    .then(() => {
      console.log('\n✅ Terminé');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { addADRTickers };
