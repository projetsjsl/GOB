/**
 * Global Real-time Sync for GOB Dashboard
 * 
 * Provides centralized Supabase Realtime subscription.
 * Dispatches 'tickersUpdated' event when changes occur in 'tickers' table.
 */
(function() {
    console.log('📡 Real-time Sync: Initializing...');

    // 1. Get Supabase Config
    const SUPABASE_URL = window.ENV_CONFIG?.SUPABASE_URL || window.SUPABASE_URL;
    const SUPABASE_ANON_KEY = window.ENV_CONFIG?.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('⚠️ Real-time Sync: Missing Supabase config. Skiping subscription.');
        return;
    }

    if (!window.supabase) {
        console.warn('⚠️ Real-time Sync: Supabase SDK not found. Skipping.');
        return;
    }

    // 2. Initialize Client (if not exists or create separate for realtime)
    // We create a dedicated client for realtime to avoid conflicts
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('📡 Real-time Sync: Client created.');

    // 3. Subscribe to Tickers
    const channel = supabase
        .channel('dashboard-realtime-tickers')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'tickers' }, 
            (payload) => {
                console.log('📡 Real-time Sync: Ticker update received!', payload);
                
                // Dispatch event for React app to handle
                window.dispatchEvent(new CustomEvent('tickersUpdated', { 
                    detail: payload 
                }));

                // Show toast notification
                if (window.Toast) {
                    const type = payload.eventType;
                    const ticker = payload.new?.ticker || payload.old?.ticker || 'Unknown';
                    const msg = type === 'INSERT' ? `Nouveau ticker: ${ticker}` :
                                type === 'DELETE' ? `Ticker supprimé: ${ticker}` :
                                `Ticker mis à jour: ${ticker}`;
                    window.Toast.show(msg, 'info');
                }
            }
        )
        .subscribe((status) => {
            console.log('📡 Real-time Sync: Subscription status:', status);
        });

    // Handle cleanup on unload
    window.addEventListener('beforeunload', () => {
        supabase.removeChannel(channel);
    });

})();
