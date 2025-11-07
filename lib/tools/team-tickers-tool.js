/**
 * Team Tickers Tool
 * Lecture des tickers d'équipe depuis Supabase
 */

import BaseTool from './base-tool.js';

export default class TeamTickersTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Team Tickers';
        this.description = 'Lecture des tickers d\'équipe depuis Supabase';
    }

    async execute(params, context = {}) {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Supabase configuration missing');
            }

            // Appel à l'API Supabase pour récupérer les tickers d'équipe depuis la table unifiée
            const response = await this.makeApiCall(
                `${supabaseUrl}/rest/v1/tickers?select=*&is_active=eq.true&or=(source.eq.team,source.eq.both)&order=priority.desc,ticker.asc`,
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
                const fallbackTickers = [
                    'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                    'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                    'TRP', 'UNH', 'UL', 'VZ', 'WFC'
                ];
                
                return this.formatResult({
                    tickers: fallbackTickers,
                    count: fallbackTickers.length,
                    source: 'fallback_hardcoded',
                    note: 'Données de fallback - Supabase vide'
                }, false, {
                    source: 'fallback',
                    data_type: 'team_tickers'
                });
            }

            const formattedData = {
                tickers: response.map(item => item.ticker),
                count: response.length,
                priority_ordered: response.map(item => ({
                    ticker: item.ticker,
                    priority: item.priority,
                    added_at: item.added_at
                })),
                last_updated: response[0]?.added_at || new Date().toISOString(),
                source: 'supabase'
            };

            return this.formatResult(formattedData, true, {
                source: 'supabase',
                data_type: 'team_tickers'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }
}
