/**
 * Global Real-time Sync for GOB Dashboard
 * 
 * Provides centralized Supabase Realtime subscription.
 * Dispatches 'tickersUpdated' event when changes occur in 'tickers' table.
 */
(function() {
    console.log('📡 Real-time Sync: Initializing...');

    // Retry mechanism for Supabase SDK
    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 500;

    const initRealtime = () => {
        // 1. Get Supabase Config
        const SUPABASE_URL = window.SUPABASE_URL || window.ENV_CONFIG?.SUPABASE_URL;
        const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || window.ENV_CONFIG?.SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('⚠️ Real-time Sync: Missing Supabase config. Skipping subscription.');
            return;
        }

        // Check for Supabase SDK - either on window.supabase or already created client
        const supabaseLib = window.supabase;
        
        // If SDK not available yet, retry
        if (!supabaseLib && !window.__SUPABASE__) {
            retryCount++;
            if (retryCount < maxRetries) {
                console.log('📡 Real-time Sync: Waiting for Supabase SDK... (attempt ' + retryCount + '/' + maxRetries + ')');
                setTimeout(initRealtime, retryDelay);
                return;
            } else {
                console.warn('⚠️ Real-time Sync: Supabase SDK not found after ' + maxRetries + ' attempts. Skipping.');
                return;
            }
        }

        // 2. Use global client if available, otherwise create one
        let supabase = window.__SUPABASE__;
        
        if (!supabase && supabaseLib && typeof supabaseLib.createClient === 'function') {
            try {
                supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                window.__SUPABASE__ = supabase;
                console.log('📡 Real-time Sync: Created and exposed global Supabase client');
            } catch (e) {
                console.error('❌ Real-time Sync: Failed to create Supabase client:', e);
                return;
            }
        }
        
        if (!supabase) {
            console.warn('⚠️ Real-time Sync: No Supabase client available. Skipping.');
            return;
        }

        // 3. Subscribe to Tickers
        try {
            const channel = supabase
                .channel('dashboard-realtime-tickers')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'tickers' }, 
                    (payload) => {
                        console.log('📡 Real-time Sync: Ticker update received!', payload);
                        
                        window.dispatchEvent(new CustomEvent('tickersUpdated', { 
                            detail: payload 
                        }));

                        if (window.Toast) {
                            const type = payload.eventType;
                            const ticker = payload.new?.ticker || payload.old?.ticker || 'Unknown';
                            const msg = type === 'INSERT' ? 'Nouveau ticker: ' + ticker :
                                        type === 'DELETE' ? 'Ticker supprimé: ' + ticker :
                                        'Ticker mis à jour: ' + ticker;
                            window.Toast.show(msg, 'info');
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('�� Real-time Sync: Subscription status:', status);
                });

            window.addEventListener('beforeunload', () => {
                try { supabase.removeChannel(channel); } catch(e) {}
            });
            
            console.log('✅ Real-time Sync: Subscription active');
        } catch (e) {
            console.error('❌ Real-time Sync: Subscription error:', e);
        }
    };

    // Start with a delay to allow Supabase SDK to load
    setTimeout(initRealtime, 1000);
})();
