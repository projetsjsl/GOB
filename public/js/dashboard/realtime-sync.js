/**
 * Global Real-time Sync for GOB Dashboard
 * Uses event-based + polling hybrid approach
 */
(function() {
    if (window.__realtimeSyncInitialized) {
        return;
    }
    window.__realtimeSyncInitialized = true;

    console.log('📡 Real-time Sync: Initializing...');

    let isConnected = false;
    let sawClient = false;

    function startRealtime(supabaseClient) {
        if (!supabaseClient || isConnected) return;
        isConnected = true;

        try {
            const channel = supabaseClient
                .channel('dashboard-realtime-tickers')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'tickers' }, 
                    (payload) => {
                        console.log('📡 Real-time Sync: Ticker update received!', payload);
                        window.dispatchEvent(new CustomEvent('tickersUpdated', { detail: payload }));
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

            window.addEventListener('beforeunload', () => {
                try { supabaseClient.removeChannel(channel); } catch(e) {}
            });
            
            console.log('✅ Real-time Sync: Subscription active');
        } catch (e) {
            console.error('❌ Real-time Sync: Subscription error:', e);
            isConnected = false;
        }
    }

    function checkAndConnect() {
        if (isConnected) return;
        
        const client = window.__SUPABASE__;
        if (client) {
            sawClient = true;
            console.log('📡 Real-time Sync: Found global Supabase client');
            startRealtime(client);
        }
    }

    // Listen for supabase:ready event
    window.addEventListener('supabase:ready', (e) => {
        console.log('📡 Real-time Sync: Received supabase:ready event');
        const client = e.detail?.client || window.__SUPABASE__;
        if (client) startRealtime(client);
    });

    // Also check periodically in case event was missed
    const checkInterval = setInterval(() => {
        if (isConnected) {
            clearInterval(checkInterval);
            return;
        }
        checkAndConnect();
    }, 1000);

    // Stop checking after 30 seconds
    setTimeout(() => {
        clearInterval(checkInterval);
        if (!isConnected) {
            if (sawClient) {
                console.warn('⚠️ Real-time Sync: Could not connect after 30s');
            } else {
                console.log('ℹ️ Real-time Sync disabled (no Supabase client)');
            }
        }
    }, 30000);

    // Initial check
    checkAndConnect();
})();
