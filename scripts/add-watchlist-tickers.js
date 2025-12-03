/**
 * Script pour ajouter tous les tickers à la watchlist Supabase
 * Utilise l'API /api/admin/tickers pour ajouter les tickers
 * 
 * Usage: node scripts/add-watchlist-tickers.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Liste complète des tickers avec leurs informations
const TICKERS_TO_ADD = [
    // Tech US
    { ticker: 'AAPL', company_name: 'Apple Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'MSFT', company_name: 'Microsoft Corporation', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'AMZN', company_name: 'Amazon.com Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'GOOGL', company_name: 'Alphabet Inc. (Google)', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'META', company_name: 'Meta Platforms Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'TSLA', company_name: 'Tesla Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'NVDA', company_name: 'NVIDIA Corporation', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'AMD', company_name: 'Advanced Micro Devices', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'QCOM', company_name: 'Qualcomm Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'CSCO', company_name: 'Cisco Systems Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'ORCL', company_name: 'Oracle Corporation', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'CRM', company_name: 'Salesforce Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'ADBE', company_name: 'Adobe Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'NOW', company_name: 'ServiceNow Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'SNOW', company_name: 'Snowflake Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'SHOP', company_name: 'Shopify Inc.', country: 'Canada', exchange: 'TSX', currency: 'USD' },
    { ticker: 'ZM', company_name: 'Zoom Video Communications', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'NFLX', company_name: 'Netflix Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'INTC', company_name: 'Intel Corporation', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    
    // Finance US
    { ticker: 'BRK.B', company_name: 'Berkshire Hathaway Inc. (Class B)', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'JPM', company_name: 'JPMorgan Chase & Co.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'BAC', company_name: 'Bank of America Corp.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'WFC', company_name: 'Wells Fargo & Company', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'C', company_name: 'Citigroup Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'GS', company_name: 'Goldman Sachs Group Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'MS', company_name: 'Morgan Stanley', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'V', company_name: 'Visa Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'MA', company_name: 'Mastercard Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'PYPL', company_name: 'PayPal Holdings Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'AXP', company_name: 'American Express Co.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    
    // Healthcare US
    { ticker: 'JNJ', company_name: 'Johnson & Johnson', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'PFE', company_name: 'Pfizer Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'MRK', company_name: 'Merck & Co. Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'BMY', company_name: 'Bristol Myers Squibb Co.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'LLY', company_name: 'Eli Lilly and Company', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'ABBV', company_name: 'AbbVie Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'UNH', company_name: 'UnitedHealth Group Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'ELV', company_name: 'Elevance Health Inc. (ex-Anthem)', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'CVS', company_name: 'CVS Health Corporation', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'WBA', company_name: 'Walgreens Boots Alliance Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    
    // Consumer Goods US
    { ticker: 'PG', company_name: 'Procter & Gamble Co.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'KO', company_name: 'The Coca-Cola Company', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'PEP', company_name: 'PepsiCo Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'MDLZ', company_name: 'Mondelez International Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'NSRGY', company_name: 'Nestlé S.A. (ADR)', country: 'Switzerland', exchange: 'OTC', currency: 'USD' },
    { ticker: 'DANOY', company_name: 'Danone S.A. (ADR)', country: 'France', exchange: 'OTC', currency: 'USD' },
    { ticker: 'LRLCY', company_name: 'L\'Oréal S.A. (ADR)', country: 'France', exchange: 'OTC', currency: 'USD' },
    { ticker: 'UL', company_name: 'Unilever PLC', country: 'United Kingdom', exchange: 'NYSE', currency: 'USD' },
    
    // Retail US
    { ticker: 'WMT', company_name: 'Walmart Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'COST', company_name: 'Costco Wholesale Corporation', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    { ticker: 'TGT', company_name: 'Target Corporation', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'HD', company_name: 'The Home Depot Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'LOW', company_name: 'Lowe\'s Companies Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'BBY', company_name: 'Best Buy Co. Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    
    // Apparel US
    { ticker: 'NKE', company_name: 'Nike Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'ADDYY', company_name: 'Adidas AG (ADR)', country: 'Germany', exchange: 'OTC', currency: 'USD' },
    { ticker: 'GPS', company_name: 'Gap Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'VFC', company_name: 'VF Corporation', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    
    // Media & Entertainment US
    { ticker: 'DIS', company_name: 'The Walt Disney Company', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'CMCSA', company_name: 'Comcast Corporation', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    
    // Telecom US
    { ticker: 'T', company_name: 'AT&T Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'VZ', company_name: 'Verizon Communications Inc.', country: 'United States', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'TMUS', company_name: 'T-Mobile US Inc.', country: 'United States', exchange: 'NASDAQ', currency: 'USD' },
    
    // Software International
    { ticker: 'SAP', company_name: 'SAP SE', country: 'Germany', exchange: 'XETR', currency: 'EUR' },
    
    // Canada - Finance
    { ticker: 'IFC', company_name: 'Intact Financial Corporation', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'POW', company_name: 'Power Corporation of Canada', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'MFC', company_name: 'Manulife Financial Corporation', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'SLF', company_name: 'Sun Life Financial Inc.', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'GWO', company_name: 'Great-West Lifeco Inc.', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    
    // Canada - Industrials
    { ticker: 'CNR', company_name: 'Canadian National Railway Company', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'CP', company_name: 'Canadian Pacific Kansas City Limited', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    
    // Canada - Airlines
    { ticker: 'AC', company_name: 'Air Canada', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'WJA', company_name: 'WestJet Airlines Ltd. (delistée)', country: 'Canada', exchange: 'TSX', currency: 'CAD', is_active: false },
    
    // Canada - Aerospace
    { ticker: 'BBD.B', company_name: 'Bombardier Inc. (Class B)', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    
    // Canada - Tech
    { ticker: 'GIB.A', company_name: 'CGI Inc. (Class A)', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    
    // Canada - Retail
    { ticker: 'ATD.B', company_name: 'Alimentation Couche-Tard Inc. (Class B)', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'L', company_name: 'Loblaw Companies Limited', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'MRU', company_name: 'Metro Inc.', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    // Note: Saputo Inc. utilise le ticker SAP qui est déjà pris par SAP SE (Allemagne)
    // Si nécessaire, utiliser un ticker alternatif ou une notation différente
    { ticker: 'DOL', company_name: 'Dollarama Inc.', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    
    // Canada - Mining
    { ticker: 'RIO', company_name: 'Rio Tinto Group', country: 'United Kingdom', exchange: 'NYSE', currency: 'USD' },
    { ticker: 'ABX', company_name: 'Barrick Gold Corporation', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'TECK.B', company_name: 'Teck Resources Limited (Class B)', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    
    // Canada - Energy
    { ticker: 'SU', company_name: 'Suncor Energy Inc.', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'CNQ', company_name: 'Canadian Natural Resources Limited', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'IMO', company_name: 'Imperial Oil Limited', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    
    // Canada - Pipelines
    { ticker: 'ENB', company_name: 'Enbridge Inc.', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'TRP', company_name: 'TC Energy Corporation', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'PPL', company_name: 'Pembina Pipeline Corporation', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    
    // Canada - Utilities
    { ticker: 'AQN', company_name: 'Algonquin Power & Utilities Corp.', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'H', company_name: 'Hydro One Limited', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'FTS', company_name: 'Fortis Inc.', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'EMA', company_name: 'Emera Incorporated', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    
    // Canada - Telecom
    { ticker: 'RCI.B', company_name: 'Rogers Communications Inc. (Class B)', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    { ticker: 'BCE', company_name: 'BCE Inc.', country: 'Canada', exchange: 'TSX', currency: 'CAD' },
    // Note: TELUS Corporation utilise le ticker T qui est déjà pris par AT&T (US)
    // TELUS peut être ajouté avec un ticker alternatif si nécessaire (ex: TU.TO)
    
    // Canada - Media
    { ticker: 'CCA', company_name: 'Cogeco Communications Inc.', country: 'Canada', exchange: 'TSX', currency: 'CAD' }
];

async function addTickersToWatchlist() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables d\'environnement Supabase manquantes');
        console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
        console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 Vérification des tickers existants...\n');

    // Récupérer tous les tickers existants
    const { data: existingTickers, error: fetchError } = await supabase
        .from('tickers')
        .select('ticker, source, is_active');

    if (fetchError) {
        console.error('❌ Erreur lors de la récupération des tickers:', fetchError);
        process.exit(1);
    }

    const existingTickerMap = new Map();
    existingTickers?.forEach(t => {
        existingTickerMap.set(t.ticker.toUpperCase(), t);
    });

    console.log(`✅ ${existingTickerMap.size} tickers existants trouvés\n`);

    let added = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    console.log(`🔄 Ajout de ${TICKERS_TO_ADD.length} tickers à la watchlist...\n`);

    for (const tickerData of TICKERS_TO_ADD) {
        const tickerUpper = tickerData.ticker.toUpperCase();
        const existing = existingTickerMap.get(tickerUpper);

        try {
            if (existing) {
                // Ticker existe déjà - déterminer la nouvelle source
                let newSource = 'watchlist';
                if (existing.source === 'team') {
                    newSource = 'both';
                } else if (existing.source === 'both') {
                    newSource = 'both';
                } else if (existing.source === 'watchlist') {
                    newSource = 'watchlist';
                }

                // Mettre à jour le ticker
                const { data, error } = await supabase
                    .from('tickers')
                    .update({
                        source: newSource,
                        company_name: tickerData.company_name || existing.company_name,
                        country: tickerData.country || existing.country,
                        exchange: tickerData.exchange || existing.exchange,
                        currency: tickerData.currency || existing.currency,
                        is_active: tickerData.is_active !== undefined ? tickerData.is_active : existing.is_active,
                        updated_at: new Date().toISOString()
                    })
                    .eq('ticker', tickerUpper)
                    .select()
                    .single();

                if (error) {
                    console.error(`❌ Erreur mise à jour ${tickerUpper}:`, error.message);
                    errors++;
                } else {
                    console.log(`🔄 ${tickerUpper} mis à jour: ${existing.source} → ${newSource}`);
                    updated++;
                }
            } else {
                // Nouveau ticker - l'ajouter
                const { data, error } = await supabase
                    .from('tickers')
                    .insert({
                        ticker: tickerUpper,
                        company_name: tickerData.company_name,
                        country: tickerData.country,
                        exchange: tickerData.exchange,
                        currency: tickerData.currency || 'USD',
                        source: 'watchlist',
                        is_active: tickerData.is_active !== undefined ? tickerData.is_active : true,
                        priority: 1
                    })
                    .select()
                    .single();

                if (error) {
                    console.error(`❌ Erreur ajout ${tickerUpper}:`, error.message);
                    errors++;
                } else {
                    console.log(`✅ ${tickerUpper} ajouté`);
                    added++;
                }
            }
        } catch (error) {
            console.error(`❌ Erreur inattendue pour ${tickerUpper}:`, error.message);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`✅ Tickers ajoutés: ${added}`);
    console.log(`🔄 Tickers mis à jour: ${updated}`);
    console.log(`⏭️  Tickers ignorés: ${skipped}`);
    console.log(`❌ Erreurs: ${errors}`);
    console.log(`📈 Total traité: ${added + updated + skipped + errors}/${TICKERS_TO_ADD.length}`);

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const { data: finalCheck, error: checkError } = await supabase
        .from('tickers')
        .select('ticker, source, is_active')
        .in('ticker', TICKERS_TO_ADD.map(t => t.ticker.toUpperCase()));

    if (!checkError && finalCheck) {
        const watchlistCount = finalCheck.filter(t => t.source === 'watchlist' || t.source === 'both').length;
        const activeCount = finalCheck.filter(t => t.is_active).length;
        console.log(`✅ ${watchlistCount} tickers dans la watchlist (${activeCount} actifs)`);
    }
}

// Exécuter le script
addTickersToWatchlist()
    .then(() => {
        console.log('\n✅ Script terminé avec succès');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    });

