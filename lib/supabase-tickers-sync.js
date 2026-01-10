/**
 * Service de synchronisation bidirectionnelle entre:
 * - user_preferences (dashboard) ↔ tickers table (3p1)
 * - Team tickers (portefeuille)
 * 
 * Ce service assure que les tickers sont synchronisés entre:
 * 1. Dashboard Watchlist (user_preferences avec app_name='watchlist')
 * 2. 3p1 Application (tickers table avec source='watchlist')
 * 3. Team Tickers (tickers table avec source='team')
 */

// Helper to get Supabase client
function getSupabaseClient() {
    // Côté client (window.supabase)
    if (typeof window !== 'undefined' && window.supabase) {
        return window.supabase;
    }
    
    // Côté serveur (API routes)
    if (typeof process !== 'undefined' && process.env) {
        const { createSupabaseClient } = require('./supabase-config.js');
        return createSupabaseClient(false); // Use anon key for RLS
    }
    
    return null;
}

// Helper to get current user ID
async function getCurrentUserId() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    } catch (e) {
        console.warn('Error getting current user:', e);
        return null;
    }
}

/**
 * Synchronise la watchlist depuis user_preferences vers tickers table
 * @param {string} userId - ID utilisateur
 * @param {string[]} tickers - Liste de tickers depuis user_preferences
 * @returns {Promise<boolean>} true si succès
 */
export async function syncWatchlistToTickersTable(userId, tickers) {
    if (!userId || !Array.isArray(tickers)) return false;
    
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.warn('Supabase client not available for sync');
        return false;
    }
    
    try {
        // Pour chaque ticker, créer/mettre à jour dans tickers table avec source='watchlist'
        const operations = tickers.map(async (ticker) => {
            const tickerUpper = ticker.toUpperCase().trim();
            
            // Vérifier si le ticker existe déjà
            const { data: existing } = await supabase
                .from('tickers')
                .select('id, ticker, source, category')
                .eq('ticker', tickerUpper)
                .single();
            
            if (existing) {
                // Mettre à jour si nécessaire
                const currentSource = existing.source || existing.category;
                const shouldUpdate = 
                    currentSource !== 'watchlist' && 
                    currentSource !== 'both';
                
                if (shouldUpdate) {
                    // Si c'est 'team', passer à 'both', sinon 'watchlist'
                    const newSource = currentSource === 'team' ? 'both' : 'watchlist';
                    
                    await supabase
                        .from('tickers')
                        .update({
                            source: newSource,
                            category: newSource, // Compatibilité nouveau schéma
                            user_id: userId,
                            is_active: true,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existing.id);
                }
            } else {
                // Créer nouveau ticker
                await supabase
                    .from('tickers')
                    .insert({
                        ticker: tickerUpper,
                        source: 'watchlist',
                        category: 'watchlist', // Compatibilité nouveau schéma
                        user_id: userId,
                        is_active: true,
                        priority: 1
                    });
            }
        });
        
        await Promise.allSettled(operations);
        console.log(`✅ Synced ${tickers.length} watchlist tickers to tickers table`);
        return true;
    } catch (e) {
        console.error('Error syncing watchlist to tickers table:', e);
        return false;
    }
}

/**
 * Synchronise la watchlist depuis tickers table vers user_preferences
 * @param {string} userId - ID utilisateur
 * @returns {Promise<string[]|null>} Liste de tickers ou null si erreur
 */
export async function syncTickersTableToWatchlist(userId) {
    if (!userId) return null;
    
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.warn('Supabase client not available for sync');
        return null;
    }
    
    try {
        // Charger tous les tickers avec source='watchlist' ou 'both' pour cet utilisateur
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, source, category')
            .eq('is_active', true)
            .eq('user_id', userId)
            .or('source.eq.watchlist,source.eq.both,category.eq.watchlist,category.eq.both');
        
        if (error) {
            // Essayer avec category si source échoue
            const { data: dataCategory } = await supabase
                .from('tickers')
                .select('ticker, category')
                .eq('is_active', true)
                .eq('user_id', userId)
                .or('category.eq.watchlist,category.eq.both');
            
            if (dataCategory) {
                const tickers = dataCategory.map(t => t.ticker.toUpperCase());
                return tickers;
            }
            
            throw error;
        }
        
        const tickers = (data || []).map(t => t.ticker.toUpperCase());
        
        // Sauvegarder dans user_preferences via UserPreferencesService
        if (typeof window !== 'undefined' && window.UserPreferencesService) {
            await window.UserPreferencesService.savePreferencesWithFallback(
                'watchlist',
                'dans-watchlist',
                { tickers }
            );
        }
        
        console.log(`✅ Synced ${tickers.length} tickers from tickers table to user_preferences`);
        return tickers;
    } catch (e) {
        console.error('Error syncing tickers table to watchlist:', e);
        return null;
    }
}

/**
 * Synchronisation bidirectionnelle complète
 * @param {string} userId - ID utilisateur
 * @returns {Promise<{success: boolean, tickers: string[]}>}
 */
export async function syncBidirectional(userId) {
    if (!userId) {
        userId = await getCurrentUserId();
    }
    
    if (!userId) {
        console.warn('No user ID for bidirectional sync');
        return { success: false, tickers: [] };
    }
    
    try {
        // 1. Charger depuis user_preferences
        let prefsTickers = [];
        if (typeof window !== 'undefined' && window.UserPreferencesService) {
            const prefs = await window.UserPreferencesService.loadPreferencesWithFallback(
                'watchlist',
                'dans-watchlist',
                { tickers: [] }
            );
            prefsTickers = Array.isArray(prefs.tickers) ? prefs.tickers : [];
        }
        
        // 2. Charger depuis tickers table
        const tableTickers = await syncTickersTableToWatchlist(userId);
        
        // 3. Merger les deux (union, pas de doublons)
        const mergedTickers = Array.from(new Set([
            ...prefsTickers.map(t => t.toUpperCase()),
            ...(tableTickers || []).map(t => t.toUpperCase())
        ]));
        
        // 4. Synchroniser vers tickers table
        await syncWatchlistToTickersTable(userId, mergedTickers);
        
        // 5. Synchroniser vers user_preferences
        if (typeof window !== 'undefined' && window.UserPreferencesService) {
            await window.UserPreferencesService.savePreferencesWithFallback(
                'watchlist',
                'dans-watchlist',
                { tickers: mergedTickers }
            );
        }
        
        console.log(`✅ Bidirectional sync complete: ${mergedTickers.length} tickers`);
        return { success: true, tickers: mergedTickers };
    } catch (e) {
        console.error('Error bidirectional sync:', e);
        return { success: false, tickers: [] };
    }
}

/**
 * Charger les team tickers (portefeuille)
 * @returns {Promise<string[]>} Liste de tickers team
 */
export async function loadTeamTickers() {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    
    try {
        // Essayer avec source d'abord
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .or('source.eq.team,source.eq.both');
        
        if (error) {
            // Fallback avec category
            const { data: dataCategory } = await supabase
                .from('tickers')
                .select('ticker')
                .eq('is_active', true)
                .or('category.eq.team,category.eq.both');
            
            if (dataCategory) {
                return dataCategory.map(t => t.ticker.toUpperCase());
            }
            
            throw error;
        }
        
        return (data || []).map(t => t.ticker.toUpperCase());
    } catch (e) {
        console.error('Error loading team tickers:', e);
        return [];
    }
}

/**
 * Ajouter un ticker à la watchlist (synchronisé)
 * @param {string} ticker - Ticker à ajouter
 * @param {string} userId - ID utilisateur
 * @returns {Promise<boolean>} true si succès
 */
export async function addTickerToWatchlist(ticker, userId = null) {
    if (!ticker) return false;
    
    if (!userId) {
        userId = await getCurrentUserId();
    }
    
    if (!userId) {
        console.warn('No user ID for adding ticker');
        return false;
    }
    
    const tickerUpper = ticker.toUpperCase().trim();
    
    // 1. Ajouter dans user_preferences
    if (typeof window !== 'undefined' && window.UserPreferencesService) {
        const prefs = await window.UserPreferencesService.loadPreferencesWithFallback(
            'watchlist',
            'dans-watchlist',
            { tickers: [] }
        );
        
        const currentTickers = Array.isArray(prefs.tickers) ? prefs.tickers : [];
        if (!currentTickers.includes(tickerUpper)) {
            const updatedTickers = [...currentTickers, tickerUpper];
            await window.UserPreferencesService.savePreferencesWithFallback(
                'watchlist',
                'dans-watchlist',
                { tickers: updatedTickers }
            );
        }
    }
    
    // 2. Ajouter dans tickers table
    await syncWatchlistToTickersTable(userId, [tickerUpper]);
    
    return true;
}

/**
 * Supprimer un ticker de la watchlist (synchronisé)
 * @param {string} ticker - Ticker à supprimer
 * @param {string} userId - ID utilisateur
 * @returns {Promise<boolean>} true si succès
 */
export async function removeTickerFromWatchlist(ticker, userId = null) {
    if (!ticker) return false;
    
    if (!userId) {
        userId = await getCurrentUserId();
    }
    
    if (!userId) {
        console.warn('No user ID for removing ticker');
        return false;
    }
    
    const tickerUpper = ticker.toUpperCase().trim();
    const supabase = getSupabaseClient();
    
    // 1. Retirer de user_preferences
    if (typeof window !== 'undefined' && window.UserPreferencesService) {
        const prefs = await window.UserPreferencesService.loadPreferencesWithFallback(
            'watchlist',
            'dans-watchlist',
            { tickers: [] }
        );
        
        const currentTickers = Array.isArray(prefs.tickers) ? prefs.tickers : [];
        const updatedTickers = currentTickers.filter(t => t !== tickerUpper);
        
        await window.UserPreferencesService.savePreferencesWithFallback(
            'watchlist',
            'dans-watchlist',
            { tickers: updatedTickers }
        );
    }
    
    // 2. Mettre à jour tickers table
    if (supabase) {
        try {
            // Trouver le ticker
            const { data: existing } = await supabase
                .from('tickers')
                .select('id, source, category')
                .eq('ticker', tickerUpper)
                .eq('user_id', userId)
                .single();
            
            if (existing) {
                const currentSource = existing.source || existing.category;
                
                if (currentSource === 'both') {
                    // Si 'both', passer à 'team' seulement
                    await supabase
                        .from('tickers')
                        .update({
                            source: 'team',
                            category: 'team',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existing.id);
                } else if (currentSource === 'watchlist') {
                    // Si 'watchlist' seulement, désactiver ou supprimer
                    await supabase
                        .from('tickers')
                        .update({
                            is_active: false,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existing.id);
                }
            }
        } catch (e) {
            console.error('Error updating tickers table:', e);
        }
    }
    
    return true;
}

// Export pour utilisation dans le navigateur
if (typeof window !== 'undefined') {
    window.TickersSyncService = {
        syncWatchlistToTickersTable,
        syncTickersTableToWatchlist,
        syncBidirectional,
        loadTeamTickers,
        addTickerToWatchlist,
        removeTickerFromWatchlist
    };
}
