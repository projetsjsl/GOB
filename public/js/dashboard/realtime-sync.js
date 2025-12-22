/**
 * Global Real-time Sync for GOB Dashboard
 * 
 * Provides centralized Supabase Realtime subscription.
 * Dispatches 'tickersUpdated' event when changes occur in 'tickers' table.
 */
(function() {
    console.log('📡 Real-time Sync: Initializing...');

    // Wait for global Supabase client
    const initRealtime = () => {
        // 1. Get Supabase Config
        const SUPABASE_URL = window.SUPABASE_URL || window.ENV_CONFIG?.SUPABASE_URL;
        const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || window.ENV_CONFIG?.SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('⚠️ Real-time Sync: Missing Supabase config. Skipping subscription.');
            return;
        }

        // Check for Supabase SDK
        const supabaseLib = window.supabase;
        if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
            console.warn('⚠️ Real-time Sync: Supabase SDK not available. Skipping.');
            return;
        }

        // 2. Use global client if available, otherwise create one
        let supabase = window.__SUPABASE__;
        
        if (!supabase) {
            try {
                supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                window.__SUPABASE__ = supabase; // Expose globally for other scripts
                console.log('📡 Real-time Sync: Created and exposed global Supabase client');
            } catch (e) {
                console.error('❌ Real-time Sync: Failed to create Supabase client:', e);
                return;
            }
        } else {
            console.log('📡 Real-time Sync: Using existing global Supabase client');
        }

        // 3. Subscribe to Tickers
        try {
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
                            const msg = type === 'INSERT' ? 'Nouveau ticker: ' + ticker :
                                        type === 'DELETE' ? 'Ticker supprimé: ' + ticker :
                                        'Ticker mis à jour: ' + ticker;
                            window.Toast.show(msg, 'info');
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('📡 Real-time Sync: Subscription status:', status);
                });

            // Handle cleanup on unload
            window.addEventListener('beforeunload', () => {
                try { supabase.removeChannel(channel); } catch(e) {}
            });
            
            console.log('✅ Real-time Sync: Subscription active');
        } catch (e) {
            console.error('❌ Real-time Sync: Subscription error:', e);
        }
    };

    // Try to init after a short delay to ensure Supabase SDK is loaded
    if (window.supabase) {
        initRealtime();
    } else {
        // Wait for SDK to load
        setTimeout(initRealtime, 500);
    }
})();
