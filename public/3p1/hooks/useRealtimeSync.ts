import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';

/**
 * Custom hook for Supabase Realtime subscriptions
 * Provides live sync across all connected users
 * 
 * ✅ OPTIMISATIONS:
 * - Utilise useRef pour éviter les closures stale
 * - Nettoyage correct des canaux même si le composant se démonte
 * - Évite les re-souscriptions inutiles
 * 
 * Usage:
 *   useRealtimeSync('tickers', (payload) => {
 *     if (payload.eventType === 'INSERT') addTicker(payload.new);
 *     if (payload.eventType === 'UPDATE') updateTicker(payload.new);
 *     if (payload.eventType === 'DELETE') removeTicker(payload.old.id);
 *   });
 */
export function useRealtimeSync(
  tableName: string,
  onDataChange: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: any;
    old: any;
  }) => void,
  options?: {
    schema?: string;
    filter?: string;
    enabled?: boolean;
  }
) {
  // ✅ FIX: Utiliser useRef pour éviter les closures stale
  const onDataChangeRef = useRef(onDataChange);
  
  // Mettre à jour la ref quand le callback change
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);
  
  useEffect(() => {
    if (options?.enabled === false) return;
    if (!supabase) {
      console.warn('Supabase not initialized, skipping realtime subscription');
      return;
    }

    const channelName = `realtime-${tableName}-${Date.now()}`;
    console.log(`📡 Subscribing to ${tableName} changes...`);

    let isMounted = true; // Flag pour éviter les mises à jour après démontage

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: options?.schema || 'public',
          table: tableName,
          filter: options?.filter,
        },
        (payload: any) => {
          // ✅ FIX: Vérifier que le composant est toujours monté
          if (!isMounted) return;
          
          console.log(`📡 [${tableName}] ${payload.eventType}:`, payload);
          // ✅ FIX: Utiliser la ref pour éviter les closures stale
          onDataChangeRef.current({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe((status) => {
        if (isMounted) {
          console.log(`📡 [${tableName}] Subscription status:`, status);
        }
      });

    return () => {
      isMounted = false; // Marquer comme démonté
      console.log(`🔌 Unsubscribing from ${tableName}`);
      // ✅ FIX: Nettoyage robuste du canal
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn(`⚠️ Error removing channel ${channelName}:`, error);
      }
    };
  }, [tableName, options?.schema, options?.filter, options?.enabled]);
}

/**
 * Hook to subscribe to multiple tables at once
 */
export function useMultiTableSync(
  tables: Array<{
    table: string;
    onInsert?: (data: any) => void;
    onUpdate?: (data: any) => void;
    onDelete?: (data: any) => void;
  }>
) {
  useEffect(() => {
    if (!supabase) return;

    const channels = tables.map(({ table, onInsert, onUpdate, onDelete }) => {
      const channel = supabase
        .channel(`multi-sync-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload: any) => {
            if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new);
            if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new);
            if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old);
          }
        )
        .subscribe();
      
      return channel;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [tables]);
}

export default useRealtimeSync;
