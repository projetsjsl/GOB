/**
 * Global Real-time Sync for GOB Dashboard
 * 
 * Provides centralized Supabase Realtime subscription.
 * Uses event-based approach instead of polling.
 */
(function() {
    console.log('📡 Real-time Sync: Initializing...');

    function startRealtime(supabaseClient) {
        if (!supabaseClient) {
            console.warn('⚠️ Real-time Sync: No client provided');
            return;
        }

        try {
            const channel = supabaseClient
                .channel('dashboard-realtime-tickers')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'tickers' }, 
                    (payload) => {
                        console.log('�� Real-time Sync: Ticker update received!', payload);
                        
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
                    console.log('📡 Real-time Sync: Subscription status:', status);
                });

            window.addEventListener('beforeunload', () => {
                try { supabaseClient.removeChannel(channel); } catch(e) {}
            });
            
            console.log('✅ Real-time Sync: Subscription active');
        } catch (e) {
            console.error('❌ Real-time Sync: Subscription error:', e);
        }
    }

    function initRealtime() {
        // Check if client already exists
        const existingClient = window.__SUPABASE__;
        if (existingClient) {
            console.log('📡 Real-time Sync: Using existing global client');
            startRealtime(existingClient);
            return;
        }

        // Wait for supabase:ready event from app-inline.js
        console.log('📡 Real-time Sync: Waiting for supabase:ready event...');
        window.addEventListener('supabase:ready', (e) => {
            console.log('📡 Real-time Sync: Received supabase:ready event');
            const client = e.detail?.client || window.__SUPABASE__;
            if (client) {
                startRealtime(client);
            } else {
                console.warn('⚠️ Real-time Sync: Event received but no client found');
            }
        }, { once: true });

        // Fallback: check again after React mounts (dash:ready event)
        window.addEventListener('dash:ready', () => {
            if (!window.__SUPABASE__) {
                console.warn('⚠️ Real-time Sync: Dashboard ready but no Supabase client');
                return;
            }
            // Client might have been set after our listener was added
            startRealtime(window.__SUPABASE__);
        }, { once: true });
    }

    // Start initialization
    initRealtime();
})();
