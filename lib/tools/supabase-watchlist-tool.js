/**
 * Supabase Watchlist Tool
 * Lecture de la watchlist Dan depuis Supabase
 */

import BaseTool from './base-tool.js';

export default class SupabaseWatchlistTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Supabase Watchlist';
        this.description = 'Lecture de la watchlist Dan depuis Supabase';
    }

    async execute(params, context = {}) {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Supabase configuration missing');
            }

            // Appel à l'API Supabase pour récupérer la watchlist depuis la table unifiée
            const response = await this.makeApiCall(
                `${supabaseUrl}/rest/v1/tickers?select=*&is_active=eq.true&or=(source.eq.watchlist,source.eq.both)&order=ticker.asc`,
                {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    }
                }
            );

            if (!response || response.length === 0) {
                // Si pas de données dans Supabase, retourner la liste hardcodée comme fallback
                const fallbackWatchlist = [
                    'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                    'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                    'TRP', 'UNH', 'UL', 'VZ', 'WFC'
                ];
                
                return this.formatResult({
                    tickers: fallbackWatchlist,
                    count: fallbackWatchlist.length,
                    source: 'fallback_hardcoded',
                    note: 'Données de fallback - Supabase vide'
                }, false, {
                    source: 'fallback',
                    data_type: 'watchlist_tickers'
                });
            }

            const formattedData = {
                tickers: response.map(item => item.ticker),
                count: response.length,
                last_updated: response[0]?.updated_at || new Date().toISOString(),
                source: 'supabase'
            };

            return this.formatResult(formattedData, true, {
                source: 'supabase',
                data_type: 'watchlist_tickers'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }
}
